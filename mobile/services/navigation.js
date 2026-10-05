// Direct links and browser refreshes may have no navigator history.
export function backOrReplace(router, fallback = "/(taps)") {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}
