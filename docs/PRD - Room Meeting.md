# Huddle Room Prototype — PRD / Brief

| | |
|---|---|
| **Versi** | 0.1 (draft) |
| **Tanggal** | 2026-10-13 |
| **Scope** | **Hanya screen meeting room.** Beranda, login, pre-join, rekaman, admin tidak termasuk |
| **Jenis proyek** | Prototype demo UI/UX. **Bukan** produk produksi |
| **Dokumen terkait** | `Design.md` (gaya visual dan perilaku detail), `wireframe/` (wireframe v1) |

**Urutan acuan jika ada bentrok:** `Design.md` untuk gaya visual dan perilaku → PRD ini untuk scope, prioritas, dan kriteria selesai → wireframe v1 hanya untuk struktur layout (wireframe v1 masih flat dan memakai dock bar penuh; sudah digantikan Design.md).

---

## 1. Ringkasan

Huddle adalah platform online meeting yang menggabungkan kemudahan Zoom/Google Meet dengan rasa "hidup" ala Discord. Prototype ini mendemonstrasikan **pengalaman di dalam ruang meeting**: bagaimana kartu peserta bereaksi saat orang bicara, bagaimana emoji, high five, soundboard, dan polling terasa, serta bagaimana layout berubah mulus saat ada yang berbagi layar.

Prototype berjalan sepenuhnya di browser dengan **peserta, suara, dan kejadian tiruan**. Tidak ada koneksi video nyata, server, atau login. Semua kejadian dikendalikan lewat **Demo Director** (panel kontrol demo) atau skenario otomatis.

### 1.1 Tujuan

1. Memperlihatkan pengalaman visual dan interaksi "Huddle Aurora" secara nyata, bukan hanya gambar statis.
2. Menjadi bahan keputusan desain: tim bisa merasakan aurora, neon, high five, dan transisi sebelum engineer membangunnya.
3. Menjadi alat demo yang bisa dipresentasikan sendiri tanpa penjelasan panjang (±4 menit).

### 1.2 Bukan tujuan (non-goals)

- Tidak ada video, audio, atau jaringan nyata antar pengguna.
- Tidak ada backend, database, login, atau penyimpanan data.
- Tidak ada screen lain di luar room.
- Tidak ada layout mobile/tablet (desktop saja, lihat 7.1).
- Tidak ada pengoptimalan teknis mendalam; cukup lancar di laptop modern.
- Tidak ada pengujian otomatis.

---

## 2. Audiens dan cara dipakai

| Audiens | Kebutuhan |
|---|---|
| Tim produk dan stakeholder | Merasakan arah visual dan fitur baru, memberi keputusan |
| Engineer | Melihat perilaku dan timing yang diharapkan sebelum membangun |
| Desainer (pemilik proyek) | Menguji dan menyempurnakan ide sebelum diserahkan |

**Mode pemakaian:**
- **Eksplorasi bebas:** pengguna mengklik kontrol di dock (angkat tangan, reaction, dll.) dan memakai Demo Director untuk memicu kejadian "orang lain".
- **Mode otomatis (presentasi):** skenario berjalan sendiri sesuai skrip (bagian 6), pembawa cukup berbicara.

---

## 3. Sudut pandang prototype

- Pengguna adalah **"Anda"**, default berperan **Host**.
- **Role switcher** di Demo Director: Host · Co-host · Peserta · Tamu. Mengubahnya menyesuaikan UI (misal Peserta tidak melihat tombol Alat host). Prioritas P1.
- Ada **12 peserta tiruan** (bagian 11.1). Jumlah yang tampil bisa diatur 4 / 8 / 12.

---

## 4. Prinsip pengalaman

Mengacu ke `Design.md` bagian 1. Ringkasnya:

1. Video/avatar adalah tokoh utama; efek hanya mempertegas.
2. Cahaya selalu bermakna (bicara, tangan terangkat, koneksi).
3. Tenang saat diam, hidup saat ada aktivitas.
4. Satu momen, satu fokus.
5. Setiap efek punya versi hemat dan reduced-motion.

---

## 5. Daftar fitur dan prioritas

**P0 = wajib ada agar demo bermakna · P1 = penting · P2 = bagus bila sempat**

