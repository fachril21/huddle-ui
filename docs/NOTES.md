# Catatan keputusan dan inkonsistensi dokumen

## Inkonsistensi dokumen
- `Design.md`, `PRD.md`, dan wireframe ada di root sekaligus di `docs/` (PRD & wireframe identik; `Design.md` hanya di root). PRD menyebut `docs/Design.md`. Tidak dipindah.
- Wireframe adalah HTML bundel; hanya dipakai untuk susunan layout.
- Design.md 6.3 menganimasikan `@property --a` (repaint); bentrok dengan aturan "hanya transform/opacity/filter".

## Keputusan (opsi paling sederhana)
- Package manager: npm (bun tidak terpasang).
- Vite di root repo, bukan sub-folder.
- Comet neon: elemen conic-gradient diputar dengan `transform: rotate()` dalam wrapper bermask ring; glow luar = layer statis dengan opacity dianimasikan.
- Kecepatan comet/blob mengikuti level via `Animation.playbackRate` (tanpa lompatan).
- `dotLottie` belum dipasang (baru M3).
- Level suara simulasi dianggap `L_raw` (tanpa rumus dB). Gate 0,12/0,08, attack 60 ms, release 280 ms, hold 400 ms, fade 600 ms.
- Dominan = level terhaluskan tertinggi di antara tile menyala; pergantian butuh unggul >=0,1 selama >=600 ms.
- Peserta lain dengan mic mati tidak menyala meski "bicara"; hanya "Anda" punya state amber mic-mati-tapi-bersuara.
- Chevron `Mic ▾`/`Kamera ▾` di dock dihilangkan (menu perangkat di luar scope).
- Cross-talk menghangatkan ambient (PRD 6.4) disertakan di M2, tanpa pergeseran warna.
- Semua warna/shadow/overlay adalah token di `tokens.css`.

## Keputusan tambahan (M1-M2)
- Tombol "Keluar" di dock belum melakukan apa pun (layar penutup baru di M7).
- Tombol panel kanan (Peserta/Chat/Polling/Alat host) hanya menandai state aktif; panelnya M7. Badge: Peserta = 8, Chat = 1 (tiruan).
- Pil panel kanan memakai ikon + tooltip (tanpa teks label) agar tidak menabrak dock di 1280 px.
- Grid 8 peserta jadi 3-3-2 (baris terakhir di tengah) karena itu memberi tile terbesar di 1440x900.
- Aurora dirender di belakang avatar (teks Design.md 7.2), walau tabel 7.1 menulis aurora di z2 di atas avatar z1.
- Saat tile ke-4 menggeser tile yang kalah, tile yang kalah meredup 300 ms sehingga sesaat ada 4 tile ter-render (efek mahal tetap hanya 3 yang aktif bicara).
- Pembicara dominan: glow luar x1,3 diwujudkan sebagai layer kedua (shadow lebih besar) yang di-fade, bukan menganimasikan ukuran shadow.
- Banner "Mikrofon Anda mati" sedikit menimpa tepi atas grid; sementara (hanya saat terdeteksi).
- Reduced motion: attribute `data-motion="reduced"` di root room (mengikuti media query). Aurora/comet statis, ring riak dimatikan. Simulasi dari Demo Director menyusul (M8).
- `<AnimatedEmoji>` + registry sudah ada tetapi belum dipakai di UI (M3).
- Status tile "Merekam"/"Terkunci" (P2) belum dibuat; chip "Koneksi baik" sekadar statis.

