CREATE TABLE IF NOT EXISTS public.workout_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  personal_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  duration_weeks integer NOT NULL DEFAULT 4 CHECK (duration_weeks BETWEEN 1 AND 52),
  goal text,
  status public.record_status NOT NULL DEFAULT 'rascunho',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_programs TO authenticated;
GRANT ALL ON public.workout_programs TO service_role;
ALTER TABLE public.workout_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workout_programs_access" ON public.workout_programs FOR SELECT TO authenticated
USING (personal_id = auth.uid() OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.user_id = auth.uid()));
CREATE POLICY "workout_programs_personal_manage" ON public.workout_programs FOR ALL TO authenticated
USING (personal_id = auth.uid() AND public.has_role(auth.uid(), 'personal'))
WITH CHECK (personal_id = auth.uid() AND public.has_role(auth.uid(), 'personal'));

CREATE TABLE IF NOT EXISTS public.workout_weeks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.workout_programs(id) ON DELETE CASCADE,
  week_number integer NOT NULL CHECK (week_number > 0),
  name text NOT NULL,
  focus text,
  rpe_min numeric(3,1),
  rpe_max numeric(3,1),
  notes text,
  UNIQUE(program_id, week_number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_weeks TO authenticated;
GRANT ALL ON public.workout_weeks TO service_role;
ALTER TABLE public.workout_weeks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workout_weeks_access" ON public.workout_weeks FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.workout_programs p WHERE p.id = program_id AND (p.personal_id = auth.uid() OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = p.student_id AND s.user_id = auth.uid()))));
CREATE POLICY "workout_weeks_personal_manage" ON public.workout_weeks FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.workout_programs p WHERE p.id = program_id AND p.personal_id = auth.uid() AND public.has_role(auth.uid(), 'personal')))
WITH CHECK (EXISTS (SELECT 1 FROM public.workout_programs p WHERE p.id = program_id AND p.personal_id = auth.uid() AND public.has_role(auth.uid(), 'personal')));

CREATE TABLE IF NOT EXISTS public.workout_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  personal_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  goal text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_templates TO authenticated;
GRANT ALL ON public.workout_templates TO service_role;
ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workout_templates_owner" ON public.workout_templates FOR ALL TO authenticated
USING (personal_id = auth.uid() AND public.has_role(auth.uid(), 'personal'))
WITH CHECK (personal_id = auth.uid() AND public.has_role(auth.uid(), 'personal'));

CREATE TABLE IF NOT EXISTS public.workout_template_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.workout_templates(id) ON DELETE CASCADE,
  name text NOT NULL,
  muscle_group text,
  sets integer NOT NULL DEFAULT 3 CHECK (sets > 0),
  reps text NOT NULL DEFAULT '8-12',
  target_load numeric(8,2),
  target_rpe numeric(3,1),
  rest_seconds integer NOT NULL DEFAULT 90,
  advanced_method text,
  instructions text,
  position integer NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_template_exercises TO authenticated;
GRANT ALL ON public.workout_template_exercises TO service_role;
ALTER TABLE public.workout_template_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workout_template_exercises_owner" ON public.workout_template_exercises FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.workout_templates t WHERE t.id = template_id AND t.personal_id = auth.uid() AND public.has_role(auth.uid(), 'personal')))
WITH CHECK (EXISTS (SELECT 1 FROM public.workout_templates t WHERE t.id = template_id AND t.personal_id = auth.uid() AND public.has_role(auth.uid(), 'personal')));

ALTER TABLE public.workouts ADD COLUMN IF NOT EXISTS program_id uuid REFERENCES public.workout_programs(id) ON DELETE SET NULL;
ALTER TABLE public.workouts ADD COLUMN IF NOT EXISTS week_id uuid REFERENCES public.workout_weeks(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_workout_programs_student ON public.workout_programs(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workout_weeks_program ON public.workout_weeks(program_id, week_number);
CREATE INDEX IF NOT EXISTS idx_workout_templates_personal ON public.workout_templates(personal_id, name);
CREATE INDEX IF NOT EXISTS idx_workouts_program_week ON public.workouts(program_id, week_id);
