# 01 · DOCS ACUAN AI AGENT — ZippyVerse

Berkas acuan bagi **agennya AI dan manusia** yang akan mengubah kode proyek ini.
Semua isi di bawah diambil dari pembacaan langsung `package.json`, struktur
`app/` · `components/` · `lib/` · `public/` · `tests/`, `tailwind.config.js`,
`app/globals.css`, dan `git log` — **bukan dari ingatan**.

> **Tanda `[TINJAU]`** menandai bagian yang menunggu konfirmasi pemilik proyek.
> Jangan menganggapnya final sebelum tanda dilepas.

---

## 1 · Ringkasan Project

**ZippyVerse — Petualangan di Planet Luminara** adalah *game edukasi web untuk
anak sekolah dasar*, dibintangi maskot **Zippy**.

### Tujuan

| Aspek | Isi |
| --- | --- |
| Tema | **Innovating Education Through Technology** |
| Subtema | **Web Education for Kids (untuk anak SD)** |
| Bentuk | Permainan berbasis misi singkat, bukan halaman pelajaran |
| Bahasa | Seluruh antarmuka dan soal dalam **Bahasa Indonesia** |

### Masalah yang dijawab

Anak SD jaman sekarang menghabiskan waktu menonton video yang menggulir tanpa
henti. Tontonan semacam itu menuntut **nol usaha** dari anak namun memberi
**nol manfaat**: tidak ada yang dipraktikkan, tidak ada yang diingat, dan tidak
ada rasa selesai. Yang didapat anak hanyalah kebiasaan menunggu konten
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

- **Anak** sebagai pemain — bermain, mengumpulkan koin, membuka kostum.
- **Orang tua (Akun Pendamping)** — satu akun keluarga, banyak profil anak,
  kemajuan terpisah per anak, dasbor **baca-saja**.

---

## 2 · Stack & Tools

### Ketergantungan (`dependencies`) — 7

| Paket | Versi | Peran |
| --- | --- | --- |
| `next` | ^15.1.3 | Kerangka, App Router, penyajian statis |
| `react` | ^19.0.0 | Antarmuka |
| `react-dom` | ^19.0.0 | Renderer DOM |
| `framer-motion` | ^11.15.0 | Animasi masuk/keluar dengan `transform` |
| `lucide-react` | ^0.469.0 | Ikon |
| `@supabase/supabase-js` | ^2.47.10 | Autentikasi dan penyimpanan terkelola |
| `@google/generative-ai` | ^0.21.0 | Menjawab pertanyaan anak lewat Gemini |

### Dependensi pengembangan (`devDependencies`) — 6

`tailwindcss` ^3.4.17 · `postcss` ^8.4.49 · `autoprefixer` ^10.4.20 ·
`eslint` ^9.39.5 · `eslint-config-next` ^15.5.27 · `sharp` ^0.35.5

### Perintah

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Pengembangan |
| `npm run build` | Bangun untuk produksi |
| `npm start` | Jalankan hasil build |
| `npm run lint` | Periksa kode |
| `npm test` | **184 pengujian dalam 8 berkas** (`node --test tests/*.test.mjs`) |
| `npm run audio` | Kumpulkan teks soal lalu rekam suaranya lewat Python |

> Tidak ada `composer.json` — ini proyek JavaScript murni, bukan PHP.

### Gaya

- **Tailwind CSS 3.4** lewat `tailwind.config.js`. Kelas yang dibangun
  dinamis (`animate-${nama}`) didaftarkan manual di `safelist` karena tidak
  terlihat oleh pemindai.
- **Font** diunduh saat build lewat `next/font/google`, bukan lewat `<link>` ke
  pihak ketiga: `Fredoka` → `--font-display`, `Baloo_2` → `--font-body`, keduanya
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
| `RATE_MAX = 12` per 60 detik | Pembatas laju per IP — **terbukti jalan di situs live** | baris 32–33 |
| `MODEL_TIMEOUT_MS = 15000` | Supaya presentasi tidak menggantung | baris 119 |
| Pemutus arus 5 menit | Kalau semua model gagal, Gemini dilewati | baris 152 |
| `lib/zippyBrain.js` | Cadangan luring berbasis kata kunci | — |

**Penting:** kolom `mode` pada respons API menyatakan siapa yang menjawab —
`"gemini"` atau `"fallback"`. Bila `mode` selalu `fallback`, periksa
`GEMINI_API_KEY` lebih dulu sebelum mencurigai kode.

### AI pembangun

**OpenCode** sebagai penyedia, dengan **tiga model** tercatat di metadata sesi:

| Model | Jumlah baris pesan |
| --- | --- |
| `mimo-v2.6-flash-free` | 62 |
| `space-bunny-free` | 7 |
| `claude-opus-5.5` | 3 (termasuk perumusan ide awal) |
| tanpa keterangan | 8 (5 prompt pembuka + 3 pesan pemicu subagen) |