## Keputusan tambahan (M3-M6, drag reorder, mesh)
- Animated emoji: `@usespaceui/emoji` 0.1.0 (MIT) dengan paket Telegram anim. Aset dimuat dari `cdn.spaceui.one` saat runtime (butuh internet; offline jatuh ke glyph native). Lisensi artwork Telegram TIDAK tercakup MIT library. Satu saklar: `EMOJI_PACK` di `src/emoji/registry.ts` (mis. ganti ke `noto`, CC BY 4.0, atribusi diperlukan).
- Bundle: library emoji kini lazy-load (chunk terpisah), jadi bundel utama ~154 KB gzip (di bawah anggaran PRD 300 KB). Chunk `lottie` (78 KB gzip, peringatan `eval` dari lottie-web) hanya dimuat bila format Lottie dipakai; paket Telegram anim memakai WebP sehingga tidak termuat. Sebelum chunk emoji tiba, emoji native tampil sebagai pengganti.
- Mesh ambient: gerak diperbesar (jalur 4 titik, 30-38 dtk, perjalanan ~25-40 vmax) atas permintaan; opacity tetap 0,08-0,14 (Design.md 5.3 meminta +-8 vmax dan 50-70 dtk).
- Drag-and-drop kartu: Motion `drag` + `layout`, reorder saat pointer masuk kartu lain (cooldown 260 ms); keyboard Alt+panah. Dimatikan saat share screen. Urutan tidak disimpan.
- Layout tile memakai posisi absolut hasil hitung JS (bukan flex) agar kartu tidak remount saat grid <-> share screen (FLIP lewat Motion `layout`).
- Share screen: frame tumbuh dari kartu presenter lewat `clip-path` (konten tidak melar). Strip kanan maks 4 kartu + pager; kartu di luar halaman disembunyikan dan tanpa efek. Kartu <160 px tinggi: aurora diganti glow statis.
- Cincin hitung mundur (high five, soundboard, polling) dianimasikan lewat `stroke-dashoffset` pada SVG kecil (bukan transform); dianggap pengecualian kecil dari aturan "hanya transform/opacity/filter".
- High five: satu ajakan terbuka per orang, penyambut tercepat menang, maks 2 animasi tengah layar, jeda 3 dtk setelah kedaluwarsa. Klik tombol dock saat ada ajakan orang lain = menyambut yang tertua.
- Soundboard: 12 suara sintesis Web Audio (semua terverifikasi non-senyap lewat render offline); jeda global 3 dtk per pengirim; favorit di localStorage. "Izinkan soundboard" ada di panel Alat host dan Demo Director.
- Polling: satu poll aktif; suara peserta lain disimulasikan acak tiap 0,9-2,2 dtk; self selalu Host (role switcher belum ada). "Bagikan hasil ke chat" belum ada karena Chat belum dibuat.
- Panel samping: tab Peserta (daftar sederhana + antrean tangan), Polling (lengkap), Chat (placeholder), Alat host (hanya saklar soundboard). Sisa M7 belum dikerjakan.
- Tombol "Keluar" masih tanpa aksi.

## Keputusan tambahan (M7-M8)
- State dipecah menjadi slice reducer (); aksi didefinisikan di .
- Peserta: kolam 12 orang; selector 4/8/12 memindah orang ke/dari . "Keluarkan" memindah orang ke bench (jadi bisa kembali lewat selector).
- Role switcher (Demo Director > Tampilan) mengubah role "Anda": tombol Alat host hanya untuk Host/Co-host, polling hanya dibuat Host/Co-host, "Akhiri untuk semua" hanya Host, berbagi layar bisa dibatasi host. Dialog persetujuan rekaman hanya muncul untuk non-host.
- Jadikan host: peserta itu menjadi Host, Host sebelumnya turun menjadi Co-host.
- Tamu menunggu: Setujui/Tolak hanya menghapus dari daftar dan memunculkan chip pemberitahuan (tidak menambah kartu).
- Paginasi: 9 kartu per halaman saat >9 orang. Pembicara di halaman 2+ yang bicara terus 3 dtk ditukar dengan orang paling lama diam di halaman 1 (bukan Anda). Titik hijau di tombol pager muncul saat ada yang bicara di halaman lain. Pager ada di baris atas bersama chip status.
- Chat: pesan publik/pribadi, saran @mention (panah/Enter/Tab), indikator mengetik; badge unread hanya menghitung pesan dari orang lain yang belum dibaca. Waktu pesan memakai jam tiruan (mulai 10:40).
- Tier efek: Penuh/Hemat/Mati dari "Lainnya". Hemat: blur lebih kecil, mesh statis dengan opasitas setengah, kartu kamera mati tetap beraurora tetapi tipis (opasitas ~35%, tanpa ring riak; kartu <160 px tetap glow statis), satu comet tanpa glow dominan, tanpa percikan high five. Mati: glass solid, tanpa mesh, tanpa aurora (hanya ring avatar), border neon statis, emoji native, high five hanya chip + bunyi (Mati juga dihitung sebagai reduced motion).
- Penurunan tier otomatis berdasarkan frame time (Design.md 19.2) TIDAK dibuat: di lingkungan uji headless ia akan selalu terpicu, dan prototype ini sengaja memberi kontrol manual.
- Skenario otomatis memakai aksi reducer yang sama dengan tombol Demo Director. PRD 10 menjadwalkan ajakan high five Raka di 1:25 dan sambutan Dewi di 1:32, tetapi jendela ajakan 6 dtk (Design.md 11.3) membuatnya kedaluwarsa; sambutan dipercepat ke 1:30.
- Simulasi reduced motion tersedia di Demo Director; media query OS tetap dihormati.
- Belum dikerjakan: webcam asli untuk tile Anda (F20, P2), tombol "Bagikan hasil ke chat" pada polling, "Intensitas efek tepi" (PRD 15 no.2).

