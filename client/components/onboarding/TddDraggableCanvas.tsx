"use client";

import { useCallback, useRef } from "react";
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import {
  ArrowLeftRight,
  Code2,
  Compass,
  Database,
  FlaskConical,
  GripVertical,
  Monitor,
  Network,
  User,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { InlineAiRefinement } from "@/components/onboarding/InlineAiRefinement";
import type {
  TddBlock,
  TddBlockType,
  TddLayoutState,
} from "@/lib/onboarding/tdd-types";
import { cn } from "@/lib/utils";

type TddDraggableCanvasProps = {
  layout: TddLayoutState;
  onLayoutChange: (layout: TddLayoutState) => void;
  projectName?: string;
};

type BlockVisual = {
  icon: LucideIcon;
  badgeClass: string;
  span: string;
};

const BLOCK_VISUALS: Record<TddBlockType, BlockVisual> = {
  project_overview: {
    icon: Compass,
    badgeClass:
      "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
    span: "",
  },
  core_features: {
    icon: Workflow,
    badgeClass:
      "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
    span: "",
  },
  database_schema: {
    icon: Database,
    badgeClass:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    span: "sm:col-span-2",
  },
  tdd_specs: {
    icon: FlaskConical,
    badgeClass:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    span: "sm:col-span-2",
  },
};

function reorderBlocks(
  blocks: TddBlock[],
  sourceIndex: number,
  destinationIndex: number,
): TddBlock[] {
  const next = [...blocks];
  const [removed] = next.splice(sourceIndex, 1);
  next.splice(destinationIndex, 0, removed);
  return next.map((block, index) => ({ ...block, order: index }));
}

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const parts = text
    .split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g)
    .filter((part) => part.length > 0);
  return parts.map((part, partIndex) => {
    const key = `${keyPrefix}-${partIndex}`;
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={key}
          className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

function isTableSeparatorRow(cells: string[]): boolean {
  return (
    cells.length > 0 && cells.every((cell) => /^:?-{2,}:?$/.test(cell.trim()))
  );
}

function splitTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function renderMarkdownTable(rows: string[], key: string) {
  const parsedRows = rows.map(splitTableRow);
  const header = parsedRows[0] ?? [];
  const bodyRows = parsedRows
    .slice(1)
    .filter((row) => !isTableSeparatorRow(row));

  return (
    <div
      key={key}
      className="my-3 overflow-x-auto rounded-lg border border-border"
    >
      <table className="w-full border-collapse text-left text-[12px]">
        <thead className="bg-muted/60">
          <tr>
            {header.map((cell, cellIndex) => (
              <th
                key={`${key}-h-${cellIndex}`}
                className="border-b border-border px-2.5 py-1.5 font-semibold whitespace-nowrap text-foreground"
              >
                {renderInline(cell, `${key}-h-${cellIndex}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bodyRows.map((row, rowIndex) => (
            <tr
              key={`${key}-r-${rowIndex}`}
              className="border-b border-border last:border-0 even:bg-muted/30"
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={`${key}-r-${rowIndex}-${cellIndex}`}
                  className="px-2.5 py-1.5 align-top text-foreground/90"
                >
                  {renderInline(cell, `${key}-r-${rowIndex}-${cellIndex}`)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderMarkdownPreview(content: string) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let lineIndex = 0;

  while (lineIndex < lines.length) {
    const line = lines[lineIndex];
    const trimmed = line.trim();
    const key = `line-${lineIndex}`;

    if (!trimmed) {
      elements.push(<br key={key} />);
      lineIndex += 1;
      continue;
    }

    if (trimmed.startsWith("#")) {
      const level = trimmed.match(/^#+/)?.[0].length ?? 1;
      const text = trimmed.replace(/^#+\s*/, "");
      elements.push(
        level <= 2 ? (
          <h3 key={key} className="mt-3 text-sm font-semibold text-foreground">
            {renderInline(text, key)}
          </h3>
        ) : (
          <h4
            key={key}
            className="mt-2 text-[13px] font-semibold text-foreground"
          >
            {renderInline(text, key)}
          </h4>
        ),
      );
      lineIndex += 1;
      continue;
    }

    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const tableLines: string[] = [];
      let cursor = lineIndex;
      while (cursor < lines.length) {
        const candidate = lines[cursor].trim();
        if (!candidate.startsWith("|") || !candidate.endsWith("|")) {
          break;
        }
        tableLines.push(candidate);
        cursor += 1;
      }
      elements.push(renderMarkdownTable(tableLines, key));
      lineIndex = cursor;
      continue;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      elements.push(
        <li
          key={key}
          className="ml-4 list-disc text-[13px] leading-relaxed text-foreground/90"
        >
          {renderInline(trimmed.slice(2), key)}
        </li>,
      );
      lineIndex += 1;
      continue;
    }

    const numberedMatch = trimmed.match(/^(\d+)[.)]\s+(.*)$/);
    if (numberedMatch) {
      elements.push(
        <li
          key={key}
          className="ml-4 list-decimal text-[13px] leading-relaxed text-foreground/90"
        >
          {renderInline(numberedMatch[2], key)}
        </li>,
      );
      lineIndex += 1;
      continue;
    }

    elements.push(
      <p key={key} className="text-[13px] leading-relaxed text-foreground/90">
        {renderInline(trimmed, key)}
      </p>,
    );
    lineIndex += 1;
  }

  return elements;
}

type TddBlockCardProps = {
  block: TddBlock;
  index: number;
  onContentChange: (blockId: string, content: string) => void;
};

function TddBlockCard({ block, onContentChange }: TddBlockCardProps) {
  const contentRef = useRef<HTMLDivElement | null>(null);

  return (
    <div ref={contentRef} className="select-text px-4 py-4">
      <div className="prose prose-sm max-w-none dark:prose-invert">
        {renderMarkdownPreview(block.content)}
      </div>
      <textarea
        value={block.content}
        onChange={(event) => onContentChange(block.id, event.target.value)}
        className="mt-3 min-h-[120px] w-full resize-y rounded-lg border border-border bg-background px-3 py-2 font-mono text-[12px] leading-relaxed text-foreground outline-none ring-violet-500/20 focus:ring-2"
        onKeyDown={(event) => event.stopPropagation()}
        onKeyUp={(event) => event.stopPropagation()}
      />
      <InlineAiRefinement
        blockTitle={block.title}
        containerRef={contentRef}
        content={block.content}
        onContentChange={(nextContent) =>
          onContentChange(block.id, nextContent)
        }
      />
    </div>
  );
}

function ArchitectureNode({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <div className="flex w-32 shrink-0 flex-col items-center gap-2 rounded-xl border border-border bg-background px-3 py-4 text-center shadow-sm sm:w-40">
      <span className="flex size-11 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </span>
      <p className="text-[12px] font-medium italic text-foreground">{label}</p>
    </div>
  );
}

function ArchitectureConnector() {
  return (
    <div className="flex flex-1 items-center text-muted-foreground/50">
      <div className="h-px flex-1 bg-border" />
      <ArrowLeftRight className="mx-1.5 size-4 shrink-0" />
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

function SystemArchitectureDiagram({ projectName }: { projectName: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm sm:col-span-2">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
          <Network className="size-4" />
        </span>
        <h3 className="flex-1 text-sm font-semibold text-foreground">
          System Architecture
        </h3>
      </div>
      <div className="flex items-center gap-1 overflow-x-auto px-4 py-6 sm:gap-2">
        <ArchitectureNode icon={User} label="User" />
        <ArchitectureConnector />
        <ArchitectureNode
          icon={Monitor}
          label={projectName.trim() || "Web Application"}
        />
        <ArchitectureConnector />
        <ArchitectureNode icon={Code2} label="External APIs" />
      </div>
    </div>
  );
}

export function TddDraggableCanvas({
  layout,
  onLayoutChange,
  projectName = "",
}: TddDraggableCanvasProps) {
  const sortedBlocks = [...layout.blocks].sort(
    (left, right) => left.order - right.order,
  );

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) {
        return;
      }
      const sourceIndex = result.source.index;
      const destinationIndex = result.destination.index;
      if (sourceIndex === destinationIndex) {
        return;
      }
      onLayoutChange({
        blocks: reorderBlocks(sortedBlocks, sourceIndex, destinationIndex),
      });
    },
    [onLayoutChange, sortedBlocks],
  );

  const updateBlockContent = useCallback(
    (blockId: string, content: string) => {
      onLayoutChange({
        blocks: sortedBlocks.map((block) =>
          block.id === blockId ? { ...block, content } : block,
        ),
      });
    },
    [onLayoutChange, sortedBlocks],
  );

  return (
    <div className="flex flex-col gap-4 pb-4">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="tdd-canvas">
          {(droppableProvided) => (
            <div
              ref={droppableProvided.innerRef}
              {...droppableProvided.droppableProps}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            >
              {sortedBlocks.map((block, index) => {
                const visual = BLOCK_VISUALS[block.type];
                const Icon = visual.icon;
                return (
                  <Draggable
                    key={block.id}
                    draggableId={block.id}
                    index={index}
                  >
                    {(draggableProvided, snapshot) => (
                      <div
                        ref={draggableProvided.innerRef}
                        {...draggableProvided.draggableProps}
                        className={cn(
                          "transition-shadow",
                          visual.span,
                          snapshot.isDragging &&
                            "shadow-lg ring-2 ring-violet-500/30",
                        )}
                      >
                        <div className="flex h-full flex-col rounded-2xl border border-border bg-card shadow-sm">
                          <div
                            className="flex items-center gap-3 border-b border-border px-4 py-3"
                            {...draggableProvided.dragHandleProps}
                          >
                            <span
                              className={cn(
                                "flex size-8 shrink-0 items-center justify-center rounded-lg",
                                visual.badgeClass,
                              )}
                            >
                              <Icon className="size-4" />
                            </span>
                            <h3 className="flex-1 text-sm font-semibold text-foreground">
                              {block.title}
                            </h3>
                            <GripVertical className="size-4 shrink-0 text-muted-foreground/50" />
                          </div>
                          <TddBlockCard
                            block={block}
                            index={index}
                            onContentChange={updateBlockContent}
                          />
                        </div>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {droppableProvided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      <SystemArchitectureDiagram projectName={projectName} />
    </div>
  );
}
