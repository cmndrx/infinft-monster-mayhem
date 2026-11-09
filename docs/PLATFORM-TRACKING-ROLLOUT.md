# Monster Mayhem tracking release

Status: prepared for review; not merged or deployed by this change.

## Source and scope

Base: production-aligned `dev` commit
`84ed5dd4688576bae88ee5504fc2cbe699b62304`. The existing production entry HTML
matches that checkout's build artifact. The tracking branch keeps the source
checkout's unrelated Hosting metadata and coverage changes out of the release.

The reviewed first-party SDK is copied from the command center into
`public/infinft-analytics.js`. It provides persistent consent choice, a privacy
preferences control, DNT/GPC suppression, anonymous browser/session IDs and
origin-validated collection. It records no names, email, URLs or creations.

The launcher fully navigates to `/legacy/index.html` after sign-in, so both
documents need the same tracking bootstrap. `scripts/prepare-platform-analytics.js`
generates an ignored public bootstrap from the shared module using only public
collector configuration. The legacy document's existing auth observer forwards
identity to it. Tracking waits for consent, handles SDK/auth loading order and
consent regrant, and clears actor identity on sign-out or anonymous auth.

No game-start/completion hooks are added. The command center already counts
authoritative Monster Mayhem saved runs; adding browser completion totals would
duplicate that source. Gameplay and all Firebase writes remain unchanged.

## Public configuration

- `REACT_APP_ANALYTICS_COLLECTOR_URL`:
  `https://infinft-analytics-collector-176088601846.us-central1.run.app`
- `PUBLIC_URL`: existing CRA optional public path; normally empty for this site.
- Existing public Firebase client environment must match the production build.
  No private collector read credentials belong in a client build.

Only exact approved hosts install the SDK:

| Hosts | Platform |
| --- | --- |
| `infinft-monster-mayhem.web.app`, `infinft-monster-mayhem.firebaseapp.com` | `mayhem` |
| `infinft-monster-mayhem-dev.web.app`, `infinft-monster-mayhem-dev.firebaseapp.com` | `mayhem-dev` |

Missing/unsafe collector URLs and localhost/unlisted previews stay disabled.

## Build and release

```bash
CI=true npm test -- --watchAll=false --runInBand
BUILD_PATH=.tracking-build GENERATE_SOURCEMAP=false npm run build
node scripts/validate-static-assets.js public .tracking-build
```

The historical `build/` directory is tracked by the repository. The separate
ignored `.tracking-build/` avoids committing generated assets or overwriting
that baseline. `firebase.tracking-release.json` contains only Hosting targets,
using that verified directory; it cannot deploy shared rules or backends.

The primary rollout owner must verify the reviewed branch/commit, collector
acceptance, and build hashes before deployment. Production command after that
verification, with Node 24 available:

```bash
npx -y firebase-tools@latest deploy --project infinft-card-game \
  --config firebase.tracking-release.json --only hosting:prod
```

Target `prod` must map only to `infinft-monster-mayhem`; do not run bare deploy
or deploy Functions/rules. Verify consent denial produces no collection,
acceptance produces page/sign-in events, launcher-to-game navigation keeps the
same visitor/session, sign-out resets identity, and saved runs are not counted
again as browser completions. Live acceptance remains with the primary owner.

## Local verification

- All 22 tests in 4 suites passed on Node 24.22.1.
- The optimized production build compiled successfully; explicit static asset
  validation passed for `public/` and `.tracking-build/`.
- The SDK matches the reviewed command-center SDK byte-for-byte (SHA-256
  `451bfa12f9ceafdb5bea500412c5b64bef921f3ac5f504296f87e7c4aca792f2`).
- Generated and built legacy bootstraps match and defer SDK initialization until
  DOM readiness so the consent UI has a body to attach to.
- Dependencies were reused through an ignored symlink to the existing Mayhem
  security worktree; no new dependency install or version changes were made.
- The build emits the existing Node `fs.F_OK` deprecation warning. There were no
  compilation warnings or failures.
- Production browser/collector acceptance has not been claimed by this PR.
