# ZippyVerse — Petualangan di Planet Luminara — AGENTS.md

Dokumen acuan bagi **agen AI dan manusia** yang akan mengubah kode di
repositori ini.

> **Cara memakai berkas ini**
> - Bagian 1–3 menjelaskan *apa* proyeknya — baca sekali sebelum mulai.
> - Bagian 4 adalah **batasan yang tidak boleh dilanggar** — baca setiap kali
>   menyentuh kode.
> - Bagian 5 menjelaskan *bagaimana* proyek ini dibangun, supaya iterasi
>   berikutnya tidak mengulang kesalahan lama.
>
> **Tanda `[TINJAU]`** menandai klaim yang belum bisa dipastikan dari isi
> repositori dan menunggu konfirmasi pemilik proyek. Jangan menganggapnya final
> sebelum tanda itu dilepas.
>
> **Cara memverifikasi ulang:** setiap angka di bawah berasal dari perintah
> yang bisa dijalankan ulang — `npm test`, `git log`, penghitungan berkas, atau
> pembacaan langsung berkas yang disebutkan.

---

## 1. Ringkasan Project

**ZippyVerse adalah game edukasi web untuk anak sekolah dasar**, dibintangi
maskot Zippy di Planet Luminara.

> [TINJAU] **Soal tema.** Instrumen proyek menyebut tujuannya sebagai
> *"website edukasi coding anak SD"*. Namun isi konten yang benar-benar ada di
> kode mencakup pelajaran umum: **angka, kata, sains, kreatif, bumi**. Satu-satunya
> pulau bertema teknologi adalah **Pulau Digital**, dan statusnya
> `available: false` / `soon: true` — belum punya satu misi pun. Jadi
> "edukasi coding" saat ini **belum terwujud di dalam kode**. Putuskan apakah
> naskah dokumen lomba akan menyesuaikan isi, atau Pulau Digital perlu diisi
> lebih dulu.

### Masalah yang dijawab

Anak SD jaman sekarang menghabiskan waktu menonton video yang menggulir tanpa
henti. Tontonan semacam itu menuntut **nol usaha** dari anak namun memberi
**nol manfaat**: tidak ada yang dipraktikkan, tidak ada yang diingat, dan
tidak ada rasa selesai. Yang didapat anak hanyalah kebiasaan menunggu konten
berikutnya.

ZippyVerse menukar tontonan pasif itu menjadi **misi singkat yang menuntut
jawaban**. Anak tetap merasa sedang bermain — ada pulau, bos, koin, dan kostum
— namun setiap poin yang dikumpulkan berasal dari upaya memecahkan soal.

### Tiga keputusan desain yang lahir dari tujuan itu

1. **Satu misi berdurasi ±3 menit**, lebih pendek daripada satu video, sehingga
   berhenti di tengah bukan kekalahan.
2. **Tidak ada kata "gagal" di layar.** Jawaban salah dijawab dengan petunjuk,
   bukan teguran — anak yang merasa bodoh akan berhenti bermain.
3. **Anak yang belum lancar membaca tetap bisa bermain.** Seluruh soal dan
   petunjuk direkam dalam suara Indonesia.

### Dua pengguna sekaligus

- **Anak** sebagai pemain.
- **Orang tua** yang perlu tahu apa sebenarnya yang dikerjakan anaknya di layar
  (lewat dasbor perkembangan yang bersifat baca-saja).

---

## 2. Stack & Tools

Seluruh daftar ini diambil dari `package.json`, bukan dari ingatan.

### Ketergantungan (`dependencies`)

| Paket | Versi terpasang | Peran |
| --- | --- | --- |
| `next` | ^15.1.3 | Kerangka, App Router, penyajian statis |
| `react` · `react-dom` | ^19.0.0 | Antarmuka |
| `framer-motion` | ^11.15.0 | Animasi masuk/keluar dengan `transform` |
| `lucide-react` | ^0.469.0 | Ikon |
| `@supabase/supabase-js` | ^2.47.10 | Autentikasi dan penyimpanan terkelola |
| `@google/generative-ai` | ^0.21.0 | Menjawab pertanyaan anak lewat Gemini |

