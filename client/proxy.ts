import { clerkMiddleware } from "@clerk/nextjs/server";

/**
 * Clerk Frontend API proxying (`/__clerk`) only works with production Clerk
 * instances and a matching proxy URL in the Clerk Dashboard. Development keys
 * (`pk_test_*`) must talk to *.clerk.accounts.dev directly — enabling the proxy
 * causes `host_invalid` (400) responses.
 */
export const proxy = clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
