import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import { prGeneratorWorkerNode } from "../src/agent/nodes/prGenerator";
async function runTest() {
  const mockDiff = ` diff --git a/server/src/auth.ts b/server/src/auth.ts index 83a3f12..b4b5c6d 100644 --- a/server/src/auth.ts +++ b/server/src/auth.ts -export function verifyUser(token: string) { return false; } +export function verifyUser(token: string) { +  if (!token) throw new Error("Token missing"); +  const session = clerk.verifySession(token); +  return session.isValid; +} `;
  const mockState = {
    messages: [
      new HumanMessage(
        `Generate a PR template for these code changes:\n${mockDiff}`,
      ),
    ] as BaseMessage[],
    nextElement: "pr_worker",
    context: {
      onboardingComplete: true,
      metricsAnalyzed: true,
      risksIdentified: true,
      prGenerated: false,
    },
  };
  try {
    const result = await prGeneratorWorkerNode(mockState);
    console.log("=== PR GENERATOR NODE TEST STATUS ===");
    console.log("Routing Target:", result.nextElement);
    console.log("PR Generated Flag:", result.context?.prGenerated);
    console.log(
      "\n=== AI GENERATED PR OUTPUT ===\n",
      result.messages[result.messages.length - 1]?.content,
    );
  } catch (error) {
    console.error("Node execution failed:", error);
  }
}
runTest();
