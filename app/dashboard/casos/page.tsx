"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  FolderOpen, Plus, Search, Filter, FileText,
} from "lucide-react";
import { obtenerExpedientes, crearExpediente } from "@/infrastructure/repositories/expedienteRepository";
import { obtenerClientes } from "@/infrastructure/repositories/clienteRepository";
import { obtenerAbogados, obtenerPerfilActual } from "@/infrastructure/repositories/usuarioRepository";
import { obtenerConfiguraciones } from "@/infrastructure/repositories/configuracionRepository";
import type { UsuarioPerfil } from "@/domain/entities/UsuarioPerfil";
import type { ConfiguracionGlobal } from "@/domain/entities/ConfiguracionGlobal";
import { Button } from "@/components/ui/Button";
import { ToastContainer, useToasts } from "@/components/ui/Toast";
import { ModalCrearExpediente } from "@/components/casos/ModalCrearExpediente";
import type { ExpedienteFormValues } from "@/components/casos/ExpedienteForm";
import { MATERIAS_BASE } from "@/components/casos/ExpedienteForm";

/* ── Estado badge design ────────────────────────────────────── */
function getEstadoDesign(estado: string | undefined | null) {
  if (!estado) return "bg-gray-100 text-gray-800";
  const st = estado.toLowerCase();
  if (st.includes("concluido") || st.includes("archivado") || st.includes("cerrado") || st.includes("aprobado"))
    return "bg-gray-100 text-gray-600";
  if (st.includes("juicio") || st.includes("denuncia") || st.includes("demanda") || st.includes("rechazado"))
    return "bg-rose-50 text-rose-700";
  if (st.includes("conciliación") || st.includes("estudio") || st.includes("preliminar") || st.includes("revisión") || st.includes("espera"))
    return "bg-amber-50 text-amber-700";
  return "bg-blue-50 text-blue-700";
}

