import type {
  AppUser,
  Meeting,
  ChatMessage,
  CaptionLine,
  ActionItem,
  JoinRequest,
  AiSuggestion,
  Note,
  Team,
  NotificationItem,
  NotificationSettings,
  ActivityItem,
} from "@/types";

// Users

export const users: AppUser[] = [
  {
    id: "u1",
    name: "Wilson Reed",
    email: "wilson.reed@pinequest.dev",
    avatarUrl: null,
    initials: "WR",
    role: "Product Lead",
    team: "Product",
  },
  {
    id: "u2",
    name: "Saraa Batbold",
    email: "saraa.batbold@pinequest.dev",
    avatarUrl: null,
    initials: "SB",
    role: "Product Designer",
    team: "Design",
  },
  {
    id: "u3",
    name: "Temuulen Ganbat",
    email: "temuulen.ganbat@pinequest.dev",
    avatarUrl: null,
    initials: "TG",
    role: "Frontend Engineer",
    team: "Engineering",
  },
  {
    id: "u4",
    name: "Anna Kim",
    email: "anna.kim@pinequest.dev",
    avatarUrl: null,
    initials: "AK",
    role: "Backend Engineer",
    team: "Engineering",
  },
  {
    id: "u5",
    name: "Marcus Chen",
    email: "marcus.chen@pinequest.dev",
    avatarUrl: null,
    initials: "MC",
    role: "Engineering Manager",
    team: "Engineering",
  },
  {
    id: "u6",
    name: "Oyun Erdene",
    email: "oyun.erdene@pinequest.dev",
    avatarUrl: null,
    initials: "OE",
    role: "Localization Lead",
    team: "Product",
  },
  {
    id: "u7",
    name: "Drew Bieber",
    email: "drew.bieber@pinequest.dev",
    avatarUrl: null,
    initials: "DB",
    role: "Marketing Manager",
    team: "Marketing",
  },
  {
    id: "u8",
    name: "Priya Shah",
    email: "priya.shah@pinequest.dev",
    avatarUrl: null,
    initials: "PS",
    role: "Growth Lead",
    team: "Marketing",
  },
  {
    id: "u9",
    name: "Lucas Brown",
    email: "lucas.brown@pinequest.dev",
    avatarUrl: null,
    initials: "LB",
    role: "Sales Lead",
    team: "Marketing",
  },
];

export const currentUser: AppUser = users[0];

export function getUserById(id: string): AppUser | undefined {
  return users.find((user) => user.id === id);
}

// Meetings

export const meetings: Meeting[] = [
  {
    id: "m1",
    title: "Design Review",
    roomName: "Design Review",
    meetingId: "meeting-design-review",
    status: "ongoing",
    date: "2026-06-12",
    startTime: "09:30",
    endTime: "10:30",
    participants: [users[0], users[1], users[2], users[5]],
    autoTranslate: true,
    recordAndSummarize: true,
    description: "Weekly design review of the onboarding flow redesign.",
    highlighted: true,
  },
  {
    id: "m2",
    title: "Daily Standup",
    roomName: "Daily Standup",
    meetingId: "meeting-standup",
    status: "ongoing",
    date: "2026-06-12",
    startTime: "09:00",
    endTime: "09:15",
    participants: [users[2], users[3], users[4]],
    autoTranslate: false,
    recordAndSummarize: false,
    description: "Quick sync on sprint progress.",
  },
  {
    id: "m3",
    title: "Engineering Sync",
    roomName: "Engineering",
    meetingId: "meeting-engineering",
    status: "upcoming",
    date: "2026-06-12",
    startTime: "14:00",
    endTime: "15:00",
    participants: [users[0], users[2], users[3], users[4]],
    autoTranslate: true,
    recordAndSummarize: true,
    description: "Discuss the API contract for the new translation pipeline.",
    highlighted: true,
  },
  {
    id: "m4",
    title: "Product Sync",
    roomName: "Product Sync",
    meetingId: "meeting-product",
    status: "upcoming",
    date: "2026-06-13",
    startTime: "11:00",
    endTime: "11:45",
    participants: [users[0], users[5], users[7]],
    autoTranslate: true,
    recordAndSummarize: true,
    description: "Align on Q3 roadmap priorities.",
  },
  {
    id: "m5",
    title: "Marketing Brainstorm",
    roomName: "Marketing Brainstorm",
    meetingId: "meeting-marketing-brainstorm",
    status: "upcoming",
    date: "2026-06-15",
    startTime: "10:00",
    endTime: "11:00",
    participants: [users[6], users[7], users[8]],
    autoTranslate: false,
    recordAndSummarize: true,
    description: "Brainstorm campaign ideas for the Mongolian market launch.",
  },
  {
    id: "m6",
    title: "Sprint Retro",
    roomName: "Sprint Retro",
    meetingId: "meeting-sprint-retro",
    status: "ended",
    date: "2026-06-10",
    startTime: "16:00",
    endTime: "16:45",
    participants: [users[0], users[2], users[3], users[4]],
    autoTranslate: false,
    recordAndSummarize: true,
    description: "Retrospective for sprint 24.",
  },
  {
    id: "m7",
    title: "Client Onboarding Call",
    roomName: "Client Onboarding",
    meetingId: "meeting-client-onboarding",
    status: "ended",
    date: "2026-06-09",
    startTime: "13:00",
    endTime: "13:30",
    participants: [users[0], users[6], users[8]],
    autoTranslate: true,
    recordAndSummarize: true,
    description: "Walkthrough of Brisk for a new enterprise client.",
  },
  {
    id: "m8",
    title: "Design Crit",
    roomName: "Design Crit",
    meetingId: "meeting-design-crit",
    status: "ended",
    date: "2026-06-08",
    startTime: "15:00",
    endTime: "15:30",
    participants: [users[1], users[5]],
    autoTranslate: true,
    recordAndSummarize: true,
    description: "Feedback session on the new meeting room UI.",
  },
  {
    id: "m9",
    title: "All-Hands",
    roomName: "All Hands",
    meetingId: "meeting-all-hands",
    status: "canceled",
    date: "2026-06-11",
    startTime: "17:00",
    endTime: "18:00",
    participants: users,
    autoTranslate: true,
    recordAndSummarize: true,
    description: "Monthly company-wide update. Postponed to next week.",
  },
];

