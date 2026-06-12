export type NotificationType = "meeting" | "task" | "team" | "system";

export type NotificationItem = {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  type: NotificationType;
};
