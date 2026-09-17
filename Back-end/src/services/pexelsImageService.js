import { ENV } from "../config/env.js";

const PEXELS_SEARCH_URL =
  "https://api.pexels.com/v1/search";

const CACHE_DURATION_MS =
  1000 * 60 * 60;

const imageCache = new Map();

const cleanText = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
};

const createCacheKey = (
  query,
  orientation
) => {
  return `${query.toLowerCase()}::${orientation}`;
};

const getCachedImage = (cacheKey) => {
  const cachedItem =
    imageCache.get(cacheKey);

  if (!cachedItem) {
    return undefined;
  }

  const isExpired =
    Date.now() - cachedItem.createdAt >
    CACHE_DURATION_MS;

  if (isExpired) {
    imageCache.delete(cacheKey);
    return undefined;
  }

  return cachedItem.image;
};

const saveCachedImage = (
  cacheKey,
  image
) => {
  imageCache.set(cacheKey, {
    image,
    createdAt: Date.now(),
  });
};

const addPexelsReferral = (url) => {
  if (!url) {
    return null;
  }

  try {
    const parsedUrl = new URL(url);

    parsedUrl.searchParams.set(
      "utm_source",
      "recipe_app"
    );

    parsedUrl.searchParams.set(
      "utm_medium",
      "referral"
    );

    return parsedUrl.toString();
  } catch {
    return url;
  }
};

const transformPexelsPhoto = (
  photo
) => {
  if (!photo?.src) {
    return null;
  }

  return {
    id: String(photo.id),
    imageUrl:
      photo.src.large ||
      photo.src.landscape ||
      photo.src.medium ||
      photo.src.original,
    thumbnailUrl:
      photo.src.medium ||
      photo.src.small ||
      photo.src.tiny,
    portraitUrl:
      photo.src.portrait ||
      photo.src.medium,
    landscapeUrl:
      photo.src.landscape ||
      photo.src.large,
    averageColor:
      photo.avg_color || "#F3E5F5",
    alt:
      cleanText(photo.alt) ||
      "Food photograph",
    photographer:
      cleanText(photo.photographer) ||
      "Pexels photographer",
    photographerUrl:
      addPexelsReferral(
        photo.photographer_url
      ),
    pexelsUrl:
      addPexelsReferral(photo.url),
    provider: "Pexels",
  };
};

const chooseRandomPhoto = (photos) => {
  if (
    !Array.isArray(photos) ||
    photos.length === 0
  ) {
    return null;
  }

  const randomIndex = Math.floor(
    Math.random() * photos.length
  );

  return photos[randomIndex];
};

export const isPexelsConfigured = () => {
  return Boolean(ENV.PEXELS_API_KEY);
};

export const searchPexelsPhoto =
  async (
    query,
    {
      orientation = "landscape",
      perPage = 8,
      useCache = true,
    } = {}
  ) => {
    const cleanedQuery =
      cleanText(query);

    if (!cleanedQuery) {
      return null;
    }

    if (!ENV.PEXELS_API_KEY) {
      console.warn(
        "Pexels image search skipped: PEXELS_API_KEY is missing."
      );

      return null;
    }

    const safeOrientation = [
      "landscape",
      "portrait",
      "square",
    ].includes(orientation)
      ? orientation
      : "landscape";

    const safePerPage = Math.min(
      Math.max(Number(perPage) || 8, 1),
      20
    );

    const cacheKey = createCacheKey(
      cleanedQuery,
      safeOrientation
    );

    if (useCache) {
      const cachedImage =
        getCachedImage(cacheKey);

      if (cachedImage !== undefined) {
        return cachedImage;
      }
    }

    const searchParameters =
      new URLSearchParams({
        query: cleanedQuery,
        orientation: safeOrientation,
        size: "medium",
        per_page:
          String(safePerPage),
        page: "1",
      });

    const response = await fetch(
      `${PEXELS_SEARCH_URL}?${searchParameters.toString()}`,
      {
        method: "GET",

        headers: {
          Authorization:
            ENV.PEXELS_API_KEY,
          Accept: "application/json",
        },
      }
    );

    const data = await response
      .json()
      .catch(() => null);

    if (!response.ok) {
      const message =
        data?.error ||
        data?.message ||
        `Pexels request failed with status ${response.status}.`;

      const error = new Error(message);

      error.status = response.status;

      throw error;
    }

    const selectedPhoto =
      chooseRandomPhoto(data?.photos);

    const transformedPhoto =
      transformPexelsPhoto(
        selectedPhoto
      );

    if (useCache) {
      saveCachedImage(
        cacheKey,
        transformedPhoto
      );
    }

    return transformedPhoto;
  };

export const searchDishPhoto =
  async ({
    dishName,
    cuisine = "",
  }) => {
    const cleanedDishName =
      cleanText(dishName);

    if (!cleanedDishName) {
      return null;
    }

    const cleanedCuisine =
      cleanText(cuisine);

    const searchQuery = [
      cleanedCuisine,
      cleanedDishName,
      "food dish",
    ]
      .filter(Boolean)
      .join(" ");

    return searchPexelsPhoto(
      searchQuery,
      {
        orientation: "landscape",
        perPage: 10,
      }
    );
  };

export const searchIngredientPhoto =
  async (ingredientName) => {
    const cleanedIngredientName =
      cleanText(ingredientName);

    if (!cleanedIngredientName) {
      return null;
    }

    return searchPexelsPhoto(
      `${cleanedIngredientName} food ingredient`,
      {
        orientation: "square",
        perPage: 8,
      }
    );
  };

export const searchIngredientPhotos =
  async (
    ingredients,
    maximumSearches = 12
  ) => {
    if (!Array.isArray(ingredients)) {
      return [];
    }

    const safeMaximumSearches =
      Math.min(
        Math.max(
          Number(maximumSearches) || 12,
          1
        ),
        20
      );

    const ingredientsToSearch =
      ingredients.slice(
        0,
        safeMaximumSearches
      );

    /*
     * Promise.allSettled prevents one failed
     * photo search from failing the entire
     * generated recipe.
     */
    const searchResults =
      await Promise.allSettled(
        ingredientsToSearch.map(
          async (ingredient) => {
            const searchName =
              cleanText(
                ingredient?.imageSearchName
              ) ||
              cleanText(
                ingredient?.name
              );

            const photo =
              await searchIngredientPhoto(
                searchName
              );

            return {
              ingredientId:
                ingredient?.id || null,
              ingredientName:
                ingredient?.name ||
                searchName,
              photo,
            };
          }
        )
      );

    return searchResults.map(
      (result, index) => {
        if (
          result.status === "fulfilled"
        ) {
          return result.value;
        }

        console.warn(
          `Pexels ingredient search failed for ${
            ingredientsToSearch[index]
              ?.name || "unknown ingredient"
          }:`,
          result.reason?.message
        );

        return {
          ingredientId:
            ingredientsToSearch[index]
              ?.id || null,
          ingredientName:
            ingredientsToSearch[index]
              ?.name || "",
          photo: null,
        };
      }
    );
  };