import { clerkMiddleware } from "@clerk/nextjs/server";

/**
 * Use middleware.ts (Edge) instead of Next.js 16 proxy.ts:
 * - @opennextjs/cloudflare does not support Node.js proxy/middleware yet.
 * - Clerk Frontend API proxying (`/__clerk`) only works with production keys;
 *   dev keys (`pk_test_*`) must talk to *.clerk.accounts.dev directly.
 */
export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
