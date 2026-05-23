import { hashSeed } from './responsive';
import resolveMediaUrl from './resolveMediaUrl';

export const landscapeUrl = (seed, w = 1200, h = 675) =>
  `https://picsum.photos/seed/${encodeURIComponent(String(seed))}/${w}/${h}`;

export const portraitUrl = (seed, size = 400) =>
  `https://picsum.photos/seed/${encodeURIComponent(String(seed))}-p/${size}/${size}`;

export function getEventCover(event) {
  const url = event?.metadata?.coverImage;
  if (url) return resolveMediaUrl(url);
  const seed = `event-${hashSeed(String(event?._id || event?.metadata?.title || 'event'))}`;
  return landscapeUrl(seed);
}

export function getSquadCover(squad) {
  const fromEvent = squad?.event?.metadata?.coverImage;
  if (fromEvent) return fromEvent;
  const seed = `squad-${hashSeed(String(squad?._id || squad?.name || 'squad'))}`;
  return landscapeUrl(seed, 900, 500);
}

export function getBadgeArt(badge) {
  if (badge?.imageUrl) return badge.imageUrl;
  const slug = badge?.slug || badge?.badge?.slug || 'badge';
  return portraitUrl(`badge-${slug}`, 256);
}

export function getAvatarUrl(userOrProfile) {
  const p = userOrProfile?.profile || userOrProfile;
  if (p?.avatar) return p.avatar;
  const seed = `user-${hashSeed(p?.email || p?.firstName || 'user')}`;
  return portraitUrl(seed, 400);
}

export function getCoverForDraft(title) {
  return landscapeUrl(`draft-${hashSeed(title || 'new')}`);
}
