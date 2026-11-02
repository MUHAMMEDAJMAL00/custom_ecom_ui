import { environment } from '../../../environments/environment';

const FALLBACK_IMAGE = 'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20200%20200%22%3E%3Crect%20fill%3D%22%23f3f4f6%22%20width%3D%22200%22%20height%3D%22200%22%2F%3E%3Cpath%20d%3D%22M80%20120l20-25%2015%2018%2015-22%2025%2035H80z%22%20fill%3D%22%23d1d5db%22%2F%3E%3Ccircle%20cx%3D%2270%22%20cy%3D%2270%22%20r%3D%2210%22%20fill%3D%22%23d1d5db%22%2F%3E%3C%2Fsvg%3E';

/** image_url is a full URL or a path relative to the API host (uploads). From myskin_web. */
export function resolveImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) return FALLBACK_IMAGE;
  if (imageUrl.startsWith('http') || imageUrl.startsWith('data:')) return imageUrl;
  const host = environment.apiBaseUrl.replace(/\/api\/v1\/?$/, '');
  return `${host}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
}
