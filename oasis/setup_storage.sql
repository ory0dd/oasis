-- Script para configurar Supabase Storage para Oasis (Railway/Render Deployments)

-- 1. Crear el bucket llamado "oasis-media" y hacerlo publico para que las URL funcionen
INSERT INTO storage.buckets (id, name, public)
VALUES ('oasis-media', 'oasis-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Permitir el acceso publico de LECTURA (Select) para que todos puedan ver las imagenes/videos
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT
USING ( bucket_id = 'oasis-media' );

-- 3. Permitir que la API inserte archivos (Uploads)
CREATE POLICY "Allow API Uploads" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'oasis-media' );

-- 4. Permitir actualizaciones (Updates)
CREATE POLICY "Allow API Updates" 
ON storage.objects FOR UPDATE
USING ( bucket_id = 'oasis-media' );

-- 5. Permitir borrado de archivos (Deletes)
CREATE POLICY "Allow API Deletes" 
ON storage.objects FOR DELETE
USING ( bucket_id = 'oasis-media' );
