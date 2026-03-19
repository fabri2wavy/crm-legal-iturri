"use client";

import { useEffect, useState } from "react";
import {
  obtenerExpedientes,
  crearExpediente,
} from "../../../infrastructure/repositories/expedienteRepository";
import { obtenerClientes } from "../../../infrastructure/repositories/clienteRepository";
import { Cliente } from "../../../domain/entities/Cliente";

/* Mapa de colores semánticos por estado */
const ESTADO_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  en_espera:  { bg: "var(--color-warning-bg)", color: "var(--color-warning)", label: "En Espera" },
  mediacion:  { bg: "var(--color-info-bg)",    color: "var(--color-info)",    label: "Mediación" },
  juicio:     { bg: "var(--color-danger-bg)",   color: "var(--color-danger)",  label: "En Juicio" },
  cerrado:    { bg: "var(--color-success-bg)",  color: "var(--color-success)", label: "Cerrado" },
};

function getEstadoStyle(estado: string) {
  return ESTADO_STYLES[estado] || ESTADO_STYLES["en_espera"];
}

export default function CasosPage() {
  const [expedientes, setExpedientes] = useState<any[]>([]);
  const [listaClientes, setListaClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(true);

  // Estados para el Modal
  const [mostrarModal, setMostrarModal] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Estado del Formulario
  const [formData, setFormData] = useState({
    clienteId: "",
    numeroCaso: "",
    titulo: "",
    materia: "Civil", // Valor por defecto
    juzgado: "",
    parteContraria: "",
    informeDespacho: "Caso iniciado en plataforma.",
    informeCliente: "Su caso ha sido ingresado al sistema.",
    abogadoAsignadoId: "uuid-temporal", // En la Fase 2 lo tomaremos del login del abogado
  });

  useEffect(() => {
    async function cargarDatosIniciales() {
      // Cargamos ambas cosas en paralelo para mayor velocidad
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

  const handleGuardarCaso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clienteId) {
      alert("Debes seleccionar un cliente del directorio.");
      return;
    }

    setGuardando(true);

    const nuevo = await crearExpediente(formData);

    if (nuevo) {
      // Recargamos la lista para traer el nombre del cliente con el nuevo caso
      const dataActualizada = await obtenerExpedientes();
      setExpedientes(dataActualizada);

      // Limpiamos y cerramos
      setFormData({
        ...formData,
        numeroCaso: "",
        titulo: "",
        juzgado: "",
        parteContraria: "",
      });
      setMostrarModal(false);
    } else {
      alert("Error al crear el caso. Revisa la consola.");
    }

    setGuardando(false);
  };

  /* ── Estilos reutilizables para inputs del modal ──────── */
  const inputStyle = {
    border: "1px solid var(--color-surface-border)",
    color: "var(--color-text-primary)",
    background: "var(--color-surface)",
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = "var(--color-gold)";
    e.currentTarget.style.boxShadow = "0 0 0 3px var(--color-gold-glow)";
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = "var(--color-surface-border)";
    e.currentTarget.style.boxShadow = "none";
  };

  return (
    <div className="max-w-7xl mx-auto relative">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 animate-fade-up">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            Expedientes Activos
          </h1>
          <p className="mt-1" style={{ color: "var(--color-text-secondary)" }}>
            Gestión y seguimiento de causas legales.
          </p>
        </div>
        <button
          onClick={() => setMostrarModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 shrink-0"
          style={{
            background: "linear-gradient(135deg, #b8922e, var(--color-gold))",
            color: "var(--color-text-on-gold)",
            boxShadow: "var(--shadow-gold)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 6px 24px rgba(201, 168, 76, 0.35)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "var(--shadow-gold)";
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nuevo Caso
        </button>
      </div>

      {/* Barra de Filtros */}
      <div
        className="p-4 rounded-xl mb-6 flex flex-col sm:flex-row gap-3 animate-fade-up"
        style={{
          background: "var(--color-surface-card)",
          border: "1px solid var(--color-surface-border)",
          boxShadow: "var(--shadow-sm)",
          animationDelay: "50ms",
        }}
      >
        <div className="flex-1 relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2"
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por NUREJ, Cliente o Parte Contraria..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none transition-all duration-200"
            style={{
              border: "1px solid var(--color-surface-border)",
              color: "var(--color-text-primary)",
              background: "var(--color-surface)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--color-gold)";
              e.currentTarget.style.boxShadow = "0 0 0 3px var(--color-gold-glow)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--color-surface-border)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>
        <select
          className="px-4 py-2.5 rounded-lg text-sm outline-none transition-all duration-200 min-w-[180px]"
          style={{
            border: "1px solid var(--color-surface-border)",
            color: "var(--color-text-primary)",
            background: "var(--color-surface)",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--color-gold)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--color-surface-border)";
          }}
        >
          <option>Todos los estados</option>
          <option>En Espera</option>
          <option>En Juicio</option>
        </select>
      </div>

      {/* Tabla de Expedientes */}
      <div
        className="rounded-xl overflow-hidden animate-fade-up"
        style={{
          background: "var(--color-surface-card)",
          border: "1px solid var(--color-surface-border)",
          boxShadow: "var(--shadow-sm)",
          animationDelay: "100ms",
        }}
      >
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr
                style={{
                  background: "var(--color-navy)",
                  borderBottom: "1px solid var(--color-navy-border)",
                }}
              >
                <th className="py-3.5 px-6 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-gold-light)" }}>NUREJ / Caso</th>
                <th className="py-3.5 px-6 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-gold-light)" }}>Materia y Juzgado</th>
                <th className="py-3.5 px-6 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-gold-light)" }}>Partes</th>
                <th className="py-3.5 px-6 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-gold-light)" }}>Estado</th>
                <th className="py-3.5 px-6 text-xs font-semibold uppercase tracking-wider text-right" style={{ color: "var(--color-gold-light)" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando && (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full border-2"
                        style={{
                          borderColor: "var(--color-surface-border)",
                          borderTopColor: "var(--color-gold)",
                          animation: "spin 0.8s linear infinite",
                        }}
                      />
                      <span style={{ color: "var(--color-text-muted)" }}>Cargando expedientes...</span>
                    </div>
                  </td>
                </tr>
              )}
              {!cargando && expedientes.length === 0 && (
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
                    <p className="font-medium" style={{ color: "var(--color-text-secondary)" }}>
                      No hay casos registrados
                    </p>
                    <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
                      Abre tu primer expediente usando el botón de arriba.
                    </p>
                  </td>
                </tr>
              )}

              {!cargando &&
                expedientes.map((caso) => {
                  const estadoStyle = getEstadoStyle(caso.estado);
                  return (
                    <tr
                      key={caso.id}
                      className="transition-colors duration-150"
                      style={{ borderBottom: "1px solid var(--color-surface-border)" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--color-surface-hover)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <td className="py-4 px-6">
                        <div className="font-bold" style={{ color: "var(--color-navy)" }}>
                          {caso.numeroCaso}
                        </div>
                        <div
                          className="text-xs truncate max-w-[200px]"
                          style={{ color: "var(--color-text-muted)" }}
                          title={caso.titulo}
                        >
                          {caso.titulo}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className="inline-block px-2.5 py-1 text-xs rounded-md font-medium mb-1"
                          style={{
                            background: "var(--color-surface-hover)",
                            color: "var(--color-text-secondary)",
                          }}
                        >
                          {caso.materia}
                        </span>
                        <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                          {caso.juzgado}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                          {caso.nombreCliente}
                        </div>
                        <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                          vs. {caso.parteContraria}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className="capitalize text-xs font-bold px-3 py-1.5 rounded-full inline-flex items-center gap-1.5"
                          style={{
                            background: estadoStyle.bg,
                            color: estadoStyle.color,
                          }}
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
                          className="text-sm font-medium px-3 py-1.5 rounded-md transition-all duration-200 inline-block"
                          style={{
                            color: "var(--color-gold)",
                            background: "transparent",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "var(--color-gold-dim)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                          }}
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
        <div className="md:hidden divide-y" style={{ borderColor: "var(--color-surface-border)" }}>
          {cargando && (
            <div className="py-12 text-center">
              <div
                className="w-8 h-8 rounded-full border-2 mx-auto mb-3"
                style={{
                  borderColor: "var(--color-surface-border)",
                  borderTopColor: "var(--color-gold)",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>Cargando...</span>
            </div>
          )}
          {!cargando && expedientes.length === 0 && (
            <div className="py-12 text-center">
              <div className="mb-2 opacity-50">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <p className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
                No hay casos registrados
              </p>
            </div>
          )}
          {!cargando && expedientes.map((caso) => {
            const estadoStyle = getEstadoStyle(caso.estado);
            return (
              <div key={caso.id} className="p-4 space-y-2" style={{ borderColor: "var(--color-surface-border)" }}>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-sm" style={{ color: "var(--color-navy)" }}>
                      {caso.numeroCaso}
                    </span>
                    <div className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{caso.titulo}</div>
                  </div>
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0"
                    style={{ background: estadoStyle.bg, color: estadoStyle.color }}
                  >
                    {estadoStyle.label}
                  </span>
                </div>
                <div className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  {caso.nombreCliente} vs. {caso.parteContraria}
                </div>
                <div className="flex justify-between items-center">
                  <span
                    className="text-xs px-2 py-0.5 rounded-md"
                    style={{ background: "var(--color-surface-hover)", color: "var(--color-text-muted)" }}
                  >
                    {caso.materia}
                  </span>
                  <a
                    href={`/dashboard/casos/${caso.id}`}
                    className="text-xs font-medium px-3 py-1.5 rounded-md"
                    style={{ color: "var(--color-gold)", background: "var(--color-gold-dim)" }}
                  >
                    Abrir →
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL DE NUEVO CASO */}
      {mostrarModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{
            background: "rgba(13, 27, 42, 0.7)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div
            className="w-full max-w-2xl overflow-hidden animate-card-in"
            style={{
              background: "var(--color-surface-card)",
              borderRadius: "var(--radius-xl)",
              boxShadow: "var(--shadow-lg)",
              border: "1px solid var(--color-surface-border)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            {/* Header del modal */}
            <div
              className="px-6 py-4 flex justify-between items-center sticky top-0 z-10"
              style={{
                background: "var(--color-navy)",
                borderBottom: "1px solid var(--color-navy-border)",
              }}
            >
              <h3 className="text-base font-bold" style={{ color: "var(--color-text-on-dark)" }}>
                Aperturar Nuevo Expediente
              </h3>
              <button
                onClick={() => setMostrarModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-md text-lg transition-colors duration-150"
                style={{ color: "var(--color-text-muted)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleGuardarCaso} className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-4">
                {/* Columna Izquierda */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
                      Cliente *
                    </label>
                    <select
                      required
                      className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all duration-200"
                      style={inputStyle}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      value={formData.clienteId}
                      onChange={(e) =>
                        setFormData({ ...formData, clienteId: e.target.value })
                      }
                    >
                      <option value="">-- Seleccionar Cliente --</option>
                      {listaClientes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombreCompleto} ({c.carnetIdentidad})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
                      NUREJ / N° de Caso *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: CB-2025-000890"
                      className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all duration-200"
                      style={inputStyle}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      value={formData.numeroCaso}
                      onChange={(e) =>
                        setFormData({ ...formData, numeroCaso: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
                      Materia *
                    </label>
                    <select
                      required
                      className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all duration-200"
                      style={inputStyle}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      value={formData.materia}
                      onChange={(e) =>
                        setFormData({ ...formData, materia: e.target.value })
                      }
                    >
                      <option value="Civil">Civil</option>
                      <option value="Comercial">Comercial</option>
                      <option value="Penal">Penal</option>
                      <option value="Laboral">Laboral</option>
                      <option value="Familiar">Familiar</option>
                      <option value="Administrativo">Administrativo</option>
                    </select>
                  </div>
                </div>

                {/* Columna Derecha */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
                      Parte Contraria *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Empresa ACME Ltda."
                      className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all duration-200"
                      style={inputStyle}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      value={formData.parteContraria}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          parteContraria: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
                      Juzgado o Tribunal *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Juzgado 3ro Civil y Comercial"
                      className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all duration-200"
                      style={inputStyle}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      value={formData.juzgado}
                      onChange={(e) =>
                        setFormData({ ...formData, juzgado: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
                      Título o Resumen Corto *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Demanda por incumplimiento"
                      className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all duration-200"
                      style={inputStyle}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      value={formData.titulo}
                      onChange={(e) =>
                        setFormData({ ...formData, titulo: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              <div
                className="pt-5 mt-2 flex flex-col-reverse sm:flex-row gap-3"
                style={{ borderTop: "1px solid var(--color-surface-border)" }}
              >
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                  style={{
                    border: "1px solid var(--color-surface-border)",
                    color: "var(--color-text-secondary)",
                    background: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--color-surface-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: "linear-gradient(135deg, #b8922e, var(--color-gold))",
                    color: "var(--color-text-on-gold)",
                    boxShadow: "var(--shadow-gold)",
                  }}
                >
                  {guardando ? "Aperturando..." : "Aperturar Expediente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