## Keputusan tambahan (M9)
- Pintasan memakai `KeyboardEvent.code` (tahan layout keyboard) dan tombol tunggal; modifier Ctrl/Meta/Alt dibiarkan untuk browser dan geser kartu (Alt+panah), `Shift+D` untuk Demo Director. Satu registry (`room/shortcuts.ts`) memberi makan handler, tooltip, dan daftar. Tahan Spasi = bicara sementara; diabaikan bila fokus ada di tombol (Spasi tetap menekan tombol itu). Keluar sengaja tanpa pintasan.
- Suara: tiap peristiwa diturunkan dari perbedaan state (`audio/roomCues.ts`, murni dan dites), jadi tombol, pintasan, skenario, dan Demo Director menghasilkan bunyi yang sama. Efek di-decode ke buffer lewat Web Audio dan dimainkan lewat grup "Notifikasi". Jeda 1,5 dtk per jenis (150 ms untuk mic, 30 dtk untuk koneksi) agar perubahan massal tidak berisik. `playDing` sintesis diganti Raise Hand.
- Efek suara tidak disajikan sebagai file terpisah: file MP3 (`src/audio/files`, total sekitar 820 KB pada 320 kbps; salinan di `assets/source-audio`) dan disematkan sebagai data URI di chunk `soundData` yang dimuat malas setelah gestur pertama (tidak mengubah ukuran bundel awal, ~168 KB gzip). Alasannya: download manager seperti IDM menangkap setiap permintaan audio (`.wav` dibalas 204 kosong di browser uji sehingga bunyi tidak keluar) dan menawarkan mengunduhnya. Tanpa permintaan audio terpisah tidak ada yang bisa ditangkap. File tetap bisa diambil orang yang membongkar bundel; mencegah itu sepenuhnya tidak mungkin untuk aset sisi klien. Mengganti suara: timpa file MP3 di `src/audio/files` (nama sama). Bila ingin chunk lebih kecil, encode ulang ke 96-128 kbps: `ffmpeg -i x.mp3 -codec:a libmp3lame -b:a 96k out.mp3`.
- Kualitas kamera: Rendah 360p/15fps, Sedang 720p/30fps (bawaan), Tinggi 1080p/30fps. Belum ada webcam, jadi pilihan hanya tersimpan (`localStorage`), dipetakan ke constraint `getUserMedia` (`room/cameraQuality.ts`), dan terlihat pada tile Anda (label resolusi, gambar lebih lembut). Saran turun ke Rendah hanya muncul, tidak pernah otomatis.
- Mode layout: Pembicara mengikuti suara dominan dengan jeda tahan 1,2 dtk dan tidak kembali saat semua diam. Sorotan memakai pin; tanpa pin ia mengikuti pembicara. Strip Pembicara maks 6 kartu per halaman, strip Sorotan 4. Paginasi grid, seret kartu, dan Alt+panah hanya aktif di Galeri. Peserta yang disembunyikan karena tanpa kamera tetap ter-mount (diparkir tak terlihat) supaya efek suaranya tidak hilang. Kartu kecil (<160 px) tetap menampilkan tombol pin.
- Bubble chat: hanya untuk pesan dari orang lain (publik atau pribadi ke Anda), berhenti saat panel Chat terbuka. Timernya di komponen, bukan di reducer, karena hanya soal tampilan.
- Undang: domain placeholder `huddle.dibimbing.id`. Salin memakai Clipboard API dengan cadangan `execCommand`; bila keduanya gagal, tautan tetap bisa dipilih manual.
- Klaim host: syarat tidak ada peserta berperan Host. Co-host klaim tanpa kunci, peserta lain memasukkan kunci 6 digit (`482913`, tampil di Demo Director). Reducer menolak klaim bila sudah ada host, jadi klaim yang terlambat tidak menimpa. Alat host hilang dari yang bukan host/co-host secara otomatis. Tidak ada tombol klaim ganda di panel Peserta; banner cukup.
- Coret layar: titik disimpan ternormalisasi (0..1) terhadap kotak layar 16:9, jadi tidak rusak saat layout berubah. Goresan sedang digambar disimpan di ref dan baru masuk reducer saat pointer dilepas (maks 600 titik per goresan, 200 goresan). Goresan hilang saat share berhenti atau pembagi keluar. Pena diberi alas gelap tipis agar terbaca di layar terang maupun gelap. Nama pembuat goresan muncul 2,4 dtk di ujung goresan orang lain. Hilang otomatis menghapus goresan 4 dtk setelah selesai; laser selalu 0,9 dtk. Hanya menggambar dengan pointer; alat bisa dioperasikan keyboard. Teks dan stamp tidak dibuat.

