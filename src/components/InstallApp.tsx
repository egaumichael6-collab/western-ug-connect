import { useEffect, useState, useSyncExternalStore } from "react";
import {
  canPromptInstall, detectInstalled, detectPlatform, isStandalone, markedInstalled,
  openInChromeUrl, promptInstall, subscribe, type Platform,
} from "../lib/pwa";

const ShareIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="inline -mt-1">
    <path d="M12 3v12M7 8l5-5 5 5M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
  </svg>
);

function Steps({ platform }: { platform: Platform }) {
  const li = "flex gap-3";
  const n = (k: number) => <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-plum-100 text-xs font-bold text-plum-800">{k}</span>;
  if (platform === "ios") return (
    <ol className="space-y-2 text-sm text-slate-700">
      <li className={li}>{n(1)}<span>Tap the <b>Share</b> button <ShareIcon /> at the bottom (or top) of Safari.</span></li>
      <li className={li}>{n(2)}<span>Scroll down and tap <b>Add to Home Screen</b>.</span></li>
      <li className={li}>{n(3)}<span>Tap <b>Add</b>. The app appears on your home screen.</span></li>
    </ol>
  );
  if (platform === "ios-inapp") return (
    <ol className="space-y-2 text-sm text-slate-700">
      <li className={li}>{n(1)}<span>Tap the <b>•••</b> menu in the corner of this screen.</span></li>
      <li className={li}>{n(2)}<span>Choose <b>Open in Safari</b> (or Open in browser).</span></li>
      <li className={li}>{n(3)}<span>In Safari tap <b>Share</b> <ShareIcon /> → <b>Add to Home Screen</b>.</span></li>
    </ol>
  );
  if (platform === "android-inapp") return (
    <p className="text-sm text-slate-700">Apps like TikTok and Facebook can't install apps. Tap the button below to open WESTERN UG CONNECT in <b>Chrome</b>, then tap <b>Install</b>.
      If nothing happens, tap the <b>⋮</b> menu and choose <b>Open in browser</b>.</p>
  );
  if (platform === "android") return (
    <ol className="space-y-2 text-sm text-slate-700">
      <li className={li}>{n(1)}<span>Tap the <b>⋮</b> menu at the top right of your browser.</span></li>
      <li className={li}>{n(2)}<span>Tap <b>Install app</b> or <b>Add to Home screen</b>.</span></li>
      <li className={li}>{n(3)}<span>Tap <b>Install</b>. The app appears on your phone.</span></li>
    </ol>
  );
  return <p className="text-sm text-slate-700">Click the <b>install icon</b> in your browser's address bar (or the menu → <b>Install WESTERN UG CONNECT</b>).</p>;
}

/** Install popup: opens every time the website is opened, and stays as a bar until the app is installed. */
export default function InstallApp() {
  const canPrompt = useSyncExternalStore(subscribe, canPromptInstall, () => false);
  const installedFlag = useSyncExternalStore(subscribe, markedInstalled, () => false);
  const [standalone] = useState(isStandalone);
  const [detected, setDetected] = useState(false);
  const [platform] = useState<Platform>(() => (typeof navigator === "undefined" ? "desktop" : detectPlatform()));
  const [open, setOpen] = useState(true);
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => { detectInstalled().then(setDetected); }, []);

  // Already running as the installed app, or the phone already has it → never show.
  const installed = standalone || detected || (installedFlag && !canPrompt);
  if (installed) return null;

  const install = async () => {
    if (canPrompt) {
      const ok = await promptInstall();
      if (!ok) setShowSteps(false);
      return;
    }
    if (platform === "android-inapp") { window.location.href = openInChromeUrl(); return; }
    setShowSteps(true);
    setOpen(true);
  };

  const buttonLabel = platform === "android-inapp" && !canPrompt ? "Open in Chrome to install" : "Install the app";

  return (
    <>
      {/* Always-visible bar (stays until the app is installed) */}
      <div className="bg-gradient-to-r from-plum-900 to-plum-700 text-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2">
          <img src="/icons/icon-192.png" alt="" width={36} height={36} className="h-9 w-9 shrink-0 rounded-lg bg-white" />
          <p className="min-w-0 flex-1 text-sm leading-tight"><b>Get the WESTERN UG CONNECT app</b><span className="hidden sm:inline"> — free, fast, right on your phone's home screen.</span></p>
          <button type="button" onClick={install} className="shrink-0 rounded-full bg-gold-400 px-4 py-1.5 text-sm font-bold text-plum-950 hover:bg-gold-300">Install</button>
        </div>
      </div>

      {/* Popup shown each time the website is opened */}
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="install-title">
          <div className="w-full max-w-md rounded-t-3xl bg-white p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl">
            <div className="flex items-center gap-4">
              <img src="/icons/icon-192.png" alt="" width={64} height={64} className="h-16 w-16 rounded-2xl shadow ring-1 ring-plum-100" />
              <div>
                <h2 id="install-title" className="font-display text-xl font-bold text-plum-950">Install our app</h2>
                <p className="text-sm text-slate-600">WESTERN UG CONNECT on your home screen</p>
              </div>
            </div>
            <ul className="mt-4 space-y-1 text-sm text-slate-700">
              <li>💬 Open your matches and messages in one tap</li>
              <li>⚡ Faster, full-screen — no browser bars</li>
              <li>📲 No App Store or Play Store needed, it's free</li>
            </ul>
            {(showSteps || (!canPrompt && platform !== "android-inapp")) && (
              <div className="mt-4 rounded-2xl bg-plum-50 p-4">
                <p className="mb-2 text-sm font-semibold text-plum-900">How to install:</p>
                <Steps platform={platform} />
              </div>
            )}
            {platform === "android-inapp" && !canPrompt && <div className="mt-4 rounded-2xl bg-plum-50 p-4"><Steps platform={platform} /></div>}
            <div className="mt-5 flex flex-col gap-2">
              {(canPrompt || platform === "android-inapp") && (
                <button type="button" onClick={install} className="w-full rounded-full bg-plum-800 px-5 py-3 font-semibold text-white hover:bg-plum-900">{buttonLabel}</button>
              )}
              <button type="button" onClick={() => setOpen(false)} className="w-full rounded-full px-5 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-100">Continue on website</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
