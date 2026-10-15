# CHECKLIST FINAL — Kesiapan Submit Lomba

**Proyek:** ZippyVerse — Petualangan di Planet Luminara
**Diperiksa:** 2026-10-15, langsung terhadap GitHub API, URL live, dan isi repo
**Aturan:** satu poin hanya ditandai `[x]` bila benar-benar diperiksa. Yang
belum diperiksa tetap `[ ]` walau peluangnya besar.

---

## Ringkasan

| # | Poin | Status |
| --- | --- | --- |
| 1 | Repo GitHub public & bisa dibuka tanpa login | **[x]** |
| 2 | Link deploy live & bisa diakses | **[x]** *(ada 1 catatan)* |
| 3 | Docs acuan AI Agent ada & ter-commit | **[x]** |
| 4 | Jurnal 5 prompt terisi | **[x]** |
| 5 | Log prompt mentah awal–akhir tersedia | **[x]** *(ada 1 deviasi yang dibuka)* |
| 6 | README lengkap (deskripsi, link deploy, cara run) | **[ ]** |
| 7 | Riwayat commit rapi & mulai setelah 5 Okt 2026 09.30 WIB | **[x]** |
| 8 | Website dites di mobile & desktop | **[ ]** |

**Terkunci: 6 dari 8.** Sisa dua poin ada di bagian "Yang masih perlu
dikerjakan".

---

## 1 · Repo GitHub public dan bisa dibuka tanpa login — [x]

| Pemeriksaan | Bukti |
| --- | --- |
| Status repo | GitHub API `GET /repos/…` → `private: false`, `visibility: "public"` |
| Bisa dibuka tanpa login | `raw.githubusercontent.com/.../main/README.md` tanpa token apa pun → **HTTP 200**, 14.434 byte |
| Berkas terbaca tanpa login | `AGENTS.md`, `JURNAL-PROMPT.md`, `LOG-PROMPT-MENTAH.md`, `README.md` — keempatnya **HTTP 200** lewat API tanpa autentikasi |
| `default_branch` | `main` |
| Terakhir didorong | `2026-10-15T11:31:55Z` (18:31 WIB) |

---

## 2 · Link deploy live dan bisa diakses — [x]

**Link:** `https://zippyverse.vercel.app/`

| # | Pemeriksaan | Hasil | Bukti |
| --- | --- | --- | --- |
| 1 | Halaman terbuka tanpa error | **OK** | `GET /` → **200**, `text/html`, judul `ZippyVerse - Petualangan di Planet Luminara` |
| 2 | Tidak ada aset 404 | **OK** | `/icon.svg` → **200** `image/svg+xml`; `/robots.txt` → 200; `/sitemap.xml` → 200 (9 `<loc>`) |
| 3 | Routing (termasuk muat ulang) | **OK** | sudah diuji sebelumnya pada 10 rute termasuk 404 buatan sendiri |
| 4 | Form & fitur interaktif | **OK** | formulir masukan, misi permainan, dan login admin teruji di hosting |
| 5 | HTTPS, tanpa konten campuran | **OK** | seluruh permintaan `https://`, nol subresource `http://` |
| 6 | Mobile & desktop | **SEBAGIAN** — lihat poin 8 |

**Perbaikan deploy sudah hidup di live** (dulu ketiga ini ERROR):

| Yang dulu rusak | Keadaan sekarang |
| --- | --- |
| `og:url`, `sitemap`, `robots` menunjuk `localhost` | `og:url` = `https://zippyverse.vercel.app`; `robots.txt` → `Sitemap: https://zippyverse.vercel.app/sitemap.xml`; `sitemap.xml` → `<loc>https://zippyverse.vercel.app/</loc>`; kata `localhost` sudah nol |
| Situs tanpa ikon (`/favicon.ico` → 404) | `<link rel="icon" href="/icon.svg?277357a4a4ee7c6e">` sudah ada; `/icon.svg` → 200 |

> **Catatan (bukan error deploy):** obrolan AI masih menjawab dengan cadangan
> luring. `POST /api/zippy` → `mode: "fallback"`, `model: null`. `GEMINI_API_KEY`
> **masih kosong di Vercel**. Halaman, aset, dan routing tidak terpengaruh —
> hanya fitur chat yang belum memakai Gemini.

---

## 3 · File docs acuan AI Agent ada dan ter-commit — [x]

| Berkas | Komit | Ukuran di GitHub | Status |
| --- | --- | --- | --- |
| `AGENTS.md` | `58b09be` — *docs: tambah AGENTS.md sebagai acuan AI Agent* | 22.379 byte | **ada** |

- Struktur 5 bagian sesuai ketentuan: Ringkasan Project · Stack & Tools ·
  Fitur & Halaman · Aturan Kerja · Catatan Pengembangan.
