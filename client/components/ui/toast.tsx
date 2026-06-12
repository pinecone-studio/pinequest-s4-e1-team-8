"use client"

import * as React from "react"
import { Toast as ToastPrimitive } from "@base-ui/react/toast"
import { CheckCircle2Icon, InfoIcon, TriangleAlertIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle2Icon,
  error: TriangleAlertIcon,
  info: InfoIcon,
}

const typeStyles: Record<string, string> = {
  success: "text-sage-foreground",
  error: "text-destructive",
  info: "text-primary",
}

function ToastList() {
  const { toasts } = ToastPrimitive.useToastManager()

  return toasts.map((toast) => {
    const Icon = typeIcons[toast.type ?? "info"] ?? InfoIcon

    return (
      <ToastPrimitive.Root
        key={toast.id}
        toast={toast}
        data-slot="toast"
        className={cn(
          "relative z-(--toast-index) flex w-full items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-lg ring-1 ring-foreground/5 select-none",
          "transition-all duration-300",
          "data-starting-style:translate-x-[120%] data-starting-style:opacity-0",
          "data-ending-style:translate-x-[120%] data-ending-style:opacity-0"
        )}
      >
        <Icon
          className={cn(
            "mt-0.5 size-5 shrink-0",
            typeStyles[toast.type ?? "info"] ?? typeStyles.info
          )}
        />
        <div className="min-w-0 flex-1">
          <ToastPrimitive.Title className="text-sm font-semibold text-foreground" />
          <ToastPrimitive.Description className="mt-0.5 text-sm text-muted-foreground" />
        </div>
        <ToastPrimitive.Close
          className="-m-1 shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Dismiss notification"
        >
          <XIcon className="size-4" />
        </ToastPrimitive.Close>
      </ToastPrimitive.Root>
    )
  })
}

function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <ToastPrimitive.Provider>
      {children}
      <ToastPrimitive.Portal>
        <ToastPrimitive.Viewport className="fixed top-4 right-4 z-100 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 outline-none sm:top-6 sm:right-6">
          <ToastList />
        </ToastPrimitive.Viewport>
      </ToastPrimitive.Portal>
    </ToastPrimitive.Provider>
  )
}

const useToast = ToastPrimitive.useToastManager

export { ToastProvider, useToast }
