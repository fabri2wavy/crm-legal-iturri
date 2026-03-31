// infrastructure/repositories/usuarioRepository.ts

import { createClient } from '../supabase/client';

/* ══════════════════════════════════════════════════════════════
   Interface para perfiles de usuario
   POST-MIGRACIÓN: nombre_completo es calculado, no columna real
   ══════════════════════════════════════════════════════════════ */
export interface UsuarioPerfil {
  id: string;
  nombre_completo: string;   // Calculado en capa de repositorio
  rol: string;
}

/* ══════════════════════════════════════════════════════════════
   Helper: mapear fila de perfiles a UsuarioPerfil
   ══════════════════════════════════════════════════════════════ */
function mapearUsuario(fila: any): UsuarioPerfil {
  const nombreCompleto = [fila.nombres, fila.apellido_paterno, fila.apellido_materno]
    .filter(Boolean)
    .join(' ')
    .trim() || 'Sin registrar';

  return {
    id: fila.id,
    nombre_completo: nombreCompleto,
    rol: fila.rol,
  };
}

export async function obtenerAbogados(): Promise<UsuarioPerfil[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('perfiles')
    .select('id, nombres, apellido_paterno, apellido_materno, rol')
    .in('rol', ['abogado', 'admin'])
    .order('nombres', { ascending: true });

  if (error || !data) {
    console.error('Error al obtener abogados:', error?.message);
    return [];
  }

  return data.map(mapearUsuario);
}

export async function obtenerPerfilActual(): Promise<UsuarioPerfil | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('perfiles')
    .select('id, nombres, apellido_paterno, apellido_materno, rol')
    .eq('id', user.id)
    .single();

  if (error || !data) {
    console.error('Error al obtener perfil actual:', error?.message);
    return null;
  }

  return mapearUsuario(data);
}
