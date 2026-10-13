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

## Keputusan tambahan (M1-M2)
- Tombol "Keluar" di dock belum melakukan apa pun (layar penutup baru di M7).
- Tombol panel kanan (Peserta/Chat/Polling/Alat host) hanya menandai state aktif; panelnya M7. Badge: Peserta = 8, Chat = 1 (tiruan).
- Pil panel kanan memakai ikon + tooltip (tanpa teks label) agar tidak menabrak dock di 1280 px.
- Grid 8 peserta jadi 3-3-2 (baris terakhir di tengah) karena itu memberi tile terbesar di 1440x900.
- Aurora dirender di belakang avatar (teks Design.md 7.2), walau tabel 7.1 menulis aurora di z2 di atas avatar z1.
- Saat tile ke-4 menggeser tile yang kalah, tile yang kalah meredup 300 ms sehingga sesaat ada 4 tile ter-render (efek mahal tetap hanya 3 yang aktif bicara).
- Pembicara dominan: glow luar x1,3 diwujudkan sebagai layer kedua (shadow lebih besar) yang di-fade, bukan menganimasikan ukuran shadow.
- Banner "Mikrofon Anda mati" sedikit menimpa tepi atas grid; sementara (hanya saat terdeteksi).
- Reduced motion: attribute `data-motion="reduced"` di root room (mengikuti media query). Aurora/comet statis, ring riak dimatikan. Simulasi dari Demo Director menyusul (M8).
- `<AnimatedEmoji>` + registry sudah ada tetapi belum dipakai di UI (M3).
- Status tile "Merekam"/"Terkunci" (P2) belum dibuat; chip "Koneksi baik" sekadar statis.
