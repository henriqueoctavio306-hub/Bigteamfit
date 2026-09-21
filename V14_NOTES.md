BIGTEAM V14 — Production security hardening

- Tightened profile visibility to self/assigned-student scope.
- Hardened student ownership/billing fields against student-side changes.
- Restricted evaluations and body measurements to the assigned Personal.
- Restricted payments to the assigned Personal.
- Restricted diet templates and nested template records to their owner.
- Restricted personal food management to the food owner.
- Added supporting indexes for expiry/evolution/payment queries.

Migration: drizzle/migrations/0018_security_hardening.sql

Apply migrations with the project's configured Drizzle/Supabase workflow before production use.
