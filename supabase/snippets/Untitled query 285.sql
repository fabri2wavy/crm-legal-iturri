-- Todos los abogados y admins pueden VER las plantillas
CREATE POLICY "select_plantillas" 
ON public.plantillas_documentos FOR SELECT 
USING (public.get_user_rol() IN ('admin', 'abogado'));

-- Un abogado puede CREAR una plantilla (asegurando que él sea el autor)
CREATE POLICY "insert_plantillas" 
ON public.plantillas_documentos FOR INSERT 
WITH CHECK (creado_por = auth.uid() AND public.get_user_rol() IN ('admin', 'abogado'));

-- Un abogado solo puede EDITAR/ELIMINAR sus propias plantillas (Admin todo)
CREATE POLICY "update_delete_mis_plantillas" 
ON public.plantillas_documentos FOR ALL 
USING (creado_por = auth.uid() OR public.get_user_rol() = 'admin');