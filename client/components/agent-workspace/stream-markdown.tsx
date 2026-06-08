"use client";

import { cn } from "@/lib/utils";
import { Radio } from "lucide-react";
import { memo, useMemo, type ReactNode } from "react";

type StreamMarkdownProps = {
  content: string;
  className?: string;
  isActive?: boolean;
  workerLabel?: string;
};

type MarkdownBlock =
  | { type: "heading"; level: number; text: string }
  | { type: "code"; text: string; complete: boolean }
  | { type: "bullet-list"; items: string[] }
  | { type: "ordered-list"; items: string[] }
  | { type: "paragraph"; text: string };

function parseBlocks(content: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  const lines = content.split("\n");
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (line.startsWith("```")) {
      const codeLines: string[] = [];
      index += 1;
      let complete = false;
      while (index < lines.length && !lines[index].startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) {
        complete = true;
        index += 1;
      }
      blocks.push({ type: "code", text: codeLines.join("\n"), complete });
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        text: headingMatch[2],
      });
      index += 1;
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^[-*]\s+/, ""));
        index += 1;
      }
      blocks.push({ type: "bullet-list", items });
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\d+\.\s+/, ""));
        index += 1;
      }
      blocks.push({ type: "ordered-list", items });
      continue;
    }

    if (line.trim().length === 0) {
      index += 1;
      continue;
    }

    const paragraphLines: string[] = [line];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim().length > 0 &&
      !lines[index].startsWith("```") &&
      !lines[index].match(/^#{1,6}\s+/) &&
      !/^[-*]\s+/.test(lines[index]) &&
      !/^\d+\.\s+/.test(lines[index])
    ) {
      paragraphLines.push(lines[index]);
      index += 1;
    }
    blocks.push({ type: "paragraph", text: paragraphLines.join("\n") });
  }

  return blocks;
}

function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(`[^`\n]+`|\*\*[^*\n]+\*\*)/g);

  return parts.map((part, partIndex) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={partIndex}
          className="rounded-md bg-violet-500/10 px-1.5 py-0.5 font-mono text-[0.85em] text-violet-200 ring-1 ring-violet-500/20"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={partIndex} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return <span key={partIndex}>{part}</span>;
  });
}

function renderHeading(level: number, text: string, blockIndex: number) {
  const sizeClass =
    level === 1
      ? "text-lg font-semibold"
      : level === 2
        ? "text-base font-semibold"
        : "text-sm font-semibold";
  const headingClass = cn(sizeClass, "text-white");

  if (level === 1) {
    return (
      <h1 key={blockIndex} className={headingClass}>
        {renderInline(text)}
      </h1>
    );
  }
  if (level === 2) {
    return (
      <h2 key={blockIndex} className={headingClass}>
        {renderInline(text)}
      </h2>
    );
  }
  if (level === 3) {
    return (
      <h3 key={blockIndex} className={headingClass}>
        {renderInline(text)}
      </h3>
    );
  }
  if (level === 4) {
    return (
      <h4 key={blockIndex} className={headingClass}>
        {renderInline(text)}
      </h4>
    );
  }
  if (level === 5) {
    return (
      <h5 key={blockIndex} className={headingClass}>
        {renderInline(text)}
      </h5>
    );
  }
  return (
    <h6 key={blockIndex} className={headingClass}>
      {renderInline(text)}
    </h6>
  );
}

function StreamCursor() {
  return (
    <span
      aria-hidden
      className="ml-0.5 inline-block h-[1.1em] w-[2px] translate-y-px animate-pulse rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]"
    />
  );
}

function StreamMarkdownEmpty({
  isActive,
  workerLabel,
}: {
  isActive: boolean;
  workerLabel?: string;
}) {
  return (
    <div className="flex min-h-[10rem] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/8 bg-white/[0.02] px-6 py-10 text-center">
      <div
        className={cn(
          "flex size-11 items-center justify-center rounded-2xl ring-1 ring-inset",
          isActive
            ? "bg-violet-500/10 text-violet-300 ring-violet-500/25"
            : "bg-white/4 text-[#6b6b73] ring-white/6",
        )}
      >
        <Radio className={cn("size-5", isActive && "animate-pulse")} />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-[#a1a1ab]">
          {isActive
            ? "Streaming output"
            : workerLabel
              ? `${workerLabel} idle`
              : "No output yet"}
        </p>
        <p className="max-w-xs text-xs leading-relaxed text-[#5c5c66]">
          {isActive
            ? "Worker is generating content. Tokens will appear here in real time."
            : "Run the orchestration pipeline to populate this worker slot."}
        </p>
      </div>
      {isActive ? <StreamCursor /> : null}
    </div>
  );
}

function StreamMarkdownBlock({
  block,
  blockIndex,
}: {
  block: MarkdownBlock;
  blockIndex: number;
}) {
  if (block.type === "heading") {
    return renderHeading(block.level, block.text, blockIndex);
  }

  if (block.type === "code") {
    return (
      <pre
        key={blockIndex}
        className={cn(
          "overflow-x-auto rounded-xl border p-3 font-mono text-xs leading-relaxed text-[#e4e4e7]",
          block.complete
            ? "border-white/8 bg-[#0a0a0c]"
            : "border-violet-500/25 bg-violet-500/5",
        )}
      >
        <code>{block.text}</code>
      </pre>
    );
  }

  if (block.type === "bullet-list") {
    return (
      <ul key={blockIndex} className="list-disc space-y-1.5 pl-5 marker:text-violet-400/70">
        {block.items.map((item, itemIndex) => (
          <li key={itemIndex} className="text-foreground/90">
            {renderInline(item)}
          </li>
        ))}
      </ul>
    );
  }

  if (block.type === "ordered-list") {
    return (
      <ol
        key={blockIndex}
        className="list-decimal space-y-1.5 pl-5 marker:text-violet-400/70"
      >
        {block.items.map((item, itemIndex) => (
          <li key={itemIndex} className="text-foreground/90">
            {renderInline(item)}
          </li>
        ))}
      </ol>
    );
  }

  return (
    <p key={blockIndex} className="whitespace-pre-wrap text-foreground/90">
      {renderInline(block.text)}
    </p>
  );
}

export const StreamMarkdown = memo(function StreamMarkdown({
  content,
  className,
  isActive = false,
  workerLabel,
}: StreamMarkdownProps) {
  const blocks = useMemo(() => parseBlocks(content), [content]);
  const isEmpty = content.length === 0;

  if (isEmpty) {
    return (
      <StreamMarkdownEmpty isActive={isActive} workerLabel={workerLabel} />
    );
  }

  return (
    <div
      className={cn(
        "space-y-3 text-sm leading-relaxed text-foreground/90",
        className,
      )}
    >
      {blocks.map((block, blockIndex) => (
        <StreamMarkdownBlock
          key={`${block.type}-${blockIndex}`}
          block={block}
          blockIndex={blockIndex}
        />
      ))}
      {isActive ? <StreamCursor /> : null}
    </div>
  );
});
