import test from "node:test";
import assert from "node:assert/strict";
import {
  addMessage,
  createConversation,
  getConversation,
  listConversations,
  serializeConversation,
  sessionMiddleware
} from "../src/store/sessionStore.js";
import {
  ANTHROPIC_MODEL_ID_MAP,
  ANTHROPIC_REASONING_EFFORT_MAP,
  DEFAULT_PROVIDER,
  DEFAULT_REASONING,
  getDefaultModelChoice,
  MAX_OUTPUT_TOKENS_BY_REASONING,
  MODEL_ID_MAP,
  REASONING_EFFORT_MAP
} from "../src/config.js";

test("friendly model choices map only to supported model IDs", () => {
  assert.equal(DEFAULT_PROVIDER, "anthropic");
  assert.equal(getDefaultModelChoice(), "sonnet");
  assert.deepEqual(MODEL_ID_MAP, {
    luna: "gpt-5.6-luna",
    terra: "gpt-5.6-terra",
    sol: "gpt-5.6-sol"
  });
  assert.deepEqual(ANTHROPIC_MODEL_ID_MAP, {
    sonnet: "claude-sonnet-5",
    opus: "claude-opus-5",
    fable: "claude-fable-5-1"
  });
  assert.equal(getDefaultModelChoice("openai", "gpt-5.6-luna"), "luna");
  assert.equal(getDefaultModelChoice("openai", "gpt-5.6-terra"), "terra");
  assert.equal(getDefaultModelChoice("openai", "gpt-5.6-sol"), "sol");
  assert.equal(getDefaultModelChoice("openai", "unsupported"), "terra");
  assert.equal(getDefaultModelChoice("anthropic", "claude-opus-5"), "opus");
  assert.equal(getDefaultModelChoice("anthropic", "unsupported"), "sonnet");
});

test("friendly reasoning choices map to supported API effort values", () => {
  assert.equal(DEFAULT_REASONING, "instant");
  assert.deepEqual(REASONING_EFFORT_MAP, {
    instant: "none",
    medium: "medium",
    high: "high",
    very_high: "xhigh",
    ultra: "max"
  });
  assert.deepEqual(ANTHROPIC_REASONING_EFFORT_MAP, {
    instant: "low",
    medium: "medium",
    high: "high",
    very_high: "xhigh",
    ultra: "max"
  });
  assert.deepEqual(MAX_OUTPUT_TOKENS_BY_REASONING, {
    instant: 2000,
    medium: 3000,
    high: 4000,
    very_high: 6000,
    ultra: 8000
  });
});

test("conversation history stays bounded and begins with a user turn", () => {
  const session = { messages: [] };
  for (let turn = 1; turn <= 15; turn += 1) {
    addMessage(session, "user", `question ${turn}`);
    addMessage(session, "assistant", `answer ${turn}`);
  }

  assert.equal(session.messages.length, 20);
  assert.equal(session.messages[0].role, "user");
  assert.equal(session.messages.at(-1).role, "assistant");
  assert.equal(session.messages.at(-1).content, "answer 15");
});

test("multiple conversations remain isolated and receive safe summaries", () => {
  const session = { conversations: [], activeConversationId: null, lastSeen: 0 };
  const frenchConversation = createConversation(session);
  addMessage(frenchConversation, "user", "Mon imprimante ne répond plus");
  addMessage(frenchConversation, "assistant", "Voyez-vous un message d’erreur?", {
    provider: "anthropic",
    providerContent: [{ type: "redacted_thinking", data: "server-only" }]
  });
  const englishConversation = createConversation(session);
  englishConversation.language = "en";
  addMessage(englishConversation, "user", "Git cannot find my repository");

  assert.equal(getConversation(session, frenchConversation.id), frenchConversation);
  assert.equal(getConversation(session, englishConversation.id), englishConversation);
  assert.equal(frenchConversation.messages.length, 2);
  assert.equal(englishConversation.messages.length, 1);
  assert.equal(listConversations(session)[0].title, "Git cannot find my repository");

  const safeHistory = serializeConversation(frenchConversation);
  assert.deepEqual(safeHistory.messages[1], {
    role: "assistant",
    content: "Voyez-vous un message d’erreur?"
  });
  assert.equal(JSON.stringify(safeHistory).includes("server-only"), false);
});

test("production sessions use a Secure __Host- cookie with strict same-site rules", () => {
  const previousEnvironment = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  let cookie;

  sessionMiddleware(
    { headers: {} },
    { setHeader: (name, value) => { if (name === "Set-Cookie") cookie = value; } },
    () => {}
  );

  if (previousEnvironment === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = previousEnvironment;
  assert.match(cookie, /^__Host-nexus_support_session=/);
  assert.match(cookie, /; Path=\//);
  assert.match(cookie, /; HttpOnly/);
  assert.match(cookie, /; SameSite=Strict/);
  assert.match(cookie, /; Secure/);
  assert.doesNotMatch(cookie, /Domain=/i);
});

test("Railway sessions are secure even when NODE_ENV was not set manually", () => {
  const previousEnvironment = process.env.NODE_ENV;
  const previousRailwayEnvironment = process.env.RAILWAY_ENVIRONMENT_NAME;
  process.env.NODE_ENV = "development";
  process.env.RAILWAY_ENVIRONMENT_NAME = "production";
  let cookie;

  sessionMiddleware(
    { headers: {} },
    { setHeader: (name, value) => { if (name === "Set-Cookie") cookie = value; } },
    () => {}
  );

  if (previousEnvironment === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = previousEnvironment;
  if (previousRailwayEnvironment === undefined) delete process.env.RAILWAY_ENVIRONMENT_NAME;
  else process.env.RAILWAY_ENVIRONMENT_NAME = previousRailwayEnvironment;

  assert.match(cookie, /^__Host-nexus_support_session=/);
  assert.match(cookie, /; Secure/);
  assert.match(cookie, /; HttpOnly/);
  assert.match(cookie, /; SameSite=Strict/);
});

test("a malformed cookie is ignored instead of crashing session handling", () => {
  assert.doesNotThrow(() => {
    sessionMiddleware(
      { headers: { cookie: "nexus_support_session=%E0%A4%A" } },
      { setHeader: () => {} },
      () => {}
    );
  });
});
