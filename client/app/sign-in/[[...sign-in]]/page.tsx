import { AuthShell } from "@/components/auth/auth-shell";
import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function SignInPage() {
  const { userId } = await auth();
  if (userId) redirect("/home");

  return (
    <AuthShell variant="plain">
      <SignIn fallbackRedirectUrl="/onboarding" signUpUrl="/sign-up" />
    </AuthShell>
  );
}
