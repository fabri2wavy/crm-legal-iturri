'use server';

import { createClient } from '../supabase/client';
import {
  Honorario,
  CuotaPago,
  GastoExpediente,
  EstadoCuentaExpediente,
  MonedaHonorario,
  EstadoContrato,
  EstadoCuota,
  CreateHonorarioDTO,
  CreateCuotaDTO,
  CreateGastoDTO,
} from '../../domain/entities/Finanzas';

/* ══════════════════════════════════════════════════════════════
   Contrato de respuesta monolítico
   ──────────────────────────────────────────────────────────────
   Cada método del repositorio retorna este shape para que la UI
   pueda discriminar éxito/fallo sin try/catch.
   ══════════════════════════════════════════════════════════════ */

interface RepositoryResponse<T> {
  data: T | null;
  error: string | null;
}

/* ══════════════════════════════════════════════════════════════
   Helpers internos de mapeo snake_case → camelCase
   ══════════════════════════════════════════════════════════════ */

interface FilaHonorario {
  id: string;
  expediente_id: string;
  monto_total: number;
  moneda: string;
  estado_contrato: string;
  creado_en: string;
  cuotas_pago?: FilaCuota[];
}

interface FilaCuota {
  id: string;
  honorario_id: string;
  descripcion: string;
  monto: number;
  fecha_vencimiento: string;
  estado: string;
  fecha_pago: string | null;
  creado_en: string;
}

interface FilaGasto {
  id: string;
  expediente_id: string;
  concepto: string;
  monto: number;
  fecha: string;
  reembolsado: boolean;
  comprobante_url: string | null;
  creado_en: string;
}

function mapearHonorario(fila: FilaHonorario): Honorario {
  return {
    id: fila.id,
    expedienteId: fila.expediente_id,
    montoTotal: fila.monto_total,
    moneda: fila.moneda as MonedaHonorario,
    estadoContrato: fila.estado_contrato as EstadoContrato,
    creadoEn: fila.creado_en,
  };
}

function mapearCuota(fila: FilaCuota): CuotaPago {
  return {
    id: fila.id,
    honorarioId: fila.honorario_id,
    descripcion: fila.descripcion,
    monto: fila.monto,
    fechaVencimiento: fila.fecha_vencimiento,
    estado: fila.estado as EstadoCuota,
    fechaPago: fila.fecha_pago,
    creadoEn: fila.creado_en,
  };
}

function mapearGasto(fila: FilaGasto): GastoExpediente {
  return {
    id: fila.id,
    expedienteId: fila.expediente_id,
    concepto: fila.concepto,
    monto: fila.monto,
    fecha: fila.fecha,
    reembolsado: fila.reembolsado,
    comprobanteUrl: fila.comprobante_url,
    creadoEn: fila.creado_en,
  };
}

/* ══════════════════════════════════════════════════════════════
   QUERY: Obtener estado de cuenta completo de un expediente
   ──────────────────────────────────────────────────────────────
   Consulta relacional profunda:
     • honorarios con cuotas_pago(*) anidadas
     • gastos_expediente por expediente_id
   Ordena cuotas y gastos por fecha ascendente.
   ══════════════════════════════════════════════════════════════ */

export async function obtenerEstadoCuenta(
  expedienteId: string
): Promise<RepositoryResponse<EstadoCuentaExpediente>> {
  const supabase = createClient();

  try {
    /* ── Honorario + cuotas anidadas (relación 1:N) ──────────── */
    const { data: honorarioRaw, error: honorarioError } = await supabase
      .from('honorarios')
      .select('*, cuotas_pago(*)')
      .eq('expediente_id', expedienteId)
      .maybeSingle();

    if (honorarioError) {
      return { data: null, error: `Error al obtener honorario: ${honorarioError.message}` };
    }

    /* ── Gastos operativos del expediente ─────────────────────── */
    const { data: gastosRaw, error: gastosError } = await supabase
      .from('gastos_expediente')
      .select('*')
      .eq('expediente_id', expedienteId)
      .order('fecha', { ascending: true });

    if (gastosError) {
      return { data: null, error: `Error al obtener gastos: ${gastosError.message}` };
    }

    /* ── Mapeo a entidades de dominio ─────────────────────────── */
    const honorarioFila = honorarioRaw as FilaHonorario | null;

    const cuotasOrdenadas = (honorarioFila?.cuotas_pago ?? [])
      .sort((a, b) => a.fecha_vencimiento.localeCompare(b.fecha_vencimiento))
      .map(mapearCuota);

    const estadoCuenta: EstadoCuentaExpediente = {
      honorario: honorarioFila ? mapearHonorario(honorarioFila) : null,
      cuotas: cuotasOrdenadas,
      gastos: ((gastosRaw ?? []) as FilaGasto[]).map(mapearGasto),
    };

    return { data: estadoCuenta, error: null };
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : 'Error desconocido al obtener estado de cuenta.';
    return { data: null, error: mensaje };
  }
}

