export interface Cliente {
  id: string;
  nombreCompleto: string;
  email: string;
  telefono: string;
  rol: string;

  nombresLegales?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  ci?: string;
  expedido?: string;
  nacionalidad?: string;
  fechaNacimiento?: string;
  estadoCivil?: string;
  profesion?: string;
  direccion?: string;

  /** Nombre o descripción de quien refirió al cliente a la firma. */
  referidoPor?: string;
  /** Teléfono, email u otro dato de contacto del referidor. */
  contactoReferidor?: string;
}
