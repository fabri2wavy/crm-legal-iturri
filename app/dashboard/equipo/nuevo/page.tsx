"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, UserPlus, CheckCircle2 } from "lucide-react";
import { registrarNuevoMiembro } from "../../../../infrastructure/actions/equipoActions";
import { Button } from "../../../../components/ui/Button";

/* ══════════════════════════════════════════════════════════════
   CONSTANTES
   ══════════════════════════════════════════════════════════════ */

const ROLES = [
  { value: "abogado", label: "Abogado" },
  { value: "paralegal", label: "Paralegal" },
  { value: "admin", label: "Administrador" },
];

const FORM_INIT = {
  nombres: "",
  apellidoPaterno: "",
  apellidoMaterno: "",
  email: "",
  telefono: "",
  rol: "abogado",
  cargo: "",
  especialidad: "",
};

/* ── Clases reutilizables (alta densidad) ────────────────────── */
const INPUT =
  "w-full text-sm px-3.5 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white placeholder:text-gray-400";
const LABEL = "text-sm font-semibold text-gray-700 block mb-1.5";

/* ── Tipos de validación ─────────────────────────────────────── */
type ErroresForm = {
  nombres?: string;
  apellidoPaterno?: string;
  email?: string;
  rol?: string;
  cargo?: string;
};

/* ══════════════════════════════════════════════════════════════
   PÁGINA: Añadir Nuevo Miembro
   ══════════════════════════════════════════════════════════════ */
