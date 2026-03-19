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
      className="w-full flex items-center gap-2.5 text-left px-4 py-2.5 text-sm rounded-lg transition-all duration-200"
      style={{
        color: "rgba(200, 210, 225, 0.6)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
        e.currentTarget.style.color = "#fca5a5";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = "rgba(200, 210, 225, 0.6)";
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      Cerrar Sesión
    </button>
  );
}