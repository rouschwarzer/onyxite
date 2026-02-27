import { auth } from "@/lib/auth/server";

/**
 * Middleware to handle authentication and redirection using Neon Auth.
 */
export default auth.middleware({
    loginUrl: "/login",
});

/**
 * Matcher configuration for the middleware.
 */
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes - but we allow /api/auth through)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
};
