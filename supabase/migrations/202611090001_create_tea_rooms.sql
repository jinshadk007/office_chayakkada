-- The website talks to /api/room; only that server uses the Supabase secret.
-- Room links act as invitations. No public table reads or writes are allowed.
BEGIN;
CREATE TABLE IF NOT EXISTS public.tea_rooms (
  id uuid PRIMARY KEY,
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  revision integer NOT NULL DEFAULT 0 CHECK (revision >= 0)
);
ALTER TABLE public.tea_rooms ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.tea_rooms FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.tea_rooms TO service_role;
COMMIT;
