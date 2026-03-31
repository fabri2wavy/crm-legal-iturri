'use server';

import { createClient } from '@supabase/supabase-js';

/* ══════════════════════════════════════════════════════════════
   Cliente Admin con Service Role Key
   — usa auth.admin.createUser() que NO toca la sesión del admin
   — Solo se instancia en Server Actions (jamás en el browser)
   ══════════════════════════════════════════════════════════════ */
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

/* ══════════════════════════════════════════════════════════════
   Server Action: Crear usuario en Auth sin afectar sesión admin
   Retorna: { userId: string } | { error: string }
   ══════════════════════════════════════════════════════════════ */
export async function crearUsuarioDesdeAdmin(
  email: string,
  password: string
): Promise<{ userId: string } | { error: string }> {
  try {
    const adminClient = createAdminClient();

    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,   // Confirma el email automáticamente (no requiere verificación)
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

/* ══════════════════════════════════════════════════════════════
   Server Action: Obtener email de un usuario por su ID
   — El email vive en auth.users, solo accesible con service role
   — Retorna el email como string o cadena vacía si falla
   ══════════════════════════════════════════════════════════════ */
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
