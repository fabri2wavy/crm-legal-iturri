"use client";

import React from 'react';
import { AbogadoPerfil } from '@/infrastructure/data/abogadosMock';

interface Props {
  perfil: AbogadoPerfil;
}

export default function TarjetaVista({ perfil }: Props) {
  return (
    /* Aquí aplicamos un gradiente oscuro puro CSS en lugar de la imagen */
    <div className="min-h-screen bg-gradient-to-b from-gray-800 to-black text-white flex flex-col items-center font-sans">
      
      {/* Contenedor Principal */}
      <div className="w-full max-w-md mx-auto min-h-screen shadow-2xl flex flex-col pb-10">
        
        {/* Banner Rojo */}
        <div className="bg-[#cc0000] h-40 w-full flex justify-end items-start p-6 relative overflow-hidden">
        </div>

        {/* Avatar Circular (Solo esta imagen pesará) */}
        <div className="flex justify-center -mt-16 relative z-20">
          <div className="w-32 h-32 rounded-full border-4 border-[#1a1a1a] overflow-hidden shadow-xl bg-gray-800">
            <img
              src={perfil.fotoUrl}
              alt={perfil.nombre}
              className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.src = 'https://ui-avatars.com/api/?name=' + perfil.nombre }}
            />
          </div>
        </div>

        {/* Textos y Datos */}
        <div className="text-center px-6 mt-5 space-y-7">
          <div>
            <h1 className="text-3xl font-bold tracking-wide">{perfil.nombre}</h1>
            <p className="text-gray-300 mt-1 text-sm">{perfil.cargo} en</p>
            <p className="text-gray-100 text-sm tracking-widest uppercase mt-1">Iturri & Asociados</p>
          </div>

          <div className="space-y-1.5">
            <p className="font-semibold text-lg text-white">LA PAZ</p>
            <p className="text-sm text-gray-300">Av. Costanera esq. Calle 9</p>
            <p className="text-sm text-gray-300">Edificio Costanera 1000, Torre 1, Piso 7, Of C</p>
            <p className="text-sm text-gray-300">Zona Calacoto</p>
            <p className="text-sm text-gray-300 font-medium pt-1">Telf: (591) 2 2776776</p>
          </div>

          <div className="space-y-1.5">
            <p className="font-semibold text-lg text-white">SANTA CRUZ</p>
            <p className="text-sm text-gray-300">Calle Ricardo Jaimes Freire Nº 7, Piso 4 Oficina 1411,</p>
            <p className="text-sm text-gray-300">Edif. Suites Toborochi entre Av. San Martin y Enrique Finot,</p>
            <p className="text-sm text-gray-300">Zona Equipetrol</p>
          </div>

          {/* Botón de Acción Extra */}
          <div className="pt-4">
            <a 
              href={`mailto:${perfil.email}`} 
              className="block w-full bg-white text-gray-900 py-3 rounded-full font-bold hover:bg-gray-200 transition duration-300"
            >
              Contactar por Correo
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}