# Plan: Dashboard (Huddle)

Status: **disetujui dan dibangun** (susunan "Satu bar perintah"). Jawaban pertanyaan bagian 10: 1) ruang tunggu dan sandi tampil sebagai UI saja, 2) Room saya masuk, 3) Rekaman dan Pengaturan placeholder, 4) undangan hanya salin teks, 5) diasumsikan sudah login. Keputusan implementasi ada di `docs/NOTES.md`.
Acuan: Zoom (web portal + Workplace Home), Google Meet (home + Calendar), `Design.md` (Huddle Aurora), `PRODUCT.md`.

## 1. Tujuan

Dashboard adalah pintu masuk setelah login. Pengguna harus bisa dalam satu layar: **mulai rapat sekarang, masuk pakai kode, membuat room, menjadwalkan rapat, dan melihat rapat berikutnya**. Mode desain: **Operate** (selesaikan tugas cepat, terbaca sekilas).

Sukses: dari buka halaman sampai berada di lobby tidak lebih dari 2 klik untuk skenario umum (rapat dadakan, masuk lewat kode, masuk rapat terjadwal berikutnya).

## 2. Ringkasan riset

| Aspek | Zoom | Google Meet |
|---|---|---|
| Titik masuk | Home: empat tombol besar (New meeting, Join, Schedule, Share screen), jam + tanggal, daftar rapat hari ini | Satu tombol **New meeting** + kolom "Enter a code or link" + Join |
| Buat rapat | New meeting (langsung mulai) atau Schedule | New meeting menu: *Create a meeting for later*, *Start an instant meeting*, *Schedule in Google Calendar* |
| Penjadwalan | Form: topik, deskripsi, tanggal + jam, durasi, zona waktu, recurring, tipe meeting ID (otomatis / Personal Meeting ID) | Lewat Google Calendar (tab baru, detail Meet terisi otomatis) |
| Keamanan | Passcode, waiting room, hanya pengguna terautentikasi, enkripsi | Host controls (ikon perisai): izin share layar, chat, mute semua; mode akses (terbuka / terpercaya / terbatas) |
| Daftar rapat | Tab Upcoming / Previous / Personal Room / Templates; ada Start, Edit, Copy invitation, Delete | Rapat terjadwal muncul di kartu "upcoming" dan di Calendar |
| Lain-lain | Personal Meeting Room (ID tetap), template, recordings, rapat berulang (seri tidak bisa diedit per sesi di beberapa kasus) | Link rapat dibuat sekarang, dipakai nanti; rapat dadakan langsung masuk |

