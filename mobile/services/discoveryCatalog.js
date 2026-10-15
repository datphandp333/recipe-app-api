import { DISCOVERY_RECIPES } from '../data/discoveryRecipes.js';
import { CURATED_RECIPES, normalizeSearch, isCompleteMeal } from './recipeCatalog.js';
export const DISCOVERY_COLLECTIONS = [
  { id: 'all', label: 'All picks' }, { id: 'chef', label: 'Chef inspiration' },
  { id: 'quick', label: '30 minutes' }, { id: 'world', label: 'World favorites' },
  { id: 'sweet', label: 'Sweet finishes' },
];
export const DISCOVERY_CATALOG = [...DISCOVERY_RECIPES, ...CURATED_RECIPES];
export const FEATURED_DISH = DISCOVERY_RECIPES[0];
export function filterDiscovery(query = '', collection = 'all', recipes = DISCOVERY_CATALOG) {
  const terms = normalizeSearch(query).split(/\s+/).filter(Boolean);
  return recipes.filter(recipe => {
    const haystack = normalizeSearch([recipe.title, recipe.description, recipe.country, recipe.cuisine,
      recipe.category, recipe.inspiration?.publisher, recipe.inspiration?.restaurant,
      ...(recipe.ingredients || []).map(item => typeof item === 'string' ? item : item.name)].join(' '));
    if (!terms.every(term => haystack.includes(term))) return false;
    if (collection === 'chef') return Boolean(recipe.inspiration?.url);
    if (collection === 'quick') return Number.isFinite(recipe.totalTime) && recipe.totalTime <= 30;
    if (collection === 'world') return CURATED_RECIPES.some(item => item.id === recipe.id);
    if (collection === 'sweet') return recipe.category === 'Dessert';
    return true;
  });
}
export async function searchMoreRecipes(query, api) {
  const term = query.trim();
  if (term.length < 2) return [];
  let meals = (await api.searchMealsByName(term)).filter(isCompleteMeal);
  if (!meals.length) {
    const summaries = await api.filterByIngredient(term);
    const hydrated = await Promise.allSettled(summaries.slice(0, 8).map(meal => api.getMealById(meal.idMeal)));
    meals = hydrated.filter(result => result.status === 'fulfilled').map(result => result.value).filter(isCompleteMeal);
    if (!meals.length && hydrated.some(result => result.status === 'rejected')) throw new Error('Some recipes could not be loaded. Please try again.');
  }
  return [...new Map(meals.map(meal => [String(meal.idMeal), meal])).values()].slice(0, 8).map(api.transformMealData).filter(Boolean);
}
