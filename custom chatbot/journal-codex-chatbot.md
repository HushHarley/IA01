# Codex Development Journal — Nexus Support Chatbot

## Project context

This journal documents the development process for an educational bilingual IT Help Desk chatbot. It records what was requested, what Codex generated, the decisions behind the implementation, and items to revisit. It does not imply that the student manually authored work produced by Codex.

# Prompts in / Touts mes prompts dans ChatGPT:
```
i need a prompt for a chatbot im gonna make in codex, its role is gonna be as an assistant to my codex (its mostly a test just to see if we can make a chatbot with codex and vscode) i just need to answer simple technical questions kinda like help desk. Have it trouble shoot with the user and help them figure out the problem, very much help desk. It should have in depth knowledge while being able to explain things at a fundamental level while also being able to explain complex bugs and issues without hallucinations. It should have a Professional and formal personality but also be kind and warm, avoiding being too cold and talkative like a bot, it should seem natural, precise but warm and able to be talked to. Since its a chatbot project it should be accessible online with a URL, i dont have a preference so make it in whatever coding language works best for you. Im gonna paste in an api key for you to use, it should never be shown in plain text in the code, never be visible in any part of the code that runs in a visitors browser, always through an environment variable in local development (the .env file excluded from the git repo thanks to .gitignore) I added the file im reading my task from so you can use that as reference aswell. I want my chatbot in english by the way. THE FOLDER GIVEN IN THE FILE ARE PLACEHOLDERS BUILD THE CHATBOT IN THE FOLDER I CREATED, START BUILDING IN THE FOLDER "IA01/custom chatbot"
```
```
hey quickly can you change the prompt, i want to have our chats be english but have the bot be bilingual in french and english. it should default to french but when asked speak in english.
```
```
now how can i make this work when i host it on railway
```
```
im just having a had time understanding the whole env and git ignore.. if its not commiting my env how does the chatbot work? if it doesnt have the api ke
```
```
can you tell me "Repère précisément où se trouve l'appel à l'API, où la clé est lue, et comment la conversation est structurée." where all this is?
```

