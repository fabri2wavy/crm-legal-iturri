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
  "w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-gray-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all duration-150";

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
      {/* Contenedor Principal (Con min-h-0 vital para el scroll) */}
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        style={{ maxHeight: "85vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header Fijo ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Nuevo Informe de Avance
              </h2>
              <p className="text-xs text-gray-500">
                Registra el estado mensual del caso.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body con Scroll Interno ── */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
          <form id="informe-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Mes / Año */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                Período (Mes / Año) <span className="text-rose-500">*</span>
              </label>
              <select
                value={mesAnio}
                onChange={(e) => setMesAnio(e.target.value)}
                className={`${inp} appearance-none cursor-pointer font-medium`}
                required
                disabled={isSubmitting}
              >
                <option value="">Seleccione el período...</option>
                {mesesDisponibles.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Grid de 2 columnas para el resto de textareas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Resumen del Proceso
                </label>
                <textarea
                  value={resumenProceso}
                  onChange={(e) => setResumenProceso(e.target.value)}
                  rows={2}
                  placeholder="Describa brevemente los avances del proceso..."
                  className={`${inp} resize-none`}
                  disabled={isSubmitting}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Estado Actual
                </label>
                <textarea
                  value={estadoActual}
                  onChange={(e) => setEstadoActual(e.target.value)}
                  rows={2}
                  placeholder="Situación procesal actual del caso..."
                  className={`${inp} resize-none`}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Medidas Precautorias
                </label>
                <textarea
                  value={medidasPrecautorias}
                  onChange={(e) => setMedidasPrecautorias(e.target.value)}
                  rows={2}
                  placeholder="Medidas cautelares vigentes..."
                  className={`${inp} resize-none`}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Comentario Adicional
                </label>
                <textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  rows={2}
                  placeholder="Notas internas u observaciones..."
                  className={`${inp} resize-none`}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </form>
        </div>

        {/* ── Footer Fijo ── */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 shrink-0 bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="informe-form"
            disabled={isSubmitting || !mesAnio.trim()}
            className="inline-flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Informe"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}