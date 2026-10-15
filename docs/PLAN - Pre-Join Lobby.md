# Plan: Pre-Join Lobby (Huddle)

Status: **menunggu persetujuan**. Belum ada kode lobby.
Acuan: Google Meet (green room), Zoom (video preview + tes audio), `Design.md` (Huddle Aurora), `PRODUCT.md`.

## 1. Tujuan

Sebelum masuk room, pengguna memastikan kamera, mic, dan speaker berfungsi, mengisi nama, lalu menekan **Masuk**. Lobby tidak boleh memblokir: kalau izin ditolak atau perangkat tidak ada, pengguna tetap bisa masuk.

Sukses: pengguna yakin perangkatnya siap, dan tidak ada kejutan (mic mati, kamera salah) saat sudah di dalam room.

## 2. Ringkasan riset

| Aspek | Google Meet | Zoom |
|---|---|---|
| Layout | Preview kamera besar di kiri, panel "Ready to join?" di kanan | Dialog video preview, lalu dialog audio terpisah |
| Cek kamera | Preview langsung | Preview + "Join with/without Video" |
| Cek mic | Bar level bergerak saat bicara | Bicara, input level, lalu playback rekaman |
| Cek speaker | "Test speakers" memutar nada | Nada tes, konfirmasi "Ya, terdengar" |
| Pilih perangkat | Dropdown mic / speaker / kamera di bawah preview | Dropdown di dialog audio dan di settings |
| Lain-lain | Efek, cek jaringan, noise cancellation, tombol "Check your audio and video" | Opsi "Mute my mic when joining" |
| CTA | Join now / Ask to join | Join with Computer Audio |