## Keputusan tambahan (Lobby sebelum masuk)
- Aplikasi dimulai di lobby (`src/prejoin/`), bukan langsung di room. `App.tsx` menyimpan `joined`; tombol Masuk mengirim aksi `joinRoom` (nama, mic, kamera, kualitas) lalu menampilkan room. "Mulai ulang demo" di layar penutup kembali ke lobby; reset dari Demo Director tetap di dalam room.
- Hanya lobby yang memakai kamera dan mikrofon sungguhan (`getUserMedia`); room tetap simulasi. Kamera dan mikrofon diminta terpisah supaya izin kamera yang ditolak tidak mematikan mikrofon. Mematikan toggle menghentikan track (lampu kamera padam), dan semua track berhenti saat masuk room.
- Status perangkat: `idle | requesting | granted | denied | no-device | in-use | error` (`mediaState.ts`, murni dan dites). Mikrofon baru "Siap" setelah benar-benar menangkap suara; speaker baru "Siap" setelah pengguna menjawab "Ya" pada nada tes, karena keluaran tidak bisa dideteksi. Tombol Masuk tidak pernah diblokir oleh perangkat: perangkat yang gagal masuk room dalam keadaan mati. Hanya nama kosong yang menonaktifkannya.
- Level mikrofon memakai `AnalyserNode` (AudioContext lokal, bukan `audioEngine`) dan dikirim ke pendengar tiap frame tanpa render React; aurora, ring avatar, glow tepi, dan bar meter membaca level itu langsung dari DOM. Komponen `Aurora` room dipakai ulang lewat variabel CSS yang sama.
- Tes mikrofon merekam 3 dtk lalu memutar ulang (gaya Zoom); tes speaker memutar dua nada lewat `AudioContext.setSinkId`. Pilihan speaker hanya muncul di browser yang mendukung `setSinkId` (Chromium).
- Perangkat yang dicabut ditangani lewat event `ended` pada track dan `devicechange`: status menjadi "tidak ditemukan", dan dicoba lagi otomatis saat perangkat kembali. Pilihan perangkat yang hilang kembali ke bawaan sistem.
- Nama tampilan diingat di `localStorage` (`huddle.displayName`). Pintasan lobby: `Enter` masuk, `M` mic, `V` kamera; tidak aktif saat mengetik atau fokus di tombol.
- Belum dikerjakan: background blur, noise cancellation, cek jaringan, layar menunggu admit host, tata letak mobile (lobby menampilkan pesan "layar terlalu sempit" di bawah 1100 px seperti room). Perangkat yang dipilih di lobby belum diteruskan ke room karena room belum memakai media sungguhan.

