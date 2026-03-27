// infrastructure/repositories/usuarioRepository.ts

import { createClient } from '../supabase/client';

export interface UsuarioPerfil {
  id: string;
  nombre_completo: string;
  rol: string;
}

export async function obtenerAbogados(): Promise<UsuarioPerfil[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('perfiles')
    .select('id, nombre_completo, rol')
    .in('rol', ['abogado', 'admin'])
    .order('nombre_completo', { ascending: true });

  if (error || !data) {
    console.error('Error al obtener abogados:', error?.message);
    return [];
  }

  return data;
}

export async function obtenerPerfilActual(): Promise<UsuarioPerfil | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('perfiles')
    .select('id, nombre_completo, rol')
    .eq('id', user.id)
    .single();

  if (error || !data) {
    console.error('Error al obtener perfil actual:', error?.message);
    return null;
  }

  return data;
}
