const QRCode = require('qrcode');
const crypto = require('crypto');

const QR_TTL_SECONDS = parseInt(process.env.QR_TTL_SECONDS || '90', 10);

const buildPayload = (userId, eventId, rotationIndex = 0) => ({
  v: 2,
  userId: userId.toString(),
  eventId: eventId.toString(),
  rotationIndex,
  issuedAt: Date.now(),
  nonce: crypto.randomBytes(6).toString('hex'),
});

const hashToken = (payload) =>
  crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');

const generateQRToken = async (userId, eventId, rotationIndex = 0) => {
  const payload = buildPayload(userId, eventId, rotationIndex);
  const tokenString = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const tokenHash = hashToken(payload);
  const expiresAt = new Date(Date.now() + QR_TTL_SECONDS * 1000);

  try {
    // QR estándar (módulos oscuros sobre fondo claro): máxima compatibilidad de escaneo
    const qrDataUrl = await QRCode.toDataURL(tokenString, {
      width: 300,
      margin: 2,
      color: { dark: '#1a1c1b', light: '#ffffff' },
    });
    return {
      token: tokenString,
      tokenHash,
      qrDataUrl,
      expiresAt,
      rotationIndex,
      ttlSeconds: QR_TTL_SECONDS,
    };
  } catch (error) {
    console.error('QR generation error:', error);
    return { token: tokenString, tokenHash, qrDataUrl: null, expiresAt, rotationIndex, ttlSeconds: QR_TTL_SECONDS };
  }
};

const verifyQRToken = (tokenString) => {
  try {
    const payload = JSON.parse(Buffer.from(tokenString, 'base64url').toString());
    const ageMs = Date.now() - payload.issuedAt;
    if (ageMs > QR_TTL_SECONDS * 1000) {
      return { valid: false, reason: 'expired' };
    }
    return { valid: true, payload, tokenHash: hashToken(payload) };
  } catch {
    return { valid: false, reason: 'invalid' };
  }
};

module.exports = {
  generateQRToken,
  verifyQRToken,
  hashToken,
  buildPayload,
  QR_TTL_SECONDS,
};
