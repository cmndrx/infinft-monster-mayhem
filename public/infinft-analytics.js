/* infiNFT first-party analytics. Explicit consent controls are provided to the host app. */
(() => {
  const script = document.currentScript;
  const platform = script?.dataset.platform;
  const endpoint = script?.dataset.endpoint;
  if (!platform || !endpoint || window.infinftAnalytics) return;
  let enabled = false;
  let actorId = null;
  let visitor;
  let session;
  let lastActivity = 0;
  const prefix = `infinft:analytics:${platform}:`;
  const uuid = () => crypto.randomUUID();
  function read(key) { try { return localStorage.getItem(prefix + key); } catch { return null; } }
  function write(key, value) { try { localStorage.setItem(prefix + key, value); } catch { /* In-memory IDs work when storage is unavailable. */ } }
  enabled = script.dataset.consent === "granted" || read("consent") === "granted";
  function blocked() { return navigator.doNotTrack === "1" || navigator.globalPrivacyControl === true; }
  function identifySession() {
    visitor ||= read("visitor") || uuid();
    const saved = read("session");
    try {
      const previous = JSON.parse(saved || "null");
      if (previous && Date.now() - previous.at < 30 * 60_000) { session = previous.id; lastActivity = previous.at; }
    } catch { /* Ignore corrupt storage. */ }
    if (!session || Date.now() - lastActivity >= 30 * 60_000) session = uuid();
    lastActivity = Date.now();
    write("visitor", visitor);
    write("session", JSON.stringify({ id: session, at: lastActivity }));
  }
  function track(type, data = {}) {
    if (!enabled || blocked()) return;
    identifySession();
    const event = { platform, type, eventId: uuid(), visitorId: visitor, sessionId: session, ...(actorId ? { actorId } : {}), ...(data.gameId ? { gameId: data.gameId } : {}) };
    // No URLs, query strings, referrers, names, email addresses, or payment data.
    const body = JSON.stringify(event);
    fetch(endpoint, { method: "POST", body, headers: { "Content-Type": "text/plain" }, mode: "cors", credentials: "omit", keepalive: true }).catch(() => {});
  }
  window.infinftAnalytics = {
    consent(granted) {
      const newlyGranted = granted && !enabled;
      enabled = Boolean(granted);
      write("consent", enabled ? "granted" : "denied");
      if (newlyGranted) {
        track("page_view");
        if (actorId) track("sign_in");
        else if (typeof Event === "function") window.dispatchEvent?.(new Event("infinft:analytics-consent-granted"));
      }
      if (!enabled) {
        actorId = null; visitor = null; session = null; lastActivity = 0;
        try { localStorage.removeItem(prefix + "visitor"); localStorage.removeItem(prefix + "session"); } catch { /* Storage may be blocked. */ }
      }
    },
    page: () => track("page_view"),
    identify(uid) { actorId = typeof uid === "string" ? uid : null; if (actorId) track("sign_in"); },
    reset() { actorId = null; },
    gameStarted: (gameId) => track("game_start", { gameId }),
    gameCompleted: (gameId) => track("game_complete", { gameId }),
  };
  if (script.dataset.spa === "true") {
    let lastRoute = location.pathname + location.hash;
    const routeChanged = () => { const route = location.pathname + location.hash; if (route !== lastRoute) { lastRoute = route; track("page_view"); } };
    for (const name of ["pushState", "replaceState"]) {
      const original = history[name];
      history[name] = function (...args) { const result = original.apply(this, args); routeChanged(); return result; };
    }
    window.addEventListener("popstate", routeChanged);
    window.addEventListener("hashchange", routeChanged);
  }
  if (script.dataset.consentUi === "true" && !blocked()) {
    const panel = document.createElement("section");
    panel.setAttribute("aria-label", "Usage analytics preferences");
    panel.style.cssText = "position:fixed;bottom:12px;right:12px;z-index:2147483000;max-width:min(340px,calc(100vw - 24px));padding:16px;background:#141823;color:#f4f4f7;border:1px solid #505866;border-radius:12px;box-shadow:0 8px 35px #0008;font:13px/1.6 system-ui,sans-serif";
    const text = document.createElement("p"); text.textContent = "Allow usage analytics? Help us understand visits and game activity. We don’t collect names, emails, or your creations."; text.style.margin = "0 0 12px";
    const allow = document.createElement("button"); allow.type = "button"; allow.textContent = "Allow analytics";
    const deny = document.createElement("button"); deny.type = "button"; deny.textContent = "No thanks";
    for (const button of [allow, deny]) button.style.cssText = "cursor:pointer;font:inherit;padding:7px 10px;margin-right:8px;border:1px solid #68707f;border-radius:6px;background:#252d3b;color:#fff";
    const preferences = document.createElement("button"); preferences.type = "button"; preferences.textContent = "Privacy choices";
    preferences.style.cssText = "position:fixed;bottom:8px;right:8px;z-index:2147482999;font:10px system-ui;padding:4px 7px;border:1px solid #555c68;border-radius:5px;background:#151a24;color:#cdd3df;cursor:pointer";
    const choose = (granted) => { window.infinftAnalytics.consent(granted); panel.hidden = true; preferences.hidden = false; };
    allow.onclick = () => choose(true); deny.onclick = () => choose(false);
    preferences.onclick = () => { panel.hidden = false; preferences.hidden = true; };
    panel.append(text, allow, deny);
    panel.hidden = read("consent") !== null; preferences.hidden = !panel.hidden;
    document.body.append(panel, preferences);
  }
  if (enabled) track("page_view");
})();
