"use client";

import React from "react";

interface AbogadoDashboardProps {
  nombre: string;
}

export default function AbogadoDashboard({ nombre }: AbogadoDashboardProps) {
  const today = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Banner Abogado */}
      <div className="bg-red-100 border-l-4 border-red-500 text-red-800 p-4 rounded-r-lg shadow-sm flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          <div>
            <h2 className="font-bold text-lg">Modo Abogado</h2>
            <p className="text-sm opacity-90">Gestión de expedientes asignados</p>
          </div>
        </div>
      </div>

      <div className="mb-8 animate-fade-up">
        <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>
          Bienvenido, Dr/a. {nombre}
        </h1>
        <p className="text-sm mt-1 capitalize" style={{ color: "var(--color-text-muted)" }}>
          {today}
        </p>
      </div>

      <div className="p-12 text-center rounded-xl border-2 border-dashed border-[var(--color-border-subtle)] bg-[var(--color-surface-card)]">
        <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">Aquí irán tus casos asignados</h3>
        <p className="text-[var(--color-text-secondary)]">Próximamente podrás visualizar y gestionar los expedientes a tu cargo.</p>
      </div>
    </div>
  );
}
