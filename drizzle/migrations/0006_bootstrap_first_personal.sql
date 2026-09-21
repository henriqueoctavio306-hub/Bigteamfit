CREATE OR REPLACE FUNCTION public.ensure_my_profile(_full_name text DEFAULT '')
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.profiles;
  initial_role public.app_role;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  PERFORM pg_advisory_xact_lock(9142026);

  INSERT INTO public.profiles (id, full_name)
  VALUES (auth.uid(), COALESCE(NULLIF(trim(_full_name), ''), 'Atleta BIGTEAM'))
  ON CONFLICT (id) DO UPDATE
  SET full_name = COALESCE(NULLIF(trim(EXCLUDED.full_name), ''), profiles.full_name),
      updated_at = now()
  RETURNING * INTO result;

  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()) THEN
    IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'personal') THEN
      initial_role := 'personal';
    ELSE
      initial_role := 'aluno';
    END IF;
    INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), initial_role);
  END IF;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_my_profile(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.ensure_my_profile(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.ensure_my_profile(text) TO authenticated;