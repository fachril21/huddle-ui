# Huddle — Design.md

> **Nama arah visual: "Huddle Aurora"** — glassmorphism gelap dengan ambient mesh gradient, aurora yang bereaksi ke suara, dan border neon.
> Dokumen ini adalah sumber acuan UI/UX untuk **prototype meeting room**. Scope: layar room (desktop 1440 x 900 lebih dulu). Struktur halaman lain (beranda, login, rekaman) tetap mengikuti sitemap Zoom/Meet yang sudah dibuat.
> Dokumen ini **menggantikan** brand guideline lama (token di `globals.css`: `#149FC4`, `#F6901E`, Host Grotesk + Manrope) untuk layar room. Pemetaan token lama ke baru ada di bagian 3.4.

Status penanda: **[Baru]** = belum ada di kode/wireframe, **[Ubah]** = ada tapi berubah dari wireframe v1, **[Tetap]** = perilaku dari kode dipertahankan.

---

## 0. Ringkasan arah

| Aspek | Keputusan |
|---|---|
| Mood | Malam di Kutub Utara: gelap, dalam, hidup. Meeting terasa seperti "ruang bercahaya", bukan kotak-kotak abu |
| Material | Glass (blur + tint + border tipis) hanya untuk **chrome** (dock, panel, label, popover, toast), bukan untuk badan video |
| Cahaya | Tiga lapis: **ambient** (sangat tipis di background), **aurora** (di avatar saat bicara), **neon** (di border tile saat bicara) |
| Emoji | Semua interaksi emoji pakai **animated emoji ala Telegram** (besar, muncul dengan spring, loop halus) |
| Fitur baru | High five, Soundboard, Polling |
| Layout share screen | Transisi mulus (FLIP/shared-element), kartu peserta mengecil dan bergeser ke strip |
| Prinsip kinerja | Efek mahal hanya jalan di **maksimal 3 tile** yang sedang bicara (SFU hanya meneruskan 3 audio terkeras) dan punya 3 tingkat kualitas |

---

## 1. Prinsip desain

1. **Video adalah tokoh utama.** Glass, aurora, dan neon harus menonjolkan peserta, bukan menutupi wajah. Pada tile yang kameranya menyala, efek hanya di tepi.
2. **Cahaya = informasi.** Setiap cahaya punya arti (bicara, tangan terangkat, koneksi buruk). Tidak ada cahaya dekoratif yang bersaing dengan sinyal bicara.
3. **Tenang saat diam, hidup saat ada aktivitas.** Kondisi idle harus hampir statis; kemewahan visual muncul ketika ada yang bicara, bereaksi, atau mengajak high five.
4. **Satu momen, satu fokus.** Maksimal satu animasi "pusat layar" (high five) dan maksimal 12 emoji reaction melayang sekaligus.
5. **Selalu ada jalan hemat.** Setiap efek punya versi hemat dan versi mati (reduced motion, reduced transparency, perangkat lemah).
6. **Aman untuk mata.** Tidak ada kedipan lebih dari 3 kali per detik pada area besar. Modulasi aurora dihaluskan.
7. **Bahasa Indonesia, santai tapi jelas.** Label tombol pendek ("Angkat tangan", "High five", "Mulai polling").

---

## 2. Brand baru

### 2.1 Warna

**Fondasi (ink)**

| Token | Hex | Pakai untuk |
|---|---|---|
| `--ink-950` | `#060912` | Background room, lapisan paling dasar |
| `--ink-900` | `#0B1020` | Permukaan solid (fallback glass) |
| `--ink-800` | `#121935` | Dasar tile tanpa kamera, kartu solid |
| `--ink-700` | `#1B2347` | Hover permukaan solid, track slider |

**Teks (di atas glass gelap)**

| Token | Hex | Kontras di atas glass 8% (`#1A1D25`) |
|---|---|---|
| `--text-1` | `#F4F7FF` | 15,7 : 1 |
| `--text-2` | `#B4BEDA` | 9,1 : 1 |
| `--text-3` | `#8E99B8` | 5,9 : 1 (teks sekunder kecil, jangan lebih redup) |

**Aurora (inti palet)**

| Token | Hex | Karakter |
|---|---|---|
| `--aurora-cyan` | `#2BE4F2` | Dingin, bersih. Fokus ring, indikator aktif |
| `--aurora-mint` | `#3DF2B0` | Sukses, "hidup", berhasil |
| `--aurora-blue` | `#3D7BFF` | Kedalaman, dasar gradient |
| `--aurora-violet` | `#8B7BFF` | Identitas brand, link |
| `--aurora-orchid` | `#E255E8` | Aksen hangat-dingin, reaction |
| `--aurora-rose` | `#FF5C85` | Hangat, peringatan lembut |
| `--aurora-amber` | `#FFB84D` | Tangan terangkat, mic mati tapi bersuara |

**Aksi dan status**

| Token | Hex | Catatan |
|---|---|---|
| `--primary` | `#5B5BF0` | Tombol utama. Teks putih di atasnya 5,0 : 1 |
| `--primary-glow` | `#8B7BFF` | Glow dan hover tombol utama |
| `--danger` | `#D92D45` | Keluar, Hentikan, Keluarkan. Teks putih 4,8 : 1 |
| `--success` | `#3DF2B0` | Teks gelap `--ink-950` di atasnya 13,8 : 1 |
| `--warning` | `#FFB84D` | Teks gelap `--ink-950` di atasnya 11,6 : 1 |

> Aturan: teks di atas warna aurora (cyan, mint, amber, rose) selalu `--ink-950`, bukan putih. Teks putih hanya di atas `--primary` dan `--danger`.

### 2.2 Aurora Identity (palet per peserta)

Setiap peserta mendapat satu pasangan warna aurora yang **stabil** (hash dari `participant_id`, bukan dari urutan masuk, supaya tidak berubah saat reconnect). Pasangan ini dipakai untuk aurora avatar, neon border, dan aksen emoji mereka. Tujuannya agar grid tetap harmonis tetapi tiap orang bisa dibedakan.

| Nama | Warna 1 | Warna 2 | Warna tengah (mix) |
|---|---|---|---|
| Borealis | `#2BE4F2` | `#3DF2B0` | `#33EBC4` |
| Nebula | `#8B7BFF` | `#E255E8` | `#B66AF3` |
| Solstice | `#FFB84D` | `#FF5C85` | `#FF8B69` |
| Abyss | `#3D7BFF` | `#2BE4F2` | `#33A2F8` |
| Orchid | `#FF5C85` | `#8B7BFF` | `#C56CC2` |
| Verdant | `#3DF2B0` | `#3D7BFF` | `#3DB6D8` |

Aturan:
- Host tidak diberi palet khusus. Peran ditandai badge, bukan warna cahaya.
- Peserta lokal ("Anda") memakai palet yang sama seperti peserta lain, bukan palet spesial.
- Kejadian bersama (high five, poll, soundboard) memakai gradient gabungan kedua warna pelaku.

### 2.3 Tipografi

| Peran | Font | Bobot | Alasan |
|---|---|---|---|
| Display, judul panel, angka besar | **Sora** | 600, 700 | Geometris, futuristik tapi ramah; angka dan huruf besar terbaca jelas |
| Body, label, tombol | **Plus Jakarta Sans** | 400, 500, 600, 700 | Dirancang di Jakarta, sangat terbaca untuk teks Indonesia |
| Kode meeting, timer, ID | **JetBrains Mono** | 500 | Karakter kode terbedakan (`abc-defg-hij`) |

