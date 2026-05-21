/**
 * Un solo proceso: MongoDB en memoria + seed + API (los datos persisten mientras corre).
 */
process.env.USE_MEMORY_DB = 'true';

const connectDB = require('../config/db');
const { seedData } = require('../seed');

const startServer = async () => {
  await connectDB();
  await seedData({ exitOnComplete: false });

  const app = require('../server').app;
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`\n  ✦ EventUs API (memoria + seed)`);
    console.log(`  ✦ http://localhost:${PORT}`);
    console.log(`  ✦ Demo: demo@eventus.app / demo123\n`);
  });
};

startServer().catch((err) => {
  console.error(err);
  process.exit(1);
});
