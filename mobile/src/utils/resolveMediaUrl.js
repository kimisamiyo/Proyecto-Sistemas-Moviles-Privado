import config from '../config';

/** Convierte rutas relativas /uploads/... en URL absoluta del backend. */
export default function resolveMediaUrl(url) {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const base = config.API_URL.replace(/\/api\/v1\/?$/, '');
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${base}${path}`;
}
