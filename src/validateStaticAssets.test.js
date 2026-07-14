const fs = require("fs");
const os = require("os");
const path = require("path");
const { findConflictMarkers, validateStaticAssets } = require("../scripts/validate-static-assets");

describe("static asset validation", () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "infinft-assets-"));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test("rejects merge conflict markers copied into deployable HTML", () => {
    const htmlPath = path.join(tempDir, "index.html");
    fs.writeFileSync(
      htmlPath,
      "<script>\n<<<<<<< Updated upstream\nconst profile = {};\n=======\nconst profile = null;\n>>>>>>> Stashed changes\n</script>\n"
    );

    expect(() => validateStaticAssets([tempDir])).toThrow(
      "unresolved merge conflict markers found"
    );
    expect(findConflictMarkers([tempDir])).toHaveLength(3);
  });

  test("allows decorative separator lines and resolved scripts", () => {
    fs.writeFileSync(
      path.join(tempDir, "index.html"),
      "<script>\n/* ============================================================ */\nconst profile = {};\n</script>\n"
    );

    expect(() => validateStaticAssets([tempDir])).not.toThrow();
  });

  test("does not expose Skelly as a loadout choice", () => {
    const gameHtml = fs.readFileSync(
      path.join(__dirname, "../public/legacy/index.html"),
      "utf8"
    );
    const playerCharacters = gameHtml.match(
      /const PLAYER_CHARACTERS = \[([\s\S]*?)\];/
    )?.[1];

    expect(playerCharacters).toBeDefined();
    expect(playerCharacters).not.toMatch(/id:\s*['"]skelly['"]/);
    expect(gameHtml).toMatch(/skelly:\s*['"]duck['"]/);
  });
});
