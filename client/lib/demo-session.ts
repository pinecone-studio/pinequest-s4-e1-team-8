/** Demo-only gate before onboarding — not a real auth system. */
export const DEMO_DEFAULT_EMAIL = "wilson.reed@pinequest.dev";

const STORAGE_KEY = "brisk-demo-session";

export type DemoSession = {
  email: string;
  signedInAt: string;
};

export function readDemoSession(): DemoSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DemoSession>;
    const email = parsed.email?.trim();
    if (!email) return null;
    return {
      email,
      signedInAt: parsed.signedInAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function saveDemoSession(email: string) {
  if (typeof window === "undefined") return;

  const session: DemoSession = {
    email: email.trim() || DEMO_DEFAULT_EMAIL,
    signedInAt: new Date().toISOString(),
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearDemoSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function hasDemoSession() {
  return readDemoSession() !== null;
}
