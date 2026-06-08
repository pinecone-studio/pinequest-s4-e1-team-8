import { DashboardHeader } from "@/components/dashboard/header/dashboard-header";
import { TaskList } from "@/components/tasks/task-list";
import { Suspense } from "react";

export default function TasksPage() {
  return (
    <>
      <DashboardHeader />
      <section className="flex flex-1 flex-col gap-5 px-6 py-6">
        <Suspense fallback={null}>
          <TaskList />
        </Suspense>
      </section>
    </>
  );
}