export default function NuevoMiembroPage() {
  const router = useRouter();

  /* ── Estado ─────────────────────────────────────────────────── */
  const [formData, setFormData] = useState({ ...FORM_INIT });
  const [errores, setErrores] = useState<ErroresForm>({});
  const [enviando, setEnviando] = useState(false);
  const [errorGlobal, setErrorGlobal] = useState("");
  const [exito, setExito] = useState(false);

  /* ── Helpers ────────────────────────────────────────────────── */
  const actualizarCampo = (campo: string, valor: string) => {
    setFormData((prev) => ({ ...prev, [campo]: valor }));
    if (campo in errores) {
      setErrores((prev) => ({ ...prev, [campo]: undefined }));
    }
  };

  const inputClass = (campo: keyof ErroresForm) =>
    `${INPUT} ${errores[campo] ? "!border-red-400 !ring-red-100 focus:!border-red-500 focus:!ring-red-200" : ""}`;

  /* ── Validación ─────────────────────────────────────────────── */
  const validar = (): boolean => {
    const nuevosErrores: ErroresForm = {};

    if (!formData.nombres.trim()) {
      nuevosErrores.nombres = "Los nombres son obligatorios.";
    }
    if (!formData.apellidoPaterno.trim()) {
      nuevosErrores.apellidoPaterno = "El apellido paterno es obligatorio.";
    }
    if (!formData.email.trim()) {
      nuevosErrores.email = "El correo es obligatorio para crear la cuenta.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nuevosErrores.email = "Ingresa un correo electrónico válido.";
    }
    if (!formData.rol) {
      nuevosErrores.rol = "Selecciona un rol.";
    }
    if (!formData.cargo.trim()) {
      nuevosErrores.cargo = "El cargo es obligatorio.";
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  /* ── Submit (Server Action) ─────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validar()) return;

    setEnviando(true);
    setErrorGlobal("");

    const resultado = await registrarNuevoMiembro({
      nombres: formData.nombres.trim(),
      apellidoPaterno: formData.apellidoPaterno.trim(),
      apellidoMaterno: formData.apellidoMaterno.trim(),
      email: formData.email.trim() || null,
      telefono: formData.telefono.trim() || null,
      rol: formData.rol,
      cargo: formData.cargo.trim(),
      especialidad: formData.especialidad.trim() || null,
    });

    if (resultado.success) {
      setExito(true);
      /* Breve delay para que el usuario vea el feedback de éxito */
      setTimeout(() => {
        router.push("/dashboard/equipo");
      }, 1200);
    } else {
      setErrorGlobal(resultado.error);
    }

    setEnviando(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-2">
        <button
          type="button"
          onClick={() => router.push("/dashboard/equipo")}
          className="w-9 h-9 rounded-lg border border-gray-200 bg-white shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Añadir Nuevo Miembro
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Completa los datos para registrar un nuevo integrante del equipo.
          </p>
        </div>
      </div>

      {/* ── Alerta de éxito ────────────────────────────────────── */}
      {exito && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-sm font-medium animate-in fade-in duration-300">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          Miembro registrado correctamente. Redirigiendo...
        </div>
      )}

      {/* ── Error global ──────────────────────────────────────── */}
      {errorGlobal && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex gap-3 text-red-800 text-sm font-medium">
          <svg
            className="w-5 h-5 flex-shrink-0 mt-0.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          {errorGlobal}
        </div>
      )}

      {/* ── Formulario ────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ═══════════════════════════════════════════════════════
            SECCIÓN 1: Identidad
           ═══════════════════════════════════════════════════════ */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
              Identidad
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Datos personales del nuevo miembro.
            </p>
          </div>

          <div className="px-6 py-5 space-y-4">
            {/* Nombres — fila completa */}
            <div>
              <label htmlFor="nombres" className={LABEL}>
                Nombres <span className="text-red-400">*</span>
              </label>
              <input
                id="nombres"
                type="text"
                placeholder="Ej. Carlos Eduardo"
                className={inputClass("nombres")}
                value={formData.nombres}
                onChange={(e) => actualizarCampo("nombres", e.target.value)}
              />
              {errores.nombres && (
                <p className="text-xs text-red-500 mt-1">{errores.nombres}</p>
              )}
            </div>

            {/* Apellidos — 2 columnas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="apellidoPaterno" className={LABEL}>
                  Apellido Paterno <span className="text-red-400">*</span>
                </label>
                <input
                  id="apellidoPaterno"
                  type="text"
                  placeholder="Ej. Mendoza"
                  className={inputClass("apellidoPaterno")}
                  value={formData.apellidoPaterno}
                  onChange={(e) =>
                    actualizarCampo("apellidoPaterno", e.target.value)
                  }
                />
                {errores.apellidoPaterno && (
                  <p className="text-xs text-red-500 mt-1">
                    {errores.apellidoPaterno}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="apellidoMaterno" className={LABEL}>
                  Apellido Materno
                </label>
                <input
                  id="apellidoMaterno"
                  type="text"
                  placeholder="Ej. Quispe"
                  className={INPUT}
                  value={formData.apellidoMaterno}
                  onChange={(e) =>
                    actualizarCampo("apellidoMaterno", e.target.value)
                  }
                />
              </div>
            </div>

            {/* Correo y Teléfono — 2 columnas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className={LABEL}>
                  Correo Electrónico <span className="text-red-400">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="Ej. carlos@firma.com"
                  className={inputClass("email")}
                  value={formData.email}
                  onChange={(e) => actualizarCampo("email", e.target.value)}
                />
                {errores.email && (
                  <p className="text-xs text-red-500 mt-1">{errores.email}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Se creará una cuenta con contraseña temporal.
                </p>
              </div>
              <div>
                <label htmlFor="telefono" className={LABEL}>
                  Teléfono / Celular
                </label>
                <input
                  id="telefono"
                  type="tel"
                  placeholder="Ej. 70012345"
                  className={INPUT}
                  value={formData.telefono}
                  onChange={(e) => actualizarCampo("telefono", e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            SECCIÓN 2: Información Profesional
           ═══════════════════════════════════════════════════════ */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
              Información Profesional
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Rol dentro del sistema y cargo en la firma.
            </p>
          </div>

          <div className="px-6 py-5 space-y-4">
            {/* Rol y Cargo — 2 columnas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="rol" className={LABEL}>
                  Rol de Sistema <span className="text-red-400">*</span>
                </label>
                <select
                  id="rol"
                  className={inputClass("rol")}
                  value={formData.rol}
                  onChange={(e) => actualizarCampo("rol", e.target.value)}
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                {errores.rol && (
                  <p className="text-xs text-red-500 mt-1">{errores.rol}</p>
                )}
              </div>
              <div>
                <label htmlFor="cargo" className={LABEL}>
                  Cargo <span className="text-red-400">*</span>
                </label>
                <input
                  id="cargo"
                  type="text"
                  placeholder="Ej. Abogado Junior, Socio Principal"
                  className={inputClass("cargo")}
                  value={formData.cargo}
                  onChange={(e) => actualizarCampo("cargo", e.target.value)}
                />
                {errores.cargo && (
                  <p className="text-xs text-red-500 mt-1">{errores.cargo}</p>
                )}
              </div>
            </div>

            {/* Especialidad — fila completa */}
            <div>
              <label htmlFor="especialidad" className={LABEL}>
                Especialidad
              </label>
              <input
                id="especialidad"
                type="text"
                placeholder="Ej. Derecho Penal, Civil, Laboral"
                className={INPUT}
                value={formData.especialidad}
                onChange={(e) =>
                  actualizarCampo("especialidad", e.target.value)
                }
              />
              <p className="text-xs text-gray-400 mt-1">
                Opcional. Área de práctica principal del miembro.
              </p>
            </div>
          </div>
        </div>

        {/* ── Footer / Acciones ────────────────────────────────── */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => router.push("/dashboard/equipo")}
            disabled={enviando}
            className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            Cancelar
          </button>

          <Button
            type="submit"
            variant="primary"
            loading={enviando}
            disabled={exito}
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            Registrar Miembro
          </Button>
        </div>
      </form>
    </div>
  );
}