## Keputusan tambahan (Dashboard)
- Aplikasi dimulai di dashboard (`src/dashboard/`). `App.tsx` punya tiga tahap: dashboard, lobby (`target` terisi), room (`joined` terisi). Daftar rapat dimiliki `useMeetings` di `App.tsx` supaya perubahan bertahan saat pengguna masuk lobby dan room. "Mulai ulang demo" dan tombol Beranda di lobby kembali ke dashboard. Pengguna diasumsikan sudah login sebagai "Fachril" (`constants.ts`).
- Susunan "Satu bar perintah" dipilih dari tiga opsi: bar lebar untuk Buat rapat / Jadwalkan / kode, baris Room saya, satu strip rapat berikutnya, lalu daftar Hari ini dan Mendatang. Halaman Rapat (sidebar) memuat Mendatang / Sebelumnya dengan pencarian dan filter Anda host / Diundang. Rekaman dan Pengaturan hanya placeholder ("Segera hadir").
- Data tiruan: rapat contoh dibangun ulang relatif terhadap "sekarang" tiap load (`seed.ts`), jadi selalu ada satu rapat yang bisa dimasuki. Hanya rapat buatan pengguna disimpan di `localStorage` (`huddle.meetings.v1`); perubahan pada rapat contoh (batal, ubah) hanya hidup selama sesi. "Rapat dadakan" dan "Buat untuk nanti" tidak masuk jadwal; kode "untuk nanti" hanya dikenali selama sesi.
- Tampilan waktu selalu WIB (`Asia/Jakarta`, tanpa DST, jadi satu hari selalu 24 jam). Konversi zona memakai `Intl` tanpa library (`schedule.ts`, dites termasuk zona DST). Rapat berulang (harian, mingguan, bulanan) diperluas menjadi sesi saat dibaca; bulanan menjepit ke akhir bulan pendek. Batal atau ubah satu sesi menambahkannya ke `skipped`; mengubah satu sesi membuat rapat sekali jalan baru. Mengubah seluruh seri hanya menggeser jam, bukan tanggal awal.
- Bisa masuk 10 menit sebelum mulai (`JOIN_WINDOW_MIN`); hanya host yang boleh memulai lebih awal (`entryAction.ts`).
- Ruang tunggu dan kode sandi di form jadwal hanya tampilan (prototype tidak menegakkannya); kode sandi ikut tercetak di teks undangan. Undangan hanya disalin sebagai teks.
- Room tetap memakai satu rapat tiruan ("Brainstorm sprint", `room/meeting.ts`): judul dan kode di dalam room tidak mengikuti rapat yang dipilih di dashboard. Lobby sudah mengikuti (`JoinTarget`).
- Pintasan dashboard: `N` rapat dadakan, `J` ke kolom kode, `S` jadwalkan; tidak aktif saat mengetik atau saat dialog terbuka. Dialog memakai `<dialog>` native (fokus terkunci, Esc menutup); fokus awal diatur lewat `data-autofocus` karena `autoFocus` React berjalan sebelum dialog terbuka.
- Belum dikerjakan: kalender bulanan, template rapat, sinkron Google/Outlook, email undangan nyata, notifikasi, rekaman, tata letak mobile.

## Keputusan tambahan (Mobile)
- Tiga kelas ukuran (`src/mobile/viewport.ts`): phone sampai 767 px, tablet 768-1099 px, desktop 1100 px ke atas. HP landscape (sentuh, tinggi sampai 500 px) dihitung tablet dengan aturan tinggi-pendek. Angka yang sama diulang di media query CSS (`767px`, `1099px`, `max-height: 500px` + `pointer: coarse`); ubah di semua tempat itu bersama-sama.
- Lapisan mobile ditambahkan sebagai override media query di modul CSS yang ada, bukan menulis ulang mobile-first. JS (`useViewport`) hanya dipakai untuk memilih komponen dan hitungan layout. "Chrome" room (bilah bawah, lembar, bilah atas ringkas) berlaku di semua ukuran non-desktop; "phone" (grid tinggi, swipe, PiP) hanya di bawah 768 px.
- `Sheet` (`src/mobile/`) adalah lembar bawah di atas `<dialog>` native: fokus terkunci, Esc dan ketuk latar menutup, geser pegangan ke bawah menutup, naik di atas keyboard layar lewat `visualViewport`. Di layar lebar ia jadi panel tengah, di HP landscape panel dari kanan. Popover room yang sudah ada dipakai ulang di dalam lembar lewat `Flat` (menghapus posisi dan kaca luarnya).
- Dashboard di HP: tab bar bawah, menu Buat rapat dan aksi baris jadi lembar, form jadwal layar penuh. Lobby di HP: preview di atas, cek perangkat terlipat, Masuk menempel di bawah, tombol balik kamera bila ada lebih dari satu kamera.
- Room di HP: grid dua kolom (satu kolom untuk 1-2 orang), 6 orang per halaman, swipe dan titik halaman; Pembicara/Sorotan = fokus di atas + baris 3 tile; share screen di atas + baris 3 tile, dipusatkan vertikal. Rapat berdua: tile lawan penuh, tile Anda jadi PiP yang bisa diseret ke empat pojok. Seret-untuk-susun-ulang dimatikan di HP; pin hanya ditawarkan di mode Sorotan. Layout dihitung di `layoutMath.compact.ts` (murni, dites).
- Kontrol: bilah bawah berlabel (Mic, Kamera, Reaksi, Chat, Lainnya, Keluar dengan jarak). Peserta ada di chip bilah atas; sisanya di lembar Lainnya. Bilah tidak auto-hide, karena riset menunjukkan toolbar yang hilang membingungkan.
- Sentuh: target minimal 44 px (`--tap`), input 16 px (hindari zoom otomatis iOS), tanpa hover (tooltip dock disembunyikan, tombol nonaktif menjelaskan diri saat diketuk, pintasan keyboard dan keycap disembunyikan), `dvh` dan safe area. Tier efek default di HP: Hemat.
- Tombol Demo menjadi tab tipis di tengah atas di layar non-desktop; panel Demo Director jadi lembar bawah.
- Belum dikerjakan / belum diuji: zoom cubit pada layar yang dibagikan (ditunda atas keputusan), uji di HP fisik (iOS Safari dan Chrome Android), keyboard layar sungguhan di chat dan form (logika `visualViewport` ada tapi hanya diuji lewat emulasi), seret PiP dengan jari sungguhan.

