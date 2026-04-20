-- Política de SELECT: Accesible a todo usuario autenticado
CREATE POLICY "select_plantillas_autenticados" 
ON public.plantillas_documentos 
FOR SELECT 
TO authenticated 
USING (true);

-- Política de INSERT: Exclusiva para rol 'admin'
CREATE POLICY "insert_plantillas_admin" 
ON public.plantillas_documentos 
FOR INSERT 
TO authenticated 
WITH CHECK (
    EXISTS (
        SELECT 1 
        FROM public.perfiles 
        WHERE id = (select auth.uid()) 
        AND rol = 'admin'
    )
);

-- Política de UPDATE: Exclusiva para rol 'admin'
CREATE POLICY "update_plantillas_admin" 
ON public.plantillas_documentos 
FOR UPDATE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 
        FROM public.perfiles 
        WHERE id = (select auth.uid()) 
        AND rol = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 
        FROM public.perfiles 
        WHERE id = (select auth.uid()) 
        AND rol = 'admin'
    )
);

-- Política de DELETE: Exclusiva para rol 'admin'
CREATE POLICY "delete_plantillas_admin" 
ON public.plantillas_documentos 
FOR DELETE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 
        FROM public.perfiles 
        WHERE id = (select auth.uid()) 
        AND rol = 'admin'
    )
);