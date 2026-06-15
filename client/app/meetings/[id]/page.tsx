import { MeetingDetailView } from "@/components/meetings/detail/meeting-detail-view";

type MeetingDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MeetingDetailPage({ params }: MeetingDetailPageProps) {
  const { id } = await params;

  return <MeetingDetailView meetingId={id} />;
}
