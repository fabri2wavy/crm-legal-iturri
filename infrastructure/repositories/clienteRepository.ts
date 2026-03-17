
import { createClient } from '../supabase/client';
import { Cliente } from '../../domain/entities/Cliente';

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