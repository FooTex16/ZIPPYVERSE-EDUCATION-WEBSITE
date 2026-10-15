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
> repositori. **Enam penanda yang semula ada — 4 di blok kutip dan 2 di paragraf
> — sudah diselesaikan semua pada 15 Okt 2026**, dengan bukti pengambilan
> langsung: subtema resmi dari Prompt #61, metadata sesi OpenCode, penghitungan
> tabel Supabase memakai `service_role`, dan pemindaian seluruh ruang kerja.
> Berkas ini kini **tanpa `[TINJAU]`**. Bila ada penanda baru ditambahkan kelak,
> aturannya tidak berubah: jangan dianggap final sebelum tanda itu dilepas.
>
> **Cara memverifikasi ulang:** setiap angka di bawah berasal dari perintah
> yang bisa dijalankan ulang — `npm test`, `git log`, penghitungan berkas, atau
> pembacaan langsung berkas yang disebutkan.

---

## 1. Ringkasan Project

**ZippyVerse adalah game edukasi web untuk anak sekolah dasar**, dibintangi
maskot Zippy di Planet Luminara.

> **Soal tema — sudah diperiksa 15 Okt 2026, bukan lagi tanda `[TINJAU]`.**
> Tautan aslinya bukan "edukasi coding". Prompt pembuka proyek (5 Okt 00:29
> WIB) menulis subtema **"WEB EDUCATION FOR KIDS (untuk anak SD)"**, dan
> ketentuan lomba yang diterima 15 Okt 2026 (Prompt #61) menyebut gerbang
> kelima: *"Website sesuai tema 'Innovating Education Through Technology'
> subtema 'Web Education for Kids (untuk anak SD)'"*. Frasa **"website
> edukasi coding"** sebagai tujuan proyek hanya muncul di dalam kerangka
> instruksi penulisan `AGENTS.md` sendiri (Prompt #67 dan #76, 15 Okt 2026)
> — tidak ada di ketentuan lomba.
>
> Karena itu isi kode **sudah sesuai subtema**: pelajaran umum SD — angka,
> kata, sains, kreatif, bumi. Pemindaian pola `coding`, `pemrograman`,
> `koding`, `algoritma`, `program` pada seluruh `lib/*.js` hanya menemukan
> dua kebetulan di komentar (`img.decoding = "async"` pada `preload.js` dan
> "algoritma mulberry32" pada `shuffle.js`) — **nol soal bertema
> pemrograman**, dan memang tidak diwajibkan ketentuan mana pun.
>
> **Satu catatan pengembangan, bukan syarat penilaian:** `Pulau Digital`
> (`available: false`, `soon: true`, tagline "Segera Hadir!", tanpa satu pun
> misi) adalah peta jalan. Mengisinya tidak menambah nilai kelayakan;
> tidak mengisinya tidak mengurangi.

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

> **AI pembangun — sudah diperiksa dari metadata sesi OpenCode, bukan lagi
> `[TINJAU]`.** Semua pesan tercatat memakai penyedia **`opencode`**, tetapi
> **tiga model berbeda**, jadi menyebut "OpenCode · MiMo" betul tetapi tidak
> lengkap:
>
> | Model | Jumlah baris pesan |
> | --- | --- |
> | `mimo-v2.6-flash-free` | 62 |
> | `space-bunny-free` | 7 |
> | `claude-opus-5.5` | 3 — termasuk Prompt #8 (minta ide) dan #9 (memilih ZippyVerse) |
> | tanpa keterangan model | 8 — 5 prompt pembuka 5 Okt dan 3 pesan pemicu subagen 13 Okt |
>
> Nama yang tepat untuk ditulis: **OpenCode** (penyedia) · **MiMo**
> (`mimo-v2.6-flash-free`, model utama).

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
> statis** di dalam kode. Konten yang bisa disunting lewat `/admin` disimpan
> di tabel Supabase `planets`/`missions`, sehingga jumlah pulau terbuka
> *bisa* melebihi angka statis.
>
> **Sudah dipetakkan 15 Okt 2026 — ternyata tidak ada yang melebihi.**
> Dikueri langsung ke proyek Supabase dengan dua peran (anon dan
> `service_role`), memakai `Prefer: count=exact`:
>
> | Tabel | Total baris | Kode `HTTP` |
> | --- | --- | --- |
> | `planets` | **0** | 200 |
> | `missions` | **0** | 200 |
> | `profiles` | **0** | 200 |
>
> Angkanya sama untuk kedua peran, jadi ini **bukan RLS yang menyaring** —
> tabelnya memang kosong. Konsekuensinya: **cadangan statis di dalam kode
> adalah satu-satunya sumber isi yang tayang**, dan `/admin` belum pernah
> menerbitkan konten apa pun.

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

> **Sudah dicek 15 Okt 2026 — bukan lagi `[TINJAU]`. Angka "34 misi / 258
> butir" tidak punya sumber sama sekali.** Dugaan bahwa angka itu berasal
> dari konten terbitan Supabase **kini terbantahkan**: tabel `planets` dan
> `missions` berisi **0 baris**, diperiksa pula dengan `service_role`
> sehingga bukan filter keamanan yang menyembunyikannya. Tidak ada isi di
> luar yang bisa menghasilkan 34/258.
>
> Angka yang sah adalah tabel di atas: **19 misi / 143 butir** dari kode.
> Bila ada dokumen lain yang menyebut 34/258, angkanya **salah dan wajib
> dikoreksi** — bukan dicatat sebagai angka alternatif.

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

Kebiasaan yang sudah terbentuk pada 38 komit (14-15 Okt 2026):
`fix` 18 · `feat` 12 · `docs` 5 · `chore` 2. Rata-rata panjang pesan ±65
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

**AI sebagai pembangun — sudah dicocokkan dengan log prompt asli (77 prompt
pengguna, 5–15 Okt 2026), bukan lagi `[TINJAU]`:**

| Waktu (WIB) | Prompt | Yang tercatat |
| --- | --- | --- |
| 5 Okt 00:29–00:32 | #1–#5 | Tema dan subtema *"WEB EDUCATION FOR KIDS (untuk anak SD)"* ditetapkan |
| 6 Okt 14:24 | #6 | **PRD diminta**: *"coba kamu buatkan prd dari website ini dalam format .md"* |
| 7 Okt 21:44 | #7 | `design.zip` diminta diperiksa kesesuaiannya |
| 11 Okt 13:48 | #8 | Mintai AI ide website lomba *vibe coding* bermaskot Zippy |
| 11 Okt 13:55 | #9 | **Ide 1 ZIPPYVERSE dipilih** — pembangunan mulai |
| 11–13 Okt | #10–#39 | Aset, rute, pengujian di localhost, perbaikan bug |
| 14 Okt 13:05:52 | — | Repositori diinisialisasi; empat komit berikutnya mendarat dalam **5 detik** |

- **Koreksi atas draf sebelumnya.** Baris ini semula berbunyi *"tanpa dokumen
  PRD terpisah lebih dulu"* dengan bukti *"`PRD.md` tidak pernah dibuat"*.
  Log asli membuktikan sebaliknya: **PRD memang diminta** pada 6 Okt 2026
  (Prompt #6) — tetapi permintaan itu ditujukan kepada *website* yang sedang
  dibahas masa itu, **empat hari sebelum ZippyVerse bernama** (nama lahir pada
  Prompt #9, 11 Okt). Untuk ZippyVerse sendiri memang tidak ada berkas PRD di
  antara pemilihan ide dan pembangunan.
- **Bukti berkas, diperiksa ulang 15 Okt 2026:** di seluruh ruang kerja tidak
  ada `PRD.md`, `PLAN.md`, `CLAUDE.md`, maupun folder `docs/`. Satu-satunya
  berkas sejenis adalah `REKONSTRUKSI-SLOT1-IDE-PRD.md` (13,8 KB, dibuat
  15 Okt 11:04) — yaitu **rekonstruksi belakangan, bukan PRD asli**. Satu-satunya
  dokumen yang ikut impor kode adalah `README.md`.
- Apakah PRD hasil Prompt #6 pernah ditulis lalu dihapus **tidak bisa
  dipastikan**: log ini hanya memuat pesan pengguna, bukan jawaban AI.
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

Riwayat git memuat **38 komit** pada 14-15 Okt 2026:

| Prefix | Jumlah |
| --- | --- |
| `fix` | 18 |
| `feat` | 12 |
| `docs` | 5 |
| `chore` | 2 |
| non-konvensional | 1 |

> Angka di atas adalah **cuplikan per 15 Okt 2026**. Ia otomatis basi begitu
> ada komit baru — termasuk komit yang memperbarui baris ini sendiri. Jalankan
> `git rev-list --count HEAD` dan `git log --pretty=format:"%s" | ...` untuk
> angka terkini, sama seperti cara angka ini diperoleh.

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

- **Laporan audit** disimpan sebagai `AUDIT_REPORT.md` (79.228 byte, 1.352
  baris) dengan temuan bernomor `F-01` … `F-27` yang dipakai sebagai penanda
  lintas dokumen.
  **Keputusan 15 Okt 2026: berkas ini sengaja TIDAK ikut dikomit.** Alasan
  diverifikasi, bukan sekadar kebiasaan:
  - Isinya **bersih dari nilai rahasia** — dipindai untuk pola kunci Gemini,
    token JWT Supabase, `service_role`, dan sandi; **tidak ada satu pun
    kecocokan**.
  - Namun ia memuat **F-04 (prioritas P1) yang masih terbuka** — anon key
    Supabase dikombinasikan dengan `playerId` yang dikendalikan klien, berisiko
    IDOR antar profil anak, statusnya *"Menunggu pemilik proyek"*. Menerbitkan
    uraian kerentanan yang belum diperbaiki ke repositori publik berarti
    membagikan peta serangannya.
  - `VERIFIKASI-DEPLOY.md` juga berada di luar repositori; keduanya dokumen
    proses, bukan konsumsi agen yang mengubah kode.
  **Bila F-04 sudah diperbaiki**, berkas ini boleh ikut dikomit utuh tanpa
  perlu disaring.
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
`tailwind.config.js` dan `app/globals.css`, `git log` (38 komit), serta
`npm test` (184/184 lulus), penghitungan langsung tabel Supabase, serta pemindaian
ruang kerja. Seluruh 6 penanda `[TINJAU]` semula sudah **dilepas semua** pada
tanggal yang sama; berkas ini diserahkan tanpa klaim yang menunggu konfirmasi.*
