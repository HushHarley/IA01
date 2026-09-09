import Anthropic from "@anthropic-ai/sdk";
import {
  ANTHROPIC_MODEL_ID_MAP,
  ANTHROPIC_REASONING_EFFORT_MAP,
  MAX_OUTPUT_TOKENS_BY_REASONING
} from "../config.js";
import { buildInstructions } from "../prompts/helpDeskPrompt.js";

let client;

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    const error = new Error("The Anthropic API key is not configured.");
    error.code = "MISSING_ANTHROPIC_API_KEY";
    throw error;
  }

  if (!client) {
    client = new Anthropic({
      // ANTHROPIC KEY IS READ HERE, on the server only.
      apiKey: process.env.ANTHROPIC_API_KEY,
      maxRetries: 2,
      timeout: 60_000
    });
  }
  return client;
}

function toAnthropicMessages(messages) {
  return messages.map((message) => ({
    role: message.role,
    content:
      message.role === "assistant" &&
      message.provider === "anthropic" &&
      Array.isArray(message.providerContent)
        ? message.providerContent
        : message.content
  }));
}

export function buildAnthropicRequest(messages, language, reasoning, model) {
  return {
    model: ANTHROPIC_MODEL_ID_MAP[model],
    max_tokens: MAX_OUTPUT_TOKENS_BY_REASONING[reasoning],
    system: buildInstructions(language),
    messages: toAnthropicMessages(messages),
    thinking: { type: "adaptive", display: "omitted" },
    output_config: { effort: ANTHROPIC_REASONING_EFFORT_MAP[reasoning] }
  };
}

export async function createAnthropicHelpDeskReply(messages, language, reasoning, model) {
  // ANTHROPIC API CALL HAPPENS HERE.
  const response = await getClient().messages.create(
    buildAnthropicRequest(messages, language, reasoning, model)
  );
  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n\n")
    .trim();

  if (!text) {
    const error = new Error("Anthropic returned no text output.");
    error.code = "EMPTY_MODEL_RESPONSE";
    throw error;
  }

  // Preserve signed/redacted thinking blocks in server memory for valid Claude continuity.
  return { text, providerContent: response.content };
}