Semua dari Google Fonts. Fallback: `system-ui, sans-serif` (Sora dan Jakarta), `ui-monospace, monospace`.

| Level | Font | Ukuran / line-height | Bobot |
|---|---|---|---|
| `display` | Sora | 40 / 48 | 700 |
| `title` | Sora | 20 / 28 | 600 |
| `heading` | Sora | 16 / 24 | 600 |
| `body` | Plus Jakarta Sans | 14 / 21 | 500 |
| `body-sm` | Plus Jakarta Sans | 13 / 19 | 500 |
| `caption` | Plus Jakarta Sans | 12 / 16 | 500 |
| `label` (nama di tile) | Plus Jakarta Sans | 13 / 16 | 600 |
| `mono` | JetBrains Mono | 12 / 16 | 500 |

### 2.4 Bentuk, jarak, ikon

- **Spacing:** basis 4 px. Skala `4 8 12 16 20 24 32 48`.
- **Radius:** `sm 8`, `md 12`, `lg 16`, `xl 24`, `tile 20`, `dock 28`, `pill 999`.
- **Ikon:** Lucide (sudah dipakai di kode), stroke 1,75 px, ukuran 20 (dock 22). Ikon aktif boleh mendapat glow tipis warna aurora, bukan fill penuh.
- **Emoji:** bukan ikon. Emoji selalu animated (bagian 8) dan tidak boleh dicampur dengan ikon line di tombol yang sama.

---

## 3. Token (CSS)

### 3.1 Warna dan glass

```css
:root {
  /* ink */
  --ink-950: #060912; --ink-900: #0B1020; --ink-800: #121935; --ink-700: #1B2347;
  /* teks */
  --text-1: #F4F7FF; --text-2: #B4BEDA; --text-3: #8E99B8;
  /* aurora */
  --aurora-cyan: #2BE4F2; --aurora-mint: #3DF2B0; --aurora-blue: #3D7BFF;
  --aurora-violet: #8B7BFF; --aurora-orchid: #E255E8; --aurora-rose: #FF5C85; --aurora-amber: #FFB84D;
  /* aksi */
  --primary: #5B5BF0; --primary-glow: #8B7BFF; --danger: #D92D45;

  /* glass */
  --glass-1-bg: rgba(10, 14, 28, .50);   --glass-1-blur: 12px;  /* label di atas video */
  --glass-2-bg: rgba(16, 22, 44, .58);   --glass-2-blur: 24px;  /* panel, popover, toast */
  --glass-3-bg: rgba(20, 28, 56, .70);   --glass-3-blur: 40px;  /* dock, modal */
  --glass-sat: 160%;
  --glass-border: rgba(255, 255, 255, .12);
  --glass-edge: inset 0 1px 0 rgba(255, 255, 255, .18);   /* highlight tepi atas */
  --glass-shadow: 0 12px 40px rgba(0, 0, 0, .45);

  /* motion */
  --ease-out: cubic-bezier(.2, .8, .2, 1);
  --ease-spring: cubic-bezier(.34, 1.56, .64, 1);
  --dur-fast: 120ms; --dur-base: 220ms; --dur-slow: 420ms; --dur-layout: 520ms;
}
```

### 3.2 Komponen glass (dasar)

```css
.glass-2 {
  background:
    linear-gradient(135deg, rgba(139,123,255,.10), rgba(43,228,242,.05)),
    var(--glass-2-bg);
  backdrop-filter: blur(var(--glass-2-blur)) saturate(var(--glass-sat));
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-edge), var(--glass-shadow);
  border-radius: 16px;
}
@media (prefers-reduced-transparency: reduce) {
  .glass-2 { background: var(--ink-800); backdrop-filter: none; }
}
@supports not (backdrop-filter: blur(1px)) {
  .glass-2 { background: rgba(18, 25, 53, .94); }
}
```

### 3.3 Aturan pakai token

- Jangan hardcode hex di komponen; semua lewat token.
- Warna aurora hanya untuk cahaya, status, dan aksen. Jangan dipakai untuk blok teks panjang.
- Gradient brand (aksen tombol utama, bar hasil poll): `linear-gradient(90deg, var(--aurora-blue), var(--aurora-violet), var(--aurora-orchid))`.

### 3.4 Pemetaan dari token lama

| Lama (`globals.css`) | Baru |
|---|---|
| `#149FC4` primary | `--primary` `#5B5BF0` (aksi), `--aurora-cyan` (aksen cahaya) |
| `#F6901E` accent | `--aurora-amber` (tangan terangkat, mic mati bersuara) |
| `#1DA082` green | `--aurora-mint` |
| `#D72D2D` danger | `--danger` `#D92D45` |
| `#212934` stage | `--ink-950` |
| `#404B5A` surface | `--glass-2` / `--ink-800` |
| ring emas "pembicara aktif" | Neon comet 2 arah (bagian 7) |
| Host Grotesk + Manrope | Sora + Plus Jakarta Sans |

Halaman di luar room (beranda, login, rekaman, admin) belum didesain ulang di dokumen ini. Rekomendasi: ikut tema gelap + glass yang sama setelah room selesai, supaya produknya tidak terasa dua brand.

---

## 4. Glassmorphism

### 4.1 Tiga tingkat glass

| Tingkat | Dipakai untuk | Blur | Alpha bg | Catatan |
|---|---|---|---|---|
| `glass-1` | Label nama, badge, chip di atas video | 12 px | .50 | Teks `--text-1` + `text-shadow: 0 1px 2px rgba(0,0,0,.5)`. Uji di atas video terang |
| `glass-2` | Panel samping, popover (reaction, soundboard), toast, kartu poll | 24 px | .58 | Dasar semua kartu mengambang |
| `glass-3` | Dock kontrol, modal konfirmasi | 40 px | .70 | Paling "tebal" karena di bawah selalu ada video bergerak |

### 4.2 Anatomi satu permukaan glass

1. **Tint:** gradient halus violet ke cyan di sudut (alpha ≤ .10) supaya tidak terlihat abu mati.
2. **Blur + saturate:** `backdrop-filter`.
3. **Border:** 1 px `--glass-border`.
4. **Edge highlight:** `inset 0 1px 0` putih alpha .18 di tepi atas.
5. **Noise:** tekstur grain 3% (SVG data URI kecil) di atas tint, mencegah banding pada gradient.
6. **Shadow:** `--glass-shadow`, tidak berwarna.

### 4.3 Aturan

- **Glass hanya untuk chrome.** Badan tile video tidak diberi blur. Hanya label dan badge di atasnya.
- **Maksimal dua lapis glass bertumpuk** (misal popover di atas dock). Tiga lapis tidak diperbolehkan: mahal dan keruh.
- **Jangan menganimasi `backdrop-filter`** (blur radius). Animasikan opacity/transform saja.
- Panel yang menutupi video tidak boleh terlalu transparan: alpha minimal sesuai tabel agar teks tetap terbaca di atas wajah terang.
- Fallback wajib: `prefers-reduced-transparency` dan browser tanpa `backdrop-filter` jatuh ke solid `--ink-800` (alpha .94).

---

