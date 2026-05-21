require('dotenv').config();
const mongoose = require('mongoose');

let memoryServer;

const isDnsOrSrvError = (err) =>
  /ENOTFOUND|ECONNREFUSED|querySrv|ETIMEDOUT/i.test(err?.message || '');

const printAtlasHelp = () => {
  console.error(`
  ✗ No se pudo conectar a MongoDB Atlas.

  Causa habitual: el cluster "sistemasmoviles.gn0upbk.mongodb.net" ya no existe
  (DNS ENOTFOUND) — fue borrado, pausado o la URI en .env está desactualizada.

  Opciones:

  1) Desarrollo rápido (sin Atlas):
     npm run seed:memory
     npm run start:memory
     (o en .env: USE_MEMORY_DB=true)

  2) MongoDB Atlas nuevo:
     - https://cloud.mongodb.com → Create cluster → Connect → Drivers
     - Copia la URI y actualiza MONGO_URI en backend/.env
     - Network Access: añade tu IP (0.0.0.0/0 solo para pruebas)

  3) MongoDB local:
     MONGO_URI=mongodb://127.0.0.1:27017/eventus
`);
};

const startMemoryServer = async () => {
  const { MongoMemoryServer } = require('mongodb-memory-server');
  memoryServer = await MongoMemoryServer.create();
  return memoryServer.getUri('eventus');
};

/** Convierte mongodb+srv de Atlas a URI directa cuando Node en Windows falla querySrv */
const directUriFromSrv = (srvUri) => {
  if (process.env.MONGO_URI_DIRECT) return process.env.MONGO_URI_DIRECT;

  const match = srvUri.match(/mongodb\+srv:\/\/([^@]+)@([^/?]+)(?:\/([^?]*))?/);
  if (!match) return srvUri;

  const [, creds, host, dbName = 'SistemasMoviles'] = match;

  if (host.includes('sistemasmoviles.gn0upbk')) {
    return `mongodb://${creds}@ac-odptajx-shard-00-00.gn0upbk.mongodb.net:27017/${dbName}?ssl=true&authSource=admin&retryWrites=true&w=majority`;
  }

  return srvUri;
};

const connectWithUri = async (uri) => {
  try {
    return await mongoose.connect(uri);
  } catch (error) {
    if (uri.startsWith('mongodb+srv://') && isDnsOrSrvError(error)) {
      const direct = directUriFromSrv(uri);
      console.warn('\n  ⚠ mongodb+srv no resolvió en Node (Windows); usando URI directa al mismo cluster...\n');
      return mongoose.connect(direct);
    }
    throw error;
  }
};

const connectDB = async () => {
  const useMemory = process.env.USE_MEMORY_DB === 'true';
  let uri = process.env.MONGO_URI;

  if (!uri && !useMemory) {
    console.error('✗ Falta MONGO_URI en backend/.env');
    process.exit(1);
  }

  if (useMemory) {
    uri = await startMemoryServer();
    console.log('\n  ⟐ Modo desarrollo: MongoDB en memoria (datos se pierden al cerrar)\n');
  }

  try {
    const conn = await connectWithUri(uri);
    console.log(`\n  ✦ MongoDB Connected: ${conn.connection.host}`);
    console.log(`  ✦ Database: ${conn.connection.name}\n`);
    return conn;
  } catch (error) {
    if (!useMemory && process.env.FALLBACK_MEMORY_DB === 'true') {
      console.warn(`\n  ⚠ Atlas/local falló (${error.message}). Usando memoria...\n`);
      uri = await startMemoryServer();
      const conn = await mongoose.connect(uri);
      console.log(`  ✦ MongoDB Connected (memoria): ${conn.connection.host}`);
      console.log(`  ✦ Database: ${conn.connection.name}\n`);
      return conn;
    }

    printAtlasHelp();
    console.error(`✗ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
};

module.exports = connectDB;
module.exports.disconnectDB = disconnectDB;
