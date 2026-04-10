'use server';

import { createClient } from '@supabase/supabase-js';
import { MiembroEquipo } from '../../domain/entities/MiembroEquipo';

/* ══════════════════════════════════════════════════════════════
   Cliente Admin (service_role — bypass RLS)
   ══════════════════════════════════════════════════════════════ */

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/* ══════════════════════════════════════════════════════════════
   Tipo de entrada (sin campos generados por el servidor)
   ══════════════════════════════════════════════════════════════ */

type DatosNuevoMiembro = Omit<MiembroEquipo, 'id' | 'estadoLaboral'>;

/* ══════════════════════════════════════════════════════════════
   SERVER ACTION: Registrar nuevo miembro del equipo
   ──────────────────────────────────────────────────────────────
   Transacción de 3 pasos:
     1. auth.admin.createUser → genera el UUID en auth.users
     2. Insert en `perfiles` con ese UUID
     3. Insert en `detalles_equipo` con ese UUID

   Si falla el paso 2 o 3, se elimina el usuario de Auth
   para no dejar datos huérfanos.
   ══════════════════════════════════════════════════════════════ */

export async function registrarNuevoMiembro(
  datos: DatosNuevoMiembro
): Promise<{ success: true; data: MiembroEquipo } | { success: false; error: string }> {
  let userId: string | null = null;

  try {
    /* ── Paso 1: Crear usuario en Auth ────────────────────────── */
    const email = datos.email?.trim();
    if (!email) {
      return { success: false, error: 'El correo electrónico es obligatorio para crear la cuenta.' };
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: 'Temporal123!',
      email_confirm: true,
    });

    if (authError) {
      console.error('[equipoActions] Error auth.admin.createUser:', authError.message);
      return { success: false, error: `Error al crear la cuenta: ${authError.message}` };
    }

    if (!authData.user?.id) {
      return { success: false, error: 'No se pudo obtener el ID del usuario creado.' };
    }

    userId = authData.user.id;

    /* ── Paso 2: Insertar en `perfiles` ──────────────────────── */
    const { error: perfilError } = await supabaseAdmin
      .from('perfiles')
      .update({
        nombres: datos.nombres,
        apellido_paterno: datos.apellidoPaterno,
        apellido_materno: datos.apellidoMaterno || null,
        telefono: datos.telefono || null,
        rol: datos.rol,
      })
      .eq('id', userId);

    if (perfilError) {
      console.error('[equipoActions] Error insert perfiles:', perfilError.message);
      /* Rollback: eliminar el usuario de Auth */
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return { success: false, error: `Error al crear el perfil: ${perfilError.message}` };
    }

    /* ── Paso 3: Insertar en `detalles_equipo` ───────────────── */
    const { error: detalleError } = await supabaseAdmin
      .from('detalles_equipo')
      .insert({
        id: userId,
        cargo: datos.cargo,
        especialidad: datos.especialidad || null,
        estado_laboral: 'activo',
      });

    if (detalleError) {
      console.error('[equipoActions] Error insert detalles_equipo:', detalleError.message);
      /* Rollback: eliminar perfil y usuario de Auth */
      await supabaseAdmin.from('perfiles').delete().eq('id', userId);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return { success: false, error: `Error al crear los detalles: ${detalleError.message}` };
    }

    /* ── Éxito: retornar la entidad de dominio completa ───────── */
    return {
      success: true,
      data: {
        id: userId,
        nombres: datos.nombres,
        apellidoPaterno: datos.apellidoPaterno,
        apellidoMaterno: datos.apellidoMaterno,
        email: email,
        telefono: datos.telefono || null,
        rol: datos.rol,
        cargo: datos.cargo,
        especialidad: datos.especialidad || null,
        estadoLaboral: 'activo',
      },
    };
  } catch (err: any) {
    console.error('[equipoActions] Excepción inesperada:', err.message);

    /* Rollback de emergencia si hay userId */
    if (userId) {
      await supabaseAdmin.auth.admin.deleteUser(userId).catch(() => {});
    }

    return { success: false, error: `Error inesperado: ${err.message}` };
  }
}
