import { handlers } from "@/auth";

/**
 * Every Auth.js endpoint: sign-in, callbacks, session, sign-out. The provider
 * callback URLs registered with Google and Resend resolve here, so the path
 * matters — /api/auth/callback/google is not configurable without also
 * setting `basePath` in auth.ts.
 */
export const { GET, POST } = handlers;
