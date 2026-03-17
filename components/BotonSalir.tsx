"use client";

import { useRouter } from "next/navigation";
import { createClient } from "../infrastructure/supabase/client";

export default function BotonSalir() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
        router.refresh();
    
    router.push("/login");
  };

  return (
    <button 
      onClick={handleLogout}
      className="w-full text-left px-4 py-2 text-sm text-blue-200 hover:text-white hover:bg-blue-800 rounded-lg transition-colors"
    >
      Cerrar Sesión
    </button>
  );
}