import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import { onboardingWorkerNode } from "../src/agent/nodes/onboarding";

async function runTest() {
  const mockState = {
    messages: [
      new HumanMessage(
        "I want to build a web platform for learning Mongolian script called Bichigten using Next.js and Prisma.",
      ),
    ] as BaseMessage[],
    nextElement: "onboarding_worker",
    context: {
      onboardingComplete: false,
      metricsAnalyzed: false,
      risksIdentified: false,
      prGenerated: false,
    },
  };

  try {
    const result = await onboardingWorkerNode(mockState);

    console.log("=== TEST RESULT ===");
    console.log("Next Node Selected:", result.nextElement);
    console.log("Onboarding Flag Status:", result.context?.onboardingComplete);
    console.log("New Messages Appended:", result.messages.length);
    console.log(
      "AI Output:\n",
      result.messages[result.messages.length - 1]?.content,
    );
  } catch (error) {
    console.error("Test execution failed:", error);
  }
}

runTest();
