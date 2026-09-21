import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity, ArrowUpRight, Bell, CalendarDays, Check, ChevronRight, ClipboardCheck, CreditCard, Dumbbell, Flame, Home, LogOut, Loader2, MessageCircle, MoreHorizontal, Plus, Search, TrendingUp, Users, Utensils, WalletCards, Zap, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { StudentsModule } from "@/components/students/StudentsModule";
import { supabase } from "@/integrations/supabase/client";
import { WorkoutModule } from "@/components/workouts/WorkoutModule";
import { DietModule } from "@/components/diets/DietModule";
import { StudentArea } from "@/components/student/StudentArea";
import { BillingModule } from "@/components/billing/BillingModule";
import { NotificationsCenter, syncNotifications } from "@/components/notifications/NotificationsCenter";
import { ChatModule } from "@/components/messages/ChatModule";

type View = "personal" | "aluno";
type Tab = "inicio" | "alunos" | "treinos" | "dieta" | "checkins" | "evolucao" | "pagamentos" | "mensagens";

const students = [
  { name: "Marina Costa", initials: "MC", plan: "SEMESTRAL", goal: "Hipertrofia", adherence: 94, due: "12 Out", status: "ativo" },
  { name: "Rafael Nunes", initials: "RN", plan: "TRIMESTRAL", goal: "Definição", adherence: 81, due: "28 Set", status: "ativo" },
  { name: "Beatriz Lima", initials: "BL", plan: "MENSAL", goal: "Emagrecimento", adherence: 76, due: "22 Set", status: "atenção" },
  { name: "Lucas Rocha", initials: "LR", plan: "SEMESTRAL", goal: "Performance", adherence: 89, due: "03 Nov", status: "ativo" },
];

const exercises = [
  { name: "Agachamento livre", meta: "4 séries · 8–10 reps", load: "60 kg", method: "RPE 8" },
  { name: "Leg press 45°", meta: "4 séries · 12 reps", load: "140 kg", method: "Drop-set" },
  { name: "Cadeira extensora", meta: "3 séries · 12–15 reps", load: "45 kg", method: "Bi-set" },
  { name: "Stiff com barra", meta: "3 séries · 10 reps", load: "50 kg", method: "RPE 8" },
];

const meals = [
  { time: "07:30", name: "Café da manhã", kcal: 520, foods: "Ovos, pão integral, mamão e café" },
  { time: "12:30", name: "Almoço", kcal: 680, foods: "Arroz, frango grelhado, feijão e salada" },
  { time: "16:30", name: "Pré-treino", kcal: 340, foods: "Iogurte, banana, aveia e mel" },
  { time: "20:30", name: "Jantar", kcal: 590, foods: "Batata, patinho moído e legumes" },
];

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "BIGTEAM — Consultoria Personalizada" },
    { name: "description", content: "Treino, dieta e acompanhamento personalizado em um só lugar." },
    { property: "og:title", content: "BIGTEAM — Consultoria Personalizada" },
    { property: "og:description", content: "Treino, dieta e acompanhamento personalizado em um só lugar." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ]}),
  component: BigTeamApp,
});

