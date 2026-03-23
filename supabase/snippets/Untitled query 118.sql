-- 1. Optimizar la tabla CLIENTES
DROP POLICY IF EXISTS "Acceso total a usuarios autenticados" ON public.clientes;

CREATE POLICY "Acceso total a usuarios autenticados" 
ON public.clientes 
FOR ALL 
TO authenticated 
USING ( (select auth.uid()) IS NOT NULL )
WITH CHECK ( (select auth.uid()) IS NOT NULL );


-- 2. Optimizar la tabla EXPEDIENTES
DROP POLICY IF EXISTS "Acceso total a usuarios autenticados" ON public.expedientes;

CREATE POLICY "Acceso total a usuarios autenticados" 
ON public.expedientes 
FOR ALL 
TO authenticated 
USING ( (select auth.uid()) IS NOT NULL )
WITH CHECK ( (select auth.uid()) IS NOT NULL );
