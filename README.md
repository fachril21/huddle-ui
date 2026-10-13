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

## Tahap

M0 setup · M1 layout room · M2 kartu peserta saat bicara (aurora + neon) · M3+ lihat PRD bagian 16.

Catatan keputusan dan inkonsistensi dokumen: `docs/NOTES.md`.
