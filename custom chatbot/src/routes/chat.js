import { Router } from "express";
import {
  DEFAULT_PROVIDER,
  DEFAULT_REASONING,
  getDefaultModelChoice,
  MAX_MESSAGE_LENGTH,
  PROVIDER_MODEL_ID_MAP,
  REASONING_EFFORT_MAP,
  SUPPORTED_LANGUAGES,
  SUPPORTED_PROVIDERS
} from "../config.js";
import { chatRateLimiter } from "../middleware/rateLimiter.js";
import { createHelpDeskReply } from "../services/llmService.js";
import {
  addMessage,
  createConversation,
  deleteConversation,
  getConversation,
  listConversations,
  resetSession,
  serializeConversation,
  sessionMiddleware
} from "../store/sessionStore.js";
import { detectLanguage } from "../utils/language.js";

export const chatRouter = Router();

function localizedError(code, french, english) {
  return { error: code, messages: { fr: french, en: english } };
}

function mapProviderError(error) {
  const status = Number(error?.status);

  if (error?.code === "MISSING_API_KEY" || error?.code === "MISSING_ANTHROPIC_API_KEY") {
    return {
      status: 503,
      body: localizedError(
        "SERVICE_NOT_CONFIGURED",
        "Le service de clavardage n’est pas encore configuré. L’administrateur doit ajouter la clé API au serveur.",
        "The chat service is not configured yet. The administrator must add the API key to the server."
      )
    };
  }

  if (status === 401 || error?.code === "invalid_api_key") {
    return {
      status: 503,
      body: localizedError(
        "AUTHENTICATION_FAILED",
        "Le service n’a pas pu s’authentifier auprès du fournisseur d’IA. Vérifiez la configuration du serveur.",
        "The service could not authenticate with the AI provider. Check the server configuration."
      )
    };
  }

  if (status === 429) {
    return {
      status: 503,
      body: localizedError(
        "UPSTREAM_RATE_LIMIT",
        "Le service d’IA reçoit trop de demandes en ce moment. Veuillez réessayer dans quelques instants.",
        "The AI service is receiving too many requests right now. Please try again shortly."
      )
    };
  }

  if (status === 400 || status === 403) {
    return {
      status: 503,
      body: localizedError(
        "MODEL_UNAVAILABLE",
        "Le modèle sélectionné n’est pas disponible pour ce compte ou cette configuration.",
        "The selected model is not available for this account or configuration."
      )
    };
  }

  if (status >= 500 || error?.name === "APIConnectionError") {
    return {
      status: 503,
      body: localizedError(
        "UPSTREAM_UNAVAILABLE",
        "Le service d’IA est temporairement indisponible. Veuillez réessayer.",
        "The AI service is temporarily unavailable. Please try again."
      )
    };
  }

  return {
    status: 500,
    body: localizedError(
      "CHAT_FAILED",
      "Une erreur est survenue pendant le traitement du message. Veuillez réessayer.",
      "An error occurred while processing the message. Please try again."
    )
  };
}

function conversationNotFound(res) {
  return res.status(404).json(
    localizedError(
      "CONVERSATION_NOT_FOUND",
      "Cette conversation est introuvable ou a expiré.",
      "This conversation could not be found or has expired."
    )
  );
}

chatRouter.get("/conversations", sessionMiddleware, (req, res) => {
  res.json({
    activeConversationId: req.chatSession.activeConversationId,
    conversations: listConversations(req.chatSession)
  });
});

chatRouter.post("/conversations", chatRateLimiter, sessionMiddleware, (req, res) => {
  const conversation = createConversation(req.chatSession);
  res.status(201).json({ conversation: serializeConversation(conversation) });
});

chatRouter.get("/conversations/:conversationId", sessionMiddleware, (req, res) => {
  const conversation = getConversation(req.chatSession, req.params.conversationId);
  if (!conversation) return conversationNotFound(res);
  res.json({ conversation: serializeConversation(conversation) });
});

chatRouter.delete("/conversations/:conversationId", chatRateLimiter, sessionMiddleware, (req, res) => {
  if (!deleteConversation(req.chatSession, req.params.conversationId)) return conversationNotFound(res);
  res.json({
    conversations: listConversations(req.chatSession),
    conversation: serializeConversation(getConversation(req.chatSession))
  });
});