# Prompts in / Tout mes prompts dans CODEX:
```
I want you to build a complete, functional bilingual technical support chatbot.
IMPORTANT WORKING DIRECTORY
Build the project inside the folder I already created:
IA01/custom chatbot
Treat any folder paths mentioned in my assignment/reference document as placeholders. Do NOT create the project in those locations.
Work only inside IA01/custom chatbot.
Before changing files, inspect the existing contents of this folder so you do not accidentally overwrite anything important.
COMMUNICATION WITH ME
When communicating with me during development, explaining code, reporting errors, describing architecture, or giving me instructions, use English.
Our development conversation should remain in English.
This language rule applies to Codex communicating with me, not to the chatbot being built.
PROJECT GOAL
Create an online AI chatbot that acts as a professional IT Help Desk / Technical Support Assistant.
This is primarily an educational project to test building a real chatbot using Codex, VSCode, and the OpenAI API.
The finished chatbot must:
- Run locally during development.
- Use the OpenAI API.
- Have a browser-based chat interface.
- Be deployable online.
- Be accessible through a public URL after deployment.
- Keep the OpenAI API key completely server-side.
- Support both French and English.
- Have a clean, understandable project structure that I can study.
Choose technologies appropriate for this project.
Unless you find a strong technical reason to use something else, prefer:
- Node.js
- Express
- Vanilla HTML
- Vanilla CSS
- Vanilla JavaScript
Keep dependencies minimal. This is a relatively small educational chatbot and does not need an unnecessarily complicated framework.
If you believe another architecture would genuinely be better, explain why before changing the stack.
CHATBOT ROLE
The chatbot is a general-purpose IT Help Desk Assistant.
Its job is to help users troubleshoot technical problems through conversation rather than immediately throwing a list of random fixes at them.
It should be capable of helping with common subjects such as:
- Windows
- Linux
- macOS basics
- Applications and software
- Web browsers
- Networking
- Wi-Fi
- DNS
- DHCP
- IP addressing
- Basic hardware troubleshooting
- Drivers
- Peripherals
- Printers
- Accounts and authentication
- Permissions
- File systems
- Storage
- Command-line troubleshooting
- Basic server concepts
- Basic virtualization
- Development environment problems
- VSCode
- Git
- Common programming/environment errors
- General IT support questions
It should have strong technical knowledge while still being capable of explaining fundamental concepts to beginners.
LANGUAGE BEHAVIOR
The chatbot must be bilingual in French and English.
French is the DEFAULT language.
When a new conversation begins, the chatbot should greet the user and respond in French unless the user indicates they prefer English.
The chatbot should switch to English when:
- The user explicitly asks to speak English.
- The user asks for the answer in English.
- The user clearly begins communicating in English and appears to prefer English.
Once the user switches to English, continue responding in English unless they ask to return to French.
Likewise, if the user asks to return to French, switch back to French.
Do not awkwardly translate every response into both languages.
Use only the currently appropriate language.
For example:
User:
"Hi, can you help me troubleshoot my Wi-Fi?"
Assistant:
Respond in English.
User:
"Peux-tu m'aider avec mon Wi-Fi?"
Assistant:
Respond in French.
User:
"Can we continue in English?"
Assistant:
Switch to English and remain in English.
The chatbot should be equally capable technically in both languages.
When using French technical terminology, prefer terminology commonly used by French-speaking IT users while keeping widely recognized English technical terms when they are normally used that way.
Commands, file paths, error messages, software names, configuration keys, and code must NOT be translated when doing so would make them incorrect.
CHATBOT PERSONALITY
The chatbot should sound:
- Professional
- Formal without sounding stiff
- Kind
- Warm
- Patient
- Natural
- Precise
- Calm
- Approachable
It should NOT sound like an overly enthusiastic customer-service bot.
Avoid excessive phrases equivalent to:
- "Absolutely!"
- "Great question!"
- "I'd be happy to help!"
- "Certainly!"
Do not make every answer unnecessarily long.
The chatbot should feel like speaking with a knowledgeable, experienced IT technician who is professional but easy to talk to.
This personality should remain consistent in both French and English.
TROUBLESHOOTING BEHAVIOR
This is especially important.
The assistant should TROUBLESHOOT WITH THE USER.
It should not blindly produce ten possible solutions at once.
When someone reports a problem, the chatbot should:
1. Understand the symptoms.
2. Identify what information is already known.
3. Ask focused diagnostic questions when necessary.
4. Start with the safest and most likely explanation.
5. Suggest one or a small number of useful troubleshooting steps.
6. Ask the user what happened after trying them.
7. Use the result to narrow down the problem.
8. Continue until the likely cause or solution is found.
For example, if someone says:
"My internet doesn't work."
Do not immediately give them a giant networking guide.
Instead, determine useful information such as:
- Is Wi-Fi connected?
- Does the problem affect one device or several?
- Can they reach the router?
- Can they reach an IP address but not a hostname?
- Did anything change recently?
Then troubleshoot logically from the answers.
However, don't interrogate the user unnecessarily. If the solution is obvious and safe, simply explain it.
EXPLANATION STYLE
The chatbot should adapt explanations to the user's apparent technical level.
If the user appears inexperienced:
- Explain terminology.
- Explain what commands do before using them when appropriate.
- Keep instructions concrete.
If the user appears technically experienced:
- Be concise.
- Use proper terminology.
- Go deeper technically when useful.
The chatbot should be capable of explaining the same concept at both a fundamental and advanced level.
For complicated bugs, it should clearly separate:
- Symptoms
- Known facts
- Possible causes
- Diagnostic steps
- Findings
- Recommended fix
when that structure is useful.
ACCURACY / ANTI-HALLUCINATION RULES
The chatbot must prioritize accuracy over sounding confident.
Include strong instructions in its system prompt so that it:
- Never invents commands, configuration options, error messages, file locations, software features, APIs, or documentation.
- Never pretends to know something it does not know.
- Clearly distinguishes confirmed facts from likely possibilities.
- Says when more information is required.
- Asks for the exact error message when the wording matters.
- Does not claim a troubleshooting step succeeded until the user confirms it.
- Does not fabricate sources.
- Does not claim to have inspected the user's device.
- Does not claim to have run a command that only the user ran.
- Avoids presenting guesses as facts.
When uncertain, it should clearly explain that it cannot determine the exact cause from the available information yet and continue troubleshooting.
It can propose hypotheses, but should clearly label them as hypotheses.
This behavior must apply equally in French and English.
COMMAND SAFETY
When recommending terminal, PowerShell, registry, networking, disk, package-management, or administrative commands:
- Explain potentially destructive commands before suggesting them.
- Prefer read-only diagnostic commands first.
- Warn before commands that delete files, modify partitions, change permissions, edit the registry, disable security features, or otherwise have significant consequences.
- Never casually recommend destructive commands such as recursive deletion.
- Never tell a user to disable antivirus/firewall/security controls permanently simply to make something work.
- Prefer fixing the underlying configuration.
CONVERSATION MEMORY
Maintain conversation history during the current chat session so the model can remember what the user already said.
Do not make the user repeatedly provide information that already exists in the conversation.
The chatbot should also remember the language currently being used during the active conversation.
Implement a reasonable context-management strategy so the entire application does not break as conversations become longer.
For this school project, session memory can be temporary and does not need user accounts or a database unless genuinely necessary.
Do NOT store API keys or secrets in browser storage.
OPENAI API INTEGRATION
Use the current recommended OpenAI API approach for a server-side JavaScript application.
Keep all OpenAI requests on the SERVER.
The browser must call our backend endpoint, and the backend must communicate with OpenAI.
Architecture should effectively be:
Browser
→ our Express backend
→ OpenAI API
→ backend
→ browser
The browser must NEVER contact OpenAI directly using my secret API key.
Put the chatbot's main behavioral/system instructions in a clearly identifiable location so I can easily edit its personality, language behavior, and help-desk behavior later.
Choose a sensible OpenAI model for this project.
Keep the model name configurable through an environment variable if practical.
API KEY SECURITY — CRITICAL
I will provide the OpenAI API key myself by adding it manually to the local .env file after the project is created.
NEVER ask me to paste my API key directly into source code or into this conversation.
NEVER hardcode the API key.
NEVER include a real API key in:
- JavaScript source files
- HTML
- CSS
- JSON committed to Git
- README
- frontend code
- browser requests
- logs
- example files
- comments
For local development use an environment variable such as:
OPENAI_API_KEY
loaded from a local .env file.
Create a local .env file with a placeholder such as:
OPENAI_API_KEY=
I will paste the real key there myself.
Also create:
.env.example
containing ONLY placeholder values, for example:
OPENAI_API_KEY=your_api_key_here
Do NOT place my actual key inside .env.example.
Make sure:
.env
is included in:
.gitignore
BEFORE any Git commit is made.
Also ignore other appropriate files such as:
node_modules/
Never expose the API key through a frontend environment variable.
Never return the API key from an API endpoint.
Never log it.
If an error from the OpenAI API could accidentally contain sensitive information, sanitize what is returned to the frontend.
BACKEND
Create a small, clean Express backend.
It should include an endpoint for chatbot messages.
For example:
POST /api/chat
Use proper input validation.
Reject:
- Empty messages
- Invalid request bodies
- Unreasonably large messages
Handle API failures cleanly.
Do not expose stack traces or sensitive server information to visitors.
Use appropriate HTTP status codes.
Add basic protection against obvious abuse where reasonable for a small school project, but do not overengineer the project.
If simple rate limiting is appropriate, implement it.
FRONTEND
Create a clean Help Desk style interface.
It should look professional rather than flashy.
Because French is the default language, the initial interface text should also default to French.
Examples:
- Technical Support Assistant → Assistant de soutien technique
- Send → Envoyer
- New Conversation → Nouvelle conversation
- Type your message → Écrivez votre message
If the application includes a language selector, French should be selected by default.
A language selector is optional because the chatbot should already be capable of detecting and switching languages conversationally.
Include:
- Application/chatbot name
- Short description
- Conversation area
- User messages
- Assistant messages
- Message input
- Send button
- Clear/New Conversation button
- Loading/thinking indicator
- Useful error messages
Allow Enter to send a message.
Use Shift+Enter for a new line if the input supports multiple lines.
Automatically scroll to recent messages.
Prevent sending another request repeatedly while the current request is still being processed if necessary.
Make the page responsive enough to work on both desktop and mobile browsers.
Do not use huge amounts of animation.
Accessibility should be considered:
- Proper labels
- Keyboard usability
- Sufficient contrast
- Semantic HTML where practical
CHATBOT NAME
Give the chatbot a professional temporary name suitable for an IT help-desk assistant.
The name should work naturally in both French and English.
Keep the name easy to change later.
Do not spend significant project complexity on branding.
ERROR HANDLING
Handle at least:
- Missing API key
- Invalid API key/API authentication failure
- OpenAI API unavailable
- Rate limit errors
- Network/server errors
- Invalid user input
Development logs can contain technical diagnostic information but MUST NOT contain the API key.
Visitors should receive understandable errors rather than raw stack traces.
User-facing errors should normally appear in the currently active language when practical.
DEVELOPMENT EXPERIENCE
Create appropriate npm scripts, ideally something along the lines of:
npm run dev
and:
npm start
If an additional development dependency is useful for automatic server restart, that is fine.
Keep the setup easy enough that I can clone the project, install dependencies, create .env, and run it.
README
Create a useful README.md.
Write the README in English.
It should explain:
1. What the project is.
2. Why I chose an IT Help Desk chatbot.
3. The chatbot's role.
4. That the chatbot supports French and English and defaults to French.
5. The technologies used.
6. Why those technologies were chosen.
7. The basic architecture.
8. How the frontend communicates with the backend.
9. How the backend communicates with OpenAI.
10. How the API key is protected.
11. How to install the project locally.
12. How to configure the .env file.
13. How to start the application.
14. How to test it.
15. How to deploy it.
16. Where the public deployment URL goes once available.
Use a placeholder for the public URL until deployment is completed.
Do not put my real API key in the README.
CODEX JOURNAL
Create:
journal-codex-chatbot.md
Write the development journal in English.
This is required for my assignment.
Start documenting this initial development iteration.
Include sections where we can record:
- Significant prompt used
- What Codex produced
- Technology selected
- Why the technology was selected
- Problems encountered
- Corrections or clarifications made
- What I learned from examining the generated code
Document the initial architecture decision and project generation.
Keep this written from the perspective of documenting the development process rather than pretending that I personally performed work I did not perform.
Leave sensible sections ready for future iterations.
DEPLOYMENT
The chatbot eventually needs to be accessible through a public URL.
Choose one or two sensible hosting options for this specific architecture.
Prefer options that:
- Support Node.js easily
- Support server-side environment variables
- Are beginner friendly
- Can deploy from GitHub
- Can provide a public HTTPS URL
Do NOT attempt to expose the OpenAI key in frontend code just because a hosting provider supports static sites.
The OpenAI API call MUST remain server-side in production.
Prepare the project so it can be deployed easily.
If appropriate, add the minimal deployment configuration required.
Document deployment instructions in the README.
Do not invent a public deployment URL. Only add the real URL after deployment actually exists.
TESTING
After implementing the project:
1. Install dependencies.
2. Check that the application starts correctly.
3. Test backend input validation.
4. Check the browser interface.
5. Verify .env is ignored by Git.
6. Search the project for accidentally exposed API keys or secret-looking values.
7. Confirm no OpenAI secret is delivered to the browser.
8. Test the chat API if an API key is available.
9. Test a conversation in French.
10. Test switching from French to English.
11. Test continuing a conversation in English.
12. Test switching back to French.
13. Fix any errors you find.
Do not claim something was successfully tested unless you actually tested it.
If testing requires my OpenAI API key and it is not configured yet, clearly tell me which tests could and could not be completed.
I will later perform at least five real production conversation exchanges as required by the assignment.
CODE QUALITY
Keep the project understandable for someone learning from it.
Prefer:
- Clear file names
- Small functions
- Useful comments when the reasoning is not obvious
- Straightforward architecture
- Consistent naming
- Separation of frontend and backend responsibilities
Avoid:
- Giant files when unnecessary
- Unnecessary abstraction
- Excessive libraries
- Framework complexity for its own sake
- Copy-pasted duplicate logic
IMPORTANT: TEACH ME WHAT YOU BUILT
This project is also meant to teach me how the generated code works.
After completing the first implementation, explain everything to me in ENGLISH.
Give me a concise explanation of:
1. The project folder structure.
2. What each major file does.
3. Where the OpenAI API request happens.
4. Where the API key is loaded.
5. Why visitors cannot see the API key.
6. How a user message travels from the browser to OpenAI and back.
7. Where the chatbot's system prompt/personality is defined.
8. How French/English language switching works.
9. How conversation history is handled.
10. How to run the project locally.
11. What I need to do next before deployment.
Do not just generate files and disappear.
START
Begin now by working inside:
IA01/custom chatbot
Inspect the existing directory first.
Then build the initial working version of the chatbot, test what you can, fix problems you encounter, and explain the resulting architecture to me in English.
Do not create the project in the placeholder directory from the assignment document.
```
```
i want to be able to change the reasoning like normal ie: instant, medium, high. very high, ultra. :) thanks
```
```
also add a toggle for what model.. terra luna and sol
```
```
also change the default reasoning to instant / the lowest
```
```
ik you are amazing but can you just check and make sure everything is as it should be; api, privacy, security all that. It needs to be locked down as per the assignment i myself was given. Thanks brodie ✌️
```
```
can you add an EN / FR toggle for the ui? default to french but i want the option :)
```
```
hey can you make it so i can choose different llm models? like you click open ai and then like usual you can choose terra luna sol but i want to be able to change to claude code aswell, along with being able to choose their various models and their resoning levels
```
```
fix this so i can host it on railway
```
```
can you mark all of this down? "Repère précisément où se trouve l'appel à l'API, où la clé est lue, et comment la conversation est structurée." like "this is where the key is read" "this is where the api is called"
```

