export type AgendaEvent = {
  id: string;
  title: string;
  startLabel: string;
  endLabel: string;
  organizer: string;
  isOwner: boolean;
  meetingUrl?: string;
  isNow: boolean;
  autoJoinDefault: boolean;
};

export const todaysAgenda: AgendaEvent[] = [
  {
    id: "agenda-1",
    title: "Prototype Review Session",
    startLabel: "9:30 AM",
    endLabel: "10:00 AM",
    organizer: "Johana Streves",
    isOwner: true,
    meetingUrl: "https://meet.google.com/abc-defg-hij",
    isNow: true,
    autoJoinDefault: true,
  },
  {
    id: "agenda-2",
    title: "Performance Review Process Update",
    startLabel: "12:00 PM",
    endLabel: "1:00 PM",
    organizer: "Johana Streves",
    isOwner: true,
    meetingUrl: "https://meet.google.com/klm-nopq-rst",
    isNow: false,
    autoJoinDefault: false,
  },
  {
    id: "agenda-3",
    title: "Remote Work Policy Discussion",
    startLabel: "2:00 PM",
    endLabel: "2:30 PM",
    organizer: "Johana Streves",
    isOwner: true,
    meetingUrl: "https://meet.google.com/uvw-xyz1-234",
    isNow: false,
    autoJoinDefault: true,
  },
];
