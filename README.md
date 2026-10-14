# Huddle Room Prototype

Prototype demo UI/UX untuk satu screen: ruang meeting Huddle ("Huddle Aurora").
Semua peserta, suara, dan kejadian adalah tiruan. Tidak ada backend, video/audio nyata, atau jaringan.

Acuan: `Design.md` (visual/perilaku) > `PRD.md` / `docs/PRD - Room Meeting.md` (scope) > wireframe (susunan saja).

## Menjalankan

```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck
npm run build
```

Bun tidak terpasang di mesin pengembangan, jadi dipakai npm.

## Demo Director

Tekan `Shift+D` untuk membuka/menutup panel kontrol demo (di luar produk), atau klik tombol "Demo" di kiri atas.

## Yang bisa dicoba

- **Mode otomatis**: Demo Director > Skenario > Putar. "Brainstorm sprint" berjalan sekitar 4 menit tanpa campur tangan; ada skenario pendek (Aurora, High five, Share screen, Voting) dan kecepatan 1x/1,5x. Tutup panel dengan  saat presentasi.
- **Bicara**: Demo Director > Aksi massal, atau per peserta (Bicara, Natural, slider level). Matikan mic Anda lalu "Bicara" pada baris Anda untuk neon amber + banner.
- **Pindahkan kartu**: seret kartu ke kartu lain (atau fokus kartu, tahan Alt + panah).
- **Angkat tangan, reaction, high five**: tombol di dock; peserta lain lewat Demo Director > Kejadian cepat.
- **Share screen**: tombol Bagikan layar, atau "Peserta berbagi layar" di Demo Director.
- **Soundboard dan polling**: tombol Soundboard di dock; Polling di pil kanan bawah.
- **Panel samping**: Peserta (cari, antrean tangan, menu aksi host), Chat (pribadi, @mention), Polling, Alat host (tamu menunggu, kunci, pengumuman, rekaman).
- **Keluar**: tombol merah di dock; "Akhiri untuk semua" khusus Host. Layar penutup punya tombol "Mulai ulang demo".
- **Tampilan**: Demo Director > Tampilan mengatur jumlah peserta (4/8/12; 12 = dua halaman), tingkat efek (Penuh/Hemat/Mati, juga di "Lainnya"), simulasi reduced motion, dan role Anda (Host/Co-host/Peserta/Tamu).
- Animated emoji dimuat dari CDN (butuh internet); tanpa internet tampil emoji native.

## Tahap

M0 sampai M8 selesai. Hal yang sengaja belum ada tercatat di bagian akhir .

Catatan keputusan dan inkonsistensi dokumen: `docs/NOTES.md`.
