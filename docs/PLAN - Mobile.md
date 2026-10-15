# Plan: Mobile view (Huddle)

Status: **selesai dibangun** (fase 0-5; verifikasi dengan emulasi sentuh, belum di HP fisik). Jawaban bagian 11: 1) tablet memakai layout desktop yang dirapatkan, 2) PiP melayang untuk 1:1, 3) bagikan layar tetap ada, 4) landscape phone didukung penuh, 5) zoom cubit ditunda.
Acuan: pola mobile Zoom dan Google Meet, panduan `adapt` Impeccable, `Design.md` (Huddle Aurora), `PRODUCT.md`, kode di `src/`.

## 1. Tujuan dan cakupan

Semua layar prototype bisa dipakai nyaman di HP, dengan semua interaksinya: **dashboard, lobby, room** (termasuk chat, peserta, polling, host, reaction, high five, soundboard, share screen, coret layar, layout, undang, keluar) dan layar penutup. Ini bukan memperkecil desktop. Konteks pemakaian berbeda: satu tangan, jempol, layar vertikal, keyboard layar yang menutup setengah layar, koneksi dan baterai terbatas.

Sukses: dari buka halaman sampai berada di room, lalu bereaksi, chat, dan keluar, semuanya bisa dilakukan dengan satu tangan di layar 360-430 px lebar, tanpa zoom, tanpa target sentuh yang meleset, dan tanpa elemen terpotong.

Berubah dari keputusan sebelumnya: `PRODUCT.md` dan `Design.md` bagian 21 menyebut "desktop dulu, mobile menyusul" dan layar "terlalu sempit" di bawah 1100 px. Setelah plan ini jalan, layar itu dihapus dan kedua dokumen diperbarui.

## 2. Ringkasan riset

| Aspek | Zoom (mobile) | Google Meet (mobile/web) |
|---|---|---|
| Kontrol | Toolbar muncul saat layar disentuh; Peserta langsung di toolbar, Chat di balik tombol "Lainnya" | Bilah bawah tetap: info, peserta, chat, aktivitas; tombol Keluar dipisah dari mic dan kamera supaya tidak tertekan tidak sengaja |
| Panel | Layar penuh atau lembar dari bawah | Lembar dari bawah |
| Catatan | Laporan pengguna: toolbar yang auto-hide membuat tombol "hilang" dan membingungkan | Redesain memindahkan semua kontrol ke bawah |

