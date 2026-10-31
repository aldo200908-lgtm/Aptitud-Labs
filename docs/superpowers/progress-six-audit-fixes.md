# Six audit fixes — implementation record

Based on approved audit and production b969b71d94854b1c300f558ef866b1592957153e.

- Shared shell/theme implemented; tests observed failing for missing implementation, then passing for preferences/toggle/denied storage.
- Homepage reduced from 13 to 7 sections. Nine content placeholders replaced. NFC pricing copy corrected without changing calculations. Soluciones permanently redirects to Servicios with legacy anchor destinations. Portfolio remains separate and leads with actual concept projects. Short inquiries reuse the existing app-handoff handler with three required fields. Formal hiring questionnaire remains mandatory and unchanged.
- Independent review: one important grouped dark-contrast issue and one minor legacy-anchor placement issue. Both corrected using semantic surface/text tokens and meaningful content at legacy anchors. Browser-smoke coverage extended for actual computed contrast on legacy plan, quote and NFC surfaces.
- Local verification: 838 static checks, theme behavior checks, JS/Python syntax, duplicate IDs and diff whitespace passed. Before runtime reset, homepage and Services were visually inspected in both themes. Local browser preview became unreachable after user interruption; remaining interaction checks must run in GitHub Actions and live production browser. No alternate browser automation was used.
- Commercial constraints: existing starting prices and calculator/NFC scripts preserved; no invented delivery schedule, materials, clients or results. Experimental editor/Lab remain separate tools rather than receive marketing-shell changes.

Published first commit 8638e1ae8fe578c43156f84bf21dbcfc299bcc58; Vercel successful and live homepage shows new version. Actions exposed an outdated test assumption: it clicked the collapsed mobile menu at desktop width. Corrected the test to use a 390px viewport for menu checks and 1280px for inquiry; no product behavior changed. Remaining: rerun Actions and live interaction verification.
