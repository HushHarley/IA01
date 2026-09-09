# Nexus Support

Nexus Support is a bilingual, browser-based IT Help Desk chatbot. It can use either the OpenAI API or Anthropic's Claude API to troubleshoot technical problems conversationally: it gathers relevant symptoms, proposes safe diagnostic steps, and narrows down likely causes instead of returning a large generic checklist.

This topic was selected because help-desk work is a practical way to study conversational AI, prompt design, secure API integration, session state, validation, and deployment in one approachable project.

## Features

- French-first interface and greeting with an accessible FR/EN interface toggle
- Light/dark appearance switch, with light mode as the default
- Conversation sidebar for creating and reopening temporary previous chats
- Conversational switching between French and English
- Per-message provider selector: Claude (Anthropic) by default, or OpenAI
- Provider-aware model selector: Luna, Terra, and Sol for OpenAI; Sonnet 5, Opus 5, and Fable 5.1 for Claude
- Per-message reasoning selector: Instant, Medium, High, Very high, or Ultra
- Professional help with operating systems, networking, software, hardware, accounts, development tools, and common environment errors
- Server-side session memory with up to 20 chats and 20 retained messages per chat
- Editable help-desk instructions in one clearly named prompt file
- Responsive, accessible browser interface
- Input validation, safe error responses, security headers, and basic rate limiting
- Same-origin enforcement, non-cacheable API responses, strict session cookies, and a bilingual privacy notice
- Server-side OpenAI and Anthropic API integrations; the browser never receives either API key

## Technology and rationale

