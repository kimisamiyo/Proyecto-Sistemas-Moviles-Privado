const nodemailer = require('nodemailer');

const APP_NAME = 'EventUs';
const PUBLIC_URL = process.env.PUBLIC_APP_URL || process.env.NGROK_URL || 'http://localhost:8081';
const API_URL = process.env.PUBLIC_API_URL || process.env.NGROK_API_URL || 'http://localhost:5000';

let transporter;

const getTransporter = () => {
  if (transporter) return transporter;
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  } else {
    transporter = nodemailer.createTransport({
      jsonTransport: true,
    });
    console.log('  ⚠ Email en modo JSON (configura SMTP_HOST o revisa logs). Usa NGROK_URL para enlaces.');
  }
  return transporter;
};

const baseTemplate = (title, bodyHtml, ctaLabel, ctaHref) => `
<!DOCTYPE html><html><body style="font-family:Manrope,Arial,sans-serif;background:#0e0e0e;color:#e7e5e5;padding:24px">
  <div style="max-width:520px;margin:0 auto;background:#1f2020;border-radius:16px;padding:28px;border:1px solid #41474e">
    <p style="color:#6bcb77;font-size:11px;letter-spacing:2px;margin:0 0 8px">EVENTUS</p>
    <h1 style="font-size:22px;margin:0 0 16px">${title}</h1>
    <div style="color:#c1c7cf;line-height:1.6">${bodyHtml}</div>
    ${ctaHref ? `<p style="margin-top:24px"><a href="${ctaHref}" style="background:#6bcb77;color:#0a1f12;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:700">${ctaLabel}</a></p>` : ''}
    <p style="font-size:11px;color:#767575;margin-top:32px">Enlaces vía túnel: ${PUBLIC_URL}</p>
  </div>
</body></html>`;

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const info = await getTransporter().sendMail({
      from: process.env.EMAIL_FROM || `"${APP_NAME}" <noreply@eventus.app>`,
      to,
      subject: `[${APP_NAME}] ${subject}`,
      html,
      text: text || subject,
    });
    if (process.env.NODE_ENV !== 'production' && info.message) {
      console.log(`  ✉ Email → ${to}: ${subject}`);
    }
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    console.error('Email error:', err.message);
    return { ok: false, error: err.message };
  }
};

const sendWelcome = (user) =>
  sendEmail({
    to: user.email,
    subject: 'Bienvenido a EventUs',
    html: baseTemplate(
      `¡Hola ${user.profile.firstName}!`,
      `<p>Tu cuenta está lista. Descubre eventos con propósito, únete a <strong>escuadras</strong> y no vayas solo a ninguna actividad.</p>`,
      'Abrir EventUs',
      PUBLIC_URL
    ),
  });

const sendSquadJoin = (user, squad, event) =>
  sendEmail({
    to: user.email,
    subject: `Te uniste a la escuadra "${squad.name}"`,
    html: baseTemplate(
      '¡Escuadra confirmada!',
      `<p><strong>${squad.name}</strong></p><p>Plan: ${squad.plan}</p><p>Evento: ${event.metadata.title}</p><p>Cupos: ${squad.activeCount || squad.members?.length}/${squad.maxSize}</p>`,
      'Ver escuadra',
      `${PUBLIC_URL}/event/${event._id}`
    ),
  });

const sendSquadAlmostFull = (leader, squad) =>
  sendEmail({
    to: leader.email,
    subject: `¡A ${squad.name} le falta 1 persona!`,
    html: baseTemplate(
      'Casi completo',
      `<p>Tu escuadra tiene <strong>${squad.slotsOpen === 1 ? '1 cupo' : squad.slotsOpen + ' cupos'}</strong> disponible(s). Comparte el enlace para llenar el grupo.</p>`,
      'Invitar por WhatsApp',
      `${API_URL}/api/v1/eventus/events/${squad.event}/invite/whatsapp`
    ),
  });

const sendEventRegistration = (user, event, ticket) =>
  sendEmail({
    to: user.email,
    subject: `Entrada: ${event.metadata.title}`,
    html: baseTemplate(
      'Registro confirmado',
      `<p>Tu QR dinámico se renueva cada ${ticket.ttlSeconds || 90} segundos anti-fraude.</p><p>${event.location.venue} · ${event.schedule.startTime}</p>`,
      'Ver entrada',
      `${PUBLIC_URL}/wallet`
    ),
  });

module.exports = {
  sendEmail,
  sendWelcome,
  sendSquadJoin,
  sendSquadAlmostFull,
  sendEventRegistration,
  PUBLIC_URL,
  API_URL,
};
