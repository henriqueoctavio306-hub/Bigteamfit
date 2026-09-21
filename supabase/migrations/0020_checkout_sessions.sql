create table if not exists public.checkout_sessions (
  id uuid primary key default gen_random_uuid(),
  payment_intent_id uuid not null references public.payment_intents(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  provider text not null,
  checkout_url text,
  provider_session_id text,
  status text not null default 'created' check (status in ('created','opened','completed','expired','cancelled')),
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  completed_at timestamptz
);
create index if not exists checkout_sessions_student_idx on public.checkout_sessions(student_id, created_at desc);
alter table public.checkout_sessions enable row level security;
drop policy if exists checkout_sessions_student_read on public.checkout_sessions;
create policy checkout_sessions_student_read on public.checkout_sessions for select using (exists (select 1 from public.students s where s.id = checkout_sessions.student_id and (s.profile_id = auth.uid() or s.personal_id = auth.uid())));
create table if not exists public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  processed boolean not null default false,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(provider, provider_event_id)
);
create index if not exists payment_webhook_events_processed_idx on public.payment_webhook_events(processed, created_at);
