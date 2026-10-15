# Country catalog audit — October 14, 2026

Scope: all 195 implemented country/territory entries and all 26 bundled recipes. This is a technical coverage and desk editorial review, not a certification of authenticity, popularity, exclusive origin, or endorsement by the linked cooks. None of the app’s original recipes has been kitchen-tested or reviewed by a representative cook from each community.

## Findings and fixes

- Cambodia had no bundled recipes. Both the live `fish amok` search and `Cambodian` area filter returned empty arrays. Three original, labeled home adaptations now work offline: fish amok, beef lok lak, and num banh chok.
- Discovery recipes were excluded from country collections. France therefore missed its two available local recipes. Home and country collections now share all 26 bundled recipes. Search continues to include the same recipes.
- All bundled recipes now have visible adaptation labels, specific adaptation notes, and a context source link. Notes are retained in cookbook payloads. The Japan vegetable maki recipe is now labeled Japanese-inspired; honey-soy salmon already had that label. Paella is explicitly a vegetable adaptation, not paella valenciana. Biryani’s note recognizes regional traditions across South Asia.
- Three discovery entries lacked context sources; added Italian tourism context for tiramisu and garlic pasta, and Japanese cook Nami’s Just One Cookbook teriyaki page as background for the explicitly Japanese-inspired salmon. Replaced the failing phở context URL with Vietnam Tourism’s story of phở.
- Country UI describes one dish to explore, recognizes that dishes can be shared across cultures, and states coverage varies. It links the editorial dish’s context source even when no complete recipe can be loaded. A missing recipe is described as a catalog gap.
- Existing country isolation rejects mismatched or incomplete provider data, including ambiguous shared area labels. No other country’s dish is substituted to fill a gap.

## Cambodian context and attribution