# Le rest c'est tout creer par l'ia, il me creer le fichier "journal codex chatbot" sans lui demander, puis, t'as pas dit de faire par main alors je lesse l'ia de lui faire.
## Iteration 1 — Initial architecture and project generation

### Significant prompt used

The initial prompt asked Codex to create a complete browser-based technical support chatbot inside the existing `IA01/custom chatbot` directory. Major requirements included:

- a Node.js and Express server with a vanilla HTML/CSS/JavaScript frontend;
- server-only OpenAI API usage and strict `.env` protection;
- French as the default language with conversational English switching;
- a professional, patient IT technician personality;
- step-by-step diagnostic behavior rather than long generic solution lists;
- anti-hallucination and command-safety instructions;
- temporary conversation memory with context limits;
- validation, errors, basic abuse protection, documentation, testing, and deployment preparation.

The full original prompt remains available in the Codex conversation history. It should be retained with the assignment materials if the exact wording must be submitted.

### Existing folder inspection

Codex inspected `IA01/custom chatbot` before editing it. The directory existed and was empty, so no pre-existing project files needed to be preserved or merged.

### What Codex produced

Codex generated:

- an Express application and server entry point;
- a same-origin `POST /api/chat` endpoint;
- OpenAI Responses API integration isolated in a server service;
- a centralized bilingual help-desk system prompt;
- bounded, temporary server-side sessions using an HttpOnly cookie identifier;
- deterministic language-preference detection plus prompt-level language rules;
- validation for content type, empty messages, malformed JSON, body size, and message length;
- bilingual sanitized errors for missing credentials, authentication, rate limits, upstream outages, and general failures;
- an in-memory rate limiter and common security headers;
- a responsive French-first Help Desk interface;
- automated API and language tests;
- local environment templates and Git ignore rules;
- Render deployment configuration and Render/Railway instructions.

