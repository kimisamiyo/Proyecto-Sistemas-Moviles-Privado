# Atelier Academic

Plataforma de eventos y redes académicas bajo la estética "Scholarly Monolith". Construida con **Node.js, MongoDB y React Native (Expo).**

---

## 🛠️ Requisitos e Instalación Global

Antes de correr el proyecto, asegúrate de tener todo tu entorno preparado. Esta guía asume que partes desde cero.

### 1. Instalar Node.js
Descarga e instala **Node.js** (obligatorio).
- Ve a [nodejs.org](https://nodejs.org/) y descarga la versión LTS.
- Sigue el instalador estándar (siguiente, siguiente, siguiente).
- *Verificación:* Abre una terminal y escribe `node -v` y `npm -v`. Deberías ver números de versión.

### 2. Instalar Expo CLI y Ngrok Globalmente
Necesitas las herramientas de consola para correr el proyecto eficientemente y generar túneles. Abre una terminal con permisos de Administrador y ejecuta:

```bash
npm install -g expo-cli
npm install -g @expo/ngrok
```
*(Si usas Windows y te sale un error de políticas al correr npx o expo, debes abrir PowerShell como Administrador y escribir: `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy Unrestricted`)*

### 3. Instalar Expo Go en tu Teléfono
- Ve a la App Store (iOS) o Google Play Store (Android).
- Busca y descarga la aplicación **Expo Go**.

---

## 🚀 Cómo Correr el Proyecto (Paso a Paso)

El proyecto consta de dos partes interconectadas: **Backend** (Servidor/Base de Datos) y **Mobile** (App en React Native). Necesitarás tener **Dos Terminales abiertas** durante todo el uso.

### PARTE 1: Configurar y Correr el Backend

1. Abre tu primera terminal y entra a la carpeta del backend:
   ```bash
   cd backend
   ```

2. Instala las dependencias del servidor:
   ```bash
   npm install
   ```

3. Crea un archivo llamado exactamente `.env` (con el punto inicial) dentro de la carpeta `backend/` con las credenciales de la base de datos:
   ```env
   MONGO_URI=mongodb+srv://kimisamiyo:saluditos@sistemasmoviles.gn0upbk.mongodb.net/SistemasMoviles?retryWrites=true&w=majority
   JWT_SECRET=atelier_academic_jwt_secret_2024
   PORT=5000
   ```

4. *(Obligatorio la primera vez)* Para poblar tu base de datos con los eventos de Lima y usuarios de prueba:
   ```bash
   node seed.js
   ```

5. **Inicia el servidor backend:**
   ```bash
   node server.js
   ```
   *Deberías ver: "MongoDB Connected" y "Ready for connections". ¡Déjalo corriendo!*

---

### PARTE 2: Configurar y Correr la Aplicación Móvil (Frontend)

⚠️ **Paso muy importante:** Tu celular necesita comunicarse desde tu red WiFi con la app en tu PC.
- Descubre tu **IP de red IPv4**. (En Windows, abre otra terminal, escribe `ipconfig` y busca la fila `Dirección IPv4` en tu adaptador Wi-Fi. Ejemplo: `192.168.1.55`).

1. Abre una **Segunda Terminal** y entra a la carpeta mobile:
   ```bash
   cd mobile
   ```

2. Instala todas las dependencias del frontend:
   ```bash
   npm install
   ```

3. Crea un archivo llamado exactamente `.env` dentro de la carpeta `mobile/` y escribe lo siguiente, reemplazando la IP por la tuya exacta:
   ```env
   EXPO_PUBLIC_API_HOST=TuDireccionIP_AQUI (ej: 192.168.1.55)
   EXPO_PUBLIC_API_PORT=5000
   ```
   *(Asegúrate de NO usar localhost o 127.0.0.1 aquí)*

4. **Inicia la app con Expo usando Túneles Ngrok:**
   ```bash
   npx expo start --tunnel --clear
   ```
   *El comando `--tunnel` crea una red segura a través de los firewalls usando el ngrok que instalaste antes, permitiendo que tu teléfono se conecte impecablemente. El `--clear` limpia la memoria caché para forzar a expo a leer tu nueva IP.*

5. Aparecerá un Código QR enorme en tu terminal.
   - **En Android:** Toca escanear QR dentro de Expo Go.
   - **En iOS:** Abre la cámara y enfoca el QR.

---

## 🔑 Credenciales de Prueba (Login)

Cuando la app abra en tu teléfono, usa esta cuenta generada por el `seed.js`:

- **Correo electrónico Institucional:** `demo@atelier.edu`
- **Clave de acceso / Contraseña:** `demo123`

---

## ⚙️ Resolución de Incidencias Comunes

1. **"Login Failed" o no cargan los eventos:** 
   - Significa que la app en tu mano no puede hacer "ping" al puerto 5000 de tu PC. Revisa que tu IP en `mobile/.env` sea correcta y pertenezca a la misma red WiFi donde está conectado el teléfono celular. Tras corregirlo, siempre usa `npx expo start --tunnel --clear`.
2. **Error al abrir "Radar" - Location:**
   - La app te pedirá permisos GPS. Si los niegas por error temporalmente, el mapa te arrojará en el centro del mar o fallará. Otorga en ajustes permiso "Al usar la app" a Expo Go.
3. **No se reconoce 'npx' o 'expo':**
   - Asegúrate de haber instalado Node.js y haber reiniciado tu PC o tu editor de código para que las variables de entorno se refresquen.
