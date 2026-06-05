"use client";

type DebugOutputProps = {
  label: string;
  value: unknown;
};

export const DebugOutput = ({ label, value }: DebugOutputProps) => {
  if (!value) return null;

  return (
    <section className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
      <h2 className="mb-2 text-sm font-medium text-zinc-900">{label}</h2>
      <pre className="overflow-auto whitespace-pre-wrap text-xs text-zinc-700">
        {JSON.stringify(value, null, 2)}
      </pre>
    </section>
  );
};