| # | Fitur | Prioritas | Ringkas |
|---|---|:-:|---|
| F1 | Layout room penuh layar + ambient background | P0 | Video memenuhi layar, background mesh aurora tipis |
| F2 | Glassmorphism (dock, panel, label, popover, toast) | P0 | Tiga tingkat glass |
| F3 | **Kartu peserta saat ada suara** (aurora + neon) | P0 | Fitur inti; lihat bagian 6 |
| F4 | State kartu lain (angkat tangan, AFK/BRB, koneksi buruk, menyambung ulang, mic mati) | P0 | |
| F5 | Angkat tangan dengan animated emoji | P0 | |
| F6 | Reaction (gaya Meet) dengan animated emoji | P0 | |
| F7 | **High five** | P0 | |
| F8 | Transisi share screen yang mulus | P0 | |
| F9 | Soundboard | P1 | |
| F10 | Polling | P1 | |
| F11 | Dock kontrol mengambang (mic, kamera, share, reaction, tangan, high five, soundboard, lainnya, keluar) | P0 | Sebagian besar kontrol hanya mengubah state tampilan |
| F12 | Panel samping: Peserta, Chat, Polling | P1 | Chat berfungsi lokal (pesan tiruan) |
| F13 | Panel Alat host (tamu menunggu, moderasi, rekaman) | P1 | Tampilan dan aksi tiruan |
| F14 | Menu Keluar: "Keluar" dan "Akhiri untuk semua" | P1 | |
| F15 | Paginasi grid dan promosi pembicara dari halaman lain | P1 | Berlaku saat 12 peserta |
| F16 | Pin peserta ke stage | P2 | |
| F17 | Badge Merekam, badge Meeting terkunci, dialog persetujuan rekaman | P2 | |
| F18 | Pengaturan "Efek visual" (Penuh / Hemat / Mati) | P2 | Untuk memperlihatkan versi hemat |
| F19 | Demo Director + skenario otomatis | P0 | Alat demo; bukan bagian produk |
| F20 | Webcam asli untuk tile "Anda" | P2 | Opsional, minta izin kamera |

---

## 6. Pengalaman inti: ketika ada suara masuk (F3)

Ini bagian paling penting dari prototype. Setiap peserta di prototype punya **level suara** (0 = hening, 1 = sangat keras) yang dikendalikan Demo Director atau skenario. Cara level dihitung adalah urusan engineer; di prototype cukup angka simulasi.

### 6.1 Dua jenis kartu

| | Kamera **mati** | Kamera **menyala** |
|---|---|---|
| Isi kartu | Avatar bulat di tengah (inisial + warna palet) | Video (placeholder) |
| Saat bicara | **Aurora** muncul mengelilingi avatar + border neon | **Glow tipis di tepi** + border neon (wajah tidak ditutupi) |
| Border neon | Ya | Ya |

### 6.2 Urutan kejadian pada satu kartu

**Kasus A — Raka (kamera mati) mulai bicara:**

| Waktu | Yang terjadi pada kartu Raka |
|---|---|
| 0 ms | Kartu diam. Border tipis, avatar di tengah |
| ~60 ms | Aurora **mulai tumbuh dari tepi avatar**, melebar ke sekeliling. Border neon menyala dan sebuah "kilatan cahaya" mulai berjalan mengelilingi tepi kartu |
| ~300 ms | Aurora bergejolak penuh: pita-pita warna (palet Raka) berputar pelan di belakang avatar. Label nama mendapat ikon equalizer kecil |
| Selama bicara | Intensitas mengikuti kerasnya suara (lihat 6.3). Saat suara melonjak, sesekali muncul **cincin riak** memuai dari avatar |
| Berhenti bicara | Cahaya **bertahan sebentar** (±0,4 detik) lalu **meredup halus** (±0,6 detik). Kilatan border melambat dan hilang. Kartu kembali tenang |

**Kasus B — Dewi (kamera menyala) bicara:**
Sama, tetapi tanpa aurora di tengah. Yang muncul: border neon dengan kilatan yang bergerak, dan cahaya lembut di tepi dalam kartu. Wajah tetap bersih.

### 6.3 Seberapa keras, seberapa terang

| Suara | Contoh | Aurora | Border neon |
|---|---|---|---|
| Hening | Tidak bicara | Mati | Mati |
| Pelan | Bisik, menggumam | Redup, kecil, bergerak lambat | Redup, kilatan lambat |
| Normal | Bicara biasa | Terang sedang, ukuran sedang | Terang sedang, kilatan sedang |
| Keras | Bersemangat | Terang, membesar, bergerak cepat | Terang, kilatan cepat |
| Sangat keras | Berteriak, tertawa lepas | Sangat terang, memenuhi kartu, cincin riak | Paling terang, kilatan paling cepat |

Perubahan intensitas harus **halus**, tidak boleh berkedip kasar saat level naik-turun cepat (rincian di `Design.md` 7.3).

### 6.4 Banyak orang bicara sekaligus

- Maksimal **3 kartu** menampilkan efek sekaligus (yang paling keras).
- **Pembicara dominan** (yang paling dominan saat itu) mendapat penguatan: **kilatan dua arah** pada border dan glow luar sedikit lebih besar. Kartu lain yang bicara tetap menyala tetapi lebih tenang.
- Saat beberapa orang bicara (cross-talk), **ambient background ikut sedikit menghangat** (+tipis), bukan ledakan.

