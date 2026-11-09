# Changelog

## 1.0.1 — 2026-11-09

- Add opt-in first-party visitor/session analytics to the launcher and legacy
  gameplay shell, with separate production/development identities.
- Connect existing sign-in/sign-out state after SDK load and consent changes.
- Keep saved run records as the authoritative completion source; gameplay,
  shared Firebase rules and backend writes are unchanged.
- Add focused bootstrap tests and a Hosting-only tracking release configuration.
