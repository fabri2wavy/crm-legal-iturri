"use client";

import { useState } from "react";
import { createClient } from "../../utils/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMensaje("❌ Error al iniciar sesión: " + error.message);
    } else {
      setMensaje("✅ ¡Login exitoso! Entrando al sistema...");
    }
    setLoading(false);
  };

  const handleRegistro = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    setMensaje("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMensaje("Error al registrar: " + error.message);
    } else {
      setMensaje("¡Usuario creado! Revisa tu Supabase Studio local.");
    }
    setLoading(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-slate-200">
        
        {/* Cabecera del Formulario */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Iturri & Asociados</h1>
          <p className="text-sm text-slate-500 mt-2">Acceso al Sistema de Gestión Legal</p>
        </div>

        {/* Mensajes de Alerta */}
        {mensaje && (
          <div className={`p-3 mb-6 text-sm rounded-md ${mensaje.includes('Bien') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {mensaje}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 outline-none transition-all"
              placeholder="admin@iturri.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          {/* Botones */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-900 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-800 transition-colors disabled:bg-slate-400"
            >
              {loading ? "Procesando..." : "Iniciar Sesión"}
            </button>
            
            {/* Botón temporal de registro para ti como desarrollador */}
            <button
              type="button"
              onClick={handleRegistro}
              disabled={loading}
              className="w-full mt-3 bg-white text-blue-900 border border-blue-900 font-semibold py-2.5 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Crear Usuario (Dev)
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}