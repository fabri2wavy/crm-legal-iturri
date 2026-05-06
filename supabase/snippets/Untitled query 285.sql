-- 1. Destruimos la regla anterior para evitar el error
DROP POLICY IF EXISTS "select_expedientes_seguro" ON public.expedientes;

-- 2. Creamos la regla actualizada con el acceso para el Cliente
CREATE POLICY "select_expedientes_seguro" 
ON public.expedientes FOR SELECT 
USING (
    public.get_user_rol() = 'admin' 
    OR abogado_asignado_id = auth.uid() 
    OR cliente_id = auth.uid() 
);