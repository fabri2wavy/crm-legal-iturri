export interface Documento {
  id: string;
  nombre: string;          // nombre original del archivo
  ruta: string;            // path completo en el bucket de Storage
  tamaño: number;          // bytes
  visibleCliente: boolean; // control de privacidad Interno/Público
  subidoPor: string;       // nombre_completo del perfil que subió
  fechaSubida: Date;
}
