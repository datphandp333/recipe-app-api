export const PANTRY_UNITS = ["items", "g", "kg", "ml", "l", "cups", "tbsp", "tsp"];

export function validatePantryItem(body = {}) {
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const quantity = typeof body?.quantity === "number" || typeof body?.quantity === "string"
    ? Number(body.quantity) : NaN;
  const unit = body?.unit;
  const expiresOn = body?.expiresOn === "" ? null : body?.expiresOn ?? null;
  if (!name || name.length > 100) throw new Error("Enter an ingredient name (up to 100 characters).");
  if (!Number.isFinite(quantity) || quantity < 0.001 || quantity > 999999999.999 ||
      Math.abs(quantity * 1000 - Math.round(quantity * 1000)) > 0.0001) {
    throw new Error("Enter a positive quantity with up to three decimal places.");
  }
  if (!PANTRY_UNITS.includes(unit)) throw new Error("Choose a supported unit.");
  if (expiresOn !== null) {
    const date = new Date(`${expiresOn}T00:00:00.000Z`);
    if (typeof expiresOn !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(expiresOn) ||
        !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== expiresOn) {
      throw new Error("Enter a real expiry date as YYYY-MM-DD, or leave it blank.");
    }
  }
  return { name, quantity: String(quantity), unit, expiresOn };
}
