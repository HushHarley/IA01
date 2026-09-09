# API key, API call, and conversation map

This file identifies precisely where Nexus Support loads credentials, calls external AI APIs, and structures conversation history. All paths are relative to the `custom chatbot` project directory.

## 1. Where environment variables are loaded

The first line of `server.js` imports `dotenv/config`:

```js
import "dotenv/config";
```

This reads values from the local `.env` file into the Node.js server's `process.env`. The `.env` file is ignored by Git. Loading the variables does not place them in the browser.

The relevant local variable names are:

```dotenv
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
```

On Railway, the same names must be created in the service's Variables settings instead of uploading `.env`.

## 2. Where each API key is read

### OpenAI

`src/services/openaiService.js`, inside `getClient()`:

```js
client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 2,
  timeout: 60_000
});
```

This is where the OpenAI key is read. This module runs only in Node.js on the server.

### Anthropic

`src/services/anthropicService.js`, inside `getClient()`:

```js
client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  maxRetries: 2,
  timeout: 60_000
});
```

This is where the Anthropic key is read. This module also runs only on the server.

## 3. Where the external API is called

### OpenAI Responses API

`src/services/openaiService.js`, inside `createOpenAIHelpDeskReply()`:

```js
const response = await getClient().responses.create(
  buildResponseRequest(messages, language, reasoning, model)
);
```

This is the actual OpenAI network call. `buildResponseRequest()` creates the allowlisted model, system instructions, bounded conversation input, reasoning effort, output limit, and `store: false` setting.

### Anthropic Messages API

`src/services/anthropicService.js`, inside `createAnthropicHelpDeskReply()`:

```js
const response = await getClient().messages.create(
  buildAnthropicRequest(messages, language, reasoning, model)
);
```

This is the actual Anthropic network call. `buildAnthropicRequest()` creates the allowlisted model, system instructions, conversation messages, adaptive-thinking configuration, reasoning effort, and output limit.

### Provider dispatch

`src/services/llmService.js` decides which of those two functions to call:

```js
if (provider === "anthropic") {
  return createAnthropicHelpDeskReply(messages, language, reasoning, model);
}
```

Claude (Anthropic) is the validated default. `src/routes/chat.js` rejects unknown providers and rejects models that do not belong to the selected provider before this dispatcher runs.

## 4. Where the browser calls the backend

`public/app.js`, inside the chat form's submit handler:

```js
const response = await fetch("/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    message, provider, model, reasoning,
    language: activeLanguage,
    conversationId: activeConversationId
  })
});
```

This is not a direct call to OpenAI or Anthropic. The browser sends only the message and non-secret selections to this project's Express endpoint. Neither API key exists in `public/`.

`server.js` connects that endpoint to the chat router:

```js
app.use("/api/chat", chatRouter);
```

The main request handler is `chatRouter.post("/", ...)` in `src/routes/chat.js`.

## 5. How a conversation is structured

`src/store/sessionStore.js`, in `createSession()` and `createConversation()`, creates a temporary server-side session with this shape. The source is marked with the comment `CONVERSATION STRUCTURE IS CREATED HERE`:

```js
{
  id: "server-generated UUID",
  conversations: [
    {
      id: "server-generated conversation UUID",
      title: null,
      language: "fr",
      messages: [],
      createdAt: 0,
      updatedAt: 0
    }
  ],
  activeConversationId: "server-generated conversation UUID",
  lastSeen: 0
}
```

Each conversation has its own `language` and ordered `messages` array:

```js
[
  { role: "user", content: "Mon Wi-Fi ne fonctionne plus." },
  {
    role: "assistant",
    content: "Le problème touche-t-il un seul appareil ou plusieurs?",
    provider: "openai"
  },
  { role: "user", content: "Un seul appareil." }
]
```

For a Claude assistant turn, the server may also retain signed/redacted `providerContent` required for valid Claude continuity. It remains in server memory, is not returned to the browser, and is stripped before any OpenAI request.

`addMessage()` appends each turn and derives a short sidebar title from the first user message. It limits each history to the most recent 20 messages and ensures retained history begins with a user turn. `createConversation()` limits each session to 20 chats. Sessions expire after two hours of inactivity and disappear whenever the server process restarts.

The sidebar uses `GET /api/chat/conversations`, `POST /api/chat/conversations`, and `GET /api/chat/conversations/:conversationId` in `src/routes/chat.js`. `serializeConversation()` returns only safe fields and removes `provider` and `providerContent` before a history is sent to the browser. Chat text and API keys are never stored in browser storage.

## 6. Message flow from browser to model and back

```text
public/app.js
    │ POST /api/chat (conversation ID + message + non-secret selections)
    ▼
src/routes/chat.js
    │ validate ownership/input and append the user turn to the selected chat
    ▼
src/services/llmService.js
    │ select the validated provider
    ├──► src/services/openaiService.js ──► OpenAI Responses API
    └──► src/services/anthropicService.js ──► Anthropic Messages API
    │
    ▼
src/routes/chat.js
    │ append the assistant turn; return only safe response fields
    ▼
public/app.js
    │ display reply with textContent
    ▼
Browser conversation area
```

## 7. Why visitors cannot see the API keys

- `.env` is ignored by Git and is never served as a static file.
- Keys are read only by files under `src/services/`, which execute in Node.js.
- Express serves only the `public/` directory to visitors.
- The browser calls `/api/chat`; it never calls either AI provider directly.
- API responses contain the reply, language, provider, model, and reasoning choice—not credentials.
- Errors are converted to safe bilingual messages rather than returning raw provider errors or stack traces.
- Source and automated security scans check that key names and secret-like values do not appear in frontend files.
