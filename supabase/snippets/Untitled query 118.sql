-- 1. CREAMOS EL DISCO DURO (BUCKET) LLAMADO 'documentos'
-- Lo hacemos 'public' para que el sistema pueda generar URLs de descarga fácilmente
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos', 'documentos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. REGLAS DE SEGURIDAD PARA LOS ARCHIVOS FÍSICOS (storage.objects)

-- A) Permitir que cualquier usuario logueado pueda ver y descargar los archivos
CREATE POLICY "Lectura de archivos" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'documentos');

-- B) Permitir que un usuario logueado pueda SUBIR archivos
CREATE POLICY "Subida de archivos" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'documentos');

-- C) Permitir que un usuario pueda ELIMINAR el archivo físico si se equivoca
CREATE POLICY "Eliminacion de archivos" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'documentos');