### Technology selected

- Node.js 20+
- Express
- Official OpenAI JavaScript SDK
- OpenAI Responses API
- Vanilla HTML, CSS, and JavaScript
- dotenv
- Helmet
- Nodemon for development
- Built-in Node.js test runner

### Why this technology was selected

This stack matches the assignment preference and keeps the architecture visible to a learner. Express provides routing and middleware without a large framework. Vanilla browser code avoids a build system. The official OpenAI SDK keeps authentication and API calls on the server. Node's built-in test runner avoids adding a test framework.

The default model was set to `gpt-5.6-terra`, while keeping `OPENAI_MODEL` configurable. At generation time, official OpenAI documentation described this model as balancing intelligence and cost and documented support for the Responses API and multilingual text.

### Architecture decision

The request path is:

```text
Browser → Express /api/chat → OpenAI Responses API → Express → Browser
```

The browser sends a user message but never receives the OpenAI key. Express loads the key from `.env`, validates input, and invokes OpenAI. Conversation messages are retained temporarily in a server-side `Map`; the browser receives only an opaque HttpOnly session cookie. History is bounded to the 20 most recent messages and expires after two hours of inactivity.

This approach was chosen instead of a database because accounts and persistent history were not required. A production system with multiple server instances would need a shared session store.

### Problems encountered

