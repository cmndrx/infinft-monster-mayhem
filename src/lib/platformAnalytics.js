// First-party usage analytics. Disabled unless a deployed HTTPS collector is configured.
let latestUserId = null;
let initialized = false;
export function setAnalyticsUser(user) {
  latestUserId = user && !user.isAnonymous ? user.uid : null;
  try {
    if (latestUserId) window.infinftAnalytics?.identify(latestUserId);
    else window.infinftAnalytics?.reset();
  } catch { /* Analytics must never interrupt account initialization. */ }
}
export function initializePlatformAnalytics() {
  if (initialized) return;
  const configured = process.env.REACT_APP_ANALYTICS_COLLECTOR_URL;
  if (!configured) return;
  let collector;
  try { collector = new URL(configured); } catch { return; }
  if (collector.protocol !== "https:" || collector.username || collector.password || collector.port || collector.pathname !== "/" || collector.search || collector.hash) return;
  const hosts = {
    "infinft-monster-mayhem.web.app": "mayhem",
    "infinft-monster-mayhem.firebaseapp.com": "mayhem",
    "infinft-monster-mayhem-dev.web.app": "mayhem-dev",
    "infinft-monster-mayhem-dev.firebaseapp.com": "mayhem-dev",
  };
  const platform = hosts[window.location.hostname];
  if (!platform) return; // Local previews never pollute production analytics.
  initialized = true;
  const script = document.createElement("script");
  script.src = `${process.env.PUBLIC_URL || ""}/infinft-analytics.js`;
  script.defer = true;
  script.dataset.platform = platform;
  script.dataset.endpoint = collector.origin + "/api/telemetry";
  script.dataset.consent = "pending";
  script.dataset.consentUi = "true";
  script.dataset.spa = "true";
  const identify = () => { try { if (latestUserId) window.infinftAnalytics?.identify(latestUserId); } catch { /* Telemetry is independent of sign-in. */ } };
  script.onload = identify;
  window.addEventListener("infinft:analytics-consent-granted", identify);
  document.head.appendChild(script);
}