Sumber: [Trinity College - Participating in Zoom](https://edtech.domains.trincoll.edu/?p=6798), [Zoom community: toolbar hilang di Android](https://community.zoom.com/t5/Zoom-Meetings/No-toolbar-only-mute-button-on-android-phone/td-p/241316), [Zoom devforum: Chat vs Peserta](https://devforum.zoom.us/t/i-want-to-show-chat-ui-when-click-chat-button-at-bottom-bar/39977), [ChannelNews: redesain Meet](https://www.channelnews.com.au/google-meet-update-aims-to-make-meeting-more-immersive-inclusive-and-productive/).

Belum terverifikasi: posisi tile diri sendiri (PiP), perilaku lembar bawah, dan tata letak portrait kedua aplikasi. Hasil pencarian hanya sebagian dan sebagian artikelnya lama. Keputusan di bawah memakai pola umum mobile (panduan `adapt`) dan kebiasaan kedua aplikasi yang saya yakini, bukan salinan UI mereka. Kalau mau, bisa dicek ulang langsung di HP sebelum eksekusi.

**Keputusan dari riset:**
- Kontrol room tetap di **bilah bawah yang selalu terlihat** (tidak auto-hide di portrait), karena auto-hide terbukti membingungkan. Tombol Keluar dipisah jarak dari mic dan kamera.
- Hal sekunder masuk **lembar "Lainnya"** (ala Zoom), bukan semuanya di bilah.
- Panel dan popover jadi **lembar dari bawah** (bottom sheet): area jempol, bisa digeser turun untuk menutup.

## 3. Strategi responsif

| Kelas | Lebar | Perlakuan |
|---|---|---|
| Phone | sampai 767 px | Layout sendiri: tab bawah, lembar bawah, grid vertikal |
| Tablet | 768-1099 px | Layout desktop yang lebih rapat; panel jadi lembar melayang; target sentuh tetap 44 px |
| Desktop | 1100 px ke atas | Tidak berubah |

- **Phone landscape** (tinggi sampai 500 px): dianggap "tablet kecil": grid 16:9 seperti desktop, bilah bawah ramping, panel dari sisi kanan.
- Kode CSS yang ada ditulis desktop-first. Untuk menghindari penulisan ulang total, mobile ditambahkan sebagai **override `max-width`** di tiap modul CSS, ditambah `pointer: coarse` / `hover: none` untuk perilaku sentuh. Alasan: ~55 modul CSS yang sudah jadi dan teruji; membalik arah ke mobile-first berarti menyentuh semuanya dan berisiko merusak desktop.
- **JS hanya dipakai bila struktur atau hitungan berbeda**: satu hook `useViewport()` (`compact`, `medium`, `landscape`, `coarse`, `keyboardOpen`), dipakai untuk memilih komponen (tab bar vs rail, lembar vs popover) dan hitungan layout tile.
- Hormati `prefers-reduced-motion` dan tier efek yang ada. Default tier di HP: **Hemat** (blur kecil, mesh statis), bisa diganti dari Lainnya.

## 4. Fondasi (dipakai semua layar)

1. `index.html`: `viewport-fit=cover`, `theme-color` ink-950, matikan zoom ganda ketuk (`touch-action: manipulation`), `text-size-adjust: 100%`.
2. **Tinggi layar**: ganti `height: 100%` dengan `100dvh` agar bilah alamat iOS/Android tidak memotong kontrol bawah. `env(safe-area-inset-*)` untuk notch dan home indicator.
3. **Token sentuh**: `--tap: 44px`; tombol ikon di bawah 44 px dibesarkan area ketuknya (padding atau `::after`), bukan ukuran visualnya. Kontrol rapat desktop (36 px, chip 22 px) diperbesar di `pointer: coarse`.
4. **Input 16 px** di mobile (14 px sekarang memicu zoom otomatis iOS saat fokus).
5. **Tanpa hover**: tooltip dock, overlay tile saat hover, dan "Segera hadir" di rail diganti ketuk/tahan atau label tetap tampil. `:active` memberi umpan balik (skala/warna), `-webkit-tap-highlight-color` dibuat transparan.
6. `overscroll-behavior: contain` pada area yang bisa digulir (hindari pull-to-refresh di tengah rapat), `user-select: none` di kontrol.
7. **Komponen baru bersama**:
   - `Sheet` (lembar bawah): `<dialog>` native untuk fokus terkunci, pegangan geser, snap setengah/penuh, tutup lewat geser turun, tap latar, atau Esc. Konflik geser lembar vs gulir isi ditangani (geser hanya dari pegangan/header atau saat isi di paling atas).
   - `ResponsiveOverlay`: satu API yang merender popover di desktop dan `Sheet` di phone, supaya 8 popover room tidak ditulis dua kali.
   - `useViewport` + `ViewportProvider`, dengan fungsi murni `classifyViewport(width, height, coarse)` yang dites.
   - `useKeyboardInset` (memakai `visualViewport`) supaya input chat, form jadwal, dan nama di lobby tetap terlihat saat keyboard layar muncul.
8. Hapus layar "Layar terlalu sempit" (`App.tsx`, `Room.module.css`, `PreJoin.module.css`).

## 5. Dashboard (phone)

| Desktop | Phone |
|---|---|
| Rail ikon kiri | **Tab bar bawah**: Beranda, Rapat, Rekaman (segera), Pengaturan (segera); tinggi 56 px + safe area |
| Header sapaan + jam besar + profil | Sapaan 22 px + avatar; jam kecil di bawah tanggal; chip koneksi menjadi ikon |
| Bar perintah satu baris | **Bertumpuk**: tombol Buat rapat selebar layar (menu = lembar bawah), Jadwalkan sejajar dengan kolom kode; Room saya jadi baris ringkas (Mulai + Salin) |
| Strip rapat berikutnya | Kartu vertikal: judul, status + jam, tombol Masuk selebar kartu; tepi aurora tetap |
| Baris agenda 6 kolom | Dua baris: jam + judul + status; tumpukan peserta disembunyikan; **ketuk baris membuka lembar aksi** (Masuk/Mulai, Salin undangan, Salin tautan, Ubah, Duplikat, Batalkan). Menu ⋯ dihapus di phone |
| Halaman Rapat | Pencarian menempel di atas, segmented bisa digulir horizontal, label hari menempel saat digulir |
| Dialog Jadwalkan | **Layar penuh** (lembar 100%), header menempel, tombol Simpan menempel di bawah di atas keyboard; tanggal/jam memakai picker native; chip undangan bisa digulir |
| Dialog Undangan, Batal | Lembar bawah |
| Toast | Di atas tab bar |
| Shortcut N/J/S | Dinonaktifkan di perangkat sentuh |

## 6. Lobby (phone)

- **Portrait**: preview kamera memenuhi 100% lebar dan sekitar 45% tinggi di atas; di bawahnya panel yang bisa digulir: info rapat, nama, **Cek perangkat sebagai satu baris ringkasan yang dibuka jadi daftar** (kamera/mic/speaker), lalu tombol **Masuk menempel di bawah** (tinggi 52 px + safe area).
- Mic dan kamera: tombol bulat besar di atas preview. **Tombol balik kamera** (depan/belakang) bila perangkat punya lebih dari satu kamera (`facingMode`, `useMediaPreview`).
- Pilihan speaker disembunyikan (HP tidak mendukung `setSinkId`; logikanya sudah ada). Tes speaker tetap.
- Keyboard terbuka saat mengisi nama: preview mengecil ke 120 px, tombol Masuk tetap terlihat.
- Status izin ditolak / tanpa perangkat / dipakai app lain tetap, kartu bantuan dibuat ringkas dan tidak memotong layar. Pada iOS, preview bisa berhenti saat tab di-background; deteksi `visibilitychange` lalu mulai ulang.
- **Landscape**: preview kiri, panel kanan (seperti desktop yang lebih rapat).
- Tombol "Beranda" tetap di kiri atas, area ketuk 44 px.

## 7. Room (phone)

### 7.1 Tata letak tile (hitungan di `layoutMath.ts`, TDD)

- **Grid portrait**: 1 orang = satu tile penuh; 2 = dua baris; 3-4 = 2 x 2; 5-6 = 2 x 3. Tile mendekati portrait (kira-kira 3:4) agar mengisi layar yang tinggi; `RATIO` dijadikan parameter, tidak dipatok 16:9. **PAGE_SIZE = 6** di phone (9 tile terlalu kecil), dengan titik halaman dan geser horizontal untuk pindah halaman.
- **Speaker dan Sorotan**: tile fokus di atas, strip horizontal 3 tile kecil di bawah (bisa digulir).
- **Share screen**: bingkai layar 16:9 selebar layar di atas, strip peserta horizontal di bawahnya. Cubit untuk zoom dan geser pada bingkai (opsional, tahap akhir).
- **Dua orang**: tile lawan bicara penuh, tile Anda jadi **PiP kecil** di pojok yang bisa diseret dan menempel ke pojok terdekat (lihat pertanyaan 2).
- Seret-untuk-susun-ulang tile **dimatikan** di phone (bentrok dengan gulir); gantinya sematkan lewat ketuk tile.

### 7.2 Kontrol

- **Bilah bawah** (glass-3, 56 px + safe area): Mic, Kamera, Reaction, Chat (dengan badge), Lainnya, lalu **Keluar** dipisah jarak dan berwarna bahaya. Peserta pindah ke chip jumlah orang di bilah atas.
- **Lainnya** = lembar kisi 3 kolom: Angkat tangan, High five, Soundboard, Bagikan layar, Coret layar, Layout, Polling, Undang, Alat host (bila host), Pengaturan kamera, Tier efek, Rekaman/kunci status. Daftar pintasan keyboard disembunyikan di perangkat sentuh.
- **Bilah atas**: pil info (judul + timer) di kiri, chip jumlah peserta dan sinyal di kanan. Chip Merekam/Terkunci tampil sebagai ikon berlabel singkat dan satu baris. Menu Layout pindah ke Lainnya.
- Reaction: lembar pendek dengan baris emoji besar (target 48 px), tutup otomatis setelah memilih.
- Auto-hide kontrol **tidak dipakai** di portrait. Di landscape, bilah mengecil dan menyembunyikan label.

### 7.3 Panel dan fitur

| Fitur | Perlakuan di phone |
|---|---|
| Chat | Lembar 90% tinggi; daftar pesan + kolom ketik menempel di atas keyboard; saran @mention muncul di atas kolom; bubble chat di dalam room berada di atas bilah bawah, lebar maksimum 80% |
| Peserta | Lembar; pencarian menempel; aksi per peserta (mute, hapus, jadikan host) lewat ketuk baris yang membuka lembar kecil, bukan hover |
| Polling | Lembar; form buat polling layar penuh; kartu polling dengan target pilihan 48 px |
| Host | Lembar; daftar tamu menunggu dengan tombol Setujui/Tolak selebar baris |
| Undang | Lembar: tautan, Salin, dan **Bagikan** lewat share sheet bawaan HP (sudah ada `navigator.share`) |
| Soundboard | Lembar kisi; ketuk memutar; chip yang sedang bunyi di atas bilah |
| High five | Animasi tengah diskalakan; ajakan masuk sebagai kartu di atas bilah dengan tombol besar |
| Coret layar | Toolbar kecil di atas bilah; kanvas menangkap sentuh (`touch-action: none`); dua jari tetap untuk zoom (jika zoom bingkai dibuat) |
| Spanduk (pengumuman, klaim host, mute, saran kualitas) | Tumpuk penuh lebar di bawah bilah atas, maksimal dua sekaligus, sisanya antre |
| Persetujuan rekaman | Lembar penuh dengan satu tombol utama |
| Layar penutup | Kartu penuh lebar, tombol 52 px |
| Demo Director | Tombol Demo menjadi kecil di pojok; panel menjadi lembar bawah. `Shift+D` diganti ketuk |

### 7.4 Kinerja dan baterai

- Tier efek default **Hemat** di phone; aurora hanya di maksimal 2 tile yang sedang bicara (bukan 3); mesh statis.
- Hentikan loop animasi dan mesh saat tab di-background (`visibilitychange`).
- Hindari `backdrop-filter` bertumpuk: lembar memakai satu lapis kaca; tile tidak punya kaca.

## 8. Rencana teknis (ringkas)

File baru:

| File | Tanggung jawab |
|---|---|
| `src/mobile/viewport.ts` (+ test) | `classifyViewport`, konstanta breakpoint, tinggi keyboard dari `visualViewport` |
| `src/mobile/ViewportProvider.tsx`, `useViewport.ts` | Konteks `compact / medium / landscape / coarse` |
| `src/mobile/Sheet.tsx` + css | Lembar bawah umum (geser, snap, fokus, `<dialog>`) |
| `src/mobile/ResponsiveOverlay.tsx` | Popover di desktop, Sheet di phone |
| `src/dashboard/TabBar.tsx` | Navigasi bawah menggantikan `Rail` di phone |
| `src/dashboard/ActionSheet.tsx` | Lembar aksi baris rapat (menggantikan `Menu` di phone) |
| `src/room/MobileDock.tsx`, `MoreSheet.tsx` | Bilah bawah dan lembar Lainnya |
| `src/room/layoutMath.compact.ts` (+ test) | Grid portrait, speaker/spotlight/share vertikal, PAGE_SIZE phone |
| `src/room/SelfPip.tsx` | Tile diri sendiri melayang untuk 1:1 |

Perubahan di file yang ada: `index.html`, `base.css`, `tokens.css` (token sentuh), `App.tsx` (provider, hapus notice), `Dashboard.tsx`/`Modal.tsx`/`Menu.tsx` (presentasi sheet), `PreJoin*` (layout dan flip kamera), `Room.tsx`/`Dock.tsx`/`TopBar.tsx`/`SidePanel.tsx`/`TileGrid.tsx`/`Tile*`, semua popover room (`CameraPopover`, `ReactionPicker`, `SoundboardPopover`, `LayoutMenu`, `MorePopover`, `LeaveMenu`, `InvitePopover`), `ChatBubbles`, `PollToast`, `HighFiveStage`, dan `AnnotationLayer`/`Toolbar`. Logika room (reducer, suara, state) tidak berubah.

## 9. Urutan eksekusi (setelah plan disetujui)

Tiap fase diverifikasi dan di-commit sendiri.

0. **Fondasi**: viewport meta, `dvh`, safe area, token sentuh, `useViewport` + test, `Sheet`, `ResponsiveOverlay`, hapus layar "terlalu sempit".
1. **Dashboard**: tab bar, header, bar perintah bertumpuk, kartu rapat, baris + lembar aksi, form jadwal layar penuh, halaman Rapat.
2. **Lobby**: layout portrait/landscape, ringkasan cek perangkat, flip kamera, tombol Masuk menempel, penanganan keyboard.
3. **Room inti (TDD di layout math dulu)**: grid portrait + paging geser, speaker/sorotan/share vertikal, bilah bawah, bilah atas, lembar Lainnya, PiP 1:1.
4. **Room fitur**: chat (keyboard), peserta, polling, host, undang, reaction, soundboard, high five, coret layar sentuh, spanduk, persetujuan rekaman, layar penutup, Demo Director.
5. **Kinerja dan penyempurnaan**: tier efek, pause di background, landscape, tablet.
6. **Verifikasi**: `npm run typecheck`, `npm test`, `npm run build`; uji manual di browser pada 360 x 800, 390 x 844, 430 x 932, 320 x 568, landscape 844 x 390, tablet 768 x 1024 dan 820 x 1180, dengan emulasi sentuh dan, bila ada, HP asli (iOS Safari dan Chrome Android). Satu putaran tangkapan layar batch (dashboard, lobby, room: grid, share, panel, lembar) lalu satu putaran perbaikan.
7. **Review akhir** oleh reviewer terpisah, perbaiki, perbarui `PRODUCT.md`, `Design.md` (bagian mobile), `docs/NOTES.md`, lalu commit.

## 10. Edge case yang diuji

1. Lebar 320 px dan teks diperbesar 200%: tidak ada elemen terpotong atau gulir horizontal.
2. Keyboard terbuka di chat, form jadwal, nama lobby, polling: kolom input tetap terlihat; tombol utama tidak tertutup.
3. Rotasi di tengah rapat (portrait ke landscape): layout pindah tanpa kehilangan state (panel terbuka, halaman grid, sematan).
4. Notch dan home indicator: bilah bawah dan Masuk tidak tertimpa; mode landscape memakai inset kiri/kanan.
5. Bilah alamat iOS/Android naik turun: tinggi `dvh` stabil, tidak ada lompatan.
6. Gesek lembar vs gulir isi di dalamnya; gesek horizontal paging vs gesek tepi browser ("kembali").
7. Dua jari: cubit zoom bingkai share vs zoom halaman (halaman tidak boleh ikut zoom).
8. Kamera hanya satu: tombol flip tersembunyi. Izin kamera ditolak di mobile: kartu bantuan sesuai browser.
9. Tab di-background lalu kembali di lobby dan room.
10. Ketuk cepat berulang (reaction, mic) tidak memicu zoom ganda atau pilih teks.
11. Peserta 12+ di phone: paging 6 per halaman, pembicara di halaman lain tetap ditandai.
12. Nama dan judul panjang, email undangan panjang, banyak chip undangan.
13. Offline di dashboard: chip koneksi berubah, aksi tetap bisa.
14. Reduced motion dan tier efek Mati.
15. Navigasi keyboard eksternal di tablet tetap berfungsi (fokus terlihat); pintasan aktif lagi bila ada keyboard fisik (`pointer: fine`).

## 11. Pertanyaan untuk kamu

1. **Tablet (768-1099 px)**: pakai layout desktop yang dirapatkan (rekomendasi), atau pakai layout phone yang diperlebar?
2. **Tile diri sendiri di 1:1**: PiP melayang yang bisa diseret (rekomendasi, ala Zoom/Meet), atau tetap tile biasa di grid?
3. **Bagikan layar di phone**: tetap ada (disimulasikan, karena room memang simulasi), atau disembunyikan karena browser HP umumnya tidak mendukungnya?
4. **Landscape phone**: didukung penuh (rekomendasi, layout seperti desktop rapat), atau cukup petunjuk "putar ke vertikal"?
5. **Zoom cubit pada layar yang dibagikan**: dibuat di tahap akhir bila waktu cukup, atau ditunda?

## 12. Di luar cakupan

Aplikasi native atau PWA terpasang, notifikasi push, mode gambar-dalam-gambar sistem (PiP browser), webcam sungguhan di room (room tetap simulasi), background blur, dan uji di semua perangkat fisik (verifikasi memakai emulasi, ditambah HP asli bila tersedia).
