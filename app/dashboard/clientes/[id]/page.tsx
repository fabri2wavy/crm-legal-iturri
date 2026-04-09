"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  FolderOpen,
  Trash2,
  Lock,
  ShieldAlert,
  KeyRound,
} from "lucide-react";
import { Cliente } from "../../../../domain/entities/Cliente";
import { Expediente } from "../../../../domain/entities/Expediente";
import {
  obtenerClientePorId,
  obtenerExpedientesPorCliente,
  actualizarCliente,
  eliminarCliente,
} from "../../../../infrastructure/repositories/clienteRepository";
import { Button } from "../../../../components/ui/Button";
import { FormField } from "../../../../components/ui/FormField";

/* ── Helper: colores semánticos por estado procesal ──────────── */
function getEstadoDesign(estado: string | undefined | null): string {
  if (!estado) return "bg-gray-100 text-gray-800";
  const st = estado.toLowerCase();
  if (
    st.includes("concluido") ||
    st.includes("archivado") ||
    st.includes("cerrado") ||
    st.includes("aprobado")
  ) {
    return "bg-gray-100 text-gray-600";
  }
  if (
    st.includes("juicio") ||
    st.includes("denuncia") ||
    st.includes("demanda") ||
    st.includes("rechazado")
  ) {
    return "bg-rose-50 text-rose-700 border border-rose-100";
  }
  if (
    st.includes("conciliación") ||
    st.includes("estudio") ||
    st.includes("preliminar") ||
    st.includes("revisión") ||
    st.includes("observación") ||
    st.includes("espera")
  ) {
    return "bg-amber-50 text-amber-700 border border-amber-100";
  }
  return "bg-blue-50 text-blue-700 border border-blue-100";
}

