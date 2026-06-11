import { OnboardingWizard } from "@/features/onboarding/components/onboarding-wizard";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function OnboardingIntegrationsPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/onboarding");
  }

  return (
    <main className="min-h-screen bg-background">
      <Suspense fallback={<div className="p-10 text-sm text-muted-foreground">Loading…</div>}>
        <OnboardingWizard />
      </Suspense>
    </main>
  );
}
