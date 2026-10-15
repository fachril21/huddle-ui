---
version: 1
slug: "src-mobile-sheet-tsx"
primary_target: "src/mobile/Sheet.tsx"
related_targets: ["src/room/MobileDock.tsx","src/dashboard/TabBar.tsx"]
---

# Surface brief: Mobile view

Mode: Operate. Phone portrait 320-430 px first, then landscape and tablet. Inside the established Huddle Aurora world (Design.md); no new identity. Adaptation, not scaling: bottom sheets, bottom controls, thumb reach, 44px targets, no hover.

Audience/job: people joining and running meetings from a phone, one-handed, often on weak hardware. Same three screens as desktop: dashboard, lobby, room (all room features and interactions).
Constraints: no feature hidden on mobile; status never by color alone; reduced motion honored; keyboard-on-screen must not hide the primary action; controls always visible in portrait (no auto-hide); Hemat effects tier by default.

## Direction contract

THESIS: The same world reached by thumb: controls live in a bottom bar and bottom sheets, content owns the rest; refuses a shrunken desktop and a hamburger-menu shell.
OWN-WORLD: Huddle Aurora: ink-950 ground, quiet mesh, glass-3 sheets with a 40x4 grab handle, glass-3 control bar, aurora cyan/mint only as signal, Sora headings, Plus Jakarta body, JetBrains Mono for times and codes; primary #5b5bf0.
STORY: A person opens the dashboard, taps a meeting, checks camera and name in a lobby with Masuk pinned at the bottom, lands in a tall grid, reacts, chats, opens Lainnya for the rest, and leaves, all within thumb reach.
FIRST VIEWPORT: Room portrait: compact top row (title + timer left; signal and participant count right), a two-column grid of tall tiles with page dots, and a labelled bottom bar (Mic, Kamera, Reaksi, Chat, Lainnya, Keluar set apart).
FORM: Bottom bar + sheets, from the approved plan docs/PLAN - Mobile.md. No concept roll: this is an adaptation of an established world to a new viewport, not a new surface.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
