-- 1. Creamos la tabla de la bitácora/informes
CREATE TABLE public.bitacora (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    expediente_id UUID NOT NULL REFERENCES public.expedientes(id) ON DELETE CASCADE,
    contenido TEXT NOT NULL,
    visible_cliente BOOLEAN DEFAULT false, -- ¡El mismo switch mágico de privacidad!
    creado_por UUID NOT NULL REFERENCES public.perfiles(id),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Encendemos el escudo de seguridad
ALTER TABLE public.bitacora ENABLE ROW LEVEL SECURITY;

-- 3. Reglas quirúrgicas de seguridad
-- Todos los autenticados pueden leer el historial
CREATE POLICY "Lectura de bitacora" 
ON public.bitacora FOR SELECT 
TO authenticated 
USING (true);

-- Solo puedes publicar una nota si registras que tú la escribiste
CREATE POLICY "Escritura en bitacora" 
ON public.bitacora FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = creado_por);

-- Solo el autor original puede editar su propia nota
CREATE POLICY "Edicion de bitacora" 
ON public.bitacora FOR UPDATE 
TO authenticated 
USING (auth.uid() = creado_por);

-- Solo el autor original puede borrar su propia nota
CREATE POLICY "Eliminacion de bitacora" 
ON public.bitacora FOR DELETE 
TO authenticated 
USING (auth.uid() = creado_por);