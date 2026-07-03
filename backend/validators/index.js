const { body, param, query } = require('express-validator');

// gmail_remove_dots: false — sin esto, "nombre.apellido@gmail.com" se
// normaliza a "nombreapellido@gmail.com" y el login nunca encuentra al usuario.
const emailNormalization = { gmail_remove_dots: false };

const registerRules = [
  body('email').isEmail().normalizeEmail(emailNormalization).withMessage('Correo inválido'),
  body('password').isLength({ min: 6 }).withMessage('Mínimo 6 caracteres'),
  body('firstName').trim().notEmpty().isLength({ max: 50 }).withMessage('Nombre requerido'),
  body('lastName').trim().notEmpty().isLength({ max: 50 }).withMessage('Apellido requerido'),
];

const loginRules = [
  body('email').isEmail().normalizeEmail(emailNormalization),
  body('password').notEmpty(),
];

const createSquadRules = [
  body('eventId').isMongoId(),
  body('name').trim().isLength({ min: 3, max: 80 }),
  body('plan').trim().isLength({ min: 5, max: 300 }).withMessage('Describe el plan del grupo'),
  body('maxSize').optional().isInt({ min: 2, max: 30 }),
  body('activityTag').optional().trim().isLength({ max: 40 }),
  body('joinPolicy').optional().isIn(['open', 'approval']),
  body('planNote').optional().trim().isLength({ max: 200 }),
];

const joinSquadRules = [
  param('squadId').isMongoId(),
  body('planNote').optional().trim().isLength({ max: 200 }),
];

const createEventRules = [
  body('title').trim().isLength({ min: 5, max: 120 }),
  body('description').trim().isLength({ min: 20, max: 2000 }),
  body('communitySlug').trim().notEmpty(),
  body('schedule.date').isISO8601(),
  body('schedule.startTime').matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('Hora inicio HH:MM'),
  body('schedule.endTime').matches(/^([01]\d|2[0-3]):[0-5]\d$/),
  body('location.venue').trim().notEmpty(),
  body('capacity.max').isInt({ min: 2, max: 5000 }),
];

const wallPostRules = [
  param('eventId').isMongoId(),
  body('content').trim().isLength({ min: 2, max: 2000 }),
  body('type').optional().isIn(['general', 'logistics', 'icebreaker', 'question', 'announcement']),
];

const radarRules = [
  query('longitude').isFloat({ min: -180, max: 180 }),
  query('latitude').isFloat({ min: -90, max: 90 }),
  query('radius').optional().isInt({ min: 100, max: 50000 }),
];

module.exports = {
  registerRules,
  loginRules,
  createSquadRules,
  joinSquadRules,
  createEventRules,
  wallPostRules,
  radarRules,
};
