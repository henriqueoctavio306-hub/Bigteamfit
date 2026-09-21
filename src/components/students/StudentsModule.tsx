import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, Pencil, Plus, Search, UserX, Camera, MessageSquare, Save } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

type StudentRow = Database["public"]["Tables"]["students"]["Row"] & {
  plans: Database["public"]["Tables"]["plans"]["Row"] | null;
};
type StudentFilter = "todos" | "ativo" | "vencendo" | "vencido" | "inativo";

const studentSchema = z.object({
  full_name: z.string().trim().min(2, "Informe o nome completo.").max(120),
  email: z.string().trim().email("Informe um e-mail válido.").max(255),
  phone: z.string().trim().min(8, "Informe um telefone válido.").max(30),
  birth_date: z.string().min(1, "Informe a data de nascimento."),
  sex: z.enum(["feminino", "masculino", "outro", "nao_informado"]),
  height_cm: z.coerce.number().min(50).max(260),
  weight_kg: z.coerce.number().min(20).max(500),
  goal: z.string().trim().min(2, "Informe o objetivo.").max(500),
  training_experience: z.string().trim().min(2, "Informe a experiência de treino.").max(1000),
  weekly_frequency: z.coerce.number().int().min(1).max(14),
  training_location: z.string().trim().min(2, "Informe o local de treino.").max(300),
  available_equipment: z.string().trim().min(2, "Informe os equipamentos disponíveis.").max(2000),
  sports_history: z.string().trim().max(2000),
  restrictions: z.string().trim().max(2000),
  injuries: z.string().trim().max(2000),
  notes: z.string().trim().max(3000),
  plan_id: z.string(),
  start_date: z.string().min(1),
  plan_expires_at: z.string(),
  status: z.enum(["ativo", "pausado", "inativo"]),
});

type StudentFormState = {
  full_name: string; email: string; phone: string; birth_date: string; sex: string;
  height_cm: string; weight_kg: string; goal: string; training_experience: string;
  weekly_frequency: string; training_location: string; available_equipment: string;
  sports_history: string; restrictions: string; injuries: string; notes: string;
  plan_id: string; start_date: string; plan_expires_at: string; status: string;
};

const emptyForm = (): StudentFormState => ({
  full_name: "", email: "", phone: "", birth_date: "", sex: "nao_informado",
  height_cm: "", weight_kg: "", goal: "", training_experience: "",
  weekly_frequency: "", training_location: "", available_equipment: "",
  sports_history: "", restrictions: "", injuries: "", notes: "", plan_id: "",
  start_date: new Date().toISOString().slice(0, 10), plan_expires_at: "", status: "ativo",
});

const profileTabs = ["VISÃO GERAL", "TREINO", "DIETA", "AVALIAÇÃO", "EVOLUÇÃO", "CHECK-INS", "PAGAMENTOS", "MENSAGENS"];

function displayStatus(student: StudentRow): Exclude<StudentFilter, "todos"> {
  if (student.status !== "ativo") return "inativo";
  if (!student.plan_expires_at) return "ativo";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiration = new Date(`${student.plan_expires_at}T00:00:00`);
  if (expiration < today) return "vencido";
  const remaining = Math.ceil((expiration.getTime() - today.getTime()) / 86400000);
  return remaining <= 15 ? "vencendo" : "ativo";
}

function initials(name: string | null) {
  return (name || "Aluno").split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function calculateAge(birthDate: string | null) {
  if (!birthDate) return "—";
  const birth = new Date(`${birthDate}T00:00:00`);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age -= 1;
  return `${age} anos`;
}

function dateLabel(date: string | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(`${date}T00:00:00`));
}