## Pengaturan perangkat di room
- Mic dan kamera punya panel terpisah (`room/devices/MicPopover.tsx`, `CameraPopover.tsx`), masing-masing dibuka dari panah di samping tombolnya. Di HP/tablet keduanya jadi lembar bawah lewat Lainnya > Atur mikrofon / Atur kamera.
- Pilihan perangkat disimpan di `settings.devices` (id kosong = bawaan sistem) dan dibawa dari lobby lewat `JoinChoice.devices`. Perangkat yang tercabut kembali ke bawaan (`useDeviceFallback`).
- Pratinjau kamera dan meter mic memakai `useMediaPreview` yang sama dengan lobby dan hanya berjalan saat panel terbuka dan perangkatnya menyala di meeting; mati berarti stream dihentikan (lampu kamera padam).
- Speaker memengaruhi bunyi notifikasi, efek, dan soundboard (`audioEngine.setOutputDevice`) di browser yang mendukung `setSinkId` (Chromium). Tile Anda di room tetap simulasi, jadi mengganti kamera tidak mengubah gambar di tile.

## Rekaman dan Pengaturan
- Rail dan tab bar kini punya empat halaman nyata (Beranda, Rapat, Rekaman, Pengaturan); "Segera hadir" dihapus. Titik rose kecil di Rekaman menandakan rapat sedang direkam.
- Aturan rekaman: file disimpan 24 jam sejak rekaman berhenti (rapat selesai atau ruangan kosong), lalu dihapus; catatan singkatnya (judul, tanggal, durasi) tersisa 7 hari sebagai jejak "Sudah dihapus". Orang terakhir yang keluar menghentikan rekaman otomatis (alasan "Berhenti otomatis"); rapat yang dimulai lagi menjadi rekaman baru. Logika murni di `src/recordings/retention.ts` (dites). Konstanta: `RETENTION_MS`, `TRACE_MS`, ambang 12 jam (kuning) dan 3 jam (merah).
- Akses: host melihat dan boleh menghapus; peserta hanya melihat rekaman yang dibagikan host ("Dibagikan Dewi", tanpa tombol hapus). Prototype menurunkannya dari `hostName`.
- Halaman Rekaman: daftar diurutkan dari yang paling cepat dihapus, countdown berikon + bar yang menyusut (urgensi tidak hanya warna). Di desktop detail menempel di kanan (pemutar tiruan, fakta, Unduh, Salin tautan, Hapus dengan konfirmasi inline); di tablet dan HP detail jadi lembar bawah.
- Sambungan ke room (`useRecordingSync`): baris muncul saat host mulai merekam, tumbuh selama merekam, dan ditutup saat host berhenti, rapat diakhiri, atau pengguna terakhir keluar. Jika pengguna keluar padahal masih ada peserta lain, baris tetap "Sedang merekam" sampai app dimuat ulang (batasan prototype). Untuk mencoba berhenti otomatis: Demo Director > Peserta jadi 1, lalu Keluar. Menu Keluar menampilkan peringatan, HostPanel memuat aturan, layar penutup menjelaskan nasib rekaman.
- Pengaturan: enam bagian (Profil, Perangkat, Rekaman, Tampilan dan gerak, Suara, Pintasan), tersimpan langsung dengan toast "Tersimpan". Aturan simpan 24 jam ditampilkan sebagai fakta, bukan toggle. Pilihan perangkat bawaan, tier efek, dan bunyi notifikasi disimpan di `huddle.preferences.v1` (`settings/preferences.ts`, dites); lobby memulai dari perangkat bawaan itu. Pengingat sebelum rekaman dihapus hanya menyimpan pilihan (belum ada notifikasi nyata).
- Belum diuji: HP landscape dan tablet untuk dua halaman baru, perangkat sentuh sungguhan.

