// domain/entities/Expediente.ts

export type EstadoExpediente = 'en_espera' | 'mediacion' | 'juicio' | 'cerrado';

export interface Expediente {
  id: string;
  numeroCaso: string;
  titulo: string;
  materia: string;         // Ej: Civil, Penal, Laboral
  juzgado: string;         // Ej: Juzgado 3ro Civil
  parteContraria: string;  // Ej: Empresa ACME Ltda.
  informeDespacho: string; // Notas privadas
  informeCliente: string;  // Notas públicas  
  estado: EstadoExpediente;
  clienteId: string;
  abogadoAsignadoId: string;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}