const Squad = require('../models/Squad');
const Event = require('../models/Event');
const { isEventActive } = require('../utils/eventSchedule');
const User = require('../models/User');
const { sendSquadJoin, sendSquadAlmostFull } = require('../services/emailService');
const { createNotification, notifySquadUpdate } = require('../services/notificationService');

const formatSquad = (squad) => {
  const obj = squad.toObject ? squad.toObject({ virtuals: true }) : squad;
  const active = (obj.members || []).filter((m) => m.status === 'active');
  return {
    ...obj,
    activeCount: active.length,
    slotsOpen: Math.max(0, obj.maxSize - active.length),
    membersPreview: active.slice(0, 5),
  };
};

const listOpenSquads = async (req, res) => {
  try {
    const { eventId, community, limit = 30, includePast } = req.query;
    const query = { status: { $in: ['recruiting', 'full'] } };
    if (eventId) query.event = eventId;
    if (community) query.communitySlug = community;

    const squads = await Squad.find(query)
      .populate('leader', 'profile.firstName profile.lastName profile.avatar')
      .populate('members.user', 'profile.firstName profile.lastName profile.avatar')
      .populate(
        'event',
        'metadata.title metadata.communitySlug metadata.coverImage schedule.date schedule.startTime schedule.endTime location.venue'
      )
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit, 10));

    const validSquads = squads.filter((s) => s.event != null);
    const recruiting = validSquads.filter(
      (s) => s.status === 'recruiting' || s.slotsOpen > 0
    );

    res.json({
      squads: validSquads.map(formatSquad),
      recruiting: recruiting.map(formatSquad),
      total: validSquads.length,
    });
  } catch (error) {
    console.error('listOpenSquads:', error);
    res.status(500).json({ error: 'No se pudieron cargar escuadras.' });
  }
};

const getMySquads = async (req, res) => {
  try {
    const squads = await Squad.find({
      status: { $nin: ['cancelled', 'completed'] },
      $or: [
        { leader: req.user._id },
        { 'members.user': req.user._id, 'members.status': 'active' },
      ],
    })
      .populate(
        'event',
        'metadata.title metadata.communitySlug metadata.coverImage schedule.date schedule.startTime schedule.endTime location.venue'
      )
      .populate('members.user', 'profile.firstName profile.lastName profile.avatar')
      .sort({ updatedAt: -1 });

    res.json({ squads: squads.map(formatSquad) });
  } catch (error) {
    res.status(500).json({ error: 'Error al cargar tus escuadras.' });
  }
};

const getSquadById = async (req, res) => {
  try {
    const squad = await Squad.findById(req.params.squadId)
      .populate('leader', 'profile.firstName profile.lastName profile.avatar profile.bio')
      .populate('members.user', 'profile.firstName profile.lastName profile.avatar profile.interests')
      .populate('event');
    if (!squad) return res.status(404).json({ error: 'Escuadra no encontrada.' });
    res.json({ squad: formatSquad(squad) });
  } catch (error) {
    res.status(500).json({ error: 'Error al cargar escuadra.' });
  }
};

const createSquad = async (req, res) => {
  try {
    const event = await Event.findById(req.body.eventId);
    if (!event) return res.status(404).json({ error: 'Evento no encontrado.' });
    const maxSize = req.body.maxSize || 5;
    const squad = await Squad.create({
      event: event._id,
      name: req.body.name,
      plan: req.body.plan,
      activityTag: req.body.activityTag || 'general',
      communitySlug: event.metadata.communitySlug,
      leader: req.user._id,
      maxSize,
      joinPolicy: req.body.joinPolicy || 'open',
      meetingPoint: req.body.meetingPoint || event.location.venue,
      requirements: req.body.requirements || {},
      tags: req.body.tags || [],
      members: [{
        user: req.user._id,
        role: 'leader',
        status: 'active',
        planNote: req.body.planNote || 'Organizo la escuadra',
        joinedAt: new Date(),
      }],
      status: maxSize <= 1 ? 'full' : 'recruiting',
    });

    await Event.findByIdAndUpdate(event._id, { $inc: { 'metrics.matchGroupsFormed': 1 } });

    const populated = await Squad.findById(squad._id)
      .populate('leader', 'profile.firstName profile.lastName profile.avatar')
      .populate('event', 'metadata.title');

    await createNotification(
      req.user._id,
      'squad_invite',
      'Escuadra creada',
      `"${squad.name}" — comparte para llenar ${maxSize - 1} cupos más.`,
      { squadId: squad._id, eventId: squad.event?._id || squad.event }
    );

    res.status(201).json({ squad: formatSquad(populated), message: 'Escuadra creada. ¡Invita a tu squad!' });
  } catch (error) {
    console.error('createSquad:', error);
    res.status(500).json({ error: 'No se pudo crear la escuadra.' });
  }
};