## 5. Ambient background (mesh gradient / aurora tipis)

**Tujuan:** background tidak sepi, tapi nyaris tidak disadari. Kalau orang menyadari background-nya, berarti terlalu kuat.

### 5.1 Struktur

| Lapisan | Isi | Opacity |
|---|---|---|
| L0 | Warna dasar `--ink-950` dengan gradient vertikal sangat halus ke `--ink-900` | 100% |
| L1 | 4 blob mesh (radial gradient, blur 120 px, `mix-blend-mode: screen`) | .08–.14 per blob |
| L2 | Noise 3% (anti-banding) | 3% |
| L3 | Vignette tepi (radial gelap) agar fokus ke tengah | alpha .35 di tepi |

### 5.2 Blob

| Blob | Warna | Posisi awal | Ukuran | Opacity |
|---|---|---|---|---|
| A | `--aurora-violet` | kiri atas | 60 vmax | .14 |
| B | `--aurora-cyan` | kanan bawah | 55 vmax | .12 |
| C | `--aurora-orchid` | kiri bawah | 45 vmax | .08 |
| D | `--aurora-blue` | kanan atas | 50 vmax | .10 |

### 5.3 Gerak

- Setiap blob drift pelan (translate ±8 vmax dan scale 1 ↔ 1,12), durasi 50–70 detik, `ease-in-out`, `alternate`, fase berbeda tiap blob.
- Hanya `transform` dan `opacity` yang dianimasikan.
- **Responsif ke pembicara dominan (opsional, subtil):** warna blob terdekat bergeser ke palet pembicara dominan dengan transisi 1,2 detik, opacity maksimal tetap .18. Mati total di tier Hemat/Mati.
- **Saat ada share screen:** opacity semua blob turun ke 60% agar konten yang dibagikan tetap jadi fokus.
- Pause saat tab tersembunyi dan saat `prefers-reduced-motion` (blob statis).

```css
.ambient { position: fixed; inset: 0; background: var(--ink-950); overflow: hidden; z-index: 0; }
.ambient i {
  position: absolute; border-radius: 50%; filter: blur(120px);
  mix-blend-mode: screen; will-change: transform;
  animation: drift 60s ease-in-out infinite alternate;
}
@keyframes drift { to { transform: translate3d(8vmax, -6vmax, 0) scale(1.12); } }
```

---

## 6. Neon light (border bercahaya)

### 6.1 Karakter

Neon di sini berarti garis cahaya tipis dengan glow berlapis, bukan outline tebal. Warnanya diambil dari Aurora Identity peserta (bagian 2.2), sehingga menyatu dengan aurora di dalam tile.

### 6.2 Lapisan border tile

| Lapis | Spesifikasi |
|---|---|
| Border dasar | 1 px `--glass-border`, selalu ada |
| Neon comet | Border 2 px berupa `conic-gradient` dengan ekor (tail) 110°, ujung terang putih, bergerak melingkar mengelilingi tile |
| Comet kedua | Identik, offset 180°. Dipakai untuk **pembicara dominan** saja |
| Glow luar | `drop-shadow` dua lapis: 6 px warna 1, 18 px warna 2 (alpha ikut level suara) |
| Glow dalam | `inset 0 0 24px` warna tengah, alpha ikut level (khusus tile kamera menyala, supaya wajah tidak tertutup) |

### 6.3 Teknik

```css
@property --a { syntax: '<angle>'; inherits: false; initial-value: 0deg; }

.tile { position: relative; border-radius: 20px; --c1: var(--aurora-cyan); --c2: var(--aurora-mint); }
.tile[data-speaking="true"]::before {
  content: ""; position: absolute; inset: 0; border-radius: inherit; padding: 2px;
  background: conic-gradient(from var(--a),
    transparent 0deg 230deg, var(--c1) 290deg, #fff 345deg, var(--c2) 360deg);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
  opacity: var(--lvl-border);                       /* .25 + .75 * level */
  animation: comet var(--comet-period) linear infinite;
  filter: drop-shadow(0 0 6px var(--c1)) drop-shadow(0 0 18px var(--c2));
}
@keyframes comet { to { --a: 360deg; } }
```

- `--comet-period`: 2,6 s (level rendah) turun ke 1,1 s (level penuh).
- Fallback jika `@property` tidak didukung: putar elemen gradient dengan `transform: rotate()` dalam wrapper ber-`overflow: hidden`.
- Berlaku untuk **tile kamera menyala maupun mati**.

### 6.4 Efek "kilatan"

Permintaan: border punya kilatan cahaya yang bergerak-gerak saat bicara. Implementasi:
- Comet berputar (gerak utama).
- Ujung comet punya titik terang putih kecil (spark) dengan kedipan halus: opacity .85 ↔ 1, periode ≥ 500 ms.
- **Batas keamanan:** tidak ada perubahan luminansi besar lebih dari 3 kali per detik pada area luas (WCAG 2.3.1). Modulasi level di-smoothing (bagian 7.3).

---

## 7. Tile pengguna: aurora dan border saat bicara

### 7.1 Anatomi tile (urutan lapisan, bawah ke atas)

| z | Lapisan | Catatan |
|---|---|---|
| 0 | Dasar `--ink-800` dengan mesh pribadi sangat redup (palet peserta, alpha .10) | Selalu ada |
| 1 | Video, atau avatar di tengah | Avatar: lingkaran, diameter 28% tinggi tile (min 56, max 120) |
| 2 | **Aurora** (hanya tile kamera mati) | Di belakang avatar, mengelilinginya |
| 3 | Glow dalam (hanya tile kamera menyala) | Di tepi, tidak menutup wajah |
| 4 | **Neon border** | Bagian 6 |
| 5 | Emoji overlay (tangan, AFK) | Bagian 8–9 |
| 6 | Label glass-1 (nama, peran, mic, kualitas) | Selalu terbaca |

### 7.2 Aurora di sekitar avatar (kamera mati, sedang bicara)

**Konsep:** avatar di tengah; aurora bergejolak muncul mengelilinginya dan makin terang makin kencang suaranya.

Komposisi (semua di dalam tile, `overflow: hidden`, radius tile):
- **3 blob** warna 1, warna tengah, warna 2 dari palet peserta; blur 24 px; `mix-blend-mode: screen`; orbit dan scale berbeda tiap blob.
- **1 "tirai" aurora:** bentuk lonjong vertikal bergradient `c1 → c2` dengan mask lembut, bergelombang pelan (skew + translate), memberi kesan pita aurora.
- **Cincin riak:** saat level > 0,6, satu cincin tipis memuai dari tepi avatar (scale 1 → 1,9, fade out 700 ms). Maksimal satu cincin per 700 ms.
- **Avatar** tetap tajam di tengah, dengan ring tipis 2 px warna 1 yang ikut menyala.

### 7.3 Pemetaan level suara ke visual

Input: level suara per peserta, dinormalisasi `L` dalam 0–1.

```
dB = 20 * log10(rms)            // rms 0..1 dari AnalyserNode
L_raw = clamp((dB + 60) / 40, 0, 1)   // -60 dB = 0, -20 dB = 1
speaking = L > 0.12 (gate, histeresis: nyala di 0.12, mati di 0.08)
L = smooth(L_raw, attack 60 ms, release 280 ms)
hold setelah berhenti bicara: 400 ms, lalu fade-out 600 ms
```

