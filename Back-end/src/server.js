import { createFavoritesRouter } from "./routes/favoritesRoutes.js";
import express from "express";
import cors from "cors";

import { ENV } from "./config/env.js";
import { db } from "./config/db.js";
import job from "./config/cron.js";
import { sessionAuth } from "./middleware/sessionAuth.js";
import { meterAI } from "./middleware/meterAI.js";
import { createMembershipService } from "./services/membershipService.js";
import { createMembershipRouter } from "./routes/membershipRoutes.js";
import aiRecipeRoutes from "./routes/aiRecipeRoutes.js";
import imageRoutes from "./routes/imageRoutes.js";
import { createPantryRouter } from "./routes/pantryRoutes.js";

const app = express();
const PORT = ENV.PORT || 5001;

if (ENV.NODE_ENV === "production" && process.env.ENABLE_KEEP_ALIVE === "true" && process.env.API_URL?.startsWith("https://")) {
  job.start();
}

app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
  })
);

// Photo uploads have a bounded, route-specific payload limit.
app.use("/api/pantry/scan", express.json({ limit: "5mb" }));

app.use(
  express.json({
    limit: "1mb",
  })
);

app.get("/api/health", (request, response) => {
  return response.status(200).json({
    success: true,
    message: "Recipe API is running.",
    environment: ENV.NODE_ENV,
    aiConfigured: Boolean(ENV.GEMINI_API_KEY),
    imageSearchConfigured: Boolean(ENV.PEXELS_API_KEY),
  });
});

const membershipService = createMembershipService({ db });
const authenticate = sessionAuth();
// Expire cached AI output even for accounts that never make another request.
const receiptCleanup = setInterval(() => {
  membershipService.purgeExpiredReceipts().catch(() => console.error("Beta receipt cleanup failed."));
}, 60 * 60 * 1000);
receiptCleanup.unref();
app.use("/api/membership", createMembershipRouter({ service: membershipService, authenticate }));
app.use("/api/ai/recipes", (req, res, next) => {
  if (req.method !== "POST") return next();
  authenticate(req, res, () => meterAI(membershipService)(req, res, next));
}, aiRecipeRoutes);
app.post("/api/pantry/scan", authenticate, meterAI(membershipService, () => ["scans"]));
app.post("/api/pantry/meal-plans/drafts", authenticate, meterAI(membershipService, () => ["plans"]));
app.use("/api/favorites", createFavoritesRouter({ db }));
app.use("/api/images", imageRoutes);
app.use("/api/pantry", createPantryRouter({ db }));

app.use((request, response) => {
  return response.status(404).json({
    success: false,
    message: `Route not found: ${request.method} ${request.originalUrl}`,
  });
});

app.use((error, request, response, next) => {
  console.error("Unhandled server error:", error);

  if (response.headersSent) {
    return next(error);
  }

  return response.status(500).json({
    success: false,
    message: "An unexpected server error occurred.",
  });
});

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Recipe API is running at http://localhost:${PORT}`);
  console.log("AI provider: Google Gemini");
  console.log(`AI model: ${ENV.GEMINI_MODEL}`);
  console.log(
    `AI recipe service configured: ${
      ENV.GEMINI_API_KEY ? "yes" : "no"
    }`
  );
  console.log(
    `Pexels image service configured: ${
      ENV.PEXELS_API_KEY ? "yes" : "no"
    }`
  );
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Stop the other backend process and restart this server.`
    );
    return;
  }

  console.error("Server failed to start:", error);
});