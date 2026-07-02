import { createClient } from '@/infrastructure/supabase/client';
import type { UsuarioPerfil } from '@/domain/entities/UsuarioPerfil';

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

export async function obtenerAbogadosYSocios(): Promise<UsuarioPerfil[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('perfiles')
    .select('id, nombres, apellido_paterno, apellido_materno, rol')
    .in('rol', ['abogado', 'socio'])
    .order('nombres', { ascending: true });

  if (error || !data) {
    console.error('Error al obtener abogados y socios:', error?.message);
    return [];
  }

  return data.map(mapearUsuario);
}

export async function compartirExpediente(
  expedienteId: string,
  abogadoId: string,
  otorgadoPor: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  // Verificar si ya existe acceso
  const { data: existente } = await supabase
    .from('expediente_accesos')
    .select('id')
    .eq('expediente_id', expedienteId)
    .eq('abogado_id', abogadoId)
    .single();

  if (existente) {
    return { success: false, error: 'Este usuario ya tiene acceso al expediente.' };
  }

  const { error } = await supabase
    .from('expediente_accesos')
    .insert({
      expediente_id: expedienteId,
      abogado_id: abogadoId,
      otorgado_por: otorgadoPor,
    });

  if (error) {
    console.error('Error al compartir expediente:', error.message);
    return { success: false, error: 'Error al compartir el expediente.' };
  }

  return { success: true };
}
