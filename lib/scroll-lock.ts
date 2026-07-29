/**
 * Lenis owns scrolling, and it lives inside SmoothScroll. The mobile menu needs
 * to freeze the page behind it, so SmoothScroll publishes its stop/start here
 * rather than the header reaching into the provider.
 *
 * Both default to no-ops, so calling them before mount — or under reduced
 * motion, where there is no Lenis at all — is harmless.
 */
export const scrollLock = {
  lock: () => {},
  unlock: () => {},
};
