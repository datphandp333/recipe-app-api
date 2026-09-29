const factors = { items: ["items", 1], g: ["g", 1], kg: ["g", 1000], ml: ["ml", 1], l: ["ml", 1000], tsp: ["tsp", 1], tbsp: ["tsp", 3], cups: ["tsp", 48] };
const normalize = name => String(name).trim().toLowerCase().replace(/\s+/g, " ");
const invalid = message => Object.assign(new Error(message), { status: 400 });

export function completionPreview(meal, pantry) {
  const rows = new Map();
  for (const ingredient of meal.ingredients) {
    for (const allocation of ingredient.allocations || []) {
      const existing = rows.get(allocation.pantryItemId);
      if (existing) { existing.plannedBase += allocation.quantity; continue; }
      const item = pantry.find(entry => entry.id === allocation.pantryItemId);
      const compatible = item && normalize(item.name) === normalize(ingredient.name) && factors[item.unit]?.[0] === allocation.unit;
      rows.set(allocation.pantryItemId, {
        pantryItemId: allocation.pantryItemId, name: item?.name || ingredient.name,
        unit: item?.unit || allocation.unit, plannedBase: allocation.quantity,
        available: compatible ? Number(item.quantity) : 0, missing: !compatible,
      });
    }
  }
  return [...rows.values()].map(({ plannedBase, ...item }) => ({ ...item,
    quantity: item.missing ? 0 : Math.min(item.available, Math.round(plannedBase / factors[item.unit][1] * 1000) / 1000),
  }));
}

export function validateCompletion(body) {
  if (!Array.isArray(body?.consumed) || body.consumed.length > 90) throw invalid("Review the pantry quantities before confirming.");
  const seen = new Set();
  const consumed = body.consumed.map(item => {
    if (!Number.isInteger(item?.pantryItemId) || item.pantryItemId <= 0 || seen.has(item.pantryItemId)) throw invalid("Invalid or duplicate pantry ingredient.");
    seen.add(item.pantryItemId);
    const quantity = item.quantity;
    if (typeof quantity !== "number" || !Number.isFinite(quantity) || quantity < 0 || quantity > 999999999.999 ||
        Math.abs(quantity * 1000 - Math.round(quantity * 1000)) > 0.0001) throw invalid("Use a nonnegative quantity with up to three decimal places.");
    if (typeof item.name !== "string" || !item.name.trim() || item.name.length > 100 || !Object.hasOwn(factors, item.unit)) throw invalid("Invalid pantry ingredient details.");
    return { pantryItemId: item.pantryItemId, name: item.name, unit: item.unit, quantity };
  });
  const feedback = body.feedback ?? "";
  if (typeof feedback !== "string" || feedback.length > 500) throw invalid("Keep feedback under 500 characters.");
  return { consumed, feedback: feedback.trim() };
}
