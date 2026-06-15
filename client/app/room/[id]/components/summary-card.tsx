"use client";

import { Check, Pencil } from "lucide-react";
import { useState } from "react";

type SummaryCardProps = {
  summary: string;
};

export const SummaryCard = ({ summary }: SummaryCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(summary);

  return (
    <section className="relative rounded-[24px] border border-emerald-100/50 bg-emerald-50/50 p-4 pb-12">
      <h3 className="text-sm font-semibold text-emerald-950">Summary</h3>
      {isEditing ? (
        <textarea
          className="mt-2 w-full resize-none rounded-xl border border-emerald-200/60 bg-white/70 p-2 text-sm leading-relaxed text-emerald-950/80 outline-none focus:ring-2 focus:ring-emerald-300"
          onChange={(event) => setValue(event.target.value)}
          rows={5}
          value={value}
        />
      ) : (
        <p className="mt-2 text-sm leading-relaxed text-emerald-950/70">{value}</p>
      )}
      <button
        aria-label={isEditing ? "Save summary" : "Edit summary"}
        className="absolute bottom-3 right-3 flex size-8 items-center justify-center rounded-full bg-white/70 text-emerald-700 shadow-sm transition hover:bg-white"
        onClick={() => setIsEditing((current) => !current)}
        type="button"
      >
        {isEditing ? <Check className="size-3.5" /> : <Pencil className="size-3.5" />}
      </button>
    </section>
  );
};
