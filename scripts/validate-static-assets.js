const fs = require("fs");
const path = require("path");

const CONFLICT_MARKER = /^(?:<{7}(?:\s|$)|={7}\s*$|>{7}(?:\s|$))/m;
const TEXT_EXTENSIONS = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".map",
  ".mjs",
  ".svg",
  ".txt",
]);

function collectTextFiles(targetPath, files = []) {
  if (!fs.existsSync(targetPath)) return files;

  const stat = fs.statSync(targetPath);
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(targetPath)) {
      collectTextFiles(path.join(targetPath, entry), files);
    }
  } else if (TEXT_EXTENSIONS.has(path.extname(targetPath).toLowerCase())) {
    files.push(targetPath);
  }

  return files;
}

function findConflictMarkers(targetPaths) {
  const findings = [];

  for (const targetPath of targetPaths) {
    for (const filePath of collectTextFiles(targetPath)) {
      const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
      lines.forEach((line, index) => {
        if (CONFLICT_MARKER.test(line)) {
          findings.push({ filePath, line: index + 1, marker: line.trim() });
        }
      });
    }
  }

  return findings;
}

function validateStaticAssets(targetPaths) {
  const findings = findConflictMarkers(targetPaths);
  if (findings.length === 0) return;

  const details = findings
    .map(({ filePath, line, marker }) => `  ${filePath}:${line} ${marker}`)
    .join("\n");
  throw new Error(`Static asset validation failed: unresolved merge conflict markers found.\n${details}`);
}

if (require.main === module) {
  const targetPaths = process.argv.slice(2);
  const pathsToValidate = targetPaths.length > 0 ? targetPaths : ["public", "build"];

  try {
    validateStaticAssets(pathsToValidate);
    console.log(`Static asset validation passed (${pathsToValidate.join(", ")}).`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { findConflictMarkers, validateStaticAssets };
