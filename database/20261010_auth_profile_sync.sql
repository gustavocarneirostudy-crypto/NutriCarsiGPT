BEGIN;

CREATE FUNCTION public.sync_nutricionista_from_auth()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog
AS $body$
BEGIN
  INSERT INTO public.nutricionistas (auth_user_id, nome, email)
  VALUES (NEW.id::text, NEW.name, NEW.email)
  ON CONFLICT (auth_user_id) DO NOTHING;
  RETURN NEW;
END;
$body$;

REVOKE ALL ON FUNCTION public.sync_nutricionista_from_auth() FROM PUBLIC;

CREATE TRIGGER nutricarsi_create_profile
AFTER INSERT ON neon_auth."user"
FOR EACH ROW EXECUTE FUNCTION public.sync_nutricionista_from_auth();

INSERT INTO public.nutricionistas (auth_user_id, nome, email)
SELECT u.id::text, u.name, u.email
FROM neon_auth."user" u
WHERE NOT EXISTS (
  SELECT 1 FROM public.nutricionistas n WHERE n.auth_user_id = u.id::text
)
ON CONFLICT (auth_user_id) DO NOTHING;

COMMIT;
