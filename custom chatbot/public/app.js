const translations = {
  fr: {
    deleteChat: "Supprimer la conversation",
    welcomeTitle: "Bonjour, comment puis-je vous aider ?",
    welcomeDescription: "Un problème technique ? Trouvons la solution ensemble.",
    privacyLabel: "Confidentialité",
    pageTitle: "Nexus Support — Assistant de soutien technique",
    metaDescription: "Assistant bilingue de soutien technique propulsé par des API d’IA serveur.",
    description: "Assistant de soutien technique",
    statusAria: "État du service",
    chatAria: "Conversation de soutien technique",
    languageAria: "Langue de l’interface",
    languageButtons: {
      fr: "Afficher l’interface en français",
      en: "Afficher l’interface en anglais"
    },
    statusReady: "Prêt",
    statusWorking: "Traitement",
    thinking: "Analyse en cours…",
    label: "Votre message",
    placeholder: "Écrivez votre message…",
    send: "Envoyer",
    sendAria: "Envoyer le message",
    provider: "Fournisseur",
    providerTitle: "Choisissez le fournisseur d’IA utilisé pour la prochaine réponse.",
    providerOptions: {
      openai: "OpenAI",
      anthropic: "Claude (Anthropic)"
    },
    model: "Modèle",
    modelTitle: "Choisissez le modèle utilisé pour la prochaine réponse.",
    modelOptions: {
      openai: {
        luna: "Luna",
        terra: "Terra",
        sol: "Sol"
      },
      anthropic: {
        sonnet: "Claude Sonnet 5",
        opus: "Claude Opus 5",
        fable: "Claude Fable 5.1 (conservation 30 j)"
      }
    },
    reasoning: "Raisonnement",
    reasoningTitle: "Choisissez l’effort de raisonnement utilisé pour la prochaine réponse.",
    reasoningOptions: {
      instant: "Instantané",
      medium: "Moyen",
      high: "Élevé",
      veryHigh: "Très élevé",
      ultra: "Ultra"
    },
    hint: "Entrée pour envoyer · Maj+Entrée pour une nouvelle ligne",
    privacy: "Confidentialité : vos messages sont envoyés au fournisseur d’IA sélectionné pour traitement et restent temporairement dans la mémoire de ce serveur. Le fournisseur peut conserver certaines données selon ses politiques de sécurité et de conservation. Ne saisissez jamais de mot de passe, de clé API ou d’autre secret.",
    newChat: "Nouvelle conversation",
    conversations: "Conversations",
    previousChatsAria: "Conversations précédentes",
    openSidebar: "Afficher les conversations",
    closeSidebar: "Fermer le panneau des conversations",
    temporaryChats: "Les conversations sont temporaires et disparaissent lorsque la session expire ou que le serveur redémarre.",
    darkMode: "Mode sombre",
    lightMode: "Mode clair",
    greeting: "Bonjour. Je suis Nexus Support, votre assistant de soutien technique.\n\nDécrivez le problème que vous rencontrez et je vous aiderai à le diagnostiquer étape par étape.",
    you: "Vous",
    networkError: "Impossible de joindre le serveur. Vérifiez votre connexion, puis réessayez.",
    genericError: "Une erreur est survenue. Veuillez réessayer.",
    resetError: "La nouvelle conversation n’a pas pu être créée. Veuillez réessayer.",
    historyError: "Les conversations n’ont pas pu être chargées. Veuillez réessayer."
  },
  en: {
    deleteChat: "Delete conversation",
    welcomeTitle: "Hi, how can I help?",
    welcomeDescription: "Having a tech problem? Let’s figure it out together.",
    privacyLabel: "Privacy",
    pageTitle: "Nexus Support — Technical Support Assistant",
    metaDescription: "Bilingual technical support assistant powered by server-side AI APIs.",
    description: "Technical Support Assistant",
    statusAria: "Service status",
    chatAria: "Technical support conversation",
    languageAria: "Interface language",
    languageButtons: {
      fr: "Show the interface in French",
      en: "Show the interface in English"
    },
    statusReady: "Ready",
    statusWorking: "Working",
    thinking: "Analyzing…",
    label: "Your message",
    placeholder: "Type your message…",
    send: "Send",
    sendAria: "Send message",
    provider: "Provider",
    providerTitle: "Choose the AI provider used for the next response.",
    providerOptions: {
      openai: "OpenAI",
      anthropic: "Claude (Anthropic)"
    },
    model: "Model",
    modelTitle: "Choose the model used for the next response.",
    modelOptions: {
      openai: {
        luna: "Luna",
        terra: "Terra",
        sol: "Sol"
      },
      anthropic: {
        sonnet: "Claude Sonnet 5",
        opus: "Claude Opus 5",
        fable: "Claude Fable 5.1 (30-day retention)"
      }
    },
    reasoning: "Reasoning",
    reasoningTitle: "Choose the reasoning effort used for the next response.",
    reasoningOptions: {
      instant: "Instant",
      medium: "Medium",
      high: "High",
      veryHigh: "Very high",
      ultra: "Ultra"
    },
    hint: "Enter to send · Shift+Enter for a new line",
    privacy: "Privacy: your messages are sent to the selected AI provider for processing and remain temporarily in this server’s memory. The provider may retain some data under its safety and retention policies. Never enter a password, API key, or other secret.",
    newChat: "New conversation",
    conversations: "Conversations",
    previousChatsAria: "Previous conversations",
    openSidebar: "Show conversations",
    closeSidebar: "Close the conversations panel",
    temporaryChats: "Conversations are temporary and disappear when the session expires or the server restarts.",
    darkMode: "Dark mode",
    lightMode: "Light mode",
    greeting: "Hello. I’m Nexus Support, your technical support assistant.\n\nDescribe the problem you’re experiencing and I’ll help you diagnose it step by step.",
    you: "You",
    networkError: "The server could not be reached. Check your connection and try again.",
    genericError: "An error occurred. Please try again.",
    resetError: "A new conversation could not be created. Please try again.",
    historyError: "Conversations could not be loaded. Please try again."
  }
};

