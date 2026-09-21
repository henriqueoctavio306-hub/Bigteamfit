-- BIGTEAM V20: webhook processing audit + payment reconciliation helpers
create table if not exists public.payment_reconciliation_events (
  id uuid primary key default gen_random_uuid(),
  payment_intent_id uuid references public.payment_intents(id) on delete set null,
  provider text not null,
  provider_event_id text not null,
  provider_payment_id text,
  provider_status text,
  internal_status text,
  processed boolean not null default false,
  error_message text,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  unique(provider, provider_event_id)
);

create index if not exists payment_reconciliation_events_payment_idx
  on public.payment_reconciliation_events(payment_intent_id, created_at desc);

alter table public.payment_reconciliation_events enable row level security;

drop policy if exists payment_reconciliation_owner_read on public.payment_reconciliation_events;
create policy payment_reconciliation_owner_read
on public.payment_reconciliation_events for select
using (
  exists (
    select 1
    from public.payment_intents pi
    join public.students s on s.id = pi.student_id
    where pi.id = payment_reconciliation_events.payment_intent_id
      and (s.profile_id = auth.uid() or s.personal_id = auth.uid())
  )
);
