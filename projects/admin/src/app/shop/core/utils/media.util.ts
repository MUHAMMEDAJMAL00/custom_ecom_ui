import { environment } from '../../../../environments/environment';

/** Uploaded files are stored as API-relative paths (/uploads/...): resolve them against the API host. */
export function mediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (/^(https?:|data:|blob:)/.test(url)) return url;
  const host = environment.apiUrl.replace(/\/api\/v1\/?$/, '');
  return `${host}${url.startsWith('/') ? '' : '/'}${url}`;
}
