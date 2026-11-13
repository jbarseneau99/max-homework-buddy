// Install banner + service worker registration (PWA). Android/Chrome: "Install app" via beforeinstallprompt.
// iOS Safari: "Tap Share, then Add to Home Screen". Desktop: nothing unless beforeinstallprompt fires.
// Hidden when already running as an installed app, and once dismissed (localStorage hb.installBanner.dismissed).
(function () {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => { navigator.serviceWorker.register("sw.js", { scope: "./" }).catch(e => console.warn("SW register failed", e)); });
  }
  const KEY = "hb.installBanner.dismissed";
  const standalone = () => (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
  const dismissed = () => { try { return localStorage.getItem(KEY) === "1"; } catch (e) { return false; } };
  const ua = navigator.userAgent || "";
  const isIOS = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  let deferred = null;

  function show(kind) {
    if (standalone() || dismissed() || document.getElementById("hbInstall")) return;
    const bar = document.createElement("div");
    bar.id = "hbInstall"; bar.className = "hb-install"; bar.setAttribute("role", "region"); bar.setAttribute("aria-label", "Install the app");
    bar.innerHTML = `<img src="icons/icon-192.png" alt="" width="40" height="40">` +
      `<div class="hb-install-txt"><b>Get Study Buddy on your home screen</b><span>` +
      (kind === "ios" ? `Tap <b>Share</b> <span class="hb-share" aria-hidden="true">⎙</span> then <b>Add to Home Screen</b>.` : "Install it as an app — it opens full screen.") +
      `</span></div>` + (kind === "prompt" ? `<button type="button" class="btn-gold hb-install-go">Install app</button>` : "") +
      `<button type="button" class="hb-install-x" aria-label="Dismiss">✕</button>`;
    document.body.appendChild(bar);
    bar.querySelector(".hb-install-x").onclick = () => { try { localStorage.setItem(KEY, "1"); } catch (e) {} bar.remove(); };
    const go = bar.querySelector(".hb-install-go");
    if (go) go.onclick = async () => {
      if (!deferred) return bar.remove();
      deferred.prompt();
      try { const c = await deferred.userChoice; if (c && c.outcome === "accepted") bar.remove(); } catch (e) {}
      deferred = null;
    };
  }
  window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferred = e; show("prompt"); });
  window.addEventListener("appinstalled", () => { const b = document.getElementById("hbInstall"); if (b) b.remove(); });
  if (isIOS) { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => show("ios")); else show("ios"); }
  window.HB_PWA = { show, standalone, isIOS };
})();
