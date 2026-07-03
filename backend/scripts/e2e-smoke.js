/**
 * Smoke test E2E del flujo EventUs contra la API corriendo en localhost:5000.
 * Uso: node scripts/e2e-smoke.js
 */
const BASE = 'http://localhost:5000/api/v1';

let passed = 0;
let failed = 0;

const ok = (label, cond, extra = '') => {
  if (cond) {
    passed += 1;
    console.log(`  ✓ ${label}${extra ? ` — ${extra}` : ''}`);
  } else {
    failed += 1;
    console.log(`  ✗ ${label}${extra ? ` — ${extra}` : ''}`);
  }
};

const api = async (method, path, { token, body } = {}) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let data = null;
  try { data = await res.json(); } catch {}
  return { status: res.status, data };
};

(async () => {
  console.log('\n— Auth —');
  const member = await api('POST', '/auth/login', { body: { email: '202220906@urp.edu.pe', password: 'demo123' } });
  ok('Login member', member.status === 200 && member.data.token);
  const organizer = await api('POST', '/auth/login', { body: { email: 'mayrol.ortiz@gmail.com', password: 'demo123' } });
  ok('Login organizer', organizer.status === 200 && organizer.data.token);
  const creator = await api('POST', '/auth/login', { body: { email: '202211307@urp.edu.pe', password: 'demo123' } });
  ok('Login creator', creator.status === 200 && creator.data.token);
  const mTok = member.data.token;
  const oTok = organizer.data.token;
  const cTok = creator.data.token;

  console.log('\n— Descubrimiento —');
  const explore = await api('GET', '/events/explore', { token: mTok });
  ok('Explore', explore.status === 200 && explore.data.events?.length > 0, `${explore.data.events?.length} eventos`);
  const radar = await api('GET', '/events/radar?longitude=-77.03&latitude=-12.09&radius=20000', { token: mTok });
  ok('Radar geoespacial', radar.status === 200, `${radar.data.nearbyEvents?.length ?? '?'} eventos cerca`);

  // Evento creado por el organizador para poder validar check-in
  const all = await api('GET', '/events/all', { token: oTok });
  let target = null;
  for (const e of all.data.events || []) {
    const detail = await api('GET', `/events/${e._id}`, { token: oTok });
    const createdBy = detail.data.event?.createdBy?._id || detail.data.event?.createdBy;
    const meId = organizer.data.user?.id || organizer.data.user?._id;
    if (String(createdBy) === String(meId)) { target = detail.data.event; break; }
  }
  ok('Evento del organizador encontrado', !!target, target?.metadata?.title);
  if (!target) process.exit(1);
  const evId = target._id;

  console.log('\n— Inscripción y QR dinámico —');
  const reg = await api('POST', `/events/register/${evId}`, { token: mTok });
  ok('Inscripción member', reg.status === 200 && reg.data.ticket?.qrDataUrl, reg.data.message);
  const ticket = await api('GET', `/events/${evId}/ticket`, { token: mTok });
  ok('Obtener ticket', ticket.status === 200 && ticket.data.ticket?.qrToken);
  const refreshed = await api('POST', `/events/${evId}/ticket/refresh`, { token: mTok });
  ok('Rotar QR', refreshed.status === 200 && refreshed.data.token, `rotationIndex=${refreshed.data.ticket?.rotationIndex}`);
  const staleToken = ticket.data.ticket.qrToken;
  const freshToken = refreshed.data.token;

  console.log('\n— Check-in anti-fraude —');
  const staleAttempt = await api('POST', `/eventus/events/${evId}/checkin`, { token: oTok, body: { token: staleToken } });
  ok('Rechaza QR obsoleto (anti-captura)', staleAttempt.status === 409 || staleAttempt.status === 400, staleAttempt.data?.reason);
  const goodCheckin = await api('POST', `/eventus/events/${evId}/checkin`, { token: oTok, body: { token: freshToken } });
  ok('Check-in válido', goodCheckin.status === 200 && goodCheckin.data.success, goodCheckin.data.attendee?.fullName);
  const reuse = await api('POST', `/eventus/events/${evId}/checkin`, { token: oTok, body: { token: freshToken } });
  ok('Rechaza re-uso de entrada', reuse.status === 409 && reuse.data.reason === 'already_used');
  const memberScan = await api('POST', `/eventus/events/${evId}/checkin`, { token: mTok, body: { token: freshToken } });
  ok('Member no puede escanear (403)', memberScan.status === 403);

  console.log('\n— Insignias automáticas —');
  await new Promise((r) => setTimeout(r, 800));
  const badges = await api('GET', '/eventus/badges/wall', { token: mTok });
  const slugs = (badges.data.badges || []).map((b) => b.slug);
  ok('Insignia por check-in verificado', slugs.includes('entrada_verificada'), slugs.join(', ') || 'sin insignias');
  ok('Insignia por asistencia', slugs.includes('primera_brigada'));

  console.log('\n— Muro y reacciones —');
  const post = await api('POST', `/eventus/events/${evId}/wall`, { token: mTok, body: { content: 'Prueba E2E: ¡nos vemos en el evento!', type: 'icebreaker' } });
  ok('Publicar en muro', post.status === 200 && post.data.wall);
  const postId = post.data.wall?.posts?.slice(-1)[0]?._id;
  const react = await api('POST', `/eventus/events/${evId}/wall/${postId}/react`, { token: oTok, body: { emoji: '❤️' } });
  ok('Reaccionar a post', react.status === 200 && react.data.reacted === true);
  const unreact = await api('POST', `/eventus/events/${evId}/wall/${postId}/react`, { token: oTok, body: { emoji: '❤️' } });
  ok('Quitar reacción (toggle)', unreact.status === 200 && unreact.data.reacted === false);

  console.log('\n— Matchmaking con afinidad —');
  const join = await api('POST', `/eventus/events/${evId}/groups/join`, { token: mTok });
  ok('Unirse a matchmaking', join.status === 200 && join.data.group, join.data.message);
  const score = join.data.group?.members?.find((m) => m.user)?.affinityScore;
  ok('Score de afinidad calculado', typeof score === 'number' && score >= 40 && score <= 99, `score=${score}`);
  const dupJoin = await api('POST', `/eventus/events/${evId}/groups/join`, { token: mTok });
  ok('Evita doble grupo', dupJoin.status === 400);

  console.log('\n— Invitación WhatsApp / deep link —');
  const invite = await api('GET', `/eventus/events/${evId}/invite/whatsapp`, { token: mTok });
  ok('Enlace WhatsApp', invite.status === 200 && invite.data.whatsappUrl?.includes('wa.me'));
  ok('Deep link eventus://', invite.data.deepLink?.startsWith('eventus://event/'));

  console.log('\n— Modo creador + panel de métricas —');
  const newEvent = await api('POST', '/eventus/events', {
    token: cTok,
    body: {
      title: 'Prueba E2E — Quedada de validación',
      description: 'Evento creado por el smoke test para validar el modo creador end to end.',
      communitySlug: 'quedada',
      schedule: { date: new Date(Date.now() + 5 * 86400000).toISOString(), startTime: '18:00', endTime: '21:00' },
      location: { venue: 'Parque Kennedy', coordinates: { type: 'Point', coordinates: [-77.03, -12.12] } },
      capacity: { max: 20 },
    },
  });
  ok('Crear evento (modo creador)', newEvent.status === 201 && newEvent.data.event?._id);
  const metrics = await api('GET', `/eventus/events/${evId}/metrics`, { token: oTok });
  ok('Métricas por evento', metrics.status === 200 && metrics.data.metrics?.checkIns >= 1, `checkIns=${metrics.data.metrics?.checkIns}`);
  const dash = await api('GET', '/eventus/creator/dashboard', { token: cTok });
  ok('Dashboard del creador', dash.status === 200 && dash.data.totals?.eventsPublished >= 1, `${dash.data.totals?.eventsPublished} iniciativas`);

  await new Promise((r) => setTimeout(r, 600));
  const cBadges = await api('GET', '/eventus/badges/wall', { token: cTok });
  const cSlugs = (cBadges.data.badges || []).map((b) => b.slug);
  ok('Insignia anfitrión de quedada', cSlugs.includes('anfitrion_quedada'), cSlugs.join(', '));

  console.log('\n— Álbum colaborativo —');
  const photo = await api('POST', `/eventus/events/${evId}/album`, { token: mTok, body: { url: 'https://picsum.photos/seed/e2e/800/600', caption: 'Recuerdo E2E' } });
  ok('Subir foto (queda pendiente)', photo.status === 201);
  const albumMod = await api('GET', `/eventus/events/${evId}/album`, { token: oTok });
  const pending = albumMod.data?.moderationQueue?.[0];
  ok('Cola de moderación visible', !!pending);
  if (pending) {
    const approve = await api('PATCH', `/eventus/events/${evId}/album/photos/${pending._id}`, { token: oTok, body: { action: 'approve' } });
    ok('Aprobar foto', approve.status === 200);
  }

  console.log('\n— Notificaciones —');
  const notifs = await api('GET', '/notifications', { token: mTok });
  const types = (notifs.data.notifications || []).map((n) => n.type);
  ok('Notificaciones generadas', notifs.status === 200 && types.includes('badge_earned'), [...new Set(types)].join(', '));

  console.log(`\n═══ Resultado: ${passed} OK / ${failed} fallidos ═══\n`);
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error('Fallo inesperado:', e.message);
  process.exit(1);
});
