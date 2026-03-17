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

    setResultado(`Cliente creado con ID: ${nuevo.id}. ⏳ 2. Obteniendo lista...`);
    const lista = await obtenerClientes();
    
    if (lista.length > 0) {
      setResultado(`✅ ¡Éxito total! Hay ${lista.length} cliente(s) en la base de datos.`);
      console.log("Datos de los clientes en BD:", lista);
    }
  };

  return (
    <div className="mt-8 p-6 bg-slate-200 rounded-xl border-2 border-dashed border-slate-400">
      <h3 className="text-lg font-bold text-slate-700 mb-2">Laboratorio de Pruebas (Borrar después)</h3>
      <button 
        onClick={ejecutarPrueba}
        className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 transition-colors"
      >
        Ejecutar Prueba de Repositorio
      </button>
      <p className="mt-3 text-sm font-mono text-slate-800 font-semibold">{resultado}</p>
    </div>
  );
}