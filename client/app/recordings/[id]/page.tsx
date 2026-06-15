import { RecordingDetailView } from "@/components/recordings/recording-detail-view";

type RecordingDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RecordingDetailPage({
  params,
}: RecordingDetailPageProps) {
  const { id } = await params;

  return <RecordingDetailView recordingId={id} />;
}