### 6.5 Kartu sendiri ("Anda")

- Kartu Anda bereaksi seperti kartu lain saat Anda bicara.
- **Mic mati tapi bersuara:** border neon **amber** berdenyut pelan + banner "Mikrofon Anda mati, tetapi suara Anda terdengar" dengan tombol "Nyalakan mic" (hanya Anda yang melihat).

### 6.6 Paginasi (12 peserta)

- Grid menampilkan maksimal 9 kartu per halaman.
- Jika seseorang di halaman 2 mulai bicara: **titik bercahaya kecil muncul di tombol pager** (petunjuk "ada yang bicara di halaman lain"). Jika ia terus bicara ±3 detik, kartunya **dipromosikan ke halaman 1** dengan pertukaran posisi yang halus (kartu yang paling lama diam turun ke halaman 2).

### 6.7 Kriteria penerimaan F3

- [ ] Kartu kamera mati: aurora muncul mengelilingi avatar yang tetap di tengah.
- [ ] Aurora **terlihat lebih terang dan lebih aktif** saat level naik, dan sebaliknya.
- [ ] Border neon dengan kilatan bergerak muncul pada kartu kamera mati **dan** menyala.
- [ ] Efek hilang dengan halus setelah berhenti bicara (tanpa mati mendadak).
- [ ] Maksimal 3 kartu menyala; dominan terlihat berbeda.
- [ ] Warna aurora dan neon sesuai palet masing-masing peserta (6 palet, `Design.md` 2.2).
- [ ] Penonton yang baru melihat prototype bisa menebak "siapa yang sedang bicara" dalam < 1 detik.

---

## 7. Kebutuhan layout dan visual

### 7.1 Layar

- Target **desktop 1280–1920 px** lebar. Diuji khusus di 1440 x 900.
- Di bawah 1100 px lebar: tampilkan pesan "Prototype ini dioptimalkan untuk layar desktop".
- Mode gelap saja.

### 7.2 Komposisi layar room

```
┌───────────────────────────────────────────────────────────┐
│ [Merekam] [Terkunci]                    [Koneksi]  [‹ 1/2 ›] │  ← lapisan atas (glass-1)
│                                                           │
│   ┌────┐ ┌────┐ ┌────┐                                    │
│   │    │ │    │ │    │      grid video / stage            │
│   └────┘ └────┘ └────┘                                    │  ← ambient aurora tipis di belakang
│   ┌────┐ ┌────┐ ┌────┐                          ┌────────┐ │
│   │    │ │    │ │    │                          │ Panel  │ │  ← panel samping (glass-2), opsional
│   └────┘ └────┘ └────┘                          └────────┘ │
│ [Judul · kode]    ( mic cam share react hand 5 snd … ⏻ )   [Peserta Chat Polling Host] │
└───────────────────────────────────────────────────────────┘
        pil info (kiri)        dock mengambang (tengah)        pil panel (kanan)
```

- Video memenuhi layar; tidak ada header halaman atau sidebar permanen.
- Grid kartu adaptif (rasio 16:9, jarak 12 px); saat panel terbuka, grid menyempit dengan transisi mulus.
- Detail ukuran, glass, ambient, dan token: `Design.md` bagian 2–5 dan 15.

### 7.3 Kriteria penerimaan F1, F2, F11

- [ ] Ambient background terlihat **tipis**: sebagian orang bahkan tidak sadar sampai diperhatikan; tidak mengganggu keterbacaan nama/label.
- [ ] Dock, panel, label, popover, toast memakai glass sesuai tingkatnya; teks selalu terbaca.
- [ ] Dock mengambang di tengah bawah; info meeting di kiri; tombol panel di kanan.
- [ ] Tombol aktif, mati (merah), dan disabled (garis putus-putus + alasan) terlihat jelas berbeda.
- [ ] Semua tombol ikon punya label aksesibel dan tooltip.

---

## 8. Spesifikasi fitur per fitur

### 8.1 State kartu lain (F4)

| State | Tampilan | Cara memicu di demo |
|---|---|---|
| Tangan terangkat | Emoji melambai besar di kiri avatar + chip nomor antrean | Klik "Angkat tangan" atau Demo Director |
| AFK / BRB | Kartu redup, emoji status animated di samping avatar, label "AFK"/"BRB" | Menu status di dock "Lainnya" atau Demo Director |
| Koneksi buruk | Border rose putus-putus berdenyut pelan + ikon sinyal | Demo Director |
| Menyambung ulang | Garis cahaya tipis menyapu kartu + badge "Menyambung ulang" | Demo Director |
| Mic mati | Ikon mic dicoret di pojok kartu | Toggle mic |
| Kamera mati | Avatar menggantikan video | Toggle kamera |

Detail visual: `Design.md` 7.4.

### 8.2 Angkat tangan (F5)