> `[TINJAU]` — bila pemilik proyek memakai nama paket/penyedia lain, sesuaikan.

### Hosting

**Vercel** — <https://zippyverse.vercel.app/>

Variabel lingkungan yang harus ada di Vercel:

| Variabel | Keadaan terakhir diperiksa |
| --- | --- |
| `GEMINI_API_KEY` | **kosong** — AI menjawab `mode: "fallback"` |
| `NEXT_PUBLIC_SITE_URL` | kosong (sudah ditangani `lib/situsUrl.js`) |
| `NEXT_PUBLIC_SUPABASE_URL` | terisi |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | terisi |

> Proyek Vercel **belum tersambung ke integrasi Git**, sehingga push ke GitHub
> **tidak memicu deploy**.

---

## 3 · Fitur & Halaman

Diambil dari isi `app/`, bukan dari rencana.

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

### Konten misi — angka terverifikasi dari kode

| Kelompok | Berkas | Misi | Butir |
| --- | --- | --- | --- |
| Pulau Angka | `lib/gameData.js` (`M1`–`M3_ROUNDS`) | 3 | 33 |
| Pulau Kata, Sains, Kreatif, Bumi | `lib/missionsExtra.js` (`K1`–`B3`) | 12 | 74 |
| Pulau uji coba | `lib/trialIsland.js` (`t1`–`t3`) | 3 | 36 |
| Tantangan Harian | `lib/missionsExtra.js` (`SOAL_HARIAN`, 38 soal; 5 dipakai per hari) | 1 | 5 |
| **Total** | | **19** | **143** |

### Tipe misi — 6

`dragcount` · `blitz` · `boss` · `mcq` · `scramble` · `order`

Satu komponen per tipe di `components/missions/`: `MissionDragCount`,
`MissionBlitz`, `MissionBoss`, `MissionMCQ`, `MissionScramble`, `MissionOrder`.

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

## 4 · Aturan Kerja

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

1. **Palet warna tetap** — `tailwind.config.js` → `colors.zippy`: Teal
   `#2AA5A0`, Mint `#B2D8D5`, Kuning `#FFC93C`, Krem `#FFF6E5`, Navy `#0F2C3D`.
2. **Layar kecil dulu.** Rapi pada **320, 375, 768 px**, nyaman pada 1366 dan
   1920. Gunakan `min-w-0` pada elemen di dalam wadah yang bisa mengecil.
3. **Animasi hanya `transform` dan `opacity`.** `top`, `left`, `width`, `height`
   memicu hitung ulang tata letak dan membuat gerakan patah di HP murah.
4. **Hormati `prefers-reduced-motion`** lewat pemilih
   `html:not([data-motion="on"])`, bukan sekadar media query.
5. **Jangan memakai `maximumScale: 1`.** Anti-zoom ditangani lewat
   `touch-action`: `none` pada area seret-jatuh, `manipulation` pada tombol.
6. **Gambar memakai WebP** dan setiap gambar **wajib punya `alt`**
   (`alt=""` untuk yang murni dekoratif).
7. **Ukuran teks dan tombol untuk anak.** Huruf minimal `text-xs` (12 px),
   target sentuh minimal 40 px, tombol ikon wajib punya `aria-label`. Panel
   admin dikecualikan karena dipakai orang dewasa.

### 4.7 · Batasan data & keamanan

8. **Rahasia tidak pernah masuk berkas.** Kunci API hanya di `.env.local` dan
   variabel server.
9. **`SUPABASE_SERVICE_ROLE_KEY` hanya hidup di proses server.**
10. **Peran pengelola diverifikasi di server**, bukan di peramban.
11. **Anak tidak boleh bocor antar akun Pendamping.** Pemindahan profil
    dilakukan dengan menukar **seluruh blok simpanan**.
12. **Daftar kosong tidak boleh menghapus apa pun.** Kegagalan dan "tidak ada
    data" dibedakan (`daftarRusak`).

### 4.8 · Sebelum menyatakan selesai

```bash
npm test        # 184 pengujian
npm run lint
npm run build
```

13. **Periksa secara nyata di peramban**, jangan hanya percaya hasil build.
14. **Bila menambah atau mengubah soal**, jalankan `npm run audio` agar rekaman
    suaranya ikut dibuat.
15. **Jangan mengubah nilai bawaan yang dipakai pengujian** — khususnya
    `lib/costumePerks.js` (harus tetap mengekspor objek kosong) dan nilai
    stamina di `lib/store.js`.
16. **Bedakan yang sudah dipastikan dari yang masih dugaan.**

---

## 5 · Catatan Pengembangan

### 5.1 · Peran AI dalam membangun proyek ini

Urutan yang tercatat di log prompt asli:

| Waktu (WIB) | Prompt | Yang tercatat |
| --- | --- | --- |
| 5 Okt 00:29–00:32 | #1–#5 | Tema dan subtema ditetapkan |
| 6 Okt 14:24 | #6 | PRD diminta (tidak pernah menjadi berkas) |
| 11 Okt 13:48 | #8 | Mintai AI ide website *vibe coding* bermaskot Zippy |
| 11 Okt 13:55 | #9 | **Ide 1 ZIPPYVERSE dipilih** — pembangunan mulai |
| 11–13 Okt | #10–#39 | Aset, rute, pengujian di localhost, perbaikan bug |
| 13 Okt 13:10 | #34 | Audit komprehensif → 3 subagen paralel |
| 14 Okt 13:05:52 | — | Repositori diinisialisasi; 4 komit berikutnya dalam **5 detik** |

**AI sebagai fitur produk**: `app/api/zippy/route.js` menjawab pertanyaan anak
lewat Gemini dengan sistem perintah yang menetapkan Zippy sebagai *Si
Penjelajah Ilmu dari Planet Luminara* (baris 61–73), maksimal 2 kalimat, dan
selalu mengarahkan kembali ke pelajaran SD. Bila AI tidak tersedia,
`lib/zippyBrain.js` mengambil alih dengan jawaban berbasis kata kunci.

### 5.2 · Riwayat iterasi

`git log --reverse` mencatat komit pertama pada **14 Okt 2026 13:05:52**,
diikuti empat komit lagi dalam selisih **5 detik** (konfigurasi, aset, logika,
antarmuka, lalu README). Pengerjaan lanjutan mengikuti pola **bangun → pakai →
rusak → perbaiki**, dan sebagian perbaikan menyentuh `tests/` sekaligus sehingga
bug diperbaiki **dengan uji regresi**.

> Riwayat git **tidak memuat urutan pembangunan kode inti** — semuanya masuk
> sebagai impor serentak. Jangan mengklaim tahapan yang tidak ada buktinya.

### 5.3 · Pola debugging yang terbukti berhasil

Setiap perbaikan bug wajib melewati enam langkah:
**REPRODUKSI → DIAGNOSA → PERBAIKAN MINIMAL → VERIFIKASI → COMMIT → CATATAN
JURNAL** (`JURNAL-DEBUGGING.md`).

| Kesalahan | Perbaikan |
| --- | --- |
| Menu pengelola ikut hilang begitu akun keluar | Status sesi dipisahkan dari status tampilan |
| Anak ikut terbawa saat pindah akun Pendamping | Blok simpanan ditukar utuh, bukan disusun ulang |
| Daftar akun gagal dianggap "tidak ada akun" | Kegagalan ≠ kosong — dibedakan `daftarRusak` |
| Anak yang belum pernah bermain tidak menerima hasil suntingan | Cabang `masihKosong` pada `adopsiNilaiPemain()` |
| `onClick` pada `div` mematikan jalur papan ketik tanpa error | Ditambahkan `role`, `tabIndex`, `onKeyDown` |
| Metadata halaman tidak pernah tampil berbeda | Dipindah ke `layout.jsx` — komponen klien dilarang mengekspor `metadata` |
| Alamat absolut menunjuk `localhost` setelah di-host | Disatukan di `lib/situsUrl.js` |

### 5.4 · Audit & optimasi

- **Laporan audit** — `AUDIT_REPORT.md` (di luar repo) dengan temuan `F-01` …
  `F-27`. Sengaja **tidak ikut dikomit** karena memuat F-04 (P1) yang masih
  terbuka; setelah F-04 diperbaiki berkasnya boleh masuk utuh.
- **Verifikasi deployment** — `VERIFIKASI-DEPLOY.md` (di luar repo).
- **Optimasi performa** dalam satu komit: font dipindah ke `next/font`, suara
  soal berikutnya diunduh selagi anak menjawab, 14 ekspresi maskot dipra-muat
  saat perangkat menganggur, dua PNG mati dihapus.

### 5.5 · Peringatan untuk iterasi berikutnya

- **Tidak ada log prompt tersimpan di dalam riwayat kode.** Jurnal prompt harus
  diambil dari riwayat percakapan asli — **bukan direkonstruksi belakangan**.
- **README perlu diperiksa ulang** sebelum dipakai sebagai rujukan angka.
- **Jangan mencatat sesuatu sebagai selesai di produksi** sebelum diperiksa
  langsung di URL live. Nilai absolut `localhost` dan hilangnya
  `GEMINI_API_KEY` **tidak menimbulkan satu pun error** di build, lint, test,
  maupun konsol.

---

> `[TINJAU]` tersisa: (a) nama paket AI bila berbeda; (b) apakah `Pulau Digital`
> perlu diisi sebelum rilis. Sisanya sudah diverifikasi dari kode.

*Disusun 15 Okt 2026 dari pembacaan langsung berkas proyek dan `git log` (41
komit). Angka dapat dihasilkan ulang lewat perintah yang tertera.*
