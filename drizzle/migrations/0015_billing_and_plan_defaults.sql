-- BIGTEAM billing defaults: plans defined by the consulting offer.
INSERT INTO public.plans (name, duration_months, price_cents, active)
VALUES
  ('MENSAL', 1, 22990, true),
  ('TRIMESTRAL', 3, 51990, true),
  ('SEMESTRAL', 6, 99990, true)
ON CONFLICT (name) DO UPDATE
SET duration_months = EXCLUDED.duration_months,
    price_cents = EXCLUDED.price_cents,
    active = true;

CREATE INDEX IF NOT EXISTS idx_payments_student_due ON public.payments(student_id, due_date DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status_due ON public.payments(status, due_date);
