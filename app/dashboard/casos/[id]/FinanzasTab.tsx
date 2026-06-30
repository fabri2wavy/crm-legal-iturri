"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { DollarSign, CreditCard, TrendingDown, Receipt, Plus, Banknote, X, Calendar, FileText, CheckCircle, Lock, Percent, AlertTriangle, Clock, Bell } from "lucide-react";
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
} from "@/domain/entities/Finanzas";
import {
  obtenerEstadoCuenta,
  crearHonorarioConCuotas,
  registrarGasto,
} from "@/infrastructure/repositories/finanzasRepository";
import { ToastContainer, useToasts } from "@/components/ui/Toast";

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

function ModalPortal({ children }: { children: React.ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}

interface FinanzasTabProps {
  expedienteId: string;
}

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

/* ── Helper: calcular urgencia de vencimiento ─────────────── */
function calcularUrgenciaCuota(fechaVencimiento: string, estado: EstadoCuota): {
  tipo: 'vencida' | 'vence_hoy' | 'proxima' | 'normal' | 'pagada';
  diasRestantes: number;
  label: string;
  classes: string;
} {
  if (estado === 'pagado') return { tipo: 'pagada', diasRestantes: 0, label: '', classes: '' };

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const venc = new Date(fechaVencimiento);
  venc.setHours(0, 0, 0, 0);
  const diff = Math.round((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

  if (diff < 0) return {
    tipo: 'vencida', diasRestantes: diff,
    label: `Vencida hace ${Math.abs(diff)} día${Math.abs(diff) !== 1 ? 's' : ''}`,
    classes: 'bg-red-100 text-red-700 border border-red-200',
  };
  if (diff === 0) return {
    tipo: 'vence_hoy', diasRestantes: 0,
    label: '⚠️ Vence hoy',
    classes: 'bg-orange-100 text-orange-700 border border-orange-200 animate-pulse',
  };
  if (diff <= 7) return {
    tipo: 'proxima', diasRestantes: diff,
    label: `Vence en ${diff} día${diff !== 1 ? 's' : ''}`,
    classes: 'bg-blue-100 text-blue-700 border border-blue-200',
  };
  return { tipo: 'normal', diasRestantes: diff, label: '', classes: '' };
}

/* ── Panel de Alertas Activas ─────────────────────────────── */
function AlertasActivasPanel({ cuotas, moneda }: { cuotas: CuotaPago[]; moneda: MonedaHonorario }) {
  const alertas = cuotas
    .filter((c) => c.estado !== 'pagado')
    .map((c) => ({ cuota: c, urgencia: calcularUrgenciaCuota(c.fechaVencimiento, c.estado) }))
    .filter((a) => a.urgencia.tipo !== 'normal' && a.urgencia.tipo !== 'pagada')
    .sort((a, b) => a.urgencia.diasRestantes - b.urgencia.diasRestantes);

  if (alertas.length === 0) return null;

  return (
    <div
      className="rounded-xl border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50
                 shadow-[var(--shadow-sm)] overflow-hidden animate-fade-up"
      style={{ animationDelay: "180ms" }}
    >
      <div className="px-5 py-3.5 border-b border-orange-200 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-100">
          <Bell className="w-3.5 h-3.5 text-orange-600" strokeWidth={2.5} />
        </div>
        <h3 className="text-sm font-bold text-orange-800">
          Alertas de Cobro
          <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-orange-200 text-orange-800">
            {alertas.length}
          </span>
        </h3>
      </div>
      <div className="divide-y divide-orange-100">
        {alertas.map(({ cuota, urgencia }) => (
          <div key={cuota.id} className="px-5 py-3 flex items-center justify-between hover:bg-orange-50/80 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                urgencia.tipo === 'vencida' ? 'bg-red-100' :
                urgencia.tipo === 'vence_hoy' ? 'bg-orange-100' : 'bg-blue-100'
              }`}>
                {urgencia.tipo === 'vencida' ? (
                  <AlertTriangle className="w-4 h-4 text-red-600" strokeWidth={2} />
                ) : urgencia.tipo === 'vence_hoy' ? (
                  <Clock className="w-4 h-4 text-orange-600" strokeWidth={2} />
                ) : (
                  <Calendar className="w-4 h-4 text-blue-600" strokeWidth={2} />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--color-text-primary)] truncate max-w-[200px]">
                  {cuota.descripcion}
                </p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold mt-0.5 ${urgencia.classes}`}>
                  {urgencia.label}
                </span>
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-3">
              <p className="text-sm font-bold text-[var(--color-text-primary)]">
                {formatearMoneda(cuota.monto, moneda)}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                {formatearFecha(cuota.fechaVencimiento)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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
                const urgencia = calcularUrgenciaCuota(cuota.fechaVencimiento, cuota.estado);
                return (
                  <tr key={cuota.id} className={`hover:bg-[var(--color-surface-hover)] transition-colors ${
                    urgencia.tipo === 'vencida' ? 'bg-red-50/40' :
                    urgencia.tipo === 'vence_hoy' ? 'bg-orange-50/40' : ''
                  }`}>
                    <td className="py-3.5 px-5">
                      <span
                        className="text-sm font-medium text-[var(--color-text-primary)] truncate block max-w-[220px]"
                        title={cuota.descripcion}
                      >
                        {cuota.descripcion}
                      </span>
                      {/* Badge de urgencia */}
                      {urgencia.label && (
                        <span className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-bold ${urgencia.classes}`}>
                          {urgencia.label}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                        {formatearMoneda(cuota.monto, moneda)}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 hidden sm:table-cell">
                      <span className={`text-sm ${
                        urgencia.tipo === 'vencida' ? 'text-red-600 font-semibold' :
                        urgencia.tipo === 'vence_hoy' ? 'text-orange-600 font-semibold' :
                        'text-[var(--color-text-secondary)]'
                      }`}>
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

  /* ══════════════════════════════════════════════════════════════
     VALIDADOR MATEMÁTICO EN TIEMPO REAL
     ══════════════════════════════════════════════════════════════ */
  const montoNum = parseFloat(montoTotal) || 0;
  const sumaCuotas = cuotasForm.reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0);
  const diferencia = montoNum - sumaCuotas;
  const cuadra = montoNum > 0 && Math.abs(diferencia) < 0.01;
  const exceso = sumaCuotas > montoNum + 0.009;
  const porcentajeDistribuido = montoNum > 0 ? Math.min((sumaCuotas / montoNum) * 100, 100) : 0;

  const simboloMoneda = moneda === "USD" ? "$" : "Bs.";

  /* ── Distribución equitativa ─────────────────────────────── */
  const distribuirEquitativamente = () => {
    if (montoNum <= 0 || cuotasForm.length === 0) return;

    const montoPorCuota = Math.floor((montoNum / cuotasForm.length) * 100) / 100;
    const residuo = Math.round((montoNum - montoPorCuota * cuotasForm.length) * 100) / 100;

    setCuotasForm((prev) =>
      prev.map((c, i) => ({
        ...c,
        monto: (i === prev.length - 1 ? montoPorCuota + residuo : montoPorCuota).toFixed(2),
      }))
    );
  };

  /* ── Calcular porcentaje de una cuota individual ────────── */
  const obtenerPorcentajeCuota = (montoStr: string): number => {
    if (montoNum <= 0) return 0;
    const val = parseFloat(montoStr) || 0;
    return (val / montoNum) * 100;
  };

  const handleGuardar = async () => {
    setFormError("");

    /* ── Validación ──────────────────────────────────────────── */
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

    /* ── VALIDADOR MATEMÁTICO ESTRICTO (Barrera Frontend) ───── */
    if (!cuadra) {
      const fmtTotal = montoNum.toLocaleString("es-BO", { minimumFractionDigits: 2 });
      const fmtSuma = sumaCuotas.toLocaleString("es-BO", { minimumFractionDigits: 2 });
      const fmtDiff = Math.abs(diferencia).toLocaleString("es-BO", { minimumFractionDigits: 2 });
      const direccion = diferencia > 0
        ? `Faltan ${simboloMoneda} ${fmtDiff} por distribuir.`
        : `Exceso de ${simboloMoneda} ${fmtDiff}.`;
      setFormError(
        `Las cuotas suman ${simboloMoneda} ${fmtSuma} pero el contrato es por ${simboloMoneda} ${fmtTotal}. ${direccion}`
      );
      return;
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
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
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
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
              <span>{formError}</span>
            </div>
          )}

          {/* Honorario base */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-1.5">
                Monto Total (Iguala)
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

          {/* ══════════════════════════════════════════════════════
             PANEL VALIDADOR MATEMÁTICO EN TIEMPO REAL
             ══════════════════════════════════════════════════════ */}
          {montoNum > 0 && (
            <div
              className={`rounded-xl border-2 p-4 transition-all duration-300 ${
                cuadra
                  ? "border-emerald-300 bg-emerald-50/50"
                  : exceso
                    ? "border-red-300 bg-red-50/50"
                    : "border-amber-300 bg-amber-50/50"
              }`}
            >
              {/* Barra de progreso */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                  Distribución de Cuotas
                </span>
                {cuadra ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Cuadra exacto
                  </span>
                ) : exceso ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Exceso
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700">
                    <Clock className="w-3.5 h-3.5" />
                    Falta distribuir
                  </span>
                )}
              </div>

              {/* Barra visual */}
              <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${
                    cuadra
                      ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                      : exceso
                        ? "bg-gradient-to-r from-red-400 to-red-500"
                        : "bg-gradient-to-r from-amber-400 to-amber-500"
                  }`}
                  style={{ width: `${Math.min(porcentajeDistribuido, 100)}%` }}
                />
              </div>

              {/* Resumen numérico */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs text-[var(--color-text-muted)] mb-0.5">Iguala Total</p>
                  <p className="text-sm font-bold text-[var(--color-text-primary)]">
                    {simboloMoneda} {montoNum.toLocaleString("es-BO", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-text-muted)] mb-0.5">Suma Cuotas</p>
                  <p className={`text-sm font-bold ${cuadra ? "text-emerald-700" : exceso ? "text-red-700" : "text-amber-700"}`}>
                    {simboloMoneda} {sumaCuotas.toLocaleString("es-BO", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-text-muted)] mb-0.5">
                    {diferencia >= 0 ? "Por asignar" : "Exceso"}
                  </p>
                  <p className={`text-sm font-bold ${cuadra ? "text-emerald-700" : exceso ? "text-red-700" : "text-amber-700"}`}>
                    {diferencia >= 0 ? "" : "+"}{simboloMoneda} {Math.abs(diferencia).toLocaleString("es-BO", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Cuotas */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
                Cuotas de Pago
              </label>
              <div className="flex items-center gap-2">
                {montoNum > 0 && cuotasForm.length > 0 && (
                  <button
                    type="button"
                    onClick={distribuirEquitativamente}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600
                               hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded-md transition-colors"
                    title="Divide el monto total equitativamente entre todas las cuotas"
                  >
                    <Percent className="w-3 h-3" />
                    Distribuir Equitativo
                  </button>
                )}
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
            </div>

            <div className="space-y-3">
              {cuotasForm.map((cuota, index) => {
                const porcentaje = obtenerPorcentajeCuota(cuota.monto);
                return (
                <div
                  key={index}
                  className="rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface-hover)]
                             p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-[var(--color-text-muted)]">
                        Cuota {index + 1}
                      </span>
                      {/* Indicador de porcentaje */}
                      {montoNum > 0 && parseFloat(cuota.monto) > 0 && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                          porcentaje > 100
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {porcentaje.toFixed(1)}%
                        </span>
                      )}
                    </div>
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

                  {/* Mini-barra de proporción de esta cuota */}
                  {montoNum > 0 && parseFloat(cuota.monto) > 0 && (
                    <div className="w-full h-1.5 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          porcentaje > 100 ? "bg-red-400" : "bg-blue-400"
                        }`}
                        style={{ width: `${Math.min(porcentaje, 100)}%` }}
                      />
                    </div>
                  )}

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
                    <div className="relative">
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
              );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[var(--color-surface-card)] px-6 py-4 border-t border-[var(--color-surface-border)] flex items-center justify-between gap-3">
          {/* Indicador compacto en el footer */}
          <div className="text-xs text-[var(--color-text-muted)] hidden sm:block">
            {montoNum > 0 && (
              cuadra ? (
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Cuotas cuadran
                </span>
              ) : (
                <span className={`font-semibold flex items-center gap-1 ${exceso ? "text-red-600" : "text-amber-600"}`}>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {exceso ? "Exceso" : "Faltan"} {simboloMoneda} {Math.abs(diferencia).toLocaleString("es-BO", { minimumFractionDigits: 2 })}
                </span>
              )
            )}
          </div>
          <div className="flex items-center gap-3">
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
              disabled={guardando || !cuadra}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg
                         bg-[var(--color-navy)] text-[var(--color-gold-light)]
                         shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)]
                         transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title={!cuadra ? "La suma de las cuotas debe coincidir exactamente con el monto total" : ""}
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
    </div>
    </ModalPortal>
  );
}

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
  const [observaciones, setObservaciones] = useState("");
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
      observaciones: observaciones.trim() || null,
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
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
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

          {/* Observaciones */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-1.5">
              Observaciones
            </label>
            <textarea
              id="gasto-observaciones"
              rows={3}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Detalles adicionales del gasto: proveedor, justificación, estado de reembolso..."
              className="w-full px-4 py-2.5 text-sm rounded-lg border border-[var(--color-surface-border)]
                         bg-[var(--color-surface-card)] text-[var(--color-text-primary)]
                         focus:outline-none focus:border-[var(--color-gold)] focus:ring-1 focus:ring-[var(--color-gold)]
                         transition-all placeholder:text-[var(--color-text-muted)] resize-none"
            />
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

export default function FinanzasTab({ expedienteId }: FinanzasTabProps) {
  const [estadoCuenta, setEstadoCuenta] = useState<EstadoCuentaExpediente | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalContratoOpen, setIsModalContratoOpen] = useState(false);
  const [isModalGastoOpen, setIsModalGastoOpen] = useState(false);

  const { toasts, addToast, removeToast } = useToasts();

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

  const handleContratoCreado = () => {
    addToast("success", "Contrato de honorarios creado correctamente.");
    cargarEstadoCuenta();
  };

  const handleGastoRegistrado = () => {
    addToast("success", "Gasto registrado correctamente.");
    cargarEstadoCuenta();
  };

  if (isLoading) {
    return <FinanzasSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    );
  }

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

  const { honorario, cuotas, gastos } = estadoCuenta;

  return (
    <div className="space-y-6">
      <ResumenFinancieroCards honorario={honorario} cuotas={cuotas} gastos={gastos} />

      <AlertasActivasPanel cuotas={cuotas} moneda={honorario.moneda} />

      <TablaPlanPagos cuotas={cuotas} moneda={honorario.moneda} />

      <ListaGastosOperativos
        gastos={gastos}
        moneda={honorario.moneda}
        onRegistrar={() => setIsModalGastoOpen(true)}
      />

      {/* ── Cascarón Facturación SIAT (Próximamente) ───────────── */}
      <div
        className="rounded-xl border border-dashed border-[var(--color-surface-border)] bg-[var(--color-surface-card)]
                   p-5 shadow-[var(--shadow-sm)] animate-fade-up"
        style={{ animationDelay: "300ms" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
              <FileText className="w-4.5 h-4.5 text-gray-400" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                Facturación Electrónica
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Emisión de facturas a través del SIAT
              </p>
            </div>
          </div>

          <div className="relative group">
            <button
              id="finanzas-generar-factura-siat-btn"
              type="button"
              disabled={true}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg
                         border border-[var(--color-surface-border)] bg-[var(--color-surface-hover)]
                         text-[var(--color-text-muted)] cursor-not-allowed
                         opacity-60 transition-all duration-200"
            >
              <Lock className="w-4 h-4" />
              Generar Factura (SIAT)
            </button>

            {/* Tooltip */}
            <div
              className="absolute bottom-full right-0 mb-2 px-3 py-2 rounded-lg
                         bg-gray-900 text-white text-xs font-medium whitespace-nowrap
                         shadow-lg pointer-events-none
                         opacity-0 group-hover:opacity-100 transition-opacity duration-200
                         after:content-[''] after:absolute after:top-full after:right-4
                         after:border-4 after:border-transparent after:border-t-gray-900"
            >
              Próximamente: Integración con Impuestos Nacionales
            </div>
          </div>
        </div>
      </div>

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