chatRouter.post("/", chatRateLimiter, sessionMiddleware, async (req, res) => {
  if (!req.is("application/json") || !req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json(
      localizedError(
        "INVALID_BODY",
        "La requête doit contenir un objet JSON valide.",
        "The request must contain a valid JSON object."
      )
    );
  }

  const { message } = req.body;
  const provider = req.body.provider ?? DEFAULT_PROVIDER;
  const reasoning = req.body.reasoning ?? DEFAULT_REASONING;
  const language = req.body.language;
  if (typeof message !== "string" || !message.trim()) {
    return res.status(400).json(
      localizedError("EMPTY_MESSAGE", "Veuillez écrire un message.", "Please enter a message.")
    );
  }

  const cleanMessage = message.trim();
  if (cleanMessage.length > MAX_MESSAGE_LENGTH) {
    return res.status(413).json(
      localizedError(
        "MESSAGE_TOO_LARGE",
        `Le message dépasse la limite de ${MAX_MESSAGE_LENGTH} caractères.`,
        `The message exceeds the ${MAX_MESSAGE_LENGTH}-character limit.`
      )
    );
  }

  if (typeof reasoning !== "string" || !Object.hasOwn(REASONING_EFFORT_MAP, reasoning)) {
    return res.status(400).json(
      localizedError(
        "INVALID_REASONING",
        "Le niveau de raisonnement sélectionné est invalide.",
        "The selected reasoning level is invalid."
      )
    );
  }

  if (typeof provider !== "string" || !SUPPORTED_PROVIDERS.includes(provider)) {
    return res.status(400).json(
      localizedError(
        "INVALID_PROVIDER",
        "Le fournisseur d’IA sélectionné est invalide.",
        "The selected AI provider is invalid."
      )
    );
  }

  const model = req.body.model ?? getDefaultModelChoice(provider);
  if (typeof model !== "string" || !Object.hasOwn(PROVIDER_MODEL_ID_MAP[provider], model)) {
    return res.status(400).json(
      localizedError(
        "INVALID_MODEL",
        "Le modèle sélectionné est invalide.",
        "The selected model is invalid."
      )
    );
  }

  if (language !== undefined && (typeof language !== "string" || !SUPPORTED_LANGUAGES.includes(language))) {
    return res.status(400).json(
      localizedError(
        "INVALID_LANGUAGE",
        "La langue sélectionnée est invalide.",
        "The selected language is invalid."
      )
    );
  }

  const session = req.chatSession;
  const conversationId = req.body.conversationId ?? session.activeConversationId;
  if (typeof conversationId !== "string") return conversationNotFound(res);
  const conversation = getConversation(session, conversationId);
  if (!conversation) return conversationNotFound(res);
  session.activeConversationId = conversation.id;
  if (language) conversation.language = language;
  const isFirstUserMessage = !conversation.messages.some((item) => item.role === "user");
  conversation.language = detectLanguage(cleanMessage, conversation.language, isFirstUserMessage);
  // THE USER TURN ENTERS THE SERVER-SIDE CONVERSATION HISTORY HERE.
  addMessage(conversation, "user", cleanMessage);

  try {
    // THE COMPLETE BOUNDED CONVERSATION IS SENT TO THE SELECTED PROVIDER HERE.
    const result = await createHelpDeskReply(
      conversation.messages,
      conversation.language,
      reasoning,
      provider,
      model
    );
    // THE ASSISTANT TURN IS ADDED TO THE SAME CONVERSATION HERE.
    addMessage(conversation, "assistant", result.text, {
      provider,
      ...(result.providerContent ? { providerContent: result.providerContent } : {})
    });
    return res.json({
      reply: result.text,
      conversationId: conversation.id,
      title: conversation.title,
      language: conversation.language,
      reasoning,
      provider,
      model
    });
  } catch (error) {
    // Log only bounded metadata; never log request headers, bodies, or the API key.
    console.error("Chat request failed", {
      name: error?.name,
      code: error?.code,
      status: error?.status,
      requestId: error?.request_id
    });
    const mapped = mapProviderError(error);
    return res.status(mapped.status).json(mapped.body);
  }
});

chatRouter.post("/reset", chatRateLimiter, sessionMiddleware, (req, res) => {
  resetSession(req.chatSession);
  res.status(204).end();
});
