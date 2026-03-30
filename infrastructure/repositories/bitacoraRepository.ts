import { createClient } from '../supabase/client';
import { EntradaBitacora } from '../../domain/entities/EntradaBitacora';

/* ── Listar entradas de bitácora de un expediente ──────────── */
export async function obtenerBitacoraPorExpediente(
  expedienteId: string
): Promise<EntradaBitacora[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('bitacora')
    .select('*, autor:perfiles!creado_por(nombre_completo)')
    .eq('expediente_id', expedienteId)
    .order('creado_en', { ascending: false });

  if (error || !data) {
    console.error('Error al listar bitácora:', error?.message);
    return [];
  }

  return data.map(fila => ({
    id: fila.id,
    expedienteId: fila.expediente_id,
    contenido: fila.contenido,
    visibleCliente: fila.visible_cliente ?? false,
    creadoPor: fila.creado_por,
    autorNombre: fila.autor?.nombre_completo || 'Desconocido',
    creadoEn: new Date(fila.creado_en),
  }));
}

/* ── Crear nueva entrada en la bitácora ────────────────────── */
export async function crearEntradaBitacora(
  expedienteId: string,
  contenido: string,
  visibleCliente: boolean,
  usuarioId: string
): Promise<EntradaBitacora | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('bitacora')
    .insert([{
      expediente_id: expedienteId,
      contenido,
      visible_cliente: visibleCliente,
      creado_por: usuarioId,
    }])
    .select('*, autor:perfiles!creado_por(nombre_completo)')
    .single();

  if (error || !data) {
    console.error('Error al crear entrada de bitácora:', error?.message);
    return null;
  }

  return {
    id: data.id,
    expedienteId: data.expediente_id,
    contenido: data.contenido,
    visibleCliente: data.visible_cliente ?? false,
    creadoPor: data.creado_por,
    autorNombre: data.autor?.nombre_completo || 'Tú',
    creadoEn: new Date(data.creado_en),
  };
}