### Pengembangan (`devDependencies`)

`tailwindcss` ^3.4.17 · `postcss` ^8.4.49 · `autoprefixer` ^10.4.20 ·
`eslint` ^9.39.5 · `eslint-config-next` ^15.5.27 · `sharp` ^0.35.5

### Perintah yang tersedia

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Pengembangan |
| `npm run build` | Bangun untuk produksi |
| `npm start` | Jalankan hasil build |
| `npm run lint` | Periksa kode |
| `npm test` | **184 pengujian dalam 33 rangkaian** (`node --test tests/*.test.mjs`) |
| `npm run audio` | Kumpulkan teks soal lalu rekam suaranya lewat Python |

> Tidak ada `composer.json` — ini proyek JavaScript murni, bukan PHP.

### Gaya

- **Tailwind CSS 3.4** dengan konfigurasi di `tailwind.config.js`. Kelas yang
  dibangun dinamis (`animate-${nama}`) didaftarkan manual di `safelist` karena
  tidak terlihat oleh pemindai.
- **Font** diunduh saat build lewat `next/font/google`, bukan lewat `<link>` ke
  asing: `Fredoka` → `--font-display`, `Baloo_2` → `--font-body`, keduanya
  `weight: "variable"`, `subsets: ["latin"]`, `display: "swap"`.

### Penyimpanan

| Tempat | Peran |
| --- | --- |
| `localStorage` | **Penyimpanan utama** — permainan tetap jalan meski sinyal hilang |
| Supabase | Sesi akun, daftar anak per akun, tabel `planets`/`missions` |

Kebijakan keras: **daftar kosong tidak boleh menghapus apa pun.** Bila
sinkronisasi awan mengembalikan daftar kosong, data perangkat tidak ditimpa.

### Kecerdasan buatan

| Nilai | Keterangan | Berkas |
| --- | --- | --- |
| `gemini-3.5-flash-lite` | Model utama | `app/api/zippy/route.js` baris 116 |
| `gemini-3.5-flash` | Cadangan bila model utama gagal | idem |
| `maxOutputTokens: 220` | Jawaban selalu ringkas | baris 215 |
| `temperature: 0.8`, `topP: 0.9` | — | baris 216–217 |
| `MAX_HISTORY = 6` | Riwayat pesan terakhir saja | baris 17 |
| `MAX_MSG_CHARS = 280` | Batas panjang pesan anak | baris 18 |
| `RATE_MAX = 12` per `RATE_WINDOW_MS` 60 detik | Pembatas laju per IP | baris 32–33 |
| `MODEL_TIMEOUT_MS = 15000` | Supaya presentasi tidak menggantung | baris 119 |
| Pemutus arus 5 menit | Kalau semua model gagal, Gemini dilewati | baris 152 |
| `lib/zippyBrain.js` | Cadangan luring berbasis kata kunci | — |

**Penting:** kolom `mode` pada respons API menyatakan siapa yang menjawab —
`"gemini"` atau `"fallback"`. Bila `mode` selalu `fallback`, periksa
`GEMINI_API_KEY` lebih dulu sebelum mencurigai kode.

> **AI pembangun:** [TINJAU] OpenCode · MiMo — sesuaikan bila pemilik proyek
> memakai nama paket yang lain.

### Hosting

**Vercel** — `https://zippyverse.vercel.app/`

> **Keadaan terkini, diperiksa 15 Okt 2026.** Proyek Vercel **tidak tersambung
> ke integrasi Git**, sehingga push ke GitHub **tidak memicu deploy**. Perbaikan
> yang sudah mendarat di `main` perlu di-deploy ulang dengan tangan.
>
> Variabel lingkungan yang perlu ada di Vercel:
>
> | Variabel | Keadaan 15 Okt 2026 |
> | --- | --- |
> | `GEMINI_API_KEY` | **kosong** — AI tidak berjalan |
> | `NEXT_PUBLIC_SITE_URL` | kosong (sudah ditangani `lib/situsUrl.js`) |
> | `NEXT_PUBLIC_SUPABASE_URL` | terisi |
> | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | terisi |

