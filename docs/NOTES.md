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

## Keputusan tambahan (M3-M6, drag reorder, mesh)
- Animated emoji: `@usespaceui/emoji` 0.1.0 (MIT) dengan paket Telegram anim. Aset dimuat dari `cdn.spaceui.one` saat runtime (butuh internet; offline jatuh ke glyph native). Lisensi artwork Telegram TIDAK tercakup MIT library. Satu saklar: `EMOJI_PACK` di `src/emoji/registry.ts` (mis. ganti ke `noto`, CC BY 4.0, atribusi diperlukan).
- Bundle: library emoji kini lazy-load (chunk terpisah), jadi bundel utama ~154 KB gzip (di bawah anggaran PRD 300 KB). Chunk `lottie` (78 KB gzip, peringatan `eval` dari lottie-web) hanya dimuat bila format Lottie dipakai; paket Telegram anim memakai WebP sehingga tidak termuat. Sebelum chunk emoji tiba, emoji native tampil sebagai pengganti.
- Mesh ambient: gerak diperbesar (jalur 4 titik, 30-38 dtk, perjalanan ~25-40 vmax) atas permintaan; opacity tetap 0,08-0,14 (Design.md 5.3 meminta +-8 vmax dan 50-70 dtk).
- Drag-and-drop kartu: Motion `drag` + `layout`, reorder saat pointer masuk kartu lain (cooldown 260 ms); keyboard Alt+panah. Dimatikan saat share screen. Urutan tidak disimpan.
- Layout tile memakai posisi absolut hasil hitung JS (bukan flex) agar kartu tidak remount saat grid <-> share screen (FLIP lewat Motion `layout`).
- Share screen: frame tumbuh dari kartu presenter lewat `clip-path` (konten tidak melar). Strip kanan maks 4 kartu + pager; kartu di luar halaman disembunyikan dan tanpa efek. Kartu <160 px tinggi: aurora diganti glow statis.
- Cincin hitung mundur (high five, soundboard, polling) dianimasikan lewat `stroke-dashoffset` pada SVG kecil (bukan transform); dianggap pengecualian kecil dari aturan "hanya transform/opacity/filter".
- High five: satu ajakan terbuka per orang, penyambut tercepat menang, maks 2 animasi tengah layar, jeda 3 dtk setelah kedaluwarsa. Klik tombol dock saat ada ajakan orang lain = menyambut yang tertua.
- Soundboard: 12 suara sintesis Web Audio (semua terverifikasi non-senyap lewat render offline); jeda global 3 dtk per pengirim; favorit di localStorage. "Izinkan soundboard" ada di panel Alat host dan Demo Director.
- Polling: satu poll aktif; suara peserta lain disimulasikan acak tiap 0,9-2,2 dtk; self selalu Host (role switcher belum ada). "Bagikan hasil ke chat" belum ada karena Chat belum dibuat.
- Panel samping: tab Peserta (daftar sederhana + antrean tangan), Polling (lengkap), Chat (placeholder), Alat host (hanya saklar soundboard). Sisa M7 belum dikerjakan.
- Tombol "Keluar" masih tanpa aksi.

## Keputusan tambahan (M7-M8)
- State dipecah menjadi slice reducer (); aksi didefinisikan di .
- Peserta: kolam 12 orang; selector 4/8/12 memindah orang ke/dari . "Keluarkan" memindah orang ke bench (jadi bisa kembali lewat selector).
- Role switcher (Demo Director > Tampilan) mengubah role "Anda": tombol Alat host hanya untuk Host/Co-host, polling hanya dibuat Host/Co-host, "Akhiri untuk semua" hanya Host, berbagi layar bisa dibatasi host. Dialog persetujuan rekaman hanya muncul untuk non-host.
- Jadikan host: peserta itu menjadi Host, Host sebelumnya turun menjadi Co-host.
- Tamu menunggu: Setujui/Tolak hanya menghapus dari daftar dan memunculkan chip pemberitahuan (tidak menambah kartu).
- Paginasi: 9 kartu per halaman saat >9 orang. Pembicara di halaman 2+ yang bicara terus 3 dtk ditukar dengan orang paling lama diam di halaman 1 (bukan Anda). Titik hijau di tombol pager muncul saat ada yang bicara di halaman lain. Pager ada di baris atas bersama chip status.
- Chat: pesan publik/pribadi, saran @mention (panah/Enter/Tab), indikator mengetik; badge unread hanya menghitung pesan dari orang lain yang belum dibaca. Waktu pesan memakai jam tiruan (mulai 10:40).
- Tier efek: Penuh/Hemat/Mati dari "Lainnya". Hemat: blur lebih kecil, mesh statis dengan opasitas setengah, kartu kamera mati tetap beraurora tetapi tipis (opasitas ~35%, tanpa ring riak; kartu <160 px tetap glow statis), satu comet tanpa glow dominan, tanpa percikan high five. Mati: glass solid, tanpa mesh, tanpa aurora (hanya ring avatar), border neon statis, emoji native, high five hanya chip + bunyi (Mati juga dihitung sebagai reduced motion).
- Penurunan tier otomatis berdasarkan frame time (Design.md 19.2) TIDAK dibuat: di lingkungan uji headless ia akan selalu terpicu, dan prototype ini sengaja memberi kontrol manual.
- Skenario otomatis memakai aksi reducer yang sama dengan tombol Demo Director. PRD 10 menjadwalkan ajakan high five Raka di 1:25 dan sambutan Dewi di 1:32, tetapi jendela ajakan 6 dtk (Design.md 11.3) membuatnya kedaluwarsa; sambutan dipercepat ke 1:30.
- Simulasi reduced motion tersedia di Demo Director; media query OS tetap dihormati.
- Belum dikerjakan: webcam asli untuk tile Anda (F20, P2), tombol "Bagikan hasil ke chat" pada polling, menu perangkat mic/kamera, "Intensitas efek tepi" (PRD 15 no.2).
