"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Plus, MoreHorizontal, Briefcase, Shield } from "lucide-react";
import { MiembroEquipo } from "@/domain/entities/MiembroEquipo";
import { obtenerEquipo } from "@/infrastructure/repositories/equipoRepository";
import { obtenerPerfilActual } from "@/infrastructure/repositories/usuarioRepository";
import { Button } from "@/components/ui/Button";

/* ══════════════════════════════════════════════════════════════
   HELPERS: Configuración visual de Badges
   ══════════════════════════════════════════════════════════════ */

/** Mapeo de estadoLaboral → estilos de badge (píldora). */
const ESTADO_CONFIG: Record<
  MiembroEquipo["estadoLaboral"],
  { label: string; dot: string; bg: string; text: string; border: string }
> = {
  activo: {
    label: "Activo",
    dot: "bg-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  vacaciones: {
    label: "Vacaciones",
    dot: "bg-amber-500",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  inactivo: {
    label: "Inactivo",
    dot: "bg-gray-400",
    bg: "bg-gray-100",
    text: "text-gray-500",
    border: "border-gray-200",
  },
};

/** Mapeo de rol de sistema → estilos de badge sutil. */
const ROL_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  admin: {
    label: "Admin",
    bg: "bg-violet-50",
    text: "text-violet-700",
    border: "border-violet-200",
  },
  abogado: {
    label: "Abogado",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  paralegal: {
    label: "Paralegal",
    bg: "bg-sky-50",
    text: "text-sky-700",
    border: "border-sky-200",
  },
};

/** Devuelve la config de rol; si el rol no está mapeado camelCase-lo al badge genérico. */
function getRolConfig(rol: string) {
  return (
    ROL_CONFIG[rol.toLowerCase()] ?? {
      label: rol.charAt(0).toUpperCase() + rol.slice(1),
      bg: "bg-gray-50",
      text: "text-gray-600",
      border: "border-gray-200",
    }
  );
}

/* ══════════════════════════════════════════════════════════════
   SUB-COMPONENTES
   ══════════════════════════════════════════════════════════════ */

/** Skeleton de tabla mientras se cargan los datos. */
function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-gray-100 last:border-0">
          <td className="py-4 px-6">
            <div className="flex flex-col gap-2">
              <div className="skeleton h-4 w-40 rounded" />
              <div className="skeleton h-3 w-28 rounded" />
            </div>
          </td>
          <td className="py-4 px-6">
            <div className="skeleton h-4 w-32 rounded" />
          </td>
          <td className="py-4 px-6">
            <div className="skeleton h-5 w-20 rounded-full" />
          </td>
          <td className="py-4 px-6">
            <div className="skeleton h-5 w-16 rounded-full" />
          </td>
          <td className="py-4 px-6 text-right">
            <div className="skeleton h-8 w-8 rounded-lg ml-auto" />
          </td>
        </tr>
      ))}
    </>
  );
}

/** Estado vacío cuando no hay miembros registrados. */
function EmptyState({ onCrear }: { onCrear: () => void }) {
  return (
    <tr>
      <td colSpan={5} className="py-24 text-center">
        <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-gray-300" strokeWidth={1.5} />
        </div>
        <h3 className="text-sm font-semibold text-gray-900 mb-1">
          No hay miembros registrados
        </h3>
        <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
          Registra al primer miembro de tu equipo legal para comenzar a gestionar la firma.
        </p>
        <Button variant="primary" onClick={onCrear}>
          <Plus className="w-4 h-4 mr-1.5" />
          Añadir Miembro
        </Button>
      </td>
    </tr>
  );
}