**Alur:**
1. Pengguna klik **Angkat tangan** di dock.
2. Emoji **tangan melambai** muncul **di kiri avatar** pada kartu pengguna: ukurannya besar, **naik dari bawah ke posisi akhirnya** dengan gerakan membal halus.
3. Emoji terus melambai berkala selama tangan terangkat. Chip nomor antrean di bawahnya.
4. Klik lagi (atau host menurunkan): emoji mengecil dan turun, lalu hilang.
5. Bunyi ding halus saat tangan baru terangkat.

**Kartu kamera menyala:** emoji berada di kiri tengah kartu (tidak menutup wajah).
**Kartu sempit** (misal di strip share screen): emoji diperkecil dan pindah ke pojok.

**Penerimaan:**
- [ ] Emoji bukan ikon kecil: ukuran jelas terlihat (±30% tinggi kartu, min 56 px).
- [ ] Muncul dari bawah ke tengah-kiri avatar, bukan fade di tempat.
- [ ] Antrean angkat tangan di panel Peserta mengikuti urutan.

### 8.3 Reaction (F6)

**Alur (mirip Google Meet):**
1. Klik **Reaction**: popover glass berisi 8 emoji. Hover/fokus pada emoji membuatnya membesar dan **memutar animasinya** (pratinjau).
2. Klik emoji: dikirim. Popover **tetap terbuka** agar bisa mengirim beruntun.
3. Emoji **melayang naik dari kiri bawah layar** (di atas dock), bergoyang pelan, lalu memudar, dengan **chip nama pengirim** di bawahnya.
4. Reaction beruntun dari orang yang sama digabung menjadi "x N".

8 emoji: jempol, tepuk tangan, hati, pesta, tertawa, terkejut, terima kasih, api.

**Penerimaan:**
- [ ] Semua emoji animated (bukan statis).
- [ ] Beberapa reaction bersamaan tidak saling menumpuk berantakan dan tidak menutupi dock.
- [ ] Maksimal 12 emoji sekaligus di layar.

### 8.4 High five (F7)

**Cerita pengguna:** Setelah diskusi, Dewi memberi solusi bagus. Raka mengajak high five. Dewi menyambut. Tangan mereka terbang ke tengah layar, bertemu, bunyi tepukan, efek cahaya. Jika tidak ada yang menyambut, ajakan menggantung sebentar lalu hilang pelan.

**Alur lengkap:** detail timing di `Design.md` bagian 11. Ringkasan UX:

| Tahap | Pada layar pengaju | Pada layar orang lain |
|---|---|---|
| Mengajak | Klik **High five**. Emoji **tangan terulur** muncul besar di kiri avatar (naik dari bawah). Cincin hitung mundur 6 detik mengelilinginya. Border berpulsa lembut | Toast glass di tengah atas: "**Raka** mengajak high five" + tombol **High five!**. Kartu Raka bersinar halus. Klik kartunya juga bisa menyambut |
| Disambut | Tangan melesat melengkung ke tengah layar | Sama: tangan penyambut juga melesat ke tengah |
| Bertemu | Dua tangan bertabrakan di tengah. **Bunyi tepukan.** Animasi high five, gelombang cahaya berwarna gabungan kedua palet, percikan aurora. Chip "Raka x Dewi" sebentar | Sama |
| Tidak disambut | Tangan **menurun pelan dan memudar** setelah 6 detik. Tanpa pesan, tanpa bunyi | Toast hilang |
| Terlambat menyambut | – | Toast berubah "Sudah disambut Dewi", lalu hilang |

**Aturan:**
- Satu ajakan aktif per orang; setelah kedaluwarsa ada jeda 3 detik sebelum bisa mengajak lagi.
- Tidak bisa menyambut ajakan sendiri.
- Hanya satu penyambut (yang tercepat).
- Maksimal 2 animasi tengah layar bersamaan; sisanya antre.
- Saat ada share screen: animasi tengah diperkecil agar tidak menutupi konten lama.

**Penerimaan:**
- [ ] Pada Demo Director ada tombol "Peserta lain mengajak" dan "Peserta lain menyambut" untuk dua arah.
- [ ] Urutan terbang → bertemu → efek → hilang terasa mulus dan memuaskan (±1,6 detik).
- [ ] Ajakan yang tidak disambut hilang dengan elegan.
- [ ] Efek suara tepukan terdengar tepat saat tangan bertemu.

### 8.5 Layout share screen (F8)

**Alur:** Klik **Bagikan layar** (atau Demo Director: "Peserta X mulai berbagi").

1. Frame layar yang dibagikan **tumbuh dari kartu presenter** hingga menjadi stage besar.
2. Kartu peserta lain **mengecil dan bergeser** ke strip di kanan (layar ≥ 1280 px), berurutan dengan jeda tipis.
3. Saat berhenti berbagi: kebalikannya, stage menyusut ke kartu presenter dan kartu kembali ke grid.

