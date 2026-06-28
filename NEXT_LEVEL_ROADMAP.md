# Next Level Roadmap

This roadmap turns "make the game feel next level" into a sequence of concrete upgrades for `infiNFT Monster Mayhem`.

The current game already has strong core survivors gameplay:
- solid 30-minute run structure
- distinct weapons and passives in `public/legacy/index.html`
- bosses, leaderboard, cloud profile sync, and metaprogression
- a React shell in `src/App.js` that can support a cleaner migration over time

The highest-leverage move now is not "add random content." It is to deepen the run arc, make builds more expressive, and improve long-term goals without losing the arcade feel that already works.

## Current State

The main gameplay systems currently live in `public/legacy/index.html`:
- run start, reset, and HUD bootstrapping around `startGame()` and the player state setup
- weapon progression in `WEAPONS`
- passive progression in `PASSIVES`
- enemy pacing in `director()`
- enemy scaling and behavior in `spawnEnemy()` and `updateEnemies()`
- run summary, cloud persistence, and leaderboard writes in the cloud profile helpers

That means the game is feature-rich already, but it also means "next level" work should be grouped carefully so the legacy runtime does not become impossible to evolve.

## Product Goals

We should optimize for four player-facing outcomes:

1. Every run should tell a stronger story.
Late game should feel like escalation, adaptation, and survival pressure, not just bigger numbers.

2. Builds should feel more intentional.
The player should be able to recognize a build identity instead of just taking generically strong upgrades.

3. Progression outside the run should create medium-term goals.
Coins alone are not enough to drive replay for long.

4. The game should feel more premium moment to moment.
Feedback, clarity, and presentation should make the same mechanics feel more authored.

## Priority Order

### P1. Run Depth

Goal: make late-game and boss phases more varied and more memorable.

Proposed features:
- enemy affixes that begin after minute 10
- biome or wave modifiers every 5 minutes
- boss-specific arena pressure instead of only bigger HP pools
- anti-kite late-game threats like shielded brutes, splitter enemies, or hazard volleys

Why first:
- this has the biggest impact on "the game feels next level"
- it builds directly on the balance pass we already made
- it improves replay without requiring a full UI rewrite

Likely implementation zones:
- `director()`
- `spawnEnemy()`
- `updateEnemies()`
- boss ability blocks and `BOSS_TIMES`

Recommended gstack skills:
- `investigate` for pressure tuning and failure cases
- `qa` for run feel validation
- `benchmark` once enemy variety and projectile count go up

### P2. Build Identity

Goal: turn upgrades from "good stats" into recognizable archetypes.

Proposed features:
- synergy tags on weapons and passives
- conditional passive effects, for example orb, crit, sprint, or freeze builds
- one new upgrade choice type: rare cards, fusion cards, or milestone perks
- character-specific build shaping so Bonky, Zippy, and Chonk feel more divergent over time

Why second:
- the current weapon list is already strong enough to support synergy design
- this makes leveling more exciting without requiring more enemy art
- it gives players something to chase beyond raw survival time

Likely implementation zones:
- `WEAPONS`
- `PASSIVES`
- `rollCards()`
- `applyLevelupCard()`
- `GAME_MODES`

Recommended gstack skills:
- `spec` to define archetypes and unlock rules before coding
- `investigate` to catch new runaway combinations
- `qa` to compare build viability across multiple runs

### P3. Meta Progression

Goal: give the player reasons to come back besides coin accumulation.

Proposed features:
- unlock tracks tied to milestones, boss kills, or challenge runs
- account-level quests or contracts
- character unlock progression and mastery
- modifiers or relics unlocked between runs

Why third:
- the cloud profile and leaderboard infrastructure already exists
- this increases retention more than another isolated weapon would
- it lets the game move from "fun arcade prototype" to "sticky live game loop"

Likely implementation zones:
- cloud profile helpers and leaderboard persistence
- profile payload shaping in `src/App.js`
- menu and loadout screens in `public/legacy/index.html`

Recommended gstack skills:
- `spec` for the progression design
- `plan-eng-review` if the save model gets more complex
- `qa` for persistence and regression testing

### P4. Premium Feel

Goal: make the game feel more polished without changing its soul.

Proposed features:
- clearer level-up card hierarchy and rarity presentation
- stronger end-of-run summary and build recap
- improved boss intros, warnings, and kill celebrations
- better weapon tray readability and passive cap clarity

Why fourth:
- it amplifies everything else
- it is lower risk than mechanical changes
- it makes screenshots, clips, and first impressions better

Likely implementation zones:
- HUD and menu markup/styles in `public/legacy/index.html`
- shell presentation in `src/App.js`, `src/App.css`, and `src/index.css`

Recommended gstack skills:
- `design-review`
- `qa`

### P5. Runtime Migration

Goal: reduce long-term fragility by pulling gameplay systems out of one giant legacy file.

Proposed features:
- extract data tables first: modes, passives, weapons, enemies
- then extract systems: progression, enemies, pickups, cloud profile, UI overlays
- leave rendering behavior intact while modularizing

Why fifth:
- this does not improve feel immediately
- it becomes very important once new systems start landing faster
- it lowers risk for every future change

Likely implementation zones:
- `public/legacy/index.html`
- new modules under `src/` or a dedicated runtime folder

Recommended gstack skills:
- `health`
- `spec`
- `plan-eng-review`

## Suggested Milestones

### Milestone A: Better Late Game

Ship:
- 2 enemy affixes
- 1 new late-game hazard pattern
- 1 boss phase enhancement

Success metric:
- minute 12+ runs feel meaningfully different from minute 6 runs

### Milestone B: First Real Build System

Ship:
- synergy tags
- 3 to 5 synergy-driven passives
- 1 rare-card mechanic

Success metric:
- players can describe their run as a build, not just "I got strong"

### Milestone C: Account Progression Loop

Ship:
- milestone unlocks
- challenge objectives
- improved profile summary

Success metric:
- players have a reason to launch another run after a loss

## Suggested Working Loop

Use this as the default rhythm:

1. `spec` the next milestone before writing code.
2. `investigate` whenever balance or feel seems off.
3. `qa` after each gameplay change.
4. `benchmark` after enemy-count, projectile, or VFX increases.
5. `design-review` after the mechanics settle.
6. `ship` when a milestone is coherent enough to publish.

## Best Immediate Next Task

The strongest next task is:

**Implement a late-game mutator system that adds run modifiers every 5 minutes.**

Why this is the best next step:
- it compounds with the balance work we just finished
- it deepens the run arc without needing new art assets
- it creates a clean foundation for future boss, build, and meta-progression systems

Suggested first mutators:
- `Berserk Wave`: runners and brutes gain speed, elites spawn earlier
- `Storm Front`: periodic projectile volleys or strike markers force movement
- `Glass Horde`: enemies spawn in larger numbers but take extra damage

If we start building immediately after this roadmap, that is the feature I would tackle next.
