'use server';

import { createClient } from '@supabase/supabase-js';

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Faltan variables de entorno SUPABASE_URL o SERVICE_ROLE_KEY');
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function crearUsuarioDesdeAdmin(
  email: string,
  password: string
): Promise<{ userId: string } | { error: string }> {
  try {
    const adminClient = createAdminClient();

    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      console.error('[adminAuth] Error creando usuario:', error.message);
      return { error: error.message };
    }

    if (!data.user?.id) {
      return { error: 'No se pudo obtener el ID del usuario creado.' };
    }

    return { userId: data.user.id };
  } catch (e: any) {
    console.error('[adminAuth] Excepción inesperada:', e.message);
    return { error: `Error interno: ${e.message}` };
  }
}

export async function obtenerEmailUsuarioPorId(
  userId: string
): Promise<string> {
  try {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient.auth.admin.getUserById(userId);

    if (error || !data.user?.email) {
      console.error('[adminAuth] Error obteniendo email:', error?.message);
      return '';
    }

    return data.user.email;
  } catch (e: any) {
    console.error('[adminAuth] Excepción inesperada al obtener email:', e.message);
    return '';
  }
}

/* ── Obtener emails en lote (para el directorio) ─────────────── */
export async function obtenerEmailsUsuariosPorIds(
  userIds: string[]
): Promise<Record<string, string>> {
  try {
    const adminClient = createAdminClient();
    const resultado: Record<string, string> = {};

    /* Supabase Admin listUsers trae todos; filtramos en memoria */
    const { data, error } = await adminClient.auth.admin.listUsers({
      perPage: 1000,
    });

    if (error || !data.users) {
      console.error('[adminAuth] Error listando usuarios:', error?.message);
      return resultado;
    }

    const idsSet = new Set(userIds);
    for (const user of data.users) {
      if (idsSet.has(user.id) && user.email) {
        resultado[user.id] = user.email;
      }
    }

    return resultado;
  } catch (e: any) {
    console.error('[adminAuth] Excepción al obtener emails en lote:', e.message);
    return {};
  }
}