// Meeting room: chat, captions, tasks, join requests, AI suggestions

export const chatMessages: ChatMessage[] = [
  {
    id: "c1",
    author: users[1],
    text: "Sharing the updated onboarding flow now \u{1F3A8}",
    timestamp: "9:31 AM",
  },
  {
    id: "c2",
    author: users[2],
    text: "Looks great! The voice waveform animation is so smooth.",
    timestamp: "9:32 AM",
  },
  {
    id: "c3",
    author: users[0],
    text: "Can we add a skip button on step two?",
    timestamp: "9:33 AM",
    isSelf: true,
  },
  {
    id: "c4",
    author: users[5],
    text: "Good call — I'll double-check the Mongolian translations after this.",
    timestamp: "9:34 AM",
  },
  {
    id: "c5",
    author: users[1],
    text: "I'll mock that up and drop it in the design file.",
    timestamp: "9:35 AM",
  },
  {
    id: "c6",
    author: users[0],
    text: "Perfect, thanks team!",
    timestamp: "9:36 AM",
    isSelf: true,
  },
];

export const captionLines: CaptionLine[] = [
  {
    id: "cap1",
    speaker: "Saraa Batbold",
    textEn: "Let's start with the onboarding redesign.",
    textMn: "Эхлээд элсэлтийн дахин загварыг харцгаая.",
    timestamp: "09:30:12",
  },
  {
    id: "cap2",
    speaker: "Wilson Reed",
    textEn: "Sounds good, share your screen whenever you're ready.",
    textMn: "Сайн байна, бэлэн болмогц дэлгэцээ хуваалцаарай.",
    timestamp: "09:30:45",
  },
  {
    id: "cap3",
    speaker: "Temuulen Ganbat",
    textEn: "The new waveform animation reacts to live audio input.",
    textMn: "Шинэ долгионы дүрс хэлбэр амьд дуу авианд тэр чигтээ хариу үйлдэл үзүүлдэг.",
    timestamp: "09:31:20",
  },
  {
    id: "cap4",
    speaker: "Oyun Erdene",
    textEn: "I'll double check the Mongolian translations for accuracy.",
    textMn: "Би монгол орчуулгын нарийвчлалыг дахин шалгана.",
    timestamp: "09:32:05",
  },
  {
    id: "cap5",
    speaker: "Saraa Batbold",
    textEn: "Here's the updated flow — notice the new progress indicator.",
    textMn: "Энэ бол шинэчлэгдсэн урсгал — шинэ явцын заагчийг анзаараарай.",
    timestamp: "09:33:01",
  },
  {
    id: "cap6",
    speaker: "Wilson Reed",
    textEn: "Can we add a skip button on step two?",
    textMn: "Бид хоёр дахь алхамд алгасах товч нэмж болох уу?",
    timestamp: "09:33:40",
  },
];

