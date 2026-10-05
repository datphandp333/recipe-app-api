export const normalize = (value = "") => String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

// Compare calendar dates rather than elapsed hours (including across DST changes).
export function expiryInfo(value, now = new Date()) {
  if (!value) return { group: "undated", label: "No date added", days: null };
  const date = String(value).slice(0, 10);
  const timestamp = Date.parse(`${date}T00:00:00Z`);
  if (!Number.isFinite(timestamp)) return { group: "undated", label: "No date added", days: null };
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((timestamp - today) / 86400000);
  if (days < 0) return { group: "past", label: `Past date · ${date}`, days };
  if (days === 0) return { group: "soon", label: "Date is today", days };
  if (days <= 3) return { group: "soon", label: `${days} day${days === 1 ? "" : "s"} left`, days };
  return { group: "later", label: `Dated ${date}`, days };
}
export function pantryList(items, query, filter, now = new Date()) {
  return items.filter(item => normalize(item.name).includes(normalize(query)) &&
    (filter === "all" || expiryInfo(item.expiresOn, now).group === filter))
    .sort((a, b) => (a.expiresOn || "9999").localeCompare(b.expiresOn || "9999") || a.name.localeCompare(b.name));
}
export function cookbookList(recipes, query, sort) {
  const term = normalize(query);
  const result = recipes.filter(recipe => normalize([
    recipe.title, recipe.personalNote,
    ...(Array.isArray(recipe.ingredients) ? recipe.ingredients : []).map(item => typeof item === "string" ? item : item.name || item.label || ""),
  ].join(" ")).includes(term));
  return result.sort(sort === "az" ? (a, b) => a.title.localeCompare(b.title)
    : (a, b) => (Date.parse(b.createdAt) || Number(b.id) || 0) - (Date.parse(a.createdAt) || Number(a.id) || 0));
}
