import { HumanMessage, type BaseMessage } from "@langchain/core/messages";
import { compileSupervisorGraph } from "../src/agent/graph";

type StreamUpdate = {
  messages?: Array<{ content?: unknown }>;
  context?: {
    onboardingComplete?: boolean;
    metricsAnalyzed?: boolean;
    risksIdentified?: boolean;
    prGenerated?: boolean;
    issueGenerated?: boolean;
  };
};

type MilestoneContext = {
  onboardingComplete: boolean;
  metricsAnalyzed: boolean;
  risksIdentified: boolean;
  prGenerated: boolean;
  issueGenerated: boolean;
};

function renderMessageContent(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }
  return JSON.stringify(content);
}

function buildInitialState() {
  const gitDiff = `diff --git a/server/src/auth.ts b/server/src/auth.ts
--- a/server/src/auth.ts
+++ b/server/src/auth.ts
-export function verifyUser(token: string) {
-  return false;
-}
+export function verifyUser(token: string) {
+  if (!token) throw new Error("Token missing");
+  const session = clerk.verifySession(token);
+  return session.isValid;
+}`;

  const combinedPrompt = `Project goal: Build a web app in 3 weeks. Two engineers are out sick this week.

Generate a PR template for these code changes:
${gitDiff}

Turn this messy request into a structured GitHub issue:
man we need to fix the auth screen its totally lagging when you click login double times and sometimes it breaks completely`;

  return {
    messages: [new HumanMessage(combinedPrompt)] as BaseMessage[],
    nextElement: "supervisor",
    context: {
      onboardingComplete: false,
      metricsAnalyzed: false,
      risksIdentified: false,
      prGenerated: false,
      issueGenerated: false,
    },
  };
}

async function runCompleteStream(): Promise<void> {
  const graph = compileSupervisorGraph();
  const initialState = buildInitialState();
  let latestContext: MilestoneContext = { ...initialState.context };

  console.log("=== SUPERVISOR GRAPH E2E STREAM ===\n");

  const stream = await graph.stream(initialState, { streamMode: "updates" });

  for await (const chunk of stream) {
    for (const [nodeName, update] of Object.entries(chunk as Record<string, StreamUpdate>)) {
      console.log(`[TRANSITION] Entering Node: ${nodeName}`);

      if (update.context) {
        latestContext = { ...latestContext, ...update.context };
      }

      if (update.messages?.length) {
        for (const message of update.messages) {
          console.log("\n[WORKER OUTPUT]\n");
          console.log(renderMessageContent(message.content));
        }
      }
    }
  }

  console.log("\n=== FINAL MILESTONE SUMMARY ===");
  console.log(`onboardingComplete: ${latestContext.onboardingComplete}`);
  console.log(`metricsAnalyzed: ${latestContext.metricsAnalyzed}`);
  console.log(`risksIdentified: ${latestContext.risksIdentified}`);
  console.log(`prGenerated: ${latestContext.prGenerated}`);
  console.log(`issueGenerated: ${latestContext.issueGenerated}`);
  console.log(
    `streamReachedEndWithAllMilestones: ${
      latestContext.onboardingComplete &&
      latestContext.metricsAnalyzed &&
      latestContext.risksIdentified &&
      latestContext.prGenerated &&
      latestContext.issueGenerated
    }`,
  );
}

runCompleteStream().catch((error) => {
  console.error("Stream test failed:", error);
  process.exit(1);
});
