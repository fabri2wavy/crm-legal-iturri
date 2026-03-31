export interface Cliente {
  id: string;
  nombreCompleto: string;   // Auto-generado: "nombres apellidoP apellidoM"
  email: string;
  telefono: string;
  rol: string;

  /* ── Generales de Ley (detalles_cliente) ─────────────────── */
  nombresLegales?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  ci?: string;
  expedido?: string;
  nacionalidad?: string;
  fechaNacimiento?: string;   // ISO date string (YYYY-MM-DD)
  estadoCivil?: string;
  profesion?: string;
  direccion?: string;
}
