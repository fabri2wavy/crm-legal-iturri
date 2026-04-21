"use client";

import React, { useEffect, useState } from "react";
import { Briefcase, Users, Calendar } from "lucide-react";
import { obtenerTotalClientes } from "@/infrastructure/repositories/clienteRepository";
import { obtenerTotalExpedientes } from "@/infrastructure/repositories/expedienteRepository";

interface AdminDashboardProps {
  nombre: string;
}

export default function AdminDashboard({ nombre }: AdminDashboardProps) {
  const [totalCasos, setTotalCasos] = useState<number | null>(null);
  const [totalClientes, setTotalClientes] = useState<number | null>(null);
  const totalAudiencias = 0; // TODO: Conectar a tabla audiencias futura

  const today = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    async function cargarMetricas() {
      // Cargamos ambas en paralelo para mayor velocidad
      const [casos, clientes] = await Promise.all([
        obtenerTotalExpedientes(),
        obtenerTotalClientes()
      ]);
      setTotalCasos(casos);
      setTotalClientes(clientes);
    }
    cargarMetricas();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Banner Administrador */}
      <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-900 p-5 rounded-r-xl shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div>
            <h2 className="font-bold text-lg leading-tight">Modo Administrador</h2>
            <p className="text-sm opacity-80 mt-0.5">Acceso total al sistema</p>
          </div>
        </div>
      </div>

      {/* Sección de Bienvenida Minimalista */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Bienvenido, {nombre}
        </h1>
        <p className="text-gray-500 mt-1 capitalize">
          {today}
        </p>
      </div>

      {/* Tarjetas de Métricas Corporativas Minimalistas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Casos Activos */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 flex flex-col justify-center transition-shadow hover:shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-gray-50 rounded-lg">
              <Briefcase className="w-5 h-5 text-gray-500" strokeWidth={1.5} />
            </div>
            <h3 className="text-sm font-medium text-gray-500 tracking-wide">
              Casos Activos
            </h3>
          </div>
          <p className="text-4xl font-bold text-gray-900">
            {totalCasos === null ? (
              <span className="text-gray-300 animate-pulse block h-10 w-16 bg-gray-100 rounded"></span>
            ) : totalCasos}
          </p>
        </div>

        {/* Clientes Registrados */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 flex flex-col justify-center transition-shadow hover:shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-gray-50 rounded-lg">
              <Users className="w-5 h-5 text-gray-500" strokeWidth={1.5} />
            </div>
            <h3 className="text-sm font-medium text-gray-500 tracking-wide">
              Clientes Registrados
            </h3>
          </div>
          <p className="text-4xl font-bold text-gray-900">
            {totalClientes === null ? (
              <span className="text-gray-300 animate-pulse block h-10 w-16 bg-gray-100 rounded"></span>
            ) : totalClientes}
          </p>
        </div>

        {/* Audiencias Próximas */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 flex flex-col justify-center transition-shadow hover:shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-gray-50 rounded-lg">
              <Calendar className="w-5 h-5 text-gray-500" strokeWidth={1.5} />
            </div>
            <h3 className="text-sm font-medium text-gray-500 tracking-wide">
              Audiencias Próximas
            </h3>
          </div>
          <p className="text-4xl font-bold text-gray-900">
            {totalAudiencias}
          </p>
        </div>
      </div>
    </div>
  );
}
