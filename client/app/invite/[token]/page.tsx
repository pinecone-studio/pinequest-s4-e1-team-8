"use client";

import { Button } from "@/components/ui/button";
import {
  acceptProjectInvite,
  fetchInvitePreview,
  fetchMyProjects,
  projectToOnboardingData,
} from "@/lib/api/projects";
import { saveOnboardingData } from "@/lib/onboarding-storage";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function InvitePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const [preview, setPreview] = useState<{
    projectName: string;
    description: string | null;
    ownerName: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetchInvitePreview(token)
      .then((data) =>
        setPreview({
          projectName: data.projectName,
          description: data.description,
          ownerName: data.ownerName,
        }),
      )
      .catch(() => setError("This invitation link is invalid or expired."));
  }, [token]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !token || joining) return;

    const join = async () => {
      setJoining(true);
      try {
        const result = await acceptProjectInvite(token);
        const projects = await fetchMyProjects();
        const joined =
          projects.find((p) => p.id === result.projectId) ?? projects[0];
        if (joined) {
          saveOnboardingData(projectToOnboardingData(joined));
        }
        router.replace("/dashboard");
      } catch {
        setError("Could not join the project. Try again.");
        setJoining(false);
      }
    };

    void join();
  }, [isLoaded, isSignedIn, joining, router, token]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#121212] px-6">
        <div className="max-w-md rounded-2xl border border-white/10 bg-[#1a1b1f] p-8 text-center">
          <p className="text-sm text-red-400">{error}</p>
          <Button className="mt-4" onClick={() => router.push("/")}>
            Go home
          </Button>
        </div>
      </div>
    );
  }

  if (!preview) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#121212]">
        <p className="text-sm text-muted-foreground">Loading invitation…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#121212] px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1a1b1f] p-8 text-center shadow-2xl">
        <div className="mx-auto mb-4 grid size-12 place-items-center rounded-xl bg-violet-500/15 text-violet-400">
          B
        </div>
        <h1 className="text-xl font-semibold text-white">
          Join {preview.projectName}
        </h1>
        <p className="mt-2 text-sm text-[#8e8e93]">
          Invited by {preview.ownerName}. You&apos;ll get access to the full
          project dashboard, tasks, and milestones.
        </p>
        {preview.description ? (
          <p className="mt-3 text-sm leading-relaxed text-[#a1a1aa]">
            {preview.description}
          </p>
        ) : null}

        {!isLoaded ? (
          <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
        ) : isSignedIn ? (
          <p className="mt-6 text-sm text-violet-300">
            {joining ? "Joining project…" : "Redirecting…"}
          </p>
        ) : (
          <SignInButton mode="modal">
            <Button className="mt-6 w-full bg-violet-600 hover:bg-violet-700">
              Sign in to join
            </Button>
          </SignInButton>
        )}
      </div>
    </div>
  );
}