/** Fila individual de la tabla. */
function MemberRow({ miembro }: { miembro: MiembroEquipo }) {
  const estado = ESTADO_CONFIG[miembro.estadoLaboral];
  const rol = getRolConfig(miembro.rol);

  /** Genera las iniciales del miembro para el avatar. */
  const iniciales =
    (miembro.nombres.charAt(0) + miembro.apellidoPaterno.charAt(0)).toUpperCase();

  return (
    <tr className="hover:bg-gray-50/70 transition-colors group">
      {/* ── Miembro (nombre + email) ────────────────────────── */}
      <td className="py-3.5 px-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold tracking-wide shrink-0 shadow-sm">
            {iniciales}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {miembro.nombres} {miembro.apellidoPaterno}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {miembro.email ?? "Sin correo"}
            </p>
          </div>
        </div>
      </td>

      {/* ── Cargo y Especialidad ────────────────────────────── */}
      <td className="py-3.5 px-6">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm text-gray-700 truncate">
            {miembro.cargo || "—"}
          </span>
          {miembro.especialidad && (
            <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 border border-gray-200 shrink-0">
              {miembro.especialidad}
            </span>
          )}
        </div>
      </td>

      {/* ── Rol de Sistema ──────────────────────────────────── */}
      <td className="py-3.5 px-6">
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${rol.bg} ${rol.text} ${rol.border}`}
        >
          <Shield className="w-3 h-3" />
          {rol.label}
        </span>
      </td>

      {/* ── Estado Laboral ──────────────────────────────────── */}
      <td className="py-3.5 px-6">
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${estado.bg} ${estado.text} ${estado.border}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${estado.dot}`} />
          {estado.label}
        </span>
      </td>

      {/* ── Acciones ────────────────────────────────────────── */}
      <td className="py-3.5 px-6 text-right">
        <button
          className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
          title="Ver detalles"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}

/* ══════════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL: Equipo Legal
   ══════════════════════════════════════════════════════════════ */
export default function EquipoPage() {
  const router = useRouter();

  /* ── Estado ─────────────────────────────────────────────────── */
  const [verificando, setVerificando] = useState(true);
  const [cargando, setCargando] = useState(true);
  const [equipo, setEquipo] = useState<MiembroEquipo[]>([]);
  const [error, setError] = useState<string | null>(null);

  /* ── Verificación de acceso (admin-only) + carga de datos ──── */
  useEffect(() => {
    let cancelado = false;

    async function inicializar() {
      /* 1. Verificar que el usuario es admin */
      const perfil = await obtenerPerfilActual();
      if (!perfil || perfil.rol !== "admin") {
        router.push("/dashboard");
        return;
      }
      if (cancelado) return;
      setVerificando(false);

      /* 2. Obtener lista del equipo */
      try {
        const data = await obtenerEquipo();
        if (!cancelado) {
          setEquipo(data);
        }
      } catch (err) {
        if (!cancelado) {
          setError(
            err instanceof Error
              ? err.message
              : "Ocurrió un error al cargar el equipo."
          );
        }
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    }

    inicializar();
    return () => {
      cancelado = true;
    };
  }, [router]);

  /* ── Guard: mientras se verifica acceso ─────────────────────── */
  if (verificando) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]" />
        <p className="mt-4 text-[var(--color-text-muted)]">
          Verificando permisos...
        </p>
      </div>
    );
  }

  /* ── Navegar a la vista de creación ──────────────────────── */
  const handleAnadirMiembro = () => {
    router.push("/dashboard/equipo/nuevo");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* ── Cabecera ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Equipo Legal
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Directorio de abogados y personal de la firma.
          </p>
        </div>
        <Button variant="primary" onClick={handleAnadirMiembro}>
          <Plus className="w-5 h-5 mr-2" />
          Añadir Miembro
        </Button>
      </div>

      {/* ── Error global ──────────────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex gap-3 text-red-800 text-sm font-medium">
          <svg
            className="w-5 h-5 flex-shrink-0 mt-0.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          {error}
        </div>
      )}

      {/* ── Tarjetas métricas (contadores rápidos) ────────────── */}
      {!cargando && !error && equipo.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{equipo.length}</p>
              <p className="text-xs text-gray-500 font-medium">Miembros Totales</p>
            </div>
          </div>
          {/* Activos */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {equipo.filter((m) => m.estadoLaboral === "activo").length}
              </p>
              <p className="text-xs text-gray-500 font-medium">Activos</p>
            </div>
          </div>
          {/* Roles admin */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
              <Shield className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {equipo.filter((m) => m.rol.toLowerCase() === "admin").length}
              </p>
              <p className="text-xs text-gray-500 font-medium">Administradores</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Tabla de Datos ────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200">
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-widest">
                  Miembro
                </th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-widest">
                  Cargo / Especialidad
                </th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-widest">
                  Rol de Sistema
                </th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-widest">
                  Estado
                </th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-widest text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {/* Loading */}
              {cargando && <TableSkeleton />}

              {/* Empty */}
              {!cargando && !error && equipo.length === 0 && (
                <EmptyState onCrear={handleAnadirMiembro} />
              )}

              {/* Data */}
              {!cargando &&
                equipo.map((miembro) => (
                  <MemberRow key={miembro.id} miembro={miembro} />
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
