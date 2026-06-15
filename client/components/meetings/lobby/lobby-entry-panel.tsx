"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Copy, Link2 } from "lucide-react";
import { useState } from "react";

const COPY_FEEDBACK_DURATION_MS = 1500;

type CopyTarget = "code" | "link";

type LobbyEntryPanelProps = {
  canJoin: boolean;
  error?: string;
  isJoining: boolean;
  occupancySubtitle: string;
  onJoin: () => void;
  roomCode: string;
  title: string;
};

export function LobbyEntryPanel({
  canJoin,
  error,
  isJoining,
  occupancySubtitle,
  onJoin,
  roomCode,
  title,
}: LobbyEntryPanelProps) {
  const [copiedItem, setCopiedItem] = useState<CopyTarget | null>(null);

  const handleCopy = async (item: CopyTarget) => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;

    const value =
      item === "code"
        ? roomCode
        : typeof window !== "undefined"
          ? window.location.href
          : roomCode;

    await navigator.clipboard.writeText(value);
    setCopiedItem(item);
    window.setTimeout(() => {
      setCopiedItem((current) => (current === item ? null : current));
    }, COPY_FEEDBACK_DURATION_MS);
  };

  return (
    <div className="flex w-full max-w-sm flex-col items-center justify-center space-y-6 text-center md:items-start md:text-center">
      <div className="space-y-2 w-full">
        <h2 className="text-3xl font-medium tracking-tight text-foreground text-center">
          {title}
        </h2>
        <p className="text-base text-muted-foreground text-center">
          {occupancySubtitle}
        </p>
      </div>

      <div className="w-full space-y-3">
        <Button
          className="h-12 w-full rounded-full text-base font-medium shadow-sm transition-all hover:opacity-90 active:scale-[0.98]"
          disabled={!canJoin || isJoining}
          onClick={onJoin}
          type="button"
        >
          {isJoining ? "Joining..." : "Join now"}
        </Button>

        {error ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>

      <div className="dropdown-container rounded-2xl w-full">
        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-primary shadow-sm transition-colors hover:bg-zinc-50 w-1/2 justify-center"
            type="button"
          >
            Other ways to join
            <ChevronDown className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => void handleCopy("code")}>
              <Copy className="size-4" />
              {copiedItem === "code" ? "Code copied" : "Copy meeting code"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => void handleCopy("link")}>
              <Link2 className="size-4" />
              {copiedItem === "link" ? "Link copied" : "Copy meeting link"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
