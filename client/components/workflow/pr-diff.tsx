"use client";

import type { GithubPullFile } from "@/lib/integrations/github";
import { cn } from "@/lib/utils";
import { FileCode, Loader2 } from "lucide-react";

type PrDiffProps = {
  files: GithubPullFile[];
  loading: boolean;
};

function DiffLine({ line }: { line: string }) {
  const isAdd = line.startsWith("+") && !line.startsWith("+++");
  const isDel = line.startsWith("-") && !line.startsWith("---");
  const isHunk = line.startsWith("@@");

  return (
    <div
      className={cn(
        "whitespace-pre font-mono text-[11px] leading-5",
        isAdd && "bg-emerald-500/15 text-emerald-300",
        isDel && "bg-red-500/15 text-red-300",
        isHunk && "bg-violet-500/20 text-violet-300",
        !isAdd && !isDel && !isHunk && "text-zinc-400",
      )}
    >
      {line || " "}
    </div>
  );
}

export function PrDiff({ files, loading }: PrDiffProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-5 animate-spin text-violet-500" />
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">No files changed</p>
    );
  }

  return (
    <div className="space-y-4">
      {files.map((file) => (
        <div
          key={file.filename}
          className="overflow-hidden rounded-xl border border-border/60 bg-zinc-950"
        >
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5">
            <div className="flex items-center gap-2 text-sm text-zinc-200">
              <FileCode className="size-4 text-violet-400" />
              <span className="font-mono text-xs">{file.filename}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded bg-zinc-800 px-2 py-0.5 text-zinc-400">{file.status}</span>
              <span className="text-emerald-400">+{file.additions}</span>
              <span className="text-red-400">-{file.deletions}</span>
            </div>
          </div>
          {file.patch ? (
            <div className="max-h-96 overflow-auto px-2 py-1">
              {file.patch.split("\n").map((line, i) => (
                <DiffLine key={`${file.filename}-${i}`} line={line} />
              ))}
            </div>
          ) : (
            <p className="px-4 py-6 text-center text-xs text-zinc-500">
              Binary or large file — no patch available
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
