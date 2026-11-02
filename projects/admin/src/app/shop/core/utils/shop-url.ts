// MySkin admin screens link to top-level paths (/dashboard, /customers, ...). In the
// platform they live under /t/:slug, so links and navigations go through shopUrl().

const TENANT_SLUG_KEY = 'tenant.active_slug';

/** '/customers' → '/t/<slug>/customers' for the tenant currently signed in. */
export function shopUrl(path: string): string {
  const slug = localStorage.getItem(TENANT_SLUG_KEY) || '';
  return `/t/${slug}${path.startsWith('/') ? '' : '/'}${path}`;
}

/** Storefront URL of the signed-in tenant: subdomain in production, ?tenant= locally. */
export function storefrontLink(base: string, path = '', production = false, rootDomain = ''): string {
  const slug = localStorage.getItem(TENANT_SLUG_KEY) || '';
  const clean = path.replace(/^\/+/, '');
  if (production || !base) return `https://${slug}.${rootDomain}/${clean}`;
  const [pathOnly, hash] = clean.split('#');
  return `${base}/${pathOnly}?tenant=${encodeURIComponent(slug)}${hash ? '#' + hash : ''}`;
}
