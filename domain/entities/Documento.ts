export interface Documento {
  nombre: string;       // nombre original del archivo
  ruta: string;         // path completo en el bucket
  tamaño: number;       // bytes
  fechaSubida: Date;
}