Selama share: ambient meredup, aurora/neon pada kartu strip memakai versi lebih sederhana, reaction dan high five tetap tampil di atas.

**Isi layar yang dibagikan (prototype):** gambar/slide tiruan (mockup dashboard abstrak) agar terlihat nyata.

**Penerimaan:**
- [ ] Tidak ada lompatan posisi; semua kartu bergerak halus ke tujuan.
- [ ] Video/placeholder tidak berkedip atau ter-reset selama transisi.
- [ ] Tombol Bagikan layar milik Anda disabled dengan alasan saat orang lain sedang berbagi.
- [ ] Detail `Design.md` bagian 14.

### 8.6 Soundboard (F9)

- Tombol **Soundboard** di dock membuka popover (360 x 440): volume lokal, "Bisukan soundboard", pencarian, tab Favorit/Bawaan, grid 4 kolom berisi 12 suara dengan emoji animated.
- Klik suara: suara diputar; tombol berefek riak; seluruh tombol **cooldown 3 detik** dengan cincin hitung mundur.
- Saat orang lain memutar: chip "**Raka** memutar *Ta-da*" di bawah layar + equalizer mini di kartu Raka.
- Toggle host "Izinkan soundboard" mematikan tombol di dock (disabled + alasan).

**Penerimaan:**
- [ ] Suara terdengar (placeholder sintesis cukup).
- [ ] Cooldown terlihat jelas.
- [ ] Demo Director bisa memicu "Peserta lain memutar suara".

### 8.7 Polling (F10)

**Alur host/co-host:** tab **Polling** → **Buat polling** → isi pertanyaan, 2–6 opsi, pilihan ganda?, anonim?, tampilkan hasil langsung?, tutup otomatis → **Mulai polling**.

**Alur peserta:** toast "Polling baru" + tombol **Vote** → tab Polling → pilih opsi (baris besar) → hasil muncul sebagai bar gradient yang terisi dengan animasi → progres "12 dari 15 sudah vote" → polling ditutup → opsi pemenang diberi neon border + emoji piala.

**State yang harus tampil:** kosong, form, aktif belum vote, sudah vote, tanpa hasil langsung, ditutup, seri. Detail `Design.md` bagian 13.

**Pada prototype:** suara peserta lain **disimulasikan** (bertambah otomatis berkala) sehingga bar bergerak hidup.

**Penerimaan:**
- [ ] Alur host dan peserta bisa dijalani end-to-end.
- [ ] Bar hasil terisi dengan animasi, bukan melompat.
- [ ] Pemenang dan seri terlihat jelas.
- [ ] Contoh poll siap pakai tersedia (11.3).

### 8.8 Panel samping dan Alat host (F12–F14)

- **Peserta:** pencarian, antrean tangan terangkat, daftar dengan badge peran/AFK/mic, menu aksi per peserta (Bisukan, Jadikan co-host, Jadikan host, Keluarkan). Aksi bersifat tiruan (efek terlihat di kartu, misal mic menjadi dicoret).
- **Chat:** pesan publik dan privat, saran mention, indikator mengetik; pesan peserta lain muncul otomatis dalam skenario.
- **Polling:** lihat 8.7.
- **Alat host:** tamu menunggu (Setujui/Tolak), toggle kunci meeting, batasi berbagi layar, izinkan soundboard, Bisukan semua, pengumuman, rekaman (Mulai/Jeda/Hentikan).
- **Menu Keluar:** "Keluar dari meeting" dan "Akhiri untuk semua". Keduanya menuju layar penutup sederhana ("Anda sudah keluar" / "Meeting telah diakhiri") dengan tombol "Mulai ulang demo".

---

## 9. Demo Director (F19)

Panel kontrol **di luar produk** untuk menggerakkan prototype. Tampil beda dari UI produk (kotak outline kecil, font mono) agar tidak tertukar. Dibuka lewat tombol kecil "Demo" di pojok kiri atas atau `Shift+D`, dan **bisa disembunyikan total** saat presentasi.

| Grup | Kontrol |
|---|---|
| **Skenario** | Daftar skrip (bagian 10). Tombol Putar / Jeda / Mulai ulang. Kecepatan 1x / 1,5x |
| **Peserta** | Untuk tiap peserta: toggle "bicara", slider **level suara** (0–1), kamera on/off, mic on/off, tangan, AFK/BRB, koneksi buruk, menyambung ulang |
| **Kejadian cepat** | Peserta mengajak high five · Peserta menyambut high five · Reaction dari peserta · Peserta memutar soundboard · Peserta berbagi layar / berhenti · Peserta mengirim chat · Tamu meminta masuk · Host mengumumkan |
| **Tampilan** | Jumlah peserta (4/8/12) · Efek visual (Penuh/Hemat/Mati) · Simulasi reduced motion · Role (Host/Co-host/Peserta/Tamu) · Tampilkan/sembunyikan Demo Director |
| **Aksi massal** | "Semua hening", "Satu pembicara", "Ramai (3 bicara)" |

