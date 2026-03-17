"use client";

import { useEffect, useState } from "react";
import { createClient } from "../infrastructure/supabase/client";

export default function PerfilUsuario() {
  const [rol, setRol] = useState<string>("Cargando...");
  const [email, setEmail] = useState<string>("");
  const supabase = createClient();

  useEffect(() => {
    async function obtenerPerfil() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setEmail(user.email || "");
    
        const { data: perfil } = await supabase
          .from("perfiles")
          .select("rol")
          .eq("id", user.id)
          .single(); 
          
        if (perfil) {
          setRol(perfil.rol);
        } else {
          setRol("Sin rol asignado");
        }
      }
    }

    obtenerPerfil();
  }, []);

  return (
    <div className="mb-4 p-3 bg-blue-950 rounded-lg border border-blue-800">
      <p className="text-xs text-blue-300 truncate">{email}</p>
      <div className="flex items-center gap-2 mt-1">
        <span className="flex h-2 w-2 rounded-full bg-green-400"></span>
        <p className="text-sm font-semibold text-white capitalize">{rol}</p>
      </div>
    </div>
  );
}