import test, { after, before } from "node:test";
import assert from "node:assert/strict";

let server;
let baseUrl;

before(async () => {
  process.env.NODE_ENV = "test";
  process.env.OPENAI_API_KEY = "";
  process.env.ANTHROPIC_API_KEY = "";
  process.env.OPENAI_MODEL = "gpt-5.6-terra";
  process.env.ANTHROPIC_MODEL = "claude-sonnet-5";
  const { default: app } = await import("../server.js");
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(() => new Promise((resolve) => server.close(resolve)));

test("health endpoint reveals no API-key configuration details or session cookie", async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    status: "ok",
    service: "Nexus Support"
  });
  assert.equal(response.headers.get("set-cookie"), null);
  assert.match(response.headers.get("cache-control"), /no-store/);
});

test("configuration endpoint returns only safe provider and model defaults", async () => {
  const response = await fetch(`${baseUrl}/api/config`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    defaultProvider: "anthropic",
    defaultModels: { openai: "terra", anthropic: "sonnet" }
  });
});

test("blocks cross-origin chat requests before creating a session", async () => {
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://malicious.example"
    },
    body: JSON.stringify({ message: "Bonjour" })
  });
  assert.equal(response.status, 403);
  assert.equal((await response.json()).error, "CROSS_ORIGIN_BLOCKED");
  assert.equal(response.headers.get("set-cookie"), null);
});

test("rejects an empty message", async () => {
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "   " })
  });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, "EMPTY_MESSAGE");
});

test("rejects an oversized message", async () => {
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "x".repeat(4001) })
  });
  assert.equal(response.status, 413);
  assert.equal((await response.json()).error, "MESSAGE_TOO_LARGE");
});

test("rejects an unsupported reasoning level", async () => {
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Bonjour", reasoning: "unlimited" })
  });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, "INVALID_REASONING");
});

test("rejects an unsupported model", async () => {
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Bonjour", model: "arbitrary-model" })
  });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, "INVALID_MODEL");
});

test("rejects an unsupported provider", async () => {
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Bonjour", provider: "untrusted-provider" })
  });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, "INVALID_PROVIDER");
});

test("rejects a model that does not belong to the selected provider", async () => {
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Bonjour", provider: "anthropic", model: "terra" })
  });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, "INVALID_MODEL");
});

test("rejects an unsupported interface language", async () => {
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Bonjour", language: "de" })
  });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, "INVALID_LANGUAGE");
});

test("rejects malformed JSON without a stack trace", async () => {
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{"
  });
  const body = await response.json();
  assert.equal(response.status, 400);
  assert.equal(body.error, "INVALID_JSON");
  assert.equal("stack" in body, false);
});

test("returns a safe configuration error when the API key is missing", async () => {
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Bonjour" })
  });
  const text = await response.text();
  assert.equal(response.status, 503);
  assert.match(text, /SERVICE_NOT_CONFIGURED/);
  assert.doesNotMatch(text, /OPENAI_API_KEY/);
  assert.match(response.headers.get("cache-control"), /no-store/);
  assert.match(response.headers.get("set-cookie"), /HttpOnly/);
  assert.match(response.headers.get("set-cookie"), /SameSite=Strict/);
});

test("returns the same safe configuration error when the Anthropic key is missing", async () => {
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "Hello",
      provider: "anthropic",
      model: "sonnet",
      reasoning: "instant"
    })
  });
  const text = await response.text();
  assert.equal(response.status, 503);
  assert.match(text, /SERVICE_NOT_CONFIGURED/);
  assert.doesNotMatch(text, /ANTHROPIC_API_KEY/);
  assert.match(response.headers.get("cache-control"), /no-store/);
});

