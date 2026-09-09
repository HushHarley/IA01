import test from "node:test";
import assert from "node:assert/strict";
import { buildResponseRequest } from "../src/services/openaiService.js";

test("OpenAI request uses safe storage, model, and reasoning settings", () => {
  const messages = [{ role: "user", content: "Bonjour" }];
  const request = buildResponseRequest(messages, "fr", "ultra", "sol");

  assert.equal(request.model, "gpt-5.6-sol");
  assert.equal(request.reasoning.effort, "max");
  assert.equal(request.max_output_tokens, 8000);
  assert.equal(request.store, false);
  assert.deepEqual(request.input, messages);
  assert.match(request.instructions, /français/);
  assert.equal("apiKey" in request, false);
  assert.equal("user" in request, false);
});

test("OpenAI request strips provider-specific server metadata", () => {
  const request = buildResponseRequest([
    {
      role: "assistant",
      content: "Previous answer",
      provider: "anthropic",
      providerContent: [{ type: "text", text: "Previous answer" }]
    }
  ], "en", "instant", "terra");

  assert.deepEqual(request.input, [{ role: "assistant", content: "Previous answer" }]);
});

test("Instant Luna request maps to the lowest supported effort", () => {
  const request = buildResponseRequest([], "en", "instant", "luna");
  assert.equal(request.model, "gpt-5.6-luna");
  assert.equal(request.reasoning.effort, "none");
  assert.equal(request.max_output_tokens, 2000);
});
