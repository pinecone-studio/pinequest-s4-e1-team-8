import { cn } from "@/lib/utils";
import { projectTree } from "@/lib/dashboard/data";
import { ChevronDown, ChevronRight } from "lucide-react";

export function SidebarTree() {
  return (
    <ul className="ml-3 space-y-0.5 border-l border-border/40 pl-3">
      {projectTree.map((node) => (
          <li key={node.label}>
            <a
              href="#"
              className={cn(
                "flex items-center gap-1.5 rounded-xl py-1.5 text-[13px] transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                node.level === 1 && "pl-4",
                node.level === 2 && "pl-7",
                node.level === 0 && "pl-1",
                "active" in node && node.active
                  ? "font-medium text-violet-600 dark:text-violet-300"
                  : "text-muted-foreground"
              )}
            >
              {"expanded" in node && node.expanded ? (
                <ChevronDown className="size-3.5 shrink-0" />
              ) : (
                <ChevronRight className="size-3.5 shrink-0 opacity-40" />
              )}
              {node.label}
            </a>
          </li>
        ))}
    </ul>
  );
}
