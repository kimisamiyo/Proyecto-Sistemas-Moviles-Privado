/**
 * URLs reproducibles (Picsum) — landscape para portadas, cuadrado para avatares/insignias.
 */
const landscape = (seed, w = 1200, h = 675) =>
  `https://picsum.photos/seed/${encodeURIComponent(String(seed))}/${w}/${h}`;

const portrait = (seed, size = 400) =>
  `https://picsum.photos/seed/${encodeURIComponent(String(seed))}-p/${size}/${size}`;

const AVATARS = Array.from({ length: 12 }, (_, i) => portrait(`eventus-avatar-${i}`, 400));

const EVENT_COVERS = Array.from({ length: 12 }, (_, i) => landscape(`eventus-cover-${i}`));

const ALBUM_PHOTOS = Array.from({ length: 18 }, (_, i) => landscape(`eventus-album-${i}`, 900, 600));

const BADGE_ART = Array.from({ length: 16 }, (_, i) => portrait(`eventus-badge-${i}`, 256));

const pick = (arr, index) => arr[index % arr.length];

const pickAvatar = (index) => pick(AVATARS, index);
const pickCover = (index) => pick(EVENT_COVERS, index);
const pickAlbumPhoto = (index) => pick(ALBUM_PHOTOS, index);
const pickBadge = (index) => pick(BADGE_ART, index);

const coverForSlug = (slug) => landscape(`eventus-community-${slug}`);

module.exports = {
  landscape,
  portrait,
  AVATARS,
  EVENT_COVERS,
  ALBUM_PHOTOS,
  BADGE_ART,
  pickAvatar,
  pickCover,
  pickAlbumPhoto,
  pickBadge,
  coverForSlug,
};
