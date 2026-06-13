import { Button } from "@/components/ui/button";
import { MeetingAnalysisPanel } from "@/components/meetings/MeetingAnalysisPanel";
import { MeetingDetailHeader } from "@/components/meetings/MeetingDetailHeader";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

type MeetingDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MeetingDetailPage({ params }: MeetingDetailPageProps) {
  const { id } = await params;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4 lg:p-6">
      <Button variant="ghost" size="sm" className="w-fit" render={<Link href="/meetings" />}>
        <ArrowLeftIcon />
        Back to meetings
      </Button>

      <MeetingDetailHeader meetingId={id} />

      <div className="flex flex-col gap-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">AI meeting analysis</h2>
        <MeetingAnalysisPanel meetingId={id} />
      </div>
    </div>
  );
}