const elements = {
  form: document.querySelector("#chat-form"),
  input: document.querySelector("#message-input"),
  sendButton: document.querySelector("#send-button"),
  provider: document.querySelector("#provider-select"),
  model: document.querySelector("#model-select"),
  reasoning: document.querySelector("#reasoning-select"),
  conversation: document.querySelector("#conversation"),
  thinking: document.querySelector("#thinking"),
  error: document.querySelector("#error-banner"),
  template: document.querySelector("#message-template"),
  newChatButton: document.querySelector("#new-chat-button"),
  conversationList: document.querySelector("#conversation-list"),
  conversationNavigation: document.querySelector("#conversation-navigation"),
  workspace: document.querySelector("#workspace"),
  sidebarToggle: document.querySelector("#sidebar-toggle"),
  sidebarBackdrop: document.querySelector("#sidebar-backdrop"),
  themeToggle: document.querySelector("#theme-toggle"),
  languageButtons: [...document.querySelectorAll("[data-ui-language]")]
};

let activeLanguage = "fr";
let waiting = false;
let activeConversationId = null;
let conversationSummaries = [];
let darkMode = false;
const modelCatalog = Object.freeze({
  openai: ["luna", "terra", "sol"],
  anthropic: ["sonnet", "opus", "fable"]
});
const selectedModels = {
  openai: "terra",
  anthropic: "sonnet"
};

function populateModelOptions(preferredModel = selectedModels[elements.provider.value]) {
  const provider = elements.provider.value;
  const text = translations[activeLanguage];
  elements.model.replaceChildren();

  for (const model of modelCatalog[provider]) {
    const option = document.createElement("option");
    option.value = model;
    option.dataset.modelOption = model;
    option.textContent = text.modelOptions[provider][model];
    elements.model.append(option);
  }

  if (modelCatalog[provider].includes(preferredModel)) elements.model.value = preferredModel;
  selectedModels[provider] = elements.model.value;
}

