"use server";

import Anthropic from "@anthropic-ai/sdk";

import { getAnthropicClient } from "@/lib/ai/anthropic-client";
import { assertPracticeAccess } from "@/lib/auth/session";
import { ASSISTANT_TOOLS, executeAssistantTool } from "./tools";
import type { AssistantMessage } from "./types";

const SYSTEM_PROMPT =
  "You are the front-desk assistant embedded in iPractice, a practice-management dashboard. " +
  "You answer the signed-in staff member's questions about their own practice — appointments, " +
  "practitioners, treatments, and patients — by calling the tools provided. Only ever discuss this " +
  "practice's data; you have no knowledge of, and must never speculate about, any other practice. " +
  "Keep answers short and concrete (numbers, names, times) rather than generic, and format lists " +
  "plainly rather than with heavy markdown. If a tool call comes back empty, say so plainly rather " +
  "than guessing. You cannot book, reschedule, or cancel anything yet — if asked, say so and point " +
  "to the Appointments page.";

// Bounds how many tool-call round-trips one reply can take before we give up
// and return something rather than looping indefinitely on a confused chain.
const MAX_TOOL_ROUNDS = 4;

export async function askAssistant(practiceId: string, history: AssistantMessage[]): Promise<AssistantMessage> {
  const session = await assertPracticeAccess(practiceId);
  const client = getAnthropicClient();

  const messages: Anthropic.MessageParam[] = history.map((m) => ({ role: m.role, content: m.content }));

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: ASSISTANT_TOOLS,
      messages,
    });

    const toolUses = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );

    if (toolUses.length === 0 || response.stop_reason !== "tool_use") {
      const text = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === "text")
        .map((block) => block.text)
        .join("\n")
        .trim();
      return { role: "assistant", content: text || "I don't have an answer for that." };
    }

    messages.push({ role: "assistant", content: response.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
      toolUses.map(async (toolUse) => {
        let result: unknown;
        try {
          result = await executeAssistantTool(toolUse.name, toolUse.input as Record<string, unknown>, {
            practiceId,
            session,
          });
        } catch (err) {
          result = { error: err instanceof Error ? err.message : "That lookup failed." };
        }
        return {
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: JSON.stringify(result),
        };
      })
    );

    messages.push({ role: "user", content: toolResults });
  }

  return {
    role: "assistant",
    content: "I wasn't able to finish looking that up — try asking something more specific.",
  };
}
