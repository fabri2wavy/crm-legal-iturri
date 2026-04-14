import { createClient } from '../supabase/client';
import {
  EventoAgenda,
  EventoAgendaDetallado,
  TipoEventoAgenda,
  EstadoEventoAgenda,
} from '../../domain/entities/EventoAgenda';

/* ══════════════════════════════════════════════════════════════
   Tipo de payload para creación (campos generados excluidos)
   ══════════════════════════════════════════════════════════════ */

type CrearEventoPayload = Omit<EventoAgenda, 'id' | 'creadoEn' | 'creadoPor'>;

/* ══════════════════════════════════════════════════════════════
   Helpers internos de mapeo snake_case → camelCase
   ══════════════════════════════════════════════════════════════ */

interface FilaEventoDetallado {
  id: string;
  titulo: string;
  descripcion: string | null;
  tipo_evento: string;
  estado: string;
  fecha_inicio: string;
  fecha_fin: string;
  expediente_id: string | null;
  asignado_a: string;
  creado_por: string;
  creado_en: string;
  expedientes: { numero_caso: string; titulo: string } | null;
  asignado: {
    nombres: string;
    apellido_paterno: string;
    apellido_materno: string;
  } | null;
}

function mapearEventoDetallado(fila: FilaEventoDetallado): EventoAgendaDetallado {
  return {
    id: fila.id,
    titulo: fila.titulo,
    descripcion: fila.descripcion,
    tipoEvento: fila.tipo_evento as TipoEventoAgenda,
    estado: fila.estado as EstadoEventoAgenda,
    fechaInicio: fila.fecha_inicio,
    fechaFin: fila.fecha_fin,
    expedienteId: fila.expediente_id,
    asignadoA: fila.asignado_a,
    creadoPor: fila.creado_por,
    creadoEn: fila.creado_en,
    expediente: fila.expedientes
      ? { numeroCaso: fila.expedientes.numero_caso, titulo: fila.expedientes.titulo }
      : null,
    asignado: {
      nombres: fila.asignado?.nombres ?? '',
      apellidoPaterno: fila.asignado?.apellido_paterno ?? '',
      apellidoMaterno: fila.asignado?.apellido_materno ?? '',
    },
  };
}

/* ══════════════════════════════════════════════════════════════
   QUERY: Obtener todos los eventos con datos relacionales
   ──────────────────────────────────────────────────────────────
   Relaciones:
     • expedientes (LEFT JOIN — puede ser null)
     • perfiles via FK asignado_a (INNER — obligatorio)
   ══════════════════════════════════════════════════════════════ */

export async function obtenerEventos(): Promise<EventoAgendaDetallado[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('agenda_eventos')
    .select(`
      *,
      expedientes(numero_caso, titulo),
      asignado:perfiles!asignado_a(nombres, apellido_paterno, apellido_materno)
    `)
    .order('fecha_inicio', { ascending: true });

  if (error) {
    throw new Error(`Error al obtener eventos de la agenda: ${error.message}`);
  }

  if (!data) {
    return [];
  }

  return (data as unknown as FilaEventoDetallado[]).map(mapearEventoDetallado);
}

/* ══════════════════════════════════════════════════════════════
   MUTATION: Crear un nuevo evento en la agenda
   ──────────────────────────────────────────────────────────────
   • El campo `creado_por` se inyecta desde la sesión activa.
   • El payload del cliente NO incluye id, creado_en ni creado_por.
   ══════════════════════════════════════════════════════════════ */

export async function crearEvento(
  payload: CrearEventoPayload
): Promise<EventoAgenda> {
  const supabase = createClient();

  /* ── Extraer usuario autenticado ─────────────────────────── */
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    throw new Error(
      `No se pudo verificar la sesión del usuario: ${authError?.message ?? 'Usuario no autenticado.'}`
    );
  }

  const userId = authData.user.id;

  /* ── Inserción DML ───────────────────────────────────────── */
  const { data, error } = await supabase
    .from('agenda_eventos')
    .insert({
      titulo: payload.titulo,
      descripcion: payload.descripcion,
      tipo_evento: payload.tipoEvento,
      estado: payload.estado,
      fecha_inicio: payload.fechaInicio,
      fecha_fin: payload.fechaFin,
      expediente_id: payload.expedienteId,
      asignado_a: payload.asignadoA,
      creado_por: userId,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(
      `Error al crear el evento: ${error?.message ?? 'No se recibieron datos de la inserción.'}`
    );
  }

  /* ── Mapeo de respuesta → entidad de dominio ─────────────── */
  return {
    id: data.id,
    titulo: data.titulo,
    descripcion: data.descripcion,
    tipoEvento: data.tipo_evento as TipoEventoAgenda,
    estado: data.estado as EstadoEventoAgenda,
    fechaInicio: data.fecha_inicio,
    fechaFin: data.fecha_fin,
    expedienteId: data.expediente_id,
    asignadoA: data.asignado_a,
    creadoPor: data.creado_por,
    creadoEn: data.creado_en,
  };
}