/* ══════════════════════════════════════════════════════════════
   MUTATION: Crear honorario con su bloque de cuotas
   ──────────────────────────────────────────────────────────────
   Flujo controlado en 2 pasos:
     1. Inserta el contrato principal → captura `id` retornado.
     2. Inserta las N cuotas vinculadas al honorario_id.
   ══════════════════════════════════════════════════════════════ */

export async function crearHonorarioConCuotas(
  data: CreateHonorarioDTO,
  cuotas: CreateCuotaDTO[]
): Promise<RepositoryResponse<{ honorario: Honorario; cuotas: CuotaPago[] }>> {
  const supabase = createClient();

  try {
    /* ── Validación de identidad en servidor ──────────────────── */
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return {
        data: null,
        error: `No se pudo verificar la sesión: ${authError?.message ?? 'Usuario no autenticado.'}`,
      };
    }

    /* ── Paso 1: Insertar honorario ──────────────────────────── */
    const { data: honorarioInsertado, error: honorarioError } = await supabase
      .from('honorarios')
      .insert({
        expediente_id: data.expedienteId,
        monto_total: data.montoTotal,
        moneda: data.moneda,
        estado_contrato: data.estadoContrato,
      })
      .select()
      .single();

    if (honorarioError || !honorarioInsertado) {
      return {
        data: null,
        error: `Error al crear honorario: ${honorarioError?.message ?? 'No se recibieron datos de la inserción.'}`,
      };
    }

    const honorarioId: string = honorarioInsertado.id;

    /* ── Paso 2: Insertar cuotas vinculadas ──────────────────── */
    const cuotasParaInsertar = cuotas.map((cuota) => ({
      honorario_id: honorarioId,
      descripcion: cuota.descripcion,
      monto: cuota.monto,
      fecha_vencimiento: cuota.fechaVencimiento,
      estado: cuota.estado,
      fecha_pago: cuota.fechaPago,
    }));

    const { data: cuotasInsertadas, error: cuotasError } = await supabase
      .from('cuotas_pago')
      .insert(cuotasParaInsertar)
      .select();

    if (cuotasError) {
      return {
        data: null,
        error: `Honorario creado pero falló la inserción de cuotas: ${cuotasError.message}`,
      };
    }

    /* ── Mapeo a dominio ─────────────────────────────────────── */
    return {
      data: {
        honorario: mapearHonorario(honorarioInsertado as FilaHonorario),
        cuotas: ((cuotasInsertadas ?? []) as FilaCuota[]).map(mapearCuota),
      },
      error: null,
    };
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : 'Error desconocido al crear honorario.';
    return { data: null, error: mensaje };
  }
}

/* ══════════════════════════════════════════════════════════════
   MUTATION: Registrar gasto operativo de un expediente
   ══════════════════════════════════════════════════════════════ */

export async function registrarGasto(
  gasto: CreateGastoDTO
): Promise<RepositoryResponse<GastoExpediente>> {
  const supabase = createClient();

  try {
    /* ── Validación de identidad en servidor ──────────────────── */
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return {
        data: null,
        error: `No se pudo verificar la sesión: ${authError?.message ?? 'Usuario no autenticado.'}`,
      };
    }

    /* ── Inserción DML ───────────────────────────────────────── */
    const { data: gastoInsertado, error: gastoError } = await supabase
      .from('gastos_expediente')
      .insert({
        expediente_id: gasto.expedienteId,
        concepto: gasto.concepto,
        monto: gasto.monto,
        fecha: gasto.fecha,
        reembolsado: gasto.reembolsado,
        comprobante_url: gasto.comprobanteUrl,
      })
      .select()
      .single();

    if (gastoError || !gastoInsertado) {
      return {
        data: null,
        error: `Error al registrar gasto: ${gastoError?.message ?? 'No se recibieron datos de la inserción.'}`,
      };
    }

    return {
      data: mapearGasto(gastoInsertado as FilaGasto),
      error: null,
    };
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : 'Error desconocido al registrar gasto.';
    return { data: null, error: mensaje };
  }
}
