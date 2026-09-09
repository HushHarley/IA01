export const APP_NAME = "Nexus Support";
export const DEFAULT_LANGUAGE = "fr";
export const SUPPORTED_LANGUAGES = Object.freeze(["fr", "en"]);
export const DEFAULT_PROVIDER = "anthropic";
export const SUPPORTED_PROVIDERS = Object.freeze(["openai", "anthropic"]);
export const DEFAULT_MODEL = "gpt-5.6-terra";
export const DEFAULT_MODEL_CHOICE = "terra";
export const MODEL_ID_MAP = Object.freeze({
  luna: "gpt-5.6-luna",
  terra: "gpt-5.6-terra",
  sol: "gpt-5.6-sol"
});
export const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-5";
export const DEFAULT_ANTHROPIC_MODEL_CHOICE = "sonnet";
export const ANTHROPIC_MODEL_ID_MAP = Object.freeze({
  sonnet: "claude-sonnet-5",
  opus: "claude-opus-5",
  fable: "claude-fable-5-1"
});
export const PROVIDER_MODEL_ID_MAP = Object.freeze({
  openai: MODEL_ID_MAP,
  anthropic: ANTHROPIC_MODEL_ID_MAP
});
export const DEFAULT_REASONING = "instant";
export const REASONING_EFFORT_MAP = Object.freeze({
  instant: "none",
  medium: "medium",
  high: "high",
  very_high: "xhigh",
  ultra: "max"
});
export const ANTHROPIC_REASONING_EFFORT_MAP = Object.freeze({
  instant: "low",
  medium: "medium",
  high: "high",
  very_high: "xhigh",
  ultra: "max"
});
export const MAX_OUTPUT_TOKENS_BY_REASONING = Object.freeze({
  instant: 2000,
  medium: 3000,
  high: 4000,
  very_high: 6000,
  ultra: 8000
});
export const MAX_MESSAGE_LENGTH = 4000;
export const MAX_HISTORY_MESSAGES = 20;
export const MAX_CONVERSATIONS_PER_SESSION = 20;
export const MAX_SESSIONS = 1000;
export const SESSION_TTL_MS = 2 * 60 * 60 * 1000;

export function isProductionEnvironment() {
  return process.env.NODE_ENV === "production" || Boolean(process.env.RAILWAY_ENVIRONMENT_NAME);
}

export function getDefaultModelChoice(provider = DEFAULT_PROVIDER, modelId) {
  const modelMap = PROVIDER_MODEL_ID_MAP[provider] ?? MODEL_ID_MAP;
  const configuredModelId = modelId ?? (
    provider === "anthropic" ? process.env.ANTHROPIC_MODEL : process.env.OPENAI_MODEL
  );
  const configuredChoice = Object.entries(modelMap).find(
    ([, supportedModelId]) => supportedModelId === configuredModelId
  );
  return configuredChoice?.[0] ?? (
    provider === "anthropic" ? DEFAULT_ANTHROPIC_MODEL_CHOICE : DEFAULT_MODEL_CHOICE
  );
}
