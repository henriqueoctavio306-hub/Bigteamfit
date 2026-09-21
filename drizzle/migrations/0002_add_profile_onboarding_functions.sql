CREATE OR REPLACE FUNCTION public.ensure_my_profile(_full_name text DEFAULT '')
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result public.profiles;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  INSERT INTO public.profiles (id, full_name)
  VALUES (auth.uid(), COALESCE(NULLIF(trim(_full_name), ''), 'Atleta BIGTEAM'))
  ON CONFLICT (id) DO UPDATE SET full_name = COALESCE(NULLIF(trim(EXCLUDED.full_name), ''), profiles.full_name), updated_at = now()
  RETURNING * INTO result;
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'aluno') ON CONFLICT DO NOTHING;
  RETURN result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.ensure_my_profile(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.assign_user_role(_user_id uuid, _role public.app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'personal') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  INSERT INTO public.user_roles(user_id, role) VALUES (_user_id, _role);
END;
$$;
GRANT EXECUTE ON FUNCTION public.assign_user_role(uuid, public.app_role) TO authenticated;