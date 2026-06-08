import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import { metricsWorkerNode } from "../src/agent/nodes/metrics";

async function runTest() {
  const mockState = {
    messages: [
      new HumanMessage(
        "Show me the development metrics and progress roadmap for our 3-week Next.js app sprint.",
      ),
    ] as BaseMessage[],
    nextElement: "metrics_worker",
    context: {
      onboardingComplete: true,
      metricsAnalyzed: false,
      risksIdentified: false,
      prGenerated: false,
    },
  };

  try {
    const result = await metricsWorkerNode(mockState);
    console.log("=== METRICS NODE TEST STATUS ===");
    console.log("Routing Target:", result.nextElement);
    console.log("Metrics Analyzed Flag:", result.context?.metricsAnalyzed);
    console.log(
      "\n=== AI METRICS OUTPUT ===\n",
      result.messages[result.messages.length - 1]?.content,
    );
  } catch (error) {
    console.error("Node execution failed:", error);
  }
}

runTest();
