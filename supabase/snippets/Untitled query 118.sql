-- Encendemos la seguridad en ambas tablas
alter table public.clientes enable row level security;
alter table public.expedientes enable row level security;

-- Política temporal: Solo los usuarios logueados (autenticados) pueden ver y editar
create policy "Acceso total a usuarios autenticados" 
on public.clientes for all 
using (auth.role() = 'authenticated');

create policy "Acceso total a usuarios autenticados" 
on public.expedientes for all 
using (auth.role() = 'authenticated');