---

## 3. Fitur & Halaman

Seluruh daftar ini diambil dari isi `app/`, bukan dari rencana.

### Peta rute (`app/` — 23 berkas)

| Rute | Berkas | Peran |
| --- | --- | --- |
| `/` | `app/page.jsx` | Halaman pengantar pengunjung & profil akun Pendamping |
| `/daftar` | `app/daftar/page.jsx` | Pendaftaran dan pemasukan akun Pendamping |
| `/peta` | `app/peta/page.jsx` | Peta dunia, pemilihan pulau, toko |
| `/pulau/[slug]` | `app/pulau/[slug]/page.jsx` | Pemilihan misi → permainan → hadiah |
| `/dashboard` | `app/dashboard/page.jsx` | Dasbor perkembangan anak (baca-saja) |
| `/profil` | `app/profil/page.jsx` | Profil akun Pendamping |
| `/admin` | `app/admin/page.jsx` | Panel pengelola (gerbang PIN) |
| `/api/zippy` | `app/api/zippy/route.js` | Jawaban AI (`POST`) |
| `/api/admin` | `app/api/admin/route.js` | Kewenangan pengelola (`GET`, `POST`) |
| `/api/anak` | `app/api/anak/route.js` | Daftar anak per akun (`GET`, `POST`) |
| `/api/masukan` | `app/api/masukan/route.js` | Umpan balik, maks 5 pesan/hari (`POST`, `GET`) |
| `robots` · `sitemap` | `app/robots.js`, `app/sitemap.js` | Perayap & peta situs |
| — | `app/not-found.jsx` | Halaman 404 berbahasa Indonesia |
| — | `app/icon.svg` | Ikon tab (otomatis ditautkan Next) |
| — | `app/layout.jsx` | Kerangka, font, meta, pembungkus `PemuatKonten` |

Enam rute halaman punya `layout.jsx` sendiri untuk metadata per halaman
(`admin`, `daftar`, `dashboard`, `peta`, `profil`, `pulau/[slug]`).

### Pulau (`lib/gameData.js` baris 61–216)

| Slug | Nama | Subjek | `available` |
| --- | --- | --- | --- |
| `coba` | Pulau Perkenalan | Perkenalan | selalu terbuka (uji coba) |
| `angka` | Pulau Angka | Matematika | `true` |
| `kata` | Pulau Kata | Bahasa Indonesia | `false` pada cadangan statis |
| `sains` | Pulau Sains | IPA | `false` pada cadangan statis |
| `kreatif` | Pulau Kreatif | Seni | `false` pada cadangan statis |
| `bumi` | Pulau Bumi | IPS | `false` pada cadangan statis |
| `inggris` | Pulau Inggris | Bahasa Inggris | `false` — "segera hadir" |
| `musik` | Pulau Musik | Musik | `false` — "segera hadir" |
| `digital` | Pulau Digital | Teknologi | `false` — "segera hadir" |

**Total 9 pulau**, ditambah `DAILY_SLUG` (`harian`) untuk Tantangan Harian.

> **Cara membaca kolom `available`.** Nilai di atas berasal dari **cadangan
> statis** di dalam kode. Konten yang benar-benar tayang disimpan di tabel
> Supabase `planets`/`missions` dan dapat disunting dari `/admin`, sehingga
> jumlah pulau terbuka di situs sungguhan bisa melebihi angka statis.
> [TINJAU — petakan tabel Supabase dan bandingkan dengan cadangan statis.]

### Konten misi — angka yang terverifikasi dari kode

| Kelompok | Berkas | Misi | Butir |
| --- | --- | --- | --- |
| Pulau Angka | `lib/gameData.js` (`M1`–`M3_ROUNDS`) | 3 | 33 |
| Pulau Kata, Sains, Kreatif, Bumi | `lib/missionsExtra.js` (`K1`–`B3`) | 12 | 74 |
| Pulau uji coba | `lib/trialIsland.js` (`t1`–`t3`) | 3 | 36 |
| Tantangan Harian | `lib/missionsExtra.js` (`SOAL_HARIAN`, 38 soal; 5 dipakai per hari) | 1 | 5 |
| **Total** | | **19** | **143** |

