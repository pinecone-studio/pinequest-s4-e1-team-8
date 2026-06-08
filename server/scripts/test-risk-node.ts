import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import { riskWorkerNode } from "../src/agent/nodes/risk";

async function runTest() {
  const mockState = {
    messages: [
      new HumanMessage(
        "We need to add a real-time translation module to our app sprint, but two of our engineers are out sick this week.",
      ),
    ] as BaseMessage[],
    nextElement: "risk_worker",
    context: {
      onboardingComplete: true,
      metricsAnalyzed: true,
      risksIdentified: false,
    },
  };

  try {
    const result = await riskWorkerNode(mockState);
    console.log("=== RISK NODE TEST STATUS ===");
    console.log("Routing Target:", result.nextElement);
    console.log("Risks Identified Flag:", result.context?.risksIdentified);
    console.log(
      "\n=== AI RISK OUTPUT ===\n",
      result.messages[result.messages.length - 1]?.content,
    );
  } catch (error) {
    console.error("Node execution failed:", error);
  }
}

runTest();
