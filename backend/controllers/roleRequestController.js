const RoleRequest = require('../models/RoleRequest');
const User = require('../models/User');
const { createNotification } = require('../services/notificationService');

const submitRoleRequest = async (req, res) => {
  try {
    const { requestedRole, reason, experience, organization } = req.body;
    if (!['organizer', 'creator'].includes(requestedRole)) {
      return res.status(400).json({ error: 'Rol solicitado inválido.' });
    }
    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({ error: 'La razón debe tener al menos 10 caracteres.' });
    }

    const user = await User.findById(req.user._id);
    if (['organizer', 'creator', 'moderator', 'admin'].includes(user.role)) {
      return res.status(400).json({ error: 'Ya tienes permisos para crear eventos.' });
    }

    const existing = await RoleRequest.findOne({ user: req.user._id, status: 'pending' });
    if (existing) {
      return res.status(400).json({
        error: 'Ya tienes una solicitud pendiente. Espera la revisión del administrador.',
        existingRequest: { id: existing._id, createdAt: existing.createdAt },
      });
    }

    const request = await RoleRequest.create({
      user: req.user._id,
      requestedRole,
      reason: reason.trim(),
      experience: (experience || '').trim(),
      organization: (organization || '').trim(),
    });

    res.status(201).json({
      request,
      message: 'Solicitud enviada. Un administrador la revisará pronto.',
    });
  } catch (error) {
    console.error('submitRoleRequest:', error);
    res.status(500).json({ error: 'No se pudo enviar la solicitud.' });
  }
};

const getMyRoleRequests = async (req, res) => {
  try {
    const requests = await RoleRequest.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json({ requests });
  } catch (error) {
    res.status(500).json({ error: 'Error al cargar solicitudes.' });
  }
};

const getPendingRequests = async (req, res) => {
  try {
    const requests = await RoleRequest.find({ status: 'pending' })
      .populate('user', 'email profile.firstName profile.lastName profile.avatar role')
      .sort({ createdAt: 1 });
    res.json({ requests, total: requests.length });
  } catch (error) {
    res.status(500).json({ error: 'Error al cargar solicitudes.' });
  }
};

const reviewRoleRequest = async (req, res) => {
  try {
    const { action, reviewNote } = req.body;
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Acción inválida.' });
    }

    const reviewer = await User.findById(req.user._id);
    if (!['admin', 'moderator'].includes(reviewer.role)) {
      return res.status(403).json({ error: 'Solo administradores pueden revisar solicitudes.' });
    }

    const request = await RoleRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ error: 'Solicitud no encontrada.' });
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Esta solicitud ya fue revisada.' });
    }

    request.status = action === 'approve' ? 'approved' : 'rejected';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    request.reviewNote = (reviewNote || '').trim();
    await request.save();

    if (action === 'approve') {
      await User.findByIdAndUpdate(request.user, {
        role: request.requestedRole,
        'creatorProfile.isCreator': true,
      });
      await createNotification(
        request.user,
        'welcome',
        '¡Solicitud aprobada!',
        `Ahora eres ${request.requestedRole}. Ya puedes crear eventos.`,
        {}
      ).catch(() => {});
    } else {
      await createNotification(
        request.user,
        'welcome',
        'Solicitud no aprobada',
        request.reviewNote || 'Tu solicitud de rol no fue aprobada en esta ocasión.',
        {}
      ).catch(() => {});
    }

    res.json({ request, message: `Solicitud ${action === 'approve' ? 'aprobada' : 'rechazada'}.` });
  } catch (error) {
    console.error('reviewRoleRequest:', error);
    res.status(500).json({ error: 'Error al revisar solicitud.' });
  }
};

module.exports = {
  submitRoleRequest,
  getMyRoleRequests,
  getPendingRequests,
  reviewRoleRequest,
};