export const actionItems: ActionItem[] = [
  {
    id: "a1",
    text: "Add skip button to onboarding step 2",
    done: false,
    dueLabel: "Today",
  },
  {
    id: "a2",
    text: "Review Mongolian translation accuracy",
    done: false,
    dueLabel: "Tomorrow",
  },
  {
    id: "a3",
    text: "Share updated onboarding Figma file",
    done: true,
  },
  {
    id: "a4",
    text: "Schedule follow-up design crit",
    done: false,
    dueLabel: "Fri",
  },
  {
    id: "a5",
    text: "Update progress indicator copy",
    done: true,
  },
];

export const joinRequests: JoinRequest[] = [
  {
    id: "j1",
    user: users[6],
  },
];

export const aiSuggestions: AiSuggestion[] = [
  {
    id: "ai1",
    triggerText: "“Let's schedule a follow-up for next week”",
    title: "Add a follow-up meeting to Google Calendar?",
    actions: [
      { id: "ai1-a", label: "Add to Google Calendar", kind: "calendar" },
      { id: "ai1-b", label: "Create meeting notes doc", kind: "docs" },
    ],
  },
  {
    id: "ai2",
    triggerText: "“I'll share the budget numbers in a spreadsheet”",
    title: "Create a shared budget tracker?",
    actions: [
      { id: "ai2-a", label: "Create Google Sheet", kind: "sheets" },
      { id: "ai2-b", label: "Add link to meeting notes", kind: "docs" },
    ],
  },
];

// Notes

export const notes: Note[] = [
  {
    id: "note1",
    title: "Design Review – Onboarding Redesign Notes",
    date: "Jun 10, 2026",
    owner: users[1],
    team: "Design",
    summary:
      "Decisions and follow-ups from the weekly design review of the onboarding flow redesign.",
    docUrl: "#",
    content: [
      "Reviewed the updated onboarding flow with the new step indicator and voice enrollment screen.",
      "Agreed to add a skip option on step two for users who want to set up voice verification later.",
      "Oyun will review the Mongolian translations for the enrollment prompts before next handoff.",
      "Saraa to share the updated Figma file with the engineering team by end of week.",
    ],
  },
  {
    id: "note2",
    title: "Sprint 24 Retro Notes",
    date: "Jun 10, 2026",
    owner: users[4],
    team: "Engineering",
    summary:
      "Wins, blockers, and action items from the sprint 24 retrospective.",
    docUrl: "#",
    content: [
      "Wins: shipped the participant filmstrip and recording controls on schedule.",
      "Blocker: flaky LiveKit reconnect test slowed down CI — assigned to Anna, now fixed.",
      "Next sprint: add integration tests for the translation pipeline.",
      "Action: document the recording controls API for other teams.",
    ],
  },
  {
    id: "note3",
    title: "Client Onboarding – Acme Corp",
    date: "Jun 9, 2026",
    owner: users[0],
    team: "Marketing",
    summary:
      "Notes from the Brisk walkthrough call with the Acme Corp enterprise prospect.",
    docUrl: "#",
    content: [
      "Walked through real-time MN/EN translation, AI summaries, and Google Workspace automation.",
      "Client is interested in a 40-person rollout with voice enrollment for the whole team.",
      "Asked about SSO support — engineering confirmed this is supported today.",
      "Next steps: send rollout plan and enterprise pricing by Friday.",
    ],
  },
  {
    id: "note4",
    title: "Q3 Roadmap Brainstorm",
    date: "Jun 7, 2026",
    owner: users[0],
    team: "Product",
    summary:
      "Early ideas and priorities for the Q3 roadmap planning cycle.",
    docUrl: "#",
    content: [
      "Top priority: reduce translation latency below 800ms across all meeting rooms.",
      "Explore automatic action item extraction from meeting summaries.",
      "Consider a lightweight mobile app for joining meetings and reviewing summaries.",
      "Localization: expand the style guide to cover marketing copy, not just product UI.",
    ],
  },
  {
    id: "note5",
    title: "Localization Style Guide v2",
    date: "Jun 5, 2026",
    owner: users[5],
    team: "Product",
    summary:
      "Updated guidance for translating Brisk's UI and meeting summaries into Mongolian.",
    docUrl: "#",
    content: [
      "Use formal register for system messages, informal register for chat and captions.",
      "Keep product names (Brisk, Google Docs, Google Sheets) untranslated.",
      "Numbers, dates, and times follow the user's locale settings automatically.",
      "Added a glossary of approved translations for common meeting terminology.",
    ],
  },
  {
    id: "note6",
    title: "Marketing Campaign Ideas – MN Launch",
    date: "Jun 4, 2026",
    owner: users[7],
    team: "Marketing",
    summary:
      "Brainstormed campaign concepts for the upcoming Mongolian market launch.",
    docUrl: "#",
    content: [
      "Concept A: “Meet in any language” — highlight real-time MN/EN translation.",
      "Concept B: customer story featuring a bilingual team using Brisk daily.",
      "Concept C: short demo video showing the AI summary and task extraction.",
      "Lucas to scope partnership opportunities with local universities.",
    ],
  },
];

