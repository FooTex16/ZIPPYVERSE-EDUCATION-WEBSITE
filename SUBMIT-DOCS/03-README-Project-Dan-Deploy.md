# 03 · README PROJECT & PANDUAN DEPLOY — ZippyVerse

---

## 1 · Deskripsi

**ZippyVerse — Petualangan di Planet Luminara** adalah *game edukasi web untuk
anak sekolah dasar*, dibintangi maskot **Zippy**. Anak berpindah antar pulau,
menyelesaikan misi singkat berdurasi ±3 menit, mengumpulkan koin dan XP, lalu
membuka kostum — sementara setiap poin yang terkumpul berasal dari upaya
memecahkan soal, bukan dari menonton.

| | |
| --- | --- |
| Tema | Innovating Education Through Technology |
| Subtema | Web Education for Kids (untuk anak SD) |
| Bahasa | Bahasa Indonesia (antarmuka, soal, dan narasi suara) |
| Versi | 1.0.0 |
| Lisensi repo | — `[TINJAU]` — belum ada berkas `LICENSE` |

---

## 2 · Link Deploy

> ## 🌐 <https://zippyverse.vercel.app/>

| Pemeriksaan | Hasil (15 Okt 2026, 19.47 WIB) |
| --- | --- |
| Halaman utama `/` | **HTTP 200**, 75.583 byte |
| Judul halaman | `ZippyVerse - Petualangan di Planet Luminara` |
| `/robots.txt` | **HTTP 200** — `Sitemap: https://zippyverse.vercel.app/sitemap.xml` |
| `/sitemap.xml` | **HTTP 200** — 9 `<loc>`, semua di domain benar |
| `/icon.svg` | **HTTP 200**, 925 byte |
| `/api/zippy` | **HTTP 200** — `mode: "fallback"` (lihat §6) |
| Nilai `localhost` di HTML | **tidak ada** |
| Sumber kode | <https://github.com/FooTex16/ZIPPYVERSE-EDUCATION-WEBSITE> |

> **Catatan penting:** proyek Vercel **belum tersambung ke integrasi Git**.
> Push ke GitHub **tidak memicu deploy** — perubahan harus di-deploy ulang
> dengan `npx vercel --prod` atau lewat dasbor.

---

## 3 · Struktur Folder (pohon nyata)

