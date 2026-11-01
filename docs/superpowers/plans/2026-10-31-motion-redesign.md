# Aptitud Labs Motion Implementation Plan
Goal: complete responsive motion redesign on existing GitHub Pages.
Architecture: consolidate the clean static content into the published routes; preserve quote and store modules. One design stylesheet, one functional script and one motion engine. No build dependencies.
Spec: docs/superpowers/specs/2026-10-31-motion-redesign.md

- [x] Promote clean content, preserve all routes and business modules, repair base paths.
- [x] Replace home with sculpture hero, scroll service scenes, process and contact.
- [x] Apply shared art direction to all 12 pages and project covers.
- [x] Implement deterministic scroll state, keyboard scene controls, reduced motion and offscreen pause.
- [x] Verify page links/assets, JavaScript syntax, desktop/mobile layout, scene changes, menu, filters, quote and NFC cart.
- [ ] Commit/push gh-pages and confirm Pages deployment.
Review focus: fast reverse scroll must never duplicate text; mobile must not overflow; no-JS/reduced motion content stays readable; quote deep links still expose their panel; cart remains operable.
