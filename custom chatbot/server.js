// API KEY LOADING STARTS HERE:
// dotenv reads the ignored local .env file into server-side process.env.
// It does not place those values in HTML or browser JavaScript.
import "dotenv/config";
import express from "express";
import helmet from "helmet";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  APP_NAME,
  DEFAULT_PROVIDER,
  getDefaultModelChoice,
  isProductionEnvironment
} from "./src/config.js";
import { noStore, requireSameOrigin } from "./src/middleware/security.js";
import { chatRouter } from "./src/routes/chat.js";

const app = express();
const port = Number.parseInt(process.env.PORT, 10) || 3000;
const rootDirectory = path.dirname(fileURLToPath(import.meta.url));

// Railway and similar hosts terminate HTTPS at a trusted reverse proxy.
// This keeps secure cookies and same-origin checks aligned with the public HTTPS URL.
if (isProductionEnvironment()) app.set("trust proxy", 1);

app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "default-src": ["'self'"],
        "base-uri": ["'self'"],
        "connect-src": ["'self'"],
        "font-src": ["'self'"],
        "form-action": ["'self'"],
        "frame-ancestors": ["'none'"],
        "script-src": ["'self'"],
        "style-src": ["'self'"],
        "img-src": ["'self'", "data:"],
        "object-src": ["'none'"]
      }
    },
    frameguard: { action: "deny" }
  })
);
app.use((_req, res, next) => {
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
  );
  next();
});
app.use("/api", noStore);
app.use("/api/chat", requireSameOrigin);
app.use(express.json({ limit: "20kb", strict: true }));
app.use("/api/chat", chatRouter);
app.use(express.static(path.join(rootDirectory, "public")));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: APP_NAME });
});

app.get("/api/config", (_req, res) => {
  res.json({
    defaultProvider: DEFAULT_PROVIDER,
    defaultModels: {
      openai: getDefaultModelChoice("openai"),
      anthropic: getDefaultModelChoice("anthropic")
    }
  });
});

app.use("/api", (_req, res) => {
  res.status(404).json({ error: "NOT_FOUND" });
});

app.use((error, _req, res, _next) => {
  if (error?.type === "entity.parse.failed") {
    return res.status(400).json({
      error: "INVALID_JSON",
      messages: {
        fr: "Le corps JSON de la requête est invalide.",
        en: "The JSON request body is invalid."
      }
    });
  }

  if (error?.type === "entity.too.large") {
    return res.status(413).json({
      error: "REQUEST_TOO_LARGE",
      messages: {
        fr: "La requête est trop volumineuse.",
        en: "The request is too large."
      }
    });
  }

  console.error("Unhandled server error", { name: error?.name, code: error?.code });
  return res.status(500).json({
    error: "INTERNAL_ERROR",
    messages: {
      fr: "Une erreur interne est survenue.",
      en: "An internal error occurred."
    }
  });
});

if (process.env.NODE_ENV !== "test") {
  const server = app.listen(port, "0.0.0.0", () => {
    console.log(`${APP_NAME} is listening on 0.0.0.0:${port}`);
    if (!process.env.OPENAI_API_KEY) {
      console.warn("OPENAI_API_KEY is missing. The interface will work, but AI replies are disabled.");
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn("ANTHROPIC_API_KEY is missing. Claude replies are disabled.");
    }
  });

  const shutdown = (signal) => {
    console.log(`${signal} received. Closing the HTTP server.`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.once("SIGTERM", () => shutdown("SIGTERM"));
  process.once("SIGINT", () => shutdown("SIGINT"));
}

export default app;