| Output | Rumus | Rentang |
|---|---|---|
| Opacity aurora | `0.12 + 0.88 * L^0.8` | .12 → 1 |
| Scale blob | `1.0 + 0.6 * L` | 1 → 1,6 |
| Kecepatan gerak blob | `1 + 1.5 * L` | 1x → 2,5x |
| Saturasi | `100% + 40% * L` | 100 → 140% |
| Opacity neon (`--lvl-border`) | `0.25 + 0.75 * L` | .25 → 1 |
| Periode comet | `2.6s - 1.5s * L` | 2,6 s → 1,1 s |
| Glow dalam (kamera menyala) | `0.1 + 0.4 * L` alpha | .1 → .5 |

`release 280 ms` menjamin intensitas tidak berosilasi lebih dari ±3 kali/detik, menjaga batas aman kedipan.

### 7.4 State tile

| State | Visual | Pemicu |
|---|---|---|
| **Idle** | Border dasar saja. Aurora dan neon mati | Tidak bicara |
| **Bicara** | Aurora (kamera mati) atau glow dalam (kamera menyala) + neon comet 1 arah, intensitas ikut level | Level > gate, di antara 3 audio terkeras |
| **Pembicara dominan** [Ubah] | Seperti Bicara + comet kedua 180° + glow luar x1,3 + naik prioritas halaman grid (perilaku dwell 3 dtk dari kode dipertahankan) | `active-speaker.changed` |
| **Mic mati tapi bersuara** [Tetap] | Neon **amber** berdenyut pelan (periode 1,6 s) + banner "Mikrofon Anda mati, tetapi suara Anda terdengar" | Perilaku kode, hanya tampil untuk diri sendiri |
| **Tangan terangkat** | Emoji tangan melambai (bagian 9) + chip nomor antrean | `hand.state` |
| **AFK/BRB** | Tile redup 35%, emoji status animated di samping avatar, label "AFK" / "BRB" | `afk.state` |
| **Koneksi buruk** | Border rose putus-putus berdenyut ≤ 1 Hz + ikon bar sinyal | `connection.quality` poor |
| **Menyambung ulang** | Shimmer garis tipis menyapu tile (2,4 s), badge "Menyambung ulang" | Status reconnecting |
| **Disematkan** | Ikon pin di pojok, tile pindah ke stage | Aksi pin |

### 7.5 Aturan kinerja tile

- Aurora dan comet hanya dirender untuk tile yang `speaking = true`. Karena SFU meneruskan 3 audio terkeras, **maksimal 3 tile** punya efek mahal pada satu waktu.
- Tile yang tidak terlihat (< 50% visible) tidak merender efek apa pun.
- Pada tile kecil (< 160 px tinggi, misal di strip share screen): aurora diganti glow statis ber-opacity ikut level; comet tetap (murah).

---

## 8. Animated emoji (gaya Telegram)

### 8.1 Prinsip

- **Besar dan hidup:** ukuran emoji overlay `clamp(56px, 30% tinggi tile, 112px)`. Bukan ikon kecil.
- **Muncul dengan spring:** naik dari bawah ke posisi akhir, scale 0,3 → 1, sedikit overshoot.
- **Animasi bawaan emoji berulang** (misal tangan melambai) selama statusnya aktif; interval jeda 1,2 detik antar loop agar tidak melelahkan.
- Selalu transparan (tanpa kotak latar), dengan bayangan lembut `0 6px 16px rgba(0,0,0,.35)`.

### 8.2 Format dan sumber aset

| Opsi | Kelebihan | Catatan |
|---|---|---|
| Lottie / dotLottie | Vektor, kecil, kualitas tajam di semua ukuran, mirip Telegram | Rekomendasi utama |
| WebP/WebM animasi dengan alpha | Mudah, tanpa library | Sudah dipakai (`public/reactions/*.webp`) |
| Rive | Bisa interaktif/state machine | Berlebihan untuk v1 |

**Perhatian lisensi:** jangan menyalin aset Telegram begitu saja; lisensinya perlu dicek. Alternatif: set animated emoji dari Google (Noto Emoji Animation, yang dipakai Meet; setahu gua lisensinya CC BY 4.0 sehingga butuh atribusi, **konfirmasi dulu di repo-nya**) atau bikin set Lottie sendiri dengan gaya yang dikurasi. Tanyakan juga asal aset webp yang sudah ada di `public/reactions`.

### 8.3 Katalog emoji dan tempat pakainya

| Interaksi | Emoji | Ukuran | Perilaku |
|---|---|---|---|
| Angkat tangan | Tangan melambai | Besar (30% tile) | Menetap di kiri avatar selama tangan terangkat |
| High five (mengajak) | Tangan terulur | Besar | Menetap di kiri avatar sampai direspons atau kedaluwarsa |
| High five (jadi) | Dua tangan bertemu | Sangat besar (di tengah layar) | Satu kali, 1,6 s |
| Reaction | 8 emoji (bagian 10) | Sedang (56 px) | Melayang naik |
| AFK | Tidur / zzz | Sedang | Menetap di samping avatar |
| BRB | Kopi | Sedang | Menetap di samping avatar |
| Soundboard | Emoji bawaan tiap suara | Kecil (28 px) di tombol, sedang di chip | Singkat |
| Poll menang | Piala / konfeti | Sedang | Sekali saat poll ditutup |

---

## 9. Angkat tangan dan status kehadiran

### 9.1 Angkat tangan [Ubah]

Tidak lagi sekadar ikon tangan. Saat peserta mengangkat tangan:

1. Emoji **tangan melambai** muncul **di kiri avatar**, ukuran besar.
2. **Gerak masuk:** mulai dari bawah tile (y + 60% tinggi emoji, scale .3, opacity 0), naik ke posisi akhir dengan spring (stiffness 220, damping 18), durasi efektif 420 ms. Posisi akhir: tengah vertikal avatar, x = pusat avatar − radius avatar − 0,6 x lebar emoji.
3. **Loop:** animasi melambai berulang tiap 1,2 detik.
4. **Chip nomor antrean** kecil (glass-1, amber) menempel di bawah emoji. Urutan tetap ditentukan server (`hand_seq`) [Tetap].
5. **Tangan diturunkan:** emoji mengecil dan turun, fade out 220 ms.

Posisi pada tile **kamera menyala:** tidak ada avatar, jadi emoji berada di kiri tengah tile (x = 14% lebar tile), tidak menutupi area wajah di tengah. Pada tile sempit (< 200 px lebar), ukuran emoji turun ke 48 px dan posisi pindah ke pojok kiri atas.

Efek sampingan: bunyi angkat tangan [Tetap], neon amber singkat (600 ms) di border tile saat baru terangkat.

### 9.2 AFK / BRB [Ubah]

- Emoji status animated (zzz / kopi) di samping avatar, ukuran sedang.
- Tile diredupkan 35% dan diberi label glass-1 "AFK" atau "BRB".
- Flip card lama dihapus; digantikan efek ini.

---

## 10. Reaction (gaya Google Meet)

### 10.1 Picker