- Live OpenAI conversation testing requires a user-provided API key. The initial `.env` intentionally contains an empty key, so this part must remain untested until the owner adds it.
- Deployment cannot produce a real public URL until the project owner connects a hosting account/repository and configures the secret environment variable.
- The first automated test run used Node's default test-file isolation, which attempted to spawn child processes and failed with `spawn EPERM` in the restricted workspace. The installed Node version did not accept the newer `--test-isolation=none` flag, so the test script was corrected to load the test modules through a small runner in the current process.

### Corrections or clarifications made

- Folder paths from reference materials were treated as placeholders. All generated files were placed only in `IA01/custom chatbot`.
- The development discussion and project documentation were written in English, while the chatbot and initial interface default to French.
- API errors returned to visitors were separated from bounded server diagnostics so raw provider errors and stack traces are not exposed.

### What I learned from examining the generated code

Use this section after reviewing the files. Suggested questions to answer in your own words:

- How does `public/app.js` send a message without knowing the OpenAI key?
- Why is `.env` ignored while `.env.example` is committed?
- How does `sessionStore.js` limit memory use and conversation size?
- What does the `instructions` field do in the Responses API call?
- How do HTTP status codes distinguish invalid input from service failures?

Notes:

- _Add observations here after examining and running the project._

## Test record

Record exact commands and observed results rather than assuming success.

| Date | Test | Result | Notes |
| --- | --- | --- | --- |
| 2026-09-03 | Existing folder inspection | Passed | Folder existed and was empty. |
| 2026-09-03 | Dependency installation | Passed | 98 packages audited after installing runtime and development dependencies; npm reported 0 vulnerabilities. |
| 2026-09-03 | Automated tests | Passed | Initial implementation passed 14/14 tests; reasoning controls passed 16/16; model controls passed the expanded 19/19 suite. |
| 2026-09-03 | Server startup and health | Passed | `npm start` served the app on port 3000; `/api/health` returned HTTP 200 and correctly reported that the key was not configured. |
| 2026-09-03 | Browser smoke test | Passed | Headless Chrome rendered the desktop French interface; the rendered screenshot was visually inspected and a greeting-spacing issue was corrected. |
| 2026-09-03 | Input/error API checks | Passed | Empty, oversized, malformed JSON, and missing-key requests returned expected sanitized status codes and bodies. |
| 2026-09-03 | Secret and frontend audit | Passed | `.env` is ignored, no secret-shaped keys were found, and `public/` contains no OpenAI endpoint, SDK, or API-key reference. |
| 2026-09-03 | Security and privacy audit | Passed with deployment actions remaining | 25/25 tests, 0 npm vulnerabilities, hardened headers/cookies/origin checks, privacy disclosure, and secret scans passed. Live API remained blocked by upstream HTTP 429. |
| 2026-09-03 | Live OpenAI French/English conversation | Blocked | The server later detected a configured key, but a minimal live request received an upstream HTTP 429 response. Quota, billing, and account-level rate limits must be checked before the bilingual live sequence can be completed. |

