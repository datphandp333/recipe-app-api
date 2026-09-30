const images = {
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
