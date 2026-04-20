const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Event = require('./models/Event');
const Discourse = require('./models/Discourse');
const Message = require('./models/Message');
const Connection = require('./models/Connection');

const seedData = async () => {
  try {
    await connectDB();
    console.log('\n  ⟐ Clearing existing data...');

    await User.deleteMany({});
    await Event.deleteMany({});
    await Discourse.deleteMany({});
    await Message.deleteMany({});
    await Connection.deleteMany({});

    console.log('  ⟐ Creating users...');

    const users = await User.create([
      {
        email: 'elena.rostova@institute.edu',
        passwordHash: 'password123',
        profile: {
          firstName: 'Elena',
          lastName: 'Rostova',
          bio: 'Investigadora principal en Arquitectura Cognitiva. Enfocada en la intersección de redes neuronales y procesamiento semántico humano. Publicó 42 artículos sobre mecanismos de atención a gran escala.',
          title: 'Investigadora Principal en Arquitectura Cognitiva',
          avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
          disciplines: ['Ciencias Cognitivas', 'IA', 'Lingüística', 'Redes Neuronales']
        },
        credentials: [
          { name: 'Doctorado en Ciencias Computacionales', issuer: 'MIT', verified: true, year: 2018 },
          { name: 'Certificación ISO 27001', issuer: 'ISO', verified: true, year: 2021 }
        ],
        metrics: { connections: 42, citations: 8400, contributions: 156, eventsAttended: 23 },
        location: { type: 'Point', coordinates: [-76.9628, -12.1068] },
        isOnline: true
      },
      {
        email: 'andres.vance@university.edu',
        passwordHash: 'password123',
        profile: {
          firstName: 'Andrés',
          lastName: 'Vance',
          bio: 'Especialista en Sistemas de Gestión de Seguridad de la Información. Explorando estrategias de implementación y alineamiento regulatorio en marcos institucionales modernos.',
          title: 'Prof. de Seguridad Informática',
          avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
          disciplines: ['Ciberseguridad', 'GRC', 'Gestión de Riesgos', 'Cumplimiento']
        },
        credentials: [
          { name: 'Certificación CISSP', issuer: 'ISC²', verified: true, year: 2019 },
          { name: 'PhD Seguridad Informática', issuer: 'Stanford', verified: true, year: 2016 }
        ],
        metrics: { connections: 89, citations: 12600, contributions: 203, eventsAttended: 47 },
        location: { type: 'Point', coordinates: [-77.0284, -12.1197] },
        isOnline: true
      },
      {
        email: 'julian.hayes@tech.org',
        passwordHash: 'password123',
        profile: {
          firstName: 'Julián',
          lastName: 'Hayes',
          bio: 'Investigador en Computación Cuántica en la intersección de corrección de errores cuánticos topológicos y arquitecturas escalables.',
          title: 'Arquitecto de Sistemas Cuánticos',
          avatar: 'https://randomuser.me/api/portraits/men/46.jpg',
          disciplines: ['Computación Cuántica', 'Física', 'Matemáticas', 'IA']
        },
        credentials: [
          { name: 'PhD Física Cuántica', issuer: 'Caltech', verified: true, year: 2020 }
        ],
        metrics: { connections: 35, citations: 4200, contributions: 89, eventsAttended: 15 },
        location: { type: 'Point', coordinates: [-77.0336, -12.0964] },
        isOnline: false
      },
      {
        email: 'sarah.lin@research.io',
        passwordHash: 'password123',
        profile: {
          firstName: 'Sarah',
          lastName: 'Lin',
          bio: 'Experta en Lingüística Computacional. Directora de Lingüística Computacional en el Instituto Monolito. Especialista en estructuras semánticas recursivas y preservación archivística.',
          title: 'Directora de Lingüística Computacional',
          avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
          disciplines: ['Lingüística', 'PLN', 'IA', 'Ciencia de Datos']
        },
        credentials: [
          { name: 'PhD Lingüística Computacional', issuer: 'Oxford', verified: true, year: 2017 },
          { name: 'ACL Fellow', issuer: 'ACL', verified: true, year: 2022 }
        ],
        metrics: { connections: 67, citations: 9800, contributions: 142, eventsAttended: 31 },
        location: { type: 'Point', coordinates: [-76.9977, -12.1066] },
        isOnline: true
      },
      {
        email: 'marcus.chen@dev.edu',
        passwordHash: 'password123',
        profile: {
          firstName: 'Marcus',
          lastName: 'Chen',
          bio: 'Analista SOC convertido en investigador. Construyendo plataformas de inteligencia de amenazas de siguiente generación usando redes neuronales de grafos.',
          title: 'Líder de Investigación SOC',
          avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
          disciplines: ['Ciberseguridad', 'Machine Learning', 'Inteligencia de Amenazas', 'DevSecOps']
        },
        credentials: [
          { name: 'Certificación OSCP', issuer: 'OffSec', verified: true, year: 2021 },
          { name: 'MSc Ciberseguridad', issuer: 'Georgia Tech', verified: true, year: 2019 }
        ],
        metrics: { connections: 28, citations: 1500, contributions: 45, eventsAttended: 12 },
        location: { type: 'Point', coordinates: [-77.0189, -12.1443] },
        isOnline: true
      },
      {
        email: 'demo@atelier.edu',
        passwordHash: 'demo123',
        profile: {
          firstName: 'Académico',
          lastName: 'Investigador',
          bio: 'Cuenta demo para explorar la plataforma Atelier Academic.',
          title: 'Investigador Visitante',
          avatar: 'https://randomuser.me/api/portraits/men/55.jpg',
          disciplines: ['Ciencias de la Computación', 'IA', 'Educación']
        },
        credentials: [
          { name: 'MSc Ciencias de la Computación', issuer: 'Universidad Ricardo Palma', verified: true, year: 2023 }
        ],
        metrics: { connections: 5, citations: 120, contributions: 8, eventsAttended: 3 },
        location: { type: 'Point', coordinates: [-76.9628, -12.1068] },
        isOnline: true
      }
    ]);

    console.log(`  ✓ Created ${users.length} users`);

    console.log('  ⟐ Creating events...');

    const events = await Event.create([
      {
        metadata: {
          title: 'La Arquitectura de las Instituciones del Futuro',
          description: 'Una inmersión profunda en la intersección de los principios de diseño asistido por IA y los marcos computacionales modernos. Explorando las estructuras fundamentales que definirán la próxima generación de arquitectura institucional.',
          type: 'Symposium',
          tags: ['Arquitectura', 'IA', 'Diseño Institucional', 'Futuro Tech'],
          coverImage: ''
        },
        schedule: {
          date: new Date('2026-05-15'),
          startTime: '09:00',
          endTime: '17:00',
          timezone: 'GMT-5'
        },
        location: {
          venue: 'Auditorio Central, Universidad Ricardo Palma',
          address: 'Av. Benavides 5440, Santiago de Surco, Lima',
          coordinates: { type: 'Point', coordinates: [-76.9628, -12.1068] }
        },
        capacity: { max: 200, current: 156, isLimited: true },
        speakers: [
          { userId: users[0]._id, role: 'Keynote' },
          { userId: users[3]._id, role: 'Panelist' }
        ],
        attendees: [users[1]._id, users[4]._id],
        isLive: false,
        isFeatured: true,
        createdBy: users[0]._id
      },
      {
        metadata: {
          title: 'Gobernanza, Riesgo y Cumplimiento: Normas ISO 27001',
          description: 'Una revisión académica exhaustiva de los sistemas de gestión de seguridad de la información, enfocada en estrategias de implementación y alineamiento regulatorio en marcos institucionales modernos.',
          type: 'In-Person Seminar',
          tags: ['GRC', 'ISO 27001', 'Cumplimiento', 'Seguridad'],
          coverImage: ''
        },
        schedule: {
          date: new Date('2026-05-20'),
          startTime: '14:00',
          endTime: '18:00',
          timezone: 'GMT-5'
        },
        location: {
          venue: 'Sala de Conferencias, PUCP',
          address: 'Av. Universitaria 1801, San Miguel, Lima',
          coordinates: { type: 'Point', coordinates: [-77.0764, -12.0693] }
        },
        capacity: { max: 80, current: 45, isLimited: true },
        speakers: [
          { userId: users[1]._id, role: 'Keynote' },
          { userId: users[4]._id, role: 'Panelist' }
        ],
        attendees: [users[0]._id, users[2]._id, users[3]._id],
        isLive: false,
        isFeatured: true,
        createdBy: users[1]._id
      },
      {
        metadata: {
          title: 'Seminario Avanzado de Diseño Algorítmico',
          description: 'Exploración integral de patrones modernos de diseño de algoritmos, teoría de complejidad computacional y sus aplicaciones en arquitecturas de sistemas distribuidos.',
          type: 'Live Salon',
          tags: ['Algoritmos', 'Ciencias de la Computación', 'Patrones de Diseño'],
          coverImage: ''
        },
        schedule: {
          date: new Date('2026-04-20'),
          startTime: '10:00',
          endTime: '12:00',
          timezone: 'GMT-5'
        },
        location: {
          venue: 'Laboratorio de Innovación, URP',
          address: 'Av. Benavides 5440, Santiago de Surco, Lima',
          coordinates: { type: 'Point', coordinates: [-76.9640, -12.1080] }
        },
        capacity: { max: 50, current: 32, isLimited: true },
        speakers: [
          { userId: users[2]._id, role: 'Keynote' }
        ],
        attendees: [users[0]._id, users[1]._id],
        isLive: true,
        isFeatured: false,
        createdBy: users[2]._id
      },
      {
        metadata: {
          title: 'La Integridad Estructural de los Espacios Digitales',
          description: 'Un estudio sobre cómo las primitivas cloud de confianza cero se diseñan para producir entornos operativos inherentemente seguros para plataformas de software modernas.',
          type: 'Symposium',
          tags: ['Seguridad Cloud', 'Zero Trust', 'DevSecOps'],
          coverImage: ''
        },
        schedule: {
          date: new Date('2026-06-01'),
          startTime: '09:00',
          endTime: '13:00',
          timezone: 'GMT-5'
        },
        location: {
          venue: 'Centro de Convenciones de Lima',
          address: 'Av. Javier Prado Este, San Borja, Lima',
          coordinates: { type: 'Point', coordinates: [-76.9977, -12.0900] }
        },
        capacity: { max: 120, current: 78, isLimited: true },
        speakers: [
          { userId: users[4]._id, role: 'Keynote' },
          { userId: users[1]._id, role: 'Moderator' }
        ],
        attendees: [users[0]._id, users[2]._id, users[3]._id],
        isLive: false,
        isFeatured: true,
        createdBy: users[4]._id
      },
      {
        metadata: {
          title: 'Mapeando Vías Neuronales en Tiempo Real',
          description: 'Demostración en vivo de interfaces cerebro-computador y visualización en tiempo real de vías neuronales usando arrays EEG personalizados y decodificadores de machine learning.',
          type: 'Live Salon',
          tags: ['Neurociencia', 'BCI', 'Machine Learning', 'Tiempo Real'],
          coverImage: ''
        },
        schedule: {
          date: new Date('2026-04-20'),
          startTime: '15:00',
          endTime: '17:00',
          timezone: 'GMT-5'
        },
        location: {
          venue: 'Laboratorio de Neurociencias, UNMSM',
          address: 'Av. Venezuela, Cercado de Lima',
          coordinates: { type: 'Point', coordinates: [-77.0400, -12.0580] }
        },
        capacity: { max: 30, current: 22, isLimited: true },
        speakers: [
          { userId: users[0]._id, role: 'Keynote' }
        ],
        attendees: [users[1]._id, users[2]._id, users[4]._id],
        isLive: true,
        isFeatured: false,
        createdBy: users[0]._id
      },
      {
        metadata: {
          title: 'Bioinformática y el Genoma',
          description: 'Una inmersión profunda en algoritmos de bio-computación, sus aplicaciones clínicas en biología molecular moderna y análisis de datos genómicos.',
          type: 'Workshop',
          tags: ['Bioinformática', 'Genómica', 'Ciencia de Datos'],
          coverImage: ''
        },
        schedule: {
          date: new Date('2026-05-25'),
          startTime: '10:00',
          endTime: '16:00',
          timezone: 'GMT-5'
        },
        location: {
          venue: 'Auditorio de Ciencias de la Salud, UPC',
          address: 'Av. Prolongación Primavera 2390, Monterrico, Lima',
          coordinates: { type: 'Point', coordinates: [-76.9714, -12.1060] }
        },
        capacity: { max: 60, current: 41, isLimited: true },
        speakers: [
          { userId: users[3]._id, role: 'Keynote' },
          { userId: users[0]._id, role: 'Guest Speaker' }
        ],
        attendees: [users[1]._id, users[4]._id],
        isLive: false,
        isFeatured: false,
        createdBy: users[3]._id
      },
      {
        metadata: {
          title: 'Arquitectura y Tecnología: La Era Monolito',
          description: 'Explorando la intersección de los principios de diseño asistido por IA y las arquitecturas computacionales modernas en entornos académicos.',
          type: 'Lecture',
          tags: ['Arquitectura', 'Tecnología', 'Diseño'],
          coverImage: ''
        },
        schedule: {
          date: new Date('2026-06-10'),
          startTime: '11:00',
          endTime: '13:00',
          timezone: 'GMT-5'
        },
        location: {
          venue: 'Centro Cultural de Miraflores',
          address: 'Av. Larco, Miraflores, Lima',
          coordinates: { type: 'Point', coordinates: [-77.0284, -12.1197] }
        },
        capacity: { max: 150, current: 92, isLimited: true },
        speakers: [
          { userId: users[0]._id, role: 'Keynote' },
          { userId: users[2]._id, role: 'Panelist' }
        ],
        attendees: [users[1]._id, users[3]._id, users[4]._id],
        isLive: false,
        isFeatured: true,
        createdBy: users[0]._id
      },
      {
        metadata: {
          title: 'Epistemología Digital',
          description: 'Cómo las herramientas digitales están redefiniendo lo que consideramos conocimiento en la investigación moderna. Un simposio filosófico y técnico.',
          type: 'Symposium',
          tags: ['Filosofía', 'Humanidades Digitales', 'Epistemología'],
          coverImage: ''
        },
        schedule: {
          date: new Date('2026-06-15'),
          startTime: '14:00',
          endTime: '18:00',
          timezone: 'GMT-5'
        },
        location: {
          venue: 'Sala de Humanidades, USMP',
          address: 'Av. Tomás Marsano, Surquillo, Lima',
          coordinates: { type: 'Point', coordinates: [-76.9850, -12.1200] }
        },
        capacity: { max: 100, current: 56, isLimited: true },
        speakers: [
          { userId: users[3]._id, role: 'Keynote' },
          { userId: users[1]._id, role: 'Panelist' }
        ],
        attendees: [users[0]._id, users[2]._id],
        isLive: false,
        isFeatured: false,
        createdBy: users[3]._id
      },
      {
        metadata: {
          title: 'Silencio Archivístico',
          description: 'Desenterrando narrativas perdidas en sistemas computacionales históricos. Comprender cómo los fallos en la preservación de datos moldean nuestro patrimonio digital.',
          type: 'Symposium',
          tags: ['Archivos Digitales', 'Historia', 'Preservación de Datos'],
          coverImage: ''
        },
        schedule: {
          date: new Date('2026-07-01'),
          startTime: '09:00',
          endTime: '12:00',
          timezone: 'GMT-5'
        },
        location: {
          venue: 'Biblioteca Nacional del Perú',
          address: 'Av. De la Poesía 160, San Borja, Lima',
          coordinates: { type: 'Point', coordinates: [-76.9960, -12.0970] }
        },
        capacity: { max: 40, current: 18, isLimited: true },
        speakers: [
          { userId: users[0]._id, role: 'Keynote' }
        ],
        attendees: [users[3]._id],
        isLive: false,
        isFeatured: false,
        createdBy: users[0]._id
      }
    ]);

    console.log(`  ✓ Created ${events.length} events`);

    console.log('  ⟐ Creating discourse rooms...');

    const discourseRooms = await Discourse.create([
      {
        name: 'Discusión Seminario GRC',
        description: 'Compartir el paper central y temas de discusión adicionales.',
        eventId: events[1]._id,
        members: [users[0]._id, users[1]._id, users[3]._id, users[4]._id],
        messages: [
          { sender: users[1]._id, content: 'Respecto a la última perspectiva sobre los seminarios de bioinformática, creo que el desarrollo de la sección 4 necesita mayor análisis antes de la sesión del panel.', timestamp: new Date('2026-04-19T10:00:00') },
          { sender: users[0]._id, content: 'De acuerdo. El marco metodológico necesita criterios de validación más robustos.', timestamp: new Date('2026-04-19T10:15:00') }
        ],
        isActive: true,
        createdBy: users[1]._id
      },
      {
        name: 'Futuro de la Educación 2031',
        description: 'La conversación sobre cómo será la educación en 5 años.',
        eventId: events[0]._id,
        members: [users[0]._id, users[2]._id, users[3]._id],
        messages: [
          { sender: users[0]._id, content: 'La intersección de los sistemas de tutoría con IA y la pedagogía tradicional es donde está la verdadera innovación.', timestamp: new Date('2026-04-18T14:00:00') }
        ],
        isActive: true,
        createdBy: users[0]._id
      },
      {
        name: 'Q&A Vías Neuronales en Vivo',
        description: 'Discusión posterior a la sesión de la demostración de mapeo neuronal.',
        eventId: events[4]._id,
        members: [users[0]._id, users[1]._id, users[2]._id, users[4]._id],
        messages: [],
        isActive: true,
        createdBy: users[0]._id
      }
    ]);

    console.log(`  ✓ Created ${discourseRooms.length} discourse rooms`);

    console.log('  ⟐ Creating connections...');

    const connections = await Connection.create([
      { requester: users[0]._id, recipient: users[1]._id, status: 'accepted' },
      { requester: users[0]._id, recipient: users[3]._id, status: 'accepted' },
      { requester: users[1]._id, recipient: users[4]._id, status: 'accepted' },
      { requester: users[2]._id, recipient: users[0]._id, status: 'accepted' },
      { requester: users[3]._id, recipient: users[4]._id, status: 'pending' },
      { requester: users[5]._id, recipient: users[0]._id, status: 'accepted' }
    ]);

    console.log(`  ✓ Created ${connections.length} connections`);

    console.log('  ⟐ Creating messages...');

    const messages = await Message.create([
      { sender: users[4]._id, receiver: users[5]._id, content: 'El resumen de la demostración piloto de ayer fue revelador. ¿Estarías abierto a una breve colaboración de seguimiento para la próxima sesión?', read: false },
      { sender: users[3]._id, receiver: users[5]._id, content: 'Tu solicitud de acceso a la colección de archivos de 1839 ha sido aprobada.', read: true, readAt: new Date('2026-04-19T09:00:00') },
      { sender: users[0]._id, receiver: users[1]._id, content: 'A lo largo de la jornada, esperaba la coordinación. Al ser la primera vez que utilizábamos el sistema de seguridad en las instalaciones, soy de la opinión de que debíamos considerar un enfoque más integral.', read: true, readAt: new Date('2026-04-18T16:00:00') },
      { sender: users[1]._id, receiver: users[0]._id, content: 'Coincido plenamente. Te envío el resumen actualizado antes de la sesión de mañana.', read: false }
    ]);

    console.log(`  ✓ Created ${messages.length} messages`);

    console.log('\n  ✦ Seed completado exitosamente!\n');
    console.log('  Credenciales demo:');
    console.log('  Email: demo@atelier.edu');
    console.log('  Password: demo123\n');

    process.exit(0);
  } catch (error) {
    console.error('\n  ✗ Seed falló:', error);
    process.exit(1);
  }
};

seedData();
