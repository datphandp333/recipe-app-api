const images = {
  "curated-kabuli-pulao": require("../assets/images/curated/curated-kabuli-pulao.jpg"),
  "curated-bolani": require("../assets/images/curated/curated-bolani.jpg"),
  "curated-mantu": require("../assets/images/curated/curated-mantu.jpg"),
  "curated-escudella": require("../assets/images/curated/curated-escudella.jpg"),
  "curated-trinxat": require("../assets/images/curated/curated-trinxat.jpg"),
  "curated-belize-rice-beans": require("../assets/images/curated/curated-belize-rice-beans.jpg"),
  "curated-belize-stew-chicken": require("../assets/images/curated/curated-belize-stew-chicken.jpg"),
  "curated-fry-jacks": require("../assets/images/curated/curated-fry-jacks.jpg"),

  "curated-fish-amok": require("../assets/images/curated/curated-fish-amok.jpg"),
  "curated-beef-lok-lak": require("../assets/images/curated/curated-beef-lok-lak.jpg"),
  "curated-num-banh-chok": require("../assets/images/curated/curated-num-banh-chok.jpg"),

  "discover-parmesan-risotto": require("../assets/images/discovery/discover-parmesan-risotto.jpg"),
  "discover-lemon-roast-chicken": require("../assets/images/discovery/discover-lemon-roast-chicken.jpg"),
  "discover-pan-seared-steak": require("../assets/images/discovery/discover-pan-seared-steak.jpg"),
  "discover-coffee-tiramisu": require("../assets/images/discovery/discover-coffee-tiramisu.jpg"),
  "discover-garlic-pasta": require("../assets/images/discovery/discover-garlic-pasta.jpg"),
  "discover-honey-soy-salmon": require("../assets/images/discovery/discover-honey-soy-salmon.jpg"),

  "curated-beef-pho": require("../assets/images/curated/curated-beef-pho.jpg"),
  "curated-margherita": require("../assets/images/curated/curated-margherita.jpg"),
  "curated-sushi-rolls": require("../assets/images/curated/curated-sushi-rolls.jpg"),
  "curated-lamb-tagine": require("../assets/images/curated/curated-lamb-tagine.jpg"),
  "curated-lamb-biryani": require("../assets/images/curated/curated-lamb-biryani.jpg"),
  "curated-moussaka": require("../assets/images/curated/curated-moussaka.jpg"),
  "curated-vegetable-paella": require("../assets/images/curated/curated-vegetable-paella.jpg"),
  "curated-feijoada": require("../assets/images/curated/curated-feijoada.jpg"),
};

export const recipeImageSource = (recipe) => images[recipe?.id || recipe?.recipeId] || (recipe?.image ? { uri: recipe.image } : null);
