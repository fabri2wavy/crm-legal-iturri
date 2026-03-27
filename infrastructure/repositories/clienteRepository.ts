
import { createClient } from '../supabase/client';
import { Cliente } from '../../domain/entities/Cliente';
import { Expediente } from '../../domain/entities/Expediente';

// ── Crear ────────────────────────────────────────────────────
// NOTA: Se tocará en Fase 2, se deja intacta.
export async function crearCliente(clienteData: Omit<Cliente, 'id' | 'rol'>): Promise<Cliente | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('perfiles')
    .insert([
      {
        nombre_completo: clienteData.nombreCompleto,
        email: clienteData.email,
        rol: 'cliente'
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
    email: data.email ?? '',
    rol: data.rol,
  };
}

// ── Listar ───────────────────────────────────────────────────
export async function obtenerClientes(): Promise<Cliente[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('perfiles')
    .select('*')
    .eq('rol', 'cliente')
    .order('nombre_completo', { ascending: true });

  if (error || !data) {
    console.error("Error al obtener clientes:", error?.message);
    return [];
  }

  return data.map(fila => ({
    id: fila.id,
    nombreCompleto: fila.nombre_completo,
    email: fila.email ?? '',
    rol: fila.rol,
  }));
}

// ── Obtener por ID ───────────────────────────────────────────
export async function obtenerClientePorId(id: string): Promise<Cliente | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('perfiles')
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
    email: data.email ?? '',
    rol: data.rol,
  };
}

// ── Expedientes del cliente ──────────────────────────────────
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
    abogado_id: fila.abogado_id,
    fechaCreacion: new Date(fila.fecha_creacion),
    fechaActualizacion: new Date(fila.fecha_actualizacion)
  }));
}

// ── Actualizar ───────────────────────────────────────────────
export async function actualizarCliente(id: string, clienteData: Partial<Cliente>): Promise<boolean> {
  const supabase = createClient();

  const updateData: any = {};
  if (clienteData.nombreCompleto) updateData.nombre_completo = clienteData.nombreCompleto;
  if (clienteData.email) updateData.email = clienteData.email;

  const { error } = await supabase
    .from('perfiles')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error("Error al actualizar cliente:", error.message);
    return false;
  }

  return true;
}

// ── Eliminar ─────────────────────────────────────────────────
export async function eliminarCliente(id: string): Promise<{ success: boolean; error?: 'HAS_CASES' | string }> {
  const supabase = createClient();

  const { error } = await supabase
    .from('perfiles')
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

// ── Contadores ───────────────────────────────────────────────
export async function obtenerTotalClientes(): Promise<number> {
  const supabase = createClient();

  const { count, error } = await supabase
    .from('perfiles')
    .select('*', { count: 'exact', head: true })
    .eq('rol', 'cliente');

  if (error) {
    console.error("Error al obtener el recuento de clientes:", error.message);
    return 0; // Se maneja el error silenciosamente
  }

  return count || 0;
}