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
const Ticket = require('./models/Ticket');
const MatchGroup = require('./models/MatchGroup');
const { generateQRToken } = require('./utils/qrGenerator');
const { pickAvatar, pickCover, pickAlbumPhoto, pickBadge, coverForSlug } = require('./config/demoImages');

const lima = (lng, lat) => ({ type: 'Point', coordinates: [lng, lat] });

const seedData = async ({ exitOnComplete = true } = {}) => {
  try {
    if (mongoose.connection.readyState === 0) {
      await connectDB();
    }
    console.log('\n  ⟐ EventUs — reiniciando base de datos...\n');

    const collections = [
      User, Event, CommunityType, Badge, EventWall, Squad, Notification,
      CollaborativeAlbum, Discourse, Message, Connection, Ticket, MatchGroup,
    ];
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
        theme: { ...c.theme, bannerImage: coverForSlug(c.slug) },
        matchmaking: c.matchmaking,
        badgeSlugs: c.badges,
        sortOrder: i,
      }))
    );

    console.log('  ⟐ Catálogo de insignias...');
    const badges = await Badge.insertMany(
      BADGE_CATALOG.map((b, i) => ({
        ...b,
        imageUrl: pickBadge(i),
        communitySlugs: COMMUNITY_THEMES.filter((c) => c.badges.includes(b.slug)).map((c) => c.slug),
      }))
    );
    const badgeBySlug = Object.fromEntries(badges.map((b) => [b.slug, b]));

    console.log('  ⟐ Usuarios (1 por rol — equipo URP + moderador/admin demo)...');
    // Índices: [0]=organizer, [1]=creator, [2]=member, [3]=moderator, [4]=admin
    const users = await User.create([
      {
        role: 'organizer',
        email: 'mayrol.ortiz@gmail.com',
        passwordHash: 'demo123',
        profile: {
          firstName: 'Mayrol',
          lastName: 'Ortiz',
          bio: 'Organizador principal — eventos con impacto URP.',
          title: 'Organizador EventUs',
          avatar: pickAvatar(0),
          interests: ['voluntariado', 'medio ambiente'],
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
        role: 'creator',
        email: '202211307@urp.edu.pe',
        passwordHash: 'demo123',
        profile: {
          firstName: 'Creador',
          lastName: 'URP 307',
          bio: 'Creador de quedadas, lives y escuadras.',
          title: 'Creador de contenido',
          avatar: pickAvatar(1),
          interests: ['quedadas', 'cultura', 'concierto'],
          communityAffinities: ['quedada', 'concierto'],
        },
        badges: [{ slug: 'anfitrion_quedada', badge: badgeBySlug.anfitrion_quedada._id }],
        metrics: { eventsAttended: 20, eventsCreated: 5, impactPoints: 210, invitesSent: 40 },
        creatorProfile: { isCreator: true, eventsPublished: 5 },
        location: lima(-77.03, -12.12),
        isOnline: true,
      },
      {
        role: 'member',
        email: '202220906@urp.edu.pe',
        passwordHash: 'demo123',
        profile: {
          firstName: 'Miembro',
          lastName: 'URP 906',
          bio: 'Explora eventos, escuadras e inscripciones.',
          title: 'Miembro URP',
          avatar: pickAvatar(2),
          interests: ['voluntariado', 'quedada', 'deporte'],
          communityAffinities: ['quedada', 'voluntariado'],
        },
        badges: [{ slug: 'radar_activo', badge: badgeBySlug.radar_activo._id }],
        metrics: { eventsAttended: 5, impactPoints: 55, invitesSent: 3 },
        location: lima(-76.96, -12.11),
        isOnline: true,
      },
      {
        role: 'moderator',
        email: 'moderador@eventus.app',
        passwordHash: 'demo123',
        profile: {
          firstName: 'Moderador',
          lastName: 'EventUs',
          bio: 'Modera muros, escuadras y reportes.',
          title: 'Moderador',
          avatar: pickAvatar(3),
          interests: ['cultura', 'deporte'],
          communityAffinities: ['cultura'],
        },
        badges: [{ slug: 'radar_activo', badge: badgeBySlug.radar_activo._id }],
        metrics: { eventsAttended: 10, impactPoints: 120, invitesSent: 15 },
        location: lima(-77.0, -12.1),
        isOnline: true,
      },
      {
        role: 'admin',
        email: 'admin@eventus.app',
        passwordHash: 'demo123',
        profile: {
          firstName: 'Admin',
          lastName: 'EventUs',
          bio: 'Administración global de la plataforma.',
          title: 'Administrador',
          avatar: pickAvatar(4),
          interests: ['voluntariado', 'benefico'],
          communityAffinities: ['voluntariado'],
        },
        badges: [
          { slug: 'guardian_verde', badge: badgeBySlug.guardian_verde._id },
          { slug: 'embajador_causa', badge: badgeBySlug.embajador_causa._id },
        ],
        metrics: { eventsAttended: 30, eventsCreated: 10, impactPoints: 900, invitesSent: 100 },
        creatorProfile: { isCreator: true, verifiedOrganizer: true, eventsPublished: 10 },
        location: lima(-76.95, -12.08),
        isOnline: true,
      },
    ]);

    let eventCoverIdx = 0;
    const mkEvent = (data) => ({
      ...data,
      metadata: {
        ...data.metadata,
        coverImage: data.metadata?.coverImage || pickCover(eventCoverIdx++),
      },
    });

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
        attendees: [users[2]._id],
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
        hosts: [{ userId: users[0]._id, role: 'Organizador' }],
        isFeatured: true,
        createdBy: users[0]._id,
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
        attendees: [users[2]._id],
        isLive: true,
        createdBy: users[1]._id,
        speakers: [{ userId: users[1]._id, role: 'Anfitrión' }],
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
        speakers: [{ userId: users[1]._id, role: 'DJ invitado' }],
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
        createdBy: users[0]._id,
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

    console.log('  ⟐ Muros, álbumes y mensajes...');
    let albumIdx = 0;
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const authorPool = [users[0], users[1], users[2], users[3], users[4]];
      await EventWall.create({
        event: event._id,
        posts: [
          {
            author: event.createdBy,
            content: `¡Bienvenidos al muro de "${event.metadata.title}"! Rompan el hielo y coordinen logística aquí.`,
            type: 'announcement',
            isPinned: true,
          },
          {
            author: authorPool[i % authorPool.length]._id,
            content: '¿Alguien va desde Surco? Podemos ir en escuadra.',
            type: 'logistics',
          },
          {
            author: users[2]._id,
            content: 'Primera vez en este tipo de evento — ¡emocionado! 🌱',
            type: 'icebreaker',
          },
        ],
        stats: { totalPosts: 3, activeParticipants: 3 },
      });

      const photos = [0, 1, 2].map((j) => ({
        url: pickAlbumPhoto(albumIdx + j),
        caption: `Momento ${j + 1} — ${event.metadata.title}`,
        uploader: authorPool[(i + j) % authorPool.length]._id,
        status: 'approved',
        reviewedAt: new Date(),
      }));
      albumIdx += 3;

      await CollaborativeAlbum.create({
        event: event._id,
        title: `Recuerdos — ${event.metadata.title}`,
        photos,
        stats: { totalPhotos: photos.length, contributors: 2 },
      });
    }

    await Message.insertMany([
      {
        sender: users[1]._id,
        receiver: users[2]._id,
        content: '¡Hola! ¿Te unes a la quedada de board games el viernes?',
        read: false,
      },
      {
        sender: users[2]._id,
        receiver: users[1]._id,
        content: 'Sí, me apunto. ¿Llevo algún juego?',
        read: true,
      },
      {
        sender: users[0]._id,
        receiver: users[2]._id,
        content: 'Gracias por inscribirte a la brigada verde. Trae botella reutilizable.',
        read: false,
      },
      {
        sender: users[2]._id,
        receiver: users[2]._id,
        content: 'La feria solidaria necesita 2 voluntarios más para la entrada.',
        read: false,
      },
      {
        sender: users[4]._id,
        receiver: users[2]._id,
        content: 'Recuerda revisar las notificaciones de tu escuadra.',
        read: false,
      },
    ]);

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
          { user: users[2]._id, role: 'member', status: 'active', planNote: 'Primera vez, motivado' },
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

    console.log('  ⟐ Entradas (tickets) y billetera del miembro URP...');
    const member = await User.findById(users[2]._id);
    const seedTicket = async (eventDoc) => {
      const { token, tokenHash, expiresAt } = await generateQRToken(member._id, eventDoc._id, 0);
      const ticket = await Ticket.create({
        user: member._id,
        event: eventDoc._id,
        tokenHash,
        expiresAt,
        rotationIndex: 0,
      });
      const alreadyInWallet = member.wallet.some(
        (w) => String(w.eventId) === String(eventDoc._id)
      );
      if (!alreadyInWallet) {
        member.wallet.push({
          eventId: eventDoc._id,
          ticketId: ticket._id,
          qrToken: token,
          accessType: 'Entrada EventUs',
          issuedAt: new Date(),
        });
      }
      return ticket;
    };

    await seedTicket(events[0]);
    await seedTicket(events[2]);
    await seedTicket(events[4]);
    member.metrics.eventsAttended = Math.max(member.metrics.eventsAttended, 3);
    await member.save();

    await MatchGroup.create({
      event: quedadaEvent._id,
      communitySlug: 'quedada',
      name: 'Mesa 1 — Estrategia',
      maxSize: 6,
      status: 'forming',
      createdBy: users[1]._id,
      members: [
        { user: users[1]._id, status: 'accepted', affinityScore: 88 },
        { user: users[2]._id, status: 'accepted', affinityScore: 72 },
        { user: users[0]._id, status: 'accepted', affinityScore: 65 },
      ],
    });

    await Connection.create([
      { requester: users[0]._id, recipient: users[1]._id, status: 'accepted' },
      { requester: users[1]._id, recipient: users[2]._id, status: 'accepted' },
    ]);

    await Notification.insertMany([
      {
        user: users[2]._id,
        type: 'squad_full',
        title: '¡Falta 1 en Squad Poké-Kennedy!',
        body: '4/5 listos — únete con el mismo plan de raid',
        data: { squadId: squads[0]._id },
        read: false,
      },
      {
        user: users[2]._id,
        type: 'event_register',
        title: 'Inscripción confirmada',
        body: `Tu entrada para "${events[0].metadata.title}" está en Mis entradas`,
        data: { eventId: events[0]._id },
        read: false,
      },
      {
        user: users[2]._id,
        type: 'event_register',
        title: 'Inscripción confirmada',
        body: `QR activo — ${events[2].metadata.title}`,
        data: { eventId: events[2]._id },
        read: true,
      },
      {
        user: users[2]._id,
        type: 'squad_invite',
        title: 'Te invitaron a una escuadra',
        body: '¿Te unes a la quedada de board games?',
        read: false,
      },
      {
        user: users[0]._id,
        type: 'badge_earned',
        title: 'Nueva inscripción',
        body: 'Un miembro URP se unió a tu brigada',
        read: true,
      },
    ]);

    console.log(`\n  ✦ EventUs seed completado`);
    console.log(`  ✓ ${communities.length} comunidades con tema visual`);
    console.log(`  ✓ ${badges.length} insignias`);
    console.log(`  ✓ ${users.length} usuarios`);
    console.log(`  ✓ ${events.length} eventos`);
    console.log(`  ✓ ${squads.length} escuadras`);
    console.log(`  ✓ 3 entradas en billetera del miembro (202220906@urp.edu.pe)\n`);
    console.log('  Roles en la app (5) — contraseña: demo123');
    console.log('    • member     → 202220906@urp.edu.pe');
    console.log('    • creator    → 202211307@urp.edu.pe');
    console.log('    • organizer  → mayrol.ortiz@gmail.com');
    console.log('    • moderator  → moderador@eventus.app');
    console.log('    • admin      → admin@eventus.app\n');
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