- Popover glass-2 di atas tombol Reaction pada dock, berisi 8 emoji [Tetap]: jempol, tepuk tangan, hati, pesta, tertawa, terkejut, terima kasih, api.
- Hover/fokus: emoji membesar 1,25x dan **memutar animasinya** (pratinjau, seperti Meet).
- Klik: kirim, popover **tetap terbuka** agar bisa mengirim beruntun, menutup dengan Esc atau klik di luar.
- Dibatasi rate: burst 5 [Tetap].

### 10.2 Tampilan reaction yang diterima

- Emoji **melayang naik** dari area kiri bawah layar (di atas dock), x acak dalam 24–200 px dari tepi kiri.
- Naik 360 px dalam 3,6 detik, bergoyang sinus ±14 px, scale .6 → 1 → .9, fade out 600 ms terakhir.
- Di bawah emoji ada **chip nama pengirim** (glass-1).
- Reaction yang sama beruntun (> 3 dalam 1 detik) digabung menjadi satu emoji dengan chip "x N". Penggabungan di sisi server sudah ada (coalesce 200 ms) [Tetap].
- **Batas layar:** maksimal 12 emoji aktif; sisanya dibuang paling lama dulu.
- Ukuran emoji 56 px (72 px pada layar ≥ 1920 px).

---

## 11. High five [Baru]

### 11.1 Konsep

Terinspirasi high five di Dota 2: seseorang mengajak, dan kalau ada yang menyambut, keduanya bertepuk. Kalau tidak ada yang menyambut, ajakan menggantung sebentar lalu hilang sendiri tanpa rasa malu.

**Adaptasi untuk meeting:** di Dota ajakan ditujukan ke pemain terdekat secara spasial. Di video meeting tidak ada jarak, jadi:
- **Mode utama (v1): ajakan terbuka.** Siapa pun yang menyambut **pertama** menang (server menjadi penengah).
- **Varian (nanti):** ajakan tertarget (klik tile peserta, "Ajak high five") untuk kasus dua orang yang jelas, misal pembuat solusi dan penanya.

### 11.2 Titik masuk

- Tombol **High five** di dock (ikon tangan + animated emoji saat hover).
- Juga tersedia di popover reaction sebagai tombol besar di bagian bawah ("Ajak high five").
- Klik kedua saat menggantung = batalkan ajakan.

### 11.3 Mesin status

```
IDLE --ajak--> OFFERING --disambut orang lain--> MATCHED --1,6 dtk--> IDLE
                  |--lewat 6 dtk tanpa respons--> EXPIRED --animasi hilang--> COOLDOWN 3 dtk --> IDLE
                  |--pengaju membatalkan / keluar / ajakan lain dimulai--> CANCELLED --> IDLE
```

| Parameter | Nilai | Catatan |
|---|---|---|
| Jendela ajakan | **6 detik** | Bisa dituning 5–8 detik |
| Cooldown setelah kedaluwarsa | 3 detik | Mencegah spam ajakan |
| Ajakan aktif per pengaju | 1 | |
| Menyambut ajakan sendiri | Tidak boleh | |
| Penyambut | 1 orang, yang tercepat | Penyambut lain mendapat umpan balik halus (lihat 11.5) |
| Peran yang boleh | Semua termasuk tamu | |

### 11.4 Tampilan saat OFFERING

**Di tile pengaju:**
- Emoji **tangan terulur** animated muncul di kiri avatar, gaya sama seperti angkat tangan (bagian 9.1) tetapi dengan **cincin hitung mundur** tipis (warna palet pengaju) mengelilingi emoji, berkurang selama 6 detik.
- Neon border berpulsa lembut 1 kali per detik dengan warna palet pengaju.

**Di layar peserta lain:**
- Toast glass-2 di tengah atas: "**Dewi** mengajak high five" + tombol primary **"High five!"** (dengan animated emoji).
- Tile pengaju mendapat sorotan halus (glow) agar mudah dikenali.
- Klik di tile pengaju juga berarti menyambut (target klik besar).
- Toast hilang otomatis bersamaan dengan ajakan, tanpa suara.

### 11.5 Saat disambut (MATCHED)

Urutan animasi total **±1,6 detik**, tidak memblokir interaksi (`pointer-events: none`):

| Waktu | Kejadian |
|---|---|
| 0 ms | Emoji tangan kedua pihak lepas dari tile masing-masing, tile keduanya berdenyut sekali |
| 0–450 ms | Kedua tangan meluncur melengkung (bezier) menuju **titik tengah layar**, membesar ke ukuran 140–180 px, easing `--ease-out` |
| 450–550 ms | Tangan bertemu, **tabrak**: tepukan |
| 450 ms | **Efek suara tepukan** diputar (bagian 17) bersamaan dengan benturan |
| 450–1100 ms | Animasi emoji "high five" (dua tangan bertemu) bermain di tengah; **gelombang kejut** (cincin gradient gabungan kedua palet) memuai; **partikel aurora** (±24 titik kecil) menyebar |
| 450–700 ms | Ambient background berkedip halus: opacity blob +40% lalu kembali (bukan flash putih) |
| 1100–1600 ms | Tangan mengecil dan memudar; chip glass-2 "**Dewi x Raka**" tampil 1,2 detik lalu hilang |

Penyambut yang kalah cepat: ajakan sudah diambil; toast mereka berubah jadi "Sudah disambut Raka" lalu hilang, tanpa nuansa gagal.

### 11.6 Saat tidak disambut (EXPIRED)

- Tangan terulur tetap menggantung sampai cincin hitung mundur habis.
- Lalu tangan **turun perlahan** (rotate 25°, translate y +12 px, scale .85) dan memudar dalam 350 ms. Tidak ada pesan, tidak ada suara.

### 11.7 Aturan keamanan dan keramaian

- **Maksimal 2 animasi tengah layar bersamaan.** Match tambahan antre dan dimainkan berurutan.
- **Mode ramai (> 15 peserta):** animasi tengah layar diperkecil 60% dan tidak memakai partikel. Sisi suara tetap.
- **Saat ada share screen:** titik tengah = tengah viewport (di atas stage), ukuran diperkecil 25% agar tidak menutupi konten terlalu lama.
- **Deafen / bisukan bunyi notifikasi:** efek suara tidak diputar, visual tetap.
- **Reduced motion:** tanpa lintasan; kedua emoji muncul statis berdampingan di tengah, crossfade 200 ms, tanpa partikel.
- Pengumuman screen reader: "Dewi dan Raka high five" (aria-live polite).

---

## 12. Soundboard (ala Discord) [Baru]

### 12.1 Titik masuk

- Tombol **Soundboard** (ikon waveform) di dock. Membuka popover glass-2 di atas tombol.

### 12.2 Popover

Ukuran 360 x 440 px, padding 16.

| Bagian | Isi |
|---|---|
| Header | Judul "Soundboard", slider **volume lokal** (0–100, default 60), toggle **"Bisukan soundboard"** (hanya untuk diri sendiri) |
| Pencarian | Input "Cari suara" |
| Tab | **Favorit** · **Bawaan** |
| Grid | 4 kolom, tombol 76 x 76: animated emoji 32 px + nama 11 px (maks 2 baris) + tanda bintang favorit (muncul saat hover) |
| Footer | Teks kecil "Suara diputar ke semua orang di meeting" |

### 12.3 Perilaku

