"use client";

import { useSidebar } from "@/components/sidebar/sidebar-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { LogIn } from "lucide-react";

export function SidebarAuth() {
  const { collapsed } = useSidebar();

  return (
    <div
      className={cn(
        "flex min-w-0 items-center",
        collapsed ? "justify-center" : "gap-2",
      )}
    >
      <Show when="signed-out">
        {collapsed ? (
          <SignInButton mode="modal">
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              className="size-9 text-[#a78bfa] hover:bg-accent hover:text-foreground"
              aria-label="Sign in"
            >
              <LogIn className="size-4 stroke-[1.75]" />
            </Button>
          </SignInButton>
        ) : (
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <p className="text-[11px] font-medium text-[#a78bfa]">
              Sign in to continue
            </p>
            <div className="flex gap-2">
              <SignInButton mode="modal">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="flex-1 bg-muted text-foreground hover:bg-accent"
                >
                  Sign in
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button
                  type="button"
                  size="sm"
                  className="flex-1 bg-[#7c3aed] text-white hover:bg-[#6d28d9]"
                >
                  Sign up
                </Button>
              </SignUpButton>
            </div>
          </div>
        )}
      </Show>

      <Show when="signed-in">
        <UserButton
          appearance={{
            elements: {
              avatarBox: collapsed ? "size-9" : "size-10",
            },
          }}
        />
      </Show>
    </div>
  );
}
