
import { createClient } from '../supabase/client';
import { crearUsuarioDesdeAdmin, obtenerEmailUsuarioPorId } from '../actions/adminAuth';
import { Cliente } from '../../domain/entities/Cliente';
import { Expediente } from '../../domain/entities/Expediente';

/* ══════════════════════════════════════════════════════════════
   Helper: Construir nombre completo desde columnas individuales
   Manejo seguro de nulos, evita espacios dobles y trailing whitespace
   ══════════════════════════════════════════════════════════════ */
function construirNombreCompleto(
  nombres?: string | null,
  apellidoPaterno?: string | null,
  apellidoMaterno?: string | null
): string {
  return [nombres, apellidoPaterno, apellidoMaterno]
    .filter(Boolean)
    .join(' ')
    .trim() || 'Sin registrar';
}

/* ══════════════════════════════════════════════════════════════
   Datos de entrada para crear un cliente
   ══════════════════════════════════════════════════════════════ */
export interface DatosNuevoCliente {
  /* Auth */
  email: string;
  password: string;

  /* Identidad (obligatorios — columnas de perfiles) */
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  telefono: string;

  /* Generales de Ley (opcionales — detalles_cliente) */
  ci?: string;
  expedido?: string;
  nacionalidad?: string;
  fechaNacimiento?: string;
  estadoCivil?: string;
  profesion?: string;
  direccion?: string;
}

/* ══════════════════════════════════════════════════════════════
   Helper: mapear fila de Supabase → entidad Cliente
   POST-MIGRACIÓN: nombres vienen de perfiles, NO de detalles_cliente
   ══════════════════════════════════════════════════════════════ */
function mapearCliente(fila: any): Cliente {
  const detalle = fila.detalles_cliente?.[0] ?? fila.detalles_cliente ?? {};

  return {
    id: fila.id,
    nombreCompleto: construirNombreCompleto(fila.nombres, fila.apellido_paterno, fila.apellido_materno),
    email: '',                            // vive en auth.users — se enriquece en obtenerClientePorId
    telefono: fila.telefono ?? '',
    rol: fila.rol,

    /* Identidad — ahora en perfiles */
    nombresLegales: fila.nombres ?? undefined,
    apellidoPaterno: fila.apellido_paterno ?? undefined,
    apellidoMaterno: fila.apellido_materno ?? undefined,

    /* Generales de Ley — detalles_cliente (solo datos legales) */
    ci: detalle.ci ?? undefined,
    expedido: detalle.expedido ?? undefined,
    nacionalidad: detalle.nacionalidad ?? undefined,
    fechaNacimiento: detalle.fecha_nacimiento ?? undefined,
    estadoCivil: detalle.estado_civil ?? undefined,
    profesion: detalle.profesion ?? undefined,
    direccion: detalle.direccion ?? undefined,
  };
}

/* ══════════════════════════════════════════════════════════════
   Crear Cliente
   Flujo: Server Action (admin) → UPDATE perfiles → INSERT detalles
   La sesión del Admin NO se ve afectada en ningún paso.
   ══════════════════════════════════════════════════════════════ */
