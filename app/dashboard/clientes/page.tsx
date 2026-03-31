"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserPlus, CheckCircle2, Users, Plus } from "lucide-react";
import { Cliente } from "../../../domain/entities/Cliente";
import { obtenerClientes, crearCliente } from "../../../infrastructure/repositories/clienteRepository";
import { Button } from "../../../components/ui/Button";

/* ── Opciones de Select ──────────────────────────────────────── */
const DEPARTAMENTOS = [
  { value: "LP", label: "La Paz" },
  { value: "SCZ", label: "Santa Cruz" },
  { value: "CBBA", label: "Cochabamba" },
  { value: "OR", label: "Oruro" },
  { value: "PT", label: "Potosí" },
  { value: "TJ", label: "Tarija" },
  { value: "CH", label: "Chuquisaca" },
  { value: "BE", label: "Beni" },
  { value: "PD", label: "Pando" },
];

const ESTADOS_CIVILES = [
  { value: "Soltero/a", label: "Soltero/a" },
  { value: "Casado/a", label: "Casado/a" },
  { value: "Divorciado/a", label: "Divorciado/a" },
  { value: "Viudo/a", label: "Viudo/a" },
];

/* ── Clases Tailwind (clonadas del ExpedienteForm) ───────────── */
const INPUT = "w-full text-base lg:text-lg px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50/50 placeholder:text-gray-400";
const LABEL = "text-base font-semibold text-gray-900 block";

