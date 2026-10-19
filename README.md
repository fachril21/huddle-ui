# Huddle Room Prototype

Prototype demo UI/UX untuk satu screen: ruang meeting Huddle ("Huddle Aurora").
Semua peserta, suara, dan kejadian adalah tiruan. Tidak ada backend, video/audio nyata, atau jaringan.

Acuan: `Design.md` (visual/perilaku) > `PRD.md` / `docs/PRD - Room Meeting.md` (scope) > wireframe (susunan saja).

## Menjalankan

```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck
npm test          # Vitest: logika murni (layout, reducer, shortcut, anotasi, suara)
npm run build
```

Bun tidak terpasang di mesin pengembangan, jadi dipakai npm.

## Demo Director

Tekan `Shift+D` untuk membuka/menutup panel kontrol demo (di luar produk), atau klik tombol "Demo" di kiri atas.

## Lobby sebelum masuk
Aplikasi dibuka di lobby: pratinjau kamera sungguhan, level mikrofon, tes speaker, pilihan perangkat, nama tampilan, lalu **Masuk** (`Enter`). Izin ditolak atau perangkat tidak ada tidak menghalangi masuk. Pintasan: `M` mic, `V` kamera. Lihat `docs/PLAN - Pre-Join Lobby.md`.

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
- **Pintasan keyboard**: tombol tunggal, tampil di tooltip tombol. `M` mic, `V` kamera, `S` share layar, `H` angkat tangan, `R` reaction, `5` high five, `B` soundboard, `C` chat, `P` peserta, `I` undang, `L` tampilan, `A` coret layar, `?` daftar pintasan (juga di "Lainnya"). Tahan `Spasi` untuk bicara sementara saat mic mati. Pintasan nonaktif saat mengetik dan saat dialog modal terbuka.
- **Pengaturan mikrofon**: panah kecil di sebelah tombol mic. Pilih mikrofon dan speaker, lihat level suara langsung, tes speaker. Mikrofon hanya dibuka saat mic menyala di meeting. Di HP: Lainnya > Atur mikrofon.
- **Pengaturan kamera**: panah kecil di sebelah tombol kamera. Pratinjau langsung, pilih kamera (HP: balik depan/belakang), lalu kualitas kirim. Di HP: Lainnya > Atur kamera.
- **Kualitas kamera** (di dalam pengaturan kamera): Rendah (360p), Sedang (720p), Tinggi (1080p); pilihan diingat di browser. Tile Anda menampilkan label resolusi dan tampak lebih lembut di Rendah. Saat koneksi Anda lemah muncul saran satu klik untuk turun ke Rendah.
- **Tampilan layar**: menu "Galeri" di kanan atas (`L`). Galeri, Pembicara (yang bicara tampil besar, strip di bawah), Sorotan (pin satu orang lewat ikon pin di kartu, strip di kanan), dan "Sembunyikan peserta tanpa kamera". Share screen selalu menimpa pilihan ini sampai selesai.
- **Suara**: 9 efek (MP3 di `src/audio/files`) dimainkan sesuai peristiwanya (mic mute/unmute, angkat tangan, mulai/berhenti share, chat masuk, orang masuk/keluar, koneksi tidak stabil). Volume lewat grup "Notifikasi" di "Lainnya".
- **Bubble chat**: pesan baru dari orang lain muncul di kiri bawah (maks 3, hilang 6 dtk, berhenti saat di-hover). Klik untuk membuka Chat.
- **Undang**: tombol di pil kiri bawah (`I`) atau "Undang lewat tautan" di panel Peserta. Salin tautan, Bagikan (Web Share bila ada), WhatsApp, Email.
- **Klaim host**: Demo Director > Kejadian cepat > "Host meninggalkan meeting" memunculkan banner. Co-host klaim langsung; yang lain memasukkan kunci host (tampil di Demo Director).
- **Coret layar**: saat ada yang berbagi layar, tombol "Coret layar" (`A`) membuka pena, stabilo, laser, penghapus, warna, urungkan, hapus, dan "Hilang otomatis". Host mematikannya untuk peserta lewat Alat host. Demo Director > "Peserta melingkari / menggarisbawahi / menggambar panah".
- Animated emoji dimuat dari CDN (butuh internet); tanpa internet tampil emoji native.

## Tahap

M0 sampai M9 selesai (M9: pintasan, kualitas kamera, mode layout, suara file, bubble chat, undang, klaim host, coret layar). Hal yang sengaja belum ada tercatat di bagian akhir .

Catatan keputusan dan inkonsistensi dokumen: `docs/NOTES.md`.