- Klik tombol: suara diputar **untuk semua peserta**. Tombol menampilkan riak aurora dan cincin cooldown.
- **Rate limit:** 1 suara per **3 detik** per pengirim (global, bukan per suara). Selama cooldown, semua tombol meredup dan menampilkan hitung mundur melingkar.
- **Durasi maksimal suara 5 detik.** Level dinormalisasi (target ±-16 LUFS) agar tidak ada suara yang jauh lebih keras.
- Suara yang berpotensi mengagetkan (misal air horn) diberi penanda "Keras" dan volume yang diturunkan 6 dB.
- **Favorit** tersimpan per perangkat (`localStorage`) untuk v1.
- Tidak ada upload suara kustom di v1 (risiko moderasi dan hak cipta). Dicatat sebagai fase berikutnya.

### 12.4 Umpan balik saat ada yang memutar

- Chip glass-1 di bawah tengah layar: animated emoji + "**Raka** memutar *Ta-da*", tampil selama durasi suara (maks 5 detik), maksimal 3 chip bertumpuk.
- Tile Raka menampilkan **mini equalizer** (3 bar) di label namanya dan neon border berdenyut mengikuti envelope suara (tanpa mengubah state "bicara").
- Peserta yang mem-bisukan soundboard tidak mendengar suara, tetapi tetap melihat chip.

### 12.5 Kontrol host

- Toggle **"Izinkan soundboard"** di panel Alat host (bagian Moderasi). Default: aktif.
- Saat dimatikan: tombol soundboard di dock disabled dengan tooltip "Soundboard dimatikan host".
- Host dan co-host dapat membisukan soundboard seseorang melalui menu aksi peserta (usulan).

### 12.6 Set bawaan (usulan, 12 suara)

Tepuk tangan · Drum roll · Ta-da · Wow · Ding · Air horn (Keras) · Rimshot · Sad trombone · Jangkrik · Whoosh · Sorak penonton · Level up.
Semua aset harus **bebas lisensi (CC0) atau dibuat sendiri**. Jangan memakai cuplikan film, lagu, atau meme berhak cipta.

---

## 13. Polling [Baru]

### 13.1 Siapa melakukan apa

| Aksi | Host | Co-host | Peserta | Tamu |
|---|:-:|:-:|:-:|:-:|
| Membuat dan memulai poll | ✅ | ✅ | ❌ | ❌ |
| Vote | ✅ | ✅ | ✅ | ✅ |
| Menutup poll | ✅ | ✅ | ❌ | ❌ |
| Melihat hasil | Selalu | Selalu | Sesuai pengaturan poll | Sesuai pengaturan poll |

### 13.2 Penempatan

- Tab ketiga di panel samping: **Peserta · Chat · Polling**.
- Tombol **Polling** di grup kanan dock (ikon bar chart), dengan **badge** saat ada poll aktif yang belum di-vote.
- Pembuatan poll dari dalam tab Polling (tombol "Buat polling") atau dari panel Alat host.

### 13.3 Form pembuatan (host/co-host)

| Field | Aturan |
|---|---|
| Pertanyaan | Wajib, maks 200 karakter |
| Opsi | Min 2, maks 6, masing-masing maks 80 karakter. Tombol "Tambah opsi", hapus per opsi |
| Pilihan ganda | Toggle, default mati (satu pilihan) |
| Anonim | Toggle, default **aktif** |
| Tampilkan hasil langsung | Toggle, default aktif. Jika mati, hasil muncul setelah poll ditutup |
| Tutup otomatis | Select: Manual · 30 dtk · 1 mnt · 2 mnt · 5 mnt |
| Aksi | **Mulai polling** (primary), Batal |

Satu poll aktif pada satu waktu (v1). Poll baru hanya bisa dibuat setelah yang aktif ditutup.

### 13.4 Tampilan peserta

1. **Poll baru dimulai:** toast glass-2 di tengah atas: "Polling baru: *{pertanyaan}*" + tombol **"Vote"** yang membuka tab Polling. Berlaku juga untuk panel yang tertutup. Bunyi ding halus.
2. **Kartu poll:** pertanyaan (heading Sora), lalu opsi sebagai baris glass besar (tinggi 52 px, seluruh baris bisa diklik). Radio atau checkbox terlihat jelas.
3. **Setelah vote:** pilihan Anda diberi neon border tipis dan centang. Tombol "Ganti pilihan" tersedia selama poll masih terbuka.
4. **Hasil (bila diizinkan):** bar horizontal terisi gradient brand (blue → violet → orchid) dengan animasi lebar spring 500 ms, persentase dan jumlah suara di kanan.
5. **Progres:** "12 dari 15 sudah vote" + bar tipis. Penyebut = peserta yang sedang ada di room.
6. **Timer:** jika ada tutup otomatis, cincin hitung mundur di pojok kartu.

### 13.5 Penutupan dan keputusan

- Setelah ditutup, kartu berubah menjadi **hasil akhir**: opsi pemenang dengan neon border + animated emoji piala sekali. Bila seri, tampil "Seri" dengan opsi yang seri ditandai.
- Tombol host/co-host: **Bagikan hasil ke chat** (mengirim ringkasan teks ke chat publik), **Mulai ulang**, **Tutup panel**.
- Riwayat poll dalam meeting ini tampil sebagai daftar kartu ringkas di tab Polling (terbaru di atas).

### 13.6 State yang harus didesain

Kosong ("Belum ada polling") · Draft · Aktif belum vote · Aktif sudah vote · Aktif tanpa hasil langsung ("Hasil akan muncul setelah polling ditutup") · Ditutup · Seri · Error kirim vote · Koneksi putus saat vote (vote tertahan, ada tombol coba lagi).

> Data poll tidak tersimpan setelah meeting berakhir pada v1 (konsisten dengan chat). Catat sebagai pertanyaan produk bila hasil perlu diekspor.

---

## 14. Layout share screen yang mulus [Ubah]

### 14.1 Perilaku

Saat seseorang mulai berbagi layar:
- Container layar **muncul dari tile presenter** (shared-element): frame glass tumbuh dari posisi dan ukuran tile presenter ke posisi stage.
- Tile peserta lain **mengecil dan bergeser** ke strip (kanan pada layar ≥ 1280 px, bawah pada layar sempit), dengan transisi serempak dan stagger 24 ms per tile (maks 8 tile).
- Saat share berhenti, proses dibalik: stage menyusut ke tile presenter, tile kembali ke grid.

### 14.2 Teknik

- Gunakan **FLIP** (First-Last-Invert-Play) atau `layout` animation (Framer Motion) atau View Transitions API. **Jangan menganimasi `width`/`height`**; hitung layout akhir lalu animasikan `transform` dan `opacity`.
- Konten dalam tile (avatar, label) diberi counter-scale agar tidak terdistorsi saat tile mengecil.
- Video dan layar tidak di-reload selama transisi (jaga `srcObject`, jangan remount elemen).

### 14.3 Parameter

| Parameter | Nilai |
|---|---|
| Durasi masuk | 520 ms (spring: stiffness 260, damping 30) |
| Durasi keluar | 440 ms |
| Stagger tile | 24 ms |
| Morph frame stage | 560 ms |
| Easing | `--ease-out` |

### 14.4 Mode layout

| Mode | Stage | Strip |
|---|---|---|
| `grid` | – | – |
| `stage-pin` | Peserta yang disematkan | Tile lain |
| `stage-screen` | Layar yang dibagikan, frame glass 1 px, padding 8, letterbox `--ink-950` | Kamera peserta, maks 4 sekaligus + pager |
| `stage-self` | Placeholder "Anda sedang berbagi layar" + tombol berhenti | Tile lain |

