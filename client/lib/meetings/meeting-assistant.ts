import type { MeetingDetailsActionItem } from "@/app/meeting";
import type { SpeakerTalkTimeStat } from "@/lib/meetings/meeting-speaker-stats";

export type AssistantMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  bullets?: string[];
};

export type AssistantContext = {
  meetingTitle: string;
  keyPoints: string[];
  actionItems: MeetingDetailsActionItem[];
  topics: string[];
  speakerStats: SpeakerTalkTimeStat[];
};

export const ASSISTANT_SUGGESTIONS = [
  "Summarize this meeting",
  "What are the action items?",
  "Who talked the most?",
  "What topics were covered?",
];

let messageCounter = 0;

const nextId = (role: AssistantMessage["role"]) => {
  messageCounter += 1;
  return `${role}-${messageCounter}`;
};

export const buildAssistantIntro = (context: AssistantContext): AssistantMessage => ({
  id: nextId("assistant"),
  role: "assistant",
  text: `Hi! I'm your Brisk AI assistant. Ask me anything about "${context.meetingTitle}" — I can summarize the discussion, list action items, or break down who spoke the most.`,
});

export const buildAssistantReply = (query: string, context: AssistantContext): AssistantMessage => {
  const normalized = query.toLowerCase();

  if (
    normalized.includes("action") ||
    normalized.includes("task") ||
    normalized.includes("to-do") ||
    normalized.includes("todo")
  ) {
    if (context.actionItems.length === 0) {
      return {
        id: nextId("assistant"),
        role: "assistant",
        text: "No action items were captured for this meeting yet.",
      };
    }

    return {
      id: nextId("assistant"),
      role: "assistant",
      text: "Here are the action items from this meeting:",
      bullets: context.actionItems.map((item) => `${item.owner}: ${item.action}`),
    };
  }

  if (normalized.includes("talk") || normalized.includes("speak") || normalized.includes("most")) {
    if (context.speakerStats.length === 0) {
      return {
        id: nextId("assistant"),
        role: "assistant",
        text: "I don't have speaker talk-time data for this meeting.",
      };
    }

    const sorted = [...context.speakerStats].sort((a, b) => b.percentage - a.percentage);

    return {
      id: nextId("assistant"),
      role: "assistant",
      text: "Here's the talk-time breakdown:",
      bullets: sorted.map((stat) => `${stat.user.name}: ${stat.percentage}%`),
    };
  }

  if (normalized.includes("topic") || normalized.includes("about") || normalized.includes("discuss")) {
    return {
      id: nextId("assistant"),
      role: "assistant",
      text: "This meeting covered the following topics:",
      bullets: context.topics,
    };
  }

  if (normalized.includes("decision") || normalized.includes("decide")) {
    if (context.keyPoints.length === 0) {
      return {
        id: nextId("assistant"),
        role: "assistant",
        text: "No key decisions were recorded for this meeting yet.",
      };
    }

    return {
      id: nextId("assistant"),
      role: "assistant",
      text: "Here are the key decisions:",
      bullets: context.keyPoints,
    };
  }

  if (normalized.includes("summar")) {
    return {
      id: nextId("assistant"),
      role: "assistant",
      text: `Here's a quick recap of "${context.meetingTitle}":`,
      bullets: [
        ...context.keyPoints.slice(0, 3),
        ...context.topics.slice(0, 2).map((topic) => `Discussed: ${topic}`),
      ].slice(0, 5),
    };
  }

  return {
    id: nextId("assistant"),
    role: "assistant",
    text: "I can help with summaries, action items, key decisions, talk-time breakdowns, or the topics covered. Try one of the suggestions below or ask me something specific.",
  };
};
