"use client";

import { useState } from "react";
import { crearCliente, obtenerClientes } from "../infrastructure/repositories/clienteRepository";

export default function TestBaseDatos() {
  const [resultado, setResultado] = useState<string>("Esperando prueba...");

  const ejecutarPrueba = async () => {
    setResultado("1. Intentando crear cliente");
    const nuevo = await crearCliente({
      nombreCompleto: "Juan Pérez (Prueba Técnica)",
      carnetIdentidad: `1234567-${Math.floor(Math.random() * 1000)}`, 
      telefono: "77712345",
      email: "juan.prueba@email.com"
    });

    if (!nuevo) {
      setResultado("Error al crear. Revisa la consola (F12).");
      return;
    }

    setResultado(`Cliente creado con ID: ${nuevo.id}.2. Obteniendo lista...`);
    const lista = await obtenerClientes();
    
    if (lista.length > 0) {
      setResultado(`¡Éxito total! Hay ${lista.length} cliente(s) en la base de datos.`);
      console.log("Datos de los clientes en BD:", lista);
    }
  };

  return (
    <div
      className="mt-8 p-6 rounded-xl animate-fade-up"
      style={{
        background: "var(--color-surface-card)",
        border: "1px solid var(--color-surface-border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 3h6M12 3v7l5.5 8.5a1 1 0 0 1-.9 1.5H7.4a1 1 0 0 1-.9-1.5L12 10V3" />
        </svg>
        <h3
          className="text-base font-bold"
          style={{ color: "var(--color-text-primary)" }}
        >
          Laboratorio de Pruebas (Borrar después)
        </h3>
      </div>
      <button 
        onClick={ejecutarPrueba}
        className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
        style={{
          background: "var(--color-success)",
          color: "#ffffff",
          boxShadow: "0 2px 8px rgba(16, 185, 129, 0.25)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = "0 4px 14px rgba(16, 185, 129, 0.35)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 2px 8px rgba(16, 185, 129, 0.25)";
        }}
      >
        Ejecutar Prueba de Repositorio
      </button>
      <p
        className="mt-3 text-sm font-mono font-semibold"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {resultado}
      </p>
    </div>
  );
}