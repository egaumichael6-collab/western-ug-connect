// App install support (installs straight from the browser — no App Store / Play Store).

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const FLAG = "wugc_app_installed";
const PENDING = "wugc_install_to_report";
let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((f) => f());

const store = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
  del: (k: string) => { try { localStorage.removeItem(k); } catch { /* ignore */ } },
};

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(display-mode: standalone)").matches
    || window.matchMedia?.("(display-mode: fullscreen)").matches
    || window.matchMedia?.("(display-mode: minimal-ui)").matches
    || (navigator as unknown as { standalone?: boolean }).standalone === true;
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    store.del(FLAG); // the browser only offers this when the app is NOT installed
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    store.set(FLAG, "1");
    store.set(PENDING, "1");
    emit();
  });
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => { navigator.serviceWorker.register("/sw.js").catch(() => { /* site still works */ }); });
  }
}

export const canPromptInstall = () => deferred !== null;
export const markedInstalled = () => store.get(FLAG) === "1";

export function subscribe(f: () => void) {
  listeners.add(f);
  return () => { listeners.delete(f); };
}

/** Shows the browser's own install dialog. Returns true if the person accepted. */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  const e = deferred;
  await e.prompt();
  const { outcome } = await e.userChoice;
  deferred = null;
  if (outcome === "accepted") { store.set(FLAG, "1"); store.set(PENDING, "1"); }
  emit();
  return outcome === "accepted";
}

/** Chrome on Android can tell us if the app is already on the phone. */
export async function detectInstalled(): Promise<boolean> {
  try {
    const nav = navigator as unknown as { getInstalledRelatedApps?: () => Promise<unknown[]> };
    if (nav.getInstalledRelatedApps) {
      const apps = await nav.getInstalledRelatedApps();
      if (apps.length > 0) { store.set(FLAG, "1"); return true; }
    }
  } catch { /* not supported */ }
  return false;
}

export type Platform = "ios" | "ios-inapp" | "android-inapp" | "android" | "desktop";

export function detectPlatform(): Platform {
  const ua = navigator.userAgent || "";
  const ios = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const inApp = /TikTok|musical_ly|Bytedance|FBAN|FBAV|FB_IAB|Instagram|Snapchat|Line\/|Twitter|LinkedInApp|; wv\)/i.test(ua);
  if (ios) return inApp ? "ios-inapp" : "ios";
  if (/Android/i.test(ua)) return inApp ? "android-inapp" : "android";
  return "desktop";
}

/** Opens this page in Chrome from an in-app browser (TikTok, Facebook…) on Android. */
export function openInChromeUrl(): string {
  const { host, pathname, search } = window.location;
  return `intent://${host}${pathname}${search}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(window.location.href)};end`;
}

/** For the admin "App installs" list: an install on this phone not yet reported for a signed-in member. */
export const hasPendingInstall = () => store.get(PENDING) === "1";
export const clearPendingInstall = () => store.del(PENDING);

export function simplePlatform(): "android" | "ios" | "desktop" {
  const p = detectPlatform();
  return p.startsWith("ios") ? "ios" : p.startsWith("android") ? "android" : "desktop";
}