export async function crearCliente(
  datos: DatosNuevoCliente
): Promise<{ success: boolean; data?: Cliente; error?: string }> {
  const supabase = createClient();

  /* ── Paso A: Auth vía Server Action — no toca la sesión del admin ── */
  const authResult = await crearUsuarioDesdeAdmin(datos.email, datos.password);

  if ('error' in authResult) {
    return { success: false, error: `Error Auth: ${authResult.error}` };
  }

  const userId = authResult.userId;

  /* ── Nombre completo para uso visual ─────────────────────────── */
  const nombreCompleto = construirNombreCompleto(datos.nombres, datos.apellidoPaterno, datos.apellidoMaterno);

  /* ── Paso B: perfiles (UPDATE — el trigger ya creó la fila) ─── */
  /* Problema de timing: el trigger on_auth_user_created puede tardar
     en insertar la fila de perfiles. Un .update() sobre una fila
     inexistente afecta 0 filas SIN retornar error en Supabase.
     Solución: esperamos a que la fila exista antes de actualizar. */
  const MAX_RETRIES = 5;
  const RETRY_DELAY_MS = 500;
  let perfilExiste = false;

  for (let intento = 0; intento < MAX_RETRIES; intento++) {
    const { data: check } = await supabase
      .from('perfiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (check) {
      perfilExiste = true;
      break;
    }

    // Esperar antes del siguiente intento
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
  }

  if (!perfilExiste) {
    console.error('Error: El trigger no creó la fila en perfiles a tiempo.');
    return { success: false, error: 'Error Perfil: El perfil de usuario no fue creado. Intente nuevamente.' };
  }

  /* POST-MIGRACIÓN: nombres van directamente a perfiles */
  const { error: perfilError } = await supabase
    .from('perfiles')
    .update({
      nombres: datos.nombres || null,
      apellido_paterno: datos.apellidoPaterno || null,
      apellido_materno: datos.apellidoMaterno || null,
      telefono: datos.telefono || null,
      rol: 'cliente',
    })
    .eq('id', userId);

  if (perfilError) {
    console.error('Error al actualizar perfil:', perfilError.message);
    return { success: false, error: `Error Perfil: ${perfilError.message}` };
  }

  /* ── Paso C: detalles_cliente (solo datos legales/civiles) ───── */
  /* POST-MIGRACIÓN: ya NO se envían nombres_legales, apellidos aquí */
  const { error: detalleError } = await supabase
    .from('detalles_cliente')
    .insert([{
      perfil_id: userId,
      ci: datos.ci || null,
      expedido: datos.expedido || null,
      nacionalidad: datos.nacionalidad || null,
      fecha_nacimiento: datos.fechaNacimiento || null,
      estado_civil: datos.estadoCivil || null,
      profesion: datos.profesion || null,
      direccion: datos.direccion || null,
    }]);

  if (detalleError) {
    console.error('Error al insertar detalles_cliente:', detalleError.message);
    return { success: false, error: `Error Detalles: ${detalleError.message}` };
  }

  return {
    success: true,
    data: {
      id: userId,
      nombreCompleto,
      email: datos.email,
      telefono: datos.telefono,
      rol: 'cliente',
      nombresLegales: datos.nombres,
      apellidoPaterno: datos.apellidoPaterno,
      apellidoMaterno: datos.apellidoMaterno,
      ci: datos.ci,
      expedido: datos.expedido,
      nacionalidad: datos.nacionalidad,
      fechaNacimiento: datos.fechaNacimiento,
      estadoCivil: datos.estadoCivil,
      profesion: datos.profesion,
      direccion: datos.direccion,
    },
  };
}

/* ── Listar ───────────────────────────────────────────────────── */
export async function obtenerClientes(): Promise<Cliente[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('perfiles')
    .select('*, detalles_cliente(*)')
    .eq('rol', 'cliente')
    .order('nombres', { ascending: true });

  if (error || !data) {
    console.error('Error al obtener clientes:', error?.message);
    return [];
  }

  return data.map(mapearCliente);
}

/* ── Obtener por ID ──────────────────────────────────────────── */
export async function obtenerClientePorId(id: string): Promise<Cliente | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('perfiles')
    .select('*, detalles_cliente(*)')
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('Error al obtener cliente por ID:', error?.message);
    return null;
  }

  // El email vive en auth.users — lo obtenemos via Server Action con service role
  const email = await obtenerEmailUsuarioPorId(id);

  const clienteMapeado = mapearCliente(data);
  return { ...clienteMapeado, email };
}

