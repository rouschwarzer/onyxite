import { auth } from "@/lib/auth/server";

/**
 * Neon Auth API handler.
 */
export const { GET, POST } = auth.handler();