export function StudentsModule() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [plans, setPlans] = useState<Database["public"]["Tables"]["plans"]["Row"][]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StudentFilter>("todos");
  const [selected, setSelected] = useState<StudentRow | null>(null);
  const [editing, setEditing] = useState<StudentRow | null>(null);
  const [form, setForm] = useState<StudentFormState>(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadStudents() {
    setLoading(true);
    setError("");
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setLoading(false);
      setError("Entre na sua conta de personal para gerenciar alunos.");
      return;
    }
    const metadataName = typeof userData.user.user_metadata?.["full_name"] === "string" ? userData.user.user_metadata["full_name"] : "";
    await supabase.rpc("ensure_my_profile", { _full_name: metadataName });
    const [{ data, error: listError }, { data: planData }] = await Promise.all([
      supabase.from("students").select("*, plans(*)").order("created_at", { ascending: false }),
      supabase.from("plans").select("*").eq("active", true).order("duration_months"),
    ]);
    if (listError) setError("Não foi possível carregar os alunos. Confirme que sua conta possui acesso de personal.");
    else setStudents((data || []) as StudentRow[]);
    setPlans(planData || []);
    setLoading(false);
  }

  useEffect(() => { void loadStudents(); }, []);

  const visibleStudents = useMemo(() => students.filter((student) => {
    const matchesQuery = (student.full_name || "").toLocaleLowerCase("pt-BR").includes(query.trim().toLocaleLowerCase("pt-BR"));
    return matchesQuery && (filter === "todos" || displayStatus(student) === filter);
  }), [students, query, filter]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setError("");
    setFormOpen(true);
  }

  function openEdit(student: StudentRow) {
    setEditing(student);
    setForm({
      full_name: student.full_name || "", email: student.email || "", phone: student.phone || "",
      birth_date: student.birth_date || "", sex: student.sex || "nao_informado",
      height_cm: student.height_cm?.toString() || "", weight_kg: student.weight_kg?.toString() || "",
      goal: student.goal || "", training_experience: student.training_experience || "",
      weekly_frequency: student.weekly_frequency?.toString() || "", training_location: student.training_location || "",
      available_equipment: student.available_equipment || "", sports_history: student.sports_history || "",
      restrictions: student.restrictions || "", injuries: student.injuries || "", notes: student.notes || "",
      plan_id: student.plan_id || "", start_date: student.start_date, plan_expires_at: student.plan_expires_at || "",
      status: student.status,
    });
    setError("");
    setFormOpen(true);
  }

  function updateField(field: keyof StudentFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function saveStudent(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const parsed = studentSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Revise os campos informados.");
      return;
    }
    setSaving(true);
    const payload = {
      ...parsed.data,
      plan_id: parsed.data.plan_id || null,
      plan_expires_at: parsed.data.plan_expires_at || null,
      height_cm: parsed.data.height_cm,
      weight_kg: parsed.data.weight_kg,
      weekly_frequency: parsed.data.weekly_frequency,
      updated_at: new Date().toISOString(),
    };
    const result = editing
      ? await supabase.from("students").update(payload).eq("id", editing.id).select("*, plans(*)").single()
      : await supabase.rpc("create_student_record", { _student: payload });
    if (result.error) {
      setError("Não foi possível salvar. Verifique os dados e tente novamente.");
      setSaving(false);
      return;
    }
    if (editing && result.data) setSelected(result.data as StudentRow);
    setFormOpen(false);
    await loadStudents();
    setSaving(false);
  }

  async function deactivateStudent() {
    if (!selected) return;
    setSaving(true);
    const { error: updateError } = await supabase.from("students").update({ status: "inativo", updated_at: new Date().toISOString() }).eq("id", selected.id);
    if (updateError) setError("Não foi possível desativar o aluno.");
    else {
      setSelected((current) => current ? { ...current, status: "inativo" } : current);
      await loadStudents();
    }
    setDeactivateOpen(false);
    setSaving(false);
  }

  if (selected) return <StudentProfile student={selected} onBack={() => setSelected(null)} onEdit={() => openEdit(selected)} onDeactivate={() => setDeactivateOpen(true)} />;

  return <>
    <div className="mb-7 flex items-end justify-between gap-4"><div><p className="mb-2 text-[11px] font-bold uppercase tracking-[.2em] text-primary">Gestão de alunos</p><h1 className="text-3xl font-black uppercase leading-none md:text-4xl">Seu time</h1></div><Button onClick={openCreate}><Plus /> Novo aluno</Button></div>
    <div className="mb-5 grid gap-3 lg:grid-cols-[minmax(0,28rem)_1fr]">
      <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar aluno..." className="h-10 pl-10" /></div>
      <div className="flex gap-2 overflow-x-auto pb-1">{(["todos", "ativo", "vencendo", "vencido", "inativo"] as StudentFilter[]).map((item) => <Button key={item} size="sm" variant={filter === item ? "default" : "outline"} onClick={() => setFilter(item)}>{item.toUpperCase()}</Button>)}</div>
    </div>
    {error && <div className="mb-4 border border-primary/50 bg-primary/10 p-3 text-sm">{error}</div>}
    {loading ? <div className="border-y border-border py-10 text-center text-sm text-muted-foreground">Carregando alunos...</div> : visibleStudents.length === 0 ? <div className="border-y border-border py-12 text-center"><p className="font-bold">Nenhum aluno encontrado</p><p className="mt-1 text-sm text-muted-foreground">Cadastre seu primeiro aluno para começar.</p></div> : <div className="data-list">{visibleStudents.map((student) => <StudentListRow key={student.id} student={student} onOpen={() => setSelected(student)} />)}</div>}
    <StudentFormDialog open={formOpen} onOpenChange={setFormOpen} form={form} updateField={updateField} plans={plans} editing={Boolean(editing)} saving={saving} error={error} onSubmit={saveStudent} />
    <AlertDialog open={deactivateOpen} onOpenChange={setDeactivateOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Desativar aluno?</AlertDialogTitle><AlertDialogDescription>O cadastro e o histórico serão mantidos, mas o aluno ficará marcado como inativo.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={deactivateStudent} disabled={saving}>Desativar aluno</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </>;
}

function StudentListRow({ student, onOpen }: { student: StudentRow; onOpen: () => void }) {
  const status = displayStatus(student);
  return <button type="button" onClick={onOpen} className="row-card w-full text-left"><div className="avatar">{initials(student.full_name)}</div><div className="min-w-0 flex-1"><p className="truncate font-bold">{student.full_name}</p><p className="text-xs text-muted-foreground">{student.goal || "Objetivo não informado"} · {student.plans?.name || "SEM PLANO"}</p></div><span className={cn("status", status === "ativo" ? "active" : status === "vencendo" ? "warning" : "pending")}>{status.toUpperCase()}</span><ChevronRight className="h-4 w-4" /></button>;
}

function StudentFormDialog({ open, onOpenChange, form, updateField, plans, editing, saving, error, onSubmit }: { open: boolean; onOpenChange: (open: boolean) => void; form: StudentFormState; updateField: (field: keyof StudentFormState, value: string) => void; plans: Database["public"]["Tables"]["plans"]["Row"][]; editing: boolean; saving: boolean; error: string; onSubmit: (event: React.FormEvent) => void }) {
  const input = (field: keyof StudentFormState, label: string, type = "text", required = true) => <label className="field">{label}<Input type={type} required={required} value={form[field]} onChange={(event) => updateField(field, event.target.value)} /></label>;
  const area = (field: keyof StudentFormState, label: string, required = false) => <label className="field">{label}<Textarea required={required} value={form[field]} onChange={(event) => updateField(field, event.target.value)} /></label>;
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto"><DialogHeader><DialogTitle className="text-2xl font-black uppercase">{editing ? "Editar aluno" : "Novo aluno"}</DialogTitle><DialogDescription>Dados cadastrais e anamnese.</DialogDescription></DialogHeader><form onSubmit={onSubmit} className="space-y-6"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{input("full_name", "Nome completo")}{input("email", "E-mail", "email")}{input("phone", "Telefone", "tel")}{input("birth_date", "Data de nascimento", "date")}<label className="field">Sexo<select className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={form.sex} onChange={(event) => updateField("sex", event.target.value)}><option value="nao_informado">Não informado</option><option value="feminino">Feminino</option><option value="masculino">Masculino</option><option value="outro">Outro</option></select></label>{input("height_cm", "Altura (cm)", "number")}{input("weight_kg", "Peso (kg)", "number")}{input("weekly_frequency", "Frequência semanal", "number")}{input("training_location", "Local de treino")}<label className="field">Plano<select className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={form.plan_id} onChange={(event) => updateField("plan_id", event.target.value)}><option value="">Sem plano</option>{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}</select></label>{input("start_date", "Data de início", "date")}{input("plan_expires_at", "Vencimento", "date", false)}<label className="field">Status<select className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={form.status} onChange={(event) => updateField("status", event.target.value)}><option value="ativo">Ativo</option><option value="pausado">Pausado</option><option value="inativo">Inativo</option></select></label></div><div className="grid gap-4 md:grid-cols-2">{area("goal", "Objetivo", true)}{area("training_experience", "Experiência de treino", true)}{area("available_equipment", "Equipamentos disponíveis", true)}{area("sports_history", "Histórico esportivo")}{area("restrictions", "Restrições")}{area("injuries", "Lesões / limitações")}{area("notes", "Observações")}</div>{error && <div className="border border-primary/50 bg-primary/10 p-3 text-sm">{error}</div>}<DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar aluno"}</Button></DialogFooter></form></DialogContent></Dialog>;
}

