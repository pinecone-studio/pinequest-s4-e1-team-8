import type { MeetingListItem } from "@/app/meeting";
import { QuickActions } from "@/components/home/quick-actions";
import { RecentActivityFeed } from "@/components/home/recent-activity-feed";
import { WelcomeHeader } from "@/components/home/welcome-header";

type HomeDashboardProps = {
  meetings: MeetingListItem[];
  todayLabel: string;
};

export function HomeDashboard({ meetings, todayLabel }: HomeDashboardProps) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <div className="flex shrink-0 flex-col gap-6">
        <WelcomeHeader todayLabel={todayLabel} />
        <QuickActions />
      </div>

      <RecentActivityFeed meetings={meetings} />
    </div>
  );
}