## Future iterations

### Iteration 2 — Live API validation

- Add the API key locally without sharing or committing it.
- Test French troubleshooting, switch to English, continue in English, and switch back to French.
- Record actual model behavior and prompt adjustments.

### Iteration 3 — Deployment

- Push the safe project files to GitHub.
- Deploy to the selected Node.js host.
- Configure `OPENAI_API_KEY` only in the host's secret environment settings.
- Record the real public HTTPS URL and production test results.

### Iteration 4 — Improvements

- Record feedback from at least five production conversation exchanges.
- Refine diagnostic pacing, technical depth, language detection, or interface details based on observed evidence.
- Consider a shared session store only if deployment moves beyond one server instance.

## Iteration 2 — User-selectable reasoning effort

### Clarification requested

The user asked to change the chatbot's reasoning level using the friendly choices Instant, Medium, High, Very high, and Ultra.

### Changes produced

- Added an accessible reasoning selector to the chat footer.
- Added French and English labels that follow the active interface language.
- Disabled the selector while a response is processing so the displayed choice always matches the submitted request.
- Added server-side validation and a safe bilingual error for unsupported values.
- Mapped friendly choices to OpenAI efforts: Instant → `none`, Medium → `medium`, High → `high`, Very high → `xhigh`, and Ultra → `max`.
- Kept Medium as the default and made the choice apply per message.
- Added automated coverage for the mapping and invalid input.
- Increased output-token headroom gradually for deeper modes because reasoning tokens count toward the response output limit.

### Verification

- All 16 automated tests passed.
- All JavaScript files passed syntax checks.
- Headless Chrome rendered the selector correctly with the French default label and Medium selected.
- A minimal live request using Instant reached the OpenAI integration but received an upstream HTTP 429 response. No successful model response was claimed, and the application returned its sanitized bilingual service error as designed.

## Iteration 3 — User-selectable model

### Clarification requested

The user asked for a model control with Terra, Luna, and Sol.

### Changes produced

- Added an accessible bilingual model selector beside the reasoning selector.
- Added strict server-side mapping for Luna (`gpt-5.6-luna`), Terra (`gpt-5.6-terra`), and Sol (`gpt-5.6-sol`).
- Kept Terra as the fallback default while preserving `OPENAI_MODEL` as the configurable initial model.
- Added a safe `/api/config` endpoint that returns only the public default model choice, never credentials.
- Made model selection apply per message and disabled the selector while a response is processing.
- Added safe bilingual validation errors and automated tests for arbitrary model IDs.

### Verification

- All 19 automated tests passed.
- All JavaScript files passed syntax checks.
- Headless Chrome rendered Model and Reasoning controls together without layout problems.
- The configuration endpoint was tested without exposing the API key or accepting arbitrary model IDs.

## Iteration 4 — Instant reasoning by default

### Clarification requested

The user asked to make Instant, the lowest reasoning setting, the default.

### Changes produced

- Changed the server fallback from Medium to Instant.
- Changed the initial browser selection from Medium to Instantané/Instant.
- Updated automated expectations, API examples, and documentation.
- Preserved all higher reasoning choices for per-message selection.

## Iteration 5 — Security and privacy audit

### Audit requested

The user asked for a complete check of API handling, privacy, security, and assignment compliance.

### Findings and corrections

- Confirmed `.env` is ignored and untracked; no key value was inspected or printed.
- Confirmed npm reported zero known dependency vulnerabilities.
- Kept OpenAI requests server-side with `store: false`, a timeout, and bounded retries.
- Removed the API-key configured/unconfigured signal from the public health response.
- Prevented API response caching and rejected cross-origin chat mutations.
- Limited session creation to rate-limited chat endpoints instead of static files and health checks.
- Hardened production cookies with `__Host-`, `Secure`, `HttpOnly`, and `SameSite=Strict` attributes.
- Made malformed cookies fail safely.
- Tightened CSP/clickjacking policy and disabled unused browser capabilities with Permissions Policy.
- Removed raw error-message logging from the unhandled-error path.
- Added prompt rules against requesting or repeating credentials.
- Added a bilingual privacy notice accurately describing server memory, OpenAI processing, and possible abuse-monitoring retention.
- Documented public-deployment spend limits and the fact that this public project does not include user authentication.

