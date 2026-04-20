const QRCode = require('qrcode');
const crypto = require('crypto');

const generateQRToken = async (userId, eventId) => {
  const uniquePayload = {
    userId,
    eventId,
    timestamp: Date.now(),
    nonce: crypto.randomBytes(8).toString('hex')
  };

  const tokenString = Buffer.from(JSON.stringify(uniquePayload)).toString('base64');

  try {
    const qrDataUrl = await QRCode.toDataURL(tokenString, {
      width: 300,
      margin: 2,
      color: {
        dark: '#c1c7cf',
        light: '#0e0e0e'
      }
    });
    return { token: tokenString, qrDataUrl };
  } catch (error) {
    console.error('QR generation error:', error);
    return { token: tokenString, qrDataUrl: null };
  }
};

module.exports = { generateQRToken };
