# ⚖️ CRM Legal - Iturri & Asociados

**Desarrollador:** Ariel Fabricio Tarqui Villalba
**Fase:** Desarrollo Local (MVP 4 Meses)
**Stack Tecnológico:** Next.js (App Router), Tailwind CSS, Supabase (PostgreSQL + Auth + Storage), Docker.

## 🚀 Bitácora de Desarrollo - Día 1

### 1. Definición de Alcance y Requerimientos
* Actualización del Documento de Requerimientos blindando el alcance del MVP.
* Definición de infraestructura (Ampliación RAM/SSD y licencia de IA).
* Definición de integración de Facturación Electrónica (SIAT) en el backend.
* Definición del modelo de "Agente Ligero" de IA mediante prompts de sistema (API Gemini).

### 2. Arquitectura de Usuarios (RBAC)
Se definió un sistema de control de acceso basado en 3 roles estrictos:
* **Administrador (God Mode):** Control total de la firma, reportes y asignación.
* **Abogado:** Vista restringida a sus casos asignados y gestión de clientes.
* **Cliente (Viewer):** Acceso hiperminimalista de solo lectura para ver el estado de su caso.

### 3. Configuración de Entorno Local
* Inicialización de proyecto con Next.js 15+ y Tailwind CSS.
* Despliegue de backend local utilizando **Supabase CLI y Docker**, aislando la base de datos, autenticación y almacenamiento en la máquina local.
* Configuración de `allowedDevOrigins` en `next.config.ts` para red local.

### 4. Base de Datos y Seguridad (Laboratorio 1)
* Creación de esquema personalizado `rol_usuario` (ENUM).
* Creación de la tabla `perfiles` vinculada a `auth.users` mediante UUID.
* Implementación de políticas de Seguridad a Nivel de Fila (RLS).

### 5. Desarrollo de Interfaz (UI)
* Creación del puente cliente de Supabase.
* Desarrollo de la vista de Autenticación (`/login`) con conexión exitosa.

---

## 🚀 Bitácora de Desarrollo - Día 2 y 3

### 1. Automatización de Base de Datos (Triggers)
* Creación de Funciones PL/pgSQL y Triggers en Supabase para interceptar la creación de usuarios en `auth.users`.
* Asignación automática del rol `cliente` por defecto en la tabla `perfiles`.
* Optimización de rendimiento en políticas RLS usando subconsultas `(select auth.uid())` para evitar cuellos de botella.

### 2. Seguridad en Rutas y Autenticación
* Implementación de **Next.js Proxy (Middleware)** para protección de grado bancario en las rutas privadas (`/dashboard`).
* Redirección inteligente de usuarios sin sesión activa.
* Implementación del flujo completo de cierre de sesión (`signOut`) y limpieza de caché del enrutador.

### 3. Refactorización a Clean Architecture
Reestructuración completa del proyecto para garantizar escalabilidad a largo plazo:
* **Capa Domain:** Creación de Entidades e Interfaces puras en TypeScript (`Cliente.ts`, `Expediente.ts`).
* **Capa Infrastructure:** Aislamiento de las llamadas a Supabase mediante el patrón Repository (`clienteRepository.ts`, `perfilRepository.ts`).
* **Capa Application/Presentation:** Limpieza de componentes de React para que solo consuman datos procesados.

### 4. Modelado del Core del CRM Legal
* Creación de ENUM `estado_expediente` (`en_espera`, `mediacion`, `juicio`, `cerrado`).
* Modelado y creación de la tabla `clientes` (con validación `UNIQUE` para carnet de identidad).
* Modelado y creación de la tabla `expedientes` con llaves foráneas strictas hacia clientes y abogados.
* Ejecución exitosa de un "Vertical Slice" conectando la UI con la base de datos a través del repositorio de clientes.

---

## 🚀 Bitácora de Desarrollo - Día 4 (Sistema de Diseño Atómico)

### 1. Tokens Globales
Centralización de variables de diseño (colores navy/gold, tipografía) en `tokens.css` como única fuente de verdad.

### 2. Componentes UI (Atomic Design)
Creación de la carpeta `components/ui/` con componentes base reutilizables (`Button`, `FormField`, `Alert`, `AuthCard`).

### 3. Vertical Slice
Refactorización total de la vista de `/login` para abandonar la deuda técnica de CSS y consumir el nuevo sistema de diseño manteniendo la lógica de Supabase intacta.

---

## 🚀 Bitácora de Desarrollo - Día 5 (Directorio y Perfil de Clientes)

### 1. Capa de Datos (Repositorio)
Ampliación de `clienteRepository.ts` para soportar lectura por ID, historial de expedientes asociados, actualización y eliminación de clientes.

### 2. Integridad Referencial (Seguridad)
Implementación de captura inteligente de errores de llave foránea (Foreign Key) para impedir el borrado accidental de clientes que poseen expedientes legales activos o históricos.

### 3. Vista de Perfil 360
Creación de la ruta dinámica `/dashboard/clientes/[id]` dividida en dos módulos: Gestión de Identidad (CRUD) y Portafolio Legal (Expedientes asociados).

### 4. Refactorización UI
Actualización de la tabla principal de clientes y modales para consumir los nuevos componentes atómicos y enrutar correctamente hacia el perfil individual.

---

## 🛠️ Instrucciones de Despliegue Local
1. Clonar el repositorio.
2. Asegurarse de tener Docker Desktop corriendo.
3. Ejecutar `npm install` para las dependencias del frontend.
4. Ejecutar `npx supabase start` para levantar la base de datos local.
5. Configurar el archivo `.env.local` con las credenciales de la terminal.
6. Ejecutar `npm run dev` para levantar el servidor web en `localhost:3000`.