Cara menghitung ulang: jumlah objek soal dalam tiap larik `const XX = [...]`
pada ketiga berkas di atas.

> [TINJAU] **Angka 34 misi / 258 butir** yang sempat tercantum di dokumentasi
> lama **tidak terbukti dari isi repositori**. Angka itu kemungkinan berasal
> dari konten yang sudah diterbitkan di Supabase. Bila benar, catat sumbernya
> secara terpisah supaya tidak tercampur dengan angka statis.

### Tipe misi — 6

`dragcount` · `blitz` · `boss` · `mcq` · `scramble` · `order`

Satu komponen per tipe di `components/missions/`:
`MissionDragCount`, `MissionBlitz`, `MissionBoss`, `MissionMCQ`,
`MissionScramble`, `MissionOrder`.

### Sistem permainan (`lib/store.js`)

| Aturan | Nilai | Baris |
| --- | --- | --- |
| Energi maksimum | `MAX_STAMINA = 20` | 23 |
| Biaya tiap misi | `STAMINA_PER_MISSION = 2` | 24 |
| Pemulihan energi | `STAMINA_REGEN_MS = 8 menit` | 26 |
| Hadiah login harian | `DAILY_REWARDS = [50, 75, 100, 125, 150, 200, 300]` | 32 |
| Peti hadiah | `PULAU_PER_PETI = 3` | 351 |
| Level | Turunan dari XP, tidak pernah disimpan | — |

### Kostum — 8 (`lib/gameData.js` baris 391–399)

`default` (gratis) · `melompat` 60 · `merayakan` 60 · `menunjuk` 90 ·
`membaca` 90 · `berlari` 120 · `berpikir` 120 · `samping` 150

### Peran

| Peran | Hak |
| --- | --- |
| **Tamu** | Bermain **Pulau Perkenalan** saja; kemajuan di `localStorage` |
| **Akun Pendamping** | Satu akun keluarga, banyak profil anak, kemajuan terpisah per anak |
| **Pengelola** | `/admin` + gerbang PIN; peran diverifikasi di **server** lewat `app_metadata.role` |

### Aset (`public/` — 240 berkas)

| Folder | Isi |
| --- | --- |
| `public/audio/` | 211 rekaman mp3 soal & petunjuk bahasa Indonesia |
| `public/sfx/` | 6 efek suara |
| `public/zippy/` | 14 pose/ekspresi maskot (WebP) |
| `public/islands/` | 8 ikon pulau (5 WebP + 3 SVG) |
| `public/loading/` | 1 gambar meteor |

---

## 4. Aturan Kerja

Aturan ini berlaku bagi **siapa pun** — manusia maupun agen AI. Sebagian besar
lahir dari kesalahan yang memang pernah terjadi.

### 4.1 · Sebelum menyentuh kode

1. **Baca dulu, ubah kemudian.** Temukan pola yang sudah dipakai di berkas
   sejenis dan ikuti polanya.
2. **Perubahan harus kecil dan dapat dibedakan.** Satu tujuan per perubahan.
3. **Jangan memperbaiki sesuatu yang belum diminta izinnya.** Laporkan temuan
   lebih dulu.

### 4.2 · Struktur folder

```
zippyverse/
├── app/           23 berkas — 7 halaman, 4 endpoint API, robots, sitemap,
│                             layout, not-found, icon.svg, globals.css
├── components/    25 berkas — 6 misi, 7 panel admin, 12 umum
├── lib/           25 berkas — 24 modul JS + audioManifest.json
├── public/        240 berkas — 217 mp3, 20 webp, 3 svg
├── scripts/       kumpulTeks.mjs, generateAudio.py, optimize-assets.mjs
│   └── .tmp/      hasil ubah .js → .mjs untuk `node --test` (jangan dikomit)
└── tests/         8 berkas .test.mjs — 184 pengujian
```

### 4.3 · Penamaan berkas

