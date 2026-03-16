-- 1. Creamos un tipo de dato personalizado para los roles
create type rol_usuario as enum ('admin', 'abogado', 'cliente');

-- 2. Creamos la tabla de perfiles
create table perfiles (
  id uuid references auth.users on delete cascade not null primary key,
  rol rol_usuario default 'cliente' not null,
  nombre_completo text,
  telefono text,
  creado_en timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Activamos la seguridad a nivel de fila (RLS)
alter table perfiles enable row level security;

-- 4. Creamos una política básica: Un usuario solo puede ver y editar su propio perfil
create policy "Los usuarios pueden ver su propio perfil" 
  on perfiles for select 
  using ( auth.uid() = id );

create policy "Los usuarios pueden actualizar su propio perfil" 
  on perfiles for update 
  using ( auth.uid() = id );