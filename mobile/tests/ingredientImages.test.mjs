import test from 'node:test';
import assert from 'node:assert/strict';
import { ingredientImageNames, ingredientImageUrls, ingredientIllustration } from '../services/ingredientImages.js';
import { CURATED_RECIPES } from '../data/curatedRecipes.js';
test('all starter recipe ingredients have an image match or a specific illustration', () => {
  for (const recipe of CURATED_RECIPES) for (const ingredient of recipe.ingredients)
    assert.ok(ingredientImageUrls(ingredient).urls.length || ingredientIllustration(ingredient), ingredient.name);
});
test('matches preparation descriptions and preserves specific ingredient types', () => {
  assert.deepEqual(ingredientImageNames('fresh ginger, sliced'), ['Ginger']);
  assert.deepEqual(ingredientImageNames('300 g dried flat rice noodles'), ['Flat Rice Noodles']);
  assert.deepEqual(ingredientImageNames('beef sirloin steak'), ['Sirloin steak']);
  assert.deepEqual(ingredientImageNames('fresh coriander and basil'), ['Coriander', 'Basil']);
  assert.deepEqual(ingredientImageNames('fully cooked smoked pork sausage, sliced'), ['Sausages']);
  assert.deepEqual(ingredientImageNames('unknown mystery ingredient'), []);
});
test('retains provider photos with matched backup and rejects unsafe URL schemes', () => {
  assert.equal(ingredientImageUrls({ name: 'ginger', imageUrl: 'https://example.com/ginger.jpg' }).explicit, 'https://example.com/ginger.jpg');
  assert.equal(ingredientImageUrls({ name: 'ginger', imageUrl: 'javascript:alert(1)' }).explicit, null);
  assert.equal(ingredientIllustration('nori'), 'nori');
});
