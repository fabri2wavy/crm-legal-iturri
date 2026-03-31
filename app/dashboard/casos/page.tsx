"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { FolderOpen, Plus, Search, Filter, ShieldAlert, FileText, CheckCircle2, Archive, Hash, Gavel, FileSignature } from "lucide-react";
import { obtenerExpedientes, crearExpediente } from "../../../infrastructure/repositories/expedienteRepository";
import { obtenerClientes } from "../../../infrastructure/repositories/clienteRepository";
import { obtenerAbogados } from "../../../infrastructure/repositories/usuarioRepository";
import { Button } from "../../../components/ui/Button";
import { FormField } from "../../../components/ui/FormField";
import { SelectField } from "../../../components/ui/SelectField";
import { Alert } from "../../../components/ui/Alert";

/* ── FLUJO LEGAL (MÉTODO ALDIA) ──────────────────────────────── */
const FLUJO_LEGAL: Record<string, string[]> = {
  "Civil": ["Etapa preliminar", "Conciliación", "Demanda presentada", "En etapa probatoria", "Con sentencia", "En apelación", "En ejecución", "Concluido", "Archivado"],
  "Penal": ["Estudio del caso", "Denuncia presentada", "En investigación", "Imputación formal", "En juicio", "Con sentencia", "En apelación", "En ejecución", "Concluido", "Archivado"],
  "Familia": ["Estudio del caso", "Demanda presentada", "En conciliación", "En audiencia", "En etapa probatoria", "Con sentencia", "En ejecución", "Concluido", "Archivado"],
  "Laboral": ["Estudio del caso", "Demanda presentada", "En conciliación", "En audiencia", "Con sentencia", "En ejecución", "Concluido", "Archivado"],
  "Administrativo": ["Estudio del caso", "Trámite presentado", "En revisión", "En observación", "En aprobación", "En firma", "Aprobado", "Rechazado", "Concluido"],
  "Comercial": ["Estudio del caso", "Demanda presentada", "En conciliación", "En audiencia", "Con sentencia", "En ejecución", "Concluido", "Archivado"],
  "Otro": [] // Habilita inputs manuales
};

const MATERIAS_BASE = Object.keys(FLUJO_LEGAL);

/* ── ESTILOS DE ESTADO GLOBALES ────────────────────────────── */
function getEstadoDesign(estado: string | undefined | null) {
  if (!estado) return "bg-gray-100 text-gray-800";
  const st = estado.toLowerCase();
  if (st.includes("concluido") || st.includes("archivado") || st.includes("cerrado") || st.includes("aprobado")) {
    return "bg-gray-100 text-gray-600";
  }
  if (st.includes("juicio") || st.includes("denuncia") || st.includes("demanda") || st.includes("rechazado")) {
    return "bg-rose-50 text-rose-700";
  }
  if (st.includes("conciliación") || st.includes("estudio") || st.includes("preliminar") || st.includes("revisión") || st.includes("observación") || st.includes("espera")) {
    return "bg-amber-50 text-amber-700";
  }
  return "bg-blue-50 text-blue-700"; // execution, apelation, etc.
}

