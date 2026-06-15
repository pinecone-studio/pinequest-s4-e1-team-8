"use client";

import {
  ConnectionState,
  RoomEvent,
  type Participant,
  type Room,
} from "livekit-client";
import { useCallback, useEffect, useState } from "react";

const TASKS_TOPIC = "meeting-tasks";
const MAX_LABEL_LENGTH = 280;

export type MeetingTaskItem = {
  assigneeIdentity?: string;
  assigneeName?: string;
  completed: boolean;
  createdAt: number;
  dueLabel?: string;
  id: string;
  label: string;
};

type MeetingTaskAddPayload = {
  task: MeetingTaskItem;
  type: "meeting-task-add";
};

type MeetingTaskTogglePayload = {
  completed: boolean;
  id: string;
  type: "meeting-task-toggle";
};

type MeetingTaskPayload = MeetingTaskAddPayload | MeetingTaskTogglePayload;

type UseMeetingTasksOptions = {
  connectionState: ConnectionState;
  room: Room | null;
};

type AddTaskInput = {
  assigneeIdentity?: string;
  assigneeName?: string;
  dueLabel?: string;
  label: string;
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const createTaskId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const parseTaskPayload = (payload: Uint8Array): MeetingTaskPayload | null => {
  try {
    const parsed = JSON.parse(textDecoder.decode(payload)) as Record<string, unknown>;

    if (parsed.type === "meeting-task-add") {
      const task = parsed.task as Record<string, unknown> | undefined;

      if (
        !task ||
        typeof task.id !== "string" ||
        typeof task.label !== "string" ||
        typeof task.completed !== "boolean" ||
        typeof task.createdAt !== "number" ||
        !task.id ||
        !task.label.trim()
      ) {
        return null;
      }

      return {
        task: {
          assigneeIdentity:
            typeof task.assigneeIdentity === "string"
              ? task.assigneeIdentity
              : undefined,
          assigneeName:
            typeof task.assigneeName === "string" ? task.assigneeName : undefined,
          completed: task.completed,
          createdAt: task.createdAt,
          dueLabel: typeof task.dueLabel === "string" ? task.dueLabel : undefined,
          id: task.id,
          label: task.label.slice(0, MAX_LABEL_LENGTH),
        },
        type: "meeting-task-add",
      };
    }

    if (
      parsed.type === "meeting-task-toggle" &&
      typeof parsed.id === "string" &&
      typeof parsed.completed === "boolean" &&
      parsed.id
    ) {
      return {
        completed: parsed.completed,
        id: parsed.id,
        type: "meeting-task-toggle",
      };
    }

    return null;
  } catch {
    return null;
  }
};

export const useMeetingTasks = ({ connectionState, room }: UseMeetingTasksOptions) => {
  const [tasks, setTasks] = useState<MeetingTaskItem[]>([]);
  const isConnected = connectionState === ConnectionState.Connected;

  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (
      payload: Uint8Array,
      _participant?: Participant,
      _kind?: unknown,
      topic?: string,
    ) => {
      if (topic !== TASKS_TOPIC) return;

      const parsed = parseTaskPayload(payload);
      if (!parsed) return;

      if (parsed.type === "meeting-task-add") {
        setTasks((current) => {
          if (current.some((task) => task.id === parsed.task.id)) return current;
          return [...current, parsed.task];
        });
        return;
      }

      setTasks((current) =>
        current.map((task) =>
          task.id === parsed.id ? { ...task, completed: parsed.completed } : task,
        ),
      );
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);

    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room]);

  const addTask = useCallback(
    async (input: AddTaskInput) => {
      const localParticipant = room?.localParticipant;
      const label = input.label.trim();
      if (!localParticipant || !isConnected || !label) return;

      const task: MeetingTaskItem = {
        assigneeIdentity: input.assigneeIdentity,
        assigneeName: input.assigneeName,
        completed: false,
        createdAt: Date.now(),
        dueLabel: input.dueLabel,
        id: createTaskId(),
        label: label.slice(0, MAX_LABEL_LENGTH),
      };

      setTasks((current) => [...current, task]);

      await localParticipant.publishData(
        textEncoder.encode(
          JSON.stringify({ task, type: "meeting-task-add" } satisfies MeetingTaskAddPayload),
        ),
        { reliable: true, topic: TASKS_TOPIC },
      );
    },
    [isConnected, room],
  );

  const toggleTask = useCallback(
    async (id: string) => {
      const localParticipant = room?.localParticipant;
      const task = tasks.find((item) => item.id === id);
      if (!localParticipant || !isConnected || !task) return;

      const completed = !task.completed;

      setTasks((current) =>
        current.map((item) => (item.id === id ? { ...item, completed } : item)),
      );

      await localParticipant.publishData(
        textEncoder.encode(
          JSON.stringify({
            completed,
            id,
            type: "meeting-task-toggle",
          } satisfies MeetingTaskTogglePayload),
        ),
        { reliable: true, topic: TASKS_TOPIC },
      );
    },
    [isConnected, room, tasks],
  );

  return { addTask, tasks, toggleTask };
};