export function getNoteByIdSync(id: string): Note | undefined {
  return notes.find((note) => note.id === id);
}

// Teams

export const teams: Team[] = [
  {
    id: "team-product",
    name: "Product",
    description: "Defining what we build and why.",
    tag: "Product",
    members: [
      { user: users[0], role: "Owner" },
      { user: users[5], role: "Member" },
      { user: users[1], role: "Member" },
    ],
    goal: {
      title: "Ship the Brisk v2.0 onboarding redesign",
      progress: 64,
    },
    resources: [
      {
        id: "team-product-res-1",
        name: "Strategy Docs",
        items: [
          {
            id: "team-product-item-1",
            title: "Q3 Roadmap.docx",
            type: "doc",
            url: "#",
            addedBy: "Wilson Reed",
          },
          {
            id: "team-product-item-2",
            title: "Brisk Pitch Deck.pdf",
            type: "file",
            url: "#",
            addedBy: "Wilson Reed",
          },
        ],
      },
      {
        id: "team-product-res-2",
        name: "Links",
        items: [
          {
            id: "team-product-item-3",
            title: "Figma – Product Specs",
            type: "link",
            url: "#",
            addedBy: "Saraa Batbold",
          },
        ],
      },
    ],
    rooms: [
      { id: "team-product-room-1", name: "Product War Room", participants: [users[0], users[5]] },
      { id: "team-product-room-2", name: "Design Sync", participants: [] },
    ],
    noteIds: ["note4", "note5"],
  },
  {
    id: "team-design",
    name: "Design",
    description: "Crafting delightful, accessible experiences.",
    tag: "Design",
    members: [
      { user: users[1], role: "Owner" },
      { user: users[5], role: "Member" },
    ],
    goal: {
      title: "Finalize the meeting room visual redesign",
      progress: 80,
    },
    resources: [
      {
        id: "team-design-res-1",
        name: "Design Files",
        items: [
          {
            id: "team-design-item-1",
            title: "Brisk Design System.fig",
            type: "link",
            url: "#",
            addedBy: "Saraa Batbold",
          },
          {
            id: "team-design-item-2",
            title: "Onboarding Flow v3.fig",
            type: "link",
            url: "#",
            addedBy: "Saraa Batbold",
          },
        ],
      },
      {
        id: "team-design-res-2",
        name: "Guidelines",
        items: [
          {
            id: "team-design-item-3",
            title: "Accessibility Checklist.docx",
            type: "doc",
            url: "#",
            addedBy: "Oyun Erdene",
          },
        ],
      },
    ],
    rooms: [
      { id: "team-design-room-1", name: "Design Lounge", participants: [users[1]] },
    ],
    noteIds: ["note1"],
  },
  {
    id: "team-engineering",
    name: "Engineering",
    description: "Building the real-time translation and meeting infrastructure.",
    tag: "Engineering",
    members: [
      { user: users[4], role: "Owner" },
      { user: users[2], role: "Member" },
      { user: users[3], role: "Member" },
    ],
    goal: {
      title: "Reduce translation latency below 800ms",
      progress: 45,
    },
    resources: [
      {
        id: "team-eng-res-1",
        name: "Technical Docs",
        items: [
          {
            id: "team-eng-item-1",
            title: "Translation Pipeline RFC.docx",
            type: "doc",
            url: "#",
            addedBy: "Marcus Chen",
          },
          {
            id: "team-eng-item-2",
            title: "LiveKit Integration Guide",
            type: "link",
            url: "#",
            addedBy: "Anna Kim",
          },
        ],
      },
      {
        id: "team-eng-res-2",
        name: "Dashboards",
        items: [
          {
            id: "team-eng-item-3",
            title: "Latency Monitoring Dashboard",
            type: "link",
            url: "#",
            addedBy: "Temuulen Ganbat",
          },
        ],
      },
    ],
    rooms: [
      { id: "team-eng-room-1", name: "Eng Standup Room", participants: [users[2], users[3], users[4]] },
      { id: "team-eng-room-2", name: "Pairing Booth", participants: [] },
    ],
    noteIds: ["note2"],
  },
  {
    id: "team-marketing",
    name: "Marketing & Growth",
    description: "Telling the Brisk story across Mongolia and global markets.",
    tag: "Marketing",
    members: [
      { user: users[7], role: "Owner" },
      { user: users[6], role: "Member" },
      { user: users[8], role: "Member" },
    ],
    goal: {
      title: "Launch the Mongolian market campaign",
      progress: 30,
    },
    resources: [
      {
        id: "team-marketing-res-1",
        name: "Campaign Assets",
        items: [
          {
            id: "team-marketing-item-1",
            title: "MN Launch Brief.docx",
            type: "doc",
            url: "#",
            addedBy: "Priya Shah",
          },
          {
            id: "team-marketing-item-2",
            title: "Brand Assets Drive Folder",
            type: "link",
            url: "#",
            addedBy: "Drew Bieber",
          },
        ],
      },
      {
        id: "team-marketing-res-2",
        name: "Sales Enablement",
        items: [
          {
            id: "team-marketing-item-3",
            title: "Enterprise Pricing Sheet.pdf",
            type: "file",
            url: "#",
            addedBy: "Lucas Brown",
          },
        ],
      },
    ],
    rooms: [
      { id: "team-marketing-room-1", name: "Campaign Room", participants: [users[6], users[7]] },
    ],
    noteIds: ["note3", "note6"],
  },
];

