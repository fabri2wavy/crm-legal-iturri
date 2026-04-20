"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";
import {
  CalendarDays,
  Plus,
  Clock,
  Gavel,
  Users,
  AlertTriangle,
  CheckSquare,
  X,
  CalendarOff,
  Filter,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  EventoAgendaDetallado,
  TipoEventoAgenda,
  EstadoEventoAgenda,
} from "../../../domain/entities/EventoAgenda";
import {
  obtenerEventos,
  crearEvento,
  eliminarEvento,
  FiltrosAgenda,
} from "../../../infrastructure/repositories/agendaRepository";
import { obtenerEquipo } from "../../../infrastructure/repositories/equipoRepository";
import { obtenerExpedientes } from "../../../infrastructure/repositories/expedienteRepository";
import { obtenerAbogados } from "../../../infrastructure/repositories/usuarioRepository";
import { obtenerConfiguraciones } from "@/infrastructure/repositories/configuracionRepository";
import type { ConfiguracionGlobal } from "@/domain/entities/ConfiguracionGlobal";
import { MiembroEquipo } from "../../../domain/entities/MiembroEquipo";
import { Button } from "../../../components/ui/Button";
import { FormField } from "../../../components/ui/FormField";
import { SelectField } from "../../../components/ui/SelectField";
import AgendaFiltros, { PARAM_KEYS } from "./AgendaFiltros";
import EditarEventoModal from "./Modals/EditarEventoModal";
import EliminarEventoDialog from "./Modals/EliminarEventoDialog";

/* ══════════════════════════════════════════════════════════════
   CONFIGURACIÓN VISUAL: Badges por Tipo y Estado
   ══════════════════════════════════════════════════════════════ */

