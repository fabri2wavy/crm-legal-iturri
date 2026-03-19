"use client";

import { createClient } from '../infrastructure/supabase/client';

export default function Home() {
  
  // Esta es la función que se ejecutará al hacer clic
  const probarSupabase = async () => {
    // 1. Llamamos a tu puente de conexión
    const supabase = createClient();
    
    // 2. Intentamos leer la tabla "perfiles" que creaste hace un rato
    const { data, error } = await supabase.from('perfiles').select('*').limit(1);

    // 3. Mostramos el resultado en una alerta en el navegador
    if (error) {
      alert("Error de conexión: " + error.message);
      console.error(error);
    } else {
      alert("¡Conexión exitosa a Supabase Local! Base de datos lista.");
      console.log("Datos recibidos:", data);
    }
  };

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center p-6"
      style={{
        background: "var(--color-navy)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Orbes decorativos de fondo */}
      <div
        style={{
          position: "absolute",
          top: "-200px",
          right: "-200px",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-150px",
          left: "-150px",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(201,168,76,0.05) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        className="w-full max-w-md text-center animate-card-in relative"
        style={{
          background: "var(--color-navy-card)",
          border: "1px solid var(--color-navy-border)",
          borderRadius: "var(--radius-lg)",
          padding: "2.5rem 2rem",
          boxShadow: "0 40px 80px rgba(0,0,0,0.4), 0 0 120px rgba(201,168,76,0.04)",
        }}
      >
        {/* Acento dorado superior */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "10%",
            right: "10%",
            height: "1px",
            background: "linear-gradient(90deg, transparent, var(--color-gold), transparent)",
          }}
        />

        {/* Emblema */}
        <div
          className="mx-auto mb-4 flex items-center justify-center w-14 h-14 rounded-full"
          style={{
            background: "var(--color-gold-dim)",
            border: "1px solid var(--color-gold-light)",
            color: "var(--color-gold-light)",
            fontFamily: "var(--font-brand)",
            fontSize: "1.2rem",
            fontWeight: 300,
            letterSpacing: "0.05em",
          }}
        >
          I&A
        </div>

        <h1
          className="text-2xl font-bold mb-2"
          style={{
            color: "var(--color-text-on-dark)",
            fontFamily: "var(--font-brand)",
          }}
        >
          CRM Legal — Iturri <span style={{ color: "var(--color-gold)" }}>&</span> Asociados
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
          El sistema está conectado y listo para el Laboratorio 1.
        </p>
        
        {/* Aquí conectamos el botón con la función */}
        <button 
          onClick={probarSupabase}
          className="px-6 py-3 rounded-md text-sm font-semibold uppercase tracking-wider transition-all duration-250 cursor-pointer"
          style={{
            background: "linear-gradient(135deg, #b8922e, var(--color-gold), #c9a84c)",
            color: "var(--color-navy)",
            boxShadow: "0 4px 20px rgba(201, 168, 76, 0.25)",
            border: "none",
            letterSpacing: "0.12em",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "0 6px 28px rgba(201, 168, 76, 0.4)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "0 4px 20px rgba(201, 168, 76, 0.25)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          Probar Conexión
        </button>
      </div>
    </main>
  );
}