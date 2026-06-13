import type { CSSProperties } from "react";

// Voice orb variants. Colors are pulled from the app's theme tokens (defined in
// globals.css) so the orb automatically adapts to light/dark mode instead of
// using hard-coded Siri-style blues.
export type OrbVariant = "idle" | "listening" | "success" | "error";

const GRADIENTS: Record<OrbVariant, string> = {
  // Brand coral → lavender/purple sweep.
  idle: "linear-gradient(135deg, var(--primary), var(--chart-3) 55%, color-mix(in oklab, var(--primary) 60%, var(--chart-3)))",
  // Brighter, more energetic version while recording.
  listening:
    "linear-gradient(135deg, color-mix(in oklab, var(--primary) 80%, white), var(--chart-3) 50%, color-mix(in oklab, var(--chart-3) 70%, var(--primary)))",
  // Sage/green confirmation.
  success:
    "linear-gradient(135deg, var(--chart-2), color-mix(in oklab, var(--chart-2) 60%, var(--primary)))",
  // Destructive red/coral.
  error:
    "linear-gradient(135deg, var(--destructive), color-mix(in oklab, var(--destructive) 65%, var(--chart-4)))",
};

export function orbGradientStyle(variant: OrbVariant): CSSProperties {
  return { backgroundImage: GRADIENTS[variant] };
}

// Soft drop shadow tinted with the brand color so the glow reads on both themes.
export const ORB_CORE_SHADOW =
  "inset 0 2px 12px rgba(255,255,255,0.45), 0 8px 34px color-mix(in oklab, var(--primary) 40%, transparent)";