export function getTeamByIdSync(id: string): Team | undefined {
  return teams.find((team) => team.id === id);
}

// Notifications

export const notifications: NotificationItem[] = [
  {
    id: "notif1",
    title: "Design Review starts in 10 minutes",
    description: "Join the ongoing meeting in the Design Review room.",
    timestamp: "9 min ago",
    read: false,
    type: "meeting",
  },
  {
    id: "notif2",
    title: "New task assigned to you",
    description: "Anna Kim assigned you “Review API contract doc”.",
    timestamp: "1 hr ago",
    read: false,
    type: "task",
  },
  {
    id: "notif3",
    title: "Saraa Batbold shared a note",
    description: "Design Review – Onboarding Redesign Notes",
    timestamp: "2 hr ago",
    read: true,
    type: "team",
  },
  {
    id: "notif4",
    title: "Voice profile verified",
    description: "Your voice biometric profile was successfully verified.",
    timestamp: "Yesterday",
    read: true,
    type: "system",
  },
  {
    id: "notif5",
    title: "Meeting summary ready",
    description: "The AI summary for Sprint Retro is ready to view.",
    timestamp: "Yesterday",
    read: true,
    type: "meeting",
  },
  {
    id: "notif6",
    title: "Marcus Chen completed a task",
    description: "Marked “Fix flaky LiveKit reconnect test” as done.",
    timestamp: "2 days ago",
    read: true,
    type: "team",
  },
];

export const defaultNotificationSettings: NotificationSettings = {
  meetingReminders: true,
  meetingSummaries: true,
  taskAssignments: true,
  teamActivity: false,
  productUpdates: true,
};

// Dashboard team activity feed

export const activity: ActivityItem[] = [
  {
    id: "act1",
    user: users[1],
    action: "shared a note",
    target: "Design Review – Onboarding Redesign Notes",
    team: "Design",
    timestamp: "10 min ago",
  },
  {
    id: "act2",
    user: users[4],
    action: "completed a task",
    target: "Fix flaky LiveKit reconnect test",
    team: "Engineering",
    timestamp: "32 min ago",
  },
  {
    id: "act3",
    user: users[6],
    action: "uploaded a recording",
    target: "Client Onboarding Call",
    team: "Marketing",
    timestamp: "1 hr ago",
  },
  {
    id: "act4",
    user: users[7],
    action: "updated the team goal",
    target: "Launch the Mongolian market campaign → 30%",
    team: "Marketing",
    timestamp: "3 hr ago",
  },
  {
    id: "act5",
    user: users[2],
    action: "scheduled a meeting",
    target: "Engineering Sync",
    team: "Engineering",
    timestamp: "5 hr ago",
  },
];
