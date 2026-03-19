"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { obtenerExpedientePorId, actualizarExpediente } from "../../../../infrastructure/repositories/expedienteRepository";

/* Mapa de colores semánticos por estado */
const ESTADO_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  en_espera:  { bg: "var(--color-warning-bg)", color: "var(--color-warning)", border: "var(--color-warning-border)" },
  mediacion:  { bg: "var(--color-info-bg)",    color: "var(--color-info)",    border: "var(--color-info-border)" },
  juicio:     { bg: "var(--color-danger-bg)",   color: "var(--color-danger)",  border: "var(--color-danger-border)" },
  cerrado:    { bg: "var(--color-success-bg)",  color: "var(--color-success)", border: "var(--color-success-border)" },
};

const TAB_ICONS: Record<string, React.ReactNode> = {
  info: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  docs: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  informe: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
};

const TAB_ITEMS = [
  { key: "info", label: "Información" },
  { key: "docs", label: "Documentos" },
  { key: "informe", label: "Informes (Bitácora)" },
];

export default function DetalleExpedientePage() {
  const params = useParams();
  const idCaso = params.id as string;

  const [caso, setCaso] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [pestañaActiva, setPestañaActiva] = useState("informe"); // Empezaremos en informe por defecto
  
  // Estados para la Edición
  const [modoEdicion, setModoEdicion] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [textosEdicion, setTextosEdicion] = useState({ despacho: "", cliente: "" });

  useEffect(() => {
    async function cargarDetalle() {
      const data = await obtenerExpedientePorId(idCaso);
      setCaso(data);
      if (data) {
        setTextosEdicion({ despacho: data.informeDespacho, cliente: data.informeCliente });
      }
      setCargando(false);
    }
    cargarDetalle();
  }, [idCaso]);

  // Función para cambiar el estado (En espera, Juicio, etc)
  const handleCambiarEstado = async (nuevoEstado: string) => {
    const exito = await actualizarExpediente(idCaso, { estado: nuevoEstado });
    if (exito) {
      setCaso({ ...caso, estado: nuevoEstado }); // Actualizamos la UI al instante
    } else {
      alert("Error al cambiar el estado.");
    }
  };

  // Función para guardar los informes editados
  const handleGuardarInformes = async () => {
    setGuardando(true);
    const exito = await actualizarExpediente(idCaso, { 
      informeDespacho: textosEdicion.despacho,
      informeCliente: textosEdicion.cliente
    });

    if (exito) {
      setCaso({ ...caso, informeDespacho: textosEdicion.despacho, informeCliente: textosEdicion.cliente });
      setModoEdicion(false);
    } else {
      alert("Error al guardar los informes.");
    }
    setGuardando(false);
  };

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div
          className="w-10 h-10 rounded-full border-2"
          style={{
            borderColor: "var(--color-surface-border)",
            borderTopColor: "var(--color-gold)",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <span style={{ color: "var(--color-text-muted)" }}>Cargando expediente...</span>
      </div>
    );
  }

  if (!caso) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="opacity-50">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <p className="font-medium" style={{ color: "var(--color-danger)" }}>
          Expediente no encontrado.
        </p>
      </div>
    );
  }

  const estadoStyle = ESTADO_STYLES[caso.estado] || ESTADO_STYLES["en_espera"];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Link de retorno */}
      <a
        href="/dashboard/casos"
        className="inline-flex items-center gap-2 text-sm font-medium mb-5 px-3 py-1.5 rounded-md transition-all duration-200"
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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Volver a todos los casos
      </a>

      {/* Cabecera del Caso con Selector de Estado */}
      <div
        className="p-5 sm:p-6 rounded-xl mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 animate-fade-up"
        style={{
          background: "var(--color-surface-card)",
          border: "1px solid var(--color-surface-border)",
          boxShadow: "var(--shadow-md)",
          borderLeft: `4px solid ${estadoStyle.color}`,
        }}
      >
        <div>
          <h1 className="text-xl sm:text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
            {caso.cliente.nombre_completo}
          </h1>
          <p className="text-base sm:text-lg font-medium mt-1" style={{ color: "var(--color-text-secondary)" }}>
            vs. {caso.parteContraria}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <span
              className="px-3 py-1 text-xs rounded-full font-bold"
              style={{
                background: "var(--color-surface-hover)",
                color: "var(--color-text-secondary)",
              }}
            >
              {caso.numeroCaso}
            </span>
            <span
              className="px-3 py-1 text-xs rounded-full font-bold"
              style={{
                background: "var(--color-surface-hover)",
                color: "var(--color-text-secondary)",
              }}
            >
              {caso.materia}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
          {/* Aquí inyectamos la capacidad de actualizar el estado de forma rápida */}
          <select 
            value={caso.estado}
            onChange={(e) => handleCambiarEstado(e.target.value)}
            className="px-4 py-2.5 rounded-lg font-bold uppercase text-xs cursor-pointer outline-none transition-all duration-200"
            style={{
              background: estadoStyle.bg,
              color: estadoStyle.color,
              border: `1px solid ${estadoStyle.border}`,
            }}
          >
            <option value="en_espera">En Espera</option>
            <option value="mediacion">Mediación</option>
            <option value="juicio">En Juicio</option>
            <option value="cerrado">Caso Cerrado</option>
          </select>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Creado: {caso.fechaCreacion.toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 mb-6 overflow-x-auto pb-1 animate-fade-up"
        style={{ animationDelay: "100ms" }}
      >
        {TAB_ITEMS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setPestañaActiva(tab.key)}
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap"
            style={{
              background: pestañaActiva === tab.key
                ? "var(--color-navy)"
                : "transparent",
              color: pestañaActiva === tab.key
                ? "var(--color-gold-light)"
                : "var(--color-text-muted)",
              border: pestañaActiva === tab.key
                ? "1px solid var(--color-navy-border)"
                : "1px solid transparent",
            }}
            onMouseEnter={(e) => {
              if (pestañaActiva !== tab.key) {
                e.currentTarget.style.background = "var(--color-surface-hover)";
                e.currentTarget.style.color = "var(--color-text-primary)";
              }
            }}
            onMouseLeave={(e) => {
              if (pestañaActiva !== tab.key) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--color-text-muted)";
              }
            }}
          >
            {TAB_ICONS[tab.key]}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido del tab */}
      <div
        className="rounded-xl p-5 sm:p-6 min-h-[300px] animate-fade-up"
        style={{
          background: "var(--color-surface-card)",
          border: "1px solid var(--color-surface-border)",
          boxShadow: "var(--shadow-sm)",
          animationDelay: "150ms",
        }}
      >
        
        {pestañaActiva === "info" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div>
              <h3
                className="text-base font-bold mb-4 pb-2 flex items-center gap-2"
                style={{
                  color: "var(--color-text-primary)",
                  borderBottom: "1px solid var(--color-surface-border)",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg> Datos del Cliente
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Nombre</span>
                  <p className="text-sm font-medium mt-0.5" style={{ color: "var(--color-text-primary)" }}>{caso.cliente.nombre_completo}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>CI</span>
                  <p className="text-sm font-medium mt-0.5" style={{ color: "var(--color-text-primary)" }}>{caso.cliente.carnet_identidad}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Teléfono</span>
                  <p className="text-sm font-medium mt-0.5" style={{ color: "var(--color-text-primary)" }}>{caso.cliente.telefono || "No registrado"}</p>
                </div>
              </div>
            </div>
            <div>
              <h3
                className="text-base font-bold mb-4 pb-2 flex items-center gap-2"
                style={{
                  color: "var(--color-text-primary)",
                  borderBottom: "1px solid var(--color-surface-border)",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M12 2l10 5H2l10-5z" /></svg> Detalles Judiciales
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Juzgado</span>
                  <p className="text-sm font-medium mt-0.5" style={{ color: "var(--color-text-primary)" }}>{caso.juzgado}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Título</span>
                  <p className="text-sm font-medium mt-0.5" style={{ color: "var(--color-text-primary)" }}>{caso.titulo}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {pestañaActiva === "docs" && (
          <div className="text-center py-12">
            <div className="mb-3 opacity-40">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <p className="font-medium" style={{ color: "var(--color-text-secondary)" }}>Módulo de Documentos</p>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>Se implementará en la siguiente fase.</p>
          </div>
        )}

        {pestañaActiva === "informe" && (
          <div className="space-y-6">
            <div
              className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pb-3"
              style={{ borderBottom: "1px solid var(--color-surface-border)" }}
            >
              <h3 className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>
                Bitácora de Actualizaciones
              </h3>
              
              {/* Botonera de Edición */}
              {!modoEdicion ? (
                <button
                  onClick={() => setModoEdicion(true)}
                  className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg font-medium transition-all duration-200"
                  style={{
                    background: "var(--color-surface-hover)",
                    color: "var(--color-text-secondary)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--color-gold-dim)";
                    e.currentTarget.style.color = "var(--color-gold)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--color-surface-hover)";
                    e.currentTarget.style.color = "var(--color-text-secondary)";
                  }}
                >
                  Redactar Informes
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setModoEdicion(false)}
                    className="text-sm px-3 py-1.5 font-medium rounded-md transition-all duration-200"
                    style={{ color: "var(--color-text-muted)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-text-primary)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-text-muted)"; }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleGuardarInformes}
                    disabled={guardando}
                    className="text-sm px-4 py-1.5 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50"
                    style={{
                      background: "var(--color-success)",
                      color: "#ffffff",
                      boxShadow: "0 2px 8px rgba(16, 185, 129, 0.25)",
                    }}
                  >
                    {guardando ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              )}
            </div>

            {/* Informe para el Cliente (Público) */}
            <div
              className="p-4 sm:p-5 rounded-xl"
              style={{
                background: "var(--color-info-bg)",
                border: `1px solid var(--color-info-border)`,
              }}
            >
              <h4
                className="font-bold text-sm mb-3 flex items-center gap-2"
                style={{ color: "var(--color-info)" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg> Informe para el Cliente (Público)
              </h4>
              {!modoEdicion ? (
                <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: "var(--color-text-primary)" }}>
                  {caso.informeCliente}
                </p>
              ) : (
                <textarea 
                  className="w-full p-3 text-sm rounded-lg outline-none min-h-[120px] transition-all duration-200"
                  style={{
                    border: "1px solid var(--color-info-border)",
                    background: "var(--color-surface-card)",
                    color: "var(--color-text-primary)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-gold)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px var(--color-gold-glow)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-info-border)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  value={textosEdicion.cliente}
                  onChange={(e) => setTextosEdicion({...textosEdicion, cliente: e.target.value})}
                  placeholder="Escribe lo que el cliente verá desde su portal..."
                />
              )}
            </div>

            {/* Informe de Despacho (Privado) */}
            <div
              className="p-4 sm:p-5 rounded-xl"
              style={{
                background: "var(--color-surface-hover)",
                border: "1px solid var(--color-surface-border)",
              }}
            >
              <h4
                className="font-bold text-sm mb-3 flex items-center gap-2"
                style={{ color: "var(--color-text-secondary)" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg> Informe de Despacho (Privado)
              </h4>
              {!modoEdicion ? (
                <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: "var(--color-text-primary)" }}>
                  {caso.informeDespacho}
                </p>
              ) : (
                <textarea 
                  className="w-full p-3 text-sm rounded-lg outline-none min-h-[120px] transition-all duration-200"
                  style={{
                    border: "1px solid var(--color-surface-border)",
                    background: "var(--color-surface-card)",
                    color: "var(--color-text-primary)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-gold)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px var(--color-gold-glow)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-surface-border)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  value={textosEdicion.despacho}
                  onChange={(e) => setTextosEdicion({...textosEdicion, despacho: e.target.value})}
                  placeholder="Escribe las notas internas para los abogados..."
                />
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}