ALTER TABLE public.students
  ADD COLUMN full_name text,
  ADD COLUMN email text,
  ADD COLUMN phone text,
  ADD COLUMN birth_date date,
  ADD COLUMN sex text,
  ADD COLUMN height_cm numeric(5,2),
  ADD COLUMN weight_kg numeric(6,2),
  ADD COLUMN weekly_frequency smallint,
  ADD COLUMN training_location text,
  ADD COLUMN available_equipment text,
  ADD COLUMN sports_history text,
  ADD COLUMN restrictions text;

ALTER TABLE public.students
  ADD CONSTRAINT students_full_name_length CHECK (full_name IS NULL OR char_length(trim(full_name)) BETWEEN 2 AND 120),
  ADD CONSTRAINT students_email_length CHECK (email IS NULL OR char_length(email) <= 255),
  ADD CONSTRAINT students_phone_length CHECK (phone IS NULL OR char_length(phone) <= 30),
  ADD CONSTRAINT students_sex_value CHECK (sex IS NULL OR sex IN ('feminino', 'masculino', 'outro', 'nao_informado')),
  ADD CONSTRAINT students_height_range CHECK (height_cm IS NULL OR height_cm BETWEEN 50 AND 260),
  ADD CONSTRAINT students_weight_range CHECK (weight_kg IS NULL OR weight_kg BETWEEN 20 AND 500),
  ADD CONSTRAINT students_frequency_range CHECK (weekly_frequency IS NULL OR weekly_frequency BETWEEN 1 AND 14);

CREATE INDEX students_personal_id_idx ON public.students(personal_id);
CREATE INDEX students_personal_status_idx ON public.students(personal_id, status);
CREATE INDEX students_personal_name_idx ON public.students(personal_id, full_name);

DROP POLICY "students_read_owner_or_personal" ON public.students;
DROP POLICY "students_personal_manage" ON public.students;
DROP POLICY "students_owner_update" ON public.students;

CREATE POLICY "students_read_owner_or_assigned_personal"
ON public.students FOR SELECT TO authenticated
USING (user_id = auth.uid() OR personal_id = auth.uid());

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

CREATE POLICY "students_owner_update"
ON public.students FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid() AND personal_id IS NOT DISTINCT FROM personal_id);