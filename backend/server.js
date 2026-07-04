const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const networkRoutes = require('./routes/network');
const messageRoutes = require('./routes/messages');
const userRoutes = require('./routes/users');
const communityRoutes = require('./routes/communities');
const eventusRoutes = require('./routes/eventus');
const squadRoutes = require('./routes/squads');
const notificationRoutes = require('./routes/notifications');
const uploadRoutes = require('./routes/uploads');
const roleRequestRoutes = require('./routes/roleRequests');

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1500,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false, xForwardedForHeader: false },
  message: { error: 'Too many requests. Please try again later.' }
});
app.use('/api/', limiter);

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/network', networkRoutes);
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/communities', communityRoutes);
app.use('/api/v1/eventus', eventusRoutes);
app.use('/api/v1/squads', squadRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/uploads', uploadRoutes);
app.use('/api/v1/role-requests', roleRequestRoutes);

app.get('/', (req, res) => {
  res.json({
    name: 'EventUs API',
    version: '2.0.0',
    status: 'operational',
    tagline: 'Conecta con propósito — eventos sociales con impacto local',
    endpoints: {
      auth: '/api/v1/auth',
      events: '/api/v1/events',
      communities: '/api/v1/communities',
      eventus: '/api/v1/eventus',
      network: '/api/v1/network',
      messages: '/api/v1/messages',
      users: '/api/v1/users',
    },
    features: [
      'radar',
      'matchmaking',
      'dynamic_qr',
      'event_wall',
      'badges',
      'whatsapp_invite',
      'creator_mode',
      'collaborative_album',
      'organizer_metrics',
    ],
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
    console.log(`\n  ✦ EventUs API`);
    console.log(`  ✦ Port: ${PORT}`);
    console.log(`  ✦ Environment: ${process.env.NODE_ENV || 'development'}`);
    if (process.env.USE_MEMORY_DB === 'true') {
      console.log(`  ✦ BD en memoria — usa: npm run dev:memory (seed + API juntos)\n`);
    } else {
      console.log(`  ✦ Ready for connections\n`);
    }
  });
};

module.exports = { app, startServer };

if (require.main === module) {
  startServer();
}