/* ── Estado inicial ──────────────────────────────────────────── */
const FORM_INIT = {
  nombres: "",
  apellidoPaterno: "",
  apellidoMaterno: "",
  email: "",
  password: "",
  telefono: "",
  ci: "",
  expedido: "",
  nacionalidad: "Boliviana",
  fechaNacimiento: "",
  estadoCivil: "",
  profesion: "",
  direccion: "",
};

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(true);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState({ ...FORM_INIT });

  useEffect(() => {
    async function cargar() {
      const data = await obtenerClientes();
      setClientes(data);
      setCargando(false);
    }
    cargar();
  }, []);

  const cerrarModal = () => { setFormError(""); setMostrarModal(false); };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setFormError("");

    const resultado = await crearCliente(formData);

    if (resultado.success && resultado.data) {
      setClientes([resultado.data, ...clientes]);
      setFormData({ ...FORM_INIT });
      setMostrarModal(false);
    } else {
      setFormError(resultado.error || "Error desconocido al registrar el cliente.");
    }
    setGuardando(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">

      {/* ── Cabecera ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Directorio de Clientes</h1>
          <p className="mt-1 text-sm text-gray-500">Gestión de personas registradas en la firma.</p>
        </div>
        <Button variant="primary" onClick={() => setMostrarModal(true)}>
          <Plus className="w-5 h-5 mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      {/* ── Tabla ───────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200">
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-widest">Nombre Completo</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-widest">Teléfono</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cargando && (
                <tr>
                  <td colSpan={3} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400" />
                      <p className="text-gray-500 text-sm">Cargando directorio...</p>
                    </div>
                  </td>
                </tr>
              )}
              {!cargando && clientes.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-24 text-center">
                    <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <Users className="w-8 h-8 text-gray-300" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">No hay clientes registrados</h3>
                    <p className="text-sm text-gray-500">Registra tu primer cliente usando el botón de arriba.</p>
                  </td>
                </tr>
              )}
              {!cargando && clientes.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-50 border border-gray-100 rounded-md text-gray-400 group-hover:bg-white transition-colors">
                        <Users className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-gray-900 tracking-tight">{c.nombreCompleto}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm text-gray-500">{c.telefono || "—"}</span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Link href={`/dashboard/clientes/${c.id}`}>
                      <button className="text-sm font-medium text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-md hover:bg-blue-50 transition-colors">
                        Ver Detalles
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          MODAL: REGISTRAR NUEVO CLIENTE
         ═══════════════════════════════════════════════════════════ */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-200 flex flex-col max-h-[90vh]">

            {/* Header */}
            <div className="px-8 py-5 flex items-center justify-between border-b border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <UserPlus className="w-6 h-6 text-blue-600" />
                Registrar Nuevo Cliente
              </h3>
              <button onClick={cerrarModal} className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>

            {/* Body */}
            <div className="px-8 py-6 overflow-y-auto">
              <form id="cliente-form" onSubmit={handleGuardar} className="space-y-8">

                {formError && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex gap-3 text-red-800 text-base font-medium">
                    <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    {formError}
                  </div>
                )}

                {/* ── Grid 2 columnas FIJO ──────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

                  {/* ══ COL 1: Identidad y Acceso ══════════════ */}
                  <div className="space-y-6">
                    <h4 className="text-sm font-extrabold text-gray-900 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2">
                      Identidad y Acceso
                    </h4>

                    <div className="space-y-2">
                      <label htmlFor="nombres" className={LABEL}>Nombres *</label>
                      <input id="nombres" required type="text" placeholder="Ej. María Elena" className={INPUT}
                        value={formData.nombres} onChange={(e) => setFormData({ ...formData, nombres: e.target.value })} />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="apellidoPaterno" className={LABEL}>Apellido Paterno *</label>
                      <input id="apellidoPaterno" required type="text" placeholder="Ej. García" className={INPUT}
                        value={formData.apellidoPaterno} onChange={(e) => setFormData({ ...formData, apellidoPaterno: e.target.value })} />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="apellidoMaterno" className={LABEL}>Apellido Materno</label>
                      <input id="apellidoMaterno" type="text" placeholder="Ej. Soliz" className={INPUT}
                        value={formData.apellidoMaterno} onChange={(e) => setFormData({ ...formData, apellidoMaterno: e.target.value })} />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="email" className={LABEL}>Correo Electrónico *</label>
                      <input id="email" required type="email" placeholder="Ej. maria@correo.com" className={INPUT}
                        value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="password" className={LABEL}>Contraseña de Acceso *</label>
                      <input id="password" required type="password" placeholder="Mín. 6 caracteres" minLength={6} className={INPUT}
                        value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="telefono" className={LABEL}>Teléfono / Celular *</label>
                      <input id="telefono" required type="tel" placeholder="Ej. 70012345" className={INPUT}
                        value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} />
                    </div>
                  </div>

                  {/* ══ COL 2: Generales de Ley ════════════════ */}
                  <div className="space-y-6">
                    <h4 className="text-sm font-extrabold text-gray-900 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2">
                      Generales de Ley <span className="font-normal text-gray-400">(Opcional)</span>
                    </h4>

                    {/* Sub-grid para campos cortos */}
                    <div className="grid grid-cols-2 gap-4">

                      {/* CI | Expedido */}
                      <div className="space-y-2">
                        <label htmlFor="ci" className={LABEL}>Cédula de Identidad</label>
                        <input id="ci" type="text" placeholder="Ej. 12345678" className={INPUT}
                          value={formData.ci} onChange={(e) => setFormData({ ...formData, ci: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="expedido" className={LABEL}>Expedido</label>
                        <select id="expedido" className={INPUT}
                          value={formData.expedido} onChange={(e) => setFormData({ ...formData, expedido: e.target.value })}>
                          <option value="">Seleccione</option>
                          {DEPARTAMENTOS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                        </select>
                      </div>

                      {/* Fecha Nac | Nacionalidad */}
                      <div className="space-y-2">
                        <label htmlFor="fechaNacimiento" className={LABEL}>Fecha de Nacimiento</label>
                        <input id="fechaNacimiento" type="date" className={INPUT}
                          value={formData.fechaNacimiento} onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="nacionalidad" className={LABEL}>Nacionalidad</label>
                        <input id="nacionalidad" type="text" className={INPUT}
                          value={formData.nacionalidad} onChange={(e) => setFormData({ ...formData, nacionalidad: e.target.value })} />
                      </div>

                      {/* Estado Civil | Profesión */}
                      <div className="space-y-2">
                        <label htmlFor="estadoCivil" className={LABEL}>Estado Civil</label>
                        <select id="estadoCivil" className={INPUT}
                          value={formData.estadoCivil} onChange={(e) => setFormData({ ...formData, estadoCivil: e.target.value })}>
                          <option value="">Seleccione</option>
                          {ESTADOS_CIVILES.map(ec => <option key={ec.value} value={ec.value}>{ec.label}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="profesion" className={LABEL}>Profesión / Ocupación</label>
                        <input id="profesion" type="text" placeholder="Ej. Ingeniero Civil" className={INPUT}
                          value={formData.profesion} onChange={(e) => setFormData({ ...formData, profesion: e.target.value })} />
                      </div>
                    </div>

                    {/* Dirección (fuera del sub-grid, ancho completo) */}
                    <div className="space-y-2">
                      <label htmlFor="direccion" className={LABEL}>Dirección de Domicilio</label>
                      <textarea id="direccion" rows={3} placeholder="Ej. Av. Arce #2560, Zona Sopocachi, La Paz"
                        className={INPUT + " resize-none"}
                        value={formData.direccion} onChange={(e) => setFormData({ ...formData, direccion: e.target.value })} />
                    </div>
                  </div>

                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t border-gray-200 bg-gray-50/80 flex justify-end gap-4 rounded-b-2xl">
              <button type="button" onClick={cerrarModal} disabled={guardando}
                className="px-6 py-3 text-base font-bold text-gray-700 bg-white border border-gray-300 rounded-xl shadow-sm hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-colors">
                Cancelar
              </button>
              <button type="submit" form="cliente-form" disabled={guardando}
                className="px-8 py-3 text-base font-bold text-white bg-blue-600 border border-transparent rounded-xl shadow-md hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all flex items-center justify-center min-w-[160px]">
                {guardando ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" strokeWidth={2.5} />
                    Guardar Cliente
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
