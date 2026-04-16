"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Gavel,
  Users,
  AlertTriangle,
  CheckSquare,
  ChevronDown,
  XCircle,
  CalendarRange,
} from "lucide-react";
import { TipoEventoAgenda } from "../../../domain/entities/EventoAgenda";

/* ══════════════════════════════════════════════════════════════
   Claves de URL — contrato estricto con el page.tsx
   ══════════════════════════════════════════════════════════════ */

/** Parámetros de búsqueda que la barra inyecta en la URL */
export const PARAM_KEYS = {
  asignado: "asignado",
  desde: "desde",
  hasta: "hasta",
  tipo: "tipo",
} as const;

/** Valores válidos para el pill de tipo (incluyendo "todos" = sin filtro) */
const TIPOS_VALIDOS: ReadonlySet<string> = new Set([
  "audiencia",
  "reunion",
  "vencimiento",
  "tarea",
]);

/* ══════════════════════════════════════════════════════════════
   Props — simplificadas vs. la versión anterior:
   ya NO recibe onFiltrosChange (la URL es la fuente).
   ══════════════════════════════════════════════════════════════ */

export interface AgendaFiltrosProps {
  abogados: Array<{ id: string; nombre_completo: string }>;
  isLoading?: boolean;
}

/* ── Configuración de pills ──────────────────────────────────── */

const TIPO_PILLS: Array<{
  value: TipoEventoAgenda | "todos";
  label: string;
  icon: React.ReactNode;
}> = [
  { value: "todos", label: "Todos", icon: null },
  {
    value: "audiencia",
    label: "Audiencia",
    icon: <Gavel className="w-3 h-3" />,
  },
  {
    value: "reunion",
    label: "Reunión",
    icon: <Users className="w-3 h-3" />,
  },
  {
    value: "vencimiento",
    label: "Vencimiento",
    icon: <AlertTriangle className="w-3 h-3" />,
  },
  {
    value: "tarea",
    label: "Tarea",
    icon: <CheckSquare className="w-3 h-3" />,
  },
];

/* ══════════════════════════════════════════════════════════════
   Helpers — lectura segura de searchParams
   ══════════════════════════════════════════════════════════════ */

function leerTipoDesdeURL(raw: string | null): TipoEventoAgenda | "todos" {
  if (raw && TIPOS_VALIDOS.has(raw)) return raw as TipoEventoAgenda;
  return "todos";
}

/* ══════════════════════════════════════════════════════════════
   COMPONENTE: Barra de Filtros (URL-Driven)
   ──────────────────────────────────────────────────────────────
   La URL es la ÚNICA fuente de verdad.
   Cada interacción muta los searchParams vía `router.replace`.
   El page.tsx escucha el cambio con `useSearchParams` y re-fetcha.
   ══════════════════════════════════════════════════════════════ */