| Adaptation | Cambodian cook’s context page | Differences disclosed |
| --- | --- | --- |
| Fish amok | [Chef Nak / Rotanak Ros](https://www.chefnak.com/cambodian-fish-amok) | Prepared Cambodian kroeung; spinach instead of noni; ramekins instead of banana-leaf cups; steamed egg mixture retained |
| Beef lok lak | [Chef Channy Chhi Laux / Angkor Chef](https://angkorchef.com/steak-and-salad/) | Supermarket seasoning interpretation; Kampot pepper preferred; variations acknowledged |
| Num banh chok | [Thida Koeut / Thida’s Kitchen](https://thidaskitchen.com/nom-banh-chok/) | Dried rather than fresh fermented noodles; fish sauce instead of prahok changes flavor; simplified vegetable selection |

The app links to the cooks’ own pages; it does not reproduce their full recipes or claim permission, collaboration, testing, or endorsement. These links provide a path to learn the traditional preparation rather than presenting Simmerli’s adaptations as definitive recipes. New photos have separate creator/license credits in [cambodia-photo-credits.json](cambodia-photo-credits.json). Downloaded images are unedited and displayed cropped to fit; CC BY-SA display derivatives retain the stated photo license.

## Worldwide availability results

The [machine-readable audit](country-coverage-audit.json) records all 195 entries, their context URLs, local IDs, and provider results/errors. At this check:

- 13 country collections have bundled recipes (26 recipes total).
- 12 additional collections returned complete, country-matched provider recipes.
- 40 additional collections returned no complete match.
- 130 collections remain unverified because the provider returned HTTP 429 rate limits. A rate limit does **not** establish missing coverage. Provider error details are retained in the report, including errors for some countries already covered locally.

Every country entry has a named editorial dish and an HTTPS source. The 195 recorded context sources have not all been independently revalidated in this turn, and cultural review remains outstanding. Research sources establish an association to investigate, not exclusive ownership or an authoritative national/popularity ranking. The source corpus remains in [country-dish-catalog.md](country-dish-catalog.md).

The read-only audit can be rerun after the provider cooldown:

```sh
node mobile/scripts/audit-country-catalog.mjs
```

The script stops making new provider calls after a rate limit; remaining rows are unverified. Do not use the output as a publish-ready cultural approval list.

## Validation

Catalog tests cover all 195 identities/context links; all bundled recipe country routes; Cambodia and France offline; discovery search; source/adaptation metadata; cookbook note preservation; ambiguous countries; partial failures; deduplication; and incomplete provider data. Ingredient image tests include a labeled kroeung illustration rather than substituting another cuisine’s curry paste photo.

Validation completed: 26 catalog/discovery/ingredient/navigation/kitchen-list tests passed; changed-file ESLint passed; iOS Expo export passed. A browser harness rendering the actual screens with mocked auth/API verified Cambodia country selection shows all three entries, Search finds all three, recipe details show cook attribution, and the back button clears the simulated safe area. This is not a physical iPhone test.


## Follow-up: Afghanistan, Andorra, Belize, and remaining gaps

Added nine original, explicitly labeled, untested home adaptations (three for each requested country):

| Country | Dishes | Credited culinary context |
| --- | --- | --- |
| Afghanistan | Kabuli pulao, potato bolani, mantu | Mirriam Seddiq / Afghan Cooks: [pulao](https://afghancooks.com/kabuli-pulao-recipe/), [bolani](https://afghancooks.com/bolani-recipe-hot-pockets/), [mantu](https://afghancooks.com/mantu-recipe-afghan-dumpling/) |
| Andorra | Escudella, trinxat amb rosta, trout | Visit Andorra’s recipe collection: [escudella](https://visitandorra.com/fr/gastronomie/recettes-dandorre/escudella.html/), [trinxat](https://visitandorra.com/en/gastronomy/andorran-recipes/trinxat-amb-rosta-cabbage-potato-and-pork-crackling/), [trout](https://visitandorra.com/es/gastronomia/recetas-de-andorra/trucha-de-rio-a-la-andorrana/) |
| Belize | Rice and beans, stew chicken, fry jacks | [Belize Tourism Board cuisine](https://www.travelbelize.org/cuisine/), [My Beautiful Belize stew chicken](https://mybeautifulbelize.com/perfect-pairing-rice-beans-stewed-chicken/), [Belize Tourism Board fry jacks](https://www.travelbelize.org/es/blog/how-to-make-a-belizean-breakfast-favourite-fry-jacks/) |

The recipes are Simmerli’s own home interpretations, not transcriptions or endorsed versions of the linked authors’ recipes. Adaptation notes identify shortcuts (purchased mantu wrappers, reduced escudella meat selection, canned beans, trout fillets) and shared regional traditions. Eight licensed photos are bundled; no verified trout photo was available, so that recipe uses the normal photo fallback. The rice-and-beans and chicken cards share a credited serving-plate photograph including both components and accompaniments. [Photo credits](country-expansion-photo-credits.json).

For all 195 countries/territories, an existing dish/context record can now appear as a source preview in Home and Search when complete recipes are absent. Previews have no invented ingredients, instructions, prep times, saving action, or fake recipe ID. They link to the source and can prefill a Chef discussion without automatically sending a message or spending an allowance. The preview remains available during provider loading or errors. This fixes blank discovery pages without claiming that all 195 entries now have full recipes.

The user’s priority is countries with no recipes first. The next confirmed gaps in the recorded audit are Angola, Antigua and Barbuda, Armenia, Aruba, and Austria. The other 130 entries remain availability-unverified due to provider rate limits; do not silently classify them as covered or missing. The coverage JSON retains the original provider check timestamp and marks local coverage updates separately.

Follow-up validation: 26 tests passed, including every source preview and the three offline recipes per requested country; changed-file lint and iOS export passed. Browser checks with mocked auth/API verify three cards per requested country, source attribution, Home/Search source previews, and Chef draft preservation. Physical iPhone validation is still needed.