export default function DetalleClientePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  /* ── State ─────────────────────────────────────────────────── */
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [enviandoLink, setEnviandoLink] = useState(false);
  const [confirmarEliminacion, setConfirmarEliminacion] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  /* ── Toast auto-dismiss (4s) ────────────────────────────────── */
  const showToast = useCallback((type: "success" | "error", msg: string) => {
    setToast({ type, msg });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  /* ── Formulario de edición (campos granulares) ───────────────── */
  const [formData, setFormData] = useState({
    nombresLegales: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    telefono: "",
    ci: "",
    expedido: "",
  });

  /* ── Email (solo lectura, se muestra pero no se edita) ─────── */
  const [emailDisplay, setEmailDisplay] = useState("");

  /* ── Initialization ─────────────────────────────────────────── */
  useEffect(() => {
    async function cargarData() {
      if (!id) return;

      const [resCliente, resExpedientes] = await Promise.all([
        obtenerClientePorId(id),
        obtenerExpedientesPorCliente(id),
      ]);

      if (resCliente) {
        setCliente(resCliente);
        setFormData({
          nombresLegales: resCliente.nombresLegales || "",
          apellidoPaterno: resCliente.apellidoPaterno || "",
          apellidoMaterno: resCliente.apellidoMaterno || "",
          telefono: resCliente.telefono || "",
          ci: resCliente.ci || "",
          expedido: resCliente.expedido || "",
        });
        setEmailDisplay(resCliente.email || "");
      }
      setExpedientes(resExpedientes);
      setLoading(false);
    }
    cargarData();
  }, [id]);

  /* ── Helpers ────────────────────────────────────────────────── */
  const actualizarCampo = (campo: string, valor: string) => {
    setFormData((prev) => ({ ...prev, [campo]: valor }));
  };

  const construirNombre = (): string => {
    return (
      [formData.nombresLegales, formData.apellidoPaterno, formData.apellidoMaterno]
        .filter(Boolean)
        .join(" ")
        .trim() || "Sin registrar"
    );
  };

  /* ── Guardar cambios ───────────────────────────────────────── */
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setToast(null);

    const success = await actualizarCliente(id, formData);

    if (success) {
      const nuevoNombre = construirNombre();
      setCliente({
        ...cliente!,
        nombreCompleto: nuevoNombre,
        nombresLegales: formData.nombresLegales,
        apellidoPaterno: formData.apellidoPaterno,
        apellidoMaterno: formData.apellidoMaterno,
        telefono: formData.telefono,
        ci: formData.ci,
        expedido: formData.expedido,
      });
      showToast("success", "Datos del cliente actualizados correctamente.");
    } else {
      showToast("error", "Error al actualizar los datos del cliente.");
    }
    setGuardando(false);
  };

  /* ── Restablecer contraseña (simulado) ─────────────────────── */
  const handleResetPassword = async () => {
    setEnviandoLink(true);
    setToast(null);

    /* Simulación de envío de correo vía Supabase Auth */
    await new Promise((resolve) => setTimeout(resolve, 1500));

    showToast(
      "success",
      `Se envió un enlace de restablecimiento a ${emailDisplay || "el correo del cliente"}.`
    );
    setEnviandoLink(false);
  };

  /* ── Eliminar cliente ──────────────────────────────────────── */
  const handleDelete = async () => {
    setEliminando(true);
    setToast(null);

    const result = await eliminarCliente(id);

    if (result.success) {
      router.push("/dashboard/clientes");
    } else {
      setConfirmarEliminacion(false);
      if (result.error === "HAS_CASES") {
        showToast("error", "No se puede eliminar este cliente porque tiene expedientes asociados.");
      } else {
        showToast("error", "Error al intentar eliminar el cliente.");
      }
      setEliminando(false);
    }
  };

  /* ── Render: Loading ───────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        <p className="mt-4 text-gray-500 font-medium">Cargando perfil del cliente...</p>
      </div>
    );
  }

  /* ── Render: Not found ─────────────────────────────────────── */
  if (!cliente) {
    return (
      <div className="text-center py-20">
        <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <User className="w-8 h-8 text-gray-300" strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Cliente no encontrado</h2>
        <p className="text-gray-500 mb-6">El cliente que busca no existe o fue eliminado.</p>
        <Link href="/dashboard/clientes">
          <Button variant="secondary">Volver al Directorio</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden animate-in fade-in duration-500">

      {/* ─── Toast Flotante (fuera del flujo) ──────────────────── */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border text-sm font-medium flex items-center gap-2 min-w-[280px] max-w-[420px] ${
              toast.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${
              toast.type === "success" ? "bg-emerald-500" : "bg-red-500"
            }`} />
            {toast.msg}
            <button
              onClick={() => setToast(null)}
              className="ml-auto text-gray-400 hover:text-gray-600 transition-colors shrink-0"
              aria-label="Cerrar notificación"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ─── Header (una sola línea, alta densidad) ────────────── */}
      <header className="shrink-0 flex items-center gap-4 mb-3">
        <Link href="/dashboard/clientes">
          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Volver
          </Button>
        </Link>
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
          <User className="w-4 h-4" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight truncate">
          {cliente.nombreCompleto}
        </h1>
      </header>

      {/* ─── Layout Principal (Side by Side, viewport-lock solo en lg+) */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch overflow-y-auto lg:overflow-hidden">

        {/* ─── COLUMNA IZQUIERDA: Identidad (Estática, h-full) ── */}
        <div className="lg:col-span-4 lg:h-full flex flex-col">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden lg:h-full flex flex-col">
            {/* Card Header */}
            <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" strokeWidth={2} />
              <h2 className="text-sm font-bold text-gray-900">
                Información Personal
              </h2>
            </div>

            {/* Card Body: Form */}
            <form onSubmit={handleUpdate} className="flex-1 px-4 py-4 flex flex-col">
              {/* Grupo de campos */}
              <div className="space-y-4">
                {/* Nombres (ancho completo) */}
                <FormField
                  id="nombresLegales"
                  label="Nombres"
                  variant="light"
                  placeholder="Ej. María Elena"
                  value={formData.nombresLegales}
                  onChange={(e) => actualizarCampo("nombresLegales", e.target.value)}
                  required
                />

                {/* Apellidos (dos columnas) */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    id="apellidoPaterno"
                    label="Ap. Paterno"
                    variant="light"
                    placeholder="Ej. García"
                    value={formData.apellidoPaterno}
                    onChange={(e) => actualizarCampo("apellidoPaterno", e.target.value)}
                    required
                  />
                  <FormField
                    id="apellidoMaterno"
                    label="Ap. Materno"
                    variant="light"
                    placeholder="Ej. Soliz"
                    value={formData.apellidoMaterno}
                    onChange={(e) => actualizarCampo("apellidoMaterno", e.target.value)}
                  />
                </div>

                {/* Email (Disabled — solo lectura) */}
                <div className="space-y-1">
                  <label htmlFor="email" className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    Correo Electrónico
                    <Lock className="w-3 h-3 text-gray-400" />
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 text-sm cursor-not-allowed outline-none"
                    value={emailDisplay}
                    disabled
                    title="El correo electrónico no se puede modificar desde esta vista."
                  />
                </div>

                {/* Teléfono */}
                <div className="space-y-1">
                  <label htmlFor="telefono" className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    Teléfono / Celular
                  </label>
                  <input
                    id="telefono"
                    type="tel"
                    placeholder="Ej. 70012345"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 bg-gray-50/50 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400"
                    value={formData.telefono}
                    onChange={(e) => actualizarCampo("telefono", e.target.value)}
                  />
                </div>

                {/* C.I. / Expedido (grilla asimétrica 3 cols) */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1">
                    <label htmlFor="ci" className="text-xs font-semibold text-gray-700">
                      Cédula de Identidad (C.I.)
                    </label>
                    <input
                      id="ci"
                      type="text"
                      placeholder="Ej. 12345678"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-300 bg-gray-50/50 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400"
                      value={formData.ci}
                      onChange={(e) => actualizarCampo("ci", e.target.value)}
                    />
                  </div>
                  <div className="col-span-1 space-y-1">
                    <label htmlFor="expedido" className="text-xs font-semibold text-gray-700">
                      Expedido
                    </label>
                    <select
                      id="expedido"
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-300 bg-gray-50/50 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-700 appearance-none cursor-pointer"
                      value={formData.expedido}
                      onChange={(e) => actualizarCampo("expedido", e.target.value)}
                    >
                      <option value="">—</option>
                      <option value="LP">LP</option>
                      <option value="CB">CB</option>
                      <option value="SC">SC</option>
                      <option value="OR">OR</option>
                      <option value="PT">PT</option>
                      <option value="TJ">TJ</option>
                      <option value="CH">CH</option>
                      <option value="BN">BN</option>
                      <option value="PA">PA</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit — anclado al fondo de la tarjeta */}
              <div className="mt-auto pt-5">
                <Button type="submit" variant="primary" loading={guardando} fullWidth>
                  {guardando ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* ─── COLUMNA DERECHA: Historial y Admin ─────────────── */}
        <div className="lg:col-span-8 lg:h-full flex flex-col gap-3 min-h-0">

          {/* Historial Legal (absorbe espacio, scroll interno) */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between shrink-0">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-blue-600" />
                Historial de Expedientes
              </h2>
              {expedientes.length > 0 && (
                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                  {expedientes.length} {expedientes.length === 1 ? "caso" : "casos"}
                </span>
              )}
            </div>

            {/* ÚNICO scroll de toda la pantalla */}
            <div className="flex-1 overflow-y-auto p-3 pr-2">
              {expedientes.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                  <FolderOpen className="w-7 h-7 text-gray-300 mx-auto mb-1.5" />
                  <h3 className="text-sm font-semibold text-gray-900 mb-0.5">Sin expedientes</h3>
                  <p className="text-xs text-gray-500">Este cliente no tiene expedientes asociados.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {expedientes.map((exp) => (
                    <div
                      key={exp.id}
                      className="p-3 border border-gray-100 bg-white rounded-xl hover:shadow-md hover:border-blue-100 transition-all group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="min-w-0 flex-1 mr-3">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">
                            NUREJ: {exp.numeroCaso}
                          </span>
                          <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate" title={exp.titulo}>
                            {exp.titulo}
                          </h3>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap shrink-0 ${getEstadoDesign(exp.estado)}`}
                        >
                          {exp.estado?.replace(/_/g, " ") || "Desconocido"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-sm pt-3 border-t border-gray-50">
                        <p className="text-gray-500 font-medium">
                          Materia:{" "}
                          <span className="text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md ml-1 text-xs font-semibold">
                            {exp.materia}
                          </span>
                        </p>
                        <Link href={`/dashboard/casos/${exp.id}`}>
                          <button className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1">
                            Revisar Expediente &rarr;
                          </button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Administración de Cuenta (compacta, anclada al fondo) */}
          <div className="shrink-0 h-fit bg-gray-50/50 border border-gray-200 rounded-xl p-3 shadow-sm space-y-2.5">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-gray-500" />
              Administración de Cuenta
            </h2>

            {/* Restablecer Contraseña */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">Enviar enlace de restablecimiento al correo del cliente.</p>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={enviandoLink}
                className="px-4 py-1.5 text-xs font-bold text-blue-600 bg-white border border-blue-200 rounded-lg shadow-sm hover:bg-blue-50 hover:border-blue-300 transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0 ml-3"
              >
                {enviandoLink ? (
                  <>
                    <div className="w-3 h-3 rounded-full border-2 border-blue-300/40 border-t-blue-600 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5" />
                    Restablecer Contraseña
                  </>
                )}
              </button>
            </div>

            {/* Separador visual */}
            <div className="border-t border-red-100" />

            {/* Zona de Peligro — Eliminar */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-red-500 font-medium">Eliminar permanentemente este cliente.</p>
              {!confirmarEliminacion ? (
                <button
                  type="button"
                  onClick={() => setConfirmarEliminacion(true)}
                  className="px-4 py-1.5 text-xs font-bold text-red-600 bg-white border border-red-200 rounded-lg shadow-sm hover:bg-red-50 hover:border-red-300 transition-colors flex items-center gap-1.5 shrink-0 ml-3"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Eliminar Cliente
                </button>
              ) : (
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <button
                    type="button"
                    onClick={() => setConfirmarEliminacion(false)}
                    className="px-3 py-1.5 text-xs font-bold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={eliminando}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {eliminando ? (
                      <>
                        <div className="w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                        Eliminando...
                      </>
                    ) : (
                      "Sí, Eliminar"
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}