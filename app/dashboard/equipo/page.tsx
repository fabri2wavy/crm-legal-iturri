"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { obtenerPerfilActual } from "../../../infrastructure/repositories/usuarioRepository";
import { Button } from "../../../components/ui/Button";

export default function EquipoPage() {
  const router = useRouter();
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    async function verificarAcceso() {
      const perfil = await obtenerPerfilActual();
      if (!perfil || perfil.rol !== 'admin') {
        router.push("/dashboard");
        return;
      }
      setVerificando(false);
    }
    
    verificarAcceso();
  }, [router]);

  if (verificando) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
        <p className="mt-4 text-[var(--color-text-muted)]">Verificando permisos...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--color-text-primary)" }}>
            Gestión de Equipo Legal
          </h1>
          <p className="text-[var(--color-text-muted)] mt-1">
            Administra los abogados de la firma.
          </p>
        </div>
        <Button variant="primary" disabled>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nuevo Abogado
        </Button>
      </div>

      {/* Placeholder container */}
      <div className="p-16 text-center rounded-2xl border-2 border-dashed border-[var(--color-border-subtle)] bg-[var(--color-surface-card)]">
        <svg className="mx-auto mb-4" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">Aquí aparecerá la lista de abogados del bufete</h3>
        <p className="text-[var(--color-text-secondary)]">
          Pronto podrás añadir, editar y asignar casos a los miembros de tu equipo.
        </p>
      </div>
    </div>
  );
}
