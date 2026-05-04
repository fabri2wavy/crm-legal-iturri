-- LIMPIEZA TOTAL DE POLÍTICAS PREVIAS PARA EVITAR RECURSIÓN O COLISIONES
DROP POLICY IF EXISTS "perfiles_select_own" ON public.perfiles;
DROP POLICY IF EXISTS "perfiles_select_created_by" ON public.perfiles;
DROP POLICY IF EXISTS "perfiles_select_admin" ON public.perfiles;
DROP POLICY IF EXISTS "perfiles_insert_lawyer_client" ON public.perfiles;
DROP POLICY IF EXISTS "perfiles_insert_admin" ON public.perfiles;

-- POLÍTICAS DE LECTURA (SELECT)
-- 1. Ver propio perfil
CREATE POLICY "perfiles_select_self" ON public.perfiles
FOR SELECT TO authenticated
USING (id = (SELECT auth.uid()));

-- 2. Ver clientes creados por el abogado (Silo)
CREATE POLICY "perfiles_select_silo" ON public.perfiles
FOR SELECT TO authenticated
USING (creado_por = (SELECT auth.uid()));

-- 3. Ver todo si es admin (Uso de función con casting para evitar error de operador)
CREATE POLICY "perfiles_select_all_admin" ON public.perfiles
FOR SELECT TO authenticated
USING (public.check_user_role('admin'));

-- POLÍTICAS DE INSERCIÓN (INSERT)
-- 1. Abogado inserta cliente (Obliga a que creado_por sea su propio ID)
CREATE POLICY "perfiles_insert_client_as_lawyer" ON public.perfiles
FOR INSERT TO authenticated
WITH CHECK (
    (creado_por = (SELECT auth.uid())) AND 
    (public.check_user_role('abogado'))
);

-- 2. Admin inserta cualquier perfil
CREATE POLICY "perfiles_insert_as_admin" ON public.perfiles
FOR INSERT TO authenticated
WITH CHECK (public.check_user_role('admin'));

-- REGLA PARA DETALLES_CLIENTE (VINCULACIÓN POR PERTENENCIA)
DROP POLICY IF EXISTS "detalles_cliente_select_v2" ON public.detalles_cliente;
CREATE POLICY "detalles_cliente_select_v2" ON public.detalles_cliente
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.perfiles p
        WHERE p.id = public.detalles_cliente.perfil_id
        -- La visibilidad aquí hereda automáticamente las políticas de la tabla perfiles
    )
);