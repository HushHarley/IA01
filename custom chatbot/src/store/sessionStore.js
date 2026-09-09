import { randomUUID } from "node:crypto";
import {
  DEFAULT_LANGUAGE,
  isProductionEnvironment,
  MAX_CONVERSATIONS_PER_SESSION,
  MAX_HISTORY_MESSAGES,
  MAX_SESSIONS,
  SESSION_TTL_MS
} from "../config.js";

const sessions = new Map();

function getCookieName() {
  return isProductionEnvironment()
    ? "__Host-nexus_support_session"
    : "nexus_support_session";
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return "";
  }
}

function parseCookies(cookieHeader = "") {
  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((item) => item.trim().split("="))
      .filter(([key, value]) => key && value)
      .map(([key, value]) => [safeDecode(key), safeDecode(value)])
  );
}

function createSession() {
  // CONVERSATION STRUCTURE IS CREATED HERE:
  // A cookie-backed session owns several independent conversations. Each conversation
  // has its own language and ordered user/assistant messages. Provider-only metadata
  // may be retained for continuity but is removed before history reaches the browser.
  const session = {
    id: randomUUID(),
    conversations: [],
    activeConversationId: null,
    lastSeen: Date.now()
  };
  createConversation(session);
  return session;
}

function setSessionCookie(res, sessionId) {
  const secure = isProductionEnvironment() ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${getCookieName()}=${encodeURIComponent(sessionId)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}${secure}`
  );
}

function evictOldestSessionIfNeeded() {
  if (sessions.size < MAX_SESSIONS) return;

  let oldest;
  for (const session of sessions.values()) {
    if (!oldest || session.lastSeen < oldest.lastSeen) oldest = session;
  }
  if (oldest) sessions.delete(oldest.id);
}

export function sessionMiddleware(req, res, next) {
  const sessionId = parseCookies(req.headers.cookie)[getCookieName()];
  let session = sessionId ? sessions.get(sessionId) : undefined;

  if (!session || Date.now() - session.lastSeen > SESSION_TTL_MS) {
    if (sessionId) sessions.delete(sessionId);
    evictOldestSessionIfNeeded();
    session = createSession();
    sessions.set(session.id, session);
    setSessionCookie(res, session.id);
  }

  session.lastSeen = Date.now();
  req.chatSession = session;
  next();
}

export function createConversation(session) {
  const now = Date.now();
  const conversation = {
    id: randomUUID(),
    title: null,
    language: DEFAULT_LANGUAGE,
    messages: [],
    createdAt: now,
    updatedAt: now
  };

  session.conversations.push(conversation);
  while (session.conversations.length > MAX_CONVERSATIONS_PER_SESSION) {
    session.conversations.shift();
  }
  session.activeConversationId = conversation.id;
  session.lastSeen = now;
  return conversation;
}

export function getConversation(session, conversationId = session.activeConversationId) {
  return session.conversations.find((conversation) => conversation.id === conversationId);
}

export function deleteConversation(session, conversationId) {
  const index = session.conversations.findIndex(({ id }) => id === conversationId);
  if (index === -1) return false;
  session.conversations.splice(index, 1);
  if (session.conversations.length === 0) createConversation(session);
  else if (session.activeConversationId === conversationId) {
    session.activeConversationId = listConversations(session)[0].id;
  }
  return true;
}

export function listConversations(session) {
  return [...session.conversations]
    .reverse()
    .sort((first, second) => second.updatedAt - first.updatedAt)
    .map(({ id, title, language, messages, createdAt, updatedAt }) => ({
      id,
      title,
      language,
      messageCount: messages.length,
      createdAt,
      updatedAt
    }));
}

export function serializeConversation(conversation) {
  return {
    id: conversation.id,
    title: conversation.title,
    language: conversation.language,
    messages: conversation.messages.map(({ role, content }) => ({ role, content })),
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt
  };
}

export function addMessage(conversation, role, content, metadata = {}) {
  // EACH CONVERSATION TURN IS STORED HERE as { role, content, ...metadata }.
  conversation.messages.push({ role, content, ...metadata });
  if (role === "user" && !conversation.title) {
    const compactTitle = content.replace(/\s+/g, " ").trim();
    conversation.title = compactTitle.length > 54
      ? `${compactTitle.slice(0, 53).trimEnd()}…`
      : compactTitle;
  }
  conversation.updatedAt = Date.now();
  while (conversation.messages.length > MAX_HISTORY_MESSAGES) conversation.messages.shift();
  // Keep the retained context aligned on a user turn after truncation.
  if (conversation.messages[0]?.role === "assistant") conversation.messages.shift();
}

export function resetSession(session) {
  session.conversations = [];
  session.activeConversationId = null;
  session.lastSeen = Date.now();
  return createConversation(session);
}

export function getSessionCount() {
  return sessions.size;
}

const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now - session.lastSeen > SESSION_TTL_MS) sessions.delete(id);
  }
}, 30 * 60 * 1000);
cleanupTimer.unref();
