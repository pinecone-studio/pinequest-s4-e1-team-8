"use client";

import type { ChangeEventHandler } from "react";

type FormFieldProps = {
  label: string;
  onChange: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  required?: boolean;
  type?: string;
  value: string;
  variant?: "input" | "textarea";
};

const fieldClass =
  "w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-violet-400";

export const FormField = ({
  label,
  onChange,
  required = false,
  type = "text",
  value,
  variant = "input",
}: FormFieldProps) => (
  <label className="block space-y-1 text-sm font-medium text-muted-foreground">
    <span>{label}</span>
    {variant === "textarea" ? (
      <textarea
        className={`${fieldClass} min-h-24`}
        onChange={onChange}
        value={value}
      />
    ) : (
      <input
        className={fieldClass}
        onChange={onChange}
        required={required}
        type={type}
        value={value}
      />
    )}
  </label>
);