Selama `stage-screen`: ambient dibuat lebih redup (bagian 5.3); aurora pada tile strip memakai versi sederhana (bagian 7.5); reaction dan high five tetap tampil di atas.

### 14.5 Reduced motion

Tanpa pergeseran: crossfade 150 ms antara dua layout.

---

## 15. Dock kontrol dan panel [Ubah]

### 15.1 Dock mengambang

Dock tidak lagi bar penuh di bawah; menjadi **kapsul glass-3 mengambang** di tengah bawah (jarak 16 px dari tepi bawah, radius 28), sehingga video tetap terlihat penuh di balik dan di sekitarnya.

Susunan (kiri ke kanan), semua 48 px kecuali dicatat:

`[Mic ▾] [Kamera ▾] | [Bagikan layar] [Reaction] [Angkat tangan] [High five] [Soundboard] [Lainnya …] | [Keluar]` (Keluar 72 px, merah)

- Info meeting ("Judul meeting", kode `abc-defg-hij` dalam font mono, timer) pindah ke **pil glass-1** di kiri bawah.
- Tombol panel (**Peserta · Chat · Polling · Alat host**) berada di **pil glass-1 kanan bawah**, dengan badge hitung.
- Tombol aktif: latar `--primary` + glow `--primary-glow`. Tombol mati (mic/kamera off): latar `--danger`.
- Tombol disabled: garis putus-putus, ikon redup, tooltip alasan [Tetap].
- Tooltip glass-1, muncul 300 ms setelah hover/fokus.

### 15.2 Panel samping

- Kartu glass-2 mengambang di kanan (360 px, jarak 16 px dari tepi, tinggi hampir penuh di atas dock), radius 24.
- Tab: **Peserta · Chat · Polling**; panel Alat host berupa kartu terpisah (tidak memakai tab).
- Panel dibuka/ditutup dengan slide + fade 260 ms; grid video menyesuaikan lebarnya dengan FLIP (bagian 14.2).
- Esc menutup panel, fokus kembali ke tombol pemicu [Tetap].

### 15.3 Toast dan banner

- Toast glass-2 di tengah atas, maks 3 bertumpuk, otomatis hilang 5 detik (tidak untuk toast yang butuh aksi seperti ajakan high five atau poll baru).
- Banner pengumuman host [Tetap]: lebar penuh di atas, 30 detik, bisa ditutup, dengan strip gradient aurora tipis di tepi atas.
- Dialog persetujuan rekaman [Tetap]: modal glass-3 di tengah dengan latar gelap alpha .55.

---

## 16. Motion

### 16.1 Durasi dan easing

| Token | Nilai | Pakai |
|---|---|---|
| `--dur-fast` | 120 ms | Hover, toggle |
| `--dur-base` | 220 ms | Popover, tooltip, chip |
| `--dur-slow` | 420 ms | Emoji masuk, kartu poll |
| `--dur-layout` | 520 ms | Perubahan layout grid/stage |
| `--ease-out` | `cubic-bezier(.2,.8,.2,1)` | Default |
| `--ease-spring` | `cubic-bezier(.34,1.56,.64,1)` | Munculnya emoji, tombol |

### 16.2 Aturan

- Hanya animasikan `transform`, `opacity`, dan `filter` pada elemen kecil. Hindari `box-shadow` bertingkat yang dianimasikan; ganti dengan pseudo-element ber-opacity.
- Animasi kontinu (aurora, comet, ambient) dijeda saat tab tersembunyi.
- Satu "bintang" per momen: saat high five sedang main, animasi sekunder (reaction baru) diredam opacity-nya 30%.

---

## 17. Sound design

| Bunyi | Kapan | Karakter | Catatan |
|---|---|---|---|
| Join / leave | Peserta masuk/keluar | Lembut, pendek | [Tetap] mati jika peserta > 15 |
| Angkat tangan | Ada yang mengangkat tangan | Ding halus | [Tetap] selalu lolos |
| **High five (tepuk)** | Saat dua tangan bertemu | Tepukan tangan kering, ±0,6 s, ekor singkat | [Baru] sinkron dengan benturan di 450 ms |
| **Poll baru** | Poll dimulai | Dua nada naik pendek | [Baru] |
| **Soundboard** | Suara dipilih | Sesuai aset | [Baru] maks 5 s |

Aturan:
- Semua efek lewat satu `AudioContext` dengan master gain dan **grup volume**: Notifikasi, Efek (high five), Soundboard. Slider ada di menu "Lainnya".
- Deafen mematikan semuanya. Tombol lonceng yang ada [Tetap] mematikan notifikasi dan efek, bukan soundboard (soundboard punya toggle sendiri).
- Efek suara dibuka dengan gestur pertama (di-unlock saat klik Gabung) [Tetap].
- Efek suara **tidak boleh** bocor ke rekaman sebagai bunyi sistem; soundboard yang ikut direkam adalah keputusan produk (lihat pertanyaan terbuka).

---

## 18. Aksesibilitas

| Topik | Aturan |
|---|---|
| Kontras | Teks `--text-1`/`--text-2`/`--text-3` di atas glass lolos 4,5 : 1 (angka di bagian 2.1). Label di atas video wajib diuji pada video terang; naikkan alpha glass-1 bila perlu |
| Warna bukan satu-satunya sinyal | Bicara juga ditandai ikon equalizer mini di label nama; tangan terangkat punya chip angka; koneksi buruk punya ikon |
| Reduced motion | Aurora statis (opacity ikut level), comet diganti outline neon statis, ambient statis, emoji statis (frame pertama) + crossfade, share screen crossfade |
| Reduced transparency | Semua glass jadi solid `--ink-800` alpha .94 |
| Fotosensitif | Tidak ada kedipan > 3x/detik pada area luas; modulasi level di-smoothing; flash ambient saat high five berupa kenaikan opacity lembut, bukan flash putih |
| Screen reader | `aria-live="polite"` untuk: tangan terangkat, ajakan high five, high five jadi, poll baru, hasil poll. **Jangan** mengumumkan status bicara per frame |
| Keyboard | Semua tombol dock bisa difokus dengan cincin fokus 2 px `--aurora-cyan` + offset 2 px. Usulan pintasan: `M` mic, `V` kamera, `H` angkat tangan, `Shift+H` high five, `C` chat, `P` peserta, `Esc` tutup panel/popover |
| Target sentuh | ≥ 44 px |
| Tooltip | Tidak boleh menjadi satu-satunya cara memahami tombol disabled; alasan juga tersedia sebagai teks aksesibel |

---

## 19. Performa dan tier efek

### 19.1 Pengaturan "Efek visual" [Baru]

Pilihan di menu "Lainnya" (dan di pre-join): **Penuh · Hemat · Mati**. Default: Penuh, dengan penurunan otomatis.

