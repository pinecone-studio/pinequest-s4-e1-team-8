import { DashboardHeader } from "@/components/dashboard/header/dashboard-header";
import { TaskList } from "@/components/tasks/task-list";
import { Suspense } from "react";

export default function TasksPage() {
  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader />
      <section className="flex flex-1 flex-col px-6 py-4">
        <Suspense fallback={null}>
          <TaskList />
        </Suspense>
      </section>
    </div>
  );
}
