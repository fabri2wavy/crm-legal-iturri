"use client";

import { useEffect, useState, useMemo } from "react";
import {
  obtenerExpedientes,
  crearExpediente,
} from "../../../infrastructure/repositories/expedienteRepository";
import { obtenerClientes } from "../../../infrastructure/repositories/clienteRepository";
import { Cliente } from "../../../domain/entities/Cliente";
import { Button } from "../../../components/ui/Button";
import { FormField } from "../../../components/ui/FormField";
import { SelectField } from "../../../components/ui/SelectField";
import { Alert } from "../../../components/ui/Alert";

/* ── Mapa de colores semánticos por estado ─────────────────── */
const ESTADO_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  en_espera: { bg: "var(--color-warning-bg)", color: "var(--color-warning)", label: "En Espera" },
  mediacion: { bg: "var(--color-info-bg)", color: "var(--color-info)", label: "Mediación" },
  juicio:    { bg: "var(--color-danger-bg)", color: "var(--color-danger)", label: "En Juicio" },
  cerrado:   { bg: "var(--color-success-bg)", color: "var(--color-success)", label: "Cerrado" },
};

function getEstadoStyle(estado: string) {
  return ESTADO_STYLES[estado] || ESTADO_STYLES["en_espera"];
}

/* ── Opciones estáticas de filtro de estado ─────────────────── */
const ESTADO_FILTER_OPTIONS = [
  { value: "en_espera", label: "En Espera" },
  { value: "mediacion", label: "Mediación" },
  { value: "juicio", label: "En Juicio" },
  { value: "cerrado", label: "Cerrado" },
];

/* ── Opciones de materia ───────────────────────────────────── */
const MATERIA_OPTIONS = [
  { value: "Civil", label: "Civil" },
  { value: "Comercial", label: "Comercial" },
  { value: "Penal", label: "Penal" },
  { value: "Laboral", label: "Laboral" },
  { value: "Familiar", label: "Familiar" },
  { value: "Administrativo", label: "Administrativo" },
];

