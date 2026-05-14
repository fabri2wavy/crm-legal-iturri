-- 1. SILO PARA LA TABLA PERFILES
DROP POLICY IF EXISTS "select_perfiles" ON public.perfiles;
CREATE POLICY "select_perfiles" 
ON public.perfiles FOR SELECT 
USING (
  public.get_user_rol() = 'admin'
  OR id = auth.uid() -- El usuario ve su propio perfil
  OR creado_por = auth.uid() -- El abogado ve a los clientes que él registró
  OR EXISTS ( -- El abogado ve a los clientes de los casos que tiene asignados
    SELECT 1 FROM public.expedientes e 
    WHERE e.cliente_id = perfiles.id 
    AND e.abogado_asignado_id = auth.uid()
  )
);

-- 2. SILO PARA LA TABLA DETALLES_CLIENTE
DROP POLICY IF EXISTS "select_detalles_cliente" ON public.detalles_cliente;
CREATE POLICY "select_detalles_cliente" 
ON public.detalles_cliente FOR SELECT 
USING (
  public.get_user_rol() = 'admin'
  OR perfil_id = auth.uid() -- El cliente ve su propio detalle
  OR EXISTS ( -- El abogado ve el detalle si él creó el perfil base
    SELECT 1 FROM public.perfiles p 
    WHERE p.id = detalles_cliente.perfil_id AND p.creado_por = auth.uid()
  )
  OR EXISTS ( -- O si tiene un expediente asignado de este cliente
    SELECT 1 FROM public.expedientes e 
    WHERE e.cliente_id = detalles_cliente.perfil_id 
    AND e.abogado_asignado_id = auth.uid()
  )
);

-- 3. SILO PARA LA TABLA EXPEDIENTES
DROP POLICY IF EXISTS "select_expedientes" ON public.expedientes;
CREATE POLICY "select_expedientes" 
ON public.expedientes FOR SELECT 
USING (
  public.get_user_rol() = 'admin'
  OR cliente_id = auth.uid() -- El cliente solo ve sus propios juicios
  OR abogado_asignado_id = auth.uid() -- El abogado solo ve los casos que defiende
);