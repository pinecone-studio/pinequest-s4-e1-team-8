"use client";

import { ActionItemList } from "@/components/shared/action-item-list";
import { toggleActionItem } from "@/lib/mock-api";
import type { ActionItem } from "@/types";
import { useState } from "react";

export function DashboardActionItems({ items }: { items: ActionItem[] }) {
  const [actionItems, setActionItems] = useState(items);

  const handleToggle = (id: string) => {
    setActionItems((current) =>
      current.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
    void toggleActionItem(id);
  };

  return (
    <ActionItemList
      items={actionItems}
      onToggle={handleToggle}
      emptyMessage="You're all caught up — no open action items."
    />
  );
}
