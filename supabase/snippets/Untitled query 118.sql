-- Actualización del Core: Agregando campos descubiertos en el Benchmarking
ALTER TABLE public.expedientes 
ADD COLUMN materia text DEFAULT 'No especificada',
ADD COLUMN juzgado text DEFAULT 'No especificado',
ADD COLUMN parte_contraria text DEFAULT 'Sin asignar',
ADD COLUMN informe_despacho text DEFAULT '',
ADD COLUMN informe_cliente text DEFAULT '';