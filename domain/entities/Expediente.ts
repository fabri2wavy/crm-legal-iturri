// domain/entities/Expediente.ts
export type EstadoExpediente = 'en_espera' | 'mediacion' | 'juicio' | 'cerrado';

export interface Expediente {
  id: string;
  numeroCaso: string;
  titulo: string;
  descripcion: string;
  estado: EstadoExpediente;
  clienteId: string; 
  abogadoAsignadoId: string; 
  fechaCreacion: Date;
  fechaActualizacion: Date;
}