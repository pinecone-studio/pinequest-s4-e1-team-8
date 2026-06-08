import type { BriskState } from "../brisk.state";

export function supervisorNode(state: typeof BriskState.State) {
  console.log("[supervisorNode] trace");
  return {
    nextWorker: "FINALIZE" as const,
  };
}
