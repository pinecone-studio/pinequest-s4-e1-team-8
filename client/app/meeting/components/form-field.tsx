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
  "w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-violet-400";

export const FormField = ({
  label,
  onChange,
  required = false,
  type = "text",
  value,
  variant = "input",
}: FormFieldProps) => (
  <label className="block space-y-1 text-sm font-medium text-zinc-300">
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
