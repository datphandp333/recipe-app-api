export const DEFAULT_PREFERENCES = { householdSize: 2, spiceLevel: "any", dislikedIngredients: [], notes: "" };

export function validatePreferences(body) {
  const fail = () => { throw Object.assign(new Error("Choose 1–8 people, a valid spice level, up to 20 disliked ingredients, and notes under 500 characters."), { status: 400 }); };
  if (!body || !Number.isInteger(body.householdSize) || body.householdSize < 1 || body.householdSize > 8 ||
      !["any", "none", "mild", "medium", "hot"].includes(body.spiceLevel) ||
      !Array.isArray(body.dislikedIngredients) || body.dislikedIngredients.length > 20 ||
      typeof body.notes !== "string" || body.notes.length > 500) fail();
  const names = body.dislikedIngredients.map(name => {
    if (typeof name !== "string" || !name.trim() || name.length > 60) fail();
    return name.trim().toLowerCase().replace(/\s+/g, " ");
  });
  return { householdSize: body.householdSize, spiceLevel: body.spiceLevel,
    dislikedIngredients: [...new Set(names)].sort(), notes: body.notes.trim() };
}

export function isDisliked(name, preferences) {
  const normalize = value => String(value).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim()
    .split(" ").map(word => word.length > 3 && word.endsWith("s") && !word.endsWith("ss") ? word.slice(0, -1) : word).join(" ");
  const words = normalize(name);
  return preferences.dislikedIngredients.some(dislike => {
    const phrase = normalize(dislike);
    // Olives and olive oil are separate taste preferences. Remove only the oil
    // phrase so a mixed ingredient such as "olives in olive oil" still matches.
    const candidate = phrase === "olive" ? words.replace(/\bolive oil\b/g, " ") : words;
    return Boolean(phrase && ` ${candidate} `.includes(` ${phrase} `));
  });
}