export default function CasosPage() {
  const [expedientes, setExpedientes] = useState<any[]>([]);
  const [listaClientes, setListaClientes] = useState<any[]>([]);
  const [listaAbogados, setListaAbogados] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorClientes, setErrorClientes] = useState(false);

  /* ── Estados de filtro ─────────────────────────────────────── */
  const [searchTerm, setSearchTerm] = useState("");
  const [materiaFilter, setMateriaFilter] = useState("");

  /* ── Estados para el Modal ──────────────────────────────────── */
  const [mostrarModal, setMostrarModal] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [formError, setFormError] = useState("");

  /* ── Estado del Formulario ──────────────────────────────────── */
  const [formData, setFormData] = useState({
    clienteId: "",
    abogado_id: "",
    numeroCaso: "",
    titulo: "",
    juzgado: "",
    parteContraria: "",
    informeDespacho: "Caso iniciado en plataforma corporativa.",
    informeCliente: "Su expediente ha sido ingresado al sistema de seguimiento legal.",
    
    // Control de flujo dependiente
    materiaSelect: "Civil",
    materiaManual: "",
    estadoSelect: FLUJO_LEGAL["Civil"][0],
    estadoManual: "",
  });

  /* ── Carga inicial ──────────────────────────────────────────── */
  useEffect(() => {
    async function cargarDatosIniciales() {
      const [dataCasos, dataClientes, dataAbogados] = await Promise.all([
        obtenerExpedientes(),
        obtenerClientes(),
        obtenerAbogados(),
      ]);
      setExpedientes(dataCasos);
      setListaAbogados(dataAbogados);

      // Guardamos los clientes y marcamos error si la lista llegó vacía
      // para informar al usuario en el selector en lugar de mostrar un desplegable silencioso
      if (dataClientes.length === 0) {
        setErrorClientes(true);
      }
      setListaClientes(dataClientes);
      setCargando(false);
    }
    cargarDatosIniciales();
  }, []);

  /* ── Handlers de Flujo Legal (UI Lógica) ───────────────────── */
  const handleMateriaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevaMateria = e.target.value;
    const isOtro = nuevaMateria === "Otro";
    
    setFormData((prev) => ({
      ...prev,
      materiaSelect: nuevaMateria,
      estadoSelect: isOtro ? "Manual" : (FLUJO_LEGAL[nuevaMateria]?.[0] || ""),
      materiaManual: isOtro ? prev.materiaManual : "",
      estadoManual: isOtro ? prev.estadoManual : ""
    }));
  };

  /* ── Filtrado dinámico ──────────────────────────────────────── */
  const expedientesFiltrados = useMemo(() => {
    return expedientes.filter((caso) => {
      if (materiaFilter && caso.materia !== materiaFilter) return false;

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
  }, [expedientes, searchTerm, materiaFilter]);

  /* ── Guardar nuevo caso ─────────────────────────────────────── */
  const handleGuardarCaso = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.clienteId) {
      setFormError("Debe seleccionar un cliente del directorio corporativo.");
      return;
    }
    if (!formData.abogado_id) {
      setFormError("Se requiere asignar un abogado patrocinante.");
      return;
    }

    // Resolviendo Valores Dependientes
    const esOtro = formData.materiaSelect === "Otro";
    const materiaFinal = esOtro ? formData.materiaManual : formData.materiaSelect;
    const estadoFinal = esOtro ? formData.estadoManual : formData.estadoSelect;

    if (esOtro && (!materiaFinal.trim() || !estadoFinal.trim())) {
      setFormError("Debe especificar la materia y el estado procesal manualmente.");
      return;
    }

    setFormError("");
    setGuardando(true);

    const dataAInsertar = {
      clienteId: formData.clienteId,
      abogado_id: formData.abogado_id,
      numeroCaso: formData.numeroCaso,
      titulo: formData.titulo,
      materia: materiaFinal,
      juzgado: formData.juzgado,
      parteContraria: formData.parteContraria,
      informeDespacho: formData.informeDespacho,
      informeCliente: formData.informeCliente,
      // Nota: En Supabase, para que esto funcione sin fallar, `estado` o debe ser string libre 
      // y si hay un type/enum forzado en TS, lo puenteamos como se definio en el Omit<> 
      // Para enviar el estado inicial personalizado, en expedientes.insert({ estado: estadoFinal }) 
      // Por compatibilidad de la base de datos `estado` se enviaba nulo en UI previa y asume 'en_espera' en default DB
      // Si la DB lo permite:
      estadoInicial: estadoFinal // (Solo de referencia visual si la bd lo inyecta luego, este sistema pasará este valor si la DB lo recibe directamente).
    };

    // Al llamar a crearExpediente, lo enviaremos adaptado a nuestro DTO (Omitimos estado por DTO type limitation actual, pero el sistema base lo adaptará si el schema update lo soporta).
    const nuevo = await crearExpediente(dataAInsertar as any);

    if (nuevo) {
      const dataActualizada = await obtenerExpedientes();
      setExpedientes(dataActualizada);

      // Reiniciar Modal
      setFormData({
        ...formData,
        numeroCaso: "",
        titulo: "",
        juzgado: "",
        parteContraria: "",
        materiaSelect: "Civil",
        materiaManual: "",
        estadoSelect: FLUJO_LEGAL["Civil"][0],
        estadoManual: "",
      });
      setMostrarModal(false);
    } else {
      setFormError("Error al registrar expediente. Fallo de conexión o integridad de datos.");
    }

    setGuardando(false);
  };

  /* ── Funciones de Cierre ────────────────────────────────────── */
  const handleCerrarModal = () => {
    setFormError("");
    setMostrarModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* ── Cabecera ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Expedientes</h1>
          <p className="mt-1 text-sm text-gray-500">Gestión de causas legales y flujo procesal.</p>
        </div>
        <Button variant="primary" onClick={() => setMostrarModal(true)}>
          <Plus className="w-5 h-5 mr-2" />
          Nuevo Expediente
        </Button>
      </div>

      {/* ── Barra de Filtros Minimalista ──────────────────────── */}
      <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por NUREJ, Título, Partes..."
            className="w-full pl-10 pr-4 py-2 text-sm text-gray-900 bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative min-w-[220px]">
          <Filter className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <select
            className="w-full pl-10 pr-8 py-2 text-sm text-gray-700 bg-gray-50 border border-transparent rounded-lg appearance-none cursor-pointer focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors outline-none"
            value={materiaFilter}
            onChange={(e) => setMateriaFilter(e.target.value)}
          >
            <option value="">Todas las materias</option>
            {MATERIAS_BASE.filter(m => m !== "Otro").map(mat => (
              <option key={mat} value={mat}>{mat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Tabla de Expedientes ───────────────────────────────── */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200">
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-widest">Identificador</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-widest">Partes y Juzgado</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-widest">Materia</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-widest">Estado (Flujo Legal)</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-widest text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              
              {cargando && (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400" />
                      <p className="text-gray-500 text-sm">Cargando base de datos legal...</p>
                    </div>
                  </td>
                </tr>
              )}

              {!cargando && expedientesFiltrados.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
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
                        <div className="text-xs text-gray-500 max-w-[200px] truncate" title={caso.titulo}>{caso.titulo}</div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="py-4 px-6">
                    <div className="text-sm font-medium text-gray-800">{caso.nombreCliente} <span className="text-gray-400 font-normal mx-1">vs</span> {caso.parteContraria}</div>
                    <div className="text-xs text-gray-500 truncate max-w-[250px]">{caso.juzgado}</div>
                  </td>

                  <td className="py-4 px-6">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                      {caso.materia}
                    </span>
                  </td>

                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border border-transparent ${getEstadoDesign(caso.estado)}`}>
                      {caso.estado?.replace(/_/g, " ") || 'Desconocido'}
                    </span>
                  </td>

                  <td className="py-4 px-6 text-right">
                    <Link href={`/dashboard/casos/${caso.id}`}>
                      <button className="text-sm font-medium text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-md hover:bg-blue-50 transition-colors">
                        Revisar
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL: NUEVO EXPEDIENTE ──────────────────────────── */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-200 flex flex-col max-h-[90vh]">
            
            <div className="px-8 py-5 flex items-center justify-between border-b border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <FileSignature className="w-6 h-6 text-blue-600" />
                Apertura de Expediente
              </h3>
              <button 
                onClick={handleCerrarModal} 
                className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>

            <div className="px-8 py-6 overflow-y-auto">
              <form id="expediente-form" onSubmit={handleGuardarCaso} className="space-y-8">
                
                {formError && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex gap-3 text-red-800 text-base font-medium">
                    <ShieldAlert className="w-6 h-6 flex-shrink-0" />
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* COMBO: Identidad y Partes */}
                  <div className="space-y-6">
                    <h4 className="text-sm font-extrabold text-gray-900 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2">
                       Sujetos
                    </h4>
                    <div className="space-y-2">
                      <label className="text-base font-semibold text-gray-900 block">Cliente Patrocinado *</label>
                      {errorClientes ? (
                        <div className="w-full text-base px-4 py-3 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 font-medium flex items-center gap-2">
                          <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                          No hay clientes registrados. Crea uno primero.
                        </div>
                      ) : (
                        <select 
                          required
                          className="w-full text-base lg:text-lg px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50/50"
                          value={formData.clienteId}
                          onChange={(e) => setFormData({ ...formData, clienteId: e.target.value })}
                        >
                          <option value="" disabled>Seleccione un cliente...</option>
                          {listaClientes.map(cliente => (
                            <option key={cliente.id} value={cliente.id}>
                              {cliente.nombreCompleto}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-base font-semibold text-gray-900 block">Abogado Responsable *</label>
                      <select 
                        required
                        className="w-full text-base lg:text-lg px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50/50"
                        value={formData.abogado_id}
                        onChange={(e) => setFormData({ ...formData, abogado_id: e.target.value })}
                      >
                        <option value="" disabled>Ej. Lic. Jorge Pérez</option>
                        {listaAbogados.map(abogado => (
                          <option key={abogado.id} value={abogado.id}>
                            {abogado.nombre_completo}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-base font-semibold text-gray-900 block">Parte Contraria *</label>
                      <input 
                        required type="text" placeholder="Ej: ACME Corp."
                        className="w-full text-base lg:text-lg px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50/50 placeholder:text-gray-400"
                        value={formData.parteContraria}
                        onChange={(e) => setFormData({ ...formData, parteContraria: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* COMBO: Datos del Caso y Flujo Legal */}
                  <div className="space-y-6">
                    <h4 className="text-sm font-extrabold text-gray-900 uppercase tracking-widest mb-6 border-b border-gray-100 pb-2">
                      Clasificación Legal
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-base font-semibold text-gray-900 block">NUREJ / N° Caso *</label>
                        <div className="relative">
                          <Hash className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                          <input 
                            required type="text" placeholder="2024-..."
                            className="w-full pl-11 pr-4 py-3 text-base lg:text-lg rounded-xl border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50/50 placeholder:text-gray-400"
                            value={formData.numeroCaso}
                            onChange={(e) => setFormData({ ...formData, numeroCaso: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-base font-semibold text-gray-900 block">Juzgado *</label>
                        <div className="relative">
                          <Gavel className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                          <input 
                            required type="text" placeholder="Ej. 3ro Público"
                            className="w-full pl-11 pr-4 py-3 text-base lg:text-lg rounded-xl border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50/50 placeholder:text-gray-400"
                            value={formData.juzgado}
                            onChange={(e) => setFormData({ ...formData, juzgado: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-base font-semibold text-gray-900 block">Síntesis (Título) *</label>
                      <input 
                        required type="text" placeholder="Ej. Demanda por Divorcio..."
                        className="w-full text-base lg:text-lg px-4 py-3 rounded-xl border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50/50 placeholder:text-gray-400"
                        value={formData.titulo}
                        onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                      />
                    </div>

                    {/* SELECTS DINÁMICOS DEPENDIENTES */}
                    <div className="grid grid-cols-2 gap-4 p-5 bg-blue-50/40 rounded-2xl border border-blue-100 mt-4">
                       <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-800 uppercase tracking-wider block">Materia</label>
                        <select 
                          className="w-full text-base lg:text-lg px-3 py-2.5 bg-white rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-all"
                          value={formData.materiaSelect}
                          onChange={handleMateriaChange}
                        >
                          {MATERIAS_BASE.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-800 uppercase tracking-wider block">Estado Inicial</label>
                        {formData.materiaSelect !== "Otro" ? (
                          <select 
                            className="w-full text-base lg:text-lg px-3 py-2.5 bg-white rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-all"
                            value={formData.estadoSelect}
                            onChange={(e) => setFormData({ ...formData, estadoSelect: e.target.value })}
                          >
                            {(FLUJO_LEGAL[formData.materiaSelect] || []).map(est => (
                              <option key={est} value={est}>{est}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="h-[46px] flex items-center text-sm lg:text-base text-gray-500 italic px-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                            Definir manualmente
                          </div>
                        )}
                      </div>

                      {/* Manual Overrides si es "Otro" */}
                      {formData.materiaSelect === "Otro" && (
                        <>
                          <div className="col-span-1 mt-1">
                            <input 
                              type="text" required placeholder="Especifique materia..."
                              className="w-full text-base lg:text-lg px-3 py-2.5 bg-white rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-all placeholder:text-gray-400"
                              value={formData.materiaManual} onChange={(e) => setFormData({...formData, materiaManual: e.target.value})}
                            />
                          </div>
                          <div className="col-span-1 mt-1">
                            <input 
                              type="text" required placeholder="Especifique estado..."
                              className="w-full text-base lg:text-lg px-3 py-2.5 bg-white rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-all placeholder:text-gray-400"
                              value={formData.estadoManual} onChange={(e) => setFormData({...formData, estadoManual: e.target.value})}
                            />
                          </div>
                        </>
                      )}
                    </div>

                  </div>
                </div>
              </form>
            </div>

            <div className="px-8 py-5 border-t border-gray-200 bg-gray-50/80 flex justify-end gap-4 rounded-b-2xl">
              <button 
                type="button" 
                onClick={handleCerrarModal}
                className="px-6 py-3 text-base font-bold text-gray-700 bg-white border border-gray-300 rounded-xl shadow-sm hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-colors"
                disabled={guardando}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                form="expediente-form"
                className="px-8 py-3 text-base font-bold text-white bg-blue-600 border border-transparent rounded-xl shadow-md hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all flex items-center justify-center min-w-[160px]"
                disabled={guardando}
              >
                {guardando ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" strokeWidth={2.5} />
                    Registrar Expediente
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
