# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Campuran / publik: siapa saja yang punya tautan rapat (domain `huddle.dibimbing.id/abc-defg-hij`). Banyak yang pakai laptop biasa, koneksi dan perangkat bervariasi, sebagian baru pertama kali memakai video meeting. Pekerjaan mereka di lobby: memastikan kamera, mic, dan speaker berfungsi, lalu masuk.

Dashboard (buat dan jadwalkan rapat, rekaman, pengaturan) hanya untuk internal: masuk lewat Google atau kode email, dan hanya akun @dibimbing.id dan @cakrawala.ac.id yang diterima. Tamu yang membuka tautan rapat tidak perlu masuk.

## Product Purpose
Huddle adalah aplikasi video meeting. Repo ini adalah prototype UI/UX untuk layar room ("Huddle Aurora") dan sekarang lobby sebelum masuk. Sukses lobby: pengguna yakin perangkatnya siap dan masuk tanpa kejutan di dalam room.

## Capabilities and Constraints
- Prototype front-end saja: tanpa backend, peserta/suara/kejadian di room adalah tiruan.
- Lobby memakai media sungguhan (getUserMedia, enumerateDevices, AnalyserNode); room tetap simulasi.
- Cakupan lobby: preview kamera, level mic, tes speaker, pilih perangkat, nama tampilan bebas, toggle mic/kamera, penanganan izin ditolak / tanpa perangkat / perangkat dipakai aplikasi lain / perangkat dicabut, kualitas kamera, aurora reaktif di preview, info meeting, shortcut, checklist status.
- Ditunda: background blur/virtual background, noise cancellation, cek jaringan, layar menunggu admit host.
- Desktop (1440 x 900), tablet (768-1099 px), HP portrait (320-430 px) dan HP landscape didukung di dashboard, lobby, dan room. Di HP kontrol room ada di bilah bawah dan semua popover/panel menjadi lembar dari bawah.
- Stack: React + TypeScript + Vite, CSS Modules, Vitest, npm.

## Brand Commitments
Nama Huddle; arah visual sudah ditetapkan di `Design.md` ("Huddle Aurora"). Bahasa UI: Indonesia.

## Evidence on Hand
`Design.md`, `docs/PRD - Room Meeting.md`, wireframe room, kode room di `src/`. Belum ada wireframe lobby.

## Product Principles
- Kejelasan status perangkat di atas segalanya: pengguna selalu tahu apa yang jalan dan apa yang tidak.
- Jangan pernah memblokir pengguna: izin ditolak atau perangkat hilang tetap boleh masuk.
- Lobby dan room terasa satu dunia.

## Accessibility & Inclusion
Operasi penuh via keyboard, status tidak hanya lewat warna, hormati reduced motion.
