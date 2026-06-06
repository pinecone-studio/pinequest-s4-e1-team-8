import type { BriskState } from "../brisk.state";

export function metricsWorkerNode(state: typeof BriskState.State) {
  console.log("[metricsWorkerNode] trace");
  return {
    nextWorker: "SUPERVISOR" as const,
  };
}
