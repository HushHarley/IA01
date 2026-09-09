import OpenAI from "openai";
import {
  MAX_OUTPUT_TOKENS_BY_REASONING,
  MODEL_ID_MAP,
  REASONING_EFFORT_MAP
} from "../config.js";
import { buildInstructions } from "../prompts/helpDeskPrompt.js";

let client;

function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    const error = new Error("OPENAI_API_KEY is not configured.");
    error.code = "MISSING_API_KEY";
    throw error;
  }

  if (!client) {
    client = new OpenAI({
      // OPENAI KEY IS READ HERE, on the server only.
      apiKey: process.env.OPENAI_API_KEY,
      maxRetries: 2,
      timeout: 60_000
    });
  }
  return client;
}

export function buildResponseRequest(messages, language, reasoning, model) {
  return {
    model: MODEL_ID_MAP[model],
    instructions: buildInstructions(language),
    // Provider-specific session metadata must never be sent to another provider.
    input: messages.map(({ role, content }) => ({ role, content })),
    reasoning: { effort: REASONING_EFFORT_MAP[reasoning] },
    // Reasoning tokens count toward this limit, so deeper modes need more headroom.
    max_output_tokens: MAX_OUTPUT_TOKENS_BY_REASONING[reasoning],
    store: false
  };
}

export async function createOpenAIHelpDeskReply(messages, language, reasoning, model) {
  // OPENAI API CALL HAPPENS HERE.
  const response = await getClient().responses.create(
    buildResponseRequest(messages, language, reasoning, model)
  );

  const reply = response.output_text?.trim();
  if (!reply) {
    const error = new Error("OpenAI returned no text output.");
    error.code = "EMPTY_MODEL_RESPONSE";
    throw error;
  }

  return reply;
}