### Verification

- All 25 automated tests passed.
- All 16 JavaScript files passed syntax checks.
- npm audited 98 total dependencies and reported 0 known vulnerabilities at the time of the audit.
- A production-mode server verified CSP, clickjacking denial, Permissions Policy, no-store API headers, no health-check session cookie, and the Secure `__Host-` session cookie.
- Headless Chrome rendered the bilingual privacy notice and the model/reasoning controls without layout problems.
- Secret-pattern, frontend API-boundary, browser-storage, and unsafe-HTML scans passed.
- The temporary Chrome test profile and screenshot were removed and added to `.gitignore` to prevent accidental commits in future audits.

### Remaining production responsibilities

- The app intentionally remains publicly accessible and has no user authentication, matching the public-URL assignment requirement.
- The in-memory rate limiter and session store are appropriate for one small educational server instance process, not a multi-instance production platform.
- A hosting HTTPS deployment, OpenAI project spend cap, and successful live conversation test are still required before publishing the final URL.
- The earlier live API attempt received HTTP 429, so account quota/billing must be resolved before successful AI replies can be verified.

## Iteration 6 — FR/EN interface toggle

### Clarification requested

The user asked for a visible EN/FR interface control while keeping French as the default.

### Changes produced

- Added an accessible segmented FR/EN control to the application header, with FR selected by default.
- Made the control translate the page title, description, status, form labels, model and reasoning controls, keyboard hint, privacy notice, and accessibility labels immediately.
- Sent the selected language as a validated preference with the next chat request.
- Preserved conversational language detection, so clearly using or requesting the other language can still switch both the reply and interface naturally.
- Disabled the language control while a response is in progress so the submitted preference and visible state cannot drift apart.
- Kept new conversations French-first and added server-side rejection of unsupported language values.

### Verification

- Automated API and static-interface coverage was extended for the language allowlist and both toggle choices.
- All 26 automated tests passed, including rejection of unsupported language values.
- All 16 JavaScript files passed syntax checks.
- Headless Chrome rendered the FR-selected control correctly without disturbing the existing desktop layout.
- The production dependency audit reported zero known vulnerabilities.
- `.env` remained ignored and untracked; secret-pattern, frontend credential, browser-storage, and unsafe-HTML scans passed.

## Iteration 7 — OpenAI and Claude provider selection

### Clarification requested

The user asked to keep OpenAI's Terra, Luna, and Sol choices while also selecting “Claude Code,” Claude models, and reasoning levels. The implementation labels the provider **Claude (Anthropic)** because Claude Code is Anthropic's coding-agent product; this web chatbot integrates the Claude API directly.

### Technology and architecture decision

- Kept the existing OpenAI Responses API integration.
- Added Anthropic's official JavaScript SDK and stateless Messages API on the server.
- Added a small provider-dispatch service rather than mixing two incompatible request formats in one file.
- Selected current Claude Sonnet 5, Claude Opus 5, and Claude Fable 5.1 model IDs from Anthropic's official model catalog.
- Used adaptive Claude thinking with `output_config.effort` and omitted thinking display. Signed/redacted continuity blocks remain only in bounded server memory.

### Changes produced

- Added a bilingual OpenAI/Claude provider selector and dynamic provider-specific model menu.
- Preserved each provider's most recent model choice when switching the menu.
- Mapped Instant through Ultra to each provider's supported effort values; Instant means `none` for OpenAI and `low` for Claude.
- Added strict server allowlists for providers, provider/model pairs, reasoning levels, and language.
- Added separate `OPENAI_API_KEY` and `ANTHROPIC_API_KEY` server environment variables; neither is returned to the browser.
- Prevented provider-specific session metadata from crossing from Anthropic to OpenAI.
- Updated the privacy notice, deployment template, setup example, API documentation, and tests.

### Verification

- All 32 automated tests passed, including provider/model mismatch rejection, both missing-key paths, provider metadata isolation, and both providers' request mappings.
- All 19 JavaScript files passed syntax checks.
- Headless Chrome rendered the expanded control row successfully; a browser automation check switched to Anthropic and confirmed the Sonnet, Opus, and Fable choices while preserving French and Instant defaults.
- npm audited all 105 installed packages and reported zero known vulnerabilities.
- `.env` remained ignored and untracked. Secret-pattern, frontend credential, browser-storage, unsafe-HTML, and provider-metadata leakage scans passed.
- No paid live Claude request was attempted because a real Anthropic key was not configured during this iteration.

## Iteration 8 — Railway deployment hardening

### Request

The user asked to make the application reliably deployable on Railway.

### Findings and corrections