| Fitur | Penuh | Hemat | Mati |
|---|---|---|---|
| Glass blur | 12/24/40 px | 8/12/16 px | Solid |
| Ambient mesh | Animasi drift | Statis | Warna solid |
| Aurora avatar | 3 blob + tirai + riak | Glow statis ikut level | Ring warna |
| Neon comet | 2 arah, glow berlapis | 1 arah, 1 lapis glow | Border solid warna palet |
| Animated emoji | Lottie/animasi | Lottie, tanpa loop berulang | Gambar statis |
| High five tengah layar | Penuh + partikel | Tanpa partikel | Chip teks "Dewi x Raka" + bunyi |
| Soundboard / Polling | Penuh | Penuh | Penuh (fungsional) |

### 19.2 Penurunan otomatis

- Ukur durasi frame. Bila p95 frame time > 24 ms selama 5 detik, turunkan satu tier dan tampilkan toast "Efek visual dikurangi agar meeting tetap lancar" dengan tombol "Kembalikan".
- Mode hemat daya perangkat atau perangkat dengan `navigator.hardwareConcurrency` rendah: mulai dari tier Hemat.
- Tab tersembunyi: semua animasi dijeda.

### 19.3 Anggaran

- Target 60 fps dengan 9 tile dan 3 tile bicara pada laptop kelas menengah.
- Jangan menaruh `backdrop-filter` di atas banyak elemen video yang berbeda; satu lapis glass untuk dock dan satu untuk panel.
- Animated emoji: pool maksimal 12 instance Lottie yang berjalan; lainnya dirender sebagai frame statis.

---

## 20. Catatan untuk engineer

Ini kebutuhan baru yang muncul dari desain. Belum diverifikasi di kode; mohon dikonfirmasi.

**Event signaling baru (usulan)**

| Event | Arah | Payload ringkas |
|---|---|---|
| `highfive.offer` | C→S, S→C | `offer_id`, `from`, `expires_at` |
| `highfive.respond` | C→S | `offer_id` |
| `highfive.match` | S→C | `offer_id`, `a`, `b` (server memilih penyambut pertama) |
| `highfive.expire` / `highfive.cancel` | S→C | `offer_id` |
| `soundboard.play` | C→S, S→C | `sound_id`, `from`; server menegakkan rate limit 1/3 dtk dan flag host |
| `poll.create` / `poll.state` / `poll.vote` / `poll.close` | C↔S | Struktur poll, suara (anonim: tanpa identitas pemilih ke klien lain) |
| `room.state` (tambah) | S→C | `soundboard_enabled`, `poll_active` |

**Level suara per peserta untuk aurora**

SFU hanya meneruskan 3 audio terkeras ke tiap subscriber, jadi klien hanya punya track audio untuk ≤ 3 peserta. Itu cocok dengan batas efek maksimal 3 tile, tetapi artinya:
- Level suara peserta remote dihitung di klien dari track yang diterima (`AnalyserNode`), **atau**
- Server mengirim level terkini bersama `active-speaker.changed` (lebih konsisten antar klien).

Pertanyaan: mana yang dipilih, dan seberapa sering level diupdate (target 15–30 Hz)?

**Aset**
- Set animated emoji (bagian 8.2) dan lisensinya.
- 12 suara soundboard dan 1 efek tepukan, semua bebas lisensi.
- Font: Sora, Plus Jakarta Sans, JetBrains Mono via `next/font`.

**Lainnya**
- Soundboard: diputar lokal dari aset yang di-bundle (bukan media track), agar tidak membebani SFU.
- Rekaman: putuskan apakah bunyi soundboard dan efek tepukan ikut terekam (sekarang rekaman hanya menggabung track media).

---

## 21. Scope prototype meeting room

### 21.1 Yang di-prototype

Prototype interaktif satu layar room (1440 x 900), semua data tiruan, **tidak butuh backend**.

| # | Interaksi | Cara simulasi |
|---|---|---|
| 1 | Aurora dan neon saat bicara | Tweak: slider **level suara** per tile + toggle "sedang bicara"; juga mode "demo otomatis" yang menggilir pembicara |
| 2 | Variasi tile | Tweak: jumlah peserta (4/8/12), kamera hidup/mati per tile, pembicara dominan |
| 3 | Angkat tangan | Klik tombol → emoji melambai muncul di kiri avatar sendiri; peserta tiruan mengangkat tangan lewat tombol demo |
| 4 | Reaction | Picker + emoji melayang; tombol "kirim dari peserta lain" untuk demo |
| 5 | High five | Klik "High five" → menggantung 6 detik. Tombol demo "Simulasikan sambutan" memicu urutan match penuh dengan efek tepukan sintetis |
| 6 | Soundboard | Popover + 12 tombol; suara placeholder disintesis dengan Web Audio |
| 7 | Polling | Buat → mulai → vote → hasil langsung → tutup → pemenang. Suara peserta lain disimulasikan dengan timer |
| 8 | Share screen | Tombol Bagikan layar → transisi grid ke stage-screen yang mulus dan balik lagi |
| 9 | Ambient + glass | Selalu aktif; tweak tier efek (Penuh/Hemat/Mati) |

### 21.2 Daftar artboard/state yang perlu dibuat

1. Room grid (default, ambient + glass, dock mengambang)
2. Close-up tile: seluruh state (bagian 7.4) dalam satu lembar
3. Aurora ladder: tile kamera mati pada level 0 / .25 / .5 / .75 / 1
4. Storyboard high five (6 frame: offering, disambut, meluncur, tabrak, efek, selesai) + versi expired
5. Popover reaction + reaction melayang
6. Popover soundboard (normal, cooldown, dimatikan host)
7. Panel Polling (kosong, form buat, aktif belum vote, sudah vote, hasil akhir, seri)
8. Share screen: keyframe 0%, 50%, 100% dari transisi
9. Toast: ajakan high five, poll baru, soundboard, efek visual dikurangi
10. Tier efek: Penuh vs Hemat vs Mati pada layar yang sama

### 21.3 Kriteria selesai prototype

- Aurora benar-benar terasa mengikuti level suara (tidak sekadar on/off).
- High five terasa "satisfying" dan tetap sopan: hilang diam-diam bila tidak disambut.
- Transisi share screen tidak ada lompatan posisi.
- Berjalan 60 fps di laptop kelas menengah pada tier Penuh dengan 9 tile.
- Semua animasi punya versi reduced motion.

---

## 22. Pertanyaan terbuka

1. **Asal aset animated emoji:** pakai set Noto/Google, bikin sendiri, atau lisensi lain? Atribusi ditempatkan di mana?
2. **High five:** cukup ajakan terbuka (siapa cepat dia dapat), atau perlu mode tertarget sejak v1?
3. **Soundboard direkam?** Bunyi soundboard dan tepukan ikut masuk rekaman atau tidak?
4. **Poll anonim:** bolehkah host melihat siapa memilih apa pada poll non-anonim? Perlu ekspor hasil setelah meeting?
5. **Siapa boleh membuat poll:** hanya host dan co-host (usulan), atau semua peserta?
6. **Level suara remote:** dihitung di klien atau dikirim server? (bagian 20)
7. **Halaman di luar room:** ikut tema Aurora sekarang atau menunggu room selesai?
8. **Mobile/tablet:** efek aurora dan glass perlu versi khusus perangkat sentuh (tier otomatis Hemat)?
9. **Aurora di tile kamera menyala:** cukup glow tepi (usulan), atau pengguna ingin efek yang lebih terlihat meski sedikit menutup video?
10. **Penamaan fitur** di UI: "High five", "Soundboard", "Polling" cukup, atau mau padanan Indonesia?