const TIPO_CONFIG: Record<
  TipoEventoAgenda,
  { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
> = {
  audiencia: {
    label: "Audiencia",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    icon: <Gavel className="w-3.5 h-3.5" />,
  },
  reunion: {
    label: "Reunión",
    bg: "bg-violet-50",
    text: "text-violet-700",
    border: "border-violet-200",
    icon: <Users className="w-3.5 h-3.5" />,
  },
  vencimiento: {
    label: "Vencimiento",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  },
  tarea: {
    label: "Tarea",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: <CheckSquare className="w-3.5 h-3.5" />,
  },
};

const ESTADO_CONFIG: Record<
  EstadoEventoAgenda,
  { label: string; dot: string; bg: string; text: string; border: string }
> = {
  pendiente: {
    label: "Pendiente",
    dot: "bg-amber-500",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  completado: {
    label: "Completado",
    dot: "bg-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  cancelado: {
    label: "Cancelado",
    dot: "bg-gray-400",
    bg: "bg-gray-100",
    text: "text-gray-500",
    border: "border-gray-200",
  },
};

/* ══════════════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════════════ */

function construirNombreCompleto(
  nombres: string,
  apellidoPaterno: string,
  apellidoMaterno: string
): string {
  return [nombres, apellidoPaterno, apellidoMaterno]
    .filter(Boolean)
    .join(" ")
    .trim() || "Sin asignar";
}

/** Formatea ISO string a fecha legible corta: "14 abr 2026" */
function formatearFecha(isoString: string): string {
  const fecha = new Date(isoString);
  return fecha.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Formatea ISO string a hora: "09:30" */
function formatearHora(isoString: string): string {
  const fecha = new Date(isoString);
  return fecha.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** Determina si un evento es "urgente" (dentro de las próximas 48h) */
function esUrgente(fechaInicio: string): boolean {
  const ahora = new Date();
  const inicio = new Date(fechaInicio);
  const diferenciaMs = inicio.getTime() - ahora.getTime();
  const horasRestantes = diferenciaMs / (1000 * 60 * 60);
  return horasRestantes >= 0 && horasRestantes <= 48;
}

/** Determina si un evento ya pasó */
function esPasado(fechaFin: string): boolean {
  return new Date(fechaFin) < new Date();
}

/* ══════════════════════════════════════════════════════════════
   SUB-COMPONENTE: Skeleton de carga (tabla de alta densidad)
   ══════════════════════════════════════════════════════════════ */

function AgendaSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="border-b border-gray-100 last:border-0">
          <td className="py-3.5 px-5">
            <div className="flex flex-col gap-1.5">
              <div className="skeleton h-4 w-20 rounded" />
              <div className="skeleton h-3 w-12 rounded" />
            </div>
          </td>
          <td className="py-3.5 px-5">
            <div className="skeleton h-5 w-24 rounded-full" />
          </td>
          <td className="py-3.5 px-5">
            <div className="flex flex-col gap-1.5">
              <div className="skeleton h-4 w-48 rounded" />
              <div className="skeleton h-3 w-32 rounded" />
            </div>
          </td>
          <td className="py-3.5 px-5">
            <div className="skeleton h-4 w-28 rounded" />
          </td>
          <td className="py-3.5 px-5">
            <div className="skeleton h-5 w-20 rounded-full" />
          </td>
          <td className="py-3.5 px-5">
            <div className="skeleton h-6 w-6 rounded" />
          </td>
        </tr>
      ))}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   SUB-COMPONENTE: Estado vacío
   ══════════════════════════════════════════════════════════════ */

function AgendaEmptyState({
  onCrear,
  hayFiltrosActivos,
  onLimpiarFiltros,
}: {
  onCrear: () => void;
  hayFiltrosActivos: boolean;
  onLimpiarFiltros: () => void;
}) {
  return (
    <tr>
      <td colSpan={6} className="py-24 text-center">
        <div className="mx-auto w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mb-5 border border-gray-100">
          {hayFiltrosActivos ? (
            <Filter className="w-10 h-10 text-gray-300" strokeWidth={1.2} />
          ) : (
            <CalendarOff className="w-10 h-10 text-gray-300" strokeWidth={1.2} />
          )}
        </div>
        <h3 className="text-sm font-semibold text-gray-900 mb-1.5">
          {hayFiltrosActivos
            ? "No hay eventos para los criterios seleccionados"
            : "No tienes eventos programados"}
        </h3>
        <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto leading-relaxed">
          {hayFiltrosActivos
            ? "Modifique los filtros o cree una nueva entrada en la agenda."
            : "Tu agenda está libre. Haz clic en \u201c+ Nuevo Evento\u201d para programar audiencias, reuniones, vencimientos o tareas."}
        </p>
        {hayFiltrosActivos ? (
          <Button variant="ghost" onClick={onLimpiarFiltros}>
            <X className="w-4 h-4 mr-1.5" />
            Limpiar Filtros
          </Button>
        ) : (
          <Button variant="primary" onClick={onCrear}>
            <Plus className="w-4 h-4 mr-1.5" />
            Nuevo Evento
          </Button>
        )}
      </td>
    </tr>
  );
}

/* ══════════════════════════════════════════════════════════════
   SUB-COMPONENTE: Fila individual del evento
   ══════════════════════════════════════════════════════════════ */

function EventoRow({
  evento,
  onEditar,
  onEliminar,
}: {
  evento: EventoAgendaDetallado;
  onEditar: (evento: EventoAgendaDetallado) => void;
  onEliminar: (evento: EventoAgendaDetallado) => void;
}) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const tipo = TIPO_CONFIG[evento.tipoEvento];
  const estado = ESTADO_CONFIG[evento.estado];
  const urgente = esUrgente(evento.fechaInicio);
  const pasado = esPasado(evento.fechaFin);

  const nombreAsignado = construirNombreCompleto(
    evento.asignado.nombres,
    evento.asignado.apellidoPaterno,
    evento.asignado.apellidoMaterno
  );

  /* Cerrar el menú al hacer click fuera */
  useEffect(() => {
    if (!menuAbierto) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAbierto(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuAbierto]);

  return (
    <tr
      className={`
        transition-colors group
        ${pasado && evento.estado === "pendiente" ? "bg-red-50/30" : "hover:bg-gray-50/70"}
      `}
    >
      {/* ── Fecha / Hora ────────────────────────────────────── */}
      <td className="py-3 px-5">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900">
            {formatearFecha(evento.fechaInicio)}
          </span>
          <span className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
            <Clock className="w-3 h-3" />
            {formatearHora(evento.fechaInicio)} – {formatearHora(evento.fechaFin)}
          </span>
        </div>
        {urgente && evento.estado === "pendiente" && (
          <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
            <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
            Próximo
          </span>
        )}
      </td>

      {/* ── Tipo ─────────────────────────────────────────────── */}
      <td className="py-3 px-5">
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${tipo.bg} ${tipo.text} ${tipo.border}`}
        >
          {tipo.icon}
          {tipo.label}
        </span>
      </td>

      {/* ── Título + Descripción + Expediente ────────────────── */}
      <td className="py-3 px-5 max-w-xs">
        <p className="text-sm font-medium text-gray-900 truncate" title={evento.titulo}>
          {evento.titulo}
        </p>
        {evento.descripcion && (
          <p className="text-xs text-gray-400 truncate mt-0.5" title={evento.descripcion}>
            {evento.descripcion}
          </p>
        )}
        {evento.expediente && (
          <span className="inline-flex items-center gap-1 mt-1 text-[11px] text-gray-500 bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            {evento.expediente.numeroCaso}
          </span>
        )}
      </td>

      {/* ── Asignado a ───────────────────────────────────────── */}
      <td className="py-3 px-5">
        <span className="text-sm text-gray-700 truncate block" title={nombreAsignado}>
          {nombreAsignado}
        </span>
      </td>

      {/* ── Estado ───────────────────────────────────────────── */}
      <td className="py-3 px-5">
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${estado.bg} ${estado.text} ${estado.border}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${estado.dot}`} />
          {estado.label}
        </span>
      </td>

      {/* ── Acciones ──────────────────────────────────────────── */}
      <td className="py-3 px-5">
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuAbierto((v) => !v)}
            className="
              w-8 h-8 flex items-center justify-center rounded-lg
              text-gray-400 hover:text-gray-700 hover:bg-gray-100
              opacity-0 group-hover:opacity-100 focus:opacity-100
              transition-all
            "
            aria-label="Acciones del evento"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuAbierto && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-20 py-1 animate-fade-up">
              <button
                type="button"
                onClick={() => {
                  setMenuAbierto(false);
                  onEditar(evento);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                Editar
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuAbierto(false);
                  onEliminar(evento);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

/* ══════════════════════════════════════════════════════════════
   SUB-COMPONENTE: Toast de retroalimentación
   ══════════════════════════════════════════════════════════════ */

interface ToastData {
  message: string;
  type: "success" | "error";
}

function Toast({ data, onClose }: { data: ToastData; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isSuccess = data.type === "success";

  return (
    <div
      className={`
        fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg border
        animate-slide-in
        ${isSuccess ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"}
      `}
    >
      {isSuccess ? (
        <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0" />
      ) : (
        <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
      )}
      <p className="text-sm font-medium">{data.message}</p>
      <button
        onClick={onClose}
        className="ml-2 p-1 rounded-lg hover:bg-black/5 transition-colors"
        aria-label="Cerrar notificación"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SUB-COMPONENTE: Modal para Nuevo Evento
   ══════════════════════════════════════════════════════════════ */

interface ModalNuevoEventoProps {
  isOpen: boolean;
  onClose: () => void;
  onCreado: () => void;
  onToast: (toast: ToastData) => void;
}

interface ExpedienteOption {
  id: string;
  numeroCaso: string;
  titulo: string;
}

function ModalNuevoEvento({ isOpen, onClose, onCreado, onToast }: ModalNuevoEventoProps) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipoEvento, setTipoEvento] = useState<TipoEventoAgenda>("tarea");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [expedienteId, setExpedienteId] = useState("");
  const [asignadoA, setAsignadoA] = useState("");
  const [guardando, setGuardando] = useState(false);

  /* Opciones para selects */
  const [miembros, setMiembros] = useState<MiembroEquipo[]>([]);
  const [expedientes, setExpedientes] = useState<ExpedienteOption[]>([]);
  const [tiposEventoDB, setTiposEventoDB] = useState<ConfiguracionGlobal[]>([]);
  const [cargandoOpciones, setCargandoOpciones] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    let cancelado = false;

    async function cargarOpciones() {
      setCargandoOpciones(true);
      try {
        const [equipoData, expedientesData, resTiposEvento] = await Promise.all([
          obtenerEquipo(),
          obtenerExpedientes(),
          obtenerConfiguraciones('tipo_evento'),
        ]);

        if (cancelado) return;

        setMiembros(equipoData);
        if (resTiposEvento.data) setTiposEventoDB(resTiposEvento.data);
        setExpedientes(
          expedientesData.map((e: { id: string; numeroCaso: string; titulo: string }) => ({
            id: e.id,
            numeroCaso: e.numeroCaso,
            titulo: e.titulo,
          }))
        );
      } catch {
        if (!cancelado) {
          onToast({ message: "Error al cargar opciones del formulario.", type: "error" });
        }
      } finally {
        if (!cancelado) setCargandoOpciones(false);
      }
    }

    cargarOpciones();
    return () => { cancelado = true; };
  }, [isOpen, onToast]);

  function resetForm() {
    setTitulo("");
    setDescripcion("");
    setTipoEvento("tarea");
    setFechaInicio("");
    setFechaFin("");
    setExpedienteId("");
    setAsignadoA("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!titulo.trim() || !fechaInicio || !fechaFin || !asignadoA) {
      onToast({ message: "Completa todos los campos obligatorios.", type: "error" });
      return;
    }

    if (new Date(fechaFin) <= new Date(fechaInicio)) {
      onToast({ message: "La fecha de fin debe ser posterior a la de inicio.", type: "error" });
      return;
    }

    setGuardando(true);

    try {
      await crearEvento({
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || null,
        tipoEvento,
        estado: "pendiente",
        fechaInicio: new Date(fechaInicio).toISOString(),
        fechaFin: new Date(fechaFin).toISOString(),
        expedienteId: expedienteId || null,
        asignadoA,
      });

      onToast({ message: "Evento creado exitosamente.", type: "success" });
      resetForm();
      onCreado();
      onClose();
    } catch (err) {
      onToast({
        message: err instanceof Error ? err.message : "Error inesperado al crear el evento.",
        type: "error",
      });
    } finally {
      setGuardando(false);
    }
  }

  if (!isOpen) return null;

  return (
    createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6"
      onClick={onClose}
    >
      {/* Panel — stopPropagation evita que un click interno cierre el modal */}
      <div
        className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Nuevo Evento</h2>
              <p className="text-xs text-gray-400">Programa una actividad en la agenda legal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-1">
          <FormField
            label="Título del evento"
            id="evento-titulo"
            variant="light"
            placeholder="Ej: Audiencia inicial – Caso García"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
          />

          <FormField
            label="Descripción (opcional)"
            id="evento-descripcion"
            as="textarea"
            variant="light"
            placeholder="Detalles relevantes del evento..."
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={3}
          />

          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Tipo de evento"
              id="evento-tipo"
              variant="light"
              options={[
                { value: "audiencia", label: "Audiencia" },
                { value: "reunion", label: "Reunión" },
                { value: "vencimiento", label: "Vencimiento" },
                { value: "tarea", label: "Tarea" },
                ...tiposEventoDB
                  .filter(t => !['audiencia', 'reunion', 'vencimiento', 'tarea'].includes(t.valor.toLowerCase()))
                  .map(t => ({ value: t.valor, label: t.valor })),
              ]}
              value={tipoEvento}
              onChange={(e) => setTipoEvento(e.target.value as TipoEventoAgenda)}
            />

            <SelectField
              label="Asignado a"
              id="evento-asignado"
              variant="light"
              placeholder={cargandoOpciones ? "Cargando..." : "Seleccionar"}
              options={miembros.map((m) => ({
                value: m.id,
                label: `${m.nombres} ${m.apellidoPaterno}`,
              }))}
              value={asignadoA}
              onChange={(e) => setAsignadoA(e.target.value)}
              disabled={cargandoOpciones}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Fecha y hora inicio"
              id="evento-fecha-inicio"
              type="datetime-local"
              variant="light"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              required
            />
            <FormField
              label="Fecha y hora fin"
              id="evento-fecha-fin"
              type="datetime-local"
              variant="light"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              required
            />
          </div>

          <SelectField
            label="Expediente vinculado (opcional)"
            id="evento-expediente"
            variant="light"
            placeholder={cargandoOpciones ? "Cargando..." : "Ninguno"}
            options={expedientes.map((exp) => ({
              value: exp.id,
              label: `${exp.numeroCaso} — ${exp.titulo}`,
            }))}
            value={expedienteId}
            onChange={(e) => setExpedienteId(e.target.value)}
            disabled={cargandoOpciones}
          />

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 mt-2">
            <Button variant="ghost" type="button" onClick={onClose} disabled={guardando}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" loading={guardando}>
              <Plus className="w-4 h-4 mr-1.5" />
              Crear Evento
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
    )
  );
}

/* ══════════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL: Agenda Legal
   ──────────────────────────────────────────────────────────────
   Wrapper obligatorio: `useSearchParams` requiere un boundary
   de <Suspense> en Next.js App Router para evitar errores de
   hydration en production builds.
   ══════════════════════════════════════════════════════════════ */

export default function AgendaPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto py-24 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-t-transparent border-gray-400 mx-auto" />
        </div>
      }
    >
      <AgendaPageContent />
    </Suspense>
  );
}

function AgendaPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  /* ── Estado de UI ───────────────────────────────────────── */
  const [eventos, setEventos] = useState<EventoAgendaDetallado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);

  /* ── Estado de edición y eliminación ───────────────────── */
  const [eventoEditar, setEventoEditar] = useState<EventoAgendaDetallado | null>(null);
  const [eventoEliminar, setEventoEliminar] = useState<EventoAgendaDetallado | null>(null);

  /* ── Catálogo de abogados (una sola vez) ────────────────── */
  const [abogados, setAbogados] = useState<Array<{ id: string; nombre_completo: string }>>([]);

  useEffect(() => {
    obtenerAbogados().then(setAbogados);
  }, []);

  /* ── Derivar filtros desde la URL (fuente única de verdad) ─ */
  const asignadoParam = searchParams.get(PARAM_KEYS.asignado);
  const desdeParam = searchParams.get(PARAM_KEYS.desde);
  const hastaParam = searchParams.get(PARAM_KEYS.hasta);
  const tipoParam = searchParams.get(PARAM_KEYS.tipo) as TipoEventoAgenda | null;

  const hayFiltrosActivos =
    asignadoParam !== null ||
    desdeParam !== null ||
    hastaParam !== null ||
    tipoParam !== null;

  /* ── Carga de datos (reactiva a cambios de URL) ─────────── */
  const cargarEventos = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const filtrosRepo: FiltrosAgenda = {};
    if (asignadoParam) filtrosRepo.abogadoId = asignadoParam;
    if (desdeParam) filtrosRepo.fechaInicio = desdeParam;
    if (hastaParam) filtrosRepo.fechaFin = hastaParam;
    if (tipoParam) filtrosRepo.tipo = tipoParam;

    try {
      const data = await obtenerEventos(
        Object.keys(filtrosRepo).length > 0 ? filtrosRepo : undefined
      );
      setEventos(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al cargar los eventos."
      );
    } finally {
      setIsLoading(false);
    }
  }, [asignadoParam, desdeParam, hastaParam, tipoParam]);

  useEffect(() => {
    cargarEventos();
  }, [cargarEventos]);

  /* ── Métricas rápidas ────────────────────────────────────── */
  const eventosPendientes = eventos.filter((e) => e.estado === "pendiente").length;
  const eventosUrgentes = eventos.filter(
    (e) => e.estado === "pendiente" && esUrgente(e.fechaInicio)
  ).length;
  const eventosCompletados = eventos.filter((e) => e.estado === "completado").length;

  /* ── Handlers ────────────────────────────────────────────── */
  const handleAbrirModal = () => setIsModalOpen(true);
  const handleCerrarModal = () => setIsModalOpen(false);
  const handleEventoCreado = () => cargarEventos();
  const handleToast = useCallback((data: ToastData) => setToast(data), []);
  const handleCerrarToast = useCallback(() => setToast(null), []);

  /** Limpia todos los filtros reseteando la URL */
  const handleLimpiarFiltros = useCallback(() => {
    router.replace("?", { scroll: false });
  }, [router]);

  /* ── Handlers de edición y eliminación ─────────────────── */
  const handleAbrirEditar = useCallback((ev: EventoAgendaDetallado) => {
    setEventoEditar(ev);
  }, []);

  const handleCerrarEditar = useCallback(() => {
    setEventoEditar(null);
  }, []);

  const handleEventoActualizado = useCallback(() => {
    cargarEventos();
  }, [cargarEventos]);

  const handleAbrirEliminar = useCallback((ev: EventoAgendaDetallado) => {
    setEventoEliminar(ev);
  }, []);

  const handleCerrarEliminar = useCallback(() => {
    setEventoEliminar(null);
  }, []);

  const handleConfirmarEliminar = useCallback(async () => {
    if (!eventoEliminar) return;
    try {
      await eliminarEvento(eventoEliminar.id);
      setToast({ message: "Evento eliminado correctamente.", type: "success" });
      setEventoEliminar(null);
      cargarEventos();
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "No se pudo eliminar el evento.",
        type: "error",
      });
    }
  }, [eventoEliminar, cargarEventos]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-up">
      {/* ── Cabecera ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Agenda Legal
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestión centralizada de audiencias, reuniones, vencimientos y tareas.
          </p>
        </div>
        <Button variant="primary" onClick={handleAbrirModal}>
          <Plus className="w-5 h-5 mr-2" />
          Nuevo Evento
        </Button>
      </div>

      {/* ── Error global ────────────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex gap-3 text-red-800 text-sm font-medium">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* ── Barra de filtros (URL-driven) ─────────────────────── */}
      <AgendaFiltros
        abogados={abogados}
        isLoading={isLoading}
      />

      {/* ── Tarjetas métricas ───────────────────────────────── */}
      {!isLoading && !error && eventos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Pendientes */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{eventosPendientes}</p>
              <p className="text-xs text-gray-500 font-medium">Pendientes</p>
            </div>
          </div>
          {/* Urgentes (48h) */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{eventosUrgentes}</p>
              <p className="text-xs text-gray-500 font-medium">Próximos (48h)</p>
            </div>
          </div>
          {/* Completados */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{eventosCompletados}</p>
              <p className="text-xs text-gray-500 font-medium">Completados</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Data Table ──────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200">
                <th className="py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-widest">
                  Fecha / Hora
                </th>
                <th className="py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-widest">
                  Tipo
                </th>
                <th className="py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-widest">
                  Descripción
                </th>
                <th className="py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-widest">
                  Responsable
                </th>
                <th className="py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-widest">
                  Estado
                </th>
                <th className="py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-widest w-12">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {/* Loading */}
              {isLoading && <AgendaSkeleton />}

              {/* Empty */}
              {!isLoading && !error && eventos.length === 0 && (
                <AgendaEmptyState
                  onCrear={handleAbrirModal}
                  hayFiltrosActivos={hayFiltrosActivos}
                  onLimpiarFiltros={handleLimpiarFiltros}
                />
              )}

              {/* Data */}
              {!isLoading &&
                eventos.map((evento) => (
                  <EventoRow
                    key={evento.id}
                    evento={evento}
                    onEditar={handleAbrirEditar}
                    onEliminar={handleAbrirEliminar}
                  />
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal de creación ───────────────────────────────── */}
      <ModalNuevoEvento
        isOpen={isModalOpen}
        onClose={handleCerrarModal}
        onCreado={handleEventoCreado}
        onToast={handleToast}
      />

      {/* ── Modal de edición ────────────────────────────────── */}
      {eventoEditar && (
        <EditarEventoModal
          isOpen={true}
          evento={eventoEditar}
          onClose={handleCerrarEditar}
          onActualizado={handleEventoActualizado}
          onToast={handleToast}
        />
      )}

      {/* ── Diálogo de eliminación ───────────────────────────── */}
      {eventoEliminar && (
        <EliminarEventoDialog
          isOpen={true}
          tituloEvento={eventoEliminar.titulo}
          onConfirm={handleConfirmarEliminar}
          onClose={handleCerrarEliminar}
        />
      )}

      {/* ── Toast de retroalimentación ──────────────────────── */}
      {toast && <Toast data={toast} onClose={handleCerrarToast} />}
    </div>
  );
}
