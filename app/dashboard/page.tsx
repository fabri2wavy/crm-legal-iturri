"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { obtenerPerfilActual, UsuarioPerfil } from "@/infrastructure/repositories/usuarioRepository";
import AdminDashboard from "./views/AdminDashboard";
import AbogadoDashboard from "./views/AbogadoDashboard";
import ClienteDashboard from "./views/ClienteDashboard";

export default function DashboardInicio() {
  const router = useRouter();
  const [perfil, setPerfil] = useState<UsuarioPerfil | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function verificarSesion() {
      const data = await obtenerPerfilActual();
      
      if (!data) {
        // Redirigir a login si no hay usuario o perfil
        router.push("/login");
        return;
      }

      setPerfil(data);
      setCargando(false);
    }
    
    verificarSesion();
  }, [router]);

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-transparent border-[var(--color-primary)]"></div>
        <p className="mt-4 text-[var(--color-text-muted)]">Verificando credenciales...</p>
      </div>
    );
  }

  // Renderizado Condicional Basado en Roles
  switch (perfil?.rol) {
    case 'admin':
      return <AdminDashboard nombre={perfil.nombre_completo} />;
    case 'abogado':
      return <AbogadoDashboard nombre={perfil.nombre_completo} />;
    case 'cliente':
      return <ClienteDashboard nombre={perfil.nombre_completo} />;
    default:
      // Si no tiene rol definido o tiene un rol extraño, asumimos interfaz de cliente por seguridad
      return <ClienteDashboard nombre={perfil?.nombre_completo || "Usuario"} />;
  }
}