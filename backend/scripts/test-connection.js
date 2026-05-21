require('dotenv').config();
const connectDB = require('../config/db');
const mongoose = require('mongoose');

connectDB()
  .then(() => {
    console.log('✓ Conectado:', mongoose.connection.host, '→', mongoose.connection.name);
    process.exit(0);
  })
  .catch((e) => {
    console.error('✗ Error:', e.message);
    process.exit(1);
  });
