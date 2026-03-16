# ⚖️ CRM Legal - Iturri & Asociados

**Desarrollador:** [Ariel Fabricio Tarqui Villalba]
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

## 🛠️ Instrucciones de Despliegue Local
1. Clonar el repositorio.
2. Asegurarse de tener Docker Desktop corriendo.
3. Ejecutar `npm install` para las dependencias del frontend.
4. Ejecutar `npx supabase start` para levantar la base de datos local.
5. Configurar el archivo `.env.local` con las credenciales de la terminal.
6. Ejecutar `npm run dev` para levantar el servidor web en `localhost:3000`.