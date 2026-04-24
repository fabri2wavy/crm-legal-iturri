-- 1. Política para ACTUALIZAR (Editar) expedientes
CREATE POLICY "update_expedientes_seguro" 
ON public.expedientes 
FOR UPDATE 
USING (
    -- El abogado asignado puede editar su propio caso (ej. cambiar el estado)
    abogado_asignado_id = auth.uid() 
    -- O el Administrador, que puede editar y reasignar CUALQUIER caso
    OR public.get_user_rol() = 'admin'
);

-- 2. Política para INSERTAR (Crear) nuevos expedientes
CREATE POLICY "insert_expedientes_seguro" 
ON public.expedientes 
FOR INSERT 
WITH CHECK (
    -- Solo admins y abogados pueden crear casos nuevos
    public.get_user_rol() IN ('admin', 'abogado')
);