# Home page proposal: “A world of flavor. Made in your kitchen.”

Research date: September 30, 2026. This is a design and content proposal; application behavior has not been changed.

[Open the interactive concept](homepage-concept.html) · [Read all 195 country/dish entries and sources](country-dish-catalog.md) · [Download the planning CSV](country-dish-catalog.csv)

## Recommendation

Give the home page one clear promise: discover a dish worth cooking, then make it work for your kitchen. Keep the existing cream, green, and coral palette. Replace the large introductory block and random recommendations with a compact food-led introduction, visible search, a curated country collection, and one clear invitation to chat with Recipe Chef.

Recommended slogan: **A world of flavor. Made in your kitchen.**

Supporting sentence: **Explore iconic dishes, find your next favorite, and make it yours with Recipe Chef.**

Alternatives:

- “Your next favorite starts here.” — shorter and more focused on everyday discovery.
- “Big flavors. Your kitchen.” — more playful and compact.
- “What will you cook next?” — useful as a search prompt, but less distinctive as a brand promise.

These are original copy proposals, not tested conversion claims or cleared trademarks.

## What the current code does

- `mobile/app/(taps)/index.jsx` loads 12 random meals and another random featured meal, plus categories. This produces 14 upstream requests for the initial content load.
- The grid says “Made for you,” but selection does not use the user's preferences.
- The page places the greeting, a large decorative hero, and two shortcuts before the first recipe photograph.
- The heart displayed on a recipe tile has no separate save action; tapping the tile opens recipe details.
- `mobile/services/mealAPI.js` assigns every MealDB recipe a cooking time of “30 min” and four servings. These are defaults, not verified recipe metadata. Do not use those defaults to power “Under 30 minutes” filters or promise a cooking time.
- Recipe details currently look up a MealDB ID directly. A genuinely independent primary catalog needs recipe-detail support as well as home-page changes.

## Proposed order on mobile

1. **Compact greeting and identity.** Keep the personal greeting small.
2. **Slogan and search.** A short promise followed immediately by “Search dishes, ingredients, or countries.”
3. **One editorial hero.** A real, dish-matched photograph; dish name; country; a short reason to try it; “View recipe.” Rotate a reviewed selection on a schedule instead of refreshing it randomly.
4. **Explore by country.** Show five or six country chips and an “All countries” control opening a searchable picker. Selecting a country changes the collection below without reloading the whole page. Do not place 195 chips on the initial screen.
5. **Iconic dishes around the world.** Show six to eight reviewed recipes initially. Each card has its dish name, country, actual recipe photo, and a working save control. Include time and difficulty only where verified.
6. **Make it yours with Recipe Chef.** “Have ingredients or a craving? Let's work out dinner together.” CTA: “Chat with Chef.”
7. **Useful return-visit content.** Recently saved recipes or “Continue cooking,” when genuine user activity exists.

Keep My Cookbook in the existing navigation. Avoid adding another large promotional card for a destination already one tap away. Respect reduced-motion settings and maintain readable text over imagery. A photograph should illustrate the exact dish; a generic food photo is not evidence of what the recipe produces.

## Why this direction

NN/g's homepage guidance recommends a brief tagline that explains the site's purpose and gives priority to a small number of useful tasks. That supports pairing the slogan with explicit recipe-discovery copy and visible search, instead of relying on an abstract slogan alone. [NN/g homepage guidelines](https://www.nngroup.com/articles/113-design-guidelines-homepage-usability/)

Nielsen Norman Group's search guidance emphasizes helping users find and explore relevant content through search, categories, and filters. Applying that to this app supports visible search and a searchable country picker. This is a design inference, not evidence that this particular screen will improve conversion. [NN/g search and filtering overview](https://www.nngroup.com/reports/ecommerce-ux-search-including-faceted-search/)

Good Food's popular dinner collection explicitly uses its own website statistics and community ratings. That is a useful distinction: measured audience popularity needs a defined audience and a measurement method. [Good Food's popular dinner collection](https://tollbit.bbcgoodfood.com/howto/guide/most-popular-dinner-recipes)

## What “popular” should mean

Use **Iconic dishes around the world** for the researched launch catalog. National dishes, regional specialties, and widely recognized classics are useful editorial selections, but they are not a comparable worldwide ranking of what people cook or order most.

Later introduce **Popular with our cooks**, based on unique saves and completed cooks over a stated period, with a minimum activity threshold. Country-filtered rankings should mean activity on recipes associated with that country, not inferred user nationality. Show an editorial collection when there is insufficient activity. Avoid fake ratings, fabricated “trending” badges, and ranking by raw API result order.

Several dishes are shared across countries. Associate each catalog entry with a particular local version and explain that association without claiming exclusive origin.

## MealDB findings and fallback design

The live area endpoint returned **195 country/territory entries** on the research date. This is an inventory of labels, not proof that every country has recipes or that a selected iconic dish is present. The API's documentation describes search, lookup, random selection, and area filtering; it does not document a country-level popularity endpoint. [Live country/area list](https://www.themealdb.com/api/json/v1/1/list.php?a=list), [API documentation](https://www.themealdb.com/api.php)

There are duplicate area labels: “Dominican” covers both Dominica and the Dominican Republic; “Channel Islander” covers Guernsey and Jersey; “Congolese” covers both Congo entries. Use internal country identifiers and explicit editorial mappings. An area-label match alone cannot distinguish those cases.

Recommended architecture:

1. **Primary: our curated catalog.** Store stable internal recipe and country IDs, local names, concise original descriptions, editorial ordering, complete reviewed recipes, dish-matched image rights/attribution, source links, and review dates. Store measured popularity separately from editorial priority.
2. **First fallback: last successfully loaded catalog.** Cache the home collection so an outage does not immediately change what users see.
3. **Second fallback: explicitly mapped MealDB recipes.** Search or map reviewed IDs ahead of time, then retrieve matching recipe details as needed. Use country-compatible replacements, deduplicate them, and label the section “More recipes to explore” if it no longer represents the curated selection.
4. **No match: honest empty state.** Offer another country, search, or a conversation with Chef. Do not substitute an unrelated random dish under a country label. Any AI adaptation should be identified as an adaptation and should not be promoted as a reviewed traditional recipe automatically.

A curated list of MealDB IDs would improve discovery quickly, but MealDB would still be the primary recipe provider. To make it a real backup, the primary collection must contain its own usable recipe content and images. Research links establish cultural relevance; they do not grant permission to copy recipe wording or photographs.

The current test API key is documented for development/education; a public app-store release requires supporter access under the API's published guidance. [MealDB API access](https://www.themealdb.com/api.php)

## Proposed delivery sequence

- First: agree on the screen layout, wording, and initial featured dishes using the accompanying concept preview.
- Next: review a small set of complete recipes and matched photos for launch, while retaining every country in the content roadmap.
- Then: implement the primary catalog, cache/fallback handling, country picker, and recipe-detail integration together.
- Finally: add activity measurement and only then introduce genuine popularity labels.

Measure home-to-recipe opens, saves per recipe view, completed cooks, use of Chef, and fallback/error rates. Compare a curated collection with the current random baseline; do not assume a slogan alone will improve retention.

The accompanying catalog lists one researched starter candidate per API entry. It is a content roadmap, not 195 finished recipes, and its row order is alphabetical rather than a popularity ranking.
