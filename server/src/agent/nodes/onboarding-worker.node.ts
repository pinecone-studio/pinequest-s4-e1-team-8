import type { BriskState } from "../brisk.state";

export function onboardingWorkerNode(state: typeof BriskState.State) {
  console.log("[onboardingWorkerNode] trace");
  return {
    nextWorker: "SUPERVISOR" as const,
  };
}
