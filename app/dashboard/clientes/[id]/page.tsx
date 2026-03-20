"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Cliente } from "../../../../domain/entities/Cliente";
import { Expediente } from "../../../../domain/entities/Expediente";
import { 
  obtenerClientePorId, 
  obtenerExpedientesPorCliente, 
  actualizarCliente, 
  eliminarCliente 
} from "../../../../infrastructure/repositories/clienteRepository";
import { Button } from "../../../../components/ui/Button";
import { FormField } from "../../../../components/ui/FormField";
import { Alert } from "../../../../components/ui/Alert";

export default function DetalleClientePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  /* ── State ─────────────────────────────────────────────────── */
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [confirmarEliminacion, setConfirmarEliminacion] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const [formData, setFormData] = useState({
    nombreCompleto: "",
    carnetIdentidad: "",
    telefono: "",
    email: ""
  });

  /* ── Initialization ─────────────────────────────────────────── */
  useEffect(() => {
    async function cargarData() {
      if (!id) return;
      
      const [resCliente, resExpedientes] = await Promise.all([
        obtenerClientePorId(id),
        obtenerExpedientesPorCliente(id)
      ]);

      if (resCliente) {
        setCliente(resCliente);
        setFormData({
          nombreCompleto: resCliente.nombreCompleto,
          carnetIdentidad: resCliente.carnetIdentidad,
          telefono: resCliente.telefono || "",
          email: resCliente.email || ""
        });
      }
      setExpedientes(resExpedientes);
      setLoading(false);
    }
    cargarData();
  }, [id]);

  /* ── Handlers ──────────────────────────────────────────────── */
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setAlert(null);

    const success = await actualizarCliente(id, formData);

    if (success) {
      setAlert({ type: 'success', msg: "Datos del cliente actualizados correctamente." });
      setCliente({ ...cliente!, ...formData });
    } else {
      setAlert({ type: 'error', msg: "Error al actualizar los datos del cliente." });
    }
    setGuardando(false);
  };

  const handleDelete = async () => {
    setEliminando(true);
    setAlert(null);

    const result = await eliminarCliente(id);

    if (result.success) {
      router.push("/dashboard/clientes");
    } else {
      setConfirmarEliminacion(false);
      if (result.error === 'HAS_CASES') {
        setAlert({ 
          type: 'error', 
          msg: "No se puede eliminar este cliente porque tiene expedientes asociados. Archive o elimine sus casos primero." 
        });
      } else {
        setAlert({ type: 'error', msg: "Error al intentar eliminar el cliente." });
      }
      setEliminando(false);
    }
  };

  /* ── Render Logic ─────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)]"></div>
        <p className="mt-4 text-[var(--color-text-muted)]">Cargando perfil del cliente...</p>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Cliente no encontrado</h2>
        <p className="text-[var(--color-text-muted)] mb-6">El cliente que busca no existe o fue eliminado.</p>
        <Link href="/dashboard/clientes">
          <Button variant="secondary">Volver al Directorio</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8 animate-in fade-in duration-500">
      
      {/* ─── Header ───────────────────────────────────────────── */}
      <header className="space-y-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/clientes">
            <Button variant="ghost" size="sm">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Volver
            </Button>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
            Perfil de {cliente.nombreCompleto}
          </h1>
        </div>

        {alert && (
          <Alert variant={alert.type} visible={true}>
            {alert.msg}
          </Alert>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* ─── Bloque 1 & 2: Identidad y Edición ─────────────────── */}
        <section className="space-y-6">
          <div className="bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              Información Personal
            </h2>
            
            <form onSubmit={handleUpdate} className="space-y-4">
              <FormField
                id="nombreCompleto"
                label="Nombre Completo"
                variant="light"
                value={formData.nombreCompleto}
                onChange={(e) => setFormData({ ...formData, nombreCompleto: e.target.value })}
                required
              />
              <FormField
                id="carnetIdentidad"
                label="Carnet de Identidad"
                variant="light"
                value={formData.carnetIdentidad}
                onChange={(e) => setFormData({ ...formData, carnetIdentidad: e.target.value })}
                required
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  id="telefono"
                  label="Teléfono"
                  variant="light"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                />
                <FormField
                  id="email"
                  label="Email"
                  type="email"
                  variant="light"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" variant="primary" loading={guardando} fullWidth className="md:w-auto">
                  {guardando ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            </form>
          </div>

          {/* Zona de Peligro */}
          <div className="bg-red-50/5 border border-red-500/20 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-red-500 mb-2 flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/>
              </svg>
              Zona de Peligro
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">
              Una vez eliminado un cliente, no se podrá recuperar su información.
              Recuerde que no puede eliminar clientes con expedientes activos.
            </p>

            {!confirmarEliminacion ? (
              <Button
                variant="ghost"
                onClick={() => setConfirmarEliminacion(true)}
                className="text-red-500 hover:bg-red-500/10 border border-red-500/30 w-full"
              >
                Eliminar este Cliente
              </Button>
            ) : (
              <div className="space-y-3 border border-red-500/30 rounded-xl p-4 bg-red-500/5">
                <p className="text-sm font-semibold text-red-600">
                  ¿Confirma que desea eliminar a <span className="italic">{cliente.nombreCompleto}</span>? Esta acción es irreversible.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmarEliminacion(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    loading={eliminando}
                    className="flex-1 text-red-500 hover:bg-red-500/10 border border-red-500/30"
                  >
                    {eliminando ? "Eliminando..." : "Sí, Eliminar"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ─── Bloque 3: Historial Legal ─────────────────────────── */}
        <section className="space-y-6">
          <div className="bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-2xl p-6 shadow-sm h-full">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
              </svg>
              Historial de Expedientes
            </h2>

            {expedientes.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-[var(--color-border-subtle)] rounded-xl">
                <p className="text-[var(--color-text-muted)]">No se encontraron expedientes para este cliente.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {expedientes.map((exp) => (
                  <div 
                    key={exp.id} 
                    className="p-4 border border-[var(--color-border-subtle)] rounded-xl hover:bg-[var(--color-surface-hover)] transition-colors group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-xs font-mono text-[var(--color-text-muted)] uppercase tracking-wider">
                          NUREJ: {exp.numeroCaso}
                        </span>
                        <h3 className="font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors">
                          {exp.titulo}
                        </h3>
                      </div>
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        exp.estado === 'cerrado' ? 'bg-gray-100 text-gray-600' :
                        exp.estado === 'juicio' ? 'bg-red-100 text-red-600' :
                        exp.estado === 'mediacion' ? 'bg-amber-100 text-amber-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {exp.estado.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <p className="text-[var(--color-text-muted)]">
                        Materia: <span className="text-[var(--color-text-primary)]">{exp.materia}</span>
                      </p>
                      <Link href={`/dashboard/casos/${exp.id}`}>
                        <Button variant="ghost" size="sm" className="text-[var(--color-primary)] font-semibold p-0 h-auto">
                          Abrir Expediente →
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
