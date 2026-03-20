"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cliente } from "../../../domain/entities/Cliente";
import { obtenerClientes, crearCliente } from "../../../infrastructure/repositories/clienteRepository";
import { Button } from "../../../components/ui/Button";
import { FormField } from "../../../components/ui/FormField";
import { Alert } from "../../../components/ui/Alert";
import styles from "./page.module.css";

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(true);

  /* ── Modal & Form state ────────────────────────────────────── */
  const [mostrarModal, setMostrarModal] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [formData, setFormData] = useState({
    nombreCompleto: "",
    carnetIdentidad: "",
    telefono: "",
    email: "",
  });

  useEffect(() => {
    async function cargarDatos() {
      const data = await obtenerClientes();
      setClientes(data);
      setCargando(false);
    }
    cargarDatos();
  }, []);

  /* ── Handlers ──────────────────────────────────────────────── */
  const abrirModal = () => {
    setErrorMsg("");
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setErrorMsg("");
  };

  const handleGuardarCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setErrorMsg("");

    const nuevo = await crearCliente(formData);

    if (nuevo) {
      setClientes([nuevo, ...clientes]);
      setFormData({ nombreCompleto: "", carnetIdentidad: "", telefono: "", email: "" });
      cerrarModal();
    } else {
      setErrorMsg("Error: Hubo un problema al registrar. Es posible que este Carnet de Identidad ya esté registrado.");
    }

    setGuardando(false);
  };

  /* ── Render ────────────────────────────────────────────────── */
  return (
    <div className="max-w-6xl mx-auto relative">

      {/* ─── Page Header ──────────────────────────────────────── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Directorio de Clientes</h1>
          <p className={styles.subtitle}>
            Gestión de personas registradas en la firma.
          </p>
        </div>
        <Button variant="primary" onClick={abrirModal}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nuevo Cliente
        </Button>
      </div>

      {/* ─── Table Wrapper ────────────────────────────────────── */}
      <div className={styles.tableWrapper}>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={styles.tableHead}>
                <th className={styles.tableHeadCell}>Nombre Completo</th>
                <th className={styles.tableHeadCell}>CI / DNI</th>
                <th className={styles.tableHeadCell}>Contacto</th>
                <th className={styles.tableHeadCell}>Fecha Registro</th>
                <th className={`${styles.tableHeadCell} ${styles.actionsCell}`}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {/* Loading */}
              {cargando && (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className={styles.stateContainer}>
                      <div className={styles.spinner} />
                      <span className={styles.emptyHint}>Cargando directorio...</span>
                    </div>
                  </td>
                </tr>
              )}

              {/* Empty */}
              {!cargando && clientes.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className={styles.emptyIcon}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </div>
                    <p className={styles.emptyTitle}>No hay clientes registrados</p>
                    <p className={styles.emptyHint}>
                      Registra tu primer cliente usando el botón de arriba.
                    </p>
                  </td>
                </tr>
              )}

              {/* Data rows */}
              {!cargando && clientes.map((cliente) => (
                <tr key={cliente.id} className={styles.tableRow}>
                  <td className={styles.tableCell}>
                    <span className={styles.clientName}>{cliente.nombreCompleto}</span>
                  </td>
                  <td className={styles.tableCell}>
                    <span className={styles.ciBadge}>{cliente.carnetIdentidad}</span>
                  </td>
                  <td className={styles.tableCell}>
                    <div className={styles.contactPrimary}>
                      {cliente.telefono || "Sin teléfono"}
                    </div>
                    <div className={styles.contactSecondary}>
                      {cliente.email || "Sin correo"}
                    </div>
                  </td>
                  <td className={`${styles.tableCell} ${styles.dateCell}`}>
                    {cliente.fechaRegistro.toLocaleDateString("es-ES")}
                  </td>
                  <td className={`${styles.tableCell} ${styles.actionsCell}`}>
                    <Link href={`/dashboard/clientes/${cliente.id}`} className={styles.linkUnstyled}>
                      <Button variant="ghost" size="sm">Ver Detalles</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile card list */}
        <div className="md:hidden">
          {cargando && (
            <div className="py-12 text-center">
              <div className={styles.stateContainer}>
                <div className={styles.spinner} />
                <span className={styles.emptyHint}>Cargando...</span>
              </div>
            </div>
          )}
          {!cargando && clientes.length === 0 && (
            <div className="py-12 text-center">
              <div className={styles.emptyIcon}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <p className={styles.emptyTitle}>No hay clientes registrados</p>
            </div>
          )}
          {!cargando && clientes.map((cliente) => (
            <div key={cliente.id} className={styles.mobileCard}>
              <div className={styles.mobileCardHeader}>
                <span className={styles.mobileName}>{cliente.nombreCompleto}</span>
                <span className={styles.mobileCi}>{cliente.carnetIdentidad}</span>
              </div>
              <div className={styles.mobileCardFooter}>
                <div>
                  <div className={styles.mobileContact}>
                    {cliente.telefono || "Sin teléfono"} · {cliente.email || "Sin correo"}
                  </div>
                  <div className={styles.mobileDate}>
                    {cliente.fechaRegistro.toLocaleDateString("es-ES")}
                  </div>
                </div>
                <Link href={`/dashboard/clientes/${cliente.id}`} className={styles.linkUnstyled}>
                  <Button variant="ghost" size="sm">Ver</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Modal: Registrar Nuevo Cliente ───────────────────── */}
      {mostrarModal && (
        <div className={styles.overlay}>
          <div className={styles.modalContainer}>

            {/* Modal header */}
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Registrar Nuevo Cliente</h3>
              <button onClick={cerrarModal} className={styles.modalClose} aria-label="Cerrar">
                &times;
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleGuardarCliente} className={styles.modalBody}>

              {/* Inline error alert — replaces native alert() */}
              <Alert variant="error" visible={!!errorMsg}>
                {errorMsg}
              </Alert>

              <FormField
                id="nombreCompleto"
                label="Nombre Completo *"
                type="text"
                required
                variant="light"
                value={formData.nombreCompleto}
                onChange={(e) => setFormData({ ...formData, nombreCompleto: e.target.value })}
              />

              <FormField
                id="carnetIdentidad"
                label="Carnet de Identidad *"
                type="text"
                required
                variant="light"
                value={formData.carnetIdentidad}
                onChange={(e) => setFormData({ ...formData, carnetIdentidad: e.target.value })}
              />

              <div className={styles.fieldGrid}>
                <FormField
                  id="telefono"
                  label="Teléfono"
                  type="text"
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

              <div className={styles.modalFooter}>
                <Button variant="secondary" type="button" onClick={cerrarModal}>
                  Cancelar
                </Button>
                <Button variant="primary" type="submit" loading={guardando}>
                  {guardando ? "Guardando..." : "Guardar Cliente"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}