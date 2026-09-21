import { useEffect, useState } from "react";
import { ArrowUpRight, Check, ChevronRight, ClipboardCheck, Dumbbell, Loader2, MessageCircle, RefreshCw, TrendingUp, Utensils, Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

type Student={id:string;user_id:string;goal?:string|null;plan_expires_at?:string|null;status:string};
type Workout={id:string;name:string;description?:string|null}; type Exercise={id:string;workout_id:string;name:string;sets:number;reps:string;target_load?:number|null;target_rpe?:number|null;rest_seconds:number;advanced_method?:string|null;instructions?:string|null;position:number};
type Diet={id:string;name:string;daily_calories?:number|null;protein_g?:number|null;carbs_g?:number|null;fats_g?:number|null}; type Meal={id:string;name:string;scheduled_time?:string|null;position:number}; type MealItem={id:string;meal_id:string;food_name:string;quantity:number;unit:string;calories?:number|null};

export function StudentArea({tab,setTab}:{tab:string;setTab:(tab:any)=>void}){const [student,setStudent]=useState<Student|null>(null);const [name,setName]=useState("Aluno");const [loading,setLoading]=useState(true);const [error,setError]=useState("");const [retry,setRetry]=useState(0);useEffect(()=>{void load();},[retry]);async function load(){setLoading(true);setError("");const {data:{user}}=await supabase.auth.getUser();if(!user){setError("Entre na sua conta para acessar sua área de aluno.");setLoading(false);return;}const [{data:p},{data:s,error:e}]=await Promise.all([supabase.from("profiles").select("full_name").eq("id",user.id).maybeSingle(),supabase.from("students").select("id,user_id,goal,plan_expires_at,status").eq("user_id",user.id).maybeSingle()]);if(p?.full_name)setName(p.full_name);if(e)setError(e.message);setStudent(s);setLoading(false)}if(loading)return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="animate-spin text-primary"/></div>;if(error||!student)return <div className="mx-auto max-w-xl py-20 text-center"><RefreshCw className="mx-auto mb-5 text-primary"/><h1 className="text-2xl font-black uppercase">Área do aluno</h1><p className="mt-3 text-sm text-muted-foreground">{error||"Sua conta ainda não está vinculada a um cadastro de aluno. Peça ao seu personal para criar ou vincular seu acesso."}</p><Button className="mt-6" onClick={()=>setRetry(x=>x+1)}>Tentar novamente</Button></div>;if(tab==="treinos")return <StudentWorkout student={student}/>;if(tab==="dieta")return <StudentDiet student={student}/>;if(tab==="checkins")return <StudentCheckin student={student}/>;if(tab==="evolucao")return <StudentEvolution student={student}/>;if(tab==="mensagens")return <StudentMessages student={student}/>;return <StudentHome student={student} name={name} setTab={setTab}/>}

function StudentHome({student,name,setTab}:{student:Student;name:string;setTab:(t:any)=>void}){
  const [workout,setWorkout]=useState<Workout|null>(null);
  const [diet,setDiet]=useState<Diet|null>(null);
  const [weight,setWeight]=useState<number|null>(null);
  useEffect(()=>{void(async()=>{
    const [{data:w},{data:d},{data:c}]=await Promise.all([
      supabase.from("workouts").select("id,name,description").eq("student_id",student.id).eq("status","ativo").order("created_at",{ascending:false}).limit(1).maybeSingle(),
      supabase.from("diets").select("id,name,daily_calories,protein_g,carbs_g,fats_g").eq("student_id",student.id).eq("status","ativo").order("created_at",{ascending:false}).limit(1).maybeSingle(),
      supabase.from("check_ins").select("weight").eq("student_id",student.id).not("weight","is",null).order("submitted_at",{ascending:false}).limit(1).maybeSingle()
    ]);
    setWorkout(w);setDiet(d);setWeight(c?.weight??null);
  })()},[student.id]);
  const expiry=student.plan_expires_at?new Date(`${student.plan_expires_at}T00:00:00`):null;
  const daysLeft=expiry?Math.ceil((expiry.getTime()-new Date(new Date().toDateString()).getTime())/86400000):null;
  const planLabel=daysLeft===null?"Plano sem vencimento":daysLeft<0?"Plano vencido":daysLeft===0?"Vence hoje":`Válido por mais ${daysLeft} ${daysLeft===1?"dia":"dias"}`;
  return <>
    <Title eyebrow="Minha rotina" title={`Olá, ${name.split(" ")[0]}`}/>
    <div className="grid gap-4 md:grid-cols-3">
      <button onClick={()=>setTab("treinos")} className="feature-line text-left"><Dumbbell className="text-primary"/><div className="flex-1"><p className="text-xs text-muted-foreground">Treino atual</p><b>{workout?.name||"Nenhum treino liberado"}</b></div><ChevronRight/></button>
      <button onClick={()=>setTab("dieta")} className="feature-line text-left"><Utensils className="text-primary"/><div className="flex-1"><p className="text-xs text-muted-foreground">Plano alimentar</p><b>{diet?.daily_calories?`${diet.daily_calories} kcal`:diet?.name||"Nenhuma dieta liberada"}</b></div><ChevronRight/></button>
      <button onClick={()=>setTab("evolucao")} className="feature-line text-left"><TrendingUp className="text-primary"/><div className="flex-1"><p className="text-xs text-muted-foreground">Peso mais recente</p><b>{weight?`${Number(weight).toFixed(1).replace('.',',')} kg`:"Ainda não registrado"}</b></div><ChevronRight/></button>
    </div>
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      <section><div className="section-head"><h2>MEU PLANO</h2></div><div className={cn("border bg-card p-5",daysLeft!==null&&daysLeft<=7?"border-primary/60":"border-border")}><p className="text-xs text-muted-foreground">Válido até</p><b className="mt-1 block text-2xl">{expiry?expiry.toLocaleDateString("pt-BR"):"—"}</b><p className="mt-2 text-sm text-muted-foreground">{planLabel}. {daysLeft!==null&&daysLeft<=7?"Fale com seu personal para renovar.":"Se precisar renovar, fale com seu personal."}</p></div></section>
      <section><div className="section-head"><h2>CHECK-IN</h2></div><button onClick={()=>setTab("checkins")} className="feature-line w-full text-left"><ClipboardCheck className="text-primary"/><div className="flex-1"><b>Envie seu acompanhamento semanal</b><p>Treino, dieta, sono, energia e observações.</p></div><ArrowUpRight/></button></section>
    </div>
  </>
}

function StudentWorkout({ student }: { student: Student }) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [values, setValues] = useState<Record<string, { done: boolean; load: string; reps: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { void loadWorkouts(); }, [student.id]);
  useEffect(() => { if (selectedId) void loadWorkout(selectedId); }, [selectedId]);

  async function loadWorkouts() {
    setLoading(true);
    setError("");
    const { data, error: e } = await supabase.from("workouts").select("id,name,description").eq("student_id", student.id).eq("status", "ativo").order("created_at", { ascending: false });
    if (e) setError(e.message);
    const list = (data || []) as Workout[];
    setWorkouts(list);
    if (list.length && list[0]) setSelectedId(list[0].id);
    setLoading(false);
  }

  async function loadWorkout(id: string) {
    setSaved(false);
    const current = workouts.find((item) => item.id === id) || null;
    setWorkout(current);
    const { data, error: e } = await supabase.from("workout_exercises").select("id,workout_id,name,sets,reps,target_load,target_rpe,rest_seconds,advanced_method,instructions,position").eq("workout_id", id).order("position", { ascending: true });
    if (e) { setError(e.message); return; }
    const list = (data || []) as Exercise[];
    setExercises(list);
    setValues(Object.fromEntries(list.map((item) => [item.id, { done: false, load: item.target_load?.toString() || "", reps: item.reps }])));
  }

  const completed = exercises.filter((item) => values[item.id]?.done).length;

  async function finish() {
    if (!workout) return;
    setSaving(true);
    setError("");
    const rows: any[] = [];
    for (const exercise of exercises) {
      const value = values[exercise.id];
      for (let setNumber = 1; setNumber <= exercise.sets; setNumber += 1) {
        rows.push({
          student_id: student.id,
          workout_id: workout.id,
          exercise_id: exercise.id,
          set_number: setNumber,
          reps: Number(value?.reps) || null,
          load: Number(value?.load) || null,
          rpe: exercise.target_rpe || null,
          completed: !!value?.done,
        });
      }
    }
    const { error: e } = await supabase.from("workout_logs").insert(rows);
    setSaving(false);
    if (e) setError(e.message); else setSaved(true);
  }

  if (loading) return <Loader2 className="animate-spin" />;
  if (error && !workouts.length) return <Empty title="Não foi possível carregar" text={error} />;
  if (!workouts.length) return <Empty title="Nenhum treino liberado" text="Seu personal ainda não publicou um treino ativo." />;

  return (
    <>
      <Title eyebrow="Meu treino" title={workout?.name || "Treino"} />
      {workouts.length > 1 && (
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {workouts.map((item, index) => (
            <button key={item.id} onClick={() => setSelectedId(item.id)} className={cn("shrink-0 border px-4 py-2 text-xs font-black uppercase", selectedId === item.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card")}>
              {item.name || `Treino ${String.fromCharCode(65 + index)}`}
            </button>
          ))}
        </div>
      )}
      {workout?.description && <p className="mb-5 text-sm text-muted-foreground">{workout.description}</p>}
      {error && <div className="mb-4 border border-primary/40 bg-primary/10 p-3 text-sm">{error}</div>}
      <div className="mb-5 flex justify-between border-y border-border py-4 text-sm">
        <span><b>{exercises.length}</b> exercícios</span>
        <span><b>{completed}/{exercises.length}</b> concluídos</span>
      </div>
      <div className="space-y-3">
        {exercises.map((exercise) => {
          const value = values[exercise.id] || { done: false, load: "", reps: exercise.reps };
          return (
            <div key={exercise.id} className={cn("border border-border bg-card p-4", value.done && "border-primary/60")}>
              <div className="flex items-start gap-3">
                <button className={cn("check shrink-0", value.done && "bg-primary text-primary-foreground")} onClick={() => setValues({ ...values, [exercise.id]: { ...value, done: !value.done } })} aria-label={`Concluir ${exercise.name}`}>
                  {value.done && <Check />}
                </button>
                <div className="flex-1">
                  <b>{exercise.name}</b>
                  <p className="mt-1 text-xs text-muted-foreground">{exercise.sets} séries · {exercise.reps} reps · {exercise.rest_seconds}s descanso{exercise.target_rpe ? ` · RPE ${exercise.target_rpe}` : ""}</p>
                  {exercise.advanced_method && <span className="mt-2 inline-block text-[10px] font-bold uppercase text-primary">{exercise.advanced_method}</span>}
                  {exercise.instructions && <p className="mt-2 text-xs text-muted-foreground">{exercise.instructions}</p>}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <label className="field">Carga (kg)<Input type="number" step="0.5" value={value.load} onChange={(event) => setValues({ ...values, [exercise.id]: { ...value, load: event.target.value } })} /></label>
                <label className="field">Repetições<Input value={value.reps} onChange={(event) => setValues({ ...values, [exercise.id]: { ...value, reps: event.target.value } })} /></label>
              </div>
            </div>
          );
        })}
      </div>
      <Button className="mt-6 h-12 w-full" disabled={!exercises.length || completed < exercises.length || saving || saved} onClick={() => void finish()}>
        {saving ? <Loader2 className="animate-spin" /> : saved ? <><Check /> Treino registrado</> : <><Check /> Concluir treino</>}
      </Button>
    </>
  );
}
function StudentDiet({student}:{student:Student}){
  const [diet,setDiet]=useState<Diet|null>(null);const [meals,setMeals]=useState<Meal[]>([]);const [items,setItems]=useState<MealItem[]>([]);const [loading,setLoading]=useState(true);
  useEffect(()=>{void load()},[student.id]);
  async function load(){setLoading(true);const {data:d}=await supabase.from("diets").select("id,name,daily_calories,protein_g,carbs_g,fats_g").eq("student_id",student.id).eq("status","ativo").order("created_at",{ascending:false}).limit(1).maybeSingle();setDiet(d);if(d){const {data:m}=await supabase.from("meals").select("id,name,scheduled_time,position").eq("diet_id",d.id).order("position",{ascending:true});const ml=(m||[]) as Meal[];setMeals(ml);if(ml.length){const {data:i}=await supabase.from("meal_items").select("id,meal_id,food_name,quantity,unit,calories,protein_g,carbs_g,fats_g").in("meal_id",ml.map(x=>x.id)).order("position",{ascending:true});setItems((i||[]) as any[])}}setLoading(false)}
  if(loading)return <Loader2 className="animate-spin"/>;if(!diet)return <Empty title="Nenhuma dieta liberada" text="Seu personal ainda não publicou uma dieta ativa."/>;
  return <><Title eyebrow="Plano alimentar" title={diet.name}/><div className="mb-6 grid grid-cols-2 gap-2 md:grid-cols-4"><Macro label="KCAL" value={diet.daily_calories?`${diet.daily_calories}`:"—"}/><Macro label="PROTEÍNA" value={diet.protein_g?`${diet.protein_g}g`:"—"}/><Macro label="CARBO" value={diet.carbs_g?`${diet.carbs_g}g`:"—"}/><Macro label="GORDURA" value={diet.fats_g?`${diet.fats_g}g`:"—"}/></div><div className="space-y-4">{meals.map(m=>{const mealItems=items.filter(i=>i.meal_id===m.id);const kcal=mealItems.reduce((s,i)=>s+(Number(i.calories)||0),0);const p=mealItems.reduce((s,i)=>s+(Number((i as any).protein_g)||0),0);const c=mealItems.reduce((s,i)=>s+(Number((i as any).carbs_g)||0),0);const f=mealItems.reduce((s,i)=>s+(Number((i as any).fats_g)||0),0);return <div className="border border-border bg-card" key={m.id}><div className="flex items-center justify-between border-b border-border p-4"><div><b>{m.name}</b><p className="text-xs text-primary">{m.scheduled_time?.slice(0,5)||"Horário livre"}</p></div><div className="text-right text-xs"><b>{kcal} kcal</b><p className="text-muted-foreground">P {p.toFixed(0)}g · C {c.toFixed(0)}g · G {f.toFixed(0)}g</p></div></div>{mealItems.map(i=><div className="flex items-center justify-between border-b border-border/70 p-4 last:border-0" key={i.id}><span className="text-sm">{i.food_name}</span><b className="text-sm">{Number(i.quantity).toLocaleString("pt-BR")} {i.unit}</b></div>)}</div>})}</div></>
}

function StudentCheckin({student}:{student:Student}){
  const [weight,setWeight]=useState("");
  const [adherence,setAdherence]=useState(8);
  const [energy,setEnergy]=useState(8);
  const [sleep,setSleep]=useState(8);
  const [pain,setPain]=useState(0);
  const [notes,setNotes]=useState("");
  const [photos,setPhotos]=useState<File[]>([]);
  const [busy,setBusy]=useState(false);
  const [sent,setSent]=useState(false);
  const [error,setError]=useState("");
  async function submit(e:React.FormEvent){
    e.preventDefault();
    setBusy(true); setError("");
    const {data:{user}}=await supabase.auth.getUser();
    if(!user){setError("Sua sessão expirou. Entre novamente.");setBusy(false);return;}
    const {data:checkin,error:insertError}=await supabase.from("check_ins").insert({student_id:student.id,weight:Number(weight),adherence_score:adherence,energy_score:energy,sleep_score:sleep,pain_score:pain,notes,status:"pendente"}).select("id").single();
    if(insertError||!checkin){setError(insertError?.message||"Não foi possível enviar o check-in.");setBusy(false);return;}
    const paths:string[]=[];
    for(const file of photos){
      const ext=file.name.split(".").pop()?.toLowerCase()||"jpg";
      const path=`${user.id}/${student.id}/${checkin.id}/${crypto.randomUUID()}.${ext}`;
      const {error:uploadError}=await supabase.storage.from("check-in-photos").upload(path,file,{contentType:file.type||"image/jpeg",upsert:false});
      if(!uploadError) paths.push(path);
    }
    if(paths.length){await supabase.from("check_ins").update({photo_paths:paths}).eq("id",checkin.id);} 
    setBusy(false);setSent(true);
  }
  function addPhotos(files:FileList|null){if(!files)return;const selected=Array.from(files).filter(f=>f.type.startsWith("image/")&&f.size<=8*1024*1024).slice(0,4);setPhotos(selected);}
  if(sent)return <div className="mx-auto max-w-lg py-16 text-center"><div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center bg-primary"><Check className="text-primary-foreground"/></div><h1 className="text-3xl font-black uppercase">Check-in enviado</h1><p className="mt-3 text-muted-foreground">Seu personal recebeu suas respostas e suas fotos.</p></div>;
  return <><Title eyebrow="Acompanhamento semanal" title="Como foi sua semana?"/><form onSubmit={submit} className="mx-auto max-w-2xl space-y-5"><label className="field">Peso atual (kg)<Input required type="number" step="0.1" value={weight} onChange={e=>setWeight(e.target.value)} placeholder="Ex.: 68,4"/></label><Range label="Adesão à dieta" value={adherence} setValue={setAdherence}/><Range label="Nível de energia" value={energy} setValue={setEnergy}/><Range label="Qualidade do sono" value={sleep} setValue={setSleep}/><Range label="Dor ou desconforto" value={pain} setValue={setPain} min={0}/><label className="field">Observações<textarea className="min-h-28 border border-border bg-card p-3 text-sm" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Como você se sentiu?"/></label><div className="border border-border bg-card p-4"><div className="flex items-center justify-between gap-3"><div><b className="uppercase">Fotos do check-in</b><p className="mt-1 text-xs text-muted-foreground">Até 4 fotos · JPG/PNG · máximo 8 MB cada.</p></div><label className="cursor-pointer"><span className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-bold text-primary-foreground"><Camera/> Adicionar fotos</span><input className="hidden" type="file" accept="image/*" multiple onChange={e=>addPhotos(e.target.files)}/></label></div>{photos.length>0&&<div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{photos.map((file,i)=><div key={`${file.name}-${i}`} className="relative aspect-square overflow-hidden border border-border"><img src={URL.createObjectURL(file)} alt={`Foto ${i+1}`} className="h-full w-full object-cover"/><button type="button" className="absolute right-1 top-1 bg-black/70 p-1 text-white" onClick={()=>setPhotos(p=>p.filter((_,idx)=>idx!==i))}><X className="h-4 w-4"/></button></div>)}</div>}</div>{error&&<div className="border border-primary/50 bg-primary/10 p-3 text-sm">{error}</div>}<Button className="h-12 w-full" disabled={busy}>{busy?<Loader2 className="animate-spin"/>:<><ArrowUpRight/> Enviar check-in</>}</Button></form></>
}

function StudentEvolution({student}:{student:Student}){
  const [rows,setRows]=useState<any[]>([]);const [photoUrls,setPhotoUrls]=useState<string[]>([]);const [measurements,setMeasurements]=useState<any[]>([]);
  useEffect(()=>{void(async()=>{const {data}=await supabase.from("check_ins").select("id,submitted_at,weight,adherence_score,photo_paths,personal_feedback").eq("student_id",student.id).not("weight","is",null).order("submitted_at",{ascending:false}).limit(12);const list=data||[];setRows(list);const latest=list.find(r=>Array.isArray(r.photo_paths)&&r.photo_paths.length);if(latest){const signed=await Promise.all((latest.photo_paths as string[]).map(async(path)=>{const {data}=await supabase.storage.from("check-in-photos").createSignedUrl(path,3600);return data?.signedUrl||null;}));setPhotoUrls(signed.filter(Boolean) as string[])}const {data:evals}=await supabase.from("evaluations").select("id,evaluated_at,notes,body_measurements(*)").eq("student_id",student.id).order("evaluated_at",{ascending:false}).limit(1);setMeasurements(evals?.[0]?.body_measurements||[])})()},[student.id]);
  const current=rows[0]?.weight,initial=rows[rows.length-1]?.weight;
  const latest=measurements[0];
  return <><Title eyebrow="Minha evolução" title="Consistência que aparece"/><div className="stats-grid"><Stat label="Peso inicial" value={initial?`${Number(initial).toFixed(1).replace('.',',')} kg`:"—"} delta="Primeiro check-in"/><Stat label="Peso atual" value={current?`${Number(current).toFixed(1).replace('.',',')} kg`:"—"} delta="Último registro"/><Stat label="Variação" value={current&&initial?`${(Number(current)-Number(initial)).toFixed(1).replace('.',',')} kg`:"—"} delta="Desde o primeiro check-in"/><Stat label="Check-ins" value={String(rows.length)} delta="Registros"/></div>{latest&&<div className="mt-8 border border-border bg-card p-5"><h2 className="mb-4 font-black uppercase">Últimas medidas</h2><div className="grid grid-cols-2 gap-3 sm:grid-cols-5">{[["Cintura",latest.waist],["Abdômen",latest.abdomen],["Quadril",latest.hip],["Peito",latest.chest],["Gordura",latest.body_fat]].map(([label,value])=><div className="border border-border p-3" key={String(label)}><p className="text-[10px] font-bold text-muted-foreground">{label}</p><b>{value!=null?`${value} ${label==="Gordura"?"%":"cm"}`:"—"}</b></div>)}</div></div>}{photoUrls.length>0&&<div className="mt-8 border border-border bg-card p-5"><h2 className="mb-4 font-black uppercase">Fotos mais recentes</h2><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{photoUrls.map(url=><a href={url} target="_blank" rel="noreferrer" key={url} className="aspect-square overflow-hidden border border-border"><img src={url} alt="Evolução" className="h-full w-full object-cover"/></a>)}</div></div>}<div className="mt-8 border border-border bg-card p-5">{rows[0]?.personal_feedback&&<div className="mb-5 border-b border-border pb-5"><p className="text-[10px] font-bold uppercase tracking-widest text-primary">Resposta do personal</p><p className="mt-2 text-sm">{rows[0].personal_feedback}</p></div>}<h2 className="mb-5 font-black uppercase">Histórico de peso</h2>{rows.length?rows.map((r,i)=><div key={i} className="flex items-center justify-between border-b border-border py-3 last:border-0"><span className="text-sm">{new Date(r.submitted_at).toLocaleDateString("pt-BR")}</span><b>{Number(r.weight).toFixed(1).replace('.',',')} kg</b><span className="text-xs text-muted-foreground">Adesão {r.adherence_score}/10</span></div>):<p className="text-sm text-muted-foreground">Envie seu primeiro check-in para começar sua evolução.</p>}</div></>
}

function StudentMessages({student}:{student:Student}){
  const [messages,setMessages]=useState<any[]>([]);const [text,setText]=useState("");const [myId,setMyId]=useState("");const [personalId,setPersonalId]=useState("");const [loading,setLoading]=useState(true);const [error,setError]=useState("");
  useEffect(()=>{let channel:any;void(async()=>{const {data:{user}}=await supabase.auth.getUser();if(!user){setLoading(false);return}setMyId(user.id);const {data:p}=await supabase.from("students").select("personal_id").eq("id",student.id).maybeSingle();const pid=p?.personal_id||"";setPersonalId(pid);if(!pid){setLoading(false);return}const {data,error:e}=await supabase.from("messages").select("id,sender_id,recipient_id,body,created_at,read_at").or(`and(sender_id.eq.${user.id},recipient_id.eq.${pid}),and(sender_id.eq.${pid},recipient_id.eq.${user.id})`).order("created_at",{ascending:true});if(e)setError(e.message);setMessages(data||[]);await supabase.from("messages").update({read_at:new Date().toISOString()}).eq("sender_id",pid).eq("recipient_id",user.id).is("read_at",null);channel=supabase.channel(`student-chat-${student.id}`).on("postgres_changes",{event:"*",schema:"public",table:"messages",filter:`recipient_id=eq.${user.id}`},payload=>{if((payload.new as any)?.sender_id===pid){setMessages(prev=>prev.some(m=>m.id===(payload.new as any).id)?prev:[...prev,(payload.new as any)]);void supabase.from("messages").update({read_at:new Date().toISOString()}).eq("id",(payload.new as any).id)}}).subscribe();setLoading(false)})();return()=>{if(channel)supabase.removeChannel(channel)}},[student.id]);
  async function send(e:React.FormEvent){e.preventDefault();if(!text.trim()||!personalId||!myId)return;const {data,error:err}=await supabase.from("messages").insert({sender_id:myId,recipient_id:personalId,body:text.trim()}).select("id,sender_id,recipient_id,body,created_at,read_at").single();if(err)setError(err.message);else if(data){setMessages(prev=>[...prev,data]);setText("")}}
  return <><Title eyebrow="Contato direto" title="Mensagens"/><div className="mx-auto max-w-3xl border border-border bg-card"><div className="border-b border-border p-4"><p className="text-xs text-muted-foreground">Seu personal</p><b>{personalId?"Conversa privada":"Nenhum personal vinculado"}</b></div>{error&&<div className="border-b border-primary/30 bg-primary/10 p-3 text-sm">{error}</div>}<div className="flex min-h-80 flex-col gap-3 p-4">{loading?<Loader2 className="m-auto animate-spin"/>:messages.length?messages.map(m=><div key={m.id} className={cn("max-w-[80%] p-3 text-sm",m.sender_id===myId?"ml-auto bg-primary text-primary-foreground":"bg-secondary")}>{m.body}</div>):<div className="m-auto text-center text-sm text-muted-foreground"><MessageCircle className="mx-auto mb-3"/>Nenhuma mensagem ainda.</div>}</div><form className="flex gap-2 border-t border-border p-3" onSubmit={send}><Input value={text} onChange={e=>setText(e.target.value)} placeholder="Escreva uma mensagem..." disabled={!personalId}/><Button disabled={!personalId||!text.trim()}>Enviar</Button></form></div></>
}

function Range({label,value,setValue,min=1}:{label:string;value:number;setValue:(n:number)=>void;min?:number}){return <label className="field">{label}<div className="flex items-center gap-3"><Input type="range" min={min} max="10" value={value} onChange={e=>setValue(Number(e.target.value))} className="px-0"/><b className="w-7 text-right">{value}</b></div></label>}
function Title({eyebrow,title}:{eyebrow:string;title:string}){return <div className="mb-7"><p className="mb-2 text-[11px] font-bold uppercase tracking-[.2em] text-primary">{eyebrow}</p><h1 className="text-3xl font-black uppercase leading-none md:text-4xl">{title}</h1></div>}
function Macro({label,value}:{label:string;value:string}){return <div className="border border-border bg-card p-4 text-center"><b className="text-xl">{value}</b><span className="mt-1 block text-[10px] font-bold text-muted-foreground">{label}</span></div>}
function Stat({label,value,delta}:{label:string;value:string;delta:string}){return <div className="stat"><span>{label}</span><b>{value}</b><small>{delta}</small></div>}
function Empty({title,text}:{title:string;text:string}){return <div className="mx-auto max-w-xl py-20 text-center"><Dumbbell className="mx-auto mb-5 text-primary"/><h1 className="text-2xl font-black uppercase">{title}</h1><p className="mt-3 text-sm text-muted-foreground">{text}</p></div>}
