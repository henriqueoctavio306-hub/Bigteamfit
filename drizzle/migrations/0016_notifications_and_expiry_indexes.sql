-- BIGTEAM V9: indexes supporting expiry/check-in notification queries.
CREATE INDEX IF NOT EXISTS idx_students_personal_expiry ON public.students(personal_id, plan_expires_at);
CREATE INDEX IF NOT EXISTS idx_students_user_expiry ON public.students(user_id, plan_expires_at);
CREATE INDEX IF NOT EXISTS idx_checkins_pending_student ON public.check_ins(status, student_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, read_at) WHERE read_at IS NULL;
