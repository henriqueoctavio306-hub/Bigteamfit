REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
REVOKE ALL ON FUNCTION public.ensure_my_profile(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_my_profile(text) TO authenticated;
REVOKE ALL ON FUNCTION public.assign_user_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_user_role(uuid, public.app_role) TO authenticated;