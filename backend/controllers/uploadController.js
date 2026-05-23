const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const UPLOAD_DIR = path.join(__dirname, '../uploads');

const publicBaseUrl = (req) => {
  if (process.env.API_PUBLIC_URL) {
    return process.env.API_PUBLIC_URL.replace(/\/$/, '');
  }
  const proto = req.get('x-forwarded-proto') || req.protocol;
  const host = req.get('x-forwarded-host') || req.get('host');
  return `${proto}://${host}`;
};

const saveBase64Image = (dataUrl) => {
  const match = String(dataUrl).match(/^data:image\/(\w+);base64,(.+)$/);
  if (!match) {
    throw new Error('Formato de imagen inválido.');
  }
  const ext = match[1] === 'png' ? 'png' : 'jpg';
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length > 6 * 1024 * 1024) {
    throw new Error('La imagen supera el límite de 6 MB.');
  }
  const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  fs.writeFileSync(path.join(UPLOAD_DIR, name), buffer);
  return name;
};

const uploadImage = async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Imagen requerida.' });
    }
    const filename = saveBase64Image(image);
    const url = `${publicBaseUrl(req)}/uploads/${filename}`;
    res.status(201).json({ url, filename });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(400).json({ error: error.message || 'No se pudo guardar la imagen.' });
  }
};

module.exports = { uploadImage };
