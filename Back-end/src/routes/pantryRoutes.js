import { Router } from "express";
import { and, asc, eq } from "drizzle-orm";
import { verifyToken } from "@clerk/backend";
import { pantryTable } from "../db/schema.js";
import { validatePantryItem } from "../services/pantryValidation.js";
import { createMealPlanRouter } from "./mealPlanRoutes.js";

export function createPantryRouter({ db, verifySession = verifyToken, env = process.env }) {
  const router = Router();

  router.use(async (req, res, next) => {
    const token = req.headers.authorization?.match(/^Bearer (\S+)$/i)?.[1];
    if (!token) return res.status(401).json({ message: "Sign in to use your pantry." });
    const secretKey = env.CLERK_SECRET_KEY;
    const jwtKey = env.CLERK_JWT_KEY?.replace(/\\n/g, "\n");
    if (!secretKey && !jwtKey) {
      return res.status(503).json({ message: "Pantry authentication is not configured on the server." });
    }
    try {
      const authorizedParties = env.CLERK_AUTHORIZED_PARTIES?.split(",").map(value => value.trim()).filter(Boolean);
      const payload = await verifySession(token, { secretKey, jwtKey, authorizedParties });
      if (!payload.sub || !payload.sid) throw new Error("Session required");
      req.pantryUserId = payload.sub;
      next();
    } catch {
      res.status(401).json({ message: "Your session has expired. Please sign in again." });
    }
  });

  router.get("/", async (req, res, next) => {
    try {
      const items = await db.select().from(pantryTable)
        .where(eq(pantryTable.userId, req.pantryUserId))
        .orderBy(asc(pantryTable.expiresOn), asc(pantryTable.name));
      res.json({ items });
    } catch (error) { next(error); }
  });

  router.use("/meal-plans", createMealPlanRouter({ db }));

  router.use("/:id", (req, res, next) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0 || id > 2147483647) {
      return res.status(400).json({ message: "Invalid pantry item." });
    }
    req.pantryItemId = id;
    next();
  });

  const saveItem = async (req, res, next) => {
    let item;
    try { item = validatePantryItem(req.body); }
    catch (error) { return res.status(400).json({ message: error.message }); }
    try {
      const rows = req.method === "POST"
        ? await db.insert(pantryTable).values({ ...item, userId: req.pantryUserId }).returning()
        : await db.update(pantryTable).set(item).where(and(
          eq(pantryTable.id, req.pantryItemId), eq(pantryTable.userId, req.pantryUserId)
        )).returning();
      if (!rows.length) return res.status(404).json({ message: "Pantry item not found." });
      res.status(req.method === "POST" ? 201 : 200).json({ item: rows[0] });
    } catch (error) { next(error); }
  };
  router.post("/", saveItem);
  router.put("/:id", saveItem);
  router.delete("/:id", async (req, res, next) => {
    try {
      const rows = await db.delete(pantryTable).where(and(
        eq(pantryTable.id, req.pantryItemId), eq(pantryTable.userId, req.pantryUserId)
      )).returning({ id: pantryTable.id });
      if (!rows.length) return res.status(404).json({ message: "Pantry item not found." });
      res.status(204).end();
    } catch (error) { next(error); }
  });
  router.use((error, req, res, next) => {
    console.error("Pantry request failed:", error.message);
    res.status(500).json({ message: "Your pantry could not be updated or loaded. Please try again." });
  });
  return router;
}
