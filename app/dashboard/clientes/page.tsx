"use client";

import { useEffect, useState } from "react";
import { Cliente } from "../../../domain/entities/Cliente";
import { obtenerClientes, crearCliente } from "../../../infrastructure/repositories/clienteRepository";

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(true);
  
  // Estados para el Modal y el Formulario
  const [mostrarModal, setMostrarModal] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [formData, setFormData] = useState({
    nombreCompleto: "",
    carnetIdentidad: "",
    telefono: "",
    email: ""
  });

  useEffect(() => {
    async function cargarDatos() {
      const data = await obtenerClientes();
      setClientes(data);
      setCargando(false);
    }
    cargarDatos();
  }, []);

  // Función que se ejecuta al darle "Guardar"
  const handleGuardarCliente = async (e: React.FormEvent) => {
    e.preventDefault(); // Evita que la página se recargue
    setGuardando(true);

    const nuevo = await crearCliente(formData);

    if (nuevo) {
      // Si se creó con éxito, lo agregamos a la tabla visualmente al instante
      setClientes([nuevo, ...clientes]);
      // Limpiamos el formulario y cerramos el modal
      setFormData({ nombreCompleto: "", carnetIdentidad: "", telefono: "", email: "" });
      setMostrarModal(false);
    } else {
      alert("Error: Hubo un error. Es posible que este Carnet de Identidad ya esté registrado.");
    }
    
    setGuardando(false);
  };

  return (
    <div className="max-w-6xl mx-auto relative">
      
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 animate-fade-up">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            Directorio de Clientes
          </h1>
          <p className="mt-1" style={{ color: "var(--color-text-secondary)" }}>
            Gestión de personas registradas en la firma.
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
          Nuevo Cliente
        </button>
      </div>

      {/* Tabla */}
      <div
        className="rounded-xl overflow-hidden animate-fade-up"
        style={{
          background: "var(--color-surface-card)",
          border: "1px solid var(--color-surface-border)",
          boxShadow: "var(--shadow-sm)",
          animationDelay: "100ms",
        }}
      >
        {/* Vista desktop: tabla clásica */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr
                style={{
                  background: "var(--color-navy)",
                  borderBottom: "1px solid var(--color-navy-border)",
                }}
              >
                <th className="py-3.5 px-6 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-gold-light)" }}>Nombre Completo</th>
                <th className="py-3.5 px-6 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-gold-light)" }}>CI / DNI</th>
                <th className="py-3.5 px-6 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-gold-light)" }}>Contacto</th>
                <th className="py-3.5 px-6 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-gold-light)" }}>Fecha Registro</th>
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
                      <span style={{ color: "var(--color-text-muted)" }}>Cargando directorio...</span>
                    </div>
                  </td>
                </tr>
              )}
              {!cargando && clientes.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="mb-3 opacity-50">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </div>
                    <p className="font-medium" style={{ color: "var(--color-text-secondary)" }}>
                      No hay clientes registrados
                    </p>
                    <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
                      Registra tu primer cliente usando el botón de arriba.
                    </p>
                  </td>
                </tr>
              )}

              {!cargando && clientes.map((cliente) => (
                <tr
                  key={cliente.id}
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
                    <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>
                      {cliente.nombreCompleto}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className="inline-block px-2.5 py-1 rounded-md text-xs font-mono font-medium"
                      style={{
                        background: "var(--color-surface-hover)",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      {cliente.carnetIdentidad}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-sm" style={{ color: "var(--color-text-primary)" }}>
                      {cliente.telefono || "Sin teléfono"}
                    </div>
                    <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {cliente.email || "Sin correo"}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    {cliente.fechaRegistro.toLocaleDateString('es-ES')}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      className="text-sm font-medium px-3 py-1.5 rounded-md transition-all duration-200"
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
                      Ver Detalles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Vista mobile: cards apiladas */}
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
          {!cargando && clientes.length === 0 && (
            <div className="py-12 text-center">
              <div className="mb-2 opacity-50">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <p className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
                No hay clientes registrados
              </p>
            </div>
          )}
          {!cargando && clientes.map((cliente) => (
            <div
              key={cliente.id}
              className="p-4 space-y-2"
              style={{ borderColor: "var(--color-surface-border)" }}
            >
              <div className="flex justify-between items-start">
                <span className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>
                  {cliente.nombreCompleto}
                </span>
                <span
                  className="text-xs font-mono px-2 py-0.5 rounded"
                  style={{ background: "var(--color-surface-hover)", color: "var(--color-text-muted)" }}
                >
                  {cliente.carnetIdentidad}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    {cliente.telefono || "Sin teléfono"} · {cliente.email || "Sin correo"}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                    {cliente.fechaRegistro.toLocaleDateString('es-ES')}
                  </div>
                </div>
                <button
                  className="text-xs font-medium px-3 py-1.5 rounded-md"
                  style={{ color: "var(--color-gold)", background: "var(--color-gold-dim)" }}
                >
                  Ver
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL EMERGENTE PARA NUEVO CLIENTE */}
      {mostrarModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{
            background: "rgba(13, 27, 42, 0.7)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div
            className="w-full max-w-md overflow-hidden animate-card-in"
            style={{
              background: "var(--color-surface-card)",
              borderRadius: "var(--radius-xl)",
              boxShadow: "var(--shadow-lg)",
              border: "1px solid var(--color-surface-border)",
            }}
          >
            {/* Header del modal */}
            <div
              className="px-6 py-4 flex justify-between items-center"
              style={{
                background: "var(--color-navy)",
                borderBottom: "1px solid var(--color-navy-border)",
              }}
            >
              <h3 className="text-base font-bold" style={{ color: "var(--color-text-on-dark)" }}>
                Registrar Nuevo Cliente
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
            
            <form onSubmit={handleGuardarCliente} className="p-6 space-y-4">
              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Nombre Completo *
                </label>
                <input 
                  type="text" required 
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all duration-200"
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
                  value={formData.nombreCompleto}
                  onChange={(e) => setFormData({...formData, nombreCompleto: e.target.value})}
                />
              </div>
              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Carnet de Identidad *
                </label>
                <input 
                  type="text" required 
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all duration-200"
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
                  value={formData.carnetIdentidad}
                  onChange={(e) => setFormData({...formData, carnetIdentidad: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Teléfono
                  </label>
                  <input 
                    type="text" 
                    className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all duration-200"
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
                    value={formData.telefono}
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Email
                  </label>
                  <input 
                    type="email" 
                    className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all duration-200"
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
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
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
                  {guardando ? "Guardando..." : "Guardar Cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}