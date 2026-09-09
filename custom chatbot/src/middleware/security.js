function localizedError(code, french, english) {
  return { error: code, messages: { fr: french, en: english } };
}

export function noStore(_req, res, next) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  next();
}

export function requireSameOrigin(req, res, next) {
  const origin = req.get("origin");
  if (!origin) return next();

  // Express resolves X-Forwarded-Host through req.hostname only when the app
  // explicitly trusts its deployment proxy. Local development keeps using Host.
  const host = req.app.get("trust proxy") ? req.hostname : req.get("host");
  let expectedOrigin = null;
  if (host) {
    try {
      expectedOrigin = new URL(`${req.protocol}://${host}`).origin;
    } catch {
      expectedOrigin = null;
    }
  }

  if (!expectedOrigin || origin !== expectedOrigin) {
    return res.status(403).json(
      localizedError(
        "CROSS_ORIGIN_BLOCKED",
        "Cette requête provenant d’un autre site a été bloquée.",
        "This request from another site was blocked."
      )
    );
  }

  return next();
}
