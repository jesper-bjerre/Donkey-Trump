// Fullscreen for touch play. Android and iPad support the Fullscreen API (iPad via
// the webkit prefix). iPhone Safari does not allow it for web pages at all; there
// the only true fullscreen is launching the game from the Home Screen as a web app
// (public/manifest.webmanifest + apple-mobile-web-app-capable).

export function isStandalone(win = globalThis.window) {
  if (win?.navigator?.standalone === true) return true;
  try {
    return ['fullscreen', 'standalone'].some((mode) => win?.matchMedia?.(`(display-mode: ${mode})`).matches);
  } catch {
    return false;
  }
}

export function isIPhone(win = globalThis.window) {
  return /iPhone|iPod/.test(win?.navigator?.userAgent ?? '');
}

export function getFullscreenSupport(doc = globalThis.document, win = doc?.defaultView) {
  const api = Boolean(doc?.fullscreenEnabled || doc?.webkitFullscreenEnabled);
  const standalone = isStandalone(win);
  return {
    api,
    standalone,
    // Nothing to enter: the web app already runs without browser chrome.
    alreadyFullscreen: standalone,
    // iPhone Safari: fullscreen only by adding the game to the Home Screen.
    homeScreenOnly: !api && !standalone && isIPhone(win),
  };
}

export function isFullscreen(doc = globalThis.document) {
  return Boolean(doc?.fullscreenElement || doc?.webkitFullscreenElement);
}

// Must run inside a user gesture (tap). Locks landscape where the browser allows it.
export async function enterFullscreen(doc = globalThis.document) {
  const root = doc.documentElement;
  const request = root.requestFullscreen ?? root.webkitRequestFullscreen;
  if (!request || isFullscreen(doc)) return isFullscreen(doc);
  try {
    await request.call(root, { navigationUI: 'hide' });
  } catch {
    return false;
  }
  try {
    await doc.defaultView?.screen?.orientation?.lock?.('landscape');
  } catch {
    // Orientation lock is optional (unsupported on iPad and most desktops).
  }
  return true;
}

export async function exitFullscreen(doc = globalThis.document) {
  const exit = doc.exitFullscreen ?? doc.webkitExitFullscreen;
  if (!exit || !isFullscreen(doc)) return false;
  try {
    await exit.call(doc);
    return true;
  } catch {
    return false;
  }
}
