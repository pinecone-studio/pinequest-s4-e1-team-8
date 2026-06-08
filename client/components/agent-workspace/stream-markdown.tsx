"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type StreamMarkdownProps = {
  content: string;
  className?: string;
};

type MarkdownBlock =
  | { type: "heading"; level: number; text: string }
  | { type: "code"; text: string }
  | { type: "list"; items: string[] }
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
      while (index < lines.length && !lines[index].startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) {
        index += 1;
      }
      blocks.push({ type: "code", text: codeLines.join("\n") });
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
      blocks.push({ type: "list", items });
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
      !/^[-*]\s+/.test(lines[index])
    ) {
      paragraphLines.push(lines[index]);
      index += 1;
    }
    blocks.push({ type: "paragraph", text: paragraphLines.join("\n") });
  }

  return blocks;
}

function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

  return parts.map((part, partIndex) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={partIndex}
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={partIndex} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return <span key={partIndex}>{part}</span>;
  });
}

export function StreamMarkdown({ content, className }: StreamMarkdownProps) {
  if (content.trim().length === 0) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        Waiting for output…
      </p>
    );
  }

  const blocks = parseBlocks(content);

  return (
    <div className={cn("space-y-3 text-sm leading-relaxed text-foreground/90", className)}>
      {blocks.map((block, blockIndex) => {
        if (block.type === "heading") {
          const sizeClass =
            block.level === 1
              ? "text-lg font-semibold"
              : block.level === 2
                ? "text-base font-semibold"
                : "text-sm font-semibold";
          const headingClass = cn(sizeClass, "text-foreground");

          if (block.level === 1) {
            return (
              <h1 key={blockIndex} className={headingClass}>
                {renderInline(block.text)}
              </h1>
            );
          }
          if (block.level === 2) {
            return (
              <h2 key={blockIndex} className={headingClass}>
                {renderInline(block.text)}
              </h2>
            );
          }
          if (block.level === 3) {
            return (
              <h3 key={blockIndex} className={headingClass}>
                {renderInline(block.text)}
              </h3>
            );
          }
          if (block.level === 4) {
            return (
              <h4 key={blockIndex} className={headingClass}>
                {renderInline(block.text)}
              </h4>
            );
          }
          if (block.level === 5) {
            return (
              <h5 key={blockIndex} className={headingClass}>
                {renderInline(block.text)}
              </h5>
            );
          }
          return (
            <h6 key={blockIndex} className={headingClass}>
              {renderInline(block.text)}
            </h6>
          );
        }

        if (block.type === "code") {
          return (
            <pre
              key={blockIndex}
              className="overflow-x-auto rounded-lg border border-border/60 bg-muted/40 p-3 font-mono text-xs leading-relaxed text-foreground"
            >
              <code>{block.text}</code>
            </pre>
          );
        }

        if (block.type === "list") {
          return (
            <ul key={blockIndex} className="list-disc space-y-1 pl-5">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{renderInline(item)}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={blockIndex} className="whitespace-pre-wrap">
            {renderInline(block.text)}
          </p>
        );
      })}
    </div>
  );
}
