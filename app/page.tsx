"use client";

import { createClient } from '../utils/supabase/client';

export default function Home() {
  
  // Esta es la función que se ejecutará al hacer clic
  const probarSupabase = async () => {
    // 1. Llamamos a tu puente de conexión
    const supabase = createClient();
    
    // 2. Intentamos leer la tabla "perfiles" que creaste hace un rato
    const { data, error } = await supabase.from('perfiles').select('*').limit(1);

    // 3. Mostramos el resultado en una alerta en el navegador
    if (error) {
      alert("❌ Error de conexión: " + error.message);
      console.error(error);
    } else {
      alert("✅ ¡Conexión exitosa a Supabase Local! Base de datos lista.");
      console.log("Datos recibidos:", data);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-24">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">
          CRM Legal - Iturri & Asociados
        </h1>
        <p className="text-slate-600 mb-6">
          El sistema está conectado y listo para el Laboratorio 1.
        </p>
        
        {/* Aquí conectamos el botón con la función */}
        <button 
          onClick={probarSupabase}
          className="bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-800 transition-colors"
        >
          Probar Conexión
        </button>
      </div>
    </main>
  );
}