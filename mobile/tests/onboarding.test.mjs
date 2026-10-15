import test from 'node:test';
import assert from 'node:assert/strict';
import { BUNDLED_RECIPES } from '../services/recipeCatalog.js';
import { onboardingPicks } from '../services/onboarding.js';
test('quick recommendations honor total time, including chill time', () => {
 const picks=onboardingPicks('quick',['rice']);
 assert.equal(picks.length,3);
 assert.ok(picks.every(({recipe})=>recipe.totalTime<=30));
 assert.ok(!picks.some(({recipe})=>recipe.id==='discover-coffee-tiramisu'));
});
test('ingredient answers change the ranking and match only actual ingredient forms', () => {
 const pasta=onboardingPicks('pantry',['pasta']);
 assert.ok(pasta[0].matched.includes('pasta'));
 const chicken=onboardingPicks('pantry',['chicken']);
 assert.ok(chicken[0].matched.includes('chicken'));
 const fixtures=[{id:'sauce',totalTime:15,ingredients:[{name:'fish sauce'},{name:'chicken stock'},{name:'rice vinegar'}],instructions:['Cook']},
 {id:'food',totalTime:20,ingredients:[{name:'rice'},{name:'chicken thighs'},{name:'salmon'}],instructions:['Cook']}];
 assert.deepEqual(onboardingPicks('pantry',['fish','rice','chicken'],fixtures).map(({recipe,matched})=>[recipe.id,matched]),[['food',['fish','rice','chicken']],['sauce',[]]]);
});
test('world recommendations provide different countries and use real readable recipes', () => {
 const picks=onboardingPicks('world',['rice']);
 assert.equal(new Set(picks.map(({recipe})=>recipe.countryId)).size,3);
 for(const {recipe} of picks)assert.ok(BUNDLED_RECIPES.includes(recipe)&&recipe.ingredients.length&&recipe.instructions.length&&recipe.adaptationNote);
});
test('empty answers, unknown ingredients and retries do not mutate the catalog or selections', () => {
 const before=JSON.stringify(BUNDLED_RECIPES);const selected=['rice','rice','not-real'];
 const first=onboardingPicks('pantry',selected);const second=onboardingPicks('pantry',selected);
 assert.deepEqual(first,second);assert.deepEqual(selected,['rice','rice','not-real']);
 assert.ok(first.every(({matched})=>matched.length<=1));
 assert.equal(onboardingPicks('pantry',[]).length,3);assert.equal(JSON.stringify(BUNDLED_RECIPES),before);
});