function applyLanguage(language) {
  activeLanguage = language === "en" ? "en" : "fr";
  const text = translations[activeLanguage];
  document.documentElement.lang = activeLanguage;
  document.title = text.pageTitle;
  document.querySelector('meta[name="description"]').content = text.metaDescription;
  document.querySelector("#app-description").textContent = text.description;
  document.querySelector("#welcome-title").textContent = text.welcomeTitle;
  document.querySelector("#welcome-description").textContent = text.welcomeDescription;
  document.querySelector("#privacy-label").textContent = text.privacyLabel;
  document.querySelector("#connection-status").setAttribute("aria-label", text.statusAria);
  document.querySelector("#chat-panel").setAttribute("aria-label", text.chatAria);
  document.querySelector("#language-switcher").setAttribute("aria-label", text.languageAria);
  for (const button of elements.languageButtons) {
    const buttonLanguage = button.dataset.uiLanguage;
    const isActive = buttonLanguage === activeLanguage;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
    button.setAttribute("aria-label", text.languageButtons[buttonLanguage]);
  }
  document.querySelector("#status-label").textContent = waiting ? text.statusWorking : text.statusReady;
  document.querySelector("#thinking-label").textContent = text.thinking;
  document.querySelector("#message-label").textContent = text.label;
  elements.input.placeholder = text.placeholder;
  document.querySelector("#send-label").textContent = text.send;
  elements.sendButton.setAttribute("aria-label", text.sendAria);
  document.querySelector("#provider-label").textContent = text.provider;
  elements.provider.title = text.providerTitle;
  for (const option of elements.provider.options) {
    option.textContent = text.providerOptions[option.value];
  }
  document.querySelector("#model-label").textContent = text.model;
  elements.model.title = text.modelTitle;
  for (const option of elements.model.options) {
    option.textContent = text.modelOptions[elements.provider.value][option.dataset.modelOption];
  }
  document.querySelector("#reasoning-label").textContent = text.reasoning;
  elements.reasoning.title = text.reasoningTitle;
  for (const option of elements.reasoning.options) {
    option.textContent = text.reasoningOptions[option.dataset.reasoningOption];
  }
  document.querySelector("#keyboard-hint").textContent = text.hint;
  document.querySelector("#privacy-notice").textContent = text.privacy;
  document.querySelector("#new-chat-label").textContent = text.newChat;
  document.querySelector("#conversations-title").textContent = text.conversations;
  document.querySelector("#sidebar-note").textContent = text.temporaryChats;
  elements.conversationNavigation.setAttribute("aria-label", text.previousChatsAria);
  elements.sidebarToggle.setAttribute("aria-label", text.openSidebar);
  elements.sidebarBackdrop.setAttribute("aria-label", text.closeSidebar);
  document.querySelector("#theme-label").textContent = darkMode ? text.lightMode : text.darkMode;
  renderConversationList();
}

function addMessage(role, text) {
  setConversationStarted(true);
  const fragment = elements.template.content.cloneNode(true);
  const message = fragment.querySelector(".message");
  const avatar = fragment.querySelector(".avatar");
  const content = fragment.querySelector(".message-content");
  message.classList.add(role === "user" ? "user-message" : "assistant-message");
  avatar.textContent = role === "user" ? translations[activeLanguage].you.slice(0, 1).toUpperCase() : "NS";
  content.classList.add("plain-text");
  content.textContent = text;
  elements.conversation.append(fragment);
  scrollToLatest();
}

function scrollToLatest() {
  elements.conversation.scrollTop = elements.conversation.scrollHeight;
}

function renderConversationList() {
  elements.conversationList.replaceChildren();
  const fallbackTitle = translations[activeLanguage].newChat;

  for (const conversation of conversationSummaries) {
    const item = document.createElement("li");
    item.className = "conversation-row";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "conversation-link";
    button.dataset.conversationId = conversation.id;
    button.textContent = conversation.title || fallbackTitle;
    button.classList.toggle("is-active", conversation.id === activeConversationId);
    if (conversation.id === activeConversationId) button.setAttribute("aria-current", "page");
    item.append(button);
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-chat-button";
    deleteButton.dataset.deleteConversationId = conversation.id;
    const deleteLabel = `${translations[activeLanguage].deleteChat}: ${conversation.title || fallbackTitle}`;
    deleteButton.setAttribute("aria-label", deleteLabel);
    deleteButton.title = deleteLabel;
    deleteButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M9 6V4h6v2M5 6l1 14h12l1-14M10 10v6M14 10v6"/></svg>';
    deleteButton.disabled = waiting;
    item.append(deleteButton);
    elements.conversationList.append(item);
  }
}

