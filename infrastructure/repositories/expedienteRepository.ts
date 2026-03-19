// infrastructure/repositories/expedienteRepository.ts

import { createClient } from '../supabase/client';
import { Expediente, EstadoExpediente } from '../../domain/entities/Expediente';
// infrastructure/repositories/expedienteRepository.ts

export async function crearExpediente(expedienteData: Omit<Expediente, 'id' | 'fechaCreacion' | 'fechaActualizacion' | 'estado'>): Promise<Expediente | null> {
  const supabase = createClient();

  // 1. MAGIA: Obtenemos el ID real del abogado que tiene la sesión iniciada
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error("❌ Error: No hay un usuario autenticado.");
    return null;
  }

  // 2. Insertamos usando el user.id en lugar del texto falso
  const { data, error } = await supabase
    .from('expedientes')
    .insert([
      {
        numero_caso: expedienteData.numeroCaso,
        titulo: expedienteData.titulo,
        materia: expedienteData.materia,
        juzgado: expedienteData.juzgado,
        parte_contraria: expedienteData.parteContraria,
        informe_despacho: expedienteData.informeDespacho,
        informe_cliente: expedienteData.informeCliente,
        cliente_id: expedienteData.clienteId,
        abogado_asignado_id: user.id // <-- Usamos el ID real de Supabase Auth
      }
    ])
    .select()
    .single();

  if (error) {
    console.error("❌ Error al crear expediente:", error.message);
    return null;
  }

  // Devolvemos los datos empaquetados limpios
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
    abogadoAsignadoId: data.abogado_asignado_id,
    fechaCreacion: new Date(data.fecha_creacion),
    fechaActualizacion: new Date(data.fecha_actualizacion)
  };
}

export async function obtenerExpedientes(): Promise<any[]> {
  const supabase = createClient();

  // Traemos los expedientes Y el nombre del cliente asociado (Magia de bases de datos relacionales)
  const { data, error } = await supabase
    .from('expedientes')
    .select(`
      *,
      clientes (
        nombre_completo
      )
    `)
    .order('fecha_creacion', { ascending: false });

  if (error || !data) {
    console.error("❌ Error al obtener expedientes:", error?.message);
    return [];
  }

  // Traducimos de snake_case (BD) a camelCase (Nuestro Dominio)
  return data.map(fila => ({
    id: fila.id,
    numeroCaso: fila.numero_caso,
    titulo: fila.titulo,
    materia: fila.materia,
    juzgado: fila.juzgado,
    parteContraria: fila.parte_contraria,
    estado: fila.estado,
    nombreCliente: fila.clientes?.nombre_completo || 'Cliente Desconocido',
    fechaCreacion: new Date(fila.fecha_creacion)
  }));
}

export async function obtenerExpedientePorId(id: string): Promise<any | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('expedientes')
    .select(`
      *,
      clientes (
        nombre_completo,
        carnet_identidad,
        telefono,
        email
      )
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error("Error al obtener el expediente:", error?.message);
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
    estado: data.estado,
    cliente: data.clientes, 
    fechaCreacion: new Date(data.fecha_creacion)
  };
}

// Función para actualizar cualquier campo de un expediente existente
export async function actualizarExpediente(
  id: string, 
  datosActualizados: { estado?: string; informeDespacho?: string; informeCliente?: string }
): Promise<boolean> {
  const supabase = createClient();
  const paqueteActualizacion: any = {};
  if (datosActualizados.estado) paqueteActualizacion.estado = datosActualizados.estado;
  if (datosActualizados.informeDespacho !== undefined) paqueteActualizacion.informe_despacho = datosActualizados.informeDespacho;
  if (datosActualizados.informeCliente !== undefined) paqueteActualizacion.informe_cliente = datosActualizados.informeCliente;

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