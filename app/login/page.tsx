"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; 
import { createClient } from "../../infrastructure/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const router = useRouter(); 

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
      setMensaje("Error al iniciar sesión: " + error.message);
      setLoading(false);
    } else {
      setMensaje("¡Login exitoso! Entrando al sistema...");
      router.push("/dashboard"); 
    }
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
      setMensaje("¡Usuario creado en auth y perfiles!");
    }
    setLoading(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-slate-200">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Iturri & Asociados</h1>
          <p className="text-sm text-slate-500 mt-2">Acceso al Sistema de Gestión Legal</p>
        </div>

        {mensaje && (
          <div className={`p-3 mb-6 text-sm rounded-md ${mensaje.includes(' ') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {mensaje}
          </div>
        )}

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

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-900 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-800 transition-colors disabled:bg-slate-400"
            >
              {loading ? "Procesando..." : "Iniciar Sesión"}
            </button>
            
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