import { Router } from "express";
import { and, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { mealPlansTable, pantryTable, cookingPreferencesTable } from "../db/schema.js";
import { DEFAULT_PREFERENCES, validatePreferences } from "../services/cookingPreferences.js";
import { generateMealPlan, pantryFingerprint, validatePlanOptions } from "../services/mealPlanService.js";
import { completionPreview, validateCompletion } from "../services/mealCompletionService.js";

// Mounted inside the authenticated pantry router. Never accept a client user ID.
export function createMealPlanRouter({ db, generate = generateMealPlan }) {
  const router = Router();
  const running = new Set();
  const pantryFor = userId => db.select().from(pantryTable).where(eq(pantryTable.userId, userId));
  const ownedPlan = req => and(eq(mealPlansTable.id, Number(req.params.id)), eq(mealPlansTable.userId, req.pantryUserId));
  const preferencesFor = async userId => {
    const [row] = await db.select().from(cookingPreferencesTable).where(eq(cookingPreferencesTable.userId, userId));
    return row?.preferences || { ...DEFAULT_PREFERENCES };
  };

  router.get("/preferences", async (req, res, next) => {
    try { res.json({ preferences: await preferencesFor(req.pantryUserId) }); }
    catch (error) { next(error); }
  });
  router.put("/preferences", async (req, res, next) => {
    try {
      const preferences = validatePreferences(req.body);
      await db.insert(cookingPreferencesTable).values({ userId: req.pantryUserId, preferences })
        .onConflictDoUpdate({ target: cookingPreferencesTable.userId, set: { preferences, updatedAt: new Date() } });
      res.json({ preferences });
    } catch (error) { next(error); }
  });

  router.get("/", async (req, res, next) => {
    try {
      const plans = await db.select().from(mealPlansTable)
        .where(and(eq(mealPlansTable.userId, req.pantryUserId), isNotNull(mealPlansTable.savedAt)))
        .orderBy(desc(mealPlansTable.savedAt)).limit(10);
      res.json({ plans });
    } catch (error) { next(error); }
  });

  router.post("/drafts", async (req, res, next) => {
    const userId = req.pantryUserId;
    if (running.has(userId)) return res.status(429).json({ message: "A plan is already being prepared. Please wait." });
    running.add(userId);
    try {
      const preferences = await preferencesFor(userId);
      const options = { ...validatePlanOptions({ ...req.body, servings: req.body?.servings ?? preferences.householdSize }), preferences };
      const pantry = await pantryFor(userId);
      const plan = await generate(pantry, options);
      const [draft] = await db.insert(mealPlansTable).values({ userId, plan, pantryFingerprint: pantryFingerprint(pantry) }).returning();
      res.status(201).json({ plan: draft });
    } catch (error) { next(error); }
    finally { running.delete(userId); }
  });

  router.param("id", (req, res, next, value) => {
    if (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 2147483647) {
      return res.status(400).json({ message: "Invalid meal plan." });
    }
    next();
  });

  router.post("/:id/save", async (req, res, next) => {
    try {
      const [draft] = await db.select().from(mealPlansTable).where(ownedPlan(req));
      if (!draft) return res.status(404).json({ message: "Meal plan not found." });
      if (draft.savedAt) return res.json({ plan: draft });
      if (draft.plan.preferences && JSON.stringify(validatePreferences(draft.plan.preferences)) !== JSON.stringify(validatePreferences(await preferencesFor(req.pantryUserId)))) {
        return res.status(409).json({ message: "Your cooking preferences changed. Generate a new plan before saving." });
      }
      validatePlanOptions({ ...draft.plan, startDate: req.body?.startDate });
      if (req.body.startDate !== draft.plan.startDate || pantryFingerprint(await pantryFor(req.pantryUserId)) !== draft.pantryFingerprint) {
        return res.status(409).json({ message: "Your pantry or the planning date changed. Generate a new plan before saving." });
      }
      const [saved] = await db.update(mealPlansTable).set({ savedAt: new Date() })
        .where(and(ownedPlan(req), isNull(mealPlansTable.savedAt))).returning();
      // Concurrent saves are idempotent; return the already-saved record.
      const [current] = saved ? [saved] : await db.select().from(mealPlansTable).where(ownedPlan(req));
      res.json({ plan: current });
    } catch (error) { next(error); }
  });

  router.param("day", (req, res, next, value) => {
    if (!/^[1-3]$/.test(value)) return res.status(400).json({ message: "Choose a valid dinner." });
    next();
  });

  router.get("/:id/meals/:day/completion", async (req, res, next) => {
    try {
      const [record] = await db.select().from(mealPlansTable).where(ownedPlan(req));
      if (!record) return res.status(404).json({ message: "Meal plan not found." });
      if (!record.savedAt) return res.status(400).json({ message: "Save your plan before marking a dinner cooked." });
      const meal = record.plan.meals.find(item => item.day === Number(req.params.day));
      if (!meal) return res.status(404).json({ message: "Dinner not found." });
      res.json({ completion: record.cookedMeals?.[req.params.day] || null,
        ingredients: completionPreview(meal, await pantryFor(req.pantryUserId)) });
    } catch (error) { next(error); }
  });

  router.post("/:id/meals/:day/completion", async (req, res, next) => {
    try {
      const { consumed, feedback } = validateCompletion(req.body);
      // One database function performs all validation and mutations atomically.
      await db.execute(sql`SELECT complete_pantry_meal(${req.pantryUserId}, ${Number(req.params.id)}, ${Number(req.params.day)}, ${JSON.stringify(consumed)}::jsonb, ${feedback})`);
      const [record] = await db.select().from(mealPlansTable).where(ownedPlan(req));
      res.json({ plan: record });
    } catch (error) {
      const code = error.cause?.code || error.code;
      if (code === "P0002") return res.status(404).json({ message: "Saved dinner not found." });
      if (code === "P0001") return res.status(409).json({ message: "Pantry ingredients changed or a quantity is too high. Cancel and reopen ‘I cooked this’ to review current amounts." });
      next(error);
    }
  });

  router.use((error, req, res, next) => {
    const status = [400, 429, 502, 503, 504].includes(error.status) ? error.status : 500;
    // Do not return upstream provider messages or database queries to clients.
    const message = status === 500 ? "The meal plan could not be loaded or saved. Please try again."
      : error.code === "GEMINI_NOT_CONFIGURED" ? "Meal planning is not configured. Add the Gemini API key on the server."
      : status === 503 ? "Gemini is temporarily unavailable. Please try again in a moment."
      : status === 429 ? "The planner is busy or has reached its usage limit. Please try again later."
      : error.message;
    res.status(status).json({ message });
  });
  return router;
}
