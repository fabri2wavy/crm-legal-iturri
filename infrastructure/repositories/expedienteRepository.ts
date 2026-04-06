import { createClient } from '../supabase/client';
import { Expediente, EstadoExpediente } from '../../domain/entities/Expediente';
import { obtenerClientePorId } from './clienteRepository';

function construirNombre(
  nombres?: string | null,
  apellidoPaterno?: string | null,
  apellidoMaterno?: string | null,
  fallback = 'Sin registrar'
): string {
  return [nombres, apellidoPaterno, apellidoMaterno]
    .filter(Boolean)
    .join(' ')
    .trim() || fallback;
}

export async function crearExpediente(expedienteData: Omit<Expediente, 'id' | 'fechaCreacion' | 'fechaActualizacion' | 'estado'>): Promise<Expediente | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error("Error: No hay un usuario autenticado.");
    return null;
  }

  const { data, error } = await supabase
    .from('expedientes')
    .insert([{
      numero_caso: expedienteData.numeroCaso,
      titulo: expedienteData.titulo,
      materia: expedienteData.materia,
      juzgado: expedienteData.juzgado,
      parte_contraria: expedienteData.parteContraria,
      informe_despacho: expedienteData.informeDespacho,
      informe_cliente: expedienteData.informeCliente,
      cliente_id: expedienteData.clienteId,
      abogado_asignado_id: expedienteData.abogado_id
    }])
    .select()
    .single();

  if (error) {
    console.error("Error al crear expediente:", error.message);
    return null;
  }

  return {
    id: data.id,
    numeroCaso: data.numero_caso,
    titulo: data.titulo,
    materia: data.materia,
    juzgado: data.juzgado,
    parteContraria: data.parte_contraria,
    informeDespacho: data.informe_despacho,
    informeCliente: data.informe_cliente,
    estado: data.estado as EstadoExpediente,
    clienteId: data.cliente_id,
    abogado_id: data.abogado_asignado_id,
    fechaCreacion: new Date(data.fecha_creacion),
    fechaActualizacion: new Date(data.fecha_actualizacion)
  };
}

export async function obtenerExpedientes(): Promise<any[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('expedientes')
    .select(`
      *, 
      cliente:perfiles!cliente_id(nombres, apellido_paterno, apellido_materno), 
      abogado:perfiles!abogado_asignado_id(nombres, apellido_paterno, apellido_materno)
    `)
    .order('fecha_creacion', { ascending: false });

  if (error || !data) {
    console.error("Error al obtener expedientes:", error?.message);
    return [];
  }

  return data.map(fila => ({
    id: fila.id,
    numeroCaso: fila.numero_caso,
    titulo: fila.titulo,
    materia: fila.materia,
    juzgado: fila.juzgado,
    parteContraria: fila.parte_contraria,
    estado: fila.estado,
    nombreCliente: construirNombre(
      fila.cliente?.nombres,
      fila.cliente?.apellido_paterno,
      fila.cliente?.apellido_materno,
      'Cliente Desconocido'
    ),
    abogado_id: fila.abogado_asignado_id,
    abogado_nombre: construirNombre(
      fila.abogado?.nombres,
      fila.abogado?.apellido_paterno,
      fila.abogado?.apellido_materno,
      'Sin asignar'
    ),
    fechaCreacion: new Date(fila.fecha_creacion)
  }));
}

export async function obtenerExpedientePorId(id: string): Promise<any | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('expedientes')
    .select(`
      *, 
      cliente:perfiles!cliente_id(id, nombres, apellido_paterno, apellido_materno, telefono), 
      abogado:perfiles!abogado_asignado_id(id, nombres, apellido_paterno, apellido_materno, telefono)
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error("Error al obtener el expediente:", error?.message);
    return null;
  }
  const nombreCliente = construirNombre(
    data.cliente?.nombres,
    data.cliente?.apellido_paterno,
    data.cliente?.apellido_materno,
    'Cliente no asignado'
  );
  let emailCliente = '';
  if (data.cliente_id) {
    const clienteCompleto = await obtenerClientePorId(data.cliente_id);
    emailCliente = clienteCompleto?.email ?? '';
  }

  return {
    id: data.id,
    numeroCaso: data.numero_caso,
    titulo: data.titulo,
    materia: data.materia,
    juzgado: data.juzgado,
    parteContraria: data.parte_contraria,
    informeDespacho: data.informe_despacho,
    informeCliente: data.informe_cliente,
    estado: data.estado,
    clienteId: data.cliente_id,
    cliente: {
      id: data.cliente?.id ?? '',
      nombre_completo: nombreCliente,
      telefono: data.cliente?.telefono ?? '',
      email: emailCliente,
    },
    abogado_id: data.abogado_asignado_id,
    abogado_nombre: construirNombre(
      data.abogado?.nombres,
      data.abogado?.apellido_paterno,
      data.abogado?.apellido_materno,
      'Sin asignar'
    ),
    fechaCreacion: new Date(data.fecha_creacion),
  };
}

export async function actualizarExpediente(
  id: string,
  datosActualizados: { estado?: string; informeDespacho?: string; informeCliente?: string; abogado_id?: string }
): Promise<boolean> {
  const supabase = createClient();
  const paqueteActualizacion: any = {};

  if (datosActualizados.estado) paqueteActualizacion.estado = datosActualizados.estado;
  if (datosActualizados.informeDespacho !== undefined) paqueteActualizacion.informe_despacho = datosActualizados.informeDespacho;
  if (datosActualizados.informeCliente !== undefined) paqueteActualizacion.informe_cliente = datosActualizados.informeCliente;
  if (datosActualizados.abogado_id !== undefined) paqueteActualizacion.abogado_asignado_id = datosActualizados.abogado_id;

  const { error } = await supabase
    .from('expedientes')
    .update(paqueteActualizacion)
    .eq('id', id);

  if (error) {
    console.error("Error al actualizar:", error.message);
    return false;
  }

  return true;
}

export async function obtenerTotalExpedientes(): Promise<number> {
  const supabase = createClient();

  const { count, error } = await supabase
    .from('expedientes')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error("Error al obtener el recuento de expedientes:", error.message);
    return 0;
  }

  return count || 0;
}