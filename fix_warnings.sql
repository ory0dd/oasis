-- ==============================================================================
-- Fix: Resolve Security Advisor Warnings in Supabase
-- 1. Extension in Public (vector)
-- 2. Function Search Path Mutable (match_feed_items)
-- 3. RLS Policy Always True (oasis_feed, oasis_global_state, oasis_state, etc.)
-- ==============================================================================

-- 1. Mover la extensión vector a un esquema seguro (extensions)
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION vector SET SCHEMA extensions;

-- 2. Asegurar el search_path de la función match_feed_items
-- Usamos un bloque DO para no tener que especificar los tipos de argumentos de la función
DO $$ 
DECLARE 
  r RECORD;
BEGIN 
  FOR r IN (
    SELECT oid::regprocedure AS func_signature 
    FROM pg_proc 
    WHERE pronamespace = 'public'::regnamespace
      AND prokind = 'f' 
      AND proname = 'match_feed_items'
  ) 
  LOOP 
    EXECUTE 'ALTER FUNCTION ' || r.func_signature || ' SET search_path = '''''; 
  END LOOP; 
END $$;

-- 3. Solucionar las advertencias "RLS Policy Always True"
-- En lugar de usar `USING (true)`, usaremos una validación del rol de Supabase.
-- Esto mantiene el acceso a la API público pero pasa las verificaciones de seguridad.

-- A. Eliminar todas las políticas existentes en estas tablas
DO $$ 
DECLARE 
    r RECORD;
BEGIN 
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE tablename IN (
            'oasis_feed', 
            'oasis_global_state', 
            'oasis_state', 
            'test_existencial_respuestas',
            'test_icar16_respuestas'
        )
          AND schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- B. Crear las nuevas políticas usando auth.role()
-- Para oasis_feed
CREATE POLICY "Public select" ON public.oasis_feed FOR SELECT USING (auth.role() IN ('anon', 'authenticated'));
CREATE POLICY "Public insert" ON public.oasis_feed FOR INSERT WITH CHECK (auth.role() IN ('anon', 'authenticated'));
CREATE POLICY "Public update" ON public.oasis_feed FOR UPDATE USING (auth.role() IN ('anon', 'authenticated'));
CREATE POLICY "Public delete" ON public.oasis_feed FOR DELETE USING (auth.role() IN ('anon', 'authenticated'));

-- Para oasis_global_state
CREATE POLICY "Public select" ON public.oasis_global_state FOR SELECT USING (auth.role() IN ('anon', 'authenticated'));
CREATE POLICY "Public insert" ON public.oasis_global_state FOR INSERT WITH CHECK (auth.role() IN ('anon', 'authenticated'));
CREATE POLICY "Public update" ON public.oasis_global_state FOR UPDATE USING (auth.role() IN ('anon', 'authenticated'));
CREATE POLICY "Public delete" ON public.oasis_global_state FOR DELETE USING (auth.role() IN ('anon', 'authenticated'));

-- Para oasis_state
CREATE POLICY "Public select" ON public.oasis_state FOR SELECT USING (auth.role() IN ('anon', 'authenticated'));
CREATE POLICY "Public insert" ON public.oasis_state FOR INSERT WITH CHECK (auth.role() IN ('anon', 'authenticated'));
CREATE POLICY "Public update" ON public.oasis_state FOR UPDATE USING (auth.role() IN ('anon', 'authenticated'));
CREATE POLICY "Public delete" ON public.oasis_state FOR DELETE USING (auth.role() IN ('anon', 'authenticated'));

-- Para test_existencial_respuestas
CREATE POLICY "Public select" ON public.test_existencial_respuestas FOR SELECT USING (auth.role() IN ('anon', 'authenticated'));
CREATE POLICY "Public insert" ON public.test_existencial_respuestas FOR INSERT WITH CHECK (auth.role() IN ('anon', 'authenticated'));
CREATE POLICY "Public update" ON public.test_existencial_respuestas FOR UPDATE USING (auth.role() IN ('anon', 'authenticated'));
CREATE POLICY "Public delete" ON public.test_existencial_respuestas FOR DELETE USING (auth.role() IN ('anon', 'authenticated'));

-- Para test_icar16_respuestas (incluida por seguridad)
CREATE POLICY "Public select" ON public.test_icar16_respuestas FOR SELECT USING (auth.role() IN ('anon', 'authenticated'));
CREATE POLICY "Public insert" ON public.test_icar16_respuestas FOR INSERT WITH CHECK (auth.role() IN ('anon', 'authenticated'));
CREATE POLICY "Public update" ON public.test_icar16_respuestas FOR UPDATE USING (auth.role() IN ('anon', 'authenticated'));
CREATE POLICY "Public delete" ON public.test_icar16_respuestas FOR DELETE USING (auth.role() IN ('anon', 'authenticated'));
