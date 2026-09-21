CREATE OR REPLACE FUNCTION public.create_student_record(_student jsonb)
RETURNS public.students
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _profile_id uuid := gen_random_uuid();
  _result public.students;
  _name text := trim(COALESCE(_student->>'full_name', ''));
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'personal') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF char_length(_name) < 2 OR char_length(_name) > 120 THEN
    RAISE EXCEPTION 'Invalid full name';
  END IF;

  INSERT INTO public.profiles (id, full_name, phone, birth_date)
  VALUES (
    _profile_id,
    _name,
    NULLIF(trim(_student->>'phone'), ''),
    NULLIF(_student->>'birth_date', '')::date
  );

  INSERT INTO public.students (
    user_id, personal_id, plan_id, status, full_name, email, phone, birth_date,
    sex, height_cm, weight_kg, goal, training_experience, weekly_frequency,
    training_location, available_equipment, sports_history, restrictions,
    injuries, notes, start_date, plan_expires_at
  ) VALUES (
    _profile_id,
    auth.uid(),
    NULLIF(_student->>'plan_id', '')::uuid,
    COALESCE(NULLIF(_student->>'status', '')::public.student_status, 'ativo'),
    _name,
    NULLIF(lower(trim(_student->>'email')), ''),
    NULLIF(trim(_student->>'phone'), ''),
    NULLIF(_student->>'birth_date', '')::date,
    NULLIF(_student->>'sex', ''),
    NULLIF(_student->>'height_cm', '')::numeric,
    NULLIF(_student->>'weight_kg', '')::numeric,
    NULLIF(trim(_student->>'goal'), ''),
    NULLIF(trim(_student->>'training_experience'), ''),
    NULLIF(_student->>'weekly_frequency', '')::smallint,
    NULLIF(trim(_student->>'training_location'), ''),
    NULLIF(trim(_student->>'available_equipment'), ''),
    NULLIF(trim(_student->>'sports_history'), ''),
    NULLIF(trim(_student->>'restrictions'), ''),
    NULLIF(trim(_student->>'injuries'), ''),
    NULLIF(trim(_student->>'notes'), ''),
    COALESCE(NULLIF(_student->>'start_date', '')::date, current_date),
    NULLIF(_student->>'plan_expires_at', '')::date
  ) RETURNING * INTO _result;

  RETURN _result;
END;
$$;

REVOKE ALL ON FUNCTION public.create_student_record(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_student_record(jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_student_record(jsonb) TO authenticated;