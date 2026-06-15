"use client";

import { useEffect } from "react";

const isEditableElement = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;

  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
};

type UseMediaToggleShortcutsOptions = {
  onToggleCamera: () => void;
  onToggleMicrophone: () => void;
};

export const useMediaToggleShortcuts = ({
  onToggleCamera,
  onToggleMicrophone,
}: UseMediaToggleShortcutsOptions) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || isEditableElement(event.target)) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case "e":
          event.preventDefault();
          onToggleCamera();
          break;
        case "d":
          event.preventDefault();
          onToggleMicrophone();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onToggleCamera, onToggleMicrophone]);
};
