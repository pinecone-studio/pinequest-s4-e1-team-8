"use client";

import { useSearchParams } from "next/navigation";

export function ConnectCalendarBanner() {
  const params = useSearchParams();
  const error  = params.get("gcal_error");

  return (
    <div className="flex max-w-sm flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1a1d24]">
        <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none">
          <rect x="3" y="4" width="18" height="17" rx="2" stroke="#3b82f6" strokeWidth="1.5"/>
          <path d="M16 2v4M8 2v4M3 10h18" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round"/>
          <rect x="7" y="14" width="4" height="4" rx="0.5" fill="#3b82f6"/>
        </svg>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-semibold text-white">Connect Google Calendar</p>
        <p className="text-xs text-[#5a6170]">
          Grant access to display your real events, meetings, and tasks in this view.
        </p>
      </div>

      {error && (
        <p className="text-xs text-red-400">
          Connection failed: {decodeURIComponent(error)}. Please try again.
        </p>
      )}

      <a
        href="/api/auth/google-calendar"
        className="inline-flex items-center gap-2 rounded-xl bg-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(37,99,235,0.35)] transition-opacity hover:opacity-90"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff"/>
        </svg>
        Connect with Google
      </a>

      <p className="text-[10px] text-[#3a4050]">
        Read-only access · Your data never leaves this app
      </p>
    </div>
  );
}
