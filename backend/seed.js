const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { COMMUNITY_THEMES, BADGE_CATALOG } = require('./config/communityThemes');
const User = require('./models/User');
const Event = require('./models/Event');
const CommunityType = require('./models/CommunityType');
const Badge = require('./models/Badge');
const EventWall = require('./models/EventWall');
const Squad = require('./models/Squad');
const Notification = require('./models/Notification');
const CollaborativeAlbum = require('./models/CollaborativeAlbum');
const Discourse = require('./models/Discourse');
const Message = require('./models/Message');
const Connection = require('./models/Connection');

const lima = (lng, lat) => ({ type: 'Point', coordinates: [lng, lat] });

const seedData = async ({ exitOnComplete = true } = {}) => {
  try {
    if (mongoose.connection.readyState === 0) {
      await connectDB();
    }
    console.log('\n  ⟐ EventUs — reiniciando base de datos...\n');

    const collections = [User, Event, CommunityType, Badge, EventWall, Squad, Notification, CollaborativeAlbum, Discourse, Message, Connection];
    for (const Model of collections) await Model.deleteMany({});

    console.log('  ⟐ Tipos de comunidad y temas...');
    const communities = await CommunityType.insertMany(
      COMMUNITY_THEMES.map((c, i) => ({
        slug: c.slug,
        name: c.name,
        tagline: c.tagline,
        description: c.description,
        icon: c.icon,
        mood: c.mood,
        theme: c.theme,
        matchmaking: c.matchmaking,
        badgeSlugs: c.badges,
        sortOrder: i,
      }))
    );

    console.log('  ⟐ Catálogo de insignias...');
    const badges = await Badge.insertMany(
      BADGE_CATALOG.map((b) => ({
        ...b,
        communitySlugs: COMMUNITY_THEMES.filter((c) => c.badges.includes(b.slug)).map((c) => c.slug),
      }))
    );
    const badgeBySlug = Object.fromEntries(badges.map((b) => [b.slug, b]));

    console.log('  ⟐ Usuarios EventUs...');
    const users = await User.create([
      {
        email: 'sofia.impacto@eventus.pe',
        passwordHash: 'demo123',
        profile: {
          firstName: 'Sofía',
          lastName: 'Mendoza',
          bio: 'Organizadora de brigadas verdes y voluntariado juvenil en Lima Sur.',
          title: 'Líder comunitaria',
          avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
          interests: ['voluntariado', 'medio ambiente', 'educación'],
          communityAffinities: ['voluntariado', 'medio_ambiente'],
        },
        preferences: { favoriteCommunities: ['voluntariado', 'medio_ambiente'], matchmakingOpen: true },
        badges: [
          { slug: 'primera_brigada', badge: badgeBySlug.primera_brigada._id },
          { slug: 'guardian_verde', badge: badgeBySlug.guardian_verde._id },
        ],
        metrics: { eventsAttended: 12, eventsCreated: 8, impactPoints: 340, invitesSent: 24, wallPosts: 45, checkIns: 11 },
        creatorProfile: { isCreator: true, verifiedOrganizer: true, eventsPublished: 8 },
        location: lima(-76.98, -12.11),
        isOnline: true,
      },
      {
        email: 'mateo.social@eventus.pe',
        passwordHash: 'demo123',
        profile: {
          firstName: 'Mateo',
          lastName: 'Rivas',
          bio: 'Conector de quedadas: board games, café y caminatas urbanas.',
          title: 'Anfitrión de quedadas',
          avatar: 'https://randomuser.me/api/portraits/men/41.jpg',
          interests: ['quedadas', 'cultura', 'deporte'],
          communityAffinities: ['quedada', 'concierto'],
        },
        badges: [{ slug: 'anfitrion_quedada', badge: badgeBySlug.anfitrion_quedada._id }],
        metrics: { eventsAttended: 28, eventsCreated: 5, impactPoints: 210, invitesSent: 52 },
        creatorProfile: { isCreator: true, eventsPublished: 5 },
        location: lima(-77.03, -12.12),
        isOnline: true,
      },
      {
        email: 'lucia.causa@eventus.pe',
        passwordHash: 'demo123',
        profile: {
          firstName: 'Lucía',
          lastName: 'Vega',
          bio: 'Coordinadora de eventos benéficos y campañas solidarias.',
          title: 'Gestora de causas',
          avatar: 'https://randomuser.me/api/portraits/women/32.jpg',
          interests: ['benefico', 'voluntariado'],
          communityAffinities: ['benefico'],
        },
        badges: [{ slug: 'embajador_causa', badge: badgeBySlug.embajador_causa._id }],
        metrics: { eventsAttended: 19, eventsCreated: 6, impactPoints: 280, invitesSent: 88 },
        creatorProfile: { isCreator: true, verifiedOrganizer: true, eventsPublished: 6 },
        location: lima(-77.01, -12.09),
        isOnline: false,
      },
      {
        email: 'demo@eventus.app',
        passwordHash: 'demo123',
        profile: {
          firstName: 'Explorador',
          lastName: 'EventUs',
          bio: 'Cuenta demo para descubrir eventos con propósito cerca de ti.',
          title: 'Miembro de la comunidad',
          avatar: 'https://randomuser.me/api/portraits/men/55.jpg',
          interests: ['voluntariado', 'quedada', 'cultura'],
          communityAffinities: ['quedada', 'voluntariado'],
        },
        badges: [{ slug: 'radar_activo', badge: badgeBySlug.radar_activo._id }],
        metrics: { eventsAttended: 3, impactPoints: 45, invitesSent: 2 },
        location: lima(-76.96, -12.11),
        isOnline: true,
      },
    ]);

    const mkEvent = (data) => data;

    console.log('  ⟐ Eventos con impacto social...');
    const events = await Event.create([
      mkEvent({
        metadata: {
          title: 'Brigada Verde: Reforestación Chorrillos',
          description: 'Jornada de plantación y limpieza de playa. Trae guantes y botella reutilizable.',
          type: 'Voluntariado',
          communitySlug: 'voluntariado',
          tags: ['reforestación', 'playa', 'familias'],
          impactStatement: 'Meta: 200 árboles nativos y 2 km de costa limpia.',
        },
        impact: { category: 'ambiental', goal: '200 árboles', beneficiaries: 'Comunidad costera' },
        schedule: { date: new Date('2026-05-25'), startTime: '08:00', endTime: '13:00' },
        location: { venue: 'Costa Verde — Chorrillos', address: 'Malecón, Chorrillos', coordinates: lima(-77.02, -12.18) },
        capacity: { max: 80, current: 34 },
        hosts: [{ userId: users[0]._id, role: 'Organizador' }],
        attendees: [users[3]._id],
        isLive: false,
        isFeatured: true,
        createdBy: users[0]._id,
        metrics: { views: 420, registrations: 34, shares: 18, wallPosts: 12 },
      }),
      mkEvent({
        metadata: {
          title: 'Teletón Barrial — Recaudación Solidaria',
          description: 'Feria solidaria con música en vivo, trueque y donaciones para comedor popular.',
          type: 'Benéfico',
          communitySlug: 'benefico',
          tags: ['donación', 'música', 'comunidad'],
          impactStatement: 'Recaudar insumos para 50 familias del barrio.',
        },
        impact: { category: 'social', goal: 'S/ 8,000 en insumos', beneficiaries: '50 familias' },
        schedule: { date: new Date('2026-06-02'), startTime: '16:00', endTime: '22:00' },
        location: { venue: 'Plaza Bolognesi', address: 'Miraflores, Lima', coordinates: lima(-77.03, -12.12) },
        capacity: { max: 300, current: 112 },
        hosts: [{ userId: users[2]._id, role: 'Organizador' }],
        isFeatured: true,
        createdBy: users[2]._id,
        metrics: { views: 890, registrations: 112, shares: 64 },
      }),
      mkEvent({
        metadata: {
          title: 'Quedada: Board Games & Café',
          description: 'Nunca más vayas solo. Matchmaking automático para mesas de 4-6 personas.',
          type: 'Quedada',
          communitySlug: 'quedada',
          tags: ['juegos', 'café', 'nuevos amigos'],
        },
        schedule: { date: new Date('2026-05-22'), startTime: '19:00', endTime: '23:00' },
        location: { venue: 'Café Literario Barranco', address: 'Barranco, Lima', coordinates: lima(-77.02, -12.15) },
        capacity: { max: 24, current: 18 },
        hosts: [{ userId: users[1]._id, role: 'Organizador' }],
        attendees: [users[3]._id],
        isLive: true,
        createdBy: users[1]._id,
        metrics: { views: 310, registrations: 18, matchGroupsFormed: 3 },
      }),
      mkEvent({
        metadata: {
          title: 'Asamblea Vecinal: Seguridad y Espacios',
          description: 'Mesa ciudadana para priorizar intervenciones del municipio en tu zona.',
          type: 'Reunión',
          communitySlug: 'reunion',
          tags: ['cívico', 'vecinos', 'seguridad'],
        },
        schedule: { date: new Date('2026-06-08'), startTime: '18:30', endTime: '20:30' },
        location: { venue: 'CCVV Los Jazmines', address: 'Surco, Lima', coordinates: lima(-76.99, -12.11) },
        capacity: { max: 60, current: 22 },
        createdBy: users[0]._id,
        metrics: { views: 156, registrations: 22, wallPosts: 8 },
      }),
      mkEvent({
        metadata: {
          title: 'Festival Sonido Local — Parque Kennedy',
          description: 'Bandas emergentes + food trucks. Entrada con QR dinámico anti-reventa.',
          type: 'Concierto',
          communitySlug: 'concierto',
          tags: ['música', 'local', 'nocturno'],
        },
        schedule: { date: new Date('2026-06-15'), startTime: '20:00', endTime: '02:00' },
        location: { venue: 'Parque Kennedy', address: 'Miraflores, Lima', coordinates: lima(-77.03, -12.12) },
        capacity: { max: 500, current: 287 },
        isLive: true,
        isFeatured: true,
        createdBy: users[1]._id,
        metrics: { views: 2100, registrations: 287, shares: 140 },
      }),
      mkEvent({
        metadata: {
          title: 'Fútbol 7 Comunitario — Los Olivos',
          description: 'Partido abierto con matchmaking por posición y nivel.',
          type: 'Deporte',
          communitySlug: 'deporte',
          tags: ['fútbol', 'gratis', 'salud'],
        },
        schedule: { date: new Date('2026-05-28'), startTime: '17:00', endTime: '19:00' },
        location: { venue: 'Cancha Sintética UNMSM Norte', address: 'Los Olivos', coordinates: lima(-77.07, -11.99) },
        capacity: { max: 22, current: 16 },
        createdBy: users[1]._id,
      }),
      mkEvent({
        metadata: {
          title: 'Taller de Mural Colectivo',
          description: 'Arte urbano con artistas locales. Materiales incluidos.',
          type: 'Cultura',
          communitySlug: 'cultura',
          tags: ['arte', 'mural', 'taller'],
        },
        schedule: { date: new Date('2026-06-20'), startTime: '10:00', endTime: '14:00' },
        location: { venue: 'Pasaje Santa Rosa', address: 'Barranco', coordinates: lima(-77.02, -12.15) },
        capacity: { max: 30, current: 14 },
        createdBy: users[2]._id,
      }),
      mkEvent({
        metadata: {
          title: 'Campaña #RíoLimpio — Magdalena',
          description: 'Recolección de residuos y educación ambiental junto al río.',
          type: 'Medio ambiente',
          communitySlug: 'medio_ambiente',
          tags: ['río', 'limpieza', 'clima'],
          impactStatement: 'Retirar 500 kg de residuos no reciclables.',
        },
        impact: { category: 'ambiental', goal: '500 kg residuos', volunteerHours: 120 },
        schedule: { date: new Date('2026-07-05'), startTime: '07:30', endTime: '12:00' },
        location: { venue: 'Malecón Magdalena', address: 'Magdalena del Mar', coordinates: lima(-77.07, -12.09) },
        capacity: { max: 100, current: 41 },
        isFeatured: true,
        createdBy: users[0]._id,
      }),
    ]);

    console.log('  ⟐ Muros, grupos y álbumes...');
    for (const event of events) {
      await EventWall.create({
        event: event._id,
        posts: [
          {
            author: event.createdBy,
            content: `¡Bienvenidos al muro de "${event.metadata.title}"! Usen este espacio para romper el hielo y coordinar logística.`,
            type: 'announcement',
            isPinned: true,
          },
          {
            author: users[3]._id,
            content: '¿Alguien va desde Surco? Podemos coordinar movilidad en grupo.',
            type: 'logistics',
          },
        ],
        stats: { totalPosts: 2, activeParticipants: 2 },
      });


      await CollaborativeAlbum.create({
        event: event._id,
        title: `Recuerdos — ${event.metadata.title}`,
        photos: [],
        stats: { totalPhotos: 0, contributors: 0 },
      });
    }

    const quedadaEvent = events.find((e) => e.metadata.communitySlug === 'quedada');

    const squads = await Squad.create([
      {
        event: quedadaEvent._id,
        name: 'Squad Poké-Kennedy',
        plan: 'Cazar legendarios en Parque Kennedy — mismo equipo, incense compartido',
        activityTag: 'pokemon_go',
        communitySlug: 'quedada',
        leader: users[1]._id,
        maxSize: 5,
        status: 'recruiting',
        meetingPoint: 'Parque Kennedy, entrada principal',
        tags: ['pokemon', 'raid', '5/5'],
        members: [
          { user: users[1]._id, role: 'leader', status: 'active', planNote: 'Traigo incense y pasos' },
          { user: users[0]._id, role: 'member', status: 'active', planNote: 'Tengo Remote Raid Pass' },
          { user: users[2]._id, role: 'member', status: 'active', planNote: 'Team Mystic' },
          { user: users[3]._id, role: 'member', status: 'active', planNote: 'Puedo llevar power bank' },
        ],
      },
      {
        event: events[0]._id,
        name: 'Brigada Sur — Plantas',
        plan: 'Misma zona de reforestación, turno mañana',
        activityTag: 'voluntariado',
        communitySlug: 'voluntariado',
        leader: users[0]._id,
        maxSize: 8,
        status: 'recruiting',
        members: [
          { user: users[0]._id, role: 'leader', status: 'active', planNote: 'Guantes extra M/L' },
          { user: users[3]._id, role: 'member', status: 'active', planNote: 'Primera vez, motivado' },
        ],
      },
      {
        event: events[4]._id,
        name: 'Crew Festival',
        plan: 'Entrada juntos, mismo sector VIP lateral',
        activityTag: 'concierto',
        communitySlug: 'concierto',
        leader: users[1]._id,
        maxSize: 4,
        status: 'full',
        members: [
          { user: users[1]._id, role: 'leader', status: 'active' },
          { user: users[0]._id, role: 'member', status: 'active' },
          { user: users[2]._id, role: 'member', status: 'active' },
          { user: users[3]._id, role: 'member', status: 'active' },
        ],
      },
    ]);

    await Connection.create([
      { requester: users[0]._id, recipient: users[1]._id, status: 'accepted' },
      { requester: users[2]._id, recipient: users[3]._id, status: 'accepted' },
    ]);

    await Notification.create({
      user: users[3]._id,
      type: 'squad_full',
      title: '¡Falta 1 en Squad Poké-Kennedy!',
      body: '4/5 listos — únete con el mismo plan de raid',
      data: { squadId: squads[0]._id },
    });

    console.log(`\n  ✦ EventUs seed completado`);
    console.log(`  ✓ ${communities.length} comunidades con tema visual`);
    console.log(`  ✓ ${badges.length} insignias`);
    console.log(`  ✓ ${users.length} usuarios`);
    console.log(`  ✓ ${events.length} eventos`);
    console.log(`  ✓ ${squads.length} escuadras (ej: Pokémon 4/5)\n`);
    console.log('  Demo: demo@eventus.app / demo123\n');
    if (exitOnComplete) process.exit(0);
  } catch (error) {
    console.error('\n  ✗ Seed falló:', error);
    if (exitOnComplete) process.exit(1);
    throw error;
  }
};

module.exports = { seedData };

if (require.main === module) {
  seedData();
}