- **Node.js and Express:** a small server that is easy to read, run, and deploy.
- **Vanilla HTML, CSS, and JavaScript:** no frontend build step or framework complexity is needed for this focused interface.
- **Official OpenAI JavaScript SDK and [Responses API](https://developers.openai.com/api/reference/typescript/resources/beta/subresources/responses/methods/create):** the OpenAI server-side integration.
- **Official Anthropic JavaScript SDK and [Messages API](https://platform.claude.com/docs/en/api/messages):** the Claude server-side integration.
- **dotenv:** loads local environment variables from `.env`.
- **Helmet:** adds common HTTP security headers.
- **Node test runner:** provides tests without another test framework.
- **Nodemon:** restarts the development server when source files change.

New chats default to Claude with Sonnet selected. OpenAI remains available from the provider menu.

OpenAI's default model is [`gpt-5.6-terra`](https://developers.openai.com/api/docs/models/gpt-5.6-terra), configurable with `OPENAI_MODEL`. It was selected as a current balance of technical capability and cost for a help-desk workload. Confirm model availability for your OpenAI project before production use.

OpenAI's model selector accepts only three server-validated choices, matching the current [OpenAI model catalog](https://developers.openai.com/api/docs/models):

| Interface | OpenAI model ID | Intended use |
| --- | --- | --- |
| Luna | `gpt-5.6-luna` | Cost-sensitive and efficient |
| Terra (default) | `gpt-5.6-terra` | Balance of capability and cost |
| Sol | `gpt-5.6-sol` | Flagship capability |

`OPENAI_MODEL` sets the initial interface and direct-API default when it contains one of these three IDs. A model selected in the interface applies to the next message.

Claude's selector uses three current models from Anthropic's [model overview](https://platform.claude.com/docs/en/models/overview):

| Interface | Anthropic model ID | Intended use |
| --- | --- | --- |
| Claude Sonnet 5 (default) | `claude-sonnet-5` | Balance of speed and intelligence |
| Claude Opus 5 | `claude-opus-5` | Complex agentic and enterprise work |
| Claude Fable 5.1 | `claude-fable-5-1` | Demanding reasoning; currently requires 30-day provider retention |

`ANTHROPIC_MODEL` sets Claude's initial model when it contains one of these IDs. Model availability and billing depend on the provider account. Anthropic currently designates Fable 5.1 as a Covered Model that requires 30-day retention; the interface labels this explicitly and Anthropic's [data-retention documentation](https://platform.claude.com/docs/en/manage-claude/api-and-data-retention) should be rechecked before deployment.

The same friendly reasoning labels map to each provider's supported effort values:

| Interface | OpenAI effort | Claude effort |
| --- | --- | --- |
| Instant (default) | `none` | `low` |
| Medium | `medium` | `medium` |
| High | `high` | `high` |
| Very high | `xhigh` | `xhigh` |
| Ultra | `max` | `max` |

Claude uses adaptive thinking with its thinking display omitted from the browser. Higher settings can take longer and consume more output/reasoning tokens. The selected value applies to the next reply and can be changed between messages. Output-token ceilings increase gradually from Instant through Ultra because internal reasoning can count toward the response limit; these ceilings are limits, not targets. See Anthropic's [effort documentation](https://platform.claude.com/docs/en/build-with-claude/effort).

## Architecture

For an exact code-level walkthrough showing where keys are loaded, where each external API call happens, and how conversation turns are stored, see [`api-and-conversation-map.md`](api-and-conversation-map.md).

```text
Browser (public/index.html + app.js)
        │ same-origin JSON over HTTPS
        ▼
Express server (POST /api/chat)
        │ provider dispatch with a server-only API key
        ▼
OpenAI Responses API or Anthropic Messages API
        │ generated reply
        ▼
Express server → Browser
```

The browser sends the user's message, selected conversation ID, provider, model, reasoning level, and interface-language preference to `POST /api/chat`. Express validates every value, confirms that the conversation belongs to the cookie-backed session, adds the message to that conversation, and dispatches to the selected server-side provider. The response is added to the same conversation and returned to the browser.

French is selected when the page and every new conversation start. The FR/EN toggle translates the interface immediately and sets the preferred language for the next assistant reply. The language detector can still switch naturally when the user clearly writes in the other language or explicitly asks to switch. The server returns the active language with each reply so the interface remains synchronized with the conversation.

The session identifier is stored in an HttpOnly, SameSite cookie. The sidebar uses safe same-origin endpoints to list, create, and reopen chats. Up to 20 conversations per session and the 20 most recent messages per conversation remain in server memory. They expire after two hours of inactivity. This is intentionally temporary: restarting the server clears all chats, and multi-instance deployment would require a shared store such as Redis. Chat text is not placed in `localStorage` or `sessionStorage`. The visual theme is also not persisted and returns to light mode after a page reload.

## Project structure

```text
custom chatbot/
├── public/                         # Browser interface
│   ├── app.js                      # Chat/sidebar UI, safe API calls, translations
│   ├── index.html                  # Semantic chat, sidebar, and theme controls
│   └── styles.css                  # Responsive light/dark Help Desk styling
├── src/
│   ├── middleware/rateLimiter.js   # Small in-memory abuse limit
│   ├── prompts/helpDeskPrompt.js   # Main personality and behavior prompt
│   ├── routes/chat.js              # Validation, chat/history routes, safe errors
│   ├── services/llmService.js      # Validated provider dispatch
│   ├── services/openaiService.js   # OpenAI Responses API call
│   ├── services/anthropicService.js# Anthropic Messages API call
│   ├── store/sessionStore.js       # Temporary server-side chat memory
│   ├── utils/language.js           # Language preference detection
│   └── config.js                   # Easy-to-change application settings
├── test/                           # API and language tests
├── .env                            # Local secrets; ignored by Git
├── .env.example                    # Safe configuration template
├── render.yaml                     # Optional Render deployment blueprint
├── server.js                       # Express application entry point
└── journal-codex-chatbot.md        # Development journal
```

## Local setup

Requirements: Node.js 20 through 24 and an API key with billing/API access for each provider you want to use. One configured provider is enough to run chats through that provider.

1. Open a terminal in the `custom chatbot` folder.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Open the existing `.env` file and add your key after the equals sign:

   ```dotenv
   OPENAI_API_KEY=your_real_key_goes_here
   OPENAI_MODEL=gpt-5.6-terra
   ANTHROPIC_API_KEY=your_anthropic_key_goes_here
   ANTHROPIC_MODEL=claude-sonnet-5
   PORT=3000
   NODE_ENV=development
   ```

   Add each real key only to `.env`; never paste a key into frontend code, tracked source files, Git, screenshots, or support messages. Keep `.env` local. If you only use one provider, the other key can remain blank.

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Visit `http://localhost:3000`.

For a production-style local start, run `npm start`.

## Testing

Run the automated tests:

```bash
npm test
```

The automated suite checks language detection, validation, malformed JSON handling, missing-key handling, isolated conversation creation/retrieval, safe history serialization, the health endpoint, static delivery, and that obvious secret markers are not returned to the browser.

After adding a valid API key, manually test at least this sequence:

1. Ask a technical question in French.
2. Continue with a diagnostic answer in French.
3. Ask to continue in English.
4. Continue troubleshooting in English.
5. Ask to return to French.
6. Confirm that prior facts remain available within the conversation.
7. Switch providers, verify the model list changes, and test one response from each configured provider.

The live model tests incur API usage and therefore are not included in the automated suite.

## API summary

### `POST /api/chat`

JSON request:

```json
{
  "message": "Mon ordinateur ne se connecte plus au Wi-Fi.",
  "provider": "openai",
  "model": "terra",
  "reasoning": "instant",
  "language": "fr",
  "conversationId": "server-generated-conversation-uuid"
}
```

Successful JSON response:

```json
{
  "reply": "...",
  "conversationId": "server-generated-conversation-uuid",
  "title": "Mon ordinateur ne se connecte plus au Wi-Fi.",
  "language": "fr",
  "provider": "openai",
  "model": "terra",
  "reasoning": "instant"
}
```

Messages must be non-empty strings of no more than 4,000 characters. `provider`, `model`, `reasoning`, and `language` are optional for direct API callers and use the configured or session defaults. Provider, model/provider pairs, reasoning, and language are all checked against strict allowlists.

### Conversation sidebar endpoints

- `GET /api/chat/conversations` returns safe summaries for only the current cookie-backed session.
- `POST /api/chat/conversations` creates a new French-first conversation.
- `GET /api/chat/conversations/:conversationId` returns only the `role` and `content` history fields needed to redraw an owned conversation. Provider continuity metadata is removed.

### `POST /api/chat/reset`

Retained for compatibility. It clears all temporary conversations in the current session and creates one new French-first conversation. The browser's sidebar normally uses `POST /api/chat/conversations` so older chats remain available.

### `GET /api/health`

Returns only basic service health. It does not reveal API-key configuration, create a chat session, or return model output.

## API key protection

`dotenv` loads `OPENAI_API_KEY` and `ANTHROPIC_API_KEY` only in `server.js`'s Node.js process. The two provider clients are created only in their server-side service files. Browser JavaScript calls only this project's same-origin endpoint and has no provider credentials. `.env` is listed in `.gitignore`, while `.env.example` contains placeholders only. Error responses are mapped to safe bilingual messages; request headers and bodies are not logged.

## Security and privacy

This educational application uses defense in depth:

- Provider API keys exist only in the server environment. They are never placed in HTML, frontend JavaScript, responses, cookies, or logs.
- OpenAI requests explicitly use `store: false`, so Responses API application state is not retained for later retrieval.
- Claude requests use the stateless Messages API. Signed/redacted thinking continuity data is retained only in bounded server session memory, never sent to the browser, and never forwarded to OpenAI.
- The browser receives only an opaque session identifier. Up to 20 chats with 20 recent messages each remain in this server process's memory, expire after two hours of inactivity, and disappear when the process restarts.
- Conversation identifiers are opaque UUIDs and are checked against the current session. History responses strip server-only provider metadata, and browser storage is not used for chat text or credentials.
- Production cookies use the `__Host-` prefix plus `Secure`, `HttpOnly`, `SameSite=Strict`, and `Path=/`. They contain no messages or credentials.
- API responses use `Cache-Control: no-store`. Cross-origin chat mutations are rejected, and no permissive CORS policy is enabled.
- Helmet applies a restrictive Content Security Policy, clickjacking protection, MIME sniffing protection, referrer protection, and related headers. A Permissions Policy disables unused camera, microphone, location, payment, and USB features.
- User and assistant text is inserted with `textContent`, not raw HTML, reducing cross-site scripting risk.
- JSON bodies and message lengths are bounded. Provider, model, reasoning, and language values are strict allowlists. Requests are limited to 30 per IP every 15 minutes.
- Both provider clients have a 60-second timeout and bounded automatic retries. Visitors receive sanitized bilingual errors rather than provider bodies or stack traces.
- The system prompt tells the assistant never to request passwords, MFA/recovery codes, API keys, access tokens, private keys, or authentication cookies.

Privacy has an important limit: messages leave this server and are sent to the provider selected for that request. According to OpenAI's [API data controls documentation](https://developers.openai.com/api/docs/guides/your-data), API data is not used to train models unless the account explicitly opts in, but default abuse-monitoring logs may contain prompts and responses and may be retained for up to 30 days. `store: false` prevents Responses API application-state storage; it does not disable those monitoring logs. Anthropic documents its current [API data-retention behavior](https://platform.claude.com/docs/en/manage-claude/api-and-data-retention), including model- and account-specific exceptions. Review both providers' current terms before deployment and never submit credentials or unnecessarily sensitive data.

Before public deployment:

1. Use separate provider projects/workspaces and restricted API keys for this application where supported.
2. Configure appropriate spend alerts and limits with each enabled provider. OpenAI also documents this in its [production best-practices guide](https://developers.openai.com/api/docs/guides/production-best-practices).
3. Set `NODE_ENV=production` and store `OPENAI_API_KEY` and `ANTHROPIC_API_KEY` only in the hosting provider's secret-variable settings.
4. Use the host's HTTPS URL. Never place a reverse proxy in front of the app unless it preserves the real client IP and HTTPS protocol correctly.
5. Keep the dependency lockfile, run `npm audit`, and retest after upgrades.
6. If access should be limited rather than public, add authentication at the hosting layer; this version intentionally has no user accounts.

Before pushing to GitHub, verify:

```bash
git check-ignore .env
git grep -n "sk-" -- . ':!package-lock.json'
```

## Deployment

### Option 1: Render

Render supports a Node web service, environment variables, GitHub deployment, and a public HTTPS URL. A starter `render.yaml` is included. See Render's official [Node/Express deployment guide](https://render.com/docs/deploy-node-express-app).

1. Push the project to a private or public GitHub repository, ensuring `.env` is not tracked.
2. In Render, create a Blueprint or Web Service from the repository.
3. Use `npm ci` as the build command and `npm start` as the start command.
4. Add `OPENAI_API_KEY` and/or `ANTHROPIC_API_KEY` as secret environment variables in the Render dashboard.
5. Keep `NODE_ENV=production` and optionally change `OPENAI_MODEL` or `ANTHROPIC_MODEL`.
6. Deploy, open the HTTPS URL, and complete the bilingual production conversation test.

Note: the free service may sleep, and all in-memory conversations disappear on restart. Use one instance for this educational version.

### Option 2: Railway

The application is prepared for Railway's current [Railpack](https://docs.railway.com/builds/railpack) builder. It listens on Railway's injected `PORT`, binds to `0.0.0.0`, recognizes Railway's HTTPS proxy automatically, and exposes `/api/health` for deployment health checks.

1. Commit and push the project to GitHub without committing `.env`. In this workspace, `custom chatbot/` is currently untracked, so from the `IA01` repository root use:

   ```bash
   git add "custom chatbot"
   git status --short
   git commit -m "Add Railway-ready Nexus Support chatbot"
   git push
   ```

   Confirm `.env` is absent from the staged file list before committing.
2. In Railway, create a project and connect the GitHub repository.
3. Set the service's **Root Directory** correctly:
   - If the GitHub repository contains the `custom chatbot` folder, set Root Directory to `/custom chatbot`.
   - If `package.json` is at the GitHub repository root, leave Root Directory as `/`.
4. In the service's **Variables** tab, add:

   ```dotenv
   NODE_ENV=production
   OPENAI_API_KEY=your_real_openai_key
   OPENAI_MODEL=gpt-5.6-terra
   ANTHROPIC_API_KEY=your_real_anthropic_key
   ANTHROPIC_MODEL=claude-sonnet-5
   ```

   At least one provider key is required. Omit an unused provider rather than setting a fake key. Add secrets directly in Railway and seal the key variables after confirming them; never upload the local `.env`. Do not create a `PORT` variable because Railway injects it automatically.
5. Railpack should detect Node and `npm start`. If Railway asks for a custom start command, enter `npm start`. No build command is required.
6. Set **Healthcheck Path** to `/api/health`. Railway expects HTTP 200 before activating the deployment.
7. Under **Networking**, generate a public domain. Leave target-port detection automatic.
8. Keep the service at one replica because conversation sessions and rate limits are stored in the memory of one process.
9. Open the HTTPS domain and test French, English, provider switching, and one configured model from each provider.

If Railway reports that it cannot find `package.json`, the Root Directory is wrong. If it reports “Application failed to respond,” confirm the latest deployment is running `npm start` and that Railway—not a manually configured value—is supplying `PORT`.

Do not deploy this as a static-only site: the Express server is required to protect the key.

## Public deployment URL

**Not deployed yet:** `PUBLIC_URL_TO_BE_ADDED_AFTER_DEPLOYMENT`

Replace this placeholder only after a real deployment exists.

## Customization

- Change the displayed name in `src/config.js` and `public/index.html`.
- Edit personality, language, accuracy, troubleshooting, and command-safety behavior in `src/prompts/helpDeskPrompt.js`.
- Change limits and model defaults in `src/config.js` or `.env`.

## Current limitations

- Sessions are temporary and local to one server process.
- The application does not browse current vendor documentation by itself.
- The model can still make mistakes; users should review high-impact commands and back up important data.
- The included rate limiter is intentionally basic and per-instance.
