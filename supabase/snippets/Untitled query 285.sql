-- ELIMINACIÓN DE ÍNDICE DUPLICADO
-- Se elimina el índice redundante para liberar recursos y optimizar el rendimiento de escritura.
DROP INDEX IF EXISTS public.idx_agenda_eventos_rango_fechas;

-- REAFIRMACIÓN DEL ÍNDICE PRINCIPAL (Si no existiera o para asegurar consistencia)
-- Se asume que el índice está basado en las columnas de tiempo para el módulo de agenda.
CREATE INDEX IF NOT EXISTS idx_agenda_eventos_fechas 
ON public.agenda_eventos (fecha_inicio, fecha_fin);

-- ANALYZE para actualizar las estadísticas del optimizador de consultas
ANALYZE public.agenda_eventos;