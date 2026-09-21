-- BIGTEAM production security hardening.
-- Personal users may manage only records belonging to their own student roster.
-- Students may read their own records but cannot change ownership, plan or status.

-- Profiles: do not expose every profile to every Personal.
DROP POLICY IF EXISTS "profiles_select_self_or_personal" ON public.profiles;
CREATE POLICY "profiles_select_self_or_assigned_personal"
ON public.profiles FOR SELECT TO authenticated
USING (
  id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.user_id = profiles.id AND s.personal_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "profiles_update_self_or_personal" ON public.profiles;
CREATE POLICY "profiles_update_self_or_assigned_personal"
ON public.profiles FOR UPDATE TO authenticated
USING (
  id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.user_id = profiles.id AND s.personal_id = auth.uid() AND public.has_role(auth.uid(), 'personal')
  )
)
WITH CHECK (id = auth.uid() OR id IN (
  SELECT s.user_id FROM public.students s WHERE s.personal_id = auth.uid() AND public.has_role(auth.uid(), 'personal')
));

-- Students: assigned Personal only; student cannot transfer themselves or alter billing state.
DROP POLICY IF EXISTS "students_assigned_personal_insert" ON public.students;
DROP POLICY IF EXISTS "students_assigned_personal_update" ON public.students;
DROP POLICY IF EXISTS "students_assigned_personal_delete" ON public.students;
CREATE POLICY "students_assigned_personal_insert"
ON public.students FOR INSERT TO authenticated
WITH CHECK (personal_id = auth.uid() AND public.has_role(auth.uid(), 'personal'));
CREATE POLICY "students_assigned_personal_update"
ON public.students FOR UPDATE TO authenticated
USING (personal_id = auth.uid() AND public.has_role(auth.uid(), 'personal'))
WITH CHECK (personal_id = auth.uid() AND public.has_role(auth.uid(), 'personal'));
CREATE POLICY "students_assigned_personal_delete"
ON public.students FOR DELETE TO authenticated
USING (personal_id = auth.uid() AND public.has_role(auth.uid(), 'personal'));

DROP POLICY IF EXISTS "students_owner_update" ON public.students;
CREATE POLICY "students_owner_update_safe"
ON public.students FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid() AND personal_id IS NOT NULL);

CREATE OR REPLACE FUNCTION public.prevent_student_scope_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'personal') THEN
    IF NEW.personal_id IS DISTINCT FROM OLD.personal_id
       OR NEW.plan_id IS DISTINCT FROM OLD.plan_id
       OR NEW.status IS DISTINCT FROM OLD.status
       OR NEW.plan_expires_at IS DISTINCT FROM OLD.plan_expires_at THEN
      RAISE EXCEPTION 'Students cannot change ownership or billing state';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_prevent_student_scope_change ON public.students;
CREATE TRIGGER trg_prevent_student_scope_change
BEFORE UPDATE ON public.students
FOR EACH ROW EXECUTE FUNCTION public.prevent_student_scope_change();

-- Evaluations and measurements: only the evaluator/assigned Personal may write.
DROP POLICY IF EXISTS "evaluations_personal_manage" ON public.evaluations;
CREATE POLICY "evaluations_personal_manage_own"
ON public.evaluations FOR ALL TO authenticated
USING (
  evaluator_id = auth.uid()
  AND public.has_role(auth.uid(), 'personal')
  AND EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.personal_id = auth.uid())
)
WITH CHECK (
  evaluator_id = auth.uid()
  AND public.has_role(auth.uid(), 'personal')
  AND EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.personal_id = auth.uid())
);

DROP POLICY IF EXISTS "measurements_personal_manage" ON public.body_measurements;
CREATE POLICY "measurements_personal_manage_own"
ON public.body_measurements FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.evaluations e
    JOIN public.students s ON s.id = e.student_id
    WHERE e.id = evaluation_id AND e.evaluator_id = auth.uid() AND s.personal_id = auth.uid() AND public.has_role(auth.uid(), 'personal')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.evaluations e
    JOIN public.students s ON s.id = e.student_id
    WHERE e.id = evaluation_id AND e.evaluator_id = auth.uid() AND s.personal_id = auth.uid() AND public.has_role(auth.uid(), 'personal')
  )
);

-- Payments: Personal may manage only their own students; student may only read their own payments.
DROP POLICY IF EXISTS "payments_personal_manage" ON public.payments;
CREATE POLICY "payments_personal_manage_own"
ON public.payments FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'personal')
  AND EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.personal_id = auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'personal')
  AND EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.personal_id = auth.uid())
);

-- Diet templates: owner-only, never every Personal.
DROP POLICY IF EXISTS "diet_templates_personal" ON public.diet_templates;
CREATE POLICY "diet_templates_owner"
ON public.diet_templates FOR ALL TO authenticated
USING (personal_id = auth.uid() AND public.has_role(auth.uid(), 'personal'))
WITH CHECK (personal_id = auth.uid() AND public.has_role(auth.uid(), 'personal'));

DROP POLICY IF EXISTS "diet_template_meals_personal" ON public.diet_template_meals;
CREATE POLICY "diet_template_meals_owner"
ON public.diet_template_meals FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.diet_templates t WHERE t.id = template_id AND t.personal_id = auth.uid() AND public.has_role(auth.uid(), 'personal')))
WITH CHECK (EXISTS (SELECT 1 FROM public.diet_templates t WHERE t.id = template_id AND t.personal_id = auth.uid() AND public.has_role(auth.uid(), 'personal')));

DROP POLICY IF EXISTS "diet_template_items_personal" ON public.diet_template_items;
CREATE POLICY "diet_template_items_owner"
ON public.diet_template_items FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.diet_template_meals m
  JOIN public.diet_templates t ON t.id = m.template_id
  WHERE m.id = template_meal_id AND t.personal_id = auth.uid() AND public.has_role(auth.uid(), 'personal')
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.diet_template_meals m
  JOIN public.diet_templates t ON t.id = m.template_id
  WHERE m.id = template_meal_id AND t.personal_id = auth.uid() AND public.has_role(auth.uid(), 'personal')
));

-- Foods: Personal can create/edit/delete only their own foods; global foods remain read-only.
DROP POLICY IF EXISTS "foods_personal_manage" ON public.foods;
CREATE POLICY "foods_personal_manage_own"
ON public.foods FOR ALL TO authenticated
USING (personal_id = auth.uid() AND public.has_role(auth.uid(), 'personal'))
WITH CHECK (personal_id = auth.uid() AND public.has_role(auth.uid(), 'personal'));

CREATE INDEX IF NOT EXISTS idx_students_personal_expiry ON public.students(personal_id, plan_expires_at);
CREATE INDEX IF NOT EXISTS idx_evaluations_student_date ON public.evaluations(student_id, evaluated_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_personal_due ON public.payments(student_id, due_date DESC);
