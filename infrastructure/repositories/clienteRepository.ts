
import { createClient } from '../supabase/client';
import { crearUsuarioDesdeAdmin, obtenerEmailUsuarioPorId } from '../actions/adminAuth';
import { Cliente } from '../../domain/entities/Cliente';
import { Expediente } from '../../domain/entities/Expediente';
import { completarRegistroClienteAdmin } from '../actions/adminDatabase';

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

export interface DatosNuevoCliente {
  /* Auth */
  email: string;
  password: string;

  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  telefono: string;

  ci?: string;
  expedido?: string;
  nacionalidad?: string;
  fechaNacimiento?: string;
  estadoCivil?: string;
  profesion?: string;
  direccion?: string;
}

function mapearCliente(fila: any): Cliente {
  const detalle = fila.detalles_cliente?.[0] ?? fila.detalles_cliente ?? {};

  return {
    id: fila.id,
    nombreCompleto: construirNombreCompleto(fila.nombres, fila.apellido_paterno, fila.apellido_materno),
    email: '',
    telefono: fila.telefono ?? '',
    rol: fila.rol,

    nombresLegales: fila.nombres ?? undefined,
    apellidoPaterno: fila.apellido_paterno ?? undefined,
    apellidoMaterno: fila.apellido_materno ?? undefined,

    ci: detalle.ci ?? undefined,
    expedido: detalle.expedido ?? undefined,
    nacionalidad: detalle.nacionalidad ?? undefined,
    fechaNacimiento: detalle.fecha_nacimiento ?? undefined,
    estadoCivil: detalle.estado_civil ?? undefined,
    profesion: detalle.profesion ?? undefined,
    direccion: detalle.direccion ?? undefined,
  };
}

export async function crearCliente(
  datos: DatosNuevoCliente
): Promise<{ success: boolean; data?: Cliente; error?: string }> {

  const authResult = await crearUsuarioDesdeAdmin(datos.email, datos.password);

  if ('error' in authResult) {
    return { success: false, error: `Error Auth: ${authResult.error}` };
  }

  const userId = authResult.userId;

  const nombreCompleto = construirNombreCompleto(datos.nombres, datos.apellidoPaterno, datos.apellidoMaterno);


  const registroResult = await completarRegistroClienteAdmin(userId, datos);

  if (!registroResult.success) {
    console.error('Error al guardar datos del cliente en DB:', registroResult.error);
    return { success: false, error: `Error DB: ${registroResult.error}` };
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
  const email = await obtenerEmailUsuarioPorId(id);

  const clienteMapeado = mapearCliente(data);
  return { ...clienteMapeado, email };
}

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

export async function actualizarCliente(
  id: string,
  clienteData: Partial<Cliente>
): Promise<boolean> {
  const supabase = createClient();
  const updatePerfil: any = {};
  if (clienteData.nombresLegales !== undefined) updatePerfil.nombres = clienteData.nombresLegales || null;
  if (clienteData.apellidoPaterno !== undefined) updatePerfil.apellido_paterno = clienteData.apellidoPaterno || null;
  if (clienteData.apellidoMaterno !== undefined) updatePerfil.apellido_materno = clienteData.apellidoMaterno || null;
  if (clienteData.telefono !== undefined) updatePerfil.telefono = clienteData.telefono;

  if (Object.keys(updatePerfil).length > 0) {
    const { error } = await supabase.from('perfiles').update(updatePerfil).eq('id', id);
    if (error) { console.error('Error al actualizar perfil:', error.message); return false; }
  }

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

export async function obtenerTotalClientes(): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from('perfiles')
    .select('*', { count: 'exact', head: true })
    .eq('rol', 'cliente');
  if (error) { console.error('Error al contar clientes:', error.message); return 0; }
  return count || 0;
}