// Read-only coverage audit. Provider availability does not establish cultural authenticity.
import { writeFile } from 'node:fs/promises';
import { COUNTRIES, belongsToCountry, isCompleteMeal, normalizeSearch } from '../services/recipeCatalog.js';
import { CURATED_RECIPES } from '../data/curatedRecipes.js';
import { DISCOVERY_RECIPES } from '../data/discoveryRecipes.js';
let rateLimited = false;
const base = 'https://www.themealdb.com/api/json/v1/1/';
async function get(path) {
  if (rateLimited) throw new Error('Provider rate limit: remaining checks deferred');
  const response = await fetch(base + path, { signal: AbortSignal.timeout(12000) });
  if (response.status === 429) rateLimited = true;
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()).meals || [];
}
const areas = await get('list.php?a=list');
const supported = new Set(areas.map(meal => normalizeSearch(meal.strArea)));
const bundled = [...CURATED_RECIPES, ...DISCOVERY_RECIPES];
const rows = [];
let cursor = 0;
await Promise.all(Array.from({ length: 6 }, async () => {
  while (cursor < COUNTRIES.length) {
    const country = COUNTRIES[cursor++];
    const local = bundled.filter(recipe => recipe.countryId === country.id);
    const row = { id: country.id, name: country.name, editorialDish: country.dish,
      contextSource: country.sourceUrl, bundledRecipeIds: local.map(recipe => recipe.id),
      providerAreaSupported: supported.has(normalizeSearch(country.area)),
      culturalReview: 'Not reviewed by a cook from this community; source links are context, not endorsement.' };
    try {
      const matches = await get(`search.php?s=${encodeURIComponent(normalizeSearch(country.dish))}`);
      let meals = matches.filter(meal => belongsToCountry(meal, country) && isCompleteMeal(meal));
      if (!meals.length && row.providerAreaSupported && COUNTRIES.filter(item => item.area === country.area).length === 1) {
        const summaries = await get(`filter.php?a=${encodeURIComponent(country.area)}`);
        const details = await Promise.allSettled(summaries.slice(0, 6).map(meal => get(`lookup.php?i=${encodeURIComponent(meal.idMeal)}`)));
        meals = details.filter(item => item.status === 'fulfilled').flatMap(item => item.value).filter(meal => belongsToCountry(meal, country) && isCompleteMeal(meal));
        if (!meals.length && details.some(item => item.status === 'rejected')) throw new Error('Detail lookup unavailable');
      }
      row.providerRecipes = [...new Map(meals.map(meal => [meal.idMeal, { id: meal.idMeal, title: meal.strMeal }])).values()];
      row.coverage = local.length ? 'bundled' : row.providerRecipes.length ? 'provider' : 'gap';
    } catch (error) { row.coverage = local.length ? 'bundled' : 'unverified'; row.error = error.message; }
    rows.push(row);
  }
}));
rows.sort((a,b) => a.name.localeCompare(b.name));
const report = { checkedAt: new Date().toISOString(), scope: 'All implemented country/territory entries. Complete country-matched provider recipes, not authenticity certification.',
  summary: { entries: rows.length, bundledRecipes: bundled.length, ...Object.fromEntries(['bundled','provider','gap','unverified'].map(status => [status, rows.filter(row => row.coverage === status).length])) }, countries: rows };
await writeFile(new URL('../../docs/research/country-coverage-audit.json', import.meta.url), JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report.summary));
