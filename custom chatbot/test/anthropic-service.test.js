import test from "node:test";
import assert from "node:assert/strict";
import { buildAnthropicRequest } from "../src/services/anthropicService.js";

test("Claude request uses an allowlisted model, adaptive thinking, and effort", () => {
  const messages = [{ role: "user", content: "Bonjour" }];
  const request = buildAnthropicRequest(messages, "fr", "ultra", "opus");

  assert.equal(request.model, "claude-opus-5");
  assert.equal(request.output_config.effort, "max");
  assert.deepEqual(request.thinking, { type: "adaptive", display: "omitted" });
  assert.equal(request.max_tokens, 8000);
  assert.deepEqual(request.messages, messages);
  assert.match(request.system, /français/);
  assert.equal("apiKey" in request, false);
});

test("Instant maps to Claude's lowest effort and preserves signed provider content", () => {
  const providerContent = [
    { type: "redacted_thinking", data: "signed-placeholder" },
    { type: "text", text: "Previous answer" }
  ];
  const request = buildAnthropicRequest([
    {
      role: "assistant",
      content: "Previous answer",
      provider: "anthropic",
      providerContent
    },
    { role: "user", content: "Next question" }
  ], "en", "instant", "sonnet");

  assert.equal(request.model, "claude-sonnet-5");
  assert.equal(request.output_config.effort, "low");
  assert.equal(request.max_tokens, 2000);
  assert.equal(request.messages[0].content, providerContent);
});