Sumber: [UGA - jadwal Zoom](https://uga.teamdynamix.com/TDClient/3190/eitsclientportal/KB/ArticleDet?ID=154372), [Bowdoin - Create a Zoom Meeting](https://bowdoin.teamdynamix.com/TDClient/1814/Portal/KB/Article/66101/Create-a-Zoom-Meeting?SIDs=12370), [CWRU - Schedule Options](https://case.edu/utech/zoom/host/), [9to5Google - Meet homepage](https://9to5google.com/2021/01/08/new-google-meet-homepage/), [TechRadar - opsi buat meeting](https://www.techradar.com/news/google-meet-will-soon-give-you-extra-options-for-creating-a-meeting), [WFU - Google Meet](https://help.wfu.edu/support/solutions/articles/13000036614).

Belum terverifikasi: label persis di UI Zoom/Meet terbaru (kebanyakan sumber panduan kampus dan artikel 2021, UI sering berubah) dan struktur sidebar Zoom Workplace terbaru. Pola umumnya konsisten di semua sumber.

**Keputusan dari riset:**
- Dari Meet: satu tombol **Buat rapat** dengan menu tiga opsi + kolom kode di sebelahnya. Ini pola paling cepat untuk 80% kasus.
- Dari Zoom: kartu rapat berikutnya + daftar Upcoming / Sebelumnya, dan form jadwal lengkap (durasi, berulang, keamanan). Meet menyerahkan ini ke Calendar, tapi kita tidak punya Calendar, jadi form jadwal harus ada di dalam Huddle.
- **Tidak** diambil: tab "Personal Room dengan ID tetap" dibuat sebagai bagian dari "Room saya" (lihat fitur 4), tapi tanpa konsep template Zoom (ditunda).

## 3. Cakupan fitur (usulan, perlu kamu cek)

**A. Mulai dan masuk (hero)**
1. **Rapat dadakan**: buat room, langsung ke lobby.
2. **Buat room untuk nanti**: dapat tautan `huddle.dibimbing.id/abc-defg-hij`, salin, belum mulai.
3. **Masuk dengan kode atau tautan**: validasi format `abc-defg-hij`, tempel tautan penuh juga diterima, error jelas bila format salah atau room tidak ditemukan.
4. **Room saya (ruang pribadi)**: satu tautan tetap milik pengguna, tombol Mulai + Salin tautan.

**B. Jadwalkan rapat**
5. Form jadwal (dialog/panel samping): judul, deskripsi, tanggal, jam mulai, durasi, zona waktu, daftar undangan (input email bebas, chip), berulang (tidak / harian / mingguan / bulanan), ID room otomatis atau pakai Room saya.
6. Opsi keamanan: waiting room (jika ruang tunggu host nanti dibangun), kode sandi, mikrofon dan kamera peserta mati saat masuk.
7. Hasil setelah simpan: kartu konfirmasi dengan tautan + tombol **Salin undangan** (teks undangan siap tempel).
8. Edit, batalkan, duplikat jadwal. Edit rapat berulang: tanya "hanya sesi ini" atau "seluruh seri".

**C. Daftar rapat**
9. **Berikutnya** (kartu menonjol): rapat terdekat, hitung mundur, tombol **Mulai / Masuk** aktif 10 menit sebelum jadwal, daftar peserta.
10. **Hari ini / Mendatang** dikelompokkan per hari, dengan status (akan mulai, sedang berlangsung, selesai).
11. **Sebelumnya**: riwayat dengan durasi, jumlah peserta, dan tautan rekaman (placeholder).
12. Pencarian dan filter (saya host / saya diundang), kosong state yang membantu.

**D. Kerangka halaman**
13. Sidebar navigasi: Beranda, Rapat, Rekaman, Pengaturan. Hanya Beranda dan Rapat yang berfungsi; sisanya placeholder "segera hadir".
14. Header: sapaan + jam + tanggal, profil pengguna, status koneksi.
15. Shortcut: `N` rapat dadakan, `J` fokus ke kolom kode, `S` jadwalkan.

**Ditunda:** kalender bulanan penuh, template rapat, integrasi Google/Outlook Calendar, notifikasi nyata, rekaman sungguhan, halaman Pengaturan, admin, mobile.

> Fitur 6 (waiting room) dan 11 (rekaman) hanya muncul sebagai opsi UI. Sesuai `PRODUCT.md`, ruang tunggu host masih ditunda, jadi toggle-nya perlu kamu putuskan: tampil atau disembunyikan dulu.

## 4. Alur utama

```
Dashboard
 ├─ Rapat dadakan ───────────────→ Lobby (PreJoin) → Room
 ├─ Buat untuk nanti → dialog tautan (salin) → kembali ke Dashboard
 ├─ Masuk kode/tautan ───────────→ Lobby → Room
 ├─ Room saya → Mulai ───────────→ Lobby → Room
 ├─ Jadwalkan → form → konfirmasi → muncul di daftar
 └─ Kartu Berikutnya → Masuk ────→ Lobby → Room
Room "Keluar" / "Mulai ulang demo" → kembali ke Dashboard (sekarang ke Lobby)
```

Perubahan `phase` di `App.tsx`: `'dashboard' | 'prejoin' | 'room'`. Lobby menerima `meeting` (kode, judul, host) dari dashboard sehingga `MeetingInfo` tidak hardcode.

## 5. Data dan state (prototype, tanpa backend)

Semua data tiruan, disimpan di memori dengan persist ke `localStorage` (agar jadwal yang dibuat tidak hilang saat refresh).

```ts
type Meeting = {
  id: string            // abc-defg-hij
  title: string
  description?: string
  startsAt: string      // ISO
  durationMin: number
  timezone: string
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly'
  invitees: string[]
  hostName: string
  security: { passcode?: string; muteOnJoin: boolean }
  status: 'scheduled' | 'live' | 'ended' | 'cancelled'
}
```

- `meetingStore.ts`: reducer murni (tambah, edit, batalkan, duplikat, ekspansi rapat berulang) agar mudah dites.
- `schedule.ts`: fungsi murni: validasi form, bentuk kode meeting, ekspansi recurrence ke instance, hitung status ("mulai 10 menit lagi"), kelompokkan per hari, buat teks undangan.
- Seed 6-8 rapat contoh (campuran hari ini, besok, minggu depan, yang sudah lewat) dalam Bahasa Indonesia, nama peserta konsisten dengan data room.
- Zona waktu: default `Asia/Jakarta`; format tanggal Indonesia lewat `Intl.DateTimeFormat('id-ID')`.

## 6. Rencana teknis

Struktur baru `src/dashboard/`:

| File | Tanggung jawab |
|---|---|
| `Dashboard.tsx` + `.module.css` | Layout halaman, merangkai bagian |
| `Sidebar.tsx` | Navigasi kiri |
| `Greeting.tsx` | Sapaan, jam hidup, tanggal |
| `QuickActions.tsx` | Tombol Buat rapat (menu 3 opsi) + kolom kode + Room saya |
| `JoinByCode.tsx` | Input kode/tautan + validasi |
| `NextMeetingCard.tsx` | Kartu rapat berikutnya + hitung mundur |
| `MeetingList.tsx`, `MeetingRow.tsx` | Daftar per hari, aksi per baris (menu) |
| `ScheduleDialog.tsx` | Form jadwal (fokus terjebak di dialog, `Esc` menutup) |
| `InviteeInput.tsx` | Input chip email |
| `InvitationPanel.tsx` | Hasil + salin undangan |
| `meetingStore.ts`, `schedule.ts`, `meetingCode.ts` | Logika murni |
| `dashboardShortcuts.ts` | Peta shortcut |
| `dashboard.test.ts` | Vitest untuk logika murni |

Perubahan di file yang ada:
- `src/App.tsx`: tambah `phase` dashboard, oper `Meeting` ke lobby, jalur kembali dari room.
- `src/prejoin/MeetingInfo.tsx` dan `PreJoin.tsx`: terima props meeting (judul, kode, host) alih-alih nilai tetap.
- Tidak menyentuh logika room.

Catatan teknis:
- Dialog memakai elemen `<dialog>` atau pola portal yang sudah ada di panel room; tidak menambah library baru kecuali perlu (date picker native `<input type="date/time">` dulu; custom picker hanya bila hasilnya jelek).
- Copy ke clipboard dengan fallback bila `navigator.clipboard` tidak tersedia.
- Hormati `prefers-reduced-motion`; mesh/aurora dashboard memakai tingkat efek yang sama dengan pengaturan room (Penuh / Hemat / Mati).

## 7. Arah visual

Mengikuti **Huddle Aurora**: gelap, glass hanya untuk chrome, aurora sebagai sinyal. Dashboard adalah mode **Operate**, jadi lebih tenang dari room: aurora **hanya** muncul sebagai (a) kartu "Berikutnya" yang mendekati jadwal dan (b) rapat yang sedang berlangsung. Selebihnya statis.

Prinsip:
- Hierarki skala: sapaan + jam besar (Sora), tombol Buat rapat paling menonjol, daftar rapat rapat dan padat.
- Bukan "sidebar + kartu statistik + grafik tanpa sudut pandang". Tidak ada kartu metrik dekoratif; isi halaman = tindakan dan jadwal.
- Status tidak hanya lewat warna (ikon + teks), kontras sesuai aturan token di `Design.md`.
- Kode meeting dan jam pakai JetBrains Mono.

Sketsa desktop 1440 x 900:

```
┌────┬─────────────────────────────────────────────────────────────┐
│ ◈  │ Selamat siang, Fachril                          10:42       │
│ Be │ Kamis, 15 Oktober                              [profil]     │
│ ra │                                                              │
│ nd │ ┌───────────────────────────┐  ┌──────────────────────────┐ │
│ a  │ │ [ + Buat rapat        ▾ ] │  │ BERIKUTNYA · 18 menit lagi│ │
│    │ │   Rapat dadakan           │  │ Sprint planning          │ │
│ Ra │ │   Buat untuk nanti        │  │ 11:00–11:45 · 5 peserta  │ │
│ pa │ │   Jadwalkan               │  │ [  Masuk  ]  [Salin tautan]│
│ t  │ ├───────────────────────────┤  └──────────────────────────┘ │
│    │ │ [ Masukkan kode/tautan ][Masuk]                           │
│ Re │ │ Room saya  huddle…/fa-chr-il  [Mulai] [Salin]             │
│ ka │ └───────────────────────────┘                               │
│ ma │                                                              │
│ n  │  Hari ini        │ Mendatang │ Sebelumnya     [cari…] [filter]│
│    │  11:00  Sprint planning ........ Host   [Mulai]  [⋯]        │
│ Pe │  14:00  Review desain .......... Diundang [Masuk] [⋯]        │
│ ng │  Besok                                                       │
│ at │  09:30  1:1 Dewi ............... Host   [Edit]   [⋯]        │
└────┴─────────────────────────────────────────────────────────────┘
```

## 8. Urutan eksekusi (setelah plan disetujui)

1. **Struktur layout**: buat 3 opsi susunan dashboard (dalam dunia Aurora), kamu pilih satu; hasilnya dikunci sebagai kontrak arah.
2. **Logika dulu (TDD)**: `meetingCode`, `schedule`, `meetingStore`, `dashboardShortcuts` beserta test Vitest.
3. **Kerangka**: Sidebar, header, layout, state `phase`.
4. **Hero**: Buat rapat (menu), kode masuk, Room saya, kartu Berikutnya.
5. **Daftar rapat**: pengelompokan, baris, aksi, empty state, pencarian.
6. **Form jadwal**: validasi, berulang, undangan, konfirmasi + salin undangan, edit/batalkan.
7. **Integrasi**: alur dashboard → lobby → room → kembali; `MeetingInfo` dinamis.
8. **Verifikasi**: `npm run typecheck`, `npm test`, `npm run build`; uji manual di browser; screenshot desktop (satu putaran batch).
9. **Review akhir** oleh reviewer terpisah, perbaiki, update `Design.md` dan `docs/NOTES.md`, commit.

## 9. Edge case yang diuji

1. Kode salah format, kosong, spasi di tepi, huruf besar; tautan penuh ditempel.
2. Kode valid tapi room tidak ada (tiruan: hanya kode seed + Room saya yang dikenali).
3. Jadwal di masa lalu ditolak; durasi 0 atau terlalu panjang; judul kosong.
4. Rapat melewati tengah malam; pindah hari; zona waktu berbeda dari browser.
5. Rapat berulang: edit satu sesi vs seluruh seri; batalkan satu sesi.
6. Tombol Mulai/Masuk sebelum dan sesudah jendela 10 menit; rapat yang sedang berlangsung; rapat sudah selesai.
7. Daftar kosong (pengguna baru), hasil pencarian kosong.
8. Input undangan: email tidak valid, duplikat, banyak sekali (50+).
9. Judul sangat panjang dipotong tanpa merusak baris.
10. Clipboard ditolak atau tidak tersedia.
11. `localStorage` penuh/diblokir: aplikasi tetap jalan dengan data seed.
12. Navigasi keyboard penuh: menu Buat rapat, dialog (fokus terjebak, `Esc`, fokus kembali ke pemicu), shortcut tidak aktif saat mengetik.
13. `prefers-reduced-motion` dan tingkat efek Hemat/Mati.
14. Layar di bawah 1100 px: pakai layar "terlalu sempit" yang sudah ada.

## 10. Pertanyaan untuk kamu

1. **Waiting room / kode sandi** di form jadwal: tampil sebagai opsi UI (tidak berfungsi), atau disembunyikan dulu karena ruang tunggu host ditunda?
2. **Room saya (ID tetap)**: masuk cakupan, atau cukup "Rapat dadakan" dan "Buat untuk nanti"?
3. **Sidebar**: tiga item placeholder (Rekaman, Pengaturan) ditampilkan atau disembunyikan sampai ada halamannya?
4. **Undangan**: cukup salin teks/tautan, atau perlu simulasi "kirim email" (toast sukses)?
5. **Login**: dashboard diasumsikan sudah login (nama pengguna tiruan "Fachril"). Setuju, atau perlu layar login dulu?

## 11. Di luar cakupan

Backend, autentikasi nyata, kalender penuh dan sinkronisasi Google/Outlook, email undangan nyata, rekaman sungguhan, admin, mobile. Room tetap simulasi.
