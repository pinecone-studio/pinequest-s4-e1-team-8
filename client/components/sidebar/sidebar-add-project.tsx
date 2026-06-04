import { Plus } from "lucide-react";

export function SidebarAddProject() {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/3 p-4 text-center">
      <button
        type="button"
        aria-label="Add new project"
        className="mx-auto mb-2 flex size-8 items-center justify-center rounded-full bg-violet-600 text-white transition-colors hover:bg-violet-500"
      >
        <Plus className="size-4" />
      </button>
      <p className="text-[12.5px] font-medium text-slate-300">Add New Project</p>
      <p className="mt-0.5 text-[11px] text-slate-500">
        Or use{" "}
        <a href="#" className="text-violet-400 underline underline-offset-2 hover:text-violet-300">
          invite link
        </a>
      </p>
    </div>
  );
}
