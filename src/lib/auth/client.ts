import { createAuthClient } from "@neondatabase/neon-js/auth";

/**
 * Neon Auth client instance.
 * Uses the base URL from environment variables via Next.js public prefix.
 */
export const authClient = createAuthClient(process.env.NEXT_PUBLIC_NEON_AUTH_URL!);