function renderConversation(conversation) {
  activeConversationId = conversation.id;
  applyLanguage(conversation.language);
  elements.conversation.replaceChildren();
  setConversationStarted(conversation.messages.length > 0);
  for (const message of conversation.messages) addMessage(message.role, message.content);
  renderConversationList();
}

function setConversationStarted(started) {
  document.querySelector("#chat-panel").classList.toggle("is-empty", !started);
  document.querySelector("#welcome").hidden = started;
  elements.conversation.hidden = !started;
}

function setSidebarOpen(open) {
  elements.workspace.classList.toggle("sidebar-open", open);
  elements.sidebarToggle.setAttribute("aria-expanded", String(open));
  elements.sidebarBackdrop.hidden = !open;
}

async function loadConversationList() {
  const response = await fetch("/api/chat/conversations");
  if (!response.ok) throw new Error(await readError(response));
  const data = await response.json();
  conversationSummaries = data.conversations;
  activeConversationId ||= data.activeConversationId;
  renderConversationList();
  return data;
}

async function openConversation(conversationId) {
  const response = await fetch(`/api/chat/conversations/${encodeURIComponent(conversationId)}`);
  if (!response.ok) throw new Error(await readError(response));
  const data = await response.json();
  renderConversation(data.conversation);
  setSidebarOpen(false);
}

function setWaiting(value) {
  waiting = value;
  elements.input.disabled = value;
  elements.sendButton.disabled = value;
  elements.provider.disabled = value;
  elements.model.disabled = value;
  elements.reasoning.disabled = value;
  elements.newChatButton.disabled = value;
  elements.sidebarToggle.disabled = value;
  for (const button of elements.conversationList.querySelectorAll("button")) button.disabled = value;
  for (const button of elements.languageButtons) button.disabled = value;
  elements.thinking.hidden = !value;
  document.querySelector("#status-label").textContent = value
    ? translations[activeLanguage].statusWorking
    : translations[activeLanguage].statusReady;
  if (value) scrollToLatest();
}

function showError(message) {
  elements.error.textContent = message;
  elements.error.hidden = false;
}

function clearError() {
  elements.error.hidden = true;
  elements.error.textContent = "";
}

function resizeInput() {
  elements.input.style.height = "auto";
  elements.input.style.height = `${Math.min(elements.input.scrollHeight, 150)}px`;
}

async function readError(response) {
  try {
    const body = await response.json();
    return body.messages?.[activeLanguage] || translations[activeLanguage].genericError;
  } catch {
    return translations[activeLanguage].genericError;
  }
}

async function loadConfiguration() {
  try {
    const response = await fetch("/api/config");
    if (!response.ok) return;
    const configuration = await response.json();
    for (const provider of Object.keys(modelCatalog)) {
      if (modelCatalog[provider].includes(configuration.defaultModels?.[provider])) {
        selectedModels[provider] = configuration.defaultModels[provider];
      }
    }
    if (Object.hasOwn(modelCatalog, configuration.defaultProvider)) {
      elements.provider.value = configuration.defaultProvider;
    }
    populateModelOptions();
  } catch {
    // The HTML keeps Claude Sonnet selected if configuration cannot be loaded.
  }
}

elements.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (waiting) return;

  const message = elements.input.value.trim();
  const provider = elements.provider.value;
  const model = elements.model.value;
  const reasoning = elements.reasoning.value;
  if (!message) return;

  clearError();
  addMessage("user", message);
  const activeSummary = conversationSummaries.find(({ id }) => id === activeConversationId);
  if (activeSummary && !activeSummary.title) {
    activeSummary.title = message.length > 54 ? `${message.slice(0, 53).trimEnd()}…` : message;
    renderConversationList();
  }
  elements.input.value = "";
  resizeInput();
  setWaiting(true);

  try {
    // BROWSER API CALL HAPPENS HERE: this calls our Express backend, not OpenAI
    // or Anthropic. No provider API key exists in this browser request.
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        provider,
        model,
        reasoning,
        language: activeLanguage,
        conversationId: activeConversationId
      })
    });

    if (!response.ok) throw new Error(await readError(response));

    const data = await response.json();
    activeConversationId = data.conversationId;
    applyLanguage(data.language);
    addMessage("assistant", data.reply);
    await loadConversationList();
  } catch (error) {
    showError(error instanceof TypeError ? translations[activeLanguage].networkError : error.message);
  } finally {
    setWaiting(false);
    elements.input.focus();
  }
});

