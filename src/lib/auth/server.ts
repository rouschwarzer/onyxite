import { createNeonAuth } from "@neondatabase/auth/next/server";

/**
 * Neon Auth server-side instance.
 */
export const auth = createNeonAuth({
    baseUrl: process.env.NEON_AUTH_BASE_URL!,
    cookies: {
        secret: process.env.NEON_AUTH_COOKIE_SECRET!,
    },
});
