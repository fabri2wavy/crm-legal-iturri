ALTER TABLE public.agenda_eventos ENABLE ROW LEVEL SECURITY;

-- SELECT: Visibilidad restringida al creador o asignado
CREATE POLICY "select_agenda_eventos"
ON public.agenda_eventos
FOR SELECT
USING (
    asignado_a = (select auth.uid()) OR 
    creado_por = (select auth.uid())
);

-- INSERT: Restricción absoluta de autoría al usuario autenticado
CREATE POLICY "insert_agenda_eventos"
ON public.agenda_eventos
FOR INSERT
WITH CHECK (
    creado_por = (select auth.uid())
);

-- UPDATE: Modificación permitida a involucrados directos
CREATE POLICY "update_agenda_eventos"
ON public.agenda_eventos
FOR UPDATE
USING (
    asignado_a = (select auth.uid()) OR 
    creado_por = (select auth.uid())
)
WITH CHECK (
    asignado_a = (select auth.uid()) OR 
    creado_por = (select auth.uid())
);

-- DELETE: Destrucción exclusiva por el autor del registro
CREATE POLICY "delete_agenda_eventos"
ON public.agenda_eventos
FOR DELETE
USING (
    creado_por = (select auth.uid())
);