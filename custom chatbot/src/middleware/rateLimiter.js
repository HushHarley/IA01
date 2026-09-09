const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 30;
const clients = new Map();

export function chatRateLimiter(req, res, next) {
  const key = req.ip;
  const now = Date.now();
  const entry = clients.get(key);

  if (!entry || now >= entry.resetAt) {
    clients.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  entry.count += 1;
  if (entry.count > MAX_REQUESTS) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    res.setHeader("Retry-After", retryAfter);
    return res.status(429).json({
      error: "RATE_LIMITED",
      messages: {
        fr: "Trop de demandes ont été envoyées. Veuillez patienter quelques minutes avant de réessayer.",
        en: "Too many requests were sent. Please wait a few minutes before trying again."
      }
    });
  }

  return next();
}

const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of clients.entries()) {
    if (now >= entry.resetAt) clients.delete(key);
  }
}, WINDOW_MS);
cleanupTimer.unref();