| Lokasi | Konvensi | Contoh |
| --- | --- | --- |
| `components/` | `PascalCase.jsx` — 25/25 memakainya | `MissionDragCount.jsx`, `ShopModal.jsx` |
| `lib/` | `camelCase.js` — 24/24 memakainya | `gameData.js`, `situsUrl.js` |
| `app/` | Folder rute **huruf kecil** | `pulau/[slug]/page.jsx` |
| Berkas sementara | **Dilarang** masuk `lib/` atau akar | tidak ada `tmp`/`old`/`bak`/`baru` |

### 4.4 · Konvensi commit

Prefix konvensional, disusul subjek yang menyebut **apa yang berubah dan
mengapa** — bukan sekadar apa. Tulis dalam **Bahasa Indonesia**.

```
feat:  ...
fix:   ...
docs:  ...
chore: ...
```

Kebiasaan yang sudah terbentuk pada 35 komit (14–15 Okt 2026):
`fix` 18 · `feat` 12 · `docs` 2 · `chore` 2. Rata-rata panjang pesan ±65
karakter, tanpa pesan pendek seperti "update" atau "fix" saja.

> **Pembungkus pesan commit:** PowerShell 5.1 menulis UTF-16 bila memakai `>`,
> dan pipa merusak UTF-8. Tulis pesan ke berkas lewat
> `[System.IO.File]::WriteAllText` dengan `New-Object System.Text.UTF8Encoding($false)`,
> lalu `git commit -F`.

### 4.5 · Gaya kode

- Komentar **menjelaskan alasan**, bukan mengulang kode.
- Kode dan pesan commit dalam **Bahasa Indonesia**; identifier boleh campur
  asalkan konsisten dengan berkas sekitar.
- Logika yang bisa diuji diletakkan di `lib/` sebagai fungsi murni, lalu diuji
  di `tests/`.

### 4.6 · Batasan tampilan (TIDAK BOLEH dilanggar)

5. **Palet warna tetap** — ada di `tailwind.config.js` → `colors.zippy`:
   Teal `#2AA5A0`, Mint `#B2D8D5`, Kuning `#FFC93C`, Krem `#FFF6E5`, Navy
   `#0F2C3D`. Inilah identitas visual ZippyVerse.
6. **Layar kecil dulu.** Setiap tampilan harus rapi pada **320, 375, 768 px**,
   lalu nyaman pada 1366 dan 1920. Gunakan `min-w-0` pada elemen di dalam
   wadah yang bisa mengecil.
7. **Animasi hanya `transform` dan `opacity`.** Seluruh `keyframes` di
   `tailwind.config.js` (floaty, wiggle, bob, popIn, shake, twinkle, drift,
   rise, orbit, spinSlow, driftA/B/C, dll) sudah mematuhinya. `top`, `left`,
   `width`, `height` memicu hitung ulang tata letak dan membuat gerakan patah
   di HP murah.
8. **Hormati `prefers-reduced-motion`.** `app/globals.css` baris 357 mematikan
   animasi lewat pemilih `html:not([data-motion="on"])`, bukan sekadar media
   query — supaya pengguna yang menyalakan kembali animasi tetap dihormati.
9. **Jangan memakai `maximumScale: 1`.** Memperbesar layar adalah cara
   satu-satunya bagi pengguna berpenglihatan lemah untuk membaca. Anti-zoom
   saat bermain ditangani lewat `touch-action`: `none` pada area seret-jatuh
   (baris 290), `manipulation` pada tombol (baris 307).
10. **Gambar memakai WebP**, dan `<img>` selalu diberi `object-contain` bila
    kotaknya tidak persis sama rasio berkasnya. Setiap gambar **wajib punya
    `alt`** (`alt=""` untuk yang murni dekoratif).
11. **Ukuran teks dan tombol untuk anak.** Huruf di tampilan anak minimal
    `text-xs` (12 px), target sentuh minimal 40 px, dan setiap tombol ikon
    wajib punya `aria-label`. Panel admin dikecualikan karena dipakai orang
    dewasa.

### 4.7 · Batasan data & keamanan

12. **Rahasia tidak pernah masuk berkas.** Kunci API hanya di `.env.local` dan
    variabel server. Jangan pernah mencetaknya ke halaman, log, atau laporan.
