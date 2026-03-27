import { createClient } from '../supabase/client';
import { Documento } from '../../domain/entities/Documento';

const BUCKET = 'documentos';

/* ── Listar documentos de un expediente (desde tabla BD) ───── */
export async function obtenerDocumentos(
  expedienteId: string
): Promise<Documento[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('documentos')
    .select('*, subido_por_perfil:perfiles!subido_por(nombre_completo)')
    .eq('expediente_id', expedienteId)
    .order('creado_en', { ascending: false });

  if (error || !data) {
    console.error('Error al listar documentos:', error?.message);
    return [];
  }

  return data.map(fila => ({
    id: fila.id,
    nombre: fila.nombre_archivo,
    ruta: fila.ruta_storage,
    tamaño: fila.tamano_bytes ?? 0,
    visibleCliente: fila.visible_cliente ?? false,
    subidoPor: fila.subido_por_perfil?.nombre_completo || 'Desconocido',
    fechaSubida: new Date(fila.creado_en),
  }));
}

/* ── Subir documento (Storage + INSERT en tabla BD) ────────── */
export async function subirDocumento(
  expedienteId: string,
  file: File,
  visibleCliente: boolean
): Promise<Documento | null> {
  const supabase = createClient();

  // 1. Obtener el usuario autenticado
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('Error: No hay usuario autenticado para subir documento.');
    return null;
  }

  // 2. Subir archivo físico al bucket de Storage
  const timestamp = Date.now();
  const rutaStorage = `${expedienteId}/${timestamp}_${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(rutaStorage, file, { upsert: false });

  if (uploadError) {
    console.error('Error al subir archivo a Storage:', uploadError.message);
    return null;
  }

  // 3. Registrar metadatos en la tabla `documentos`
  const { data: insertData, error: insertError } = await supabase
    .from('documentos')
    .insert([{
      expediente_id: expedienteId,
      nombre_archivo: file.name,
      ruta_storage: rutaStorage,
      tipo_archivo: file.type || 'application/octet-stream',
      tamano_bytes: file.size,
      visible_cliente: visibleCliente,
      subido_por: user.id,
    }])
    .select('*, subido_por_perfil:perfiles!subido_por(nombre_completo)')
    .single();

  if (insertError || !insertData) {
    console.error('Error al registrar documento en BD:', insertError?.message);
    // Limpieza: si el INSERT falla, eliminamos el archivo huérfano del Storage
    await supabase.storage.from(BUCKET).remove([rutaStorage]);
    return null;
  }

  return {
    id: insertData.id,
    nombre: insertData.nombre_archivo,
    ruta: insertData.ruta_storage,
    tamaño: insertData.tamano_bytes ?? file.size,
    visibleCliente: insertData.visible_cliente ?? false,
    subidoPor: insertData.subido_por_perfil?.nombre_completo || 'Tú',
    fechaSubida: new Date(insertData.creado_en),
  };
}

/* ── Obtener URL firmada de descarga (válida 60 min) ───────── */
export async function obtenerUrlDescarga(
  ruta: string
): Promise<string | null> {
  const supabase = createClient();

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(ruta, 3600, { download: true });

  if (error || !data?.signedUrl) {
    console.error('Error al generar URL de descarga:', error?.message);
    return null;
  }

  return data.signedUrl;
}

/* ── Eliminar documento (Storage + DELETE en tabla BD) ──────── */
export async function eliminarDocumento(
  id: string,
  ruta: string
): Promise<boolean> {
  const supabase = createClient();

  // 1. Eliminar registro de la BD
  const { error: dbError } = await supabase
    .from('documentos')
    .delete()
    .eq('id', id);

  if (dbError) {
    console.error('Error al eliminar registro de BD:', dbError.message);
    return false;
  }

  // 2. Eliminar archivo físico del bucket
  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .remove([ruta]);

  if (storageError) {
    console.error('Error al eliminar archivo de Storage (registro BD ya eliminado):', storageError.message);
  }

  return true;
}

/* ── Cambiar visibilidad de un documento ───────────────────── */
export async function actualizarVisibilidad(
  id: string,
  visibleCliente: boolean
): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from('documentos')
    .update({ visible_cliente: visibleCliente })
    .eq('id', id);

  if (error) {
    console.error('Error al cambiar visibilidad:', error.message);
    return false;
  }

  return true;
}
