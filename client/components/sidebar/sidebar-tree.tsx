import { cn } from "@/lib/utils";
import { projectTree } from "@/lib/dashboard/data";
import { Plus, Triangle } from "lucide-react";

type TreeNode = (typeof projectTree)[number];

function NodeIcon({ icon }: { icon: string }) {
  if (icon === "triangle")
    return <Triangle className="size-2.5 shrink-0 fill-amber-400 text-amber-400" />;
  if (icon === "square")
    return <span className="size-2 shrink-0 rounded-[3px] bg-orange-400" />;
  if (icon === "circle")
    return <span className="size-2 shrink-0 rounded-full border border-slate-500" />;
  // dot (child item)
  return <span className="size-1.5 shrink-0 rounded-full bg-slate-500" />;
}

export function SidebarTree() {
  return (
    <div className="ml-3.5 mt-0.5 border-l border-white/8 pl-3">
      <ul className="space-y-0.5">
        {(projectTree as readonly TreeNode[]).map((node) => {
          const isActive = "active" in node && node.active;
          const badge = "badge" in node ? node.badge : undefined;
          const indent =
            node.level === 0 ? "pl-0" : node.level === 1 ? "pl-3" : "pl-6";

          return (
            <li key={node.label}>
              <a
                href="#"
                className={cn(
                  "group flex items-center gap-2 rounded-xl py-1.5 pr-2 text-[12.5px] transition-colors hover:bg-white/5",
                  indent,
                  isActive
                    ? "font-semibold text-violet-400"
                    : "font-normal text-slate-400 hover:text-slate-200",
                )}
              >
                <NodeIcon icon={"icon" in node ? node.icon : "dot"} />
                <span className="min-w-0 flex-1 truncate">{node.label}</span>
                {badge !== undefined && (
                  <span className="ml-auto shrink-0 rounded-md bg-orange-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-orange-400">
                    {badge}
                  </span>
                )}
              </a>
            </li>
          );
        })}
      </ul>

      <a
        href="#"
        className="mt-1 flex items-center gap-1.5 rounded-xl py-1.5 text-[12.5px] font-medium text-violet-400 transition-colors hover:bg-white/5 hover:text-violet-300"
      >
        <Plus className="size-3 shrink-0" />
        Create New Board
      </a>
    </div>
  );
}
