import { clerkMiddleware } from "@clerk/nextjs/server";

/**
 * Proxy Clerk Frontend API through the app origin (`/__clerk`).
 * Fixes "Failed to fetch" when the browser cannot reach *.clerk.accounts.dev
 * (ad blockers, corporate networks, offline dev tabs, etc.).
 */
export const proxy = clerkMiddleware({
  frontendApiProxy: {
    enabled: true,
  },
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
