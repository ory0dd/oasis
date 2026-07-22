-- Script para configurar la base de datos de PostgreSQL en Supabase con Pgvector e HNSW
-- Ejecuta este script en el editor SQL de tu panel de control de Supabase.

-- 1. Habilitar la extensión pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Crear la tabla de feed de Oasis (oasis_feed)
CREATE TABLE IF NOT EXISTS public.oasis_feed (
    id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    caption VARCHAR(255) DEFAULT '',
    type VARCHAR(50) NOT NULL,
    color VARCHAR(50) DEFAULT '',
    esfera_existencial VARCHAR(100) DEFAULT 'Eigenwelt',
    lente_percepcion VARCHAR(100) DEFAULT 'Analítico',
    embedding vector(384), -- Vector de 384 dimensiones de sentence-transformers/all-MiniLM-L6-v2
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Crear el índice HNSW en la columna embedding para búsquedas veloces por similitud de coseno
CREATE INDEX IF NOT EXISTS oasis_feed_hnsw_idx 
ON public.oasis_feed USING hnsw (embedding vector_cosine_ops);

-- 4. Habilitar el acceso de lectura público (RLS) para que cualquier cliente pueda consultar el feed
ALTER TABLE public.oasis_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura pública en oasis_feed" 
ON public.oasis_feed FOR SELECT 
USING (true);

-- 5. Permitir la inserción, actualización y eliminación de filas desde la API (con la anon/service key de Supabase)
CREATE POLICY "Permitir inserción a la API en oasis_feed" 
ON public.oasis_feed FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Permitir actualizaciones a la API en oasis_feed" 
ON public.oasis_feed FOR UPDATE 
USING (true);

CREATE POLICY "Permitir eliminación a la API en oasis_feed" 
ON public.oasis_feed FOR DELETE 
USING (true);
