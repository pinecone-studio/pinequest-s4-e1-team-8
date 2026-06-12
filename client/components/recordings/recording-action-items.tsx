"use client";

import { ActionItemList } from "@/components/shared/action-item-list";
import type { ActionItem } from "@/types";
import { useState } from "react";

export function RecordingActionItems({ items }: { items: ActionItem[] }) {
  const [actionItems, setActionItems] = useState(items);

  const handleToggle = (id: string) => {
    setActionItems((current) =>
      current.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  return (
    <ActionItemList
      items={actionItems}
      onToggle={handleToggle}
      emptyMessage="No action items were captured for this recording."
    />
  );
}