Level suara dapat juga diisi **otomatis** (pola acak bergelombang yang terasa seperti orang bicara: naik-turun, jeda, ledakan sesekali) lewat opsi "Bicara natural" per peserta.

---

## 10. Skenario demo otomatis (±4 menit)

**Skenario utama: "Brainstorm sprint"**

| Waktu | Kejadian | Yang diperlihatkan |
|---|---|---|
| 0:00 | Room tenang, 8 peserta, beberapa kamera mati | Ambient tipis, kartu idle, glass dock |
| 0:10 | **Dewi** (kamera mati) mulai bicara pelan lalu normal | Aurora tumbuh dari avatar, border neon + kilatan, intensitas naik |
| 0:25 | **Bima** (kamera menyala) menyela dengan semangat | Dua kartu menyala; dominan berpindah; glow tepi di kartu Bima |
| 0:40 | Bima sangat keras sebentar (tertawa) | Aurora/neon mencapai terang puncak, cincin riak |
| 0:50 | Semua hening | Cahaya meredup halus, ambient kembali tenang |
| 0:55 | **Sari** angkat tangan; **Fajar** angkat tangan | Emoji melambai besar naik dari bawah ke kiri avatar, chip antrean 1 dan 2 |
| 1:10 | Reaction beruntun: hati, tepuk tangan, api | Emoji animated melayang dari kiri bawah dengan chip nama |
| 1:25 | **Dewi** menjelaskan solusi; **Raka** mengajak **high five** | Emoji tangan terulur + toast ajakan |
| 1:32 | **Dewi** menyambut | Tangan melesat ke tengah, tabrakan, tepukan, efek cahaya |
| 1:45 | **Andi** mengajak high five, tidak ada yang menyambut | Tangan menggantung lalu turun dan memudar |
| 1:55 | Soundboard: Anda memutar "Ta-da", Fajar memutar "Tepuk tangan" | Popover, cooldown, chip pemutar, equalizer di kartu |
| 2:15 | Host membuat **polling** "Rilis minggu depan atau tunda?" | Form, toast ke peserta, vote bertambah, bar bergerak |
| 2:50 | Polling ditutup | Pemenang bersinar + piala |
| 3:00 | **Raka berbagi layar** | Frame tumbuh dari kartu Raka, kartu lain bergeser ke strip |
| 3:20 | Dewi bicara saat share | Efek pada kartu kecil di strip tetap terbaca |
| 3:40 | Raka berhenti berbagi | Layout kembali ke grid mulus |
| 3:50 | Selesai | Layar penutup + "Mulai ulang demo" |

**Skenario pendek (tersedia juga):** "Aurora saja" (30 detik, hanya bicara), "High five saja", "Share screen saja", "Voting saja".

---

## 11. Konten dan data tiruan

### 11.1 Peserta (12)

| # | Nama | Peran | Kamera awal | Palet |
|---|---|---|---|---|
| 1 | Anda | Host | Menyala | Borealis |
| 2 | Dewi | Co-host | Mati | Nebula |
| 3 | Raka | Peserta | Mati | Abyss |
| 4 | Bima | Peserta | Menyala | Solstice |
| 5 | Sari | Peserta | Menyala | Verdant |
| 6 | Maya | Peserta | Mati | Orchid |
| 7 | Fajar | Peserta | Menyala | Borealis |
| 8 | Andi | Tamu | Mati | Nebula |
| 9 | Laras | Peserta | Menyala | Abyss |
| 10 | Yoga | Peserta | Mati | Solstice |
| 11 | Citra | Peserta | Menyala | Verdant |
| 12 | Hendra | Peserta | Mati | Orchid |

- **Avatar:** lingkaran berisi inisial dengan gradient palet peserta (tanpa foto).
- **Kamera menyala:** placeholder video **buatan sendiri** (siluet abstrak di atas gradient yang bergerak sangat pelan), tanpa foto orang nyata. Opsional (P2): kartu "Anda" memakai webcam asli.

### 11.2 Soundboard (12 suara)

Tepuk tangan · Drum roll · Ta-da · Wow · Ding · Air horn (Keras) · Rimshot · Sad trombone · Jangkrik · Whoosh · Sorak penonton · Level up.
Di prototype, bunyi dibuat **sintesis sederhana** (tidak perlu rekaman sungguhan). Untuk produk sesungguhnya aset harus bebas lisensi.

### 11.3 Contoh polling

- **Pertanyaan:** "Rilis fitur baru minggu depan atau ditunda?"
- **Opsi:** Rilis minggu depan · Tunda dua minggu · Rilis bertahap

