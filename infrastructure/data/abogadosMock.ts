export interface AbogadoPerfil {
  id: string;
  nombre: string;
  cargo: string;
  fotoUrl: string;
  email: string;
}

export const abogadosMock: Record<string, AbogadoPerfil> = {
  "martin-iturri": {
    id: "martin-iturri",
    nombre: "Martín Iturri",
    cargo: "Director",
    fotoUrl: "/tarjetas/doctor_iturri.jpg",
    email: "miturri@abogados.bo"
  },
  "victor-martin": {
    id: "victor-martin",
    nombre: "Victor Martin",
    cargo: "Asociado Senior",
    fotoUrl: "/tarjetas/doctor_martin.jpg",
    email: "vmartin@abogados.bo"
  },

  "andrea-garrett": {
    id: "andrea-garrett",
    nombre: "Andrea Garrett",
    cargo: "Abogado",
    fotoUrl: "/tarjetas/doctora_andrea.jpg",
    email: "agarrett@abogados.bo"
  }
};