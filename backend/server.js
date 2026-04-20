const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const networkRoutes = require('./routes/network');
const messageRoutes = require('./routes/messages');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests. Please try again later.' }
});
app.use('/api/', limiter);

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/network', networkRoutes);
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/users', userRoutes);

app.get('/', (req, res) => {
  res.json({
    name: 'Atelier Academic API',
    version: '1.0.0',
    status: 'operational',
    endpoints: {
      auth: '/api/v1/auth',
      events: '/api/v1/events',
      network: '/api/v1/network',
      messages: '/api/v1/messages',
      users: '/api/v1/users'
    }
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`\n  ✦ Atelier Academic API`);
    console.log(`  ✦ Port: ${PORT}`);
    console.log(`  ✦ Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`  ✦ Ready for connections\n`);
  });
};

startServer();
