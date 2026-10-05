import { INGREDIENT_NAMES } from "../data/ingredientNames.js";
const normalize = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[-_]/g, " ").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const catalog = new Map(INGREDIENT_NAMES.map(name => [normalize(name), name]));
const aliases = {
  'nori': 'Nori', 'fully cooked smoked pork sausage': 'Sausages',
  'neutral oil': 'Vegetable Oil', 'plain flour': 'Plain Flour', 'flour': 'Plain Flour',
  'pizza dough': 'Pizza Dough', 'plain yogurt': 'Yogurt', 'yoghurt': 'Yogurt',
  'short grain sushi rice': 'Sushi Rice', 'ground beef': 'Ground Beef',
  'ground cinnamon': 'Cinnamon', 'cinnamon stick': 'Cinnamon', 'cinnamon sticks': 'Cinnamon',
  'ground turmeric': 'Turmeric', 'ground cumin': 'Cumin', 'ground ginger': 'Ground Ginger',
  'low sodium stock': 'Vegetable Stock', 'grated hard cheese': 'Parmesan',
  'fresh coriander and basil': ['Coriander', 'Basil'], 'fresh mint and coriander': ['Mint', 'Coriander'],
  'smoked pork sausage': 'Sausages', 'black beans': 'Black Beans',
};
const candidates = [...catalog.entries()].sort((a, b) => b[0].length - a[0].length);
export function ingredientImageNames(value) {
  const raw = typeof value === 'string' ? value : value?.name || value?.label || '';
  const name = normalize(raw.split(',')[0]);
  if (aliases[name]) return [aliases[name]].flat();
  if (catalog.has(name)) return [catalog.get(name)];
  const padded = ` ${name} `;
  const alias = Object.keys(aliases).sort((a, b) => b.length - a.length).find(key => padded.includes(` ${key} `));
  if (alias) return [aliases[alias]].flat();
  // Longest complete ingredient phrase wins; never match 'ham' inside 'champignon'.
  const match = candidates.find(([key]) => key.length > 2 && (padded.includes(` ${key} `) || padded.includes(` ${key}s `)));
  return match ? [match[1]] : [];
}
export function ingredientIllustration(ingredient) {
  const names = ingredientImageNames(ingredient);
  return names.includes("Nori") ? "nori" : names.includes("Pizza Dough") ? "dough" : null;
}
export function ingredientImageUrls(ingredient) {
  const explicit = typeof ingredient === 'object' && (ingredient?.imageUrl || ingredient?.image);
  const urls = ingredientImageNames(ingredient).filter(name => !["Nori", "Pizza Dough"].includes(name)).map(name => `https://www.themealdb.com/images/ingredients/${encodeURIComponent(name.replace(/ /g, '_'))}.png`);
  return { explicit: typeof explicit === 'string' && /^https?:\/\//i.test(explicit) ? explicit : null, urls };
}