- The project can live below the Git repository root, so Railway must use `/custom chatbot` as its Root Directory when `package.json` is inside that folder.
- Railway terminates public HTTPS at a reverse proxy. The app now recognizes Railway automatically and trusts one proxy hop so same-origin protection compares the real public HTTPS origin instead of rejecting legitimate chat requests.
- The HTTP server now binds explicitly to `0.0.0.0` and Railway's injected `PORT`, as required by Railway's networking guidance.
- Railway environments automatically receive Secure, HttpOnly, SameSite=Strict `__Host-` session cookies even if `NODE_ENV` was accidentally omitted.
- Added graceful SIGTERM/SIGINT shutdown handling for deployment replacement and local Ctrl+C behavior.
- Replaced the short Railway paragraph with exact root-directory, variables, Railpack, health-check, domain, and troubleshooting instructions.
- Did not add deprecated `railway.json` Config as Code to a new service; Railway's current Railpack auto-detection and dashboard settings are sufficient for this small application.

### Verification

- A production-mode Railway simulation bound successfully to `0.0.0.0` on an injected test `PORT`; `/api/health` returned HTTP 200.
- Simulated public `X-Forwarded-Proto` and `X-Forwarded-Host` headers passed the legitimate HTTPS origin while the automated suite confirmed a foreign origin still receives HTTP 403.
- The production simulation returned a Secure, HttpOnly, SameSite=Strict `__Host-` session cookie and `Cache-Control: no-store` on the API path.
- All 35 automated tests and syntax checks for all 19 JavaScript files passed.
- npm's clean-install dry run succeeded and the dependency audit reported zero known vulnerabilities.
- `.env` remained ignored and untracked; provider secret-pattern and frontend credential scans passed.
- The temporary production process stopped cleanly after the smoke test.

### Deployment prerequisite found

The `custom chatbot/` directory is currently untracked in the parent `IA01` Git repository. Railway cannot deploy these local files until they are added, committed, and pushed to the connected GitHub repository. The README now records the exact safe staging sequence and reminds the user to verify that `.env` is absent.

## Iteration 9 — Explicit API and conversation annotations

### Request

The user asked to identify precisely where the API is called, where the key is read, and how the conversation is structured.

### Changes produced

- Added prominent English comments beside environment loading, both provider-key reads, both external API calls, provider dispatch, browser-to-backend fetch, and user/assistant history updates.
- Added `api-and-conversation-map.md` with exact files, functions, safe excerpts, session shape, message shape, end-to-end data flow, and an explanation of why visitors cannot access provider keys.
- Linked the new code map directly from the README architecture section.
- No key value was read, copied, logged, or documented while adding these annotations.

### Verification

- All 35 automated tests passed after the annotations were added.
- All 19 JavaScript files passed syntax checks.
- `.env` remained ignored, no secret-like value was found outside it, and no provider credential name or value appeared in public files.

## Iteration 10 — Conversation sidebar and appearance themes

### Request

The user asked for a side panel that can create a new chat and retain previous chats during the active session, plus a light/dark mode switch. They also repeated that the location of the conversation structure must remain clearly commented.

### Architecture decision

- Expanded the existing temporary server-side session from one message array to a bounded collection of conversations. This preserves the privacy design: chat text stays in server memory rather than browser storage.
- Gave every conversation an opaque UUID, its own French/English state, ordered message history, timestamps, and a title derived locally from the first user message. This avoids an extra model request merely to name a chat.
- Limited each session to 20 conversations and each conversation to 20 retained messages. The existing two-hour inactivity expiry and process-restart behavior still apply.
- Kept the theme as a browser-only presentation setting with light as the default. It is not written to browser storage.

### Changes produced

- Added a desktop sidebar and mobile slide-out conversation panel with an accessible new-chat button and previous-chat list.
- Added same-origin endpoints to list, create, and reopen conversations owned by the current HttpOnly-cookie session.
- Added a light/dark theme button, responsive styling, keyboard focus states, ARIA state, and bilingual labels.
- Added `serializeConversation()` so browser history receives only `role` and `content`; server-only provider continuity metadata remains private.
- Kept the prominent `CONVERSATION STRUCTURE IS CREATED HERE` comment in `src/store/sessionStore.js` and updated `api-and-conversation-map.md` with the new nested structure and endpoints.

### Verification

- Automated tests cover isolated conversations, safe history serialization, conversation endpoints, unknown-ID rejection, and the sidebar/theme elements.
- A headless browser rendered the desktop sidebar and successfully switched the document to dark mode, created a second chat, and left exactly one active sidebar entry.
- An initial narrow-window screenshot revealed misleading horizontal clipping from Chrome's minimum headless layout width. A proper 390-pixel device-metrics test then exposed no horizontal overflow after the mobile header was tightened; it also confirmed that the menu button is visible, the sidebar is off-canvas until opened, and the language control remains within the viewport.
- No paid provider request was needed for these interface and session tests.
