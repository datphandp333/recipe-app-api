import test from 'node:test';
import assert from 'node:assert/strict';
import { DISCOVERY_RECIPES } from '../data/discoveryRecipes.js';
import { DISCOVERY_CATALOG, filterDiscovery, searchMoreRecipes } from '../services/discoveryCatalog.js';
import { createRecipeCatalog, favoritePayload } from '../services/recipeCatalog.js';

test('discovery dishes have complete offline recipes and traceable photo credits', async () => {
  const never = () => assert.fail('Bundled recipe must not call a provider');
  const catalog = createRecipeCatalog({ searchMeals:never,filterByArea:never,getMeal:never,transformMeal:never });
  assert.equal(DISCOVERY_CATALOG.length,26);
  assert.equal(new Set(DISCOVERY_CATALOG.map(recipe=>recipe.id)).size,26);
  for(const recipe of DISCOVERY_RECIPES){
    assert.equal((await catalog.getRecipe(recipe.id)).id,recipe.id);
    assert.ok(recipe.ingredients.length && recipe.instructions.length && recipe.totalTime>0);
    assert.ok(recipe.imageCredit && recipe.imageSourceUrl && recipe.imageLicenseUrl);
    assert.match(recipe.recipeNote,/home adaptation/);
    const payload=favoritePayload(recipe,'test-user');
    assert.equal(payload.recipeId,recipe.id);assert.deepEqual(payload.instructions,recipe.instructions);
  }
});
test('chef collection has source-backed inspiration; quick filter includes all elapsed time', () => {
  const chefs=filterDiscovery('','chef');assert.equal(chefs.length,3);
  for(const recipe of chefs)assert.match(recipe.inspiration.url,/^https:\/\/guide\.michelin\.com\//);
  assert.deepEqual(filterDiscovery('mushroom parmesan').map(recipe=>recipe.id),['discover-parmesan-risotto']);
  assert.equal(filterDiscovery('PHO')[0].id,'curated-beef-pho');
  assert.ok(filterDiscovery('','quick').every(recipe=>recipe.totalTime<=30));
  assert.equal(filterDiscovery('tiramisu','quick').length,0);
  assert.equal(filterDiscovery('','sweet')[0].id,'discover-coffee-tiramisu');
  assert.equal(filterDiscovery('','world').length,20);
  assert.equal(filterDiscovery('Le George','chef')[0].id,'discover-parmesan-risotto');
});
test('wider search is explicit, hydrates ingredients, deduplicates, and drops incomplete recipes', async () => {
  const meal = { idMeal:'123',strMeal:'Soup',strInstructions:'Cook.',strIngredient1:'Rice' };
  const api = { searchMealsByName:async()=>[],filterByIngredient:async()=>[{idMeal:'123'},{idMeal:'123'},{idMeal:'456'}],
    getMealById:async id=>id==='123'?meal:{...meal,idMeal:id,strInstructions:''},transformMealData:raw=>({id:raw.idMeal,title:raw.strMeal}) };
  assert.deepEqual(await searchMoreRecipes('rice',api),[{id:'123',title:'Soup'}]);
  assert.deepEqual(await searchMoreRecipes('x',{searchMealsByName:()=>assert.fail()}),[]);
  await assert.rejects(searchMoreRecipes('rice',{...api,getMealById:async()=>{throw new Error('Offline');}}),/could not be loaded/);
});

test('Cambodian recipes appear in discovery with explicitly labeled adaptations', () => {
  for (const query of ['Cambodia', 'Cambodian', 'amok', 'lok lak', 'num banh chok']) {
    const results = filterDiscovery(query);
    assert.ok(results.length, query);
    assert.ok(results.every(recipe => recipe.countryId === 'cambodia'));
  }
});