### 11.4 Contoh chat

Pesan publik dan satu pesan privat dari Dewi ke Anda yang menyebut "@Anda" (lihat wireframe v1 artboard 2).

### 11.5 Teks kunci (Bahasa Indonesia)

| Konteks | Teks |
|---|---|
| Tombol dock | Mikrofon, Kamera, Bagikan layar, Reaction, Angkat tangan, High five, Soundboard, Lainnya, Keluar |
| Ajakan high five | "{nama} mengajak high five" · tombol "High five!" · "Sudah disambut {nama}" |
| Soundboard | "Soundboard", "Cari suara", "Bisukan soundboard", "{nama} memutar {suara}", "Soundboard dimatikan host" |
| Polling | "Buat polling", "Mulai polling", "Vote", "Ganti pilihan", "{n} dari {total} sudah vote", "Seri", "Bagikan hasil ke chat" |
| Share | "Anda sedang berbagi layar", "Peserta lain sedang berbagi layar. Tunggu sampai selesai." |
| Status | "Merekam", "Meeting terkunci", "Menyambung ulang", "Koneksi baik/sedang/buruk" |
| Keluar | "Keluar dari meeting", "Akhiri untuk semua" |

---

## 12. Aksesibilitas dan kenyamanan

Rangkuman (detail di `Design.md` bagian 18):
- Kontras teks 4,5 : 1 atau lebih; label di atas video terbaca.
- Status penting tidak hanya mengandalkan warna (ikon, chip angka, label).
- **Reduced motion:** aurora/neon/emoji/transisi punya versi statis atau crossfade. Bisa disimulasikan dari Demo Director.
- **Reduced transparency:** glass menjadi solid.
- Tidak ada kedipan cepat; perubahan cahaya selalu halus.
- Semua kontrol bisa dioperasikan keyboard, dengan fokus ring yang jelas.

---

## 13. Tech stack (minimal)

Prinsip: **sesedikit mungkin**, hanya yang benar-benar dibutuhkan untuk pengalaman ini. Tidak ada backend, router, state library, atau UI kit besar.

| Kebutuhan | Pilihan | Alasan |
|---|---|---|
| Build dan dev server | **Vite** | Cepat, tanpa konfigurasi rumit |
| UI | **React + TypeScript** | Komponen jelas, mudah dibagikan ke engineer yang sudah memakai React |
| Animasi layout, spring, shared-element | **Motion** (dulu Framer Motion) | Dibutuhkan untuk transisi share screen yang mulus (FLIP/layout), gerak emoji, high five |
| Animated emoji (gaya Telegram) | **dotLottie / Lottie player** untuk React | Animated emoji vektor, tajam di semua ukuran |
| Styling | **CSS biasa dengan CSS variables** (token dari `Design.md`) + CSS Modules | Glass, aurora, dan neon lebih mudah ditulis langsung di CSS; tidak perlu Tailwind |
| Ikon | **lucide-react** | Konsisten dengan Huddle yang sudah ada |
| Font | **@fontsource**: Sora, Plus Jakarta Sans, JetBrains Mono | Font lokal tanpa bergantung CDN saat demo |
| Bunyi (tepukan, ding, soundboard) | **Web Audio API** bawaan browser | Sintesis sederhana, tanpa library atau file audio |
| State | `useReducer` / React state biasa | Cukup untuk satu screen |
| Package manager | **Bun** (konsisten dengan `huddle-fe`) atau npm | Bebas |

**Aset yang perlu disiapkan:**
- Set **animated emoji** (Lottie): tangan melambai, tangan terulur, high five, jempol, tepuk tangan, hati, pesta, tertawa, terkejut, terima kasih, api, tidur/zzz, kopi, piala, + emoji untuk 12 soundboard. **Lisensi harus dipastikan** (lihat 15). Cadangan sementara: emoji Unicode dengan animasi CSS sederhana, agar pengerjaan tidak tertahan.
- Gambar layar tiruan untuk share screen (mockup dashboard abstrak, dibuat sendiri).

**Yang sengaja tidak dipakai:** Tailwind, Redux/Zustand, React Router, UI kit (shadcn/MUI), library chart, library audio, backend apa pun. Jika ada kebutuhan tambahan saat pengerjaan, tambahkan seperlunya dan catat di README.

---

## 14. Struktur repo yang disarankan

