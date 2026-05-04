
import { createClient } from '../supabase/client';
import { crearUsuarioDesdeAdmin, obtenerEmailUsuarioPorId, obtenerEmailsUsuariosPorIds } from '../actions/adminAuth';
import { Cliente } from '../../domain/entities/Cliente';
import { Expediente } from '../../domain/entities/Expediente';
import { completarRegistroClienteAdmin, actualizarPerfilAdmin, eliminarPerfilAdmin, actualizarDetallesAdmin } from '../actions/adminDatabase';

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
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const loggedInUserId = userData.user?.id;

  const authResult = await crearUsuarioDesdeAdmin(datos.email, datos.password);

  if ('error' in authResult) {
    return { success: false, error: `Error Auth: ${authResult.error}` };
  }

  const userId = authResult.userId;

  const nombreCompleto = construirNombreCompleto(datos.nombres, datos.apellidoPaterno, datos.apellidoMaterno);


  const registroResult = await completarRegistroClienteAdmin(userId, datos, loggedInUserId);

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

  const clientesSinEmail = data.map(mapearCliente);

  /* Hidratar emails en un solo batch (Server Action con service_role) */
  const ids = clientesSinEmail.map((c) => c.id);
  const emailMap = await obtenerEmailsUsuariosPorIds(ids);

  return clientesSinEmail.map((c) => ({
    ...c,
    email: emailMap[c.id] || '',
  }));
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
  /* Mapeamos camelCase (dominio) → snake_case (DB) */
  const perfilData: Record<string, any> = {};
  if (clienteData.nombresLegales !== undefined) perfilData.nombres = clienteData.nombresLegales || null;
  if (clienteData.apellidoPaterno !== undefined) perfilData.apellido_paterno = clienteData.apellidoPaterno || null;
  if (clienteData.apellidoMaterno !== undefined) perfilData.apellido_materno = clienteData.apellidoMaterno || null;
  if (clienteData.telefono !== undefined) perfilData.telefono = clienteData.telefono || null;

  /* Delegamos al Server Action con service_role (bypass RLS) */
  const result = await actualizarPerfilAdmin(id, perfilData);

  if (!result.success) {
    console.error('Error al actualizar cliente:', result.error);
    return false;
  }

  /* Campos de detalle (tabla detalles_cliente) */
  const detallesData: Record<string, any> = {};
  if (clienteData.ci !== undefined) detallesData.ci = clienteData.ci || null;
  if (clienteData.expedido !== undefined) detallesData.expedido = clienteData.expedido || null;

  if (Object.keys(detallesData).length > 0) {
    const detallesResult = await actualizarDetallesAdmin(id, detallesData);
    if (!detallesResult.success) {
      console.error('Error al actualizar detalles del cliente:', detallesResult.error);
      return false;
    }
  }

  return true;
}

export async function eliminarCliente(
  id: string
): Promise<{ success: boolean; error?: 'HAS_CASES' | string }> {
  /* Delegamos al Server Action con service_role (bypass RLS) */
  const result = await eliminarPerfilAdmin(id);

  if (!result.success) {
    if (result.error === 'HAS_CASES') return { success: false, error: 'HAS_CASES' };
    console.error('Error al eliminar cliente:', result.error);
    return { success: false, error: result.error };
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