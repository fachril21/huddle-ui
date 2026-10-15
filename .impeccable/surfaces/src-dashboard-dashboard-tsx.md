---
version: 1
slug: "src-dashboard-dashboard-tsx"
primary_target: "src/dashboard/Dashboard.tsx"
related_targets: []
---

# Surface brief: Dashboard

Mode: Operate. Desktop 1440x900 first. Inside the established Huddle Aurora world (Design.md); no new identity. Prototype: mock data, no backend, user assumed logged in as "Fachril".

Audience/job: signed-in host or invitee who must start, join, schedule, or find the next meeting in two clicks. Features researched from Zoom (Home, Schedule form, Upcoming/Previous, Personal Meeting Room) and Meet (New meeting menu, code field).
Constraints: UI-only options (waiting room, passcode) shown but inert; Rekaman and Pengaturan are placeholders; invitations are copied text only; reduced motion and keyboard complete; status never by color alone.

## Direction contract

THESIS: One wide command bar owns the top (make, schedule, or join with a code) and the agenda flows beneath it; refuses stat cards and the sidebar-plus-chart dashboard.
OWN-WORLD: Huddle Aurora: ink-950 ground, ambient mesh, glass-2/3 chrome, aurora cyan/mint/violet signals only for live or imminent meetings, Sora display, Plus Jakarta body, JetBrains Mono for times and codes; primary #5b5bf0.
STORY: Fachril opens the page, sees the next meeting and a command bar, presses Buat rapat or pastes a code, or schedules from the form; the agenda confirms what is next.
FIRST VIEWPORT: 88px icon rail left; greeting and live clock on one row; glass-3 command bar (Buat rapat menu, Jadwalkan, code field, Masuk, Room saya line); one next-meeting strip with aurora fringe when joinable; Hari ini list beneath, rows divided by hairlines.
FORM: Satu bar perintah (THE ROLL, structure index 7 of 7), seed key 97d4a795.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
