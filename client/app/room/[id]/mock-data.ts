import type { RoomData } from "./types";

export const getRoomMockData = (_roomId: string): RoomData => ({
  captions: [
    {
      id: "caption-1",
      speaker: "George",
      text: "Hi guys thank you so much for coming, let's get started with the week one recap.",
    },
    {
      id: "caption-2",
      speaker: "George",
      text: "First up, the onboarding flow redesign is on track for next Tuesday's review.",
    },
    {
      id: "caption-3",
      speaker: "George",
      text: "We also need to align on the reporting dashboard before the client demo.",
    },
    {
      id: "caption-4",
      speaker: "George",
      text: "Sarah, can you walk us through the latest analytics numbers when you get a chance?",
    },
  ],
  locationLabel: "George's Meeting Room",
  messages: [
    {
      author: "Sarah Chen",
      id: "msg-1",
      isOwn: false,
      text: "Morning! Sharing the updated deck now, give me one sec.",
      timestamp: "2:08 PM",
    },
    {
      author: "Sarah Chen",
      id: "msg-2",
      isOwn: false,
      text: "How do you all feel about the new onboarding flow?",
      timestamp: "2:10 PM",
    },
    {
      author: "You",
      id: "msg-3",
      isOwn: true,
      text: "I'll check it offline, thank you so much for the update.",
      timestamp: "2:11 PM",
    },
    {
      author: "Marcus Lee",
      id: "msg-4",
      isOwn: false,
      text: "Looks great so far, just left a couple of comments on the doc.",
      timestamp: "2:13 PM",
    },
    {
      author: "You",
      id: "msg-5",
      isOwn: true,
      text: "Perfect, I'll fold those into the next pass before the demo.",
      timestamp: "2:14 PM",
    },
  ],
  participants: [
    {
      avatarGradient: "from-emerald-400 to-emerald-600",
      id: "you",
      initial: "G",
      isMicOn: true,
      isSelf: true,
      name: "You",
    },
    {
      avatarGradient: "from-sky-400 to-blue-600",
      id: "sarah-chen",
      initial: "S",
      isMicOn: true,
      name: "Sarah Chen",
    },
    {
      avatarGradient: "from-violet-400 to-purple-600",
      id: "marcus-lee",
      initial: "M",
      isMicOn: false,
      name: "Marcus Lee",
    },
    {
      avatarGradient: "from-amber-400 to-orange-600",
      id: "aiko-tanaka",
      initial: "A",
      isMicOn: true,
      name: "Aiko Tanaka",
    },
  ],
  pendingParticipant: {
    id: "drew-bieber",
    name: "Drew Bieber",
  },
  roomName: "Project Reporting – Week 1",
  summary:
    "The team reviewed the week one progress on the onboarding redesign and reporting dashboard. Engineering confirmed the new flow is on track for Tuesday's review, while design flagged a few outstanding states for the empty dashboard. Next steps: finalize the analytics summary, fold in client feedback, and prep the demo environment before Friday's walkthrough.",
  tasks: [
    {
      completed: true,
      dueLabel: "at 1:00 PM",
      id: "task-1",
      label: "Finalize Q3 roadmap slides",
    },
    {
      completed: false,
      dueLabel: "at 2:30 PM",
      id: "task-2",
      label: "Share design specs with engineering",
    },
    {
      completed: true,
      id: "task-3",
      label: "Review client feedback doc",
    },
    {
      completed: false,
      dueLabel: "at 4:00 PM",
      id: "task-4",
      label: "Prepare demo environment",
    },
  ],
});
