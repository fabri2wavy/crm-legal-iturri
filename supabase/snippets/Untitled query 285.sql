-- Tras corregir el tipo ENUM, reconstruir las políticas atómicas para evitar bloqueos
-- Se emplea estrictamente (select auth.uid()) para evitar degradación de caché (auth_rls_initplan)

DROP POLICY IF EXISTS "select_gastos_expediente" ON public.gastos_expediente;
CREATE POLICY "select_gastos_expediente" ON public.gastos_expediente
FOR SELECT TO authenticated
USING (
    expediente_id IN (
        SELECT id FROM public.expedientes 
        WHERE abogado_asignado_id = (select auth.uid()) 
           OR cliente_id = (select auth.uid())
    )
    OR EXISTS (
        SELECT 1 FROM public.perfiles 
        WHERE id = (select auth.uid()) AND rol IN ('admin', 'socio')
    )
);

DROP POLICY IF EXISTS "insert_gastos_expediente" ON public.gastos_expediente;
CREATE POLICY "insert_gastos_expediente" ON public.gastos_expediente
FOR INSERT TO authenticated
WITH CHECK (
    creado_por = (select auth.uid()) AND
    EXISTS (
        SELECT 1 FROM public.perfiles 
        WHERE id = (select auth.uid()) AND rol IN ('admin', 'socio', 'abogado')
    )
);

DROP POLICY IF EXISTS "update_gastos_expediente" ON public.gastos_expediente;
CREATE POLICY "update_gastos_expediente" ON public.gastos_expediente
FOR UPDATE TO authenticated
USING (
    creado_por = (select auth.uid()) OR
    EXISTS (
        SELECT 1 FROM public.perfiles 
        WHERE id = (select auth.uid()) AND rol IN ('admin', 'socio')
    )
);

DROP POLICY IF EXISTS "delete_gastos_expediente" ON public.gastos_expediente;
CREATE POLICY "delete_gastos_expediente" ON public.gastos_expediente
FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.perfiles 
        WHERE id = (select auth.uid()) AND rol IN ('admin', 'socio')
    )
);