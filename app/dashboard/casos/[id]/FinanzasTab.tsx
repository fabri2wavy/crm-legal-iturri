"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { DollarSign, CreditCard, TrendingDown, Receipt, Plus, Banknote, X, Calendar, FileText, CheckCircle } from "lucide-react";
import {
  EstadoCuentaExpediente,
  Honorario,
  CuotaPago,
  GastoExpediente,
  CreateHonorarioDTO,
  CreateCuotaDTO,
  CreateGastoDTO,
  MonedaHonorario,
  EstadoCuota,
} from "../../../../domain/entities/Finanzas";
import {
  obtenerEstadoCuenta,
  crearHonorarioConCuotas,
  registrarGasto,
} from "../../../../infrastructure/repositories/finanzasRepository";
import { ToastContainer, useToasts } from "../../../../components/ui/Toast";

/* ══════════════════════════════════════════════════════════════
   Helpers
   ══════════════════════════════════════════════════════════════ */

function formatearMoneda(monto: number, moneda: MonedaHonorario = "BS"): string {
  const prefijo = moneda === "USD" ? "$" : "Bs.";
  return `${prefijo} ${monto.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const ESTADO_BADGE: Record<EstadoCuota, { bg: string; text: string; label: string }> = {
  pagado:    { bg: "bg-emerald-100", text: "text-emerald-700", label: "Pagado" },
  pendiente: { bg: "bg-amber-100",   text: "text-amber-700",   label: "Pendiente" },
  atrasado:  { bg: "bg-rose-100",    text: "text-rose-700",    label: "Atrasado" },
};

/* ══════════════════════════════════════════════════════════════
   Portal wrapper — rompe el stacking context de los Tabs
   ══════════════════════════════════════════════════════════════ */

function ModalPortal({ children }: { children: React.ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}

/* ══════════════════════════════════════════════════════════════
   Props
   ══════════════════════════════════════════════════════════════ */

interface FinanzasTabProps {
  expedienteId: string;
}

/* ══════════════════════════════════════════════════════════════
   Skeleton Loading
   ══════════════════════════════════════════════════════════════ */

function FinanzasSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* 4 KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-[var(--color-surface-border)] p-5">
            <div className="skeleton h-3 w-20 mb-3" />
            <div className="skeleton h-7 w-28" />
          </div>
        ))}
      </div>
      {/* Table skeleton */}
      <div className="rounded-xl border border-[var(--color-surface-border)] p-5">
        <div className="skeleton h-4 w-40 mb-5" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 mb-4">
            <div className="skeleton h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Empty State
   ══════════════════════════════════════════════════════════════ */

function EmptyStateFinanzas({ onCrear }: { onCrear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-up">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 mb-5">
        <Banknote className="w-8 h-8 text-amber-500" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">
        No hay plan financiero
      </h3>
      <p className="text-sm text-[var(--color-text-muted)] mb-6 max-w-sm">
        Este expediente aún no tiene un contrato de honorarios registrado.
        Crea uno para definir el plan de pagos y hacer seguimiento financiero.
      </p>
      <button
        id="finanzas-crear-contrato-btn"
        onClick={onCrear}
        className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl
                   bg-[var(--color-navy)] text-[var(--color-gold-light)]
                   shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)]
                   transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
      >
        <Plus className="w-4 h-4" />
        Crear Contrato de Honorarios
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   KPI Cards
   ══════════════════════════════════════════════════════════════ */

interface KPICardProps {
  icon: React.ReactNode;
  label: string;
  valor: string;
  accentClass?: string;
  delay?: number;
}

function KPICard({ icon, label, valor, accentClass = "text-[var(--color-text-primary)]", delay = 0 }: KPICardProps) {
  return (
    <div
      className="rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-card)]
                 p-5 shadow-[var(--shadow-sm)] animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
          {label}
        </span>
      </div>
      <p className={`text-xl font-bold ${accentClass}`}>{valor}</p>
    </div>
  );
}

function ResumenFinancieroCards({
  honorario,
  cuotas,
  gastos,
}: {
  honorario: Honorario;
  cuotas: CuotaPago[];
  gastos: GastoExpediente[];
}) {
  const totalPagado = cuotas
    .filter((c) => c.estado === "pagado")
    .reduce((s, c) => s + c.monto, 0);

  const saldoPendiente = honorario.montoTotal - totalPagado;

  const totalGastos = gastos.reduce((s, g) => s + g.monto, 0);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KPICard
        icon={<DollarSign className="w-4 h-4 text-[var(--color-gold)]" strokeWidth={2} />}
        label="Monto Total"
        valor={formatearMoneda(honorario.montoTotal, honorario.moneda)}
        delay={0}
      />
      <KPICard
        icon={<CheckCircle className="w-4 h-4 text-emerald-500" strokeWidth={2} />}
        label="Pagado"
        valor={formatearMoneda(totalPagado, honorario.moneda)}
        accentClass="text-emerald-600"
        delay={50}
      />
      <KPICard
        icon={<CreditCard className="w-4 h-4 text-amber-500" strokeWidth={2} />}
        label="Saldo Pendiente"
        valor={formatearMoneda(saldoPendiente, honorario.moneda)}
        accentClass="text-[var(--color-text-primary)] font-semibold"
        delay={100}
      />
      <KPICard
        icon={<TrendingDown className="w-4 h-4 text-rose-500" strokeWidth={2} />}
        label="Gastos Operativos"
        valor={formatearMoneda(totalGastos, honorario.moneda)}
        accentClass="text-rose-600"
        delay={150}
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Tabla Plan de Pagos
   ══════════════════════════════════════════════════════════════ */

function TablaPlanPagos({ cuotas, moneda }: { cuotas: CuotaPago[]; moneda: MonedaHonorario }) {
  return (
    <div
      className="rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-card)]
                 shadow-[var(--shadow-sm)] overflow-hidden animate-fade-up"
      style={{ animationDelay: "200ms" }}
    >
      <div className="px-5 py-4 border-b border-[var(--color-surface-border)]">
        <h3 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[var(--color-gold)]" strokeWidth={2} />
          Plan de Pagos
          <span className="text-xs font-normal text-[var(--color-text-muted)]">
            ({cuotas.length} cuota{cuotas.length !== 1 ? "s" : ""})
          </span>
        </h3>
      </div>

      {cuotas.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">No hay cuotas registradas.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[var(--color-surface-hover)] border-b border-[var(--color-surface-border)]">
                <th className="py-3 px-5 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  Descripción
                </th>
                <th className="py-3 px-5 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider text-right">
                  Monto
                </th>
                <th className="py-3 px-5 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider hidden sm:table-cell">
                  Vencimiento
                </th>
                <th className="py-3 px-5 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                  Estado
                </th>
                <th className="py-3 px-5 text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider hidden md:table-cell">
                  Fecha Pago
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-surface-border)]">
              {cuotas.map((cuota) => {
                const badge = ESTADO_BADGE[cuota.estado];
                return (
                  <tr key={cuota.id} className="hover:bg-[var(--color-surface-hover)] transition-colors">
                    <td className="py-3.5 px-5">
                      <span
                        className="text-sm font-medium text-[var(--color-text-primary)] truncate block max-w-[220px]"
                        title={cuota.descripcion}
                      >
                        {cuota.descripcion}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                        {formatearMoneda(cuota.monto, moneda)}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 hidden sm:table-cell">
                      <span className="text-sm text-[var(--color-text-secondary)]">
                        {formatearFecha(cuota.fechaVencimiento)}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 hidden md:table-cell">
                      <span className="text-sm text-[var(--color-text-secondary)]">
                        {cuota.fechaPago ? formatearFecha(cuota.fechaPago) : "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Lista de Gastos Operativos
   ══════════════════════════════════════════════════════════════ */

function ListaGastosOperativos({
  gastos,
  moneda,
  onRegistrar,
}: {
  gastos: GastoExpediente[];
  moneda: MonedaHonorario;
  onRegistrar: () => void;
}) {
  return (
    <div
      className="rounded-xl border border-[var(--color-surface-border)] bg-[var(--color-surface-card)]
                 shadow-[var(--shadow-sm)] overflow-hidden animate-fade-up"
      style={{ animationDelay: "250ms" }}
    >
      <div className="px-5 py-4 border-b border-[var(--color-surface-border)] flex items-center justify-between">
        <h3 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
          <Receipt className="w-4 h-4 text-[var(--color-gold)]" strokeWidth={2} />
          Gastos Operativos
          <span className="text-xs font-normal text-[var(--color-text-muted)]">
            ({gastos.length})
          </span>
        </h3>
        <button
          id="finanzas-registrar-gasto-btn"
          onClick={onRegistrar}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg
                     text-[var(--color-gold)] hover:bg-[var(--color-gold-dim)]
                     transition-all duration-200"
        >
          <Plus className="w-3.5 h-3.5" />
          Registrar Gasto
        </button>
      </div>

      {gastos.length === 0 ? (
        <div className="py-12 text-center">
          <Receipt className="w-8 h-8 mx-auto text-[var(--color-text-muted)] opacity-40 mb-3" strokeWidth={1.5} />
          <p className="text-sm text-[var(--color-text-muted)]">No hay gastos registrados.</p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--color-surface-border)]">
          {gastos.map((gasto) => (
            <div key={gasto.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-[var(--color-surface-hover)] transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center">
                  <TrendingDown className="w-4 h-4 text-rose-500" strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text-primary)] truncate max-w-[260px]" title={gasto.concepto}>
                    {gasto.concepto}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">{formatearFecha(gasto.fecha)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {gasto.reembolsado && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                    Reembolsado
                  </span>
                )}
                <span className="text-sm font-semibold text-rose-600">
                  -{formatearMoneda(gasto.monto, moneda)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Modal: Crear Contrato de Honorarios + Cuotas
   ══════════════════════════════════════════════════════════════ */

interface CuotaFormRow {
  descripcion: string;
  monto: string;
  fechaVencimiento: string;
  estado: EstadoCuota;
  fechaPago: string;
}

const CUOTA_VACIA: CuotaFormRow = {
  descripcion: "",
  monto: "",
  fechaVencimiento: "",
  estado: "pendiente",
  fechaPago: "",
};

function ModalCrearContrato({
  expedienteId,
  onClose,
  onSuccess,
}: {
  expedienteId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [montoTotal, setMontoTotal] = useState("");
  const [moneda, setMoneda] = useState<MonedaHonorario>("BS");
  const [cuotasForm, setCuotasForm] = useState<CuotaFormRow[]>([{ ...CUOTA_VACIA }]);
  const [guardando, setGuardando] = useState(false);
  const [formError, setFormError] = useState("");

  const agregarCuota = () => setCuotasForm((prev) => [...prev, { ...CUOTA_VACIA }]);

  const eliminarCuota = (index: number) => {
    if (cuotasForm.length <= 1) return;
    setCuotasForm((prev) => prev.filter((_, i) => i !== index));
  };

  const actualizarCuota = (index: number, campo: keyof CuotaFormRow, valor: string) => {
    setCuotasForm((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [campo]: valor } : c))
    );
  };

  const handleGuardar = async () => {
    setFormError("");

    /* ── Validación ──────────────────────────────────────────── */
    const montoNum = parseFloat(montoTotal);
    if (isNaN(montoNum) || montoNum <= 0) {
      setFormError("El monto total debe ser un número positivo.");
      return;
    }

    if (cuotasForm.length === 0) {
      setFormError("Debes definir al menos una cuota.");
      return;
    }

    for (let i = 0; i < cuotasForm.length; i++) {
      const c = cuotasForm[i];
      const cuotaMonto = parseFloat(c.monto);
      if (!c.descripcion.trim()) {
        setFormError(`Cuota ${i + 1}: la descripción es obligatoria.`);
        return;
      }
      if (isNaN(cuotaMonto) || cuotaMonto <= 0) {
        setFormError(`Cuota ${i + 1}: el monto debe ser un número positivo.`);
        return;
      }
      if (!c.fechaVencimiento) {
        setFormError(`Cuota ${i + 1}: la fecha de vencimiento es obligatoria.`);
        return;
      }
    }

    setGuardando(true);

    const honorarioDTO: CreateHonorarioDTO = {
      expedienteId,
      montoTotal: montoNum,
      moneda,
      estadoContrato: "vigente",
    };

    const cuotasDTO: CreateCuotaDTO[] = cuotasForm.map((c) => ({
      descripcion: c.descripcion.trim(),
      monto: parseFloat(c.monto),
      fechaVencimiento: c.fechaVencimiento,
      estado: c.estado,
      fechaPago: c.fechaPago || null,
    }));

    const resultado = await crearHonorarioConCuotas(honorarioDTO, cuotasDTO);

    if (resultado.error) {
      setFormError(resultado.error);
      setGuardando(false);
      return;
    }

    onSuccess();
    onClose();
  };

  return (
    <ModalPortal>
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl bg-[var(--color-surface-card)] rounded-xl shadow-2xl
                   max-h-[90vh] overflow-y-auto animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[var(--color-surface-card)] px-6 py-4 border-b border-[var(--color-surface-border)] flex items-center justify-between">
          <h2 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <Banknote className="w-5 h-5 text-[var(--color-gold)]" strokeWidth={2} />
            Crear Contrato de Honorarios
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Error */}
          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          {/* Honorario base */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-1.5">
                Monto Total
              </label>
              <input
                id="contrato-monto-total"
                type="number"
                min="0"
                step="0.01"
                value={montoTotal}
                onChange={(e) => setMontoTotal(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2.5 text-sm rounded-lg border border-[var(--color-surface-border)]
                           bg-[var(--color-surface-card)] text-[var(--color-text-primary)]
                           focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)]
                           transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-1.5">
                Moneda
              </label>
              <select
                id="contrato-moneda"
                value={moneda}
                onChange={(e) => setMoneda(e.target.value as MonedaHonorario)}
                className="w-full px-4 py-2.5 text-sm rounded-lg border border-[var(--color-surface-border)]
                           bg-[var(--color-surface-card)] text-[var(--color-text-primary)]
                           focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)]
                           transition-all"
              >
                <option value="BS">Bolivianos (BS)</option>
                <option value="USD">Dólares (USD)</option>
              </select>
            </div>
          </div>

          {/* Cuotas */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
                Cuotas de Pago
              </label>
              <button
                type="button"
                onClick={agregarCuota}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-gold)]
                           hover:text-[var(--color-text-primary)] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Añadir Cuota
              </button>
            </div>

            <div className="space-y-3">
              {cuotasForm.map((cuota, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface-hover)]
                             p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--color-text-muted)]">
                      Cuota {index + 1}
                    </span>
                    {cuotasForm.length > 1 && (
                      <button
                        type="button"
                        onClick={() => eliminarCuota(index)}
                        className="p-1 rounded text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Descripción"
                      value={cuota.descripcion}
                      onChange={(e) => actualizarCuota(index, "descripcion", e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-surface-border)]
                                 bg-[var(--color-surface-card)] text-[var(--color-text-primary)]
                                 focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)]
                                 transition-all placeholder:text-[var(--color-text-muted)]"
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Monto"
                      value={cuota.monto}
                      onChange={(e) => actualizarCuota(index, "monto", e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-surface-border)]
                                 bg-[var(--color-surface-card)] text-[var(--color-text-primary)]
                                 focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)]
                                 transition-all placeholder:text-[var(--color-text-muted)]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-[var(--color-text-muted)] mb-1">Fecha de vencimiento</label>
                      <input
                        type="date"
                        value={cuota.fechaVencimiento}
                        onChange={(e) => actualizarCuota(index, "fechaVencimiento", e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-surface-border)]
                                   bg-[var(--color-surface-card)] text-[var(--color-text-primary)]
                                   focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)]
                                   transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--color-text-muted)] mb-1">Estado</label>
                      <select
                        value={cuota.estado}
                        onChange={(e) => actualizarCuota(index, "estado", e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-surface-border)]
                                   bg-[var(--color-surface-card)] text-[var(--color-text-primary)]
                                   focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)]
                                   transition-all"
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="pagado">Pagado</option>
                        <option value="atrasado">Atrasado</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[var(--color-surface-card)] px-6 py-4 border-t border-[var(--color-surface-border)] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={guardando}
            className="px-4 py-2.5 text-sm font-semibold rounded-lg border border-[var(--color-surface-border)]
                       text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]
                       transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            id="contrato-guardar-btn"
            type="button"
            onClick={handleGuardar}
            disabled={guardando}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg
                       bg-[var(--color-navy)] text-[var(--color-gold-light)]
                       shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)]
                       transition-all disabled:opacity-50"
          >
            {guardando ? (
              <div className="w-4 h-4 rounded-full border-2 border-[var(--color-gold-light)]/30 border-t-[var(--color-gold-light)] animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            {guardando ? "Guardando..." : "Crear Contrato"}
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}

/* ══════════════════════════════════════════════════════════════
   Modal: Registrar Gasto
   ══════════════════════════════════════════════════════════════ */

function ModalRegistrarGasto({
  expedienteId,
  onClose,
  onSuccess,
}: {
  expedienteId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState("");
  const [reembolsado, setReembolsado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [formError, setFormError] = useState("");

  const handleGuardar = async () => {
    setFormError("");

    if (!concepto.trim()) {
      setFormError("El concepto es obligatorio.");
      return;
    }

    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      setFormError("El monto debe ser un número positivo.");
      return;
    }

    if (!fecha) {
      setFormError("La fecha es obligatoria.");
      return;
    }

    setGuardando(true);

    const gastoDTO: CreateGastoDTO = {
      expedienteId,
      concepto: concepto.trim(),
      monto: montoNum,
      fecha,
      reembolsado,
      comprobanteUrl: null,
    };

    const resultado = await registrarGasto(gastoDTO);

    if (resultado.error) {
      setFormError(resultado.error);
      setGuardando(false);
      return;
    }

    onSuccess();
    onClose();
  };

  return (
    <ModalPortal>
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-md bg-[var(--color-surface-card)] rounded-xl shadow-2xl
                   max-h-[90vh] overflow-y-auto animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--color-surface-border)] flex items-center justify-between">
          <h2 className="text-base font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[var(--color-gold)]" strokeWidth={2} />
            Registrar Gasto
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-1.5">
              Concepto
            </label>
            <input
              id="gasto-concepto"
              type="text"
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              placeholder="Ej: Fotocopias legalizadas"
              className="w-full px-4 py-2.5 text-sm rounded-lg border border-[var(--color-surface-border)]
                         bg-[var(--color-surface-card)] text-[var(--color-text-primary)]
                         focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)]
                         transition-all placeholder:text-[var(--color-text-muted)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-1.5">
                Monto
              </label>
              <input
                id="gasto-monto"
                type="number"
                min="0"
                step="0.01"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2.5 text-sm rounded-lg border border-[var(--color-surface-border)]
                           bg-[var(--color-surface-card)] text-[var(--color-text-primary)]
                           focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)]
                           transition-all placeholder:text-[var(--color-text-muted)]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-1.5">
                Fecha
              </label>
              <input
                id="gasto-fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-lg border border-[var(--color-surface-border)]
                           bg-[var(--color-surface-card)] text-[var(--color-text-primary)]
                           focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)]
                           transition-all"
              />
            </div>
          </div>

          {/* Toggle: Reembolsado */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              role="switch"
              aria-checked={reembolsado}
              onClick={() => setReembolsado(!reembolsado)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full
                          border-2 border-transparent transition-colors duration-200
                          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-gold)]
                          ${reembolsado ? "bg-emerald-500" : "bg-gray-300"}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white
                            shadow-md transform transition-transform duration-200
                            ${reembolsado ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
            <span className={`text-sm font-medium transition-colors ${reembolsado ? "text-emerald-700" : "text-[var(--color-text-muted)]"}`}>
              {reembolsado ? "Gasto reembolsado" : "No reembolsado"}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--color-surface-border)] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={guardando}
            className="px-4 py-2.5 text-sm font-semibold rounded-lg border border-[var(--color-surface-border)]
                       text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]
                       transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            id="gasto-guardar-btn"
            type="button"
            onClick={handleGuardar}
            disabled={guardando}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg
                       bg-[var(--color-navy)] text-[var(--color-gold-light)]
                       shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)]
                       transition-all disabled:opacity-50"
          >
            {guardando ? (
              <div className="w-4 h-4 rounded-full border-2 border-[var(--color-gold-light)]/30 border-t-[var(--color-gold-light)] animate-spin" />
            ) : (
              <Receipt className="w-4 h-4" />
            )}
            {guardando ? "Guardando..." : "Registrar Gasto"}
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}

/* ══════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL: FinanzasTab
   ══════════════════════════════════════════════════════════════ */

export default function FinanzasTab({ expedienteId }: FinanzasTabProps) {
  const [estadoCuenta, setEstadoCuenta] = useState<EstadoCuentaExpediente | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalContratoOpen, setIsModalContratoOpen] = useState(false);
  const [isModalGastoOpen, setIsModalGastoOpen] = useState(false);

  const { toasts, addToast, removeToast } = useToasts();

  /* ── Carga de datos ──────────────────────────────────────── */
  const cargarEstadoCuenta = useCallback(async () => {
    setIsLoading(true);
    setError("");

    const resultado = await obtenerEstadoCuenta(expedienteId);

    if (resultado.error) {
      setError(resultado.error);
      setIsLoading(false);
      return;
    }

    setEstadoCuenta(resultado.data);
    setIsLoading(false);
  }, [expedienteId]);

  useEffect(() => {
    cargarEstadoCuenta();
  }, [cargarEstadoCuenta]);

  /* ── Callbacks de éxito post-mutación ────────────────────── */
  const handleContratoCreado = () => {
    addToast("success", "Contrato de honorarios creado correctamente.");
    cargarEstadoCuenta();
  };

  const handleGastoRegistrado = () => {
    addToast("success", "Gasto registrado correctamente.");
    cargarEstadoCuenta();
  };

  /* ── Render: Loading ───────────────────────────────────────── */
  if (isLoading) {
    return <FinanzasSkeleton />;
  }

  /* ── Render: Error ─────────────────────────────────────────── */
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    );
  }

  /* ── Render: Empty State (sin honorario) ───────────────────── */
  if (!estadoCuenta?.honorario) {
    return (
      <>
        <EmptyStateFinanzas onCrear={() => setIsModalContratoOpen(true)} />

        {isModalContratoOpen && (
          <ModalCrearContrato
            expedienteId={expedienteId}
            onClose={() => setIsModalContratoOpen(false)}
            onSuccess={handleContratoCreado}
          />
        )}

        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </>
    );
  }

  /* ── Render: Data View ─────────────────────────────────────── */
  const { honorario, cuotas, gastos } = estadoCuenta;

  return (
    <div className="space-y-6">
      <ResumenFinancieroCards honorario={honorario} cuotas={cuotas} gastos={gastos} />

      <TablaPlanPagos cuotas={cuotas} moneda={honorario.moneda} />

      <ListaGastosOperativos
        gastos={gastos}
        moneda={honorario.moneda}
        onRegistrar={() => setIsModalGastoOpen(true)}
      />

      {/* ── Modales ─────────────────────────────────────────────── */}
      {isModalGastoOpen && (
        <ModalRegistrarGasto
          expedienteId={expedienteId}
          onClose={() => setIsModalGastoOpen(false)}
          onSuccess={handleGastoRegistrado}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