```
zippyverse/
├── app/
│   ├── page.jsx                  Halaman pengantar untuk pengunjung baru
│   ├── daftar/page.jsx           Pendaftaran & pemasukan akun Pendamping
│   ├── peta/page.jsx             Peta dunia dan pemilihan pulau
│   ├── pulau/[slug]/page.jsx     Pemilihan misi, permainan, hadiah
│   ├── dashboard/page.jsx        Dasbor perkembangan anak
│   ├── profil/page.jsx           Profil akun Pendamping
│   ├── admin/page.jsx            Panel pengelolaan (terkunci PIN)
│   ├── api/
│   │   ├── zippy/route.js        Endpoint Zippy AI
│   │   ├── admin/route.js        Kewenangan pengelola
│   │   ├── anak/route.js         Daftar anak per akun
│   │   └── masukan/route.js      Umpan balik (maks 5 pesan/hari)
│   ├── robots.js                 Perayap mesin pencari
│   ├── sitemap.js                Peta situs
│   ├── icon.svg                  Ikon tab
│   ├── not-found.jsx             Halaman 404 (Bahasa Indonesia)
│   ├── layout.jsx                Metadata, viewport, huruf
│   └── globals.css               Palet warna & animasi
├── components/
│   ├── Zippy.jsx                 Maskot (14 pose & ekspresi)
│   ├── SpaceBackdrop.jsx         Latar luar angkasa yang terus bergerak
│   ├── Hud.jsx                   Koin, energi, XP, tombol suara & gerak
│   ├── Boss.jsx                  Bos SVG murni
│   ├── ShopModal.jsx             Toko kostum
│   ├── ZippyChat.jsx             Percakapan dengan Zippy
│   ├── PengingatDiam.jsx         Pengingat lembut saat anak berhenti
│   ├── missions/                 6 komponen tipe misi
│   └── … (total 25 berkas .jsx)
├── lib/
│   ├── gameData.js               Pulau, misi, kostum, aturan buka pulau
│   ├── missionsExtra.js          Konten 4 pulau + Tantangan Harian
│   ├── trialIsland.js            Konten Pulau Perkenalan (pengunjung tamu)
│   ├── store.js                  Simpanan perangkat + sinkron Supabase
│   ├── profil.js                 Profil anak pada satu akun Pendamping
│   ├── supabase.js               Koneksi Supabase
│   ├── adminConfig.js            Pengaturan panel admin
│   ├── adminApi.js · adminAuth.js  Lapisan keamanan panel
│   ├── syncAnak.js · validasiKonten.js  Sinkronisasi & validasi
│   ├── audioSoal.js · bacaTeks.js · speech.js · sfx.js   Suara
│   ├── petunjukHitung.js         Varian petunjuk agar tidak monoton
│   ├── costumePerks.js · shuffle.js · useMediaQuery.js
│   ├── preload.js                Pra-muat 14 ekspresi maskot
│   ├── situsUrl.js               Penyatuan alamat absolut
│   ├── zippyBrain.js             Jawaban cadangan saat AI tidak tersedia
│   └── audioManifest.json        Peta teks → berkas suara
├── public/
│   ├── audio/                    211 mp3 soal & petunjuk
│   ├── sfx/                      6 efek suara
│   ├── zippy/                    14 pose/ekspresi (WebP)
│   ├── islands/                  8 ikon pulau (5 WebP + 3 SVG)
│   └── loading/                  1 gambar meteor
├── scripts/
│   ├── kumpulTeks.mjs            Kumpulkan teks soal
│   ├── generateAudio.py          Rekam suara lewat TTS Python
│   ├── optimize-assets.mjs       Optimasi gambar
│   └── .tmp/                     Hasil konversi untuk pengujian (jangan dikomit)
├── tests/                        8 berkas .test.mjs — 184 pengujian
├── tailwind.config.js            Palet zippy + seluruh keyframes
├── AGENTS.md                     Docs acuan AI Agent
├── JURNAL-PROMPT.md              Jurnal prompt terkurasi (5 slot)
├── LOG-PROMPT-MENTAH.md          Log prompt mentah awal–akhir
└── README.md                     Berkas ini
```

**Jumlah (dihitung langsung):** `app/` 23 · `components/` 25 · `lib/` 25 ·
`public/` 240 · `tests/` 8 berkas.

---

## 4 · Cara Install, Jalankan, dan Bangun

### 4.1 · Prasyarat

| Versi | Keterangan |
| --- | --- |
| Node.js | **v18.18 atau lebih baru** (dijalankan pada Node v24) |
| npm | ikut Node.js |
| Python 3 | hanya untuk `npm run audio` (rekam suara) |

### 4.2 · Instalasi

```bash
git clone https://github.com/FooTex16/ZIPPYVERSE-EDUCATION-WEBSITE.git
cd zippyverse
npm install
```

### 4.3 · Berkas `.env.local`

Wajib diisi agar AI dan sinkronisasi awan berjalan:

```bash
NEXT_PUBLIC_SUPABASE_URL=          # alamat proyek Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # kunci anon (boleh terlihat klien)
SUPABASE_SERVICE_ROLE_KEY=         # HANYA untuk proses server
GEMINI_API_KEY=                    # kunci Gemini (Google AI Studio)
NEXT_PUBLIC_SITE_URL=              # opsional — cadangan alamat situs
```

> **Tanpa `GEMINI_API_KEY` situs tetap berjalan**, tetapi Zippy menjawab lewat
> `lib/zippyBrain.js` dan respons API berbunyi `mode: "fallback"`.

### 4.4 · Perintah

```bash
npm run dev        # pengembangan      → http://localhost:3000
npm run build      # bangun produksi
npm start          # jalankan hasil build
npm run lint       # periksa kode
npm test           # 184 pengujian
npm run audio      # kumpulkan teks soal + rekam suaranya
```

