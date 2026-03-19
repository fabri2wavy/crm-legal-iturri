"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; 
import { createClient } from "../../infrastructure/supabase/client";
import styles from "./LoginPage.module.css";

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

  const isSuccess = mensaje && !mensaje.toLowerCase().includes("error");

  return (
    <main className={styles.root}>
      {/* Ornamentos decorativos de esquina */}
      <div className={`${styles.ornament} ${styles.ornamentTl}`} />
      <div className={`${styles.ornament} ${styles.ornamentBr}`} />

      <div className={styles.card}>
        {/* Acento dorado superior */}
        <div className={styles.cardAccent} />

        {/* Cabecera de marca */}
        <div className={styles.header}>
          <div className={styles.emblem}>I&A</div>
          <h1 className={styles.firmName}>
            Iturri <span>&</span> Asociados
          </h1>
          <p className={styles.tagline}>Sistema de Gestión Legal</p>
        </div>

        {/* Divider decorativo */}
        <div className={styles.divider}>
          <span className={styles.dividerDot} />
        </div>

        {/* Mensaje de alerta */}
        {mensaje && (
          <div
            className={`${styles.alert} ${
              isSuccess ? styles.alertSuccess : styles.alertError
            }`}
          >
            {mensaje}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleLogin}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Correo Electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.input}
              placeholder="admin@iturri.com"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.input}
              placeholder="••••••••"
            />
          </div>

          <div className={styles.btnGroup}>
            <button
              type="submit"
              disabled={loading}
              className={`${styles.btn} ${styles.btnPrimary}`}
            >
              {loading ? (
                <>
                  <span className={styles.spinner} />
                  Procesando…
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </button>

            <button
              type="button"
              onClick={handleRegistro}
              disabled={loading}
              className={`${styles.btn} ${styles.btnSecondary}`}
            >
              Crear Usuario (Dev)
            </button>
          </div>
        </form>

        {/* Footer */}
        <p className={styles.footer}>
          Abogatech &copy; {new Date().getFullYear()}
        </p>
      </div>
    </main>
  );
}