test("creates, lists, and reopens isolated server-side conversations", async () => {
  const initialResponse = await fetch(`${baseUrl}/api/chat/conversations`);
  const cookie = initialResponse.headers.get("set-cookie").split(";", 1)[0];
  const initial = await initialResponse.json();
  assert.equal(initialResponse.status, 200);
  assert.equal(initial.conversations.length, 1);
  assert.equal(initial.conversations[0].messageCount, 0);

  const createResponse = await fetch(`${baseUrl}/api/chat/conversations`, {
    method: "POST",
    headers: { Cookie: cookie }
  });
  const created = await createResponse.json();
  assert.equal(createResponse.status, 201);
  assert.equal(created.conversation.language, "fr");
  assert.deepEqual(created.conversation.messages, []);

  const listResponse = await fetch(`${baseUrl}/api/chat/conversations`, {
    headers: { Cookie: cookie }
  });
  const listed = await listResponse.json();
  assert.equal(listed.conversations.length, 2);
  assert.equal(listed.activeConversationId, created.conversation.id);

  const reopenResponse = await fetch(
    `${baseUrl}/api/chat/conversations/${encodeURIComponent(created.conversation.id)}`,
    { headers: { Cookie: cookie } }
  );
  assert.equal(reopenResponse.status, 200);
  assert.equal((await reopenResponse.json()).conversation.id, created.conversation.id);
});

test("does not allow a session to read an unknown conversation", async () => {
  const response = await fetch(`${baseUrl}/api/chat/conversations/not-owned`);
  const body = await response.json();
  assert.equal(response.status, 404);
  assert.equal(body.error, "CONVERSATION_NOT_FOUND");
});

test("serves the browser application", async () => {
  const response = await fetch(baseUrl);
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /Nexus Support/);
  assert.match(html, /data-ui-language="fr"/);
  assert.match(html, /data-ui-language="en"/);
  assert.match(html, /data-ui-language="fr" aria-pressed="true"/);
  assert.match(html, /value="openai"/);
  assert.match(html, /value="anthropic" selected/);
  assert.match(html, /Claude \(Anthropic\)/);
  assert.match(html, /id="chat-sidebar"/);
  assert.match(html, /id="conversation-list"/);
  assert.match(html, /id="theme-toggle"/);
  assert.match(html, /fournisseur d’IA sélectionné/);
  assert.doesNotMatch(html, /OPENAI_API_KEY|sk-[A-Za-z0-9]/);
  assert.equal(response.headers.get("x-powered-by"), null);
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.match(response.headers.get("content-security-policy"), /frame-ancestors 'none'/);
  assert.match(response.headers.get("permissions-policy"), /camera=\(\)/);
  assert.equal(response.headers.get("access-control-allow-origin"), null);
  assert.equal(response.headers.get("set-cookie"), null);
});

test("deletes only owned conversations and keeps a usable active conversation", async () => {
  const initialResponse = await fetch(`${baseUrl}/api/chat/conversations`);
  const cookie = initialResponse.headers.get("set-cookie").split(";", 1)[0];
  const initial = await initialResponse.json();
  const firstId = initial.activeConversationId;
  const created = await (await fetch(`${baseUrl}/api/chat/conversations`, {
    method: "POST", headers: { Cookie: cookie }
  })).json();
  const secondId = created.conversation.id;
  const foreign = await fetch(`${baseUrl}/api/chat/conversations/${firstId}`, { method: "DELETE" });
  assert.equal(foreign.status, 404);
  const crossOrigin = await fetch(`${baseUrl}/api/chat/conversations/${firstId}`, {
    method: "DELETE", headers: { Cookie: cookie, Origin: "https://malicious.example" }
  });
  assert.equal(crossOrigin.status, 403);
  const deleted = await fetch(`${baseUrl}/api/chat/conversations/${firstId}`, {
    method: "DELETE", headers: { Cookie: cookie }
  });
  assert.equal(deleted.status, 200);
  const remaining = await deleted.json();
  assert.deepEqual(remaining.conversations.map(({ id }) => id), [secondId]);
  assert.equal(remaining.conversation.id, secondId);
  assert.equal((await fetch(`${baseUrl}/api/chat/conversations/${firstId}`, {
    headers: { Cookie: cookie }
  })).status, 404);
  const lastDeleted = await (await fetch(`${baseUrl}/api/chat/conversations/${secondId}`, {
    method: "DELETE", headers: { Cookie: cookie }
  })).json();
  assert.equal(lastDeleted.conversations.length, 1);
  assert.notEqual(lastDeleted.conversation.id, secondId);
  assert.deepEqual(lastDeleted.conversation.messages, []);
  const listed = await (await fetch(`${baseUrl}/api/chat/conversations`, {
    headers: { Cookie: cookie }
  })).json();
  assert.equal(listed.activeConversationId, lastDeleted.conversation.id);
});