export default function CasosPage() {
  /* ── Data ─────────────────────────────────────────────────── */
  const [expedientes, setExpedientes]       = useState<any[]>([]);
  const [listaClientes, setListaClientes]   = useState<any[]>([]);
  const [listaAbogados, setListaAbogados]   = useState<any[]>([]);
  const [perfilActual, setPerfilActual]     = useState<UsuarioPerfil | null>(null);
  const [materiasDB, setMateriasDB]         = useState<ConfiguracionGlobal[]>([]);
  const [juzgadosDB, setJuzgadosDB]         = useState<ConfiguracionGlobal[]>([]);
  const [cargando, setCargando]             = useState(true);

  /* ── UI state ─────────────────────────────────────────────── */
  const [searchTerm, setSearchTerm]         = useState("");
  const [materiaFilter, setMateriaFilter]   = useState("");
  const [mostrarModal, setMostrarModal]     = useState(false);
  const [guardando, setGuardando]           = useState(false);

  const { toasts, addToast, removeToast } = useToasts();

  /* ── Carga inicial ────────────────────────────────────────── */
  useEffect(() => {
    async function init() {
      const [dataCasos, dataClientes, dataAbogados, resMaterias, resJuzgados, perfil] =
        await Promise.all([
          obtenerExpedientes(),
          obtenerClientes(),
          obtenerAbogados(),
          obtenerConfiguraciones("materia"),
          obtenerConfiguraciones("juzgado"),
          obtenerPerfilActual(),
        ]);

      setExpedientes(dataCasos);
      setListaClientes(dataClientes);
      setListaAbogados(dataAbogados);
      setPerfilActual(perfil);
      if (resMaterias.data) setMateriasDB(resMaterias.data);
      if (resJuzgados.data) setJuzgadosDB(resJuzgados.data);
      setCargando(false);
    }
    init();
  }, []);

  /* ── Filtrado ─────────────────────────────────────────────── */
  const expedientesFiltrados = useMemo(() =>
    expedientes.filter((caso) => {
      if (materiaFilter && caso.materia !== materiaFilter) return false;
      if (searchTerm) {
        const t = searchTerm.toLowerCase();
        return (
          (caso.numeroCaso ?? "").toLowerCase().includes(t) ||
          (caso.titulo ?? "").toLowerCase().includes(t) ||
          (caso.nombreCliente ?? "").toLowerCase().includes(t) ||
          (caso.parteContraria ?? "").toLowerCase().includes(t)
        );
      }
      return true;
    }),
    [expedientes, searchTerm, materiaFilter]
  );

  /* ── Guardar nuevo expediente ─────────────────────────────── */
  const handleGuardarExpediente = useCallback(async (values: ExpedienteFormValues) => {
    setGuardando(true);
    try {
      const nuevo = await crearExpediente({
        clienteId:            values.clienteId,
        abogado_id:           values.abogado_id,
        numeroCaso:           values.numeroCaso,
        titulo:               values.titulo,
        materia:              values.materia,
        juzgado:              values.juzgado,
        parteContraria:       values.parteContraria,
        informeDespacho:      values.informeDespacho ?? "",
        informeCliente:       values.informeCliente ?? "",
        rolCliente:           values.rolCliente,
        tipoProceso:          values.tipoProceso,
        nurej:                values.nurej,
        etapaProcesal:        values.etapaProcesal,
        juezActual:           values.juezActual,
        secretarioActuario:   values.secretarioActuario,
        numeroFiscalia:       values.numeroFiscalia,
        numeroFelcc:          values.numeroFelcc,
        fiscalActual:         values.fiscalActual,
        investigadorAsignado: values.investigadorAsignado,
        cuantia:              values.cuantia,
      } as any);

      if (nuevo) {
        const data = await obtenerExpedientes();
        setExpedientes(data);
        setMostrarModal(false);
        addToast("success", "Expediente registrado correctamente.");
      } else {
        addToast("error", "Error al registrar el expediente. Revise los datos e intente nuevamente.");
      }
    } catch {
      addToast("error", "Error de conexión con la base de datos.");
    } finally {
      setGuardando(false);
    }
  }, [addToast]);

  /* ── Options para filtro de materia ──────────────────────── */
  const todasMaterias = [
    ...MATERIAS_BASE.filter(m => m !== "Otro"),
    ...materiasDB.filter(m => !MATERIAS_BASE.includes(m.valor)).map(m => m.valor),
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">

      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Expedientes</h1>
          <p className="mt-1 text-sm text-gray-500">
            {perfilActual?.rol === "cliente"
              ? "Consulta el estado y avance de tus causas legales."
              : "Gestión de causas legales y flujo procesal."}
          </p>
        </div>
        {(perfilActual?.rol === "admin" || perfilActual?.rol === "abogado") && (
          <Button variant="primary" onClick={() => setMostrarModal(true)}>
            <Plus className="w-5 h-5 mr-2" />
            Nuevo Expediente
          </Button>
        )}
      </div>

      {/* Barra de filtros */}
      <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por N° caso, título, partes..."
            className="w-full pl-10 pr-4 py-2 text-sm text-gray-900 bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative min-w-55">
          <Filter className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <select
            className="w-full pl-10 pr-8 py-2 text-sm text-gray-700 bg-gray-50 border border-transparent rounded-lg appearance-none cursor-pointer focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors outline-none"
            value={materiaFilter}
            onChange={(e) => setMateriaFilter(e.target.value)}
          >
            <option value="">Todas las materias</option>
            {todasMaterias.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200">
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-widest">Identificador</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-widest">Partes y Juzgado</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-widest">Materia</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-widest">Estado (Flujo Legal)</th>
                {perfilActual?.rol !== "cliente" && (
                  <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-widest text-right">Acción</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cargando && (
                <tr>
                  <td colSpan={perfilActual?.rol === "cliente" ? 4 : 5} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400" />
                      <p className="text-gray-500 text-sm">Cargando base de datos legal...</p>
                    </div>
                  </td>
                </tr>
              )}

              {!cargando && expedientesFiltrados.length === 0 && (
                <tr>
                  <td colSpan={perfilActual?.rol === "cliente" ? 4 : 5} className="py-24 text-center">
                    <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <FolderOpen className="w-8 h-8 text-gray-300" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Ningún expediente encontrado</h3>
                    <p className="text-sm text-gray-500">Agrega un caso nuevo o cambia los términos de búsqueda.</p>
                  </td>
                </tr>
              )}

              {!cargando && expedientesFiltrados.map((caso) => (
                <tr key={caso.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-50 border border-gray-100 rounded-md text-gray-400 group-hover:bg-white transition-colors">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900 tracking-tight">{caso.numeroCaso}</div>
                        <div className="text-xs text-gray-500 max-w-50 truncate" title={caso.titulo}>{caso.titulo}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-sm font-medium text-gray-800">
                      {caso.nombreCliente} <span className="text-gray-400 font-normal mx-1">vs</span> {caso.parteContraria}
                    </div>
                    <div className="text-xs text-gray-500 truncate max-w-62.5">{caso.juzgado}</div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                      {caso.materia}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border border-transparent ${getEstadoDesign(caso.estado)}`}>
                      {caso.estado?.replace(/_/g, " ") || "Desconocido"}
                    </span>
                  </td>
                  {perfilActual?.rol !== "cliente" && (
                    <td className="py-4 px-6 text-right">
                      <Link href={`/dashboard/casos/${caso.id}`}>
                        <button className="text-sm font-medium text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-md hover:bg-blue-50 transition-colors">
                          Revisar
                        </button>
                      </Link>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear Expediente */}
      {mostrarModal && (
        <ModalCrearExpediente
          listaClientes={listaClientes}
          listaAbogados={listaAbogados}
          juzgadosDB={juzgadosDB}
          materiasDB={materiasDB}
          perfilActual={perfilActual}
          isSubmitting={guardando}
          onClose={() => setMostrarModal(false)}
          onSubmit={handleGuardarExpediente}
        />
      )}

      {/* Toasts */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
