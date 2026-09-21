CREATE TYPE public.app_role AS ENUM ('personal', 'aluno');
CREATE TYPE public.student_status AS ENUM ('ativo', 'pausado', 'inativo');
CREATE TYPE public.record_status AS ENUM ('rascunho', 'ativo', 'arquivado');
CREATE TYPE public.checkin_status AS ENUM ('pendente', 'respondido', 'analisado');
CREATE TYPE public.payment_status AS ENUM ('pendente', 'pago', 'falhou', 'reembolsado');
CREATE TYPE public.payment_method AS ENUM ('pix', 'cartao');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  full_name text NOT NULL DEFAULT '',
  avatar_url text,
  phone text,
  birth_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'aluno',
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

CREATE POLICY "profiles_select_self_or_personal" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(), 'personal'));
CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_self_or_personal" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(), 'personal')) WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(), 'personal'));
CREATE POLICY "roles_select_self_or_personal" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'personal'));

CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  duration_months integer NOT NULL CHECK (duration_months > 0),
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.plans TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.plans TO authenticated;
GRANT ALL ON public.plans TO service_role;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans_public_read" ON public.plans FOR SELECT TO anon, authenticated USING (active = true OR public.has_role(auth.uid(), 'personal'));
CREATE POLICY "plans_personal_manage" ON public.plans FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'personal')) WITH CHECK (public.has_role(auth.uid(), 'personal'));

CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  personal_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  plan_id uuid REFERENCES public.plans(id) ON DELETE SET NULL,
  status public.student_status NOT NULL DEFAULT 'ativo',
  goal text,
  occupation text,
  training_experience text,
  injuries text,
  medications text,
  dietary_restrictions text,
  sleep_hours numeric(4,1),
  water_liters numeric(4,1),
  start_date date NOT NULL DEFAULT current_date,
  plan_expires_at date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "students_read_owner_or_personal" ON public.students FOR SELECT TO authenticated USING (user_id = auth.uid() OR personal_id = auth.uid() OR public.has_role(auth.uid(), 'personal'));
CREATE POLICY "students_personal_manage" ON public.students FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'personal')) WITH CHECK (public.has_role(auth.uid(), 'personal'));
CREATE POLICY "students_owner_update" ON public.students FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  personal_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  weekday smallint CHECK (weekday BETWEEN 0 AND 6),
  status public.record_status NOT NULL DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workouts TO authenticated;
GRANT ALL ON public.workouts TO service_role;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workouts_access" ON public.workouts FOR SELECT TO authenticated USING (personal_id = auth.uid() OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.user_id = auth.uid()));
CREATE POLICY "workouts_personal_manage" ON public.workouts FOR ALL TO authenticated USING (personal_id = auth.uid() OR public.has_role(auth.uid(), 'personal')) WITH CHECK (personal_id = auth.uid() OR public.has_role(auth.uid(), 'personal'));

CREATE TABLE public.workout_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id uuid NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  name text NOT NULL,
  muscle_group text,
  sets integer NOT NULL DEFAULT 3 CHECK (sets > 0),
  reps text NOT NULL DEFAULT '10-12',
  target_load numeric(8,2),
  target_rpe numeric(3,1),
  rest_seconds integer NOT NULL DEFAULT 60,
  advanced_method text,
  instructions text,
  position integer NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_exercises TO authenticated;
GRANT ALL ON public.workout_exercises TO service_role;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workout_exercises_access" ON public.workout_exercises FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.workouts w LEFT JOIN public.students s ON s.id = w.student_id WHERE w.id = workout_id AND (w.personal_id = auth.uid() OR s.user_id = auth.uid())));
CREATE POLICY "workout_exercises_personal_manage" ON public.workout_exercises FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.workouts w WHERE w.id = workout_id AND (w.personal_id = auth.uid() OR public.has_role(auth.uid(), 'personal')))) WITH CHECK (EXISTS (SELECT 1 FROM public.workouts w WHERE w.id = workout_id AND (w.personal_id = auth.uid() OR public.has_role(auth.uid(), 'personal'))));

CREATE TABLE public.workout_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  workout_id uuid NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  exercise_id uuid REFERENCES public.workout_exercises(id) ON DELETE SET NULL,
  performed_at timestamptz NOT NULL DEFAULT now(),
  set_number integer NOT NULL DEFAULT 1,
  reps integer,
  load numeric(8,2),
  rpe numeric(3,1),
  completed boolean NOT NULL DEFAULT false,
  notes text
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_logs TO authenticated;
GRANT ALL ON public.workout_logs TO service_role;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workout_logs_access" ON public.workout_logs FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND (s.user_id = auth.uid() OR s.personal_id = auth.uid())));
CREATE POLICY "workout_logs_student_write" ON public.workout_logs FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.user_id = auth.uid()));

