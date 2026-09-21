-- BIGTEAM V16: provider-agnostic checkout/payment intents
create table if not exists public.payment_intents (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  plan_id uuid references public.plans(id) on delete set null,
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'BRL',
  provider text not null default 'manual',
  provider_payment_id text,
  status text not null default 'pending'
    check (status in ('pending','approved','rejected','cancelled','expired')),
  checkout_url text,
  expires_at timestamptz,
  paid_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payment_intents_student_idx
  on public.payment_intents(student_id, created_at desc);

create index if not exists payment_intents_status_idx
  on public.payment_intents(status, created_at desc);

alter table public.payment_intents enable row level security;

drop policy if exists payment_intents_student_read on public.payment_intents;
create policy payment_intents_student_read
on public.payment_intents for select
using (
  exists (
    select 1 from public.students s
    where s.id = payment_intents.student_id
      and (s.profile_id = auth.uid() or s.personal_id = auth.uid())
  )
);

drop policy if exists payment_intents_personal_insert on public.payment_intents;
create policy payment_intents_personal_insert
on public.payment_intents for insert
with check (
  exists (
    select 1 from public.students s
    where s.id = payment_intents.student_id
      and s.personal_id = auth.uid()
  )
);
