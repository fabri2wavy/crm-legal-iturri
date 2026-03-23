"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { obtenerExpedientePorId, actualizarExpediente } from "../../../../infrastructure/repositories/expedienteRepository";
import { 
  obtenerDocumentos, 
  subirDocumento, 
  obtenerUrlDescarga, 
  eliminarDocumento 
} from "../../../../infrastructure/repositories/documentoRepository";
import { Documento } from "../../../../domain/entities/Documento";
import { Button } from "../../../../components/ui/Button";
import { FormField } from "../../../../components/ui/FormField";
import { Alert } from "../../../../components/ui/Alert";

/* ── Mapa de colores semánticos por estado ─────────────────── */
const ESTADO_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  en_espera: { bg: "var(--color-warning-bg)", color: "var(--color-warning)", border: "var(--color-warning-border)" },
  mediacion: { bg: "var(--color-info-bg)", color: "var(--color-info)", border: "var(--color-info-border)" },
  juicio:    { bg: "var(--color-danger-bg)", color: "var(--color-danger)", border: "var(--color-danger-border)" },
  cerrado:   { bg: "var(--color-success-bg)", color: "var(--color-success)", border: "var(--color-success-border)" },
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
  const [pestañaActiva, setPestañaActiva] = useState("informe");

  /* ── Estados para la Edición ────────────────────────────────── */
  const [modoEdicion, setModoEdicion] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [textosEdicion, setTextosEdicion] = useState({ despacho: "", cliente: "" });
  const [errorMsg, setErrorMsg] = useState("");

  /* ── Estados para Documentos ────────────────────────────────── */
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [cargandoDocs, setCargandoDocs] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [docError, setDocError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  /* ── Efecto para Cargar Documentos ──────────────────────────── */
  useEffect(() => {
    if (pestañaActiva === "docs") {
      cargarListaDocumentos();
    }
  }, [pestañaActiva, idCaso]);

  const cargarListaDocumentos = async () => {
    setCargandoDocs(true);
    setDocError("");
    try {
      const docs = await obtenerDocumentos(idCaso);
      setDocumentos(docs);
    } catch (err) {
      setDocError("Error al cargar los documentos.");
    } finally {
      setCargandoDocs(false);
    }
  };

  /* ── Handlers de Documentos ────────────────────────────────── */
  const handleTriggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubirArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubiendo(true);
    setDocError("");
    
    try {
      const nuevoDoc = await subirDocumento(idCaso, file);
      if (nuevoDoc) {
        await cargarListaDocumentos();
      } else {
        setDocError("No se pudo subir el archivo. Verifica el formato o intenta nuevamente.");
      }
    } catch (err) {
      setDocError("Error inesperado al subir el archivo.");
    } finally {
      e.target.value = ""; // Permite seleccionar el mismo archivo después
      setSubiendo(false);
    }
  };

  const handleDescargar = async (ruta: string) => {
    setDocError("");
    const url = await obtenerUrlDescarga(ruta);
    if (url) {
      window.open(url, "_blank");
    } else {
      setDocError("No se pudo generar el enlace de descarga.");
    }
  };

  const handleEliminar = async (ruta: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este documento permanentemente?")) return;
    
    setDocError("");
    const exito = await eliminarDocumento(ruta);
    if (exito) {
      await cargarListaDocumentos();
    } else {
      setDocError("No se pudo eliminar el archivo. Puede que otra persona ya lo haya borrado.");
    }
  };

  /* ── Cambiar estado del expediente ──────────────────────────── */
  const handleCambiarEstado = async (nuevoEstado: string) => {
    setErrorMsg("");
    const exito = await actualizarExpediente(idCaso, { estado: nuevoEstado });
    if (exito) {
      setCaso({ ...caso, estado: nuevoEstado });
    } else {
      setErrorMsg("Error al cambiar el estado. Verifica tu conexión e intenta de nuevo.");
    }
  };

  /* ── Guardar informes editados ──────────────────────────────── */
  const handleGuardarInformes = async () => {
    setErrorMsg("");
    setGuardando(true);
    const exito = await actualizarExpediente(idCaso, {
      informeDespacho: textosEdicion.despacho,
      informeCliente: textosEdicion.cliente,
    });

    if (exito) {
      setCaso({ ...caso, informeDespacho: textosEdicion.despacho, informeCliente: textosEdicion.cliente });
      setModoEdicion(false);
    } else {
      setErrorMsg("Error al guardar los informes. Verifica tu conexión e intenta de nuevo.");
    }
    setGuardando(false);
  };

  /* ── Loading state ──────────────────────────────────────────── */
  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-[var(--color-surface-border)]
                        border-t-[var(--color-gold)] animate-spin" />
        <span className="text-[var(--color-text-muted)]">Cargando expediente...</span>
      </div>
    );
  }

  /* ── Not found state ────────────────────────────────────────── */
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
        <p className="font-medium text-[var(--color-danger)]">
          Expediente no encontrado.
        </p>
      </div>
    );
  }

  const estadoStyle = ESTADO_STYLES[caso.estado] || ESTADO_STYLES["en_espera"];

  return (
    <div className="max-w-5xl mx-auto">
      {/* ── Error Alert global ──────────────────────────────── */}
      <div className="mb-4">
        <Alert variant="error" visible={!!errorMsg}>
          {errorMsg}
        </Alert>
      </div>

      {/* ── Link de retorno ───────────────────────────────────── */}
      <a
        href="/dashboard/casos"
        className="inline-flex items-center gap-2 text-sm font-medium mb-5 px-3 py-1.5 rounded-md
                   transition-all duration-200 text-[var(--color-gold)] hover:bg-[var(--color-gold-dim)]"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Volver a todos los casos
      </a>

      {/* ── Cabecera del Caso con Selector de Estado ──────────── */}
      <div
        className="p-5 sm:p-6 rounded-xl mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4
                   animate-fade-up bg-[var(--color-surface-card)] border border-[var(--color-surface-border)]
                   shadow-[var(--shadow-md)]"
        style={{ borderLeft: `4px solid ${estadoStyle.color}` }}
      >
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)]">
            {caso.cliente.nombre_completo}
          </h1>
          <p className="text-base sm:text-lg font-medium mt-1 text-[var(--color-text-secondary)]">
            vs. {caso.parteContraria}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="px-3 py-1 text-xs rounded-full font-bold bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]">
              {caso.numeroCaso}
            </span>
            <span className="px-3 py-1 text-xs rounded-full font-bold bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]">
              {caso.materia}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
          <select
            value={caso.estado}
            onChange={(e) => handleCambiarEstado(e.target.value)}
            className="px-4 py-2.5 rounded-lg font-bold uppercase text-xs cursor-pointer outline-none
                       transition-all duration-200"
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
          <p className="text-xs text-[var(--color-text-muted)]">
            Creado: {caso.fechaCreacion.toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────── */}
      <div
        className="flex gap-1 mb-6 overflow-x-auto pb-1 animate-fade-up"
        style={{ animationDelay: "100ms" }}
      >
        {TAB_ITEMS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setPestañaActiva(tab.key)}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg text-sm font-medium
                        transition-all duration-200 whitespace-nowrap border
                        ${
                          pestañaActiva === tab.key
                            ? "bg-[var(--color-navy)] text-[var(--color-gold-light)] border-[var(--color-navy-border)]"
                            : "bg-transparent text-[var(--color-text-muted)] border-transparent hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
                        }`}
          >
            {TAB_ICONS[tab.key]}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Contenido del tab ─────────────────────────────────── */}
      <div
        className="rounded-xl p-5 sm:p-6 min-h-[300px] animate-fade-up
                   bg-[var(--color-surface-card)] border border-[var(--color-surface-border)]
                   shadow-[var(--shadow-sm)]"
        style={{ animationDelay: "150ms" }}
      >

        {pestañaActiva === "info" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div>
              <h3 className="text-base font-bold mb-4 pb-2 flex items-center gap-2
                             text-[var(--color-text-primary)] border-b border-[var(--color-surface-border)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg> Datos del Cliente
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Nombre</span>
                  <p className="text-sm font-medium mt-0.5 text-[var(--color-text-primary)]">{caso.cliente.nombre_completo}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">CI</span>
                  <p className="text-sm font-medium mt-0.5 text-[var(--color-text-primary)]">{caso.cliente.carnet_identidad}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Teléfono</span>
                  <p className="text-sm font-medium mt-0.5 text-[var(--color-text-primary)]">{caso.cliente.telefono || "No registrado"}</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-base font-bold mb-4 pb-2 flex items-center gap-2
                             text-[var(--color-text-primary)] border-b border-[var(--color-surface-border)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M12 2l10 5H2l10-5z" /></svg> Detalles Judiciales
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Juzgado</span>
                  <p className="text-sm font-medium mt-0.5 text-[var(--color-text-primary)]">{caso.juzgado}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Título</span>
                  <p className="text-sm font-medium mt-0.5 text-[var(--color-text-primary)]">{caso.titulo}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {pestañaActiva === "docs" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pb-3 border-b border-[var(--color-surface-border)]">
              <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                Documentos Adjuntos
              </h3>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleSubirArchivo}
                  disabled={subiendo}
                />
                <Button
                  variant="primary"
                  size="sm"
                  loading={subiendo}
                  onClick={handleTriggerFileInput}
                >
                  {subiendo ? "Subiendo..." : "Subir Archivo"}
                </Button>
              </div>
            </div>

            <Alert variant="error" visible={!!docError}>
              {docError}
            </Alert>

            {cargandoDocs ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 rounded-full border-2 border-[var(--color-surface-border)] border-t-[var(--color-gold)] animate-spin" />
              </div>
            ) : documentos.length === 0 ? (
              <div className="text-center py-12 bg-[var(--color-surface-hover)] border border-dashed border-[var(--color-surface-border)] rounded-xl">
                <div className="mb-3 opacity-40">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <p className="font-medium text-[var(--color-text-secondary)]">No hay documentos aún</p>
                <p className="text-sm mt-1 text-[var(--color-text-muted)]">Sube el primer archivo para este expediente.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {documentos.map((doc) => (
                  <div 
                    key={doc.ruta} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-[var(--color-surface-hover)] border border-[var(--color-surface-border)] gap-4 transition-colors hover:bg-[var(--color-surface-card)]"
                  >
                    <div className="flex items-start gap-3 overflow-hidden">
                      <div className="mt-1 text-[var(--color-gold)] shrink-0">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[var(--color-text-primary)] truncate" title={doc.nombre}>
                          {doc.nombre}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)] mt-1">
                          <span>{(doc.tamaño / 1024 / 1024).toFixed(2)} MB</span>
                          <span className="w-1 h-1 rounded-full bg-[var(--color-text-muted)] opacity-50"></span>
                          <span>{doc.fechaSubida.toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDescargar(doc.ruta)}
                        className="text-[var(--color-info)] hover:bg-[var(--color-info-bg)]"
                      >
                        Descargar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEliminar(doc.ruta)}
                        className="text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)]"
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {pestañaActiva === "informe" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pb-3
                            border-b border-[var(--color-surface-border)]">
              <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                Bitácora de Actualizaciones
              </h3>

              {/* Botonera de Edición */}
              {!modoEdicion ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setModoEdicion(true)}
                >
                  Redactar Informes
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setModoEdicion(false);
                      setErrorMsg("");
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    loading={guardando}
                    onClick={handleGuardarInformes}
                  >
                    {guardando ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
              )}
            </div>

            {/* Informe para el Cliente (Público) */}
            <div className="p-4 sm:p-5 rounded-xl bg-[var(--color-info-bg)] border border-[var(--color-info-border)]">
              <h4 className="font-bold text-sm mb-3 flex items-center gap-2 text-[var(--color-info)]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg> Informe para el Cliente (Público)
              </h4>
              {!modoEdicion ? (
                <p className="text-sm whitespace-pre-wrap leading-relaxed text-[var(--color-text-primary)]">
                  {caso.informeCliente}
                </p>
              ) : (
                <FormField
                  as="textarea"
                  variant="light"
                  label=""
                  id="informe-cliente"
                  value={textosEdicion.cliente}
                  onChange={(e) => setTextosEdicion({ ...textosEdicion, cliente: e.target.value })}
                  placeholder="Escribe lo que el cliente verá desde su portal..."
                  className="min-h-[120px] !mb-0"
                />
              )}
            </div>

            {/* Informe de Despacho (Privado) */}
            <div className="p-4 sm:p-5 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-surface-border)]">
              <h4 className="font-bold text-sm mb-3 flex items-center gap-2 text-[var(--color-text-secondary)]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg> Informe de Despacho (Privado)
              </h4>
              {!modoEdicion ? (
                <p className="text-sm whitespace-pre-wrap leading-relaxed text-[var(--color-text-primary)]">
                  {caso.informeDespacho}
                </p>
              ) : (
                <FormField
                  as="textarea"
                  variant="light"
                  label=""
                  id="informe-despacho"
                  value={textosEdicion.despacho}
                  onChange={(e) => setTextosEdicion({ ...textosEdicion, despacho: e.target.value })}
                  placeholder="Escribe las notas internas para los abogados..."
                  className="min-h-[120px] !mb-0"
                />
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}