
import { createClient } from '../supabase/client';
import { Cliente } from '../../domain/entities/Cliente';
import { Expediente } from '../../domain/entities/Expediente';

export async function crearCliente(clienteData: Omit<Cliente, 'id' | 'fechaRegistro'>): Promise<Cliente | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('clientes')
    .insert([
      {
        nombre_completo: clienteData.nombreCompleto,
        carnet_identidad: clienteData.carnetIdentidad,
        telefono: clienteData.telefono,
        email: clienteData.email
      }
    ])
    .select()
    .single(); 

  if (error) {
    console.error("Error en la base de datos al crear cliente:", error.message);
    return null;
  }
  return {
    id: data.id,
    nombreCompleto: data.nombre_completo,
    carnetIdentidad: data.carnet_identidad,
    telefono: data.telefono,
    email: data.email,
    fechaRegistro: new Date(data.fecha_registro)
  };
}
export async function obtenerClientes(): Promise<Cliente[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('fecha_registro', { ascending: false });

  if (error || !data) {
    console.error("Error al obtener clientes:", error?.message);
    return [];
  }

  return data.map(fila => ({
    id: fila.id,
    nombreCompleto: fila.nombre_completo,
    carnetIdentidad: fila.carnet_identidad,
    telefono: fila.telefono,
    email: fila.email,
    fechaRegistro: new Date(fila.fecha_registro)
  }));
}

export async function obtenerClientePorId(id: string): Promise<Cliente | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error("Error al obtener cliente por ID:", error?.message);
    return null;
  }

  return {
    id: data.id,
    nombreCompleto: data.nombre_completo,
    carnetIdentidad: data.carnet_identidad,
    telefono: data.telefono,
    email: data.email,
    fechaRegistro: new Date(data.fecha_registro)
  };
}

export async function obtenerExpedientesPorCliente(clienteId: string): Promise<Expediente[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('expedientes')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('fecha_creacion', { ascending: false });

  if (error || !data) {
    console.error("Error al obtener expedientes del cliente:", error?.message);
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
    abogadoAsignadoId: fila.abogado_asignado_id,
    fechaCreacion: new Date(fila.fecha_creacion),
    fechaActualizacion: new Date(fila.fecha_actualizacion)
  }));
}

export async function actualizarCliente(id: string, clienteData: Partial<Cliente>): Promise<boolean> {
  const supabase = createClient();
  
  // Mapeo de camelCase a snake_case para Supabase
  const updateData: any = {};
  if (clienteData.nombreCompleto) updateData.nombre_completo = clienteData.nombreCompleto;
  if (clienteData.carnetIdentidad) updateData.carnet_identidad = clienteData.carnetIdentidad;
  if (clienteData.telefono) updateData.telefono = clienteData.telefono;
  if (clienteData.email) updateData.email = clienteData.email;

  const { error } = await supabase
    .from('clientes')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error("Error al actualizar cliente:", error.message);
    return false;
  }

  return true;
}

export async function eliminarCliente(id: string): Promise<{ success: boolean; error?: 'HAS_CASES' | string }> {
  const supabase = createClient();

  const { error } = await supabase
    .from('clientes')
    .delete()
    .eq('id', id);

  if (error) {
    // Código 23503: Foreign Key Violation (el cliente tiene expedientes)
    if (error.code === '23503') {
      return { success: false, error: 'HAS_CASES' };
    }
    console.error("Error al eliminar cliente:", error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
}