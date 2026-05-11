"use client";

import { useState } from "react";
import { X, Loader2, CalendarDays } from "lucide-react";
import type { InformeAvance } from "@/domain/entities/InformeAvance";

interface CrearInformeModalProps {
  expedienteId: string;
  creadoPor: string;
  onClose: () => void;
  onSave: (payload: Omit<InformeAvance, "id" | "createdAt">) => Promise<void>;
}

const inp =
  "w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-150";

function generarMesesRecientes(cantidad: number): string[] {
  const meses: string[] = [];
  const ahora = new Date();
  for (let i = 0; i < cantidad; i++) {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    const label = d.toLocaleDateString("es-BO", { month: "long", year: "numeric" });
    meses.push(label.charAt(0).toUpperCase() + label.slice(1));
  }
  return meses;
}

export default function CrearInformeModal({
  expedienteId,
  creadoPor,
  onClose,
  onSave,
}: CrearInformeModalProps) {
  const [mesAnio, setMesAnio] = useState("");
  const [resumenProceso, setResumenProceso] = useState("");
  const [estadoActual, setEstadoActual] = useState("");
  const [medidasPrecautorias, setMedidasPrecautorias] = useState("");
  const [comentario, setComentario] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mesesDisponibles = generarMesesRecientes(12);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mesAnio.trim()) return;

    setIsSubmitting(true);
    await onSave({
      expedienteId,
      mesAnio,
      resumenProceso: resumenProceso.trim() || undefined,
      estadoActual: estadoActual.trim() || undefined,
      medidasPrecautorias: medidasPrecautorias.trim() || undefined,
      comentario: comentario.trim() || undefined,
      creadoPor,
    });
    setIsSubmitting(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6"
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ──────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Nuevo Informe de Avance
              </h2>
              <p className="text-xs text-gray-400">
                Registra el estado mensual del caso.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body ────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Mes / Año */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Período (Mes / Año) <span className="text-rose-500">*</span>
            </label>
            <select
              value={mesAnio}
              onChange={(e) => setMesAnio(e.target.value)}
              className={`${inp} appearance-none cursor-pointer`}
              required
              disabled={isSubmitting}
            >
              <option value="">Seleccione el período...</option>
              {mesesDisponibles.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Resumen del Proceso */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Resumen del Proceso
            </label>
            <textarea
              value={resumenProceso}
              onChange={(e) => setResumenProceso(e.target.value)}
              rows={3}
              placeholder="Describa brevemente los avances del proceso durante este período..."
              className={`${inp} resize-y max-h-40`}
              disabled={isSubmitting}
            />
          </div>

          {/* Estado Actual */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Estado Actual
            </label>
            <textarea
              value={estadoActual}
              onChange={(e) => setEstadoActual(e.target.value)}
              rows={3}
              placeholder="Situación procesal actual del caso..."
              className={`${inp} resize-y max-h-40`}
              disabled={isSubmitting}
            />
          </div>

          {/* Medidas Precautorias */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Medidas Precautorias
            </label>
            <textarea
              value={medidasPrecautorias}
              onChange={(e) => setMedidasPrecautorias(e.target.value)}
              rows={3}
              placeholder="Detalle medidas cautelares o precautorias vigentes..."
              className={`${inp} resize-y max-h-40`}
              disabled={isSubmitting}
            />
          </div>

          {/* Comentario */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Comentario Adicional
            </label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={3}
              placeholder="Notas internas u observaciones relevantes..."
              className={`${inp} resize-y max-h-40`}
              disabled={isSubmitting}
            />
          </div>
        </form>

        {/* ── Footer ──────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 shrink-0 bg-gray-50/60 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg
                       hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form=""
            onClick={handleSubmit as any}
            disabled={isSubmitting || !mesAnio.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white
                       bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                       transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Informe Mensual"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
