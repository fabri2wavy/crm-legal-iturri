-- Habilitar Row Level Security
ALTER TABLE public.honorarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuotas_pago ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gastos_expediente ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- POLÍTICAS PARA PUBLIC.HONORARIOS
-- ==========================================

-- SELECT: Admins y Abogados (Lectura general de la firma)
CREATE POLICY "honorarios_select_policy" ON public.honorarios
FOR SELECT TO authenticated
USING (true);

-- INSERT: Solo Admin
CREATE POLICY "honorarios_insert_admin" ON public.honorarios
FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.perfiles WHERE id = (SELECT auth.uid()) AND rol = 'admin'));

-- UPDATE: Solo Admin
CREATE POLICY "honorarios_update_admin" ON public.honorarios
FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.perfiles WHERE id = (SELECT auth.uid()) AND rol = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.perfiles WHERE id = (SELECT auth.uid()) AND rol = 'admin'));

-- DELETE: Solo Admin
CREATE POLICY "honorarios_delete_admin" ON public.honorarios
FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.perfiles WHERE id = (SELECT auth.uid()) AND rol = 'admin'));

-- ==========================================
-- POLÍTICAS PARA PUBLIC.CUOTAS_PAGO
-- ==========================================

-- SELECT: Admins y Abogados
CREATE POLICY "cuotas_select_policy" ON public.cuotas_pago
FOR SELECT TO authenticated
USING (true);

-- INSERT/UPDATE/DELETE: Solo Admin
CREATE POLICY "cuotas_insert_admin" ON public.cuotas_pago
FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.perfiles WHERE id = (SELECT auth.uid()) AND rol = 'admin'));

CREATE POLICY "cuotas_update_admin" ON public.cuotas_pago
FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.perfiles WHERE id = (SELECT auth.uid()) AND rol = 'admin'));

CREATE POLICY "cuotas_delete_admin" ON public.cuotas_pago
FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.perfiles WHERE id = (SELECT auth.uid()) AND rol = 'admin'));

-- ==========================================
-- POLÍTICAS PARA PUBLIC.GASTOS_EXPEDIENTE
-- ==========================================

-- SELECT: Admins y Abogados
CREATE POLICY "gastos_select_policy" ON public.gastos_expediente
FOR SELECT TO authenticated
USING (true);

-- INSERT/UPDATE/DELETE: Solo Admin
CREATE POLICY "gastos_insert_admin" ON public.gastos_expediente
FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.perfiles WHERE id = (SELECT auth.uid()) AND rol = 'admin'));

CREATE POLICY "gastos_update_admin" ON public.gastos_expediente
FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.perfiles WHERE id = (SELECT auth.uid()) AND rol = 'admin'));

CREATE POLICY "gastos_delete_admin" ON public.gastos_expediente
FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.perfiles WHERE id = (SELECT auth.uid()) AND rol = 'admin'));