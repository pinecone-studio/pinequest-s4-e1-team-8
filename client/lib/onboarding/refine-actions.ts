export const REFINE_QUICK_ACTIONS = [
  { id: "rewrite", label: "Rewrite", instruction: "Rewrite for clarity and executive tone." },
  { id: "expand", label: "Expand", instruction: "Expand with more technical detail and examples." },
  { id: "simplify", label: "Simplify", instruction: "Simplify language while keeping technical accuracy." },
  { id: "edge-cases", label: "Edge cases", instruction: "Add edge cases and failure modes." },
] as const;
