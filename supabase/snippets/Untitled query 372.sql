-- Actualización de esquema para auditoría de creación
ALTER TABLE public.honorarios 
ADD COLUMN creado_por UUID REFERENCES public.perfiles(id) DEFAULT (select auth.uid());

ALTER TABLE public.gastos_expediente 
ADD COLUMN creado_por UUID REFERENCES public.perfiles(id) DEFAULT (select auth.uid());