import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { nanoid } from "nanoid";
import type { OnboardingTranscriptMessage } from "../../lib/onboarding/tdd-types";
import {
  createDefaultCollectedInfo,
  createDefaultConfidence,
  type DiscoveryQuestion,
} from "./discovery.types";
import { createDiscoveryGraph, createDiscoveryModel } from "./discoveryGraph";
import { HARD_ROUND_CAP, computeCoveragePercent } from "./rubric";

/**
 * Manual exploration tool for the self-managing discovery agent.
 *
 * Usage (from `server/`): `bun run discovery:cli`
 * Requires `GEMINI_API_KEY` in `.env.local` (Bun loads it automatically).
 */

function formatQuestionsForDisplay(round: number, questions: DiscoveryQuestion[]): string {
  const lines = [`Round ${round} — a few quick questions:`, ""];
  questions.forEach((question, index) => {
    lines.push(`${index + 1}. ${question.prompt}`);
    if (question.examples && question.examples.length > 0) {
      lines.push(`   e.g. ${question.examples.join(" / ")}`);
    }
  });
  return lines.join("\n");
}

async function main() {
  const apiKey = Bun.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    console.error("Missing GEMINI_API_KEY. Add it to server/.env.local and re-run.");
    process.exit(1);
  }

  const rl = createInterface({ input: stdin, output: stdout });

  const projectName = (await rl.question("Project name: ")).trim() || "Untitled project";
  const description = (await rl.question("Describe your idea in a sentence or two: ")).trim();

  const graph = createDiscoveryGraph(createDiscoveryModel(apiKey));

  let messages: OnboardingTranscriptMessage[] = [];
  let collectedInfo = createDefaultCollectedInfo();
  let confidence = createDefaultConfidence();
  let round = 0;
  let askedTopics: string[] = [];

  for (let turn = 0; turn <= HARD_ROUND_CAP + 1; turn++) {
    console.log("\nThinking...\n");

    const result = await graph.invoke({
      projectName,
      description,
      messages,
      collectedInfo,
      confidence,
      round,
      askedTopics,
      pendingQuestions: [],
      sufficiencyDecision: null,
      sufficiencyReasoning: "",
      brief: null,
    });

    collectedInfo = result.collectedInfo;
    confidence = result.confidence;
    round = result.round;
    askedTopics = result.askedTopics;

    console.log(`Coverage: ${computeCoveragePercent(confidence)}%`);
    console.log(`Sufficiency: ${result.sufficiencyDecision} — ${result.sufficiencyReasoning}\n`);

    if (result.sufficiencyDecision === "synthesize" && result.brief) {
      console.log("=== TDD Planning Brief ===\n");
      console.log(JSON.stringify(result.brief, null, 2));
      rl.close();
      return;
    }

    const questionsText = formatQuestionsForDisplay(round, result.pendingQuestions);
    console.log(questionsText);
    messages = [...messages, { id: nanoid(), role: "assistant", content: questionsText }];

    const answer = await rl.question("\nYour answer: ");
    messages = [...messages, { id: nanoid(), role: "user", content: answer.trim() }];
  }

  console.error("Discovery loop did not converge within the expected number of rounds.");
  rl.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
