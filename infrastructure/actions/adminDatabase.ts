"use server";

import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function completarRegistroClienteAdmin(userId: string, datos: any) {
    try {
        const { error: perfilError } = await supabaseAdmin
            .from('perfiles')
            .update({
                nombres: datos.nombres || null,
                apellido_paterno: datos.apellidoPaterno || null,
                apellido_materno: datos.apellidoMaterno || null,
                telefono: datos.telefono || null,
                rol: 'cliente',
            })
            .eq('id', userId);

        if (perfilError) throw new Error(perfilError.message);

        const { error: detalleError } = await supabaseAdmin
            .from('detalles_cliente')
            .insert([{
                perfil_id: userId,
                ci: datos.ci || null,
                expedido: datos.expedido || null,
                nacionalidad: datos.nacionalidad || null,
                fecha_nacimiento: datos.fechaNacimiento || null,
                estado_civil: datos.estadoCivil || null,
                profesion: datos.profesion || null,
                direccion: datos.direccion || null,
            }]);

        if (detalleError) throw new Error(detalleError.message);

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}