# EventUs

Plataforma móvil de eventos sociales con impacto local. Conecta personas, comunidades y experiencias en torno a eventos presenciales: descubrimiento, escuadras, matchmaking, entradas con QR dinámico, muro colaborativo, álbum de recuerdos e insignias.

**Stack:** Node.js · Express · MongoDB · React Native (Expo)

---

## Estructura del repositorio

```
Proyecto-Sistemas-Moviles-Privado/
├── backend/          # API REST (Express + Mongoose)
├── mobile/           # App móvil (Expo / React Native)
├── FRONTEND-BRIEF.md # Especificación funcional del producto
├── UX-UI-APPLICATION-MAP.md
└── DESIGN (1).md     # Design system (Scholarly Monolith)
```

---

## Requisitos previos

| Herramienta | Versión recomendada |
|-------------|---------------------|
| [Node.js](https://nodejs.org/) | LTS (18+) |
| npm | incluido con Node |
| [Expo Go](https://expo.dev/go) | en el celular (desarrollo) |
| [ngrok](https://ngrok.com/) | opcional, para exponer el backend al celular |

Verifica la instalación:

```bash
node -v
npm -v
```

---

## Inicio rápido (desarrollo local)

La forma más sencilla de levantar el proyecto **sin MongoDB Atlas** es usar la base de datos en memoria con datos de prueba ya cargados.

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # opcional si usas dev:memory
npm run dev:memory
```

El servidor queda disponible en `http://localhost:5000`.

> **Importante:** usa `npm run dev:memory` (seed + API en un solo proceso).  
> Si corres `seed:memory` y luego `start:memory` por separado, cada comando crea una BD en memoria distinta y **no habrá usuarios** al intentar login.

### 2. Exponer el backend al celular (ngrok)

En otra terminal:

```bash
ngrok http 5000
```

Copia la URL pública (`https://xxxx.ngrok-free.app`).

### 3. App móvil

```bash
cd mobile
npm install
```

Crea `mobile/.env` con la URL de ngrok:

```env
EXPO_PUBLIC_API_URL=https://xxxx.ngrok-free.app/api/v1
```

Inicia Expo:

```bash
npx expo start --clear
```

Escanea el QR con **Expo Go** (Android) o la cámara (iOS).

#### Alternativa: misma red Wi‑Fi (sin ngrok)

```env
EXPO_PUBLIC_API_HOST=192.168.x.x   # IP de tu PC (ipconfig en Windows)
EXPO_PUBLIC_API_PORT=5000
```

---

## Credenciales de prueba

Contraseña para todas las cuentas: **`demo123`**

| Rol | Email |
|-----|-------|
| Miembro | `202220906@urp.edu.pe` |
| Creador | `202211307@urp.edu.pe` |
| Organizador | `mayrol.ortiz@gmail.com` |
| Moderador | `moderador@eventus.app` |
| Administrador | `admin@eventus.app` |

---

## Scripts del backend

| Comando | Descripción |
|---------|-------------|
| `npm run dev:memory` | **Recomendado.** BD en memoria + seed + API en un solo proceso |
| `npm start` / `npm run dev` | API con MongoDB Atlas (requiere `.env` configurado) |
| `npm run seed` | Pobla MongoDB Atlas con datos demo |
| `npm run test:db` | Prueba la conexión a MongoDB |
| `npm run seed:memory` | Solo seed en memoria (se pierde al cerrar el proceso) |
| `npm run start:memory` | Solo API en memoria (sin usuarios si no hubo seed previo en el mismo proceso) |

---

## Configuración del backend (`.env`)

Copia `backend/.env.example` a `backend/.env`:

```env
USE_MEMORY_DB=false
MONGO_URI=mongodb+srv://usuario:pass@cluster.mongodb.net/eventus
JWT_SECRET=tu_secreto_jwt
PORT=5000
```

Variables adicionales opcionales: SMTP (correo), `QR_TTL_SECONDS` (TTL del QR dinámico).

---

## Scripts de la app móvil

| Comando | Descripción |
|---------|-------------|
| `npm start` | Inicia Expo |
| `npm run start:tunnel` | Expo con túnel (útil si hay problemas de red) |
| `npm run android` | Build nativo Android |
| `npm run ios` | Build nativo iOS |
| `npm run web` | Versión web |

---

## API

Base URL: `http://localhost:5000/api/v1`

| Módulo | Prefijo | Ejemplos |
|--------|---------|----------|
| Auth | `/auth` | `POST /login`, `POST /register`, `GET /me` |
| Eventos | `/events` | `GET /explore`, `GET /radar`, `POST /register/:eventId` |
| EventUs | `/eventus` | muro, matchmaking, álbum, métricas, creator dashboard |
| Escuadras | `/squads` | crear, unirse, aprobar miembros |
| Comunidades | `/communities` | temas visuales, insignias |
| Red / Mensajes | `/network`, `/messages` | conexiones, chat |
| Notificaciones | `/notifications` | listado, marcar leídas |
| Solicitudes de rol | `/role-requests` | solicitar rol organizador |
| Uploads | `/uploads` | subida de imágenes |

Documentación de salud: `GET /` devuelve estado y endpoints disponibles.

---

## Funcionalidades principales

- **Feed y mapa radar** — descubrimiento de eventos por comunidad y proximidad
- **Detalle de evento (hub)** — info, muro, grupos, escuadras, entrada, álbum, métricas
- **Escuadras** — grupos para ir juntos a un evento
- **Matchmaking** — emparejamiento dentro del evento
- **Entradas con QR dinámico** — billetera y check-in con cámara
- **Insignias y comunidades** — gamificación por impacto y afinidad
- **Roles** — miembro, creador, organizador, moderador, administrador
- **Modo creador / organizador** — publicar eventos, dashboard, solicitud de rol

---

## Resolución de problemas

### Login falla con credenciales correctas

- Casi siempre significa que la BD está vacía. Usa `npm run dev:memory` en lugar de `start:memory`.
- Reiniciar el backend en memoria borra todos los datos; vuelve a levantar `dev:memory`.

### "No se puede conectar al servidor"

- Verifica que el backend esté corriendo en el puerto 5000.
- Si usas ngrok, actualiza `EXPO_PUBLIC_API_URL` en `mobile/.env` y reinicia Expo con `--clear`.
- Si usas Wi‑Fi, confirma que el celular y la PC están en la misma red y que la IP en `.env` es la correcta (`ipconfig`).

### MongoDB Atlas no conecta

- Revisa `MONGO_URI` en `backend/.env`.
- En Atlas: whitelist de IP y cluster activo.
- En Windows, si `mongodb+srv` falla, usa la URI directa del cluster (ver comentario en `.env.example`).
- Para desarrollo rápido, usa `npm run dev:memory`.

### Permisos de ubicación / cámara

- Expo Go pedirá permisos para el mapa radar y el escáner QR. Concédelos en ajustes del sistema si los negaste.

---

## Documentación adicional

- [`FRONTEND-BRIEF.md`](./FRONTEND-BRIEF.md) — módulos, flujos y contratos de API
- [`UX-UI-APPLICATION-MAP.md`](./UX-UI-APPLICATION-MAP.md) — mapa de pantallas y flujos UX
- [`DESIGN (1).md`](./DESIGN%20(1).md) — design system (colores, tipografía, componentes)

---

## Licencia

Proyecto académico — Universidad Ricardo Palma / Sistemas Móviles.
