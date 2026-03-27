// domain/entities/Expediente.ts

export type EstadoExpediente = 'en_espera' | 'mediacion' | 'juicio' | 'cerrado';

export interface Expediente {
  id: string;
  numeroCaso: string;
  titulo: string;
  materia: string;
  juzgado: string;
  parteContraria: string;
  informeDespacho: string;
  informeCliente: string;
  estado: EstadoExpediente;
  clienteId: string;
  abogado_id?: string;
  abogado_nombre?: string;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}