function StudentProfile({ student, onBack, onEdit, onDeactivate }: { student: StudentRow; onBack: () => void; onEdit: () => void; onDeactivate: () => void }) {
  const status = displayStatus(student);
  const [tab, setTab] = useState("VISÃO GERAL");
  const [loading, setLoading] = useState(false);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [diets, setDiets] = useState<any[]>([]);
  const [checkins, setCheckins] = useState<any[]>([]);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [feedbackId, setFeedbackId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSaving, setFeedbackSaving] = useState(false);
  const [evaluationOpen, setEvaluationOpen] = useState(false);
  const [evaluationSaving, setEvaluationSaving] = useState(false);
  const [evaluationForm, setEvaluationForm] = useState({ evaluated_at: new Date().toISOString().slice(0,10), weight: "", body_fat: "", arm_left: "", arm_right: "", chest: "", waist: "", abdomen: "", hip: "", thigh_left: "", thigh_right: "", notes: "" });

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const [w, d, c, m, p, msg] = await Promise.all([
        supabase.from("workouts").select("id,name,description,status,weekday,created_at").eq("student_id", student.id).order("created_at", { ascending: false }),
        supabase.from("diets").select("id,name,status,daily_calories,protein_g,carbs_g,fats_g,water_liters,updated_at").eq("student_id", student.id).order("updated_at", { ascending: false }),
        supabase.from("check_ins").select("id,submitted_at,status,weight,adherence_score,energy_score,sleep_score,pain_score,notes,personal_feedback,photo_paths").eq("student_id", student.id).order("submitted_at", { ascending: false }).limit(12),
        supabase.from("evaluations").select("id,evaluated_at,notes,body_measurements(*)").eq("student_id", student.id).order("evaluated_at", { ascending: false }).limit(12),
        supabase.from("payments").select("id,amount_cents,status,due_date,paid_at,method,plan_id").eq("student_id", student.id).order("due_date", { ascending: false }),
        supabase.from("messages").select("id,body,sender_id,recipient_id,created_at,read_at").or(`sender_id.eq.${student.personal_id},recipient_id.eq.${student.personal_id}`).order("created_at", { ascending: false }).limit(20),
      ]);
      setWorkouts(w.data || []); setDiets(d.data || []); setCheckins(c.data || []); setMeasurements(m.data || []); setPayments(p.data || []); setMessages(msg.data || []);
      setLoading(false);
    })();
  }, [student.id]);

  const activeWorkout = workouts.find((w) => w.status === "ativo") || workouts[0];
  const activeDiet = diets.find((d) => d.status === "ativo") || diets[0];
  const lastCheckin = checkins[0];
  const firstWeight = [...checkins].reverse().find((c) => c.weight != null)?.weight ?? student.weight_kg;
  const currentWeight = lastCheckin?.weight ?? student.weight_kg;
  const weightDelta = firstWeight != null && currentWeight != null ? Number(currentWeight) - Number(firstWeight) : null;
  const money = (cents: number) => `R$ ${(cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  async function saveFeedback(checkinId: string) {
    if (!feedbackText.trim()) return;
    setFeedbackSaving(true);
    const { error } = await supabase.from("check_ins").update({ personal_feedback: feedbackText.trim(), status: "respondido", responded_at: new Date().toISOString() }).eq("id", checkinId).eq("student_id", student.id);
    if (!error) {
      setCheckins((items) => items.map((item) => item.id === checkinId ? { ...item, personal_feedback: feedbackText.trim(), status: "respondido", responded_at: new Date().toISOString() } : item));
      setFeedbackId(null);
      setFeedbackText("");
    }
    setFeedbackSaving(false);
  }

  async function saveEvaluation(event: React.FormEvent) {
    event.preventDefault();
    setEvaluationSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { setEvaluationSaving(false); return; }
    const { data: evaluation, error } = await supabase.from("evaluations").insert({ student_id: student.id, evaluator_id: userData.user.id, evaluated_at: evaluationForm.evaluated_at, notes: evaluationForm.notes || null }).select("id,evaluated_at,notes").single();
    if (!error && evaluation) {
      const numberOrNull = (value: string) => value.trim() ? Number(value) : null;
      const { error: measurementError } = await supabase.from("body_measurements").insert({ evaluation_id: evaluation.id, weight: numberOrNull(evaluationForm.weight), body_fat: numberOrNull(evaluationForm.body_fat), arm_left: numberOrNull(evaluationForm.arm_left), arm_right: numberOrNull(evaluationForm.arm_right), chest: numberOrNull(evaluationForm.chest), waist: numberOrNull(evaluationForm.waist), abdomen: numberOrNull(evaluationForm.abdomen), hip: numberOrNull(evaluationForm.hip), thigh_left: numberOrNull(evaluationForm.thigh_left), thigh_right: numberOrNull(evaluationForm.thigh_right) });
      if (!measurementError) {
        const { data: refreshed } = await supabase.from("evaluations").select("id,evaluated_at,notes,body_measurements(*)").eq("student_id", student.id).order("evaluated_at", { ascending: false }).limit(12);
        setMeasurements(refreshed || []);
        setEvaluationOpen(false);
        setEvaluationForm({ evaluated_at: new Date().toISOString().slice(0,10), weight: "", body_fat: "", arm_left: "", arm_right: "", chest: "", waist: "", abdomen: "", hip: "", thigh_left: "", thigh_right: "", notes: "" });
      }
    }
    setEvaluationSaving(false);
  }

  const content = (() => {
    if (tab === "TREINO") return <div className="space-y-4"><SectionTitle title="Treino atual" action={<Button size="sm" onClick={() => setTab("VISÃO GERAL")}>Voltar ao resumo</Button>} />{loading ? <LoadingBox /> : activeWorkout ? <div className="border border-border bg-card"><div className="border-b border-border p-4"><p className="text-[10px] font-bold uppercase tracking-widest text-primary">Programa ativo</p><h2 className="mt-1 text-xl font-black uppercase">{activeWorkout.name}</h2><p className="mt-1 text-sm text-muted-foreground">{activeWorkout.description || "Sem descrição."}</p></div><div className="grid gap-3 p-4 sm:grid-cols-3"><ProfileStat label="Status" value={activeWorkout.status.toUpperCase()} /><ProfileStat label="Dia" value={weekdayLabel(activeWorkout.weekday)} /><ProfileStat label="Criado" value={dateLabel(activeWorkout.created_at?.slice(0,10))} /></div></div> : <EmptyBox text="Nenhum treino vinculado a este aluno." />}</div>;
    if (tab === "DIETA") return <div className="space-y-4"><SectionTitle title="Dieta atual" />{loading ? <LoadingBox /> : activeDiet ? <div className="border border-border bg-card"><div className="border-b border-border p-4"><p className="text-[10px] font-bold uppercase tracking-widest text-primary">Plano alimentar ativo</p><h2 className="mt-1 text-xl font-black uppercase">{activeDiet.name}</h2></div><div className="grid grid-cols-2 gap-px bg-border md:grid-cols-4">{[["KCAL",activeDiet.daily_calories || 0],["PROTEÍNA",`${activeDiet.protein_g || 0}g`],["CARBO",`${activeDiet.carbs_g || 0}g`],["GORDURA",`${activeDiet.fats_g || 0}g`]].map(([l,v])=><ProfileStat key={String(l)} label={String(l)} value={String(v)} />)}</div></div> : <EmptyBox text="Nenhuma dieta vinculada a este aluno." />}</div>;
    if (tab === "CHECK-INS") return <div className="space-y-4"><SectionTitle title="Check-ins" />{loading ? <LoadingBox /> : checkins.length ? <div className="grid gap-3">{checkins.map((c) => <div key={c.id} className="border border-border bg-card p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><b>{dateLabel(c.submitted_at?.slice(0,10))}</b><p className="text-xs text-muted-foreground">{String(c.status).toUpperCase()}</p></div><div className="text-right"><b>{c.weight ?? "—"} kg</b><span className="block text-[10px] text-muted-foreground">PESO</span></div></div><div className="mt-3 grid gap-2 text-sm sm:grid-cols-4"><span>Adesão: <b>{c.adherence_score ?? "—"}</b></span><span>Energia: <b>{c.energy_score ?? "—"}</b></span><span>Sono: <b>{c.sleep_score ?? "—"}</b></span><span>Dor: <b>{c.pain_score ?? "—"}</b></span></div>{c.notes && <p className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground">{c.notes}</p>}
      {Array.isArray(c.photo_paths) && c.photo_paths.length > 0 && <CheckinPhotos paths={c.photo_paths} />}
      {c.personal_feedback ? <div className="mt-3 border-t border-border pt-3"><p className="text-[10px] font-bold uppercase tracking-widest text-primary">Resposta do personal</p><p className="mt-2 text-sm">{c.personal_feedback}</p></div> : feedbackId === c.id ? <div className="mt-3 border-t border-border pt-3"><label className="field"><span>Resposta para o aluno</span><Textarea value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} placeholder="Escreva a análise do check-in e os próximos ajustes..." /></label><div className="mt-2 flex justify-end gap-2"><Button size="sm" variant="outline" onClick={() => { setFeedbackId(null); setFeedbackText(""); }}>Cancelar</Button><Button size="sm" onClick={() => void saveFeedback(c.id)} disabled={feedbackSaving || !feedbackText.trim()}>{feedbackSaving ? "Salvando..." : <><Save /> Salvar resposta</>}</Button></div></div> : <div className="mt-3 flex justify-end"><Button size="sm" variant="outline" onClick={() => { setFeedbackId(c.id); setFeedbackText(""); }}><MessageSquare /> Responder aluno</Button></div>}
    </div>)}</div> : <EmptyBox text="Nenhum check-in recebido ainda." />}</div>;
    if (tab === "EVOLUÇÃO") return <StudentEvolutionPanel student={student} checkins={checkins} measurements={measurements} onMeasurementsChange={setMeasurements} />;
    if (tab === "PAGAMENTOS") return <div className="space-y-4"><SectionTitle title="Pagamentos" />{loading ? <LoadingBox /> : payments.length ? <div className="grid gap-3">{payments.map((p) => <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 border border-border bg-card p-4"><div><b>{money(p.amount_cents)}</b><p className="text-xs text-muted-foreground">Vencimento: {dateLabel(p.due_date)}</p></div><span className={cn("status", p.status === "pago" ? "active" : "pending")}>{String(p.status).toUpperCase()}</span></div>)}</div> : <EmptyBox text="Nenhum pagamento registrado." />}</div>;
    if (tab === "MENSAGENS") return <div className="space-y-4"><SectionTitle title="Mensagens" />{loading ? <LoadingBox /> : messages.length ? <div className="grid gap-2">{messages.map((m) => <div key={m.id} className="border border-border bg-card p-4"><div className="flex justify-between gap-3"><span className="text-[10px] font-bold uppercase text-primary">{m.sender_id === student.personal_id ? "Personal" : "Aluno"}</span><span className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString("pt-BR")}</span></div><p className="mt-2 text-sm">{m.body}</p></div>)}</div> : <EmptyBox text="Nenhuma mensagem ainda." />}</div>;
    return <><div className="stats-grid"><ProfileStat label="Idade" value={calculateAge(student.birth_date)} /><ProfileStat label="Altura" value={student.height_cm ? `${student.height_cm} cm` : "—"} /><ProfileStat label="Peso" value={student.weight_kg ? `${student.weight_kg} kg` : "—"} /><ProfileStat label="Status" value={status.toUpperCase()} /></div><div className="mt-6 grid gap-px bg-border md:grid-cols-2"><ProfileLine label="Objetivo" value={student.goal} /><ProfileLine label="Plano" value={student.plans?.name} /><ProfileLine label="Data de início" value={dateLabel(student.start_date)} /><ProfileLine label="Vencimento" value={dateLabel(student.plan_expires_at)} /><ProfileLine label="Telefone" value={student.phone} /><ProfileLine label="E-mail" value={student.email} /><ProfileLine label="Experiência" value={student.training_experience} /><ProfileLine label="Local de treino" value={student.training_location} /></div><div className="mt-6 grid gap-3 md:grid-cols-3"><SummaryCard title="Treino" value={activeWorkout?.name || "Não configurado"} onClick={() => setTab("TREINO")} /><SummaryCard title="Dieta" value={activeDiet?.name || "Não configurada"} onClick={() => setTab("DIETA")} /><SummaryCard title="Último check-in" value={lastCheckin ? dateLabel(lastCheckin.submitted_at?.slice(0,10)) : "Nenhum"} onClick={() => setTab("CHECK-INS")} /></div></>;
  })();

  return <div><Button variant="ghost" onClick={onBack} className="mb-5 px-0"><ArrowLeft /> Voltar para alunos</Button><div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div className="flex items-center gap-4"><div className="avatar h-16 w-16 text-lg">{initials(student.full_name)}</div><div><p className="mb-2 text-[11px] font-bold uppercase tracking-[.2em] text-primary">Perfil completo</p><h1 className="text-3xl font-black uppercase leading-none md:text-4xl">{student.full_name}</h1></div></div><div className="flex gap-2"><Button variant="outline" onClick={onEdit}><Pencil /> Editar aluno</Button><Button variant="destructive" onClick={onDeactivate}><UserX /> Desativar aluno</Button></div></div><Tabs value={tab} onValueChange={setTab}><TabsList className="mb-6 h-auto w-full justify-start overflow-x-auto rounded-none border-b border-border bg-transparent p-0">{profileTabs.map((item) => <TabsTrigger key={item} value={item} className="rounded-none border-b-2 border-transparent py-3 text-[11px] font-bold data-[state=active]:border-primary data-[state=active]:bg-transparent">{item}</TabsTrigger>)}</TabsList><TabsContent value={tab}>{content}</TabsContent></Tabs></div>;
}

function weekdayLabel(day: number | null) { return day == null ? "Sem dia fixo" : ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"][day] || "—"; }
function StudentEvolutionPanel({ student, checkins, measurements, onMeasurementsChange }: { student: StudentRow; checkins: any[]; measurements: any[]; onMeasurementsChange: (items: any[]) => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ evaluated_at: new Date().toISOString().slice(0,10), weight: "", body_fat: "", arm_left: "", arm_right: "", chest: "", waist: "", abdomen: "", hip: "", thigh_left: "", thigh_right: "", notes: "" });
  const firstWeight = [...checkins].reverse().find((c) => c.weight != null)?.weight ?? student.weight_kg;
  const currentWeight = checkins[0]?.weight ?? student.weight_kg;
  const delta = firstWeight != null && currentWeight != null ? Number(currentWeight) - Number(firstWeight) : null;
  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { setSaving(false); return; }
    const { data: evaluation, error } = await supabase.from("evaluations").insert({ student_id: student.id, evaluator_id: userData.user.id, evaluated_at: form.evaluated_at, notes: form.notes || null }).select("id,evaluated_at,notes").single();
    if (!error && evaluation) {
      const n = (v: string) => v.trim() ? Number(v) : null;
      const { error: measurementError } = await supabase.from("body_measurements").insert({ evaluation_id: evaluation.id, weight: n(form.weight), body_fat: n(form.body_fat), arm_left: n(form.arm_left), arm_right: n(form.arm_right), chest: n(form.chest), waist: n(form.waist), abdomen: n(form.abdomen), hip: n(form.hip), thigh_left: n(form.thigh_left), thigh_right: n(form.thigh_right) });
      if (!measurementError) {
        const { data } = await supabase.from("evaluations").select("id,evaluated_at,notes,body_measurements(*)").eq("student_id", student.id).order("evaluated_at", { ascending: false }).limit(12);
        onMeasurementsChange(data || []); setOpen(false); setForm({ evaluated_at: new Date().toISOString().slice(0,10), weight: "", body_fat: "", arm_left: "", arm_right: "", chest: "", waist: "", abdomen: "", hip: "", thigh_left: "", thigh_right: "", notes: "" });
      }
    }
    setSaving(false);
  }
  const fields: Array<[keyof typeof form, string, string]> = [['evaluated_at','Data','date'],['weight','Peso (kg)','number'],['body_fat','Gordura corporal (%)','number'],['arm_left','Braço esquerdo (cm)','number'],['arm_right','Braço direito (cm)','number'],['chest','Peito (cm)','number'],['waist','Cintura (cm)','number'],['abdomen','Abdômen (cm)','number'],['hip','Quadril (cm)','number'],['thigh_left','Coxa esquerda (cm)','number'],['thigh_right','Coxa direita (cm)','number']];
  return <><div className="space-y-4"><div className="flex items-center justify-between gap-3"><SectionTitle title="Evolução" /><Button size="sm" onClick={() => setOpen(true)}><Plus /> Nova avaliação</Button></div><div className="stats-grid"><ProfileStat label="Peso inicial" value={firstWeight != null ? `${firstWeight} kg` : "—"} /><ProfileStat label="Peso atual" value={currentWeight != null ? `${currentWeight} kg` : "—"} /><ProfileStat label="Variação" value={delta == null ? "—" : `${delta > 0 ? "+" : ""}${delta.toFixed(1)} kg`} /><ProfileStat label="Check-ins" value={String(checkins.length)} /></div><div className="border border-border bg-card p-4"><p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-primary">Avaliações corporais</p>{measurements.length ? <div className="grid gap-3">{measurements.map((m) => { const bm = Array.isArray(m.body_measurements) ? m.body_measurements[0] : m.body_measurements; return <div key={m.id} className="border border-border p-4"><div className="flex items-center justify-between gap-3"><b>{dateLabel(m.evaluated_at?.slice(0,10))}</b>{bm?.weight != null && <span className="font-bold">{bm.weight} kg</span>}</div><div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">{[['BF',bm?.body_fat,'%'],['Braço E',bm?.arm_left,'cm'],['Braço D',bm?.arm_right,'cm'],['Peito',bm?.chest,'cm'],['Cintura',bm?.waist,'cm'],['Abdômen',bm?.abdomen,'cm'],['Quadril',bm?.hip,'cm'],['Coxa E',bm?.thigh_left,'cm'],['Coxa D',bm?.thigh_right,'cm']].filter(([,v]) => v != null).map(([label,value,unit]) => <span key={String(label)}><b className="text-foreground">{label}:</b> {value}{unit}</span>)}</div>{m.notes && <p className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground">{m.notes}</p>}</div> })}</div> : <EmptyBox text="Nenhuma avaliação corporal registrada." />}</div></div><Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle className="text-2xl font-black uppercase">Nova avaliação</DialogTitle><DialogDescription>Registre medidas e composição corporal do aluno.</DialogDescription></DialogHeader><form onSubmit={save} className="space-y-5"><div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">{fields.map(([field,label,type]) => <label className="field" key={field}>{label}<Input type={type} step={type === 'number' ? '0.1' : undefined} value={form[field]} onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))} /></label>)}</div><label className="field">Observações<Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} /></label><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar avaliação"}</Button></DialogFooter></form></DialogContent></Dialog></>;
}

function CheckinPhotos({ paths }: { paths: string[] }) {
  const [urls, setUrls] = useState<string[]>([]);
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const signed = await Promise.all(paths.map(async (path) => { const { data } = await supabase.storage.from("check-in-photos").createSignedUrl(path, 60 * 60); return data?.signedUrl || null; }));
      if (!cancelled) setUrls(signed.filter(Boolean) as string[]);
    })();
    return () => { cancelled = true; };
  }, [paths.join("|")]);
  if (!urls.length) return null;
  return <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{urls.map((url) => <a href={url} target="_blank" rel="noreferrer" key={url} className="aspect-square overflow-hidden border border-border bg-secondary"><img src={url} alt="Foto do check-in" className="h-full w-full object-cover" /></a>)}</div>;
}

function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) { return <div className="flex items-center justify-between gap-3"><h2 className="text-2xl font-black uppercase">{title}</h2>{action}</div>; }
function LoadingBox() { return <div className="border border-border bg-card p-10 text-center text-sm text-muted-foreground">Carregando dados...</div>; }
function EmptyBox({ text }: { text: string }) { return <div className="border border-border bg-card p-10 text-center text-sm text-muted-foreground">{text}</div>; }
function SummaryCard({ title, value, onClick }: { title: string; value: string; onClick: () => void }) { return <button onClick={onClick} className="border border-border bg-card p-4 text-left transition hover:border-primary"><p className="text-[10px] font-bold uppercase tracking-widest text-primary">{title}</p><p className="mt-2 font-bold">{value}</p><span className="mt-3 block text-xs text-muted-foreground">Abrir módulo →</span></button>; }

function ProfileStat({ label, value }: { label: string; value: string }) { return <div className="stat"><span className="text-xs text-muted-foreground">{label}</span><b className="text-xl">{value}</b></div>; }
function ProfileLine({ label, value }: { label: string; value: string | null | undefined }) { return <div className="bg-card p-4"><p className="text-[10px] font-bold uppercase text-muted-foreground">{label}</p><p className="mt-2 text-sm font-bold">{value || "—"}</p></div>; }
