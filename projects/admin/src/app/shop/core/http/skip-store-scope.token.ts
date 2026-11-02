import { HttpContextToken } from '@angular/common/http';

/**
 * Set on a request's HttpContext to stop AuthInterceptor from attaching the
 * X-Store-ID header. Needed for endpoints (like the global Stores list) whose
 * backend behavior branches on the header's presence — super_admin's synthetic
 * "active store" default (see AuthService.activeStoreId) would otherwise scope
 * these requests to a single store instead of returning all stores.
 */
export const SKIP_STORE_SCOPE = new HttpContextToken<boolean>(() => false);