/* ── Expedientes del cliente ─────────────────────────────────── */
export async function obtenerExpedientesPorCliente(clienteId: string): Promise<Expediente[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('expedientes')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('fecha_creacion', { ascending: false });

  if (error || !data) {
    console.error('Error al obtener expedientes del cliente:', error?.message);
    return [];
  }

  return data.map(fila => ({
    id: fila.id,
    numeroCaso: fila.numero_caso,
    titulo: fila.titulo,
    materia: fila.materia,
    juzgado: fila.juzgado,
    parteContraria: fila.parte_contraria,
    informeDespacho: fila.informe_despacho,
    informeCliente: fila.informe_cliente,
    estado: fila.estado,
    clienteId: fila.cliente_id,
    abogado_id: fila.abogado_id,
    fechaCreacion: new Date(fila.fecha_creacion),
    fechaActualizacion: new Date(fila.fecha_actualizacion),
  }));
}

/* ── Actualizar ──────────────────────────────────────────────── */
export async function actualizarCliente(
  id: string,
  clienteData: Partial<Cliente>
): Promise<boolean> {
  const supabase = createClient();

  /* POST-MIGRACIÓN: nombres + telefono van a perfiles */
  const updatePerfil: any = {};
  if (clienteData.nombresLegales !== undefined) updatePerfil.nombres = clienteData.nombresLegales || null;
  if (clienteData.apellidoPaterno !== undefined) updatePerfil.apellido_paterno = clienteData.apellidoPaterno || null;
  if (clienteData.apellidoMaterno !== undefined) updatePerfil.apellido_materno = clienteData.apellidoMaterno || null;
  if (clienteData.telefono !== undefined) updatePerfil.telefono = clienteData.telefono;

  if (Object.keys(updatePerfil).length > 0) {
    const { error } = await supabase.from('perfiles').update(updatePerfil).eq('id', id);
    if (error) { console.error('Error al actualizar perfil:', error.message); return false; }
  }

  /* POST-MIGRACIÓN: solo datos legales/civiles van a detalles_cliente */
  const camposDetalle: Record<string, any> = {};
  if (clienteData.ci !== undefined) camposDetalle.ci = clienteData.ci || null;
  if (clienteData.expedido !== undefined) camposDetalle.expedido = clienteData.expedido || null;
  if (clienteData.nacionalidad !== undefined) camposDetalle.nacionalidad = clienteData.nacionalidad || null;
  if (clienteData.fechaNacimiento !== undefined) camposDetalle.fecha_nacimiento = clienteData.fechaNacimiento || null;
  if (clienteData.estadoCivil !== undefined) camposDetalle.estado_civil = clienteData.estadoCivil || null;
  if (clienteData.profesion !== undefined) camposDetalle.profesion = clienteData.profesion || null;
  if (clienteData.direccion !== undefined) camposDetalle.direccion = clienteData.direccion || null;

  if (Object.keys(camposDetalle).length > 0) {
    const { error } = await supabase
      .from('detalles_cliente')
      .upsert({ perfil_id: id, ...camposDetalle }, { onConflict: 'perfil_id' });
    if (error) { console.error('Error al actualizar detalles:', error.message); return false; }
  }

  return true;
}

/* ── Eliminar ────────────────────────────────────────────────── */
export async function eliminarCliente(
  id: string
): Promise<{ success: boolean; error?: 'HAS_CASES' | string }> {
  const supabase = createClient();
  const { error } = await supabase.from('perfiles').delete().eq('id', id);

  if (error) {
    if (error.code === '23503') return { success: false, error: 'HAS_CASES' };
    console.error('Error al eliminar cliente:', error.message);
    return { success: false, error: error.message };
  }
  return { success: true };
}

/* ── Contadores ──────────────────────────────────────────────── */
export async function obtenerTotalClientes(): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from('perfiles')
    .select('*', { count: 'exact', head: true })
    .eq('rol', 'cliente');
  if (error) { console.error('Error al contar clientes:', error.message); return 0; }
  return count || 0;
}