CREATE TABLE public.diets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  personal_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  daily_calories integer,
  protein_g numeric(8,1),
  carbs_g numeric(8,1),
  fats_g numeric(8,1),
  water_liters numeric(4,1),
  status public.record_status NOT NULL DEFAULT 'ativo',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.diets TO authenticated;
GRANT ALL ON public.diets TO service_role;
ALTER TABLE public.diets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "diets_access" ON public.diets FOR SELECT TO authenticated USING (personal_id = auth.uid() OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.user_id = auth.uid()));
CREATE POLICY "diets_personal_manage" ON public.diets FOR ALL TO authenticated USING (personal_id = auth.uid() OR public.has_role(auth.uid(), 'personal')) WITH CHECK (personal_id = auth.uid() OR public.has_role(auth.uid(), 'personal'));

CREATE TABLE public.meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), diet_id uuid NOT NULL REFERENCES public.diets(id) ON DELETE CASCADE,
  name text NOT NULL, scheduled_time time, position integer NOT NULL DEFAULT 0, notes text
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meals TO authenticated; GRANT ALL ON public.meals TO service_role; ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meals_access" ON public.meals FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.diets d LEFT JOIN public.students s ON s.id=d.student_id WHERE d.id=diet_id AND (d.personal_id=auth.uid() OR s.user_id=auth.uid())));
CREATE POLICY "meals_personal_manage" ON public.meals FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.diets d WHERE d.id=diet_id AND (d.personal_id=auth.uid() OR public.has_role(auth.uid(),'personal')))) WITH CHECK (EXISTS (SELECT 1 FROM public.diets d WHERE d.id=diet_id AND (d.personal_id=auth.uid() OR public.has_role(auth.uid(),'personal'))));

CREATE TABLE public.meal_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), meal_id uuid NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  food_name text NOT NULL, quantity numeric(8,2) NOT NULL, unit text NOT NULL DEFAULT 'g', calories integer, protein_g numeric(8,1), carbs_g numeric(8,1), fats_g numeric(8,1), position integer NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meal_items TO authenticated; GRANT ALL ON public.meal_items TO service_role; ALTER TABLE public.meal_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meal_items_access" ON public.meal_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.meals m JOIN public.diets d ON d.id=m.diet_id LEFT JOIN public.students s ON s.id=d.student_id WHERE m.id=meal_id AND (d.personal_id=auth.uid() OR s.user_id=auth.uid())));
CREATE POLICY "meal_items_personal_manage" ON public.meal_items FOR ALL TO authenticated USING (public.has_role(auth.uid(),'personal')) WITH CHECK (public.has_role(auth.uid(),'personal'));

CREATE TABLE public.food_substitutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), meal_item_id uuid NOT NULL REFERENCES public.meal_items(id) ON DELETE CASCADE,
  food_name text NOT NULL, quantity numeric(8,2) NOT NULL, unit text NOT NULL DEFAULT 'g', calories integer, protein_g numeric(8,1), carbs_g numeric(8,1), fats_g numeric(8,1)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.food_substitutions TO authenticated; GRANT ALL ON public.food_substitutions TO service_role; ALTER TABLE public.food_substitutions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "food_substitutions_read" ON public.food_substitutions FOR SELECT TO authenticated USING (true);
CREATE POLICY "food_substitutions_personal_manage" ON public.food_substitutions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'personal')) WITH CHECK (public.has_role(auth.uid(),'personal'));

CREATE TABLE public.check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  submitted_at timestamptz NOT NULL DEFAULT now(), weight numeric(6,2), adherence_score smallint CHECK (adherence_score BETWEEN 1 AND 10), energy_score smallint CHECK (energy_score BETWEEN 1 AND 10), sleep_score smallint CHECK (sleep_score BETWEEN 1 AND 10), pain_score smallint CHECK (pain_score BETWEEN 0 AND 10), notes text, photo_paths text[] NOT NULL DEFAULT '{}', personal_feedback text, status public.checkin_status NOT NULL DEFAULT 'pendente', responded_at timestamptz
);
GRANT SELECT, INSERT, UPDATE ON public.check_ins TO authenticated; GRANT ALL ON public.check_ins TO service_role; ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "checkins_access" ON public.check_ins FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.students s WHERE s.id=student_id AND (s.user_id=auth.uid() OR s.personal_id=auth.uid())));
CREATE POLICY "checkins_student_insert" ON public.check_ins FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.students s WHERE s.id=student_id AND s.user_id=auth.uid()));
CREATE POLICY "checkins_personal_update" ON public.check_ins FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.students s WHERE s.id=student_id AND s.personal_id=auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.students s WHERE s.id=student_id AND s.personal_id=auth.uid()));

