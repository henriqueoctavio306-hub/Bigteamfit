import { useEffect, useMemo, useState } from "react";
import { Check, CheckCheck, Loader2, MessageCircle, Search, Send, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

type Mode = "personal" | "aluno";
type Contact = { id: string; userId: string; name: string; avatarUrl: string | null; unread: number; lastMessage: string; lastAt: string | null };
type Message = { id: string; sender_id: string; recipient_id: string; body: string; read_at: string | null; created_at: string };

export function ChatModule({ mode }: { mode: Mode }) {
  const [userId, setUserId] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const selected = contacts.find(c => c.id === selectedId) || contacts[0];
  const filteredContacts = useMemo(() => contacts.filter(c => c.name.toLowerCase().includes(search.toLowerCase())), [contacts, search]);

  useEffect(() => {
    let active = true;
    void (async () => {
      setLoading(true);
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user || !active) { setLoading(false); return; }
      setUserId(auth.user.id);
      const next = mode === "personal" ? await loadPersonalContacts(auth.user.id) : await loadStudentContacts(auth.user.id);
      if (!active) return;
      setContacts(next);
      setSelectedId(prev => prev && next.some(c => c.id === prev) ? prev : next[0]?.id || "");
      setLoading(false);
    })();
    return () => { active = false; };
  }, [mode]);

  useEffect(() => {
    if (!selected) { setMessages([]); return; }
    let active = true;
    void loadConversation(userId, selected.userId).then(rows => { if (active) setMessages(rows); });
    const channel = supabase.channel(`bigteam-chat-${userId}-${selected.userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `sender_id=eq.${selected.userId}` }, payload => {
        const row = payload.new as Message;
        if (row.recipient_id !== userId) return;
        setMessages(prev => prev.some(m => m.id === row.id) ? prev : [...prev, row]);
        void markConversationRead(userId, selected.userId);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter: `recipient_id=eq.${userId}` }, payload => {
        const row = payload.new as Message;
        setMessages(prev => prev.map(m => m.id === row.id ? { ...m, read_at: row.read_at } : m));
      })
      .subscribe();
    void markConversationRead(userId, selected.userId);
    return () => { active = false; void supabase.removeChannel(channel); };
  }, [selected?.id, selected?.userId, userId]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || !selected || !userId || sending) return;
    setSending(true);
    const optimistic: Message = { id: crypto.randomUUID(), sender_id: userId, recipient_id: selected.userId, body, read_at: null, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, optimistic]);
    setText("");
    const { data, error } = await supabase.from("messages").insert({ sender_id: userId, recipient_id: selected.userId, body }).select("id,sender_id,recipient_id,body,read_at,created_at").single();
    if (error) setMessages(prev => prev.filter(m => m.id !== optimistic.id));
    else setMessages(prev => prev.map(m => m.id === optimistic.id ? data as Message : m));
    setSending(false);
    if (!error) setContacts(prev => prev.map(c => c.id === selected.id ? { ...c, lastMessage: body, lastAt: new Date().toISOString() } : c));
  }

  return <>
    <div className="mb-7"><p className="mb-2 text-[11px] font-bold uppercase tracking-[.2em] text-primary">Contato direto</p><h1 className="text-3xl font-black uppercase md:text-4xl">Mensagens</h1></div>
    <div className="grid min-h-[620px] overflow-hidden border border-border bg-card lg:grid-cols-[320px_1fr]">
      <aside className="border-b border-border lg:border-b-0 lg:border-r">
        <div className="border-b border-border p-4"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><Input value={search} onChange={e => setSearch(e.target.value)} className="pl-9" placeholder={mode === "personal" ? "Buscar aluno..." : "Buscar..."}/></div></div>
        <div className="max-h-[530px] overflow-y-auto">{loading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary"/></div> : filteredContacts.length ? filteredContacts.map(c => <button key={c.id} onClick={() => setSelectedId(c.id)} className={cn("flex w-full items-center gap-3 border-b border-border p-4 text-left hover:bg-secondary",selected?.id===c.id&&"bg-secondary")}><div className="avatar shrink-0">{initials(c.name)}</div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><b className="truncate text-sm">{c.name}</b>{c.unread>0&&<span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-black text-primary-foreground">{c.unread>9?"9+":c.unread}</span>}</div><p className="mt-1 truncate text-xs text-muted-foreground">{c.lastMessage || "Nenhuma mensagem ainda."}</p></div></button>) : <div className="p-8 text-center text-sm text-muted-foreground"><UserRound className="mx-auto mb-3"/>Nenhuma conversa encontrada.</div>}</div>
      </aside>
      <section className="flex min-h-[620px] flex-col">{selected ? <><header className="flex items-center gap-3 border-b border-border p-4"><div className="avatar">{initials(selected.name)}</div><div><b>{selected.name}</b><p className="text-xs text-primary">Conversa privada</p></div></header><div className="flex-1 space-y-3 overflow-y-auto p-4">{messages.length ? messages.map(m => <div key={m.id} className={cn("max-w-[82%] rounded-none p-3 text-sm",m.sender_id===userId?"ml-auto bg-primary text-primary-foreground":"bg-secondary")}><p className="whitespace-pre-wrap">{m.body}</p><div className={cn("mt-2 flex items-center justify-end gap-1 text-[10px]",m.sender_id===userId?"text-primary-foreground/70":"text-muted-foreground")}><span>{new Date(m.created_at).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</span>{m.sender_id===userId&&(m.read_at?<CheckCheck className="h-3 w-3"/>:<Check className="h-3 w-3"/>)}</div></div>) : <div className="m-auto max-w-sm text-center text-sm text-muted-foreground"><MessageCircle className="mx-auto mb-3 h-8 w-8 text-primary"/>Comece a conversa com {selected.name}.</div>}</div><form onSubmit={sendMessage} className="flex gap-2 border-t border-border p-3"><Input value={text} onChange={e=>setText(e.target.value)} placeholder="Escreva uma mensagem..." maxLength={2000}/><Button type="submit" disabled={!text.trim()||sending}>{sending?<Loader2 className="animate-spin"/>:<Send/>}<span className="hidden sm:inline">Enviar</span></Button></form></> : <div className="m-auto max-w-sm p-8 text-center text-sm text-muted-foreground"><MessageCircle className="mx-auto mb-3 h-10 w-10 text-primary"/>Selecione uma conversa para começar.</div>}</section>
    </div>
  </>;
}

async function loadPersonalContacts(userId: string): Promise<Contact[]> {
  const { data: students } = await supabase.from("students").select("id,user_id,full_name,personal_id").eq("personal_id", userId).order("full_name");
  return buildContacts(userId, (students || []).map(s => ({ id: s.id, userId: s.user_id, name: s.full_name || "Aluno", avatarUrl: null })));
}

async function loadStudentContacts(userId: string): Promise<Contact[]> {
  const { data: student } = await supabase.from("students").select("id,personal_id").eq("user_id", userId).maybeSingle();
  if (!student?.personal_id) return [];
  const { data: profile } = await supabase.from("profiles").select("id,full_name,avatar_url").eq("id", student.personal_id).maybeSingle();
  if (!profile) return [];
  return buildContacts(userId, [{ id: profile.id, userId: profile.id, name: profile.full_name || "Personal", avatarUrl: profile.avatar_url || null }]);
}

async function buildContacts(userId: string, raw: Array<{id:string;userId:string;name:string;avatarUrl:string|null}>): Promise<Contact[]> {
  if (!raw.length) return [];
  const ids = raw.map(x => x.userId);
  const { data: messages } = await supabase.from("messages").select("id,sender_id,recipient_id,body,read_at,created_at").or(`sender_id.eq.${userId},recipient_id.eq.${userId}`).order("created_at",{ascending:false}).limit(300);
  return raw.map(c => {
    const rows = (messages || []).filter(m => m.sender_id === c.userId || m.recipient_id === c.userId);
    const latest = rows[0];
    const unread = rows.filter(m => m.sender_id === c.userId && m.recipient_id === userId && !m.read_at).length;
    return { ...c, lastMessage: latest?.body || "", lastAt: latest?.created_at || null, unread };
  }).sort((a,b) => Number(new Date(b.lastAt || 0))-Number(new Date(a.lastAt || 0)));
}

async function loadConversation(userId: string, otherId: string) {
  const { data } = await supabase.from("messages").select("id,sender_id,recipient_id,body,read_at,created_at").or(`and(sender_id.eq.${userId},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${userId})`).order("created_at",{ascending:true});
  return (data || []) as Message[];
}

async function markConversationRead(userId: string, otherId: string) {
  await supabase.from("messages").update({ read_at: new Date().toISOString() }).eq("sender_id", otherId).eq("recipient_id", userId).is("read_at", null);
}

function initials(name: string) { return name.split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase() || "BT"; }
