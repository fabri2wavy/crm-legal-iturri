"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../infrastructure/supabase/client";

import { AuthCard } from "../../components/ui/AuthCard";
import { FormField } from "../../components/ui/FormField";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import styles from "./page.module.css";

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

  const isError = mensaje.toLowerCase().includes("error");

  return (
    <AuthCard>
      <Alert
        variant={isError ? "error" : "success"}
        visible={!!mensaje}
      >
        {mensaje}
      </Alert>

      <form onSubmit={handleLogin} className={styles.form}>
        <FormField
          label="Correo Electrónico"
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="admin@iturri.com"
        />

        <FormField
          label="Contraseña"
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="••••••••"
        />

        <div className={styles.buttonGroup}>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
          >
            {loading ? "Procesando…" : "Iniciar Sesión"}
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="lg"
            fullWidth
            disabled={loading}
            onClick={handleRegistro}
          >
            Crear Usuario (Dev)
          </Button>
        </div>
      </form>
    </AuthCard>
  );
}