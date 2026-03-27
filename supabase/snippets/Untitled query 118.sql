-- 1. Volvemos a encender el escudo de seguridad (¡Nunca lo dejes apagado!)
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

-- 2. Creamos la llave (Política) para que los usuarios logueados puedan LEER la tabla
CREATE POLICY "Usuarios autenticados pueden ver perfiles"
ON public.perfiles
FOR SELECT
TO authenticated
USING (true);