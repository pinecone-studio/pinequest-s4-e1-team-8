"use client";

import { DEMO_DEFAULT_EMAIL, saveDemoSession } from "@/lib/demo-session";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const inputClassName =
  "w-full rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground transition-[border-color,box-shadow] focus:border-violet-500 focus:outline-none focus:ring-[3px] focus:ring-violet-500/20";

export function DemoLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState(DEMO_DEFAULT_EMAIL);

  const continueToOnboarding = () => {
    saveDemoSession(email);
    router.push("/onboarding");
  };

  return (
    <>
      <div className="mb-6">
        <h2 className="text-[21px] font-semibold tracking-[-0.4px] text-foreground">
          Welcome back
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-foreground">
          Sign in with the demo account to set up your project workspace.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="demo-email"
            className="mb-1.5 block text-[13px] font-medium text-foreground"
          >
            Email
          </label>
          <input
            id="demo-email"
            type="email"
            autoComplete="email"
            className={`${inputClassName} h-11 px-3.5`}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
            Demo only — prefilled for presentations. No password required.
          </p>
        </div>
      </div>

      <div className="mt-7">
        <button
          type="button"
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-violet-600 text-sm font-semibold text-white transition-colors hover:bg-violet-500 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45"
          disabled={!email.trim()}
          onClick={continueToOnboarding}
        >
          Continue to onboarding
          <ArrowRight size={17} />
        </button>
      </div>
    </>
  );
}