Sumber: [Meet help](https://support.google.com/meet/answer/10409699), [9to5Google](https://9to5google.com/2021/02/02/google-meet-preview-video/), [PopSci](https://www.popsci.com/story/technology/google-meet-green-room-camera-microphone-check/), [IU Training Zoom](https://ittraining.iu.edu/explore-topics/titles/zoom-participant-edition/index.html), [meetergo](https://meetergo.com/en/magazine/zoom-test).

Belum terverifikasi: efek di pre-join Meet, dan nama persis opsi "always show preview" di Zoom.

**Keputusan dari riset:** ambil layout satu layar ala Meet (preview besar + panel kanan) karena lebih cepat dipindai. Dari Zoom ambil tes mic bertahap dengan playback rekaman, karena menjawab "mic gua beneran jalan?" lebih pasti daripada bar level saja.

## 3. Cakupan fitur (disetujui: semua, desktop dulu)

**Inti**
1. Preview kamera langsung (mirror) + toggle kamera.
2. Level mic real-time.
3. Tes speaker (putar nada).
4. Dropdown kamera, mic, speaker.
5. Tombol **Masuk** (CTA utama).
6. Input nama tampilan bebas, wajib diisi.
7. Toggle mic/kamera sebelum masuk, state dibawa ke room.

**Error handling**
8. Izin ditolak: kartu cara mengizinkan di browser, tetap bisa masuk sebagai penonton.
9. Tanpa perangkat / perangkat dipakai aplikasi lain: pesan spesifik per kasus.
10. Perangkat dicabut atau diganti: deteksi `devicechange`, fallback otomatis ke perangkat default.

**Nilai tambah**
11. Pilihan kualitas kamera (pakai `src/room/cameraQuality.ts`).
12. Aurora reaktif suara di tile preview (pakai komponen `src/tile/Aurora`).
13. Info meeting: kode `abc-defg-hij`, host, jumlah peserta di dalam.
14. Shortcut: `Enter` masuk, `M` mic, `V` kamera (konsisten dengan `src/room/shortcuts.ts`).
15. Checklist status perangkat: Kamera, Mic, Speaker, masing-masing Siap / Perlu dicek / Belum dites.

**Ditunda:** background blur/virtual background, noise cancellation, cek jaringan, layar menunggu admit host, mobile.

## 4. Alur dan state

```
App
 ├─ phase = 'prejoin'  → <PreJoin />
 └─ phase = 'room'     → <Room />   (state awal dari hasil lobby)
```

Hasil lobby yang dikirim ke room: `displayName`, `micOn`, `camOn`, `deviceIds {camera, mic, speaker}`, `cameraQuality`.

State izin per jenis media (kamera dan mic masing-masing):
`idle → requesting → granted | denied | no-device | in-use | error`

Aturan:
- Tombol **Masuk** aktif selama nama terisi, apa pun state media.
- Jika media tidak `granted`, room dimulai dengan toggle yang bersangkutan mati dan disabled.
- Semua track dihentikan saat masuk room atau lobby di-unmount (tidak ada lampu kamera menyala tertinggal).

## 5. Rencana teknis

Struktur baru `src/prejoin/`:

| File | Tanggung jawab |
|---|---|
| `PreJoin.tsx` + `.module.css` | Layout lobby, merangkai semua bagian |
| `useMediaPreview.ts` | `getUserMedia`, `enumerateDevices`, `devicechange`, ganti perangkat, cleanup |
| `mediaState.ts` | Reducer murni state izin/perangkat (mudah dites) |
| `micLevel.ts` | Hitung level dari `AnalyserNode` (RMS ke 0..1, smoothing), murni dan bisa dites |
| `CameraPreview.tsx` | Video mirror + Aurora + placeholder saat kamera mati |
| `MicMeter.tsx` | Bar level + tes mic bertahap (rekam ±3 dtk, playback) |
| `SpeakerTest.tsx` | Putar nada lewat `audioEngine`, mendukung `setSinkId` bila tersedia |
| `DevicePicker.tsx` | Dropdown perangkat (keyboard accessible) |
| `DeviceChecklist.tsx` | Ringkasan status 3 perangkat |
| `PermissionHelp.tsx` | Kartu bantuan izin ditolak / tidak ada perangkat |
| `MeetingInfo.tsx` | Kode meeting, host, jumlah di dalam |
| `prejoinShortcuts.ts` | Peta shortcut (sejalan `shortcuts.ts`) |

Perubahan di file yang ada:
- `src/App.tsx`: tambah `phase` dan oper hasil lobby ke `initialRoomState`.
- `src/state/roomReducer.ts`: terima nilai awal mic/kamera/nama.
- Tidak menyentuh logika room lain.

Catatan teknis:
- `setSinkId` hanya ada di Chromium; di browser lain, dropdown speaker disembunyikan dan tes speaker memakai output default.
- Label perangkat baru muncul setelah izin diberikan; sebelum itu tampilkan "Kamera 1", "Mikrofon 1".
- Hormati `prefers-reduced-motion` (aurora dan animasi level dikurangi).

## 6. Arah visual

Mengikuti **Huddle Aurora** di `Design.md`: glassmorphism gelap, mesh gradient ambient, border neon, aurora. Tidak ada DESIGN.md baru; lobby adalah perluasan dunia yang sudah ada.

Sketsa desktop 1440 x 900:

```
┌──────────────────────────────────────────────────────────────┐
│  huddle                                         [status net] │
│                                                              │
│  ┌─────────────────────────────┐   ┌──────────────────────┐  │
│  │                             │   │ Siap bergabung?      │  │
│  │      PREVIEW KAMERA         │   │ abc-defg-hij · Host   │  │
│  │      (aurora reaktif)       │   │ 3 orang sudah di dalam│  │
│  │                             │   │                      │  │
│  │   [mic] [kamera]  [kualitas]│   │ Nama tampilan  [____]│  │
│  └─────────────────────────────┘   │                      │  │
│   Mic ▮▮▮▮▯▯  [Tes mic]            │ ✓ Kamera  ✓ Mic  ? Spk│ │
│   Kamera [▾]  Mic [▾]  Speaker [▾] │                      │  │
│                                    │ [        Masuk      ]│  │
│                                    └──────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

Prinsip: CTA **Masuk** adalah elemen paling menonjol; status perangkat tidak hanya lewat warna (ikon + teks); hover/focus/active dirancang, bukan default.

## 7. Urutan eksekusi (setelah plan disetujui)

1. **Struktur layout:** buat 3 opsi susunan layar (dalam dunia Aurora), kamu pilih satu; hasilnya dikunci sebagai kontrak arah.
2. **Logika dulu (TDD):** `mediaState`, `micLevel`, `prejoinShortcuts` beserta test Vitest.
3. **Hook media:** `useMediaPreview` (izin, perangkat, `devicechange`, cleanup).
4. **UI bertahap:** preview, picker, meter, tes speaker, checklist, error states, info meeting, nama + CTA.
5. **Integrasi:** `phase` di `App.tsx`, oper state ke room.
6. **Verifikasi:** `npm run typecheck`, `npm test`, `npm run build`; uji manual di browser (izin ditolak, tanpa kamera, cabut perangkat); screenshot desktop.
7. **Review akhir** oleh reviewer terpisah, perbaiki, lalu update `DESIGN.md` dan `docs/NOTES.md`, commit.

## 8. Edge case yang diuji

1. Izin kamera ditolak, mic diizinkan (dan sebaliknya).
2. Kedua izin ditolak, tetap bisa masuk.
3. Tidak ada kamera / tidak ada mic sama sekali.
4. Perangkat dipakai aplikasi lain (`NotReadableError`).
5. Perangkat dicabut saat di lobby, lalu dicolok lagi.
6. Nama kosong atau hanya spasi: Masuk disabled; nama sangat panjang dipotong.
7. Tab di-background lalu kembali: preview tetap hidup.
8. Browser tanpa `setSinkId` (Firefox/Safari).
9. `prefers-reduced-motion` aktif.
10. Navigasi keyboard penuh, termasuk shortcut tidak aktif saat mengetik di input nama.
11. Track berhenti saat masuk room (tidak ada lampu kamera tertinggal).

## 9. Di luar cakupan

Backend, jaringan nyata, admit host, mobile, background effect, noise cancellation. Room tetap simulasi.