export default function AgendaFiltros({
  abogados,
  isLoading = false,
}: AgendaFiltrosProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [errorFechas, setErrorFechas] = useState<string | null>(null);

  /* ── Derivar estado actual desde la URL ──────────────────── */
  const asignado = searchParams.get(PARAM_KEYS.asignado) ?? "";
  const desde = searchParams.get(PARAM_KEYS.desde) ?? "";
  const hasta = searchParams.get(PARAM_KEYS.hasta) ?? "";
  const tipo = leerTipoDesdeURL(searchParams.get(PARAM_KEYS.tipo));

  /** ¿Hay al menos un filtro activo? */
  const hayFiltrosActivos =
    asignado !== "" || desde !== "" || hasta !== "" || tipo !== "todos";

  /* ── Mutación genérica de URL ───────────────────────────── */
  const actualizarParams = useCallback(
    (cambios: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [clave, valor] of Object.entries(cambios)) {
        if (valor === null || valor === "") {
          params.delete(clave);
        } else {
          params.set(clave, valor);
        }
      }

      const qs = params.toString();
      router.replace(qs ? `?${qs}` : "?", { scroll: false });
    },
    [router, searchParams]
  );

  /* ── Handlers individuales ──────────────────────────────── */
  const handleAbogadoChange = (valor: string) => {
    actualizarParams({ [PARAM_KEYS.asignado]: valor || null });
  };

  const handleFechaInicioChange = (valor: string) => {
    if (valor && hasta && valor > hasta) {
      setErrorFechas(
        "La fecha de inicio no puede ser posterior a la fecha de fin."
      );
      return;
    }
    setErrorFechas(null);
    actualizarParams({ [PARAM_KEYS.desde]: valor || null });
  };

  const handleFechaFinChange = (valor: string) => {
    if (valor && desde && valor < desde) {
      setErrorFechas(
        "La fecha de fin no puede ser anterior a la fecha de inicio."
      );
      return;
    }
    setErrorFechas(null);
    actualizarParams({ [PARAM_KEYS.hasta]: valor || null });
  };

  const handleTipoChange = (nuevoTipo: TipoEventoAgenda | "todos") => {
    actualizarParams({
      [PARAM_KEYS.tipo]: nuevoTipo === "todos" ? null : nuevoTipo,
    });
  };

  const limpiarFiltros = () => {
    setErrorFechas(null);
    router.replace("?", { scroll: false });
  };

  /* ── Auto-clear del error de fechas ─────────────────────── */
  useEffect(() => {
    if (!errorFechas) return;
    const timer = setTimeout(() => setErrorFechas(null), 4000);
    return () => clearTimeout(timer);
  }, [errorFechas]);

  const disabledClasses = isLoading ? "opacity-50 pointer-events-none" : "";

  return (
    <div className="space-y-0">
      <div
        className={`
          bg-white border border-gray-200 rounded-xl shadow-sm
          p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3
          ${disabledClasses}
        `}
      >
        {/* ── Grupo izquierdo: Select + Fechas ──────────────── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Select de Abogado */}
          <div className="relative">
            <select
              id="filtro-abogado"
              value={asignado}
              onChange={(e) => handleAbogadoChange(e.target.value)}
              className="
                h-8 pl-3 pr-8 text-sm font-medium text-gray-700
                bg-gray-50 border border-gray-200 rounded-lg
                appearance-none cursor-pointer
                focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                outline-none transition-all
              "
            >
              <option value="">Todos los abogados</option>
              {abogados.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre_completo}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Separador visual */}
          <div className="hidden sm:block w-px h-5 bg-gray-200" />

          {/* Date range */}
          <div className="flex items-center gap-1.5">
            <CalendarRange className="w-3.5 h-3.5 text-gray-400 shrink-0 hidden sm:block" />
            <input
              id="filtro-fecha-inicio"
              type="date"
              value={desde}
              onChange={(e) => handleFechaInicioChange(e.target.value)}
              className="
                h-8 px-2.5 text-sm text-gray-700
                bg-gray-50 border border-gray-200 rounded-lg
                focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                outline-none transition-all
              "
              title="Fecha desde"
            />
            <span className="text-xs text-gray-400 font-medium">—</span>
            <input
              id="filtro-fecha-fin"
              type="date"
              value={hasta}
              onChange={(e) => handleFechaFinChange(e.target.value)}
              className="
                h-8 px-2.5 text-sm text-gray-700
                bg-gray-50 border border-gray-200 rounded-lg
                focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                outline-none transition-all
              "
              title="Fecha hasta"
            />
          </div>
        </div>

        {/* ── Grupo central: Pills de tipo ──────────────────── */}
        <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-full">
          {TIPO_PILLS.map((pill) => {
            const activo = tipo === pill.value;
            return (
              <button
                key={pill.value}
                type="button"
                onClick={() => handleTipoChange(pill.value)}
                className={`
                  flex items-center gap-1 text-xs font-medium
                  px-3 py-1.5 rounded-full transition-colors
                  ${
                    activo
                      ? "bg-slate-800 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 bg-transparent"
                  }
                `}
              >
                {pill.icon}
                {pill.label}
              </button>
            );
          })}
        </div>

        {/* ── Grupo derecho: Limpiar filtros ─────────────────── */}
        {hayFiltrosActivos && (
          <button
            type="button"
            onClick={limpiarFiltros}
            className="
              text-xs text-red-600 hover:text-red-700 hover:bg-red-50
              px-2 py-1 rounded-md transition-colors
              flex items-center gap-1 shrink-0
            "
          >
            <XCircle className="w-3.5 h-3.5" />
            Limpiar filtros
          </button>
        )}
      </div>

      {/* ── Toast de error de fechas ──────────────────────────── */}
      {errorFechas && (
        <div className="mt-2 p-2.5 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-red-700 text-xs font-medium animate-fade-up">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          {errorFechas}
        </div>
      )}
    </div>
  );
}