const leaveUserFromEventSquads = async (userId, eventId, exceptSquadId = null) => {
  const query = {
    event: eventId,
    'members.user': userId,
    'members.status': 'active',
  };
  if (exceptSquadId) query._id = { $ne: exceptSquadId };

  const others = await Squad.find(query);
  for (const s of others) {
    const member = s.members.find((m) => m.user.toString() === userId.toString());
    if (member) member.status = 'left';
    if (s.leader?.toString() === userId.toString()) {
      const next = s.members.find(
        (m) => m.status === 'active' && m.user.toString() !== userId.toString()
      );
      if (next) {
        s.leader = next.user;
        next.role = 'leader';
      } else {
        s.status = 'cancelled';
      }
    }
    s.syncStatus();
    await s.save();
  }
};

const joinSquad = async (req, res) => {
  try {
    const squad = await Squad.findById(req.params.squadId).populate('event');
    if (!squad) return res.status(404).json({ error: 'Escuadra no encontrada.' });

    const eventId = squad.event?._id || squad.event;

    const already = squad.members.find(
      (m) => m.user.toString() === req.user._id.toString() && m.status === 'active'
    );
    if (already) return res.status(400).json({ error: 'Ya estás en esta escuadra.' });

    await leaveUserFromEventSquads(req.user._id, eventId, squad._id);

    const activeCount = squad.members.filter((m) => m.status === 'active').length;
    if (activeCount >= squad.maxSize) {
      return res.status(400).json({ error: 'La escuadra está llena.', squad: formatSquad(squad) });
    }

    const pending = squad.members.find((m) => m.user.toString() === req.user._id.toString());
    if (pending) {
      pending.status = 'active';
      pending.planNote = req.body.planNote || pending.planNote;
      pending.joinedAt = new Date();
    } else {
      squad.members.push({
        user: req.user._id,
        role: 'member',
        status: squad.joinPolicy === 'approval' ? 'pending' : 'active',
        planNote: req.body.planNote || '',
        joinedAt: new Date(),
      });
    }

    squad.syncStatus();
    await squad.save();

    const populated = await Squad.findById(squad._id)
      .populate('members.user', 'profile.firstName profile.lastName profile.avatar')
      .populate('leader', 'profile.firstName profile.lastName profile.email')
      .populate('event');

    const formatted = formatSquad(populated);

    if (populated.members.find((m) => m.user._id.toString() === req.user._id.toString())?.status === 'active') {
      const user = await User.findById(req.user._id);
      await sendSquadJoin(user, formatted, populated.event);
      await notifySquadUpdate(populated, populated.event, `${user.profile.firstName} se unió al plan.`);
    }

    const slotsLeft = formatted.slotsOpen;
    if (slotsLeft === 1 && populated.leader) {
      await sendSquadAlmostFull(populated.leader, formatted);
      await createNotification(
        populated.leader._id,
        'squad_full',
        '¡Falta 1 persona!',
        `Tu escuadra "${squad.name}" está a un paso de completarse.`,
        { squadId: squad._id, eventId: squad.event?._id || squad.event }
      );
    }

    res.json({
      squad: formatted,
      switched: true,
      message:
        squad.joinPolicy === 'approval' && !already
          ? 'Solicitud enviada al líder.'
          : '¡Te uniste a la escuadra! (solo puedes estar en una por evento)',
    });
  } catch (error) {
    console.error('joinSquad:', error);
    res.status(500).json({ error: 'No se pudo unir a la escuadra.' });
  }
};

const leaveSquad = async (req, res) => {
  try {
    const squad = await Squad.findById(req.params.squadId);
    if (!squad) return res.status(404).json({ error: 'Escuadra no encontrada.' });

    const member = squad.members.find((m) => m.user.toString() === req.user._id.toString());
    if (!member) return res.status(400).json({ error: 'No perteneces a esta escuadra.' });

    member.status = 'left';
    if (squad.leader.toString() === req.user._id.toString()) {
      const next = squad.members.find((m) => m.status === 'active' && m.user.toString() !== req.user._id.toString());
      if (next) {
        squad.leader = next.user;
        next.role = 'leader';
      } else {
        squad.status = 'cancelled';
      }
    }

    squad.syncStatus();
    await squad.save();
    res.json({ message: 'Saliste de la escuadra.', squad: formatSquad(squad) });
  } catch (error) {
    res.status(500).json({ error: 'Error al salir de la escuadra.' });
  }
};

const approveMember = async (req, res) => {
  try {
    const squad = await Squad.findById(req.params.squadId);
    if (!squad) return res.status(404).json({ error: 'Escuadra no encontrada.' });
    if (squad.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Solo el líder puede aprobar.' });
    }

    const member = squad.members.find((m) => m.user.toString() === req.params.userId);
    if (!member) return res.status(404).json({ error: 'Miembro no encontrado.' });
    member.status = 'active';
    squad.syncStatus();
    await squad.save();

    await createNotification(member.user, 'squad_join', 'Solicitud aprobada', `Fuiste aceptado en "${squad.name}".`, {
      squadId: squad._id,
      eventId: squad.event?._id || squad.event,
    });

    res.json({ squad: formatSquad(squad), message: 'Miembro aprobado.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al aprobar.' });
  }
};

module.exports = {
  listOpenSquads,
  getMySquads,
  getSquadById,
  createSquad,
  joinSquad,
  leaveSquad,
  approveMember,
  formatSquad,
};
