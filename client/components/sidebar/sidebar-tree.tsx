import { cn } from "@/lib/utils";
import { projectTree } from "@/lib/dashboard/data";
import { Plus } from "lucide-react";

type TreeNode = (typeof projectTree)[number];

function NodeIcon({ icon, active }: { icon: string; active?: boolean }) {
  if (icon === "triangle") {
    return (
      <span className="size-0 shrink-0 border-x-[4px] border-b-[7px] border-x-transparent border-b-[#eab308]" />
    );
  }
  if (icon === "square") {
    return <span className="size-2 shrink-0 rounded-[2px] bg-[#f97316]" />;
  }
  if (icon === "circle") {
    return (
      <span
        className={cn(
          "size-2 shrink-0 rounded-full border-[1.5px]",
          active ? "border-[#a78bfa]" : "border-[#5c5c66]",
        )}
      />
    );
  }
  if (icon === "dot-blue") {
    return <span className="size-1.5 shrink-0 rounded-full bg-[#3b82f6]" />;
  }
  return <span className="size-1.5 shrink-0 rounded-full bg-[#5c5c66]" />;
}

function TreeLink({ node }: { node: TreeNode }) {
  const isActive = "active" in node && node.active;
  const badge = "badge" in node ? node.badge : undefined;
  const icon = "icon" in node ? node.icon : "dot";
  const level = node.level;

  const resolvedIcon =
    level >= 1 ? (isActive ? "dot-blue" : "dot") : icon;

  return (
    <a
      href="#"
      className={cn(
        "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[12.5px] transition-colors hover:bg-[#1a1a1e]",
        level === 2 && "ml-3",
        isActive
          ? "font-semibold text-[#a78bfa]"
          : "font-normal text-[#8e8e93] hover:text-[#c4c4cc]",
      )}
    >
      <NodeIcon icon={resolvedIcon} active={icon === "circle"} />
      <span className="min-w-0 flex-1 truncate">{node.label}</span>
      {badge !== undefined && (
        <span className="ml-auto flex size-[18px] shrink-0 items-center justify-center rounded-full bg-[#f97316]/20 text-[10px] font-semibold text-[#fb923c]">
          {badge}
        </span>
      )}
    </a>
  );
}

/** Groups flat `projectTree` rows into roots and nested children for branch lines. */
function groupProjectTree(nodes: readonly TreeNode[]) {
  const groups: { root: TreeNode; children: TreeNode[] }[] = [];
  let i = 0;

  while (i < nodes.length) {
    const root = nodes[i];
    if (root.level !== 0) {
      i += 1;
      continue;
    }
    i += 1;
    const children: TreeNode[] = [];
    while (i < nodes.length && nodes[i].level > 0) {
      children.push(nodes[i]);
      i += 1;
    }
    groups.push({ root, children });
  }

  return groups;
}

export function SidebarTree() {
  const groups = groupProjectTree(projectTree as readonly TreeNode[]);

  return (
    <div className="mt-0.5 pl-1">
      <ul className="space-y-0">
        {groups.map(({ root, children }) => (
          <li key={root.label}>
            <TreeLink node={root} />
            {children.length > 0 && (
              <ul className="relative ml-[14px] border-l border-white/[0.08] pl-2.5">
                {children.map((child) => (
                  <li key={child.label} className="relative">
                    <span
                      aria-hidden
                      className="pointer-events-none absolute top-[18px] -left-2.5 h-px w-2.5 bg-white/[0.08]"
                    />
                    <TreeLink node={child} />
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>

      <a
        href="#"
        className="mt-1 flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-[12.5px] font-medium text-[#a78bfa] transition-colors hover:bg-[#1a1a1e] hover:text-[#c4b5fd]"
      >
        <Plus className="size-3 shrink-0 stroke-[2]" />
        Create New Board
      </a>
    </div>
  );
}
