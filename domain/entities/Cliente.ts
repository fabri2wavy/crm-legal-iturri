// domain/entities/Cliente.ts

export interface Cliente {
  id: string;
  nombreCompleto: string;
  carnetIdentidad: string;
  telefono: string;
  email: string;
  fechaRegistro: Date;
}