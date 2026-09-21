-- BIGTEAM V10: real-time chat notification trigger.
-- Messages already use RLS and Supabase Realtime from the core migration.

CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, body)
  VALUES (
    NEW.recipient_id,
    'Nova mensagem',
    'Você recebeu uma nova mensagem na BIGTEAM.'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_message ON public.messages;
CREATE TRIGGER trg_notify_new_message
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_message();
