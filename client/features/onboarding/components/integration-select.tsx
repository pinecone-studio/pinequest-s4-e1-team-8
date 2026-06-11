"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";

export type IntegrationSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
  disabledReason?: string;
};

type IntegrationSelectProps = {
  label: string;
  placeholder: string;
  value: string;
  options: IntegrationSelectOption[];
  onValueChange: (value: string) => void;
  createLabel: string;
  createDialogTitle: string;
  createDialogDescription?: string;
  createInputLabel: string;
  createInputPlaceholder: string;
  onCreate: (name: string) => Promise<void>;
  disabled?: boolean;
  error?: string;
  className?: string;
};

export function IntegrationSelect({
  label,
  placeholder,
  value,
  options,
  onValueChange,
  createLabel,
  createDialogTitle,
  createDialogDescription,
  createInputLabel,
  createInputPlaceholder,
  onCreate,
  disabled = false,
  error,
  className,
}: IntegrationSelectProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createValue, setCreateValue] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreate = async () => {
    const trimmed = createValue.trim();
    if (!trimmed) {
      setCreateError("Name is required");
      return;
    }

    setCreating(true);
    setCreateError(null);
    try {
      await onCreate(trimmed);
      setCreateValue("");
      setDialogOpen(false);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className={cn("w-full space-y-3", className)}>
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      <Select
        value={value || null}
        onValueChange={(next) => onValueChange(next ?? "")}
        disabled={disabled}
      >
        <SelectTrigger className="h-10">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {options.length === 0 ? (
            <SelectItem value="__empty__" disabled>
              No options available
            </SelectItem>
          ) : (
            options.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
                {option.disabled ? " (already linked)" : ""}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      <button
        type="button"
        disabled={disabled || creating}
        onClick={() => setDialogOpen(true)}
        className="inline-flex items-center gap-1 text-sm text-violet-700 transition-colors hover:text-violet-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-violet-400 dark:hover:text-violet-300"
      >
        <Plus className="size-3.5" />
        {createLabel}
      </button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{createDialogTitle}</DialogTitle>
            {createDialogDescription ? (
              <DialogDescription>{createDialogDescription}</DialogDescription>
            ) : null}
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={`create-${label}`}>{createInputLabel}</Label>
            <Input
              id={`create-${label}`}
              value={createValue}
              onChange={(event) => setCreateValue(event.target.value)}
              placeholder={createInputPlaceholder}
              disabled={creating}
            />
            {createError ? (
              <p className="text-xs text-destructive">{createError}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={creating}
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" disabled={creating} onClick={() => void handleCreate()}>
              {creating ? <Loader2 className="size-4 animate-spin" /> : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