- Berisi 6 tanda `[TINJAU]` (4 di blok kutip, 2 di paragraf) — **semuanya sudah
  diselesaikan 15 Okt 2026** dengan bukti pengambilan langsung, sehingga berkas
  kini **tanpa `[TINJAU]`**.
- `PRD.md` **tidak ada** — namun ketentuan memakai "AGENTS.md / PRD", jadi
  kebutuhan terpenuhi lewat `AGENTS.md`.

---

## 4 · Jurnal 5 prompt terisi — [x]

| Berkas | Komit | Ukuran | Slot | Placeholder |
| --- | --- | --- | --- | --- |
| `JURNAL-PROMPT.md` | `fd27e85` — *docs: tambah jurnal prompt terkurasi (5 prompt)* | 17.395 byte | **5/5** | **0** |

| Slot | Kategori | Prompt asli dari log |
| --- | --- | --- |
| 1 | Ide / PRD | #8 (11 Okt 13:48) + #9 pemilih ide |
| 2 | Debugging | #70 (15 Okt 12:45) |
| 3 | Audit & Optimasi | #34 (13 Okt 13:10) |
| 4 | Finishing | #15 (11 Okt 20:06) |
| 5 | Bebas — deploy | #74 (15 Okt 16:08) |

Pencarian `[ISI DARI LOG ASLI ANDA]` di seluruh repo: **tidak ada satu pun di
`JURNAL-PROMPT.md`.** Lima kecocokan yang ada semuanya berada di dalam
`LOG-PROMPT-MENTAH.md` sebagai **kutipan verbatim dari prompt Anda sendiri**
(#77) yang memang memuat instruksi tersebut.

---

## 5 · Log prompt mentah awal–akhir tersedia — [x]

| Berkas | Komit | Ukuran | Isi |
| --- | --- | --- | --- |
| `LOG-PROMPT-MENTAH.md` | `83ed8ca` — *docs: lampirkan log prompt mentah awal-akhir* | 92.208 byte | **77 prompt pengguna** + 3 pesan subagen di Lampiran B |

| | |
| --- | --- |
| Periode | **2026-10-05 – 2026-10-15** (WIB) |
| Prompt pertama | 2026-10-05 00:29:42 WIB — permintaan ide dengan tema lomba |
| Prompt terakhir | 2026-10-15 17:39:02 WIB |
| Sumber | Ekspor `sesi-07-UTAMA-2026-10-12.json` (Prompt #1–#7) + database `opencode.db` (Prompt #8–#80) |

### Deviasi yang perlu Anda ketahui — ini bukan "tanpa diedit" secara literal

Ketentuan minta log **tanpa diedit**. Saya memilih **mendahulukan keamanan**
karena repo ini wajib publik. **Empat nilai rahasia diganti penanda**, dan
penandanya ditulis terang-terangan di kepala berkas:

| Prompt | Rahasia | Penanda |
| --- | --- | --- |
| #11, #77 | `GEMINI_API_KEY` | `[RAHASIA DIREDAM: nilai GEMINI_API_KEY]` |
| #46 | `SUPABASE_SERVICE_ROLE_KEY` (peran `service_role`) | `[RAHASIA DIREDAM: kunci Supabase berperan service_role]` |
| #11 | Kata sandi koneksi database postgres | `[RAHASIA DIREDAM: kata sandi database]` |
| #11, #47 | Kata sandi akun (sama dengan sandi database) | `[RAHASIA DIREDAM: kata sandi akun]` |

Sisanya — termasuk ejaan yang salah, prompt yang diulang, dan tanda baca
berantakan — **disalin kata demi kata**. Keempat nilai aslinya tetap utuh di
berkas ekspor Anda dan di riwayat percakapan.

**Konsekuensi:** keempatnya sudah terhitung bocor dan wajib dibuat baru.

---

## 6 · README lengkap (deskripsi, link deploy, cara run) — [ ]

| Komponen | Keadaan |
| --- | --- |
| Deskripsi | **ada** — judul, ringkasan satu kalimat, bagian `## Tujuan` |
| Cara run | **ada** — `## Menjalankan` berisi `npm install`, `npm run dev`, `npm run build`, `npm start` |
| Link deploy | **BELUM** — `https://zippyverse.vercel.app` hanya muncul di baris 257 sebagai *nilai contoh* `NEXT_PUBLIC_SITE_URL` di bagian Konfigurasi. Tidak ada tautan demo di bagian atas |

**Yang perlu Anda lakukan (2 hal, kecil):**

1. Tambahkan baris demo di bawah judul, misalnya:
   `🌐 **Live:** https://zippyverse.vercel.app/`
2. Angka pengujian di baris 221 masih `# 106 pengujian` — kini **184 pengujian
   dalam 33 rangkaian** (`npm test` sudah dijalankan dan lulus 184/184).

> Angka lain di README sudah benar: `18 misi / 143 butir soal` (baris 121)
> cocok dengan hitungan `lib/gameData.js` + `lib/missionsExtra.js` +
> `lib/trialIsland.js`. Yang pernah diduga basi (`34 misi / 258 butir`) memang
> tidak terbukti dari kode.

---

## 7 · Riwayat commit rapi dan dimulai setelah 5 Okt 2026 09.30 WIB — [x]

| Pemeriksaan | Hasil |
| --- | --- |
| Garis start | 5 Okt 2026 09.30 WIB |
| Komit pertama | **`a3128d6` — 2026-10-14 13:05:52 WIB** → **9 hari setelah garis start** ✓ |
| Jumlah komit | **39** |
| Pesan deskriptif | 38 dari 39 memakai prefix konvensional (`fix` 18, `feat` 12, `docs` 6, `chore` 2) |
| Tanpa prefix | 1 — `a2935de` *"Percepat muatan halaman: font lokal, suara siap lebih dulu, maskot tak pernah kosong"* — tetap deskriptif, bukan "update"/"fix" |
| Ada pesan kosong? | **tidak ada** |

> Angka komit adalah **cuplikan saat pemeriksaan ini dijalankan** dan akan
> bertambah begitu berkas ini sendiri ikut dikomit. Hitung ulang dengan
> `git rev-list --count HEAD`.

> **Dicatat jujur:** seluruh kerangka kode masuk sebagai **impor serentak pada
> 14 Okt** — lima komit pertama mendarat dalam selisih 5 detik (13:05:52 →
> 13:05:57). Riwayat git tidak memuat urutan pembangunan kode inti. Jangan
> mengklaim tahapan yang tidak ada buktinya.

---

## 8 · Website dites di mobile dan desktop — [ ]

| Yang sudah dites | Hasil |
| --- | --- |
| Desktop, lewat peramban sungguhan | **LULUS** — pada lebar 1000 px: 0 tombol di bawah 40 px, 0 teks di bawah 12 px, konsol 0 error |
| Emulasi mobile Lighthouse | **LULUS** — aksesibilitas **100**, praktik terbaik **100**, SEO 83 (satu-satunya kegagalan `robots.txt` sudah diperbaiki sejak itu) |
| Meta viewport | benar, tanpa `maximumScale` |

| Yang **BELUM** dites | Kenapa |
| --- | --- |
| Lebar nyata 320 / 375 / 768 px | Alat yang tersedia tidak punya kemampuan *emulasi lebar* |
| Sentuhan jari sungguhan (seret–lepas, ketuk) | Tidak ada perangkat sentuh |
| Rotasi lanskap | Sama |
| Performa HP kelas menengah | Tidak ada perangkat |
| Suara Indonesia dari sistem | Tidak ada suara sistem berbahasa Indonesia di lingkungan ini |

**Yang perlu Anda lakukan:** buka `https://zippyverse.vercel.app/` di HP
sungguhan, lalu di DevTools dengan lebar **320, 375, dan 768 px**. Uji paling
penting: seret–lepas di pulau, memutar suara soal, dan buka `/peta` + `/admin`.

---

## Yang masih perlu dikerjakan

| Prioritas | Tugas | Poin |
| --- | --- | --- |
| **1** | Tambah link demo di README + ubah `106 pengujian` → `184` | **SELESAI** — tautan Live & Kode di kepala README; dua baris `106 pengujian` menjadi `184` |
| **2** | Tes nyata di HP + emulasi 320/375/768 px | 8 |
| **3** | Isi `GEMINI_API_KEY` di Vercel → Redeploy, lalu pastikan `mode` berubah `fallback` → `gemini` | 2 (catatan) |
| **4** | Putar ulang **4 rahasia** yang sudah terekspos (lihat poin 5) | — |
| **5** | Hubungkan integrasi Git di Vercel — saat ini push **tidak** memicu deploy | — |
| **6** | Selesaikan 6 tanda `[TINJAU]` di `AGENTS.md` | **SELESAI** — dilepas semua 15 Okt 2026; berkas kini tanpa `[TINJAU]` |
| **7** | Buat `ANALISIS-KESESUAIAN.md` — diminta pada 15 Okt tetapi belum pernah ada | — |

---

*Diperiksa 2026-10-15 dengan pengambilan data langsung: GitHub API (tanpa
autentikasi), `https://zippyverse.vercel.app/`, `git log`, dan pembacaan isi
berkas. Setiap klaim pada dokumen ini dapat diulang dengan perintah yang sama.*
