"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { useEffect, useId, useState } from "react";

type AddResourceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd?: (resource: { name: string; url: string }) => void;
};

export function AddResourceDialog({
  open,
  onOpenChange,
  onAdd,
}: AddResourceDialogProps) {
  const titleId = useId();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!open) {
      setName("");
      setUrl("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedUrl = url.trim();
    if (!trimmedName || !trimmedUrl) return;

    onAdd?.({ name: trimmedName, url: trimmedUrl });
  };

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-50 bg-black/50"
        aria-label="Close add resource dialog"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border/60 bg-card p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-base font-semibold">
              Add resource
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Save a link your team can open from the dashboard.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-4" />
          </Button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="resource-name">Name</Label>
            <Input
              id="resource-name"
              placeholder="Figma designs"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="resource-url">URL</Label>
            <Input
              id="resource-url"
              type="url"
              placeholder="https://"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || !url.trim()}>
              Add resource
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
