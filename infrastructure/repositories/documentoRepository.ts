import { createClient } from '../supabase/client';
import { Documento } from '../../domain/entities/Documento';

const BUCKET = 'documentos_expedientes';

/* ── Subir un documento al bucket ──────────────────────────── */
export async function subirDocumento(
  expedienteId: string,
  file: File
): Promise<Documento | null> {
  const supabase = createClient();

  // Prefijo único para evitar colisiones de nombre (ej: 17100000_contrato.pdf)
  const timestamp = Date.now();
  const ruta = `${expedienteId}/${timestamp}_${file.name}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(ruta, file, { upsert: false });

  if (error) {
    console.error('Error al subir documento:', error.message);
    return null;
  }

  return {
    nombre: file.name,
    ruta,
    tamaño: file.size,
    fechaSubida: new Date(),
  };
}

/* ── Listar documentos de un expediente ────────────────────── */
export async function obtenerDocumentos(
  expedienteId: string
): Promise<Documento[]> {
  const supabase = createClient();

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(expedienteId, {
      sortBy: { column: 'created_at', order: 'desc' },
    });

  if (error || !data) {
    console.error('Error al listar documentos:', error?.message);
    return [];
  }

  // Filtramos archivos reales (Supabase puede devolver un placeholder .emptyFolderPlaceholder)
  // y mapeamos al formato de la Entidad de Dominio (camelCase)
  return data
    .filter((item) => item.name !== '.emptyFolderPlaceholder')
    .map((item) => {
      // Removemos el prefijo de timestamp para mostrar solo el nombre original limpio
      const nombreLimpio = item.name.replace(/^\d+_/, '');

      return {
        nombre: nombreLimpio,
        ruta: `${expedienteId}/${item.name}`,
        tamaño: item.metadata?.size ?? 0,
        fechaSubida: item.created_at ? new Date(item.created_at) : new Date(),
      };
    });
}

/* ── Obtener URL firmada de descarga (válida 60 min) ───────── */
export async function obtenerUrlDescarga(
  ruta: string
): Promise<string | null> {
  const supabase = createClient();

  const { data, error } = await supabase.storage
    .from('documentos_expedientes')
    .createSignedUrl(ruta, 3600, { download: true });

  if (error || !data?.signedUrl) {
    console.error('Error al generar URL de descarga:', error?.message);
    return null;
  }

  return data.signedUrl;
}

/* ── Eliminar un documento del bucket ──────────────────────── */
export async function eliminarDocumento(
  ruta: string
): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([ruta]);

  if (error) {
    console.error('Error al eliminar documento:', error.message);
    return false;
  }

  return true;
}

