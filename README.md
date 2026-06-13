# 🔨 CUBE BASHER

*They're evil cubes. You have a hammer.*

**Cube Basher** is a fast, colorful 3D survivors-like (think *Vampire Survivors* meets low-poly 3D) that runs entirely in your browser. Survive 30 minutes against an ever-growing horde of menacing cubes, level up auto-firing weapons, climb cliffs, smash pots for food, and take down five towering bosses — then bank your gold to permanently upgrade your character between runs.

The project now has a React shell and keeps the original game runtime preserved under `public/legacy/index.html` while the migration is underway.

## ✨ Features

- **30-minute runs** across a huge low-poly world with rolling hills, climbable mesas, and cliff ledges
- **3 playable characters** — balanced Bonky, speedy Zippy, and tanky Chonk
- **7 auto-firing weapons** (8 levels each): Basher Hammer, Bash Orbs, Fireball, Sky Zapper, Boomerang, Frost Nova, and the piercing Cube Cannon
- **11 in-run passive upgrades** plus a sprint system with stamina management
- **6 enemy types** — grunts, spider runners, tusked brutes, ranged spitters, elites, and five named bosses (MEGACUBE through OMEGACUBE)
- **Metaprogression** — gold earned in runs becomes permanent coins, spent in the Upgrade Lab on 8 permanent character upgrades (saved in your browser)
- **Combo system**, gem-vacuum power-ups, breakable health pots, crit slow-mo, procedural chiptune soundtrack

## 🎮 Controls

| Input | Action |
|---|---|
| `W A S D` / arrows | Move (relative to camera) |
| `Shift` (hold) | Sprint — drains stamina |
| `Space` | Jump — dodges enemies, climbs ledges |
| Mouse drag | Orbit the camera |
| Scroll wheel | Zoom |
| `P` / `Esc` | Pause |
| `M` | Mute |

Weapons fire automatically — your job is to move, dodge, and choose upgrades.

## 🕹️ How to Play

### Play in the browser (easiest)

**▶️ [Play Cube Basher now](https://mreflow.github.io/cube-basher/)** — nothing to install, just click **BASH!**

### Run it locally

The development entry point is now:

```bash
npm start
```

That launches the React app at `http://localhost:3000`. The React shell embeds the preserved legacy game runtime so gameplay stays intact while the codebase is being converted.

Because the game uses JavaScript modules and now runs through React, it needs to be served over HTTP during development.

**1. Download the game** (all platforms):

```bash
git clone https://github.com/mreflow/cube-basher.git
cd cube-basher
```

…or click **Code → Download ZIP** on GitHub and unzip it.

**2. Install dependencies:**

```bash
npm install
```

**3. Start the app:**

```bash
npm start
```

**4. Play:** open [http://localhost:3000](http://localhost:3000) in your browser and launch the embedded legacy runtime.

> **Requirements:** a modern desktop browser (Chrome, Edge, Firefox, or Safari 16.4+) and an internet connection on first load (the three.js engine and fonts load from a CDN). Your save data (coins and Upgrade Lab purchases) lives in your browser's local storage.

## 📱 Mobile

**Cube Basher is not currently playable on mobile.** The game requires a keyboard (WASD / Shift / Space) and mouse — phones and tablets will load the menu but can't control the game. Touch controls may come in a future update.

## 🧱 Tech

- [three.js](https://threejs.org/) (WebGL) with bloom post-processing, dynamic shadows, and instanced rendering
- Procedural everything: terrain heightfield, enemy meshes, chiptune music, and sound effects synthesized in-browser
- React shell for startup and migration scaffolding
- Preserved legacy Three.js runtime in `public/legacy/index.html`

## 📄 License

Do whatever you want with it. Bash responsibly.
# infinft-monster-mayhem
