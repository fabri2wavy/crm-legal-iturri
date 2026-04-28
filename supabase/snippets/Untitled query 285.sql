-- 1. Los abogados pueden VER los gastos de sus propios casos (Admin ve todo)
CREATE POLICY "select_gastos_seguro" 
ON public.gastos_expediente 
FOR SELECT 
USING (
    expediente_id IN (SELECT id FROM public.expedientes WHERE abogado_asignado_id = auth.uid())
    OR public.get_user_rol() = 'admin'
);

-- 2. Los abogados pueden INSERTAR gastos en sus propios casos (Admin inserta en cualquiera)
CREATE POLICY "insert_gastos_seguro" 
ON public.gastos_expediente 
FOR INSERT 
WITH CHECK (
    expediente_id IN (SELECT id FROM public.expedientes WHERE abogado_asignado_id = auth.uid())
    OR public.get_user_rol() = 'admin'
);

-- 3. (Opcional pero recomendado) Permitir actualizar si se equivocaron al tipear el monto
CREATE POLICY "update_gastos_seguro" 
ON public.gastos_expediente 
FOR UPDATE 
USING (
    expediente_id IN (SELECT id FROM public.expedientes WHERE abogado_asignado_id = auth.uid())
    OR public.get_user_rol() = 'admin'
);