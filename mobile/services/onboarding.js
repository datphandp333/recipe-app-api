import { BUNDLED_RECIPES } from './recipeCatalog.js';
export const ONBOARDING_GOALS = [
  { id: 'quick', icon: 'time-outline', title: 'Make dinner faster', detail: 'Start with recipes taking 30 minutes or less.' },
  { id: 'pantry', icon: 'basket-outline', title: 'Use what I have', detail: 'Find inspiration around familiar ingredients.' },
  { id: 'world', icon: 'globe-outline', title: 'Try something new', detail: 'Explore dishes from different places.' },
];
export const ONBOARDING_INGREDIENTS = [
  { id: 'rice', label: 'Rice' }, { id: 'chicken', label: 'Chicken' },
  { id: 'tomato', label: 'Tomatoes' }, { id: 'pasta', label: 'Pasta' },
  { id: 'fish', label: 'Fish' }, { id: 'potato', label: 'Potatoes' },
  { id: 'beans', label: 'Beans' }, { id: 'mushroom', label: 'Mushrooms' },
];
const matches = (id, value) => {
  const name = String(value || '').toLowerCase();
  switch (id) {
    case 'rice': return /\brice\b/.test(name) && !/vinegar|wine|noodles|flour/.test(name);
    case 'chicken': return /\bchicken\b/.test(name) && !/stock|broth/.test(name);
    case 'tomato': return /\btomato(?:es)?\b/.test(name);
    case 'pasta': return /\bpasta\b|\bspaghetti\b/.test(name);
    case 'fish': return /\bfish\b|\bsalmon\b|\btrout\b|\bcod\b/.test(name) && !/sauce|stock|broth/.test(name);
    case 'potato': return /\bpotato(?:es)?\b/.test(name);
    case 'beans': return /\bbeans\b/.test(name);
    case 'mushroom': return /\bmushrooms?\b/.test(name);
    default: return false;
  }
};
// Local, deterministic recommendations. No AI requests, inventory writes, or account preferences.
export function onboardingPicks(goal, selected = [], catalog = BUNDLED_RECIPES) {
  const allowed = new Set(ONBOARDING_INGREDIENTS.map(item => item.id));
  const ids = [...new Set(selected)].filter(id => allowed.has(id));
  const ranked = catalog.filter(recipe => recipe.ingredients?.length && recipe.instructions?.length
    && (goal !== 'quick' || (Number.isFinite(recipe.totalTime) && recipe.totalTime <= 30)))
    .map((recipe, index) => ({ recipe, index, matched: ids.filter(id => recipe.ingredients.some(item => matches(id, typeof item === 'string' ? item : item.name))) }))
    .sort((a, b) => b.matched.length - a.matched.length || (goal === 'quick' ? a.recipe.totalTime - b.recipe.totalTime : a.index - b.index));
  if (goal !== 'world') return ranked.slice(0, 3);
  const countries = new Set();
  const diverse = ranked.filter(item => {
    if (countries.has(item.recipe.countryId)) return false;
    countries.add(item.recipe.countryId); return true;
  });
  return [...diverse, ...ranked.filter(item => !diverse.includes(item))].slice(0, 3);
}
