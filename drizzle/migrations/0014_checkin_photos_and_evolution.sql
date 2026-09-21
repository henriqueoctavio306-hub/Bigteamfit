-- BIGTEAM V7: weekly check-in photos and evolution support.
-- The bucket is private; object policies in 0001 restrict access to the owner/personal.
INSERT INTO storage.buckets (id, name, public)
VALUES ('check-in-photos', 'check-in-photos', false)
ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_evaluations_student_date ON public.evaluations(student_id, evaluated_at DESC);
CREATE INDEX IF NOT EXISTS idx_body_measurements_evaluation ON public.body_measurements(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_checkins_status_student ON public.check_ins(student_id, status, submitted_at DESC);
