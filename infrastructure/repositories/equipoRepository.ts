import { createClient } from '../supabase/client';
import { MiembroEquipo } from '../../domain/entities/MiembroEquipo';

function mapearMiembro(fila: any): MiembroEquipo {
  const detalle = fila.detalles_equipo ?? {};

  return {
    id: fila.id,
    nombres: fila.nombres ?? '',
    apellidoPaterno: fila.apellido_paterno ?? '',
    apellidoMaterno: fila.apellido_materno ?? '',
    email: fila.email ?? null,
    telefono: fila.telefono ?? null,
    rol: fila.rol ?? 'abogado',
    cargo: detalle.cargo ?? '',
    especialidad: detalle.especialidad ?? null,
    estadoLaboral: detalle.estado_laboral ?? 'activo',
  };
}

export async function obtenerEquipo(): Promise<MiembroEquipo[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('perfiles')
    .select('*, detalles_equipo!inner(*)')
    .neq('rol', 'cliente')
    .order('nombres', { ascending: true });

  if (error) {
    throw new Error(`Error al obtener equipo legal: ${error.message}`);
  }

  if (!data) {
    return [];
  }

  return data.map(mapearMiembro);
}