> Bila build gagal karena memori, tambahkan:
> `NODE_OPTIONS=--max-old-space-size=2008`

### 4.5 · Deploy ke Vercel

```bash
npm i -g vercel       # sekali saja
npx vercel --prod     # deploy dari salinan lokal
```

Atau hubungkan repositori lewat dasbor: **Vercel → Add New → Project →
Import** dari GitHub, lalu isi variabel lingkungan pada **Settings →
Environment Variables**.

**Setelah mengubah `GEMINI_API_KEY`, wajib Redeploy** — variabel lingkungan
hanya terbaca saat proses dibangun ulang.

---

## 5 · Teknologi

### Ketergantungan — 7

| Paket | Versi | Peran |
| --- | --- | --- |
| `next` | ^15.1.3 | Kerangka, App Router |
| `react` · `react-dom` | ^19.0.0 | Antarmuka |
| `framer-motion` | ^11.15.0 | Animasi berbasis `transform` |
| `lucide-react` | ^0.469.0 | Ikon |
| `@supabase/supabase-js` | ^2.47.10 | Autentikasi & penyimpanan terkelola |
| `@google/generative-ai` | ^0.21.0 | Jawaban AI Zippy |

### Dependensi pengembangan — 6

`tailwindcss` ^3.4.17 · `postcss` ^8.4.49 · `autoprefixer` ^10.4.20 ·
`eslint` ^9.39.5 · `eslint-config-next` ^15.5.27 · `sharp` ^0.35.5

### Penyimpanan

| Tempat | Peran |
| --- | --- |
| `localStorage` | **Penyimpanan utama** — permainan tetap jalan meski sinyal hilang |
| Supabase | Sesi akun, daftar anak, tabel `planets` / `missions` |

**Aturan keras:** daftar kosong **tidak pernah** boleh menghapus data perangkat.

---

## 6 · Cara Test

### 6.1 · Tiga perintah wajib lulus

```bash
npm test        # 184 pengujian — JANGAN dilewati
npm run lint
npm run build
```

### 6.2 · Pemeriksaan manual di peramban

| # | Yang dicek | Caranya |
| --- | --- | --- |
| 1 | Rute termuat tanpa galat | Buka `/`, `/peta`, `/pulau/coba`, `/dashboard`, `/profil`, `/daftar` |
| 2 | Tidak ada aset 404 | DevTools → Network → saring `404` (gambar, CSS, JS, font, ikon) |
| 3 | Tidak ada galat konsol | DevTools → Console harus bersih |
| 4 | Responsif | Ubah lebar jendela ke **320, 375, 768, 1366, 1920 px** |
| 5 | Layar penuh di HP | Uji nyata pada perangkat fisik |
| 6 | AI Zippy | Kirim pertanyaan, periksa kolom `mode` di respons `/api/zippy` |
| 7 | Pembatas laju | Kirim lebih dari 12 pesan dalam 60 detik → wajib `429` |
| 8 | Suara | Pastikan soal terbacakan suara Indonesia, bukan suara bawaan perangkat |

### 6.3 · Membaca status AI

```bash
curl -X POST https://zippyverse.vercel.app/api/zippy \
  -H "Content-Type: application/json" \
  -d '{"message":"hai zippy","history":[]}'
```

| `mode` | Arti |
| --- | --- |
| `"gemini"` | Gemini sungguhan menjawab — kunci sudah terisi |
| `"fallback"` | `lib/zippyBrain.js` yang menjawab — periksa `GEMINI_API_KEY` |

### 6.4 · Setelah menambah atau mengubah soal

```bash
npm run audio
```

Tanpa ini, soal baru hanya dibacakan suara bawaan perangkat, yang tidak selalu
tersedia dalam Bahasa Indonesia.

---

> `[TINJAU]` tersisa: (a) lisensi repositori; (b) hasil tes di perangkat fisik
> yang belum bisa dijalankan dari lingkungan pengembangan ini.

*Disusun 15 Okt 2026 dari `package.json`, pohon folder yang dihitung ulang, dan
pemeriksaan langsung terhadap situs live.*
