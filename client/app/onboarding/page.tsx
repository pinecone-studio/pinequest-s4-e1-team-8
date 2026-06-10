import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/ui/themes";

export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12">
      <SignIn
        routing="hash"
        withSignUp
        forceRedirectUrl="/onboarding/step2"
        signUpForceRedirectUrl="/onboarding/step2"
        appearance={{
          theme: dark,
          variables: {
            colorPrimary: "#7c3aed",
            colorPrimaryForeground: "#ffffff",
            colorBackground: "#18181b",
            colorForeground: "#fafafa",
            colorInput: "#27272a",
            colorInputForeground: "#fafafa",
            colorMutedForeground: "#a1a1aa",
            colorBorder: "#27272a",
            borderRadius: "0.75rem",
          },
          elements: {
            rootBox: "w-full max-w-[440px]",
            cardBox: "w-full shadow-none",
            card: "border border-zinc-800 bg-zinc-900 shadow-none",
            headerTitle: "text-zinc-50",
            headerSubtitle: "text-zinc-400",
            socialButtonsBlockButton:
              "border-zinc-800 bg-zinc-900 text-zinc-50 hover:bg-zinc-800",
            dividerLine: "bg-zinc-800",
            dividerText: "text-zinc-500",
            formFieldLabel: "text-zinc-300",
            formFieldInput:
              "border-zinc-800 bg-zinc-950 text-zinc-50 focus:border-violet-500 focus:ring-violet-500/20",
            formButtonPrimary:
              "bg-violet-600 text-white hover:bg-violet-500 focus:shadow-none",
            footerActionLink: "text-violet-400 hover:text-violet-300",
            identityPreviewEditButton:
              "text-violet-400 hover:text-violet-300",
          },
        }}
      />
    </div>
  );
}