export default function CasosPage() {
  const [expedientes, setExpedientes] = useState<any[]>([]);
  const [listaClientes, setListaClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(true);

  /* ── Estados de filtro ─────────────────────────────────────── */
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  /* ── Estados para el Modal ──────────────────────────────────── */
  const [mostrarModal, setMostrarModal] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [formError, setFormError] = useState("");

  /* ── Estado del Formulario ──────────────────────────────────── */
  const [formData, setFormData] = useState({
    clienteId: "",
    numeroCaso: "",
    titulo: "",
    materia: "Civil",
    juzgado: "",
    parteContraria: "",
    informeDespacho: "Caso iniciado en plataforma.",
    informeCliente: "Su caso ha sido ingresado al sistema.",
    abogadoAsignadoId: "uuid-temporal",
  });

  /* ── Carga inicial ──────────────────────────────────────────── */
  useEffect(() => {
    async function cargarDatosIniciales() {
      const [dataCasos, dataClientes] = await Promise.all([
        obtenerExpedientes(),
        obtenerClientes(),
      ]);
      setExpedientes(dataCasos);
      setListaClientes(dataClientes);
      setCargando(false);
    }
    cargarDatosIniciales();
  }, []);

  /* ── Filtrado dinámico ──────────────────────────────────────── */
  const expedientesFiltrados = useMemo(() => {
    return expedientes.filter((caso) => {
      /* Filtro de estado */
      if (statusFilter && caso.estado !== statusFilter) return false;

      /* Filtro de texto (case-insensitive) */
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesText =
          (caso.numeroCaso ?? "").toLowerCase().includes(term) ||
          (caso.titulo ?? "").toLowerCase().includes(term) ||
          (caso.nombreCliente ?? "").toLowerCase().includes(term) ||
          (caso.parteContraria ?? "").toLowerCase().includes(term);
        if (!matchesText) return false;
      }

      return true;
    });
  }, [expedientes, searchTerm, statusFilter]);

  /* ── Guardar nuevo caso ─────────────────────────────────────── */
  const handleGuardarCaso = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.clienteId) {
      setFormError("Debes seleccionar un cliente del directorio.");
      return;
    }

    setFormError("");
    setGuardando(true);

    const nuevo = await crearExpediente(formData);

    if (nuevo) {
      const dataActualizada = await obtenerExpedientes();
      setExpedientes(dataActualizada);

      setFormData({
        ...formData,
        numeroCaso: "",
        titulo: "",
        juzgado: "",
        parteContraria: "",
      });
      setMostrarModal(false);
    } else {
      setFormError("Error al crear el caso. Verifica los datos e intenta de nuevo.");
    }

    setGuardando(false);
  };

  /* ── Cerrar modal (limpia errores) ──────────────────────────── */
  const handleCerrarModal = () => {
    setFormError("");
    setMostrarModal(false);
  };

  /* ── Opciones de clientes para el select ─────────────────────── */
  const clienteOptions = listaClientes.map((c) => ({
    value: c.id,
    label: `${c.nombreCompleto} (${c.carnetIdentidad})`,
  }));

  return (
    <div className="max-w-7xl mx-auto relative">
      {/* ── Cabecera ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 animate-fade-up">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)]">
            Expedientes Activos
          </h1>
          <p className="mt-1 text-[var(--color-text-secondary)]">
            Gestión y seguimiento de causas legales.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => setMostrarModal(true)}
          className="shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nuevo Caso
        </Button>
      </div>

      {/* ── Barra de Filtros ──────────────────────────────────── */}
      <div
        className="p-4 rounded-xl mb-6 flex flex-col sm:flex-row gap-3 animate-fade-up
                   bg-[var(--color-surface-card)] border border-[var(--color-surface-border)]
                   shadow-[var(--shadow-sm)]"
        style={{ animationDelay: "50ms" }}
      >
        <div className="flex-1 relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <FormField
            variant="light"
            label=""
            id="filter-search"
            type="text"
            placeholder="Buscar por NUREJ, Cliente o Parte Contraria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="!pl-10 !mb-0"
          />
        </div>
        <SelectField
          variant="light"
          label=""
          id="filter-status"
          options={ESTADO_FILTER_OPTIONS}
          placeholder="Todos los estados"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="min-w-[180px] !mb-0"
        />
      </div>

      {/* ── Tabla de Expedientes ───────────────────────────────── */}
      <div
        className="rounded-xl overflow-hidden animate-fade-up
                   bg-[var(--color-surface-card)] border border-[var(--color-surface-border)]
                   shadow-[var(--shadow-sm)]"
        style={{ animationDelay: "100ms" }}
      >
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--color-navy)] border-b border-[var(--color-navy-border)]">
                <th className="py-3.5 px-6 text-xs font-semibold uppercase tracking-wider text-[var(--color-gold-light)]">NUREJ / Caso</th>
                <th className="py-3.5 px-6 text-xs font-semibold uppercase tracking-wider text-[var(--color-gold-light)]">Materia y Juzgado</th>
                <th className="py-3.5 px-6 text-xs font-semibold uppercase tracking-wider text-[var(--color-gold-light)]">Partes</th>
                <th className="py-3.5 px-6 text-xs font-semibold uppercase tracking-wider text-[var(--color-gold-light)]">Estado</th>
                <th className="py-3.5 px-6 text-xs font-semibold uppercase tracking-wider text-right text-[var(--color-gold-light)]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando && (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full border-2 border-[var(--color-surface-border)]
                                   border-t-[var(--color-gold)] animate-spin"
                      />
                      <span className="text-[var(--color-text-muted)]">Cargando expedientes...</span>
                    </div>
                  </td>
                </tr>
              )}

              {!cargando && expedientesFiltrados.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="mb-3 opacity-50">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                      </svg>
                    </div>
                    <p className="font-medium text-[var(--color-text-secondary)]">
                      {searchTerm || statusFilter
                        ? "No se encontraron expedientes con esos filtros"
                        : "No hay casos registrados"}
                    </p>
                    <p className="text-sm mt-1 text-[var(--color-text-muted)]">
                      {searchTerm || statusFilter
                        ? "Intenta ajustar los criterios de búsqueda."
                        : "Abre tu primer expediente usando el botón de arriba."}
                    </p>
                  </td>
                </tr>
              )}

              {!cargando &&
                expedientesFiltrados.map((caso) => {
                  const estadoStyle = getEstadoStyle(caso.estado);
                  return (
                    <tr
                      key={caso.id}
                      className="transition-colors duration-150 border-b border-[var(--color-surface-border)]
                                 hover:bg-[var(--color-surface-hover)]"
                    >
                      <td className="py-4 px-6">
                        <div className="font-bold text-[var(--color-navy)]">
                          {caso.numeroCaso}
                        </div>
                        <div
                          className="text-xs truncate max-w-[200px] text-[var(--color-text-muted)]"
                          title={caso.titulo}
                        >
                          {caso.titulo}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className="inline-block px-2.5 py-1 text-xs rounded-md font-medium mb-1
                                     bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]"
                        >
                          {caso.materia}
                        </span>
                        <div className="text-xs text-[var(--color-text-muted)]">
                          {caso.juzgado}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm font-medium text-[var(--color-text-primary)]">
                          {caso.nombreCliente}
                        </div>
                        <div className="text-xs text-[var(--color-text-muted)]">
                          vs. {caso.parteContraria}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className="capitalize text-xs font-bold px-3 py-1.5 rounded-full inline-flex items-center gap-1.5"
                          style={{ background: estadoStyle.bg, color: estadoStyle.color }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: estadoStyle.color }}
                          />
                          {estadoStyle.label}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <a
                          href={`/dashboard/casos/${caso.id}`}
                          className="text-sm font-medium px-3 py-1.5 rounded-md transition-all duration-200
                                     inline-block text-[var(--color-gold)] hover:bg-[var(--color-gold-dim)]"
                        >
                          Abrir Expediente →
                        </a>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-[var(--color-surface-border)]">
          {cargando && (
            <div className="py-12 text-center">
              <div
                className="w-8 h-8 rounded-full border-2 mx-auto mb-3
                           border-[var(--color-surface-border)] border-t-[var(--color-gold)] animate-spin"
              />
              <span className="text-sm text-[var(--color-text-muted)]">Cargando...</span>
            </div>
          )}
          {!cargando && expedientesFiltrados.length === 0 && (
            <div className="py-12 text-center">
              <div className="mb-2 opacity-50">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                {searchTerm || statusFilter
                  ? "Sin resultados para estos filtros"
                  : "No hay casos registrados"}
              </p>
            </div>
          )}
          {!cargando && expedientesFiltrados.map((caso) => {
            const estadoStyle = getEstadoStyle(caso.estado);
            return (
              <div key={caso.id} className="p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-sm text-[var(--color-navy)]">
                      {caso.numeroCaso}
                    </span>
                    <div className="text-xs mt-0.5 text-[var(--color-text-muted)]">{caso.titulo}</div>
                  </div>
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0"
                    style={{ background: estadoStyle.bg, color: estadoStyle.color }}
                  >
                    {estadoStyle.label}
                  </span>
                </div>
                <div className="text-xs text-[var(--color-text-secondary)]">
                  {caso.nombreCliente} vs. {caso.parteContraria}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs px-2 py-0.5 rounded-md bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]">
                    {caso.materia}
                  </span>
                  <a
                    href={`/dashboard/casos/${caso.id}`}
                    className="text-xs font-medium px-3 py-1.5 rounded-md
                               text-[var(--color-gold)] bg-[var(--color-gold-dim)]"
                  >
                    Abrir →
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── MODAL DE NUEVO CASO ───────────────────────────────── */}
      {mostrarModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4
                     bg-[rgba(13,27,42,0.7)] backdrop-blur-sm"
        >
          <div
            className="w-full max-w-2xl overflow-hidden animate-card-in
                       bg-[var(--color-surface-card)] rounded-[var(--radius-xl)]
                       shadow-[var(--shadow-lg)] border border-[var(--color-surface-border)]
                       max-h-[90vh] overflow-y-auto"
          >
            {/* Header del modal */}
            <div className="px-6 py-4 flex justify-between items-center sticky top-0 z-10
                            bg-[var(--color-navy)] border-b border-[var(--color-navy-border)]">
              <h3 className="text-base font-bold text-[var(--color-text-on-dark)]">
                Aperturar Nuevo Expediente
              </h3>
              <button
                onClick={handleCerrarModal}
                className="w-8 h-8 flex items-center justify-center rounded-md text-lg
                           transition-colors duration-150 text-[var(--color-text-muted)]
                           hover:bg-white/[0.08]"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleGuardarCaso} className="p-6">
              {/* Error Alert */}
              <Alert variant="error" visible={!!formError}>
                {formError}
              </Alert>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-1">
                {/* Columna Izquierda */}
                <div>
                  <SelectField
                    variant="light"
                    label="Cliente *"
                    id="modal-cliente"
                    options={clienteOptions}
                    placeholder="-- Seleccionar Cliente --"
                    required
                    value={formData.clienteId}
                    onChange={(e) => {
                      setFormError("");
                      setFormData({ ...formData, clienteId: e.target.value });
                    }}
                  />
                  <FormField
                    variant="light"
                    label="NUREJ / N° de Caso *"
                    id="modal-numero-caso"
                    type="text"
                    required
                    placeholder="Ej: CB-2025-000890"
                    value={formData.numeroCaso}
                    onChange={(e) =>
                      setFormData({ ...formData, numeroCaso: e.target.value })
                    }
                  />
                  <SelectField
                    variant="light"
                    label="Materia *"
                    id="modal-materia"
                    options={MATERIA_OPTIONS}
                    required
                    value={formData.materia}
                    onChange={(e) =>
                      setFormData({ ...formData, materia: e.target.value })
                    }
                  />
                </div>

                {/* Columna Derecha */}
                <div>
                  <FormField
                    variant="light"
                    label="Parte Contraria *"
                    id="modal-parte-contraria"
                    type="text"
                    required
                    placeholder="Ej: Empresa ACME Ltda."
                    value={formData.parteContraria}
                    onChange={(e) =>
                      setFormData({ ...formData, parteContraria: e.target.value })
                    }
                  />
                  <FormField
                    variant="light"
                    label="Juzgado o Tribunal *"
                    id="modal-juzgado"
                    type="text"
                    required
                    placeholder="Ej: Juzgado 3ro Civil y Comercial"
                    value={formData.juzgado}
                    onChange={(e) =>
                      setFormData({ ...formData, juzgado: e.target.value })
                    }
                  />
                  <FormField
                    variant="light"
                    label="Título o Resumen Corto *"
                    id="modal-titulo"
                    type="text"
                    required
                    placeholder="Ej: Demanda por incumplimiento"
                    value={formData.titulo}
                    onChange={(e) =>
                      setFormData({ ...formData, titulo: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="pt-5 mt-2 flex flex-col-reverse sm:flex-row gap-3 border-t border-[var(--color-surface-border)]">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  fullWidth
                  onClick={handleCerrarModal}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  fullWidth
                  loading={guardando}
                >
                  {guardando ? "Aperturando..." : "Aperturar Expediente"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
