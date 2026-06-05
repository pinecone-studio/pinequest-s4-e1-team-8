import { MeetingRoomForm } from "./meeting-room-form";
import { SummaryForm } from "./summary-form";

export const MeetingPageContent = () => (
  <main className="min-h-screen bg-zinc-100 px-4 py-8">
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
      <MeetingRoomForm />
      <SummaryForm />
    </div>
  </main>
);
