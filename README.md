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

Tekan `Shift+D` untuk membuka/menutup panel kontrol demo (di luar produk). Tersedia sejak M2.

## Yang bisa dicoba

- **Bicara**: Demo Director -> Aksi massal, atau per peserta (Bicara, Natural, slider level). Matikan mic Anda lalu "Bicara" pada baris Anda untuk neon amber + banner.
- **Pindahkan kartu**: seret kartu ke kartu lain (atau fokus kartu, tahan Alt + panah).
- **Angkat tangan, reaction, high five**: tombol di dock; peserta lain lewat Demo Director -> Kejadian cepat.
- **Share screen**: tombol Bagikan layar, atau "Peserta berbagi layar" di Demo Director.
- **Soundboard dan polling**: tombol Soundboard di dock; Polling di pil kanan bawah (Dewi bisa memulai polling contoh dari Demo Director).
- Animated emoji dimuat dari CDN (butuh internet); tanpa internet tampil emoji native.

## Tahap

M0 setup, M1 layout, M2 aurora + neon, M3 emoji/tangan/reaction/state kartu, M4 high five, M5 share screen, M6 soundboard + polling selesai. Berikutnya (PRD bagian 16): M7 panel Chat dan Alat host lengkap, menu Keluar, paginasi 12 peserta, role switcher; M8 skenario otomatis, tier efek, polish.

Catatan keputusan dan inkonsistensi dokumen: `docs/NOTES.md`.