function BigTeamApp() {
  const [role, setRole] = useState<"personal" | "aluno" | null>(null);
  const [userName, setUserName] = useState("");
  const [tab, setTab] = useState<Tab>("inicio");
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    let mounted = true;
    const loadSession = async () => {
      setLoading(true);
      setAuthError("");
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      // Keep profile/role initialization in one place. The first authenticated
      // account becomes PERSONAL; subsequent accounts default to ALUNO.
      const { error: profileError } = await supabase.rpc("ensure_my_profile", { _full_name: user.user_metadata?.["full_name"] || "" });
      if (profileError) {
        setAuthError(profileError.message);
        setLoading(false);
        return;
      }

      const [{ data: profile }, { data: roles, error: roleError }] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);
      if (!mounted) return;
      if (roleError) {
        setAuthError(roleError.message);
        setLoading(false);
        return;
      }
      const nextRole = roles?.some((r: any) => r.role === "personal") ? "personal" : roles?.some((r: any) => r.role === "aluno") ? "aluno" : null;
      setRole(nextRole);
      setUserName(profile?.full_name || user.user_metadata?.["full_name"] || "BIGTEAM");
      setTab("inicio");
      setLoading(false);
    };

    void loadSession();
    const { data: listener } = supabase.auth.onAuthStateChange(() => { void loadSession(); });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
    setTab("inicio");
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  }

  if (!role) {
    return <main className="flex min-h-screen items-center justify-center bg-background px-6"><div className="w-full max-w-lg border border-border bg-card p-8 text-center md:p-12"><div className="brand mx-auto mb-8">BIG<span>TEAM</span></div><p className="text-[11px] font-bold uppercase tracking-[.2em] text-primary">Consultoria personalizada</p><h1 className="mt-3 text-3xl font-black uppercase md:text-4xl">Seu treino. Sua dieta. Seu acompanhamento.</h1><p className="mt-4 text-sm leading-6 text-muted-foreground">Entre na sua conta para acessar a plataforma. O painel é carregado de acordo com o seu perfil.</p>{authError && <div className="mt-5 border border-primary/40 bg-primary/10 p-3 text-left text-sm">{authError}</div>}<Button asChild className="mt-7 h-12 w-full"><Link to="/auth">ENTRAR NA BIGTEAM</Link></Button></div></main>;
  }

  const isPersonal = role === "personal";
  const navItems: Array<[Tab, LucideIcon, string]> = isPersonal
    ? [["inicio", Activity, "Dashboard"], ["alunos", Users, "Alunos"], ["treinos", Dumbbell, "Treinos"], ["dieta", Utensils, "Dietas"], ["checkins", ClipboardCheck, "Check-ins"], ["pagamentos", CreditCard, "Pagamentos"], ["mensagens", MessageCircle, "Mensagens"]]
    : [["inicio", Home, "Início"], ["treinos", Dumbbell, "Meu treino"], ["dieta", Utensils, "Minha dieta"], ["checkins", ClipboardCheck, "Check-in"], ["evolucao", TrendingUp, "Evolução"], ["mensagens", MessageCircle, "Mensagens"]];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 md:px-8">
          <button className="brand" onClick={() => setTab("inicio")} aria-label="Início BIGTEAM">BIG<span>TEAM</span></button>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs font-bold uppercase text-muted-foreground sm:inline">{userName || (isPersonal ? "Personal" : "Aluno")}</span>
            <span className="status active">{isPersonal ? "PERSONAL" : "ALUNO"}</span>
            <NotificationsCenter />
            <Button variant="outline" size="icon" onClick={() => void signOut()} aria-label="Sair"><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1500px]">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 border-r border-border p-4 md:block">
          <p className="px-3 pb-3 pt-2 text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground">{isPersonal ? "Gestão" : "Minha rotina"}</p>
          <Nav view={role} tab={tab} setTab={setTab} />
          <div className="absolute bottom-5 left-4 right-4 border border-border bg-card p-4"><p className="text-xs font-bold">{isPersonal ? "BIGTEAM Personal" : "Área do aluno"}</p><p className="mt-1 text-[11px] text-muted-foreground">{isPersonal ? "Gestão da consultoria" : "Acesso pessoal"}</p></div>
        </aside>

        <main className="min-w-0 flex-1 px-4 pb-28 pt-7 md:px-8 md:pb-12 lg:px-10">
          {isPersonal ? <PersonalView tab={tab} setTab={setTab} /> : <StudentArea tab={tab} setTab={setTab} />}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-border bg-background/98 px-2 pb-[max(.55rem,env(safe-area-inset-bottom))] pt-2 md:hidden">
        {navItems.map(([id, Icon, label]) => <button key={id} onClick={() => setTab(id)} className={cn("flex h-14 flex-col items-center justify-center gap-1 text-[10px] font-semibold text-muted-foreground", tab === id && "text-primary")}><Icon className="h-5 w-5" />{label}</button>)}
      </nav>
    </div>
  );
}
function Nav({ view, tab, setTab }: { view: "personal" | "aluno"; tab: Tab; setTab: (t: Tab) => void }) {
  const items: Array<[Tab, LucideIcon, string]> = view === "personal" ? [["inicio", Activity, "Dashboard"], ["alunos", Users, "Alunos"], ["treinos", Dumbbell, "Treinos"], ["dieta", Utensils, "Dietas"], ["checkins", ClipboardCheck, "Check-ins"], ["pagamentos", CreditCard, "Pagamentos"], ["mensagens", MessageCircle, "Mensagens"]] : [["inicio", Home, "Início"], ["treinos", Dumbbell, "Meu treino"], ["dieta", Utensils, "Minha dieta"], ["checkins", ClipboardCheck, "Check-in"], ["evolucao", TrendingUp, "Evolução"], ["mensagens", MessageCircle, "Mensagens"]];
  return <div className="space-y-1">{items.map(([id, Icon, label]) => <Button key={id} variant="ghost" onClick={() => setTab(id)} className={cn("h-11 w-full justify-start gap-3 text-muted-foreground", tab === id && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground")}><Icon />{label}</Button>)}</div>;
}

function PageTitle({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return <div className="mb-7 flex items-end justify-between gap-4"><div><p className="mb-2 text-[11px] font-bold uppercase tracking-[.2em] text-primary">{eyebrow}</p><h1 className="text-3xl font-black uppercase leading-none md:text-4xl">{title}</h1></div>{action}</div>;
}

function PersonalView({ tab, setTab }: any) {
  if (tab === "alunos") return <StudentsModule />;
  if (tab === "treinos") return <WorkoutModule />;
  if (tab === "dieta") return <DietModule />;
  if (tab === "pagamentos") return <BillingModule />;
  if (tab === "checkins") return <PersonalCheckins setTab={setTab} />;
  if (tab === "mensagens") return <ChatModule mode="personal" />;
  return <PersonalDashboard setTab={setTab} />;
}

function PersonalCheckins({ setTab }: { setTab: (tab: Tab) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    void (async () => {
      setLoading(true);
      const { data, error: queryError } = await supabase
        .from("check_ins")
        .select("id,student_id,submitted_at,weight,adherence_score,energy_score,sleep_score,pain_score,notes,status,students(full_name)")
        .eq("status", "pendente")
        .order("submitted_at", { ascending: false });
      if (queryError) setError(queryError.message);
      setItems(data || []);
      setLoading(false);
    })();
  }, []);
  return <><PageTitle eyebrow="Acompanhamento" title="Check-ins" action={<Button onClick={() => setTab("alunos")} variant="outline"><Users /> Ver alunos</Button>} />
    {error && <div className="mb-4 border border-primary/40 bg-primary/10 p-3 text-sm">Não foi possível carregar os check-ins: {error}</div>}
    {loading ? <div className="border border-border bg-card p-8 text-center text-sm text-muted-foreground">Carregando check-ins...</div> : items.length === 0 ? <div className="border border-border bg-card p-10 text-center"><ClipboardCheck className="mx-auto mb-3 text-primary" /><b>Nenhum check-in pendente</b><p className="mt-1 text-sm text-muted-foreground">Quando um aluno enviar o próximo check-in, ele aparecerá aqui.</p></div> : <div className="grid gap-3">{items.map((item) => <div className="row-card" key={item.id}><div className="avatar">{initials(item.students?.full_name)}</div><div className="min-w-0 flex-1"><p className="font-bold">{item.students?.full_name || "Aluno"}</p><p className="text-xs text-muted-foreground">{dateLabel(item.submitted_at)} · Adesão {item.adherence_score ?? "—"}/10 · Energia {item.energy_score ?? "—"}/10</p></div><div className="hidden text-right sm:block"><b>{item.weight ?? "—"} kg</b><p className="text-[10px] text-muted-foreground">PESO</p></div><span className="status pending">PENDENTE</span><Button size="sm" onClick={() => setTab("alunos")}>Analisar</Button></div>)}</div>}
  </>;
}


function PersonalDashboard({ setTab }: { setTab: (tab: Tab) => void }) {
  const [rows, setRows] = useState<any[]>([]);
  const [pending, setPending] = useState(0);
  const [due, setDue] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const { data: auth } = await supabase.auth.getUser();
      const personalId = auth.user?.id;
      if (!personalId) {
        setError("Faça login como Personal para visualizar seus dados reais.");
        setLoading(false);
        return;
      }
      const [{ data: studentsData, error: studentsError }, { data: checkinsData, error: checkinsError }, { data: paymentsData, error: paymentsError }] = await Promise.all([
        supabase.from("students").select("id,full_name,goal,plan_expires_at,status,created_at,plans(name)").eq("personal_id", personalId).order("created_at", { ascending: false }).limit(5),
        supabase.from("check_ins").select("id,status").eq("status", "pendente"),
        supabase.from("payments").select("amount_cents,status,paid_at").eq("status", "pago"),
      ]);
      const firstError = studentsError || checkinsError || paymentsError;
      if (firstError) setError(firstError.message);
      const list = (studentsData || []) as any[];
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const in15 = new Date(today); in15.setDate(in15.getDate() + 15);
      setRows(list);
      setActiveCount(list.filter(s => s.status === "ativo").length);
      setPending((checkinsData || []).length);
      setDue(list.filter(s => {
        if (s.status !== "ativo" || !s.plan_expires_at) return false;
        const d = new Date(`${s.plan_expires_at}T00:00:00`);
        return d >= today && d <= in15;
      }).length);
      const month = today.getMonth(); const year = today.getFullYear();
      setRevenue((paymentsData || []).filter((p: any) => {
        if (!p.paid_at) return false;
        const d = new Date(p.paid_at);
        return d.getMonth() === month && d.getFullYear() === year;
      }).reduce((sum: number, p: any) => sum + (p.amount_cents || 0), 0) / 100);
      setLoading(false);
    })();
  }, []);

  const todayLabel = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  return <>
    <PageTitle eyebrow={todayLabel} title="Seu time" action={<Button onClick={() => setTab("alunos")}><Plus /> Novo aluno</Button>} />
    {error && <div className="mb-5 border border-primary/40 bg-primary/10 p-3 text-sm">{error}</div>}
    <div className="stats-grid"><Stat label="Alunos ativos" value={loading ? "—" : String(activeCount)} delta="Da sua carteira" icon={Users}/><Stat label="Check-ins pendentes" value={loading ? "—" : String(pending)} delta="Aguardando análise" icon={ClipboardCheck}/><Stat label="Planos a vencer" value={loading ? "—" : String(due)} delta="Próximos 15 dias" icon={CalendarDays}/><Stat label="Receita recebida" value={loading ? "—" : `R$ ${revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} delta="Pagamentos deste mês" icon={WalletCards}/></div>
    <div className="mt-8 grid gap-8 xl:grid-cols-[1.35fr_.65fr]"><section><div className="section-head"><h2>ALUNOS RECENTES</h2><Button variant="ghost" onClick={() => setTab("alunos")}>Ver todos <ArrowUpRight/></Button></div><div className="data-list">{loading ? <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div> : rows.length ? rows.map(s => <div className="row-card" key={s.id}><div className="avatar">{initials(s.full_name)}</div><div className="min-w-0 flex-1"><p className="truncate font-bold">{s.full_name || "Aluno"}</p><p className="text-xs text-muted-foreground">{s.goal || "Objetivo não informado"} · {s.plans?.name || "SEM PLANO"}</p></div><span className={cn("status", s.status === "ativo" ? "active" : "pending")}>{String(s.status || "").toUpperCase()}</span><ChevronRight className="h-4 w-4"/></div>) : <div className="p-8 text-center text-sm text-muted-foreground">Ainda não há alunos cadastrados na sua carteira.</div>}</div></section><section><div className="section-head"><h2>PRÓXIMOS PASSOS</h2></div><div className="space-y-3"><button onClick={() => setTab("alunos")} className="feature-line w-full text-left"><Users className="text-primary"/><div><b>Cadastre e organize seus alunos</b><p>Dados, planos e anamnese em um só lugar.</p></div></button><button onClick={() => setTab("treinos")} className="feature-line w-full text-left"><Dumbbell className="text-primary"/><div><b>Monte um treino</b><p>Crie A/B/C, configure carga, RPE e descanso.</p></div></button><button onClick={() => setTab("dieta")} className="feature-line w-full text-left"><Utensils className="text-primary"/><div><b>Monte uma dieta</b><p>Refeições, gramas e macros automáticos.</p></div></button></div></section></div>
  </>;
}

function dateLabel(value: string | null | undefined) {
  if (!value) return "Data não informada";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Data não informada" : new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(date);
}

function initials(name: string | null) { return (name || "Aluno").split(/\s+/).slice(0,2).map(p => p[0]).join("").toUpperCase(); }

function StudentView({ tab, setTab, done, setDone }: any) {
  if (tab === "treinos") return <><PageTitle eyebrow="Treino do dia" title="Lower strength" action={<span className="status active">EM ANDAMENTO</span>} /><div className="mb-5 flex items-center justify-between border-y border-border py-4 text-sm"><span><b>55 min</b> estimados</span><span><b>{done.length}/{exercises.length}</b> exercícios</span><span><b>340</b> kcal</span></div><div className="space-y-3">{exercises.map((e,i)=><div key={e.name} className={cn("exercise",done.includes(i)&&"done")}><button aria-label={`Concluir ${e.name}`} onClick={()=>setDone(done.includes(i)?done.filter((x:number)=>x!==i):[...done,i])} className="check">{done.includes(i)&&<Check/>}</button><div className="flex-1"><p className="font-bold">{e.name}</p><p className="mt-1 text-xs text-muted-foreground">{e.meta} · {e.method}</p></div><Input defaultValue={e.load} aria-label={`Carga de ${e.name}`} className="w-20 text-center"/></div>)}</div><Button className="mt-6 h-12 w-full" disabled={done.length<exercises.length}><Check/> Concluir treino</Button></>;
  if (tab === "dieta") return <><PageTitle eyebrow="Plano alimentar" title="Dieta 2.130 kcal" /><div className="mb-6 grid grid-cols-3 gap-2"><Macro label="PROTEÍNA" value="168g"/><Macro label="CARBO" value="224g"/><Macro label="GORDURA" value="62g"/></div><div className="space-y-3">{meals.map(m=><div className="meal" key={m.name}><div className="text-xs font-bold text-primary">{m.time}</div><div className="flex-1"><p className="font-bold">{m.name}</p><p className="mt-1 text-sm text-muted-foreground">{m.foods}</p></div><div className="text-right text-sm font-bold">{m.kcal}<span className="block text-[10px] font-normal text-muted-foreground">KCAL</span></div><Button variant="ghost" size="icon" aria-label="Ver substituições"><MoreHorizontal/></Button></div>)}</div></>;
  if (tab === "checkins") return <Checkin />;
  if (tab === "evolucao") return <Evolution />;
  if (tab === "mensagens") return <ChatModule mode="aluno" />;
  return <><PageTitle eyebrow="Domingo, 20 de setembro" title="Vamos pra cima, Marina" /><div className="athlete-hero"><div><span className="status active">TREINO DE HOJE</span><h2>LOWER<br/>STRENGTH</h2><p>Quadríceps · Posterior · Glúteos</p><Button onClick={()=>setTab("treinos")} className="mt-6 h-11">Iniciar treino <ArrowUpRight/></Button></div><div className="ring"><b>75%</b><span>SEMANA</span></div></div><div className="mt-6 grid gap-4 sm:grid-cols-3"><Quick icon={Flame} label="Sequência" value="12 dias"/><Quick icon={TrendingUp} label="Peso atual" value="68,4 kg"/><Quick icon={CreditCard} label="Plano" value="128 dias"/></div><div className="mt-8 grid gap-6 lg:grid-cols-2"><section><div className="section-head"><h2>PRÓXIMA REFEIÇÃO</h2></div><div className="feature-line"><div className="icon-box"><Utensils/></div><div><b>Pré-treino</b><p>16:30 · 340 kcal</p></div><ChevronRight className="ml-auto"/></div></section><section><div className="section-head"><h2>CHECK-IN SEMANAL</h2></div><div className="feature-line"><div className="icon-box"><ClipboardCheck/></div><div><b>Faltam 2 dias</b><p>Envie peso, fotos e feedback</p></div><Button size="sm" variant="outline" onClick={()=>setTab("checkins")}>Abrir</Button></div></section></div></>;
}

function Stat({label,value,delta,icon:Icon}:any){return <div className="stat"><div className="flex items-start justify-between"><span>{label}</span><Icon className="text-primary"/></div><b>{value}</b><small>{delta}</small></div>}
function StudentRow({s}:any){return <div className="row-card"><div className="avatar">{s.initials}</div><div className="min-w-0 flex-1"><p className="truncate font-bold">{s.name}</p><p className="text-xs text-muted-foreground">{s.goal} · {s.plan}</p></div><div className="hidden text-right sm:block"><b className="text-sm">{s.adherence}%</b><p className="text-[10px] text-muted-foreground">ADESÃO</p></div><span className={cn("status",s.status==="ativo"?"active":"warning")}>{s.status.toUpperCase()}</span><Button size="icon" variant="ghost" aria-label={`Abrir ${s.name}`}><ChevronRight/></Button></div>}
function Agenda({time,name}:any){return <div className="flex gap-4 border-b border-border p-4 last:border-0"><b className="text-sm text-primary">{time}</b><span className="text-sm">{name}</span></div>}
function Builder({title,eyebrow,items,onAdd}:any){return <><PageTitle eyebrow={eyebrow} title={title} action={<Button onClick={onAdd}><Plus/>Adicionar</Button>}/><div className="mb-5 flex gap-3"><Input placeholder="Nome do programa" defaultValue={eyebrow==="Nutrição"?"Dieta performance":"Lower strength"}/><Button variant="outline">Salvar rascunho</Button></div><div className="border border-border bg-card"><div className="grid grid-cols-[40px_1fr_auto] border-b border-border bg-secondary px-4 py-3 text-[10px] font-bold text-muted-foreground"><span>#</span><span>ITEM</span><span>CONFIGURAÇÃO</span></div>{items.map((x:string,i:number)=><div className="grid grid-cols-[40px_1fr_auto] items-center border-b border-border px-4 py-4 last:border-0" key={`${x}-${i}`}><b className="text-primary">{String(i+1).padStart(2,"0")}</b><Input defaultValue={x}/><Button variant="ghost" size="icon" aria-label="Opções"><MoreHorizontal/></Button></div>)}</div></>}
function Macro({label,value}:any){return <div className="border border-border bg-card p-4 text-center"><b className="text-xl">{value}</b><span className="mt-1 block text-[10px] font-bold text-muted-foreground">{label}</span></div>}
function Quick({icon:Icon,label,value}:any){return <div className="feature-line"><Icon className="text-primary"/><div><p className="text-xs text-muted-foreground">{label}</p><b>{value}</b></div></div>}
function Checkin(){const [sent,setSent]=useState(false);if(sent)return <div className="mx-auto max-w-lg py-16 text-center"><div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center bg-primary"><Check className="h-8 w-8"/></div><h1 className="text-3xl font-black uppercase">Check-in enviado</h1><p className="mt-3 text-muted-foreground">Seu personal receberá suas respostas para análise.</p></div>;return <><PageTitle eyebrow="Acompanhamento semanal" title="Como foi sua semana?"/><div className="mx-auto max-w-2xl space-y-5"><label className="field">Peso atual (kg)<Input type="number" placeholder="Ex.: 68,4"/></label>{["Adesão à dieta","Nível de energia","Qualidade do sono","Dor ou desconforto"].map(x=><label className="field" key={x}>{x}<Input type="range" min="1" max="10" defaultValue="8" className="px-0"/></label>)}<label className="field">Fotos da semana<Input type="file" multiple accept="image/*" className="h-12 pt-2"/></label><Button className="h-12 w-full" onClick={()=>setSent(true)}>Enviar check-in <ArrowUpRight/></Button></div></>}
function Evolution(){return <><PageTitle eyebrow="Minha evolução" title="Consistência que aparece"/><div className="stats-grid"><Stat label="Peso inicial" value="73,2 kg" delta="12 semanas atrás" icon={Activity}/><Stat label="Peso atual" value="68,4 kg" delta="−4,8 kg" icon={TrendingUp}/><Stat label="Cintura" value="72 cm" delta="−7 cm" icon={Zap}/><Stat label="Adesão média" value="91%" delta="Excelente" icon={Check}/></div><div className="mt-8 border border-border bg-card p-6"><h2 className="mb-8 font-black">HISTÓRICO DE PESO</h2><div className="chart-bars">{[78,74,70,68,63,60,57,54,51,48,46,44].map((h,i)=><div key={i} style={{height:`${h}%`}}><span>{i%3===0?`${73-i*.4}`:""}</span></div>)}</div></div></>}
function Messages(){const [messages,setMessages]=useState(["Seu treino foi atualizado para esta semana.","Perfeito! Vou manter o foco nas cargas."]);const [text,setText]=useState("");return <><PageTitle eyebrow="Contato direto" title="Mensagens"/><div className="mx-auto max-w-3xl border border-border bg-card"><div className="flex items-center gap-3 border-b border-border p-4"><div className="avatar">GA</div><div><b>Gustavo Almeida</b><p className="text-xs text-primary">Online agora</p></div></div><div className="flex min-h-80 flex-col gap-3 p-4">{messages.map((m,i)=><div key={i} className={cn("max-w-[80%] p-3 text-sm",i%2?"ml-auto bg-primary text-primary-foreground":"bg-secondary")}>{m}</div>)}</div><form className="flex gap-2 border-t border-border p-3" onSubmit={e=>{e.preventDefault();if(text.trim()){setMessages([...messages,text]);setText("")}}}><Input value={text} onChange={e=>setText(e.target.value)} placeholder="Escreva uma mensagem..."/><Button type="submit">Enviar</Button></form></div></>}
