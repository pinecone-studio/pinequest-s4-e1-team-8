import { clerkMiddleware } from "@clerk/nextjs/server";

/**
 * Keep middleware.ts (Edge) for OpenNext/Cloudflare — Next.js 16 proxy.ts runs on
 * Node.js only, which @opennextjs/cloudflare does not support yet.
 */
export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