## Join dan ruang tunggu
- Tombol masuk di daftar rapat, strip rapat berikutnya, lembar HP, dan Room saya kini selalu "Join" untuk semua orang (`dashboard/entryAction.ts`, hanya bergantung pada status sesi). Tautan bisa dipakai kapan saja, jadi tidak ada lagi "Mulai" atau "Belum dibuka". Sebelum jendela sesi tombolnya sekunder, bukan nonaktif. Dialog bagikan memakai "Join sekarang".
- Rapat dengan ruang tunggu (`security.waitingRoom`) dan Anda bukan host: lobby menampilkan "Minta bergabung", lalu tahap baru `waiting` di `App` (lobby > waiting > room). Seed: "Review desain mingguan" (host Dewi) memakainya.
- Status tamu (`src/waiting/admission.ts`, murni dan dites): menunggu, host belum hadir, diizinkan, ditolak, tidak ada respons (10 menit), rapat dikunci. Host dianggap hadir bila sesi `live`; selain itu tamu melihat "Host belum membuka rapat". Layar `waiting/WaitingRoom.tsx` memakai ulang tata letak lobby: preview kamera tetap hidup dengan mic/kamera yang bisa diubah, cincin aurora bernapas hanya saat menunggu, ikon + kata (bukan warna saja) untuk tiap hasil, `role="status"`, fokus pindah ke tombol utama saat ditolak/timeout/dikunci. Diizinkan: kilasan sekitar 1 detik lalu room terbuka dengan mic/kamera terakhir.
- Sisi host: `host.waitingRoom` (sakelar di Alat host > Moderasi; mematikannya mengizinkan semua yang antre), `guestAdmitAll`, tamu membawa waktu `at` ("menunggu 0:42"). Daftar `features/host/WaitingGuests.tsx` dipakai di Alat host dan di panel Peserta (hanya host/co-host). Toast `GuestRequestToast` bertahan sampai dijawab: satu tamu = Izinkan langsung, banyak = "n orang menunggu" + Izinkan semua; disembunyikan saat panel yang memuat daftar terbuka. Bunyi `incomingChat` hanya untuk yang bisa menjawab.
- Mencoba: Join "Review desain mingguan" > Minta bergabung > Demo Director > "Ruang tunggu (sisi tamu)" untuk keenam hasil. Sisi host: di room, Demo Director > Kejadian cepat > "Tamu meminta masuk".
- Batasan prototype: tidak ada host sungguhan yang menjawab, jadi hasil dipicu dari Demo Director. Tamu yang diizinkan tidak muncul sebagai peserta baru di room tiruan. Belum diuji: tablet dan HP landscape untuk layar menunggu, perangkat sentuh sungguhan.

## Soundboard berbasis file
- Soundboard bawaan Huddle sekarang 12 file MP3 (`src/audio/soundboard`), bukan sintesis. Aslinya di `assets/source-audio/Soundboard`; `scripts/build-soundboard-audio.sh` memotong sunyi, memotong yang melewati 5 dtk dengan fade-out (tepuk tangan, sorak penonton), menyamakan loudness ke -16 LUFS (puncak maks -1 dBFS), membuang gambar sampul, dan meng-encode 128 kbps (total sekitar 550 KB).
- Pemuatan sama dengan efek ruangan: data URI di chunk malas `soundboardData`, di-decode setelah gestur pertama (`preloadSoundboard`). Id suara tidak berubah, jadi favorit dan skenario tetap valid; `durationMs` cocok dengan panjang file (dites di `soundboardSounds.test.ts`).
- Mengganti suara: taruh file asli baru di `assets/source-audio/Soundboard`, sesuaikan tabel potongan di skrip, jalankan ulang, lalu perbarui `durationMs`. Tepuk tangan tertahan limiter (sekitar -19,7 LUFS) karena puncaknya tajam.
- Lisensi file ditanggung pemilik proyek; komentar "tanpa lisensi" untuk suara sintesis tidak berlaku lagi.
