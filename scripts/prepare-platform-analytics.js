const fs = require("node:fs");
const path = require("node:path");

// CRA only interpolates the root HTML. Build the same bootstrap for the separate
// legacy gameplay document without exposing any other application environment.
function preparePlatformAnalytics(root, environment = process.env) {
  const env = { ...environment };
  for (const file of [".env.production.local", ".env.local", ".env.production", ".env"]) {
    const filename = path.join(root, file);
    if (!fs.existsSync(filename)) continue;
    for (const [key, value] of Object.entries(require("dotenv").parse(fs.readFileSync(filename)))) {
      if (env[key] === undefined) env[key] = value;
    }
  }
  const source = fs.readFileSync(path.join(root, "src/lib/platformAnalytics.js"), "utf8")
    .replace(/^export /gm, "")
    .replaceAll("process.env.REACT_APP_ANALYTICS_COLLECTOR_URL", JSON.stringify(env.REACT_APP_ANALYTICS_COLLECTOR_URL || ""))
    .replaceAll("process.env.PUBLIC_URL", JSON.stringify(env.PUBLIC_URL || ""));
  const output = `// Generated from src/lib/platformAnalytics.js; do not edit.\n(() => {\n${source}\nwindow.infinftMayhemPlatformAnalytics = { setAnalyticsUser };\nif (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initializePlatformAnalytics, { once: true });\nelse initializePlatformAnalytics();\n})();\n`;
  fs.writeFileSync(path.join(root, "public/infinft-platform-analytics.js"), output);
  return output;
}

if (require.main === module) {
  preparePlatformAnalytics(path.resolve(__dirname, ".."));
  console.log("Prepared environment-gated analytics for the legacy gameplay shell.");
}
module.exports = { preparePlatformAnalytics };