```
huddle-room-prototype/
├─ README.md                  ← cara jalan + cara memakai Demo Director
├─ docs/
│  ├─ PRD.md                  ← dokumen ini
│  ├─ Design.md               ← gaya visual dan perilaku detail
│  └─ wireframe/              ← wireframe v1 (ekspor dari canvas) + catatan "sudah digantikan Design.md"
├─ public/
│  └─ emoji/                  ← file Lottie animated emoji
├─ src/
│  ├─ main.tsx, App.tsx
│  ├─ styles/                 ← tokens.css (dari Design.md), glass.css, aurora.css, neon.css, fonts
│  ├─ room/                   ← layout room, dock, panel, toast, ambient
│  ├─ tile/                   ← kartu peserta (avatar, aurora, neon, state)
│  ├─ features/               ← raise-hand, reactions, high-five, soundboard, polls, screen-share
│  ├─ demo/                   ← DemoDirector, skenario, data peserta tiruan
│  └─ audio/                  ← sintesis bunyi
└─ package.json
```

---

## 15. Risiko dan keputusan terbuka

| # | Hal | Dampak | Usulan |
|---|---|---|---|
| 1 | **Lisensi animated emoji** (gaya Telegram) | Tidak boleh menyalin aset Telegram langsung | Pakai set yang lisensinya jelas (misal Noto Emoji Animation dari Google, **konfirmasi lisensi dan atribusi**) atau buat sendiri. Cadangan: Unicode + animasi CSS |
| 2 | Aurora pada kartu **kamera menyala** | Terlalu kuat menutupi wajah; terlalu lemah tidak terlihat | Mulai dengan glow tepi tipis; jadikan satu tombol demo "Intensitas efek tepi" untuk membandingkan |
| 3 | High five **tertarget** | Dota 2 menargetkan pemain terdekat; di meeting tidak ada jarak | v1 ajakan terbuka (tercepat menang); tertarget jadi ide lanjutan |
| 4 | Keputusan produk di luar prototype | Soundboard ikut direkam? Poll anonim dan ekspor hasil? Siapa boleh membuat poll? | Dicatat di `Design.md` bagian 22; tidak menghalangi prototype |
| 5 | Kenyamanan pada efek berlapis | Aurora + neon + ambient bisa melelahkan bila semuanya kuat | Uji bersama beberapa orang; sediakan tier Hemat |
| 6 | Wireframe v1 sudah berbeda dari arah baru | Dock, warna, kartu | Anggap `Design.md` yang berlaku; wireframe v1 hanya acuan susunan |

---

## 16. Tahapan pengerjaan

| Tahap | Isi | Hasil yang bisa dilihat |
|---|---|---|
| **M0** | Setup repo, token, font, struktur | Halaman kosong bertema gelap dengan font benar |
| **M1** | Layout room, grid kartu, dock mengambang, glass, ambient | Room statis yang sudah cantik |
| **M2** | Kartu peserta + **aurora dan neon saat bicara** + Demo Director dasar (toggle bicara + slider level) | **Momen inti**: kartu hidup saat bicara |
| **M3** | State kartu lain; animated emoji; angkat tangan; reaction | Emoji besar naik dari bawah, reaction melayang |
| **M4** | **High five** (ajak, sambut, tabrak, hilang) + bunyi tepukan | Momen "wow" kedua |
| **M5** | **Transisi share screen** | Layout bergeser mulus |
| **M6** | Soundboard dan polling | Dua fitur baru lengkap |
| **M7** | Panel Peserta/Chat/Alat host, menu Keluar, paginasi, role switcher | Room terasa lengkap |
| **M8** | Skenario otomatis, tier efek, reduced motion, polish, README | Siap didemokan |

**Definisi selesai tiap tahap:** fitur bisa dipicu dari Demo Director, memenuhi kriteria penerimaan di bagian 6–8, dan terlihat benar di 1440 x 900.

---

## 17. Kriteria keberhasilan prototype

- [ ] Penonton baru memahami "siapa yang sedang bicara" tanpa dijelaskan.
- [ ] Penonton bisa merasakan perbedaan antara bicara pelan dan keras dari kartu.
- [ ] High five terasa menyenangkan dan tidak canggung saat tidak disambut.
- [ ] Transisi share screen tidak ada lompatan.
- [ ] Demo otomatis 4 menit berjalan tanpa campur tangan dan tanpa kejanggalan visual.
- [ ] Semua fitur P0 selesai; fitur P1 sebagian besar selesai.
- [ ] Versi Hemat dan reduced-motion tetap terlihat rapi.

---

## 18. Lampiran: istilah

| Istilah | Arti |
|---|---|
| **Kartu / tile** | Kotak peserta di grid video |
| **Aurora** | Cahaya mesh gradient berwarna yang bergejolak di sekitar avatar saat bicara |
| **Neon / kilatan** | Garis cahaya di border kartu dengan cahaya yang bergerak mengelilinginya |
| **Pembicara dominan** | Peserta yang paling dominan berbicara pada saat itu |
| **Ambient** | Cahaya mesh gradient yang sangat tipis di background layar |
| **Dock** | Kapsul kontrol mengambang di tengah bawah |
| **Demo Director** | Panel kontrol demo di luar produk |
| **Palet peserta** | Pasangan warna aurora tetap milik tiap peserta |
