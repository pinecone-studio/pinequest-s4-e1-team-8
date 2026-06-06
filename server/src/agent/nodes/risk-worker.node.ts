import type { BriskState } from "../brisk.state";

export function riskWorkerNode(state: typeof BriskState.State) {
  console.log("[riskWorkerNode] trace");
  return {
    nextWorker: "SUPERVISOR" as const,
  };
}
