import { createAnthropicHelpDeskReply } from "./anthropicService.js";
import { createOpenAIHelpDeskReply } from "./openaiService.js";

export async function createHelpDeskReply(messages, language, reasoning, provider, model) {
  // PROVIDER SELECTION HAPPENS HERE. Only the selected server service is called.
  if (provider === "anthropic") {
    return createAnthropicHelpDeskReply(messages, language, reasoning, model);
  }

  return {
    text: await createOpenAIHelpDeskReply(messages, language, reasoning, model)
  };
}
