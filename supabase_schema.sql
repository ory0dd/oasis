-- =====================================================================
-- OASIS COGNITIVE & PHENOMENOLOGICAL ASSESSMENT SCHEMA FOR SUPABASE
-- =====================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table 1: Cartografía Fenomenológica y Estructura de Identidad (Test 1)
CREATE TABLE IF NOT EXISTS public.test_existencial_respuestas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Parte A: Las 4 Dimensiones Ontológicas (Texto Libre)
    antecedentes_origen TEXT NOT NULL,
    experiencia_insuficiencia TEXT NOT NULL,
    temporalidad_vivida TEXT NOT NULL,
    premisa_realidad TEXT NOT NULL,
    
    -- Parte B: PID-5 Breve (Respuestas Likert 0-3 Guardadas como JSONB)
    -- Ej: {"1": 2, "2": 0, "3": 3, ..., "25": 1}
    pid_answers JSONB NOT NULL,
    
    -- Dominios Calculados (0 - 15 puntos por dominio)
    pid_afectividad_negativa INT NOT NULL DEFAULT 0,
    pid_desapego INT NOT NULL DEFAULT 0,
    pid_antagonismo INT NOT NULL DEFAULT 0,
    pid_desinhibicion INT NOT NULL DEFAULT 0,
    pid_psicoticismo INT NOT NULL DEFAULT 0,
    
    -- Perfil de Arquetipo de Consciencia resultante
    arquetipo_dominante TEXT NOT NULL
);

-- Table 2: ICAR16 (Rendimiento Cognitivo y Tiempos - Test 2)
CREATE TABLE IF NOT EXISTS public.test_icar16_respuestas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Respuestas Seleccionadas (Guardadas como JSONB)
    -- Ej: {"1": "Es imposible saberlo", "2": "A", ..., "16": "47"}
    respuestas JSONB NOT NULL,
    
    -- Latencia (Dwell Time en milisegundos) por pregunta
    -- Ej: {"1": 14200, "2": 23500, ...}
    dwell_times JSONB NOT NULL,
    
    -- Contador de Cambios de Opinión/Titubeo por pregunta
    -- Ej: {"1": 0, "2": 2, ...}
    cambios_de_opinion JSONB NOT NULL,
    
    -- Métricas Agregadas
    score INT NOT NULL DEFAULT 0, -- 0 a 16 aciertos
    dwell_time_avg_sec NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    total_cambios_opinion INT NOT NULL DEFAULT 0
);

-- Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_test_existencial_username ON public.test_existencial_respuestas(username);
CREATE INDEX IF NOT EXISTS idx_test_icar16_username ON public.test_icar16_respuestas(username);

-- Enable Row Level Security (RLS)
ALTER TABLE public.test_existencial_respuestas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_icar16_respuestas ENABLE ROW LEVEL SECURITY;

-- Create Policies for authenticated/anonymous users depending on your auth pattern
-- (For development/local setup, allow all select/insert)
CREATE POLICY "Allow select for all" ON public.test_existencial_respuestas FOR SELECT USING (true);
CREATE POLICY "Allow insert for all" ON public.test_existencial_respuestas FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow select for all" ON public.test_icar16_respuestas FOR SELECT USING (true);
CREATE POLICY "Allow insert for all" ON public.test_icar16_respuestas FOR INSERT WITH CHECK (true);
