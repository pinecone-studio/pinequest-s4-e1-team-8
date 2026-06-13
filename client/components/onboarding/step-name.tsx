"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { syncClerkUser } from "@/lib/api/users";
import { useUser } from "@clerk/nextjs";
import { AnimatePresence, motion } from "framer-motion";
import { type FormEvent, useState } from "react";

type NameStepProps = {
  onContinue: () => void;
};

const NAME_MIN_LENGTH = 2;

export function NameStep({ onContinue }: NameStepProps) {
  const { user } = useUser();
  const [name, setName] = useState(user?.firstName ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const canContinue = name.trim().length >= NAME_MIN_LENGTH;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canContinue || !user || isSaving) return;

    setIsSaving(true);

    try {
      const trimmedName = name.trim();
      await user.update({ firstName: trimmedName });

      const email = user.primaryEmailAddress?.emailAddress?.trim();

      if (email) {
        await syncClerkUser({
          clerkId: user.id,
          email,
          name: trimmedName,
          avatarUrl: user.imageUrl ?? null,
        });
      }

      onContinue();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-8 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">What should we call you?</h1>
        <p className="text-sm text-muted-foreground">
          This is how you&apos;ll appear to teammates in meetings and summaries.
        </p>
      </div>

      <Input
        autoFocus
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Your name"
        className="h-12 max-w-sm border-white/10 bg-inset text-center text-base"
      />

      <AnimatePresence>
        {canContinue ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              type="submit"
              size="lg"
              disabled={isSaving}
              className="h-11 min-w-[180px] px-6 text-base"
            >
              {isSaving ? "Saving..." : "Continue"}
            </Button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </form>
  );
}