13. **`SUPABASE_SERVICE_ROLE_KEY` hanya hidup di proses server.** Klien tidak
    boleh pernah menerimanya.
14. **Peran pengelola diverifikasi di server**, bukan di peramban
    (`app/api/admin/route.js` memeriksa `app_metadata.role`).
15. **Anak tidak boleh bocor antar akun Pendamping.** Pemindahan profil
    dilakukan dengan menukar **seluruh blok simpanan**, bukan menyusun ulang
    struktur data.
16. **Daftar kosong tidak boleh menghapus apa pun.** Kegagalan dan "tidak ada
    data" dibedakan (`daftarRusak`).

### 4.8 · Sebelum menyatakan selesai

Tiga perintah ini **harus lulus**, tanpa kecuali:

```bash
npm test        # 184 pengujian
npm run lint
npm run build
```

17. **Periksa secara nyata di peramban**, jangan hanya percaya hasil build.
    Halaman yang sukses dibangun tetap bisa tampil kosong atau meluber.
18. **Bila menambah atau mengubah soal**, jalankan `npm run audio` agar
    rekaman suaranya ikut dibuat. Tanpa itu soal baru hanya dibacakan suara
    bawaan perangkat, yang tidak selalu tersedia dalam Bahasa Indonesia.
19. **Jangan mengubah nilai bawaan yang dipakai pengujian** — khususnya
    `lib/costumePerks.js` (harus tetap mengekspor objek kosong) dan nilai
    stamina di `lib/store.js`.
20. **Bedakan yang sudah dipastikan dari yang masih dugaan.** Hasil pengamatan
    langsung ditulis berbeda dari perkiraan tanpa bukti.

---

## 5. Catatan Pengembangan

Bagian ini menjelaskan **cara proyek ini dibangun**, supaya iterasi berikutnya
tidak mengulang kesalahan yang sama.

### 5.1 · Peran AI dalam membangun proyek ini

Dua lapis perlu dibedakan jangan sampai tertukar.

**AI sebagai pembangun** [TINJAU — konfirmasi urutan percakapan awal dari log
prompt asli; bagian ini disusun dari keadaan repositori, bukan dari log.]:

- **Ide berasal dari AI, lalu langsung dibangun** — tanpa dokumen PRD
  terpisah lebih dulu. Buktinya: `PRD.md`, `docs/`, `PLAN.md`, dan `CLAUDE.md`
  tidak pernah dibuat; satu-satunya dokumen adalah `README.md` yang lahir
  bersamaan dengan impor kode.
- Seluruh kerangka masuk git **serentak**: repositori diinisialisasi 14 Okt
  2026 pukul 13:05:52, lalu empat komit lagi mendarat pada 13:05:55, 13:05:56,
  13:05:56, dan 13:05:57 — konfigurasi, aset, logika, antarmuka, lalu README,
  semuanya dalam **selisih 5 detik**.
- Pengerjaan lanjutan mengikuti pola **perintah → hasil → verifikasi**, bukan
  pengaruh langsung: setiap perbaikan bug diwajibkan melewati alur REPRODUKSI →
  DIAGNOSA → PERBAIKAN MINIMAL → VERIFIKASI → COMMIT → CATATAN JURNAL
  (`JURNAL-DEBUGGING.md`).

**AI sebagai fitur produk**: `app/api/zippy/route.js` menjawab pertanyaan anak
lewat Gemini dengan sistem perintah yang menetapkan Zippy sebagai *Si
Penjelajah Ilmu dari Planet Luminara* (baris 61–73), maksimal 2 kalimat, dan
selalu mengarahkan kembali ke pelajaran SD. Bila AI tidak tersedia,
`lib/zippyBrain.js` mengambil alih dengan jawaban berbasis kata kunci.

### 5.2 · Riwayat iterasi

Riwayat git memuat **35 komit** pada 14–15 Okt 2026:

| Prefix | Jumlah |
| --- | --- |
| `fix` | 18 |
| `feat` | 12 |
| `docs` | 2 |
| `chore` | 2 |
| non-konvensional | 1 |

