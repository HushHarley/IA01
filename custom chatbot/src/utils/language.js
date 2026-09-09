const ENGLISH_REQUEST = /\b(?:speak|continue|answer|reply|respond|switch(?:\s+back)?|change)(?:\s+\w+){0,4}\s+(?:in|to)\s+english\b|\b(?:parle|parler|continue|continuer|réponds|répondre|passe|passer)(?:\s+\w+){0,4}\s+en\s+anglais\b|\benglish\s+please\b/i;
const FRENCH_REQUEST = /\b(?:speak|continue|answer|reply|respond|return|switch(?:\s+back)?|change)(?:\s+\w+){0,4}\s+(?:in|to)\s+french\b|\b(?:parle|parler|continue|continuer|réponds|répondre|passe|passer)(?:\s+\w+){0,4}\s+en\s+fran[cç]ais\b|\bfran[cç]ais\s+s['’]il\s+(?:te|vous)\s+pla[iî]t\b/i;

const ENGLISH_WORDS = new Set([
  "a", "and", "are", "can", "could", "do", "does", "error", "help", "hi",
  "how", "i", "in", "internet", "is", "it", "my", "not", "on", "please",
  "the", "this", "to", "what", "when", "why", "wifi", "windows", "with", "you"
]);
const FRENCH_WORDS = new Set([
  "a", "avec", "bonjour", "comment", "dans", "de", "des", "est", "et", "internet",
  "je", "la", "le", "les", "mon", "ne", "pas", "peux", "pour", "problème",
  "que", "qui", "sur", "un", "une", "wifi", "windows", "vous"
]);

function scoreWords(message, words) {
  const tokens = message.toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  return tokens.reduce((score, token) => score + Number(words.has(token)), 0);
}

export function detectLanguage(message, currentLanguage, isFirstUserMessage) {
  if (ENGLISH_REQUEST.test(message)) return "en";
  if (FRENCH_REQUEST.test(message)) return "fr";

  const englishScore = scoreWords(message, ENGLISH_WORDS);
  const frenchScore = scoreWords(message, FRENCH_WORDS);

  if (isFirstUserMessage || Math.abs(englishScore - frenchScore) >= 2) {
    if (englishScore > frenchScore) return "en";
    if (frenchScore > englishScore) return "fr";
  }

  return currentLanguage;
}
