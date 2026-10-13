# Catatan keputusan dan inkonsistensi dokumen

## Inkonsistensi dokumen
- `Design.md`, `PRD.md`, dan wireframe ada di root sekaligus di `docs/` (PRD & wireframe identik; `Design.md` hanya di root). PRD menyebut `docs/Design.md`. Tidak dipindah.
- Wireframe adalah HTML bundel; hanya dipakai untuk susunan layout.
- Design.md 6.3 menganimasikan `@property --a` (repaint); bentrok dengan aturan "hanya transform/opacity/filter".

## Keputusan (opsi paling sederhana)
- Package manager: npm (bun tidak terpasang).
- Vite di root repo, bukan sub-folder.
- Comet neon: elemen conic-gradient diputar dengan `transform: rotate()` dalam wrapper bermask ring; glow luar = layer statis dengan opacity dianimasikan.
- Kecepatan comet/blob mengikuti level via `Animation.playbackRate` (tanpa lompatan).
- `dotLottie` belum dipasang (baru M3).
- Level suara simulasi dianggap `L_raw` (tanpa rumus dB). Gate 0,12/0,08, attack 60 ms, release 280 ms, hold 400 ms, fade 600 ms.
- Dominan = level terhaluskan tertinggi di antara tile menyala; pergantian butuh unggul >=0,1 selama >=600 ms.
- Peserta lain dengan mic mati tidak menyala meski "bicara"; hanya "Anda" punya state amber mic-mati-tapi-bersuara.
- Chevron `Mic ▾`/`Kamera ▾` di dock dihilangkan (menu perangkat di luar scope).
- Cross-talk menghangatkan ambient (PRD 6.4) disertakan di M2, tanpa pergeseran warna.
- Semua warna/shadow/overlay adalah token di `tokens.css`.