CREATE TABLE public.evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE, evaluator_id uuid NOT NULL REFERENCES public.profiles(id), evaluated_at date NOT NULL DEFAULT current_date, notes text, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evaluations TO authenticated; GRANT ALL ON public.evaluations TO service_role; ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "evaluations_access" ON public.evaluations FOR SELECT TO authenticated USING (evaluator_id=auth.uid() OR EXISTS (SELECT 1 FROM public.students s WHERE s.id=student_id AND s.user_id=auth.uid()));
CREATE POLICY "evaluations_personal_manage" ON public.evaluations FOR ALL TO authenticated USING (evaluator_id=auth.uid() OR public.has_role(auth.uid(),'personal')) WITH CHECK (evaluator_id=auth.uid() OR public.has_role(auth.uid(),'personal'));

CREATE TABLE public.body_measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), evaluation_id uuid NOT NULL REFERENCES public.evaluations(id) ON DELETE CASCADE,
  weight numeric(6,2), body_fat numeric(5,2), arm_left numeric(5,2), arm_right numeric(5,2), waist numeric(5,2), abdomen numeric(5,2), hip numeric(5,2), thigh_left numeric(5,2), thigh_right numeric(5,2), chest numeric(5,2)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.body_measurements TO authenticated; GRANT ALL ON public.body_measurements TO service_role; ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "measurements_access" ON public.body_measurements FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.evaluations e LEFT JOIN public.students s ON s.id=e.student_id WHERE e.id=evaluation_id AND (e.evaluator_id=auth.uid() OR s.user_id=auth.uid())));
CREATE POLICY "measurements_personal_manage" ON public.body_measurements FOR ALL TO authenticated USING (public.has_role(auth.uid(),'personal')) WITH CHECK (public.has_role(auth.uid(),'personal'));

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE, plan_id uuid NOT NULL REFERENCES public.plans(id), amount_cents integer NOT NULL CHECK(amount_cents>=0), method public.payment_method NOT NULL, status public.payment_status NOT NULL DEFAULT 'pendente', due_date date NOT NULL, paid_at timestamptz, external_reference text, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated; GRANT ALL ON public.payments TO service_role; ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_access" ON public.payments FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'personal') OR EXISTS (SELECT 1 FROM public.students s WHERE s.id=student_id AND s.user_id=auth.uid()));
CREATE POLICY "payments_personal_manage" ON public.payments FOR ALL TO authenticated USING (public.has_role(auth.uid(),'personal')) WITH CHECK (public.has_role(auth.uid(),'personal'));

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, title text NOT NULL, body text NOT NULL, read_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.notifications TO authenticated; GRANT ALL ON public.notifications TO service_role; ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_own" ON public.notifications FOR SELECT TO authenticated USING (user_id=auth.uid());
CREATE POLICY "notifications_own_update" ON public.notifications FOR UPDATE TO authenticated USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, body text NOT NULL CHECK(length(body)>0), read_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated; GRANT ALL ON public.messages TO service_role; ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_participants_read" ON public.messages FOR SELECT TO authenticated USING (sender_id=auth.uid() OR recipient_id=auth.uid());
CREATE POLICY "messages_sender_insert" ON public.messages FOR INSERT TO authenticated WITH CHECK (sender_id=auth.uid());
CREATE POLICY "messages_recipient_update" ON public.messages FOR UPDATE TO authenticated USING (recipient_id=auth.uid()) WITH CHECK (recipient_id=auth.uid());
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

CREATE INDEX idx_students_personal ON public.students(personal_id, status);
CREATE INDEX idx_workouts_student ON public.workouts(student_id, status);
CREATE INDEX idx_logs_student_date ON public.workout_logs(student_id, performed_at DESC);
CREATE INDEX idx_checkins_student_date ON public.check_ins(student_id, submitted_at DESC);
CREATE INDEX idx_messages_participants ON public.messages(sender_id, recipient_id, created_at DESC);