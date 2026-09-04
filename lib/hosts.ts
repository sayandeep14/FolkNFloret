/**
 * Which face of the site a request arrived at.
 *
 * One deployment answers on several hostnames. The storefront is
 * folknfloret.com and www.folknfloret.com; the studio is a subdomain of its
 * own. Keeping the test in one place means the middleware, the layouts and the
 * metadata cannot disagree about where a request is.
 */
export const STUDIO_SUBDOMAIN = "studio";

/**
 * True for studio.folknfloret.com and for studio.localhost:3000 — browsers
 * resolve any *.localhost to the loopback address, so development uses the
 * same code path as production instead of a special case.
 */
export function isStudioHost(host: string | null | undefined): boolean {
  if (!host) return false;
  return host.split(":")[0].toLowerCase().startsWith(`${STUDIO_SUBDOMAIN}.`);
}
