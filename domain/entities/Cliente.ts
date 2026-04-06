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
}