Pola siklusnya: **bangun → pakai → rusak → perbaiki**. Yang membuat pola ini
sehat: sebagian perbaikan bug menyentuh `tests/` sekaligus, sehingga bug
diperbaiki **dengan uji regresi**, bukan ditambal saja.

### 5.3 · Pola debugging yang terbukti berhasil

Lima dari tujuh perbaikan bug gelombang pertama berada dalam rentang **14 Okt
16:38–20:40**, tepat di antara dua penambahan fitur besar.

Kesalahan berulang yang layak diingat:

| Kesalahan | Perbaikan |
| --- | --- |
| Menu pengelola ikut hilang begitu akun keluar | Status sesi dipisahkan dari status tampilan |
| Anak ikut terbawa saat pindah akun Pendamping | Blok simpanan ditukar utuh, bukan disusun ulang |
| Daftar akun gagal dianggap "tidak ada akun" | Kegagalan ≠ kosong — dibedakan `daftarRusak` |
| Anak yang belum pernah bermain tidak menerima hasil suntingan | Cabang `masihKosong` pada `adopsiNilaiPemain()` |
| `onClick` pada `div` mematikan jalur papan ketik tanpa error | Ditambahkan `role`, `tabIndex`, `onKeyDown` |
| Metadata halaman tidak pernah tampil berbeda | Dipindah ke `layout.jsx` — komponen klien dilarang mengekspor `metadata` |
| Alamat absolut menunjuk ke `localhost` setelah di-host | Disatukan di `lib/situsUrl.js` dengan cadangan alamat Vercel |

### 5.4 · Audit & optimasi

- **Laporan audit** disimpan sebagai `AUDIT_REPORT.md` dengan temuan bernomor
  `F-01` … `F-27` yang dipakai sebagai penanda lintas dokumen.
  [TINJAU — berkas ini berada di **luar** repositori. Putuskan apakah perlu
  ikut dikomit sebagai bukti proses, atau disaring dulu.]
- **Verifikasi deployment** tercatat di `VERIFIKASI-DEPLOY.md` (di luar
  repositori) berisi pemeriksaan langsung ke situs live: rute, aset, routing,
  formulir, HTTPS, dan Lighthouse.
- **Optimasi performa** dilakukan dalam satu komit khusus yang memperbaiki
  empat hal sekaligus:
  1. Font Google (dua asal luar, menahan render awal) → dipindah ke
     `next/font`, disajikan dari asal sendiri.
  2. Suara soal berikutnya diunduh **selagi anak masih menjawab**.
  3. 14 ekspresi maskot dipra-muat saat perangkat menganggur
     (`lib/preload.js`, lewat `requestIdleCallback`).
  4. Dua PNG mati (2,1 MB) dihapus; berkas statis diberi masa simpan cache.

### 5.5 · Peringatan untuk iterasi berikutnya

- **Riwayat git tidak memuat urutan pembangunan kode inti** — semuanya masuk
  sebagai impor serentak pada 14 Okt. Jangan mengklaim tahapan yang tidak ada
  buktinya.
- **Tidak ada log prompt tersimpan di repo.** Bila dokumen lomba memerlukan
  jurnal prompt, itu harus diambil dari riwayat percakapan asli — **bukan
  direkonstruksi belakangan**.
- **README perlu diperiksa ulang** sebelum dipakai sebagai rujukan angka.
- **Jangan mencatat sesuatu sebagai selesai di produksi** sebelum diperiksa
  langsung di URL live. Nilai absolut `localhost` dan hilangnya `GEMINI_API_KEY`
  keduanya **tidak menimbulkan satu pun error** di build, lint, test, maupun
  konsol — keduanya hanya bisa ditemukan dengan membaca situs yang sudah hidup
  di internet.

---

*Dokumen ini disusun 15 Okt 2026 dari pembacaan langsung `package.json`,
struktur `app/` · `components/` · `lib/` · `public/` · `tests/`, isi
`tailwind.config.js` dan `app/globals.css`, `git log` (35 komit), serta
`npm test` (184/184 lulus). Bagian bertanda `[TINJAU]` menunggu konfirmasi
pemilik proyek dan belum boleh dianggap final.*