elements.input.addEventListener("input", resizeInput);
elements.input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    elements.form.requestSubmit();
  }
});

elements.provider.addEventListener("change", () => {
  populateModelOptions();
  clearError();
});

elements.model.addEventListener("change", () => {
  selectedModels[elements.provider.value] = elements.model.value;
});

for (const button of elements.languageButtons) {
  button.addEventListener("click", () => {
    if (waiting) return;
    applyLanguage(button.dataset.uiLanguage);
    clearError();
    elements.input.focus();
  });
}

elements.newChatButton.addEventListener("click", async () => {
  if (waiting) return;
  clearError();
  elements.newChatButton.disabled = true;

  try {
    const response = await fetch("/api/chat/conversations", { method: "POST" });
    if (!response.ok) throw new Error(await readError(response));
    const data = await response.json();
    conversationSummaries.unshift({ ...data.conversation, messageCount: 0 });
    conversationSummaries = conversationSummaries.slice(0, 20);
    renderConversation(data.conversation);
    elements.input.value = "";
    resizeInput();
    setSidebarOpen(false);
  } catch (error) {
    showError(error instanceof TypeError ? translations[activeLanguage].networkError : error.message);
  } finally {
    elements.newChatButton.disabled = false;
    elements.input.focus();
  }
});

elements.conversationList.addEventListener("click", async (event) => {
  const deleteButton = event.target.closest("[data-delete-conversation-id]");
  if (deleteButton) {
    if (waiting) return;
    clearError();
    setWaiting(true);
    try {
      const id = deleteButton.dataset.deleteConversationId;
      const response = await fetch(`/api/chat/conversations/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await readError(response));
      const data = await response.json();
      conversationSummaries = data.conversations;
      if (id === activeConversationId) {
        renderConversation(data.conversation);
        elements.input.value = "";
        resizeInput();
      } else renderConversationList();
    } catch (error) {
      showError(error instanceof TypeError ? translations[activeLanguage].networkError : error.message);
    } finally {
      setWaiting(false);
      elements.newChatButton.focus();
    }
    return;
  }
  const button = event.target.closest("[data-conversation-id]");
  if (!button || waiting || button.dataset.conversationId === activeConversationId) {
    setSidebarOpen(false);
    return;
  }
  clearError();
  setWaiting(true);
  try {
    await openConversation(button.dataset.conversationId);
  } catch (error) {
    showError(error instanceof TypeError ? translations[activeLanguage].networkError : error.message);
  } finally {
    setWaiting(false);
    elements.input.focus();
  }
});

elements.sidebarToggle.addEventListener("click", () => {
  setSidebarOpen(!elements.workspace.classList.contains("sidebar-open"));
});
elements.sidebarBackdrop.addEventListener("click", () => setSidebarOpen(false));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && elements.workspace.classList.contains("sidebar-open")) {
    setSidebarOpen(false);
    elements.sidebarToggle.focus();
  }
});

elements.themeToggle.addEventListener("click", () => {
  darkMode = !darkMode;
  document.documentElement.dataset.theme = darkMode ? "dark" : "light";
  elements.themeToggle.setAttribute("aria-pressed", String(darkMode));
  document.querySelector("#theme-label").textContent = darkMode
    ? translations[activeLanguage].lightMode
    : translations[activeLanguage].darkMode;
});

async function initialize() {
  applyLanguage("fr");
  await loadConfiguration();
  try {
    const data = await loadConversationList();
    await openConversation(data.activeConversationId);
  } catch (error) {
    showError(error instanceof TypeError ? translations[activeLanguage].networkError : translations[activeLanguage].historyError);
  }
  elements.input.focus();
}

initialize();
