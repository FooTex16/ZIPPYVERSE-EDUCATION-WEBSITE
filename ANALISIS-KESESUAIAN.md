# ANALISIS-KESESUAIAN — ZIPPYVERSE

Analisis kepatuhan terhadap ketentuan resmi **M-ONE Telkomsel Coding Competition
Kategori Umum**. Disusun memakai bukti pengambilan langsung: pembacaan struktur
repositori, `git log`, penghitungan isi berkas, pertanyaan langsung ke basis data
Supabase, dan pemeriksaan terhadap situs yang sudah hidup di internet.

> **Aturan yang dipegang:** setiap klaim di bawah ini punya perintah atau
> sumber yang bisa dijalankan ulang. Apa yang tidak bisa diverifikasi ditulis
> **BELUM JELAS** — bukan ditebak.

| | |
| --- | --- |
| Project | ZIPPYVERSE — Petualangan di Planet Luminara |
| Garis start | **5 Okt 2026 09.30 WIB** |
| Deadline submit | **15 Okt 2026 15.30 WIB** |
| Analisis disusun | 15 Okt 2026, 19.50 WIB |
| Repositori | `https://github.com/FooTex16/ZIPPYVERSE-EDUCATION-WEBSITE` |
| Situs live | `https://zippyverse.vercel.app/` |

---

## 1 · Pemeriksaan struktur, berkas, dan riwayat commit

### 1.1 · Struktur folder yang benar-benar ada

| Folder | Isi (dihitung langsung) |
| --- | --- |
| `app/` | 23 berkas — 7 halaman, 4 endpoint API, `robots.js`, `sitemap.js`, `layout.jsx`, `not-found.jsx`, `icon.svg`, `globals.css` |
| `components/` | 25 berkas `.jsx` |
| `lib/` | 25 berkas — 24 modul JS + `audioManifest.json` |
| `public/` | 240 berkas — 217 mp3, 20 webp, 3 svg |
| `scripts/` | `kumpulTeks.mjs`, `generateAudio.py`, `optimize-assets.mjs` |
| `tests/` | 8 berkas `.test.mjs` — **184 pengujian** |

### 1.2 · Berkas dokumen

**Ada di dalam repositori (ikut ter-commit dan terpublikasi):**

| Berkas | Peran |
| --- | --- |
| `AGENTS.md` | **Docs acuan AI Agent** — 5 bagian wajib |
| `README.md` | Deskripsi, instalasi, pohon folder |
| `JURNAL-PROMPT.md` | Jurnal prompt terkurasi 5 slot |
| `LOG-PROMPT-MENTAH.md` | Log prompt mentah awal–akhir |
| `CHECKLIST-FINAL.md` | Daftar kesiapan submit |
| `CEK-3-KOMPONEN.md` | Hasil cek konsistensi antar dokumen |

**Ada tetapi di LUAR repositori** (ruang kerja induk, tidak ikut dipublikasikan):
`JURNAL-DEBUGGING.md` · `LAPORAN-BUG.md` · `AUDIT_REPORT.md` · `CEK-AKHIR.md` ·
`REKONSTRUKSI-ALUR.md` · `REKONSTRUKSI-SLOT1-IDE-PRD.md` ·
`VERIFIKASI-DEPLOY.md` · `KERANGKA-JURNAL-5-PROMPT.md`

**TIDAK PERNAH ADA** (telusuri seluruh ruang kerja, bukan hanya repo):
`PRD.md` · `CLAUDE.md` · `PLAN.md` · folder `docs/`

> Ketentuan gerbang memakai frasa *"AGENTS.md / PRD"* — jadi ketiadaan `PRD.md`
> **tidak** membuat gerbang 1 gagal, sebab `AGENTS.md` memenuhinya.

### 1.3 · Riwayat commit vs garis start

```
git log --reverse --date=iso --format="%h | %ad | %s"
```

| | |
| --- | --- |
| Jumlah commit | **41** |
| Commit pertama | `a3128d6` — **2026-10-14 13:05:52 +0700** |
| Kelima commit awal | 13:05:52, 13:05:55, 13:05:56, 13:05:56, 13:05:57 — selisih **5 detik** |
| Commit terakhir | `adebc94` — 2026-10-15 18:55:59 +0700 |

**Selisih terhadap garis start (5 Okt 09.30 WIB):** commit pertama mendarat
**9 hari 3 jam 35 menit SETELAH garis start.** Tidak ada satu pun commit
bertanggal sebelum garis start.

### 1.4 · Temuan di luar enam gerbang — DILAPORKAN, BUKAN DISIMPAN

Dua hal berikut **bukan angka gerbang**, tetapi keduanya menyentuh aturan waktu
yang tertulis di ketentuan, jadi wajib disebut:

| Hal | Fakta terverifikasi | Dampak |
| --- | --- | --- |
| **Prompt sebelum garis start** | **5 dari 80 baris pesan** berjam **5 Okt 00:29:42 – 00:32:39 WIB**, yaitu ±9 jam **sebelum** garis start 09.30. Kelimanya dari sesi pembuka (`ses_ef8092109ffe`) berisi permintaan tema/subtema dan satu lampiran gambar. | **RISIKO.** Kelima prompt itu **tidak menghasilkan kode maupun dokumen apa pun di repositori** (seluruh kode lahir 11–14 Okt). Namun bunyi aturannya *"semua … prompt harus dibuat SETELAH waktu itu"*, sehingga kelimanya tetap tercatat melanggar. Putuskan: lampirkan apa adanya lalu jelaskan, atau mulai log dari Prompt #8 (11 Okt) — **keputusan pemilik proyek.** |
| **Kerja sesudah deadline** | Deadline **15 Okt 15.30 WIB**. Setelah jam itu mendarat **8 commit** (15:33:09 s/d 18:55:59) dan **4 prompt** (16:08, 17:07, 17:18, 17:39). Termasuk di dalamnya `AGENTS.md` (17:33), log mentah (18:18), dan jurnal prompt (18:25). | **BELUM JELAS.** Yang menentukan nilai adalah **waktu formulir di-submit**, dan itu **tidak tercatat di manapun** yang bisa saya periksa. Bila submit terjadi sebelum 15.30, komit-komit itu di luar hitungan; bila sesudah, keduanya terlambat. |

---

## 2 · Enam gerbang kelayakan

> Aturan main: **gagal satu saja = tidak dinilai.**

### Gerbang 1 · Docs acuan AI Agent — **LULUS**

`AGENTS.md` ada di root repo, ter-commit, dan memuat kelima bagian yang
diminta: **Ringkasan Project · Stack & Tools · Fitur & Halaman · Aturan Kerja ·
Catatan Pengembangan.**

Bukti isi (dibaca, bukan disebut):

| Bagian | Pemenuhan |
| --- | --- |
| Tujuan / ringkasan | ✅ ada — masalah yang dijawab, tiga keputusan desain, dua pengguna |
| Stack & Tools | ✅ diambil dari `package.json`: **7 dependensi + 6 dependensi pengembangan**, perintah npm, hosting |
| Fitur & halaman | ✅ 23 rute dari `app/`, 9 pulau, 6 tipe misi, 8 kostum, 240 aset |
| Aturan kerja | ✅ struktur folder, penamaan berkas, konvensi commit, batasan tampilan & keamanan |
| Catatan pengembangan | ✅ peran AI, riwayat komit, pola debugging, audit |

**Verifikasi daring:** `raw.githubusercontent.com/.../main/AGENTS.md` → **HTTP 200,
22.667 byte.**

### Gerbang 2 · Repository GitHub public — **LULUS**

GitHub API (permintaan tanpa autentikasi) mengembalikan:

```
private    : false
visibility : public
branch     : main
```

Seluruh enam berkas dokumen di atas terbaca **HTTP 200** dari `main`.

### Gerbang 3 · Jurnal prompt terkurasi + log mentah — **LULUS**

| Syarat | Kondisi |
| --- | --- |
| Jurnal maksimal 5 prompt, kategori Ide/PRD · Debugging · Audit & optimasi · Finishing · bebas | ✅ `JURNAL-PROMPT.md` — tepat **5 slot**, seluruhnya berisi teks asli, **0 placeholder** |
| Log mentah awal–akhir | ✅ `LOG-PROMPT-MENTAH.md` — **77 prompt pengguna** (5 Okt 00.29 – 15 Okt 17.39) + 3 pesan subagen di Lampiran B, disalin kata demi kata |
| Salinan persis | ✅ tiga penanda redaksi saja untuk rahasia, ditandai terang-terangan di kepala berkas |

Kecocokan teks jurnal terhadap log diperiksa per slot: **5 dari 5 cocok.**

> **Catatan pembenahan (sudah diperbaiki 15 Okt):** awalnya sejumlah rujukan
> nomor prompt di `JURNAL-PROMPT.md`, `CHECKLIST-FINAL.md`, dan
> `CEK-3-KOMPONEN.md` memakai **penomoran indeks mentah (80 baris)** sedangkan
> badan log memakai **penomoran sendiri (77 + Lampiran B)**, sehingga semua
> rujukan setelah Prompt #34 meleset +3. Keseluruhan telah diselaraskan ke
> penomoran `## Prompt #N` milik log.

### Gerbang 4 · Stack bebas — **LULUS**

Next.js 15 (App Router) · React 19 · Tailwind CSS 3.4 · Framer Motion ·
Supabase · Gemini. Tidak ada pembatasan framework dalam ketentuan.

### Gerbang 5 · Sesuai tema & subtema — **LULUS**

Tema **"Innovating Education Through Technology"**, subtema **"Web Education for
Kids (untuk anak SD)"**.

| Sisi | Bukti di kode |
| --- | --- |
| **Untuk anak SD** | 19 misi / 143 butir soal: matematika, bahasa Indonesia, IPA, IPS, seni, logika — bahasa Indonesia, seluruh soal direkam suara |
| **Inovating education** | 1 misi ±3 menit, tidak ada kata "gagal" di layar, jawaban salah dijawab dengan petunjuk, energi & pulau sebagai motivasi |
| **Through technology** | AI jawab pertanyaan anak lewat Gemini dengan cadangan luring (`app/api/zippy` + `lib/zippyBrain.js`), narasi suara Indonesia, sinkronisasi awan, dasbor orang tua |

Pemindaian `coding`, `pemrograman`, `koding`, `algoritma`, `program` pada seluruh
`lib/*.js` hanya menemukan dua kebetulan di komentar — **nol soal pemrograman**,
dan memang tidak diwajibkan. Subtema yang diminta adalah *education for kids*,
bukan *coding education*.

> **Koreksi penting:** frasa **"website edukasi coding anak SD"** tidak berasal
> dari ketentuan lomba, melainkan dari kerangka instruksi penulisan `AGENTS.md`
> (Prompt #67 dan #76, 15 Okt). Gerbang 5 tidak pernah menuntutnya.

### Gerbang 6 · Di-deploy dan bisa diakses juri — **LULUS**

Diperiksa langsung 15 Okt 2026 pukul 19.47 WIB:

| URL | Hasil |
| --- | --- |
| `/` | **HTTP 200**, 75.583 byte, `<title>ZippyVerse - Petualangan di Planet Luminara</title>`, **tanpa `localhost`** |
| `/robots.txt` | **HTTP 200** — `Sitemap: https://zippyverse.vercel.app/sitemap.xml` |
| `/sitemap.xml` | **HTTP 200** — **9 `<loc>`**, semua di domain benar, tanpa `localhost` |
| `/icon.svg` | **HTTP 200**, 925 byte |
| `/api/zippy` | **HTTP 200** — `mode: "fallback"` |

### Ringkasan gerbang

| # | Gerbang | Status |
| --- | --- | --- |
| 1 | Docs acuan AI Agent | **LULUS** |
| 2 | Repository GitHub public | **LULUS** |
| 3 | Jurnal 5 prompt + log mentah | **LULUS** |
| 4 | Stack bebas | **LULUS** |
| 5 | Sesuai tema & subtema | **LULUS** |
| 6 | Ter-deploy dan bisa diakses | **LULUS** |

**6 dari 6 gerbang LULUS.**

---

## 3 · Yang SUDAH dan yang KURANG

| Bidang | SUDAH | KURANG |
| --- | --- | --- |
| **Docs acuan AI Agent** | `AGENTS.md` lengkap 5 bagian, ter-commit, terpublikasi, seluruh angka berasal dari perintah yang bisa diulang; 6 tanda `[TINJAU]` awal **sudah diselesaikan semua** | `PRD.md`/`CLAUDE.md`/`docs/` tidak ada — **tidak menyangkut gerbang**, sebab ketentuan menerima "AGENTS.md / PRD" |
| **Jurnal prompt** | 5 slot terisi penuh, kategori sesuai, teks asli, pemetaan slot → prompt → file/commit | **Nama peserta belum terisi** (saya tidak punya datanya); perlu digabung menjadi **satu berkas** untuk formulir |
| **Log mentah** | 77 prompt + 3 subagen, verbatim, periodenya 5 Okt 00.29 – 15 Okt 17.39, 4 rahasia sudah diganti penanda | 5 prompt pertama berada **sebelum garis start** (lihat §1.4) |
| **Repo public** | `private: false`, `visibility: public`, 41 commit, seluruh dokumen terbaca dari `main` | Integrasi Git di Vercel **belum tersambung** → push **tidak memicu deploy** |
| **Deploy** | Semua rute 200, alamat absolut benar, ikon ada, HTTPS bersih | `GEMINI_API_KEY` **masih kosong** di Vercel → AI tetap `mode: "fallback"` |

---

## 4 · Temuan teknis tambahan (dari pemeriksaan langsung)

| # | Temuan | Status |
| --- | --- | --- |
| 1 | AI menjawab **`mode: "fallback"`** pada setiap percobaan (468–943 ms — terlalu cepat untuk panggilan Gemini) | **BELUM BERES** — isi `GEMINI_API_KEY` di Vercel lalu Redeploy |
| 2 | **Pembatas laju terbukti jalan**: 12 permintaan pertama dalam satu menit membalas `200`, permintaan ke-13 s/d ke-19 membalas **`429`** | ✅ sesuai `RATE_MAX = 12` |
| 3 | Jawaban cadangan `lib/zippyBrain.js` memakai bahasa Indonesia yang benar dan mengarahkan kembali ke pelajaran | ✅ |
| 4 | Tabel Supabase `planets` · `missions` · `profiles` **0 baris** (diperiksa dengan `service_role`, bukan hanya anon) | ✅ dicatat — konten tayang bersumber dari kode statis |

---

## 5 · Daftar tindakan yang tersisa

| # | Tindakan | Siapa yang mengerjakan |
| --- | --- | --- |
| 1 | Isi `GEMINI_API_KEY` di Vercel → **Redeploy** → pastikan `mode` berubah `fallback` → `gemini` | **Anda** (dasbor Vercel) |
| 2 | Sambungkan integrasi Git di Vercel agar push memicu deploy | **Anda** (dasbor Vercel) |
| 3 | Putar ulang 4 rahasia yang pernah terekspos (kunci Gemini, `SUPABASE_SERVICE_ROLE_KEY`, kata sandi database, kata sandi akun) | **Anda** (Google AI Studio & Supabase) |
| 4 | Tes nyata di HP dan pada lebar 320 / 375 / 768 px | **Anda** (perangkat fisik) |
| 5 | Tentukan sikap atas **5 prompt pra-garis-start** (lihat §1.4) | **Anda** |
| 6 | Isi **nama peserta** pada berkas jurnal yang akan disubmit | **Anda** |

---

*Disusun 15 Okt 2026 dari pengambilan bukti langsung. Seluruh angka dapat
dihasilkan ulang lewat `git log`, penghitungan berkas, `npm test`, kueri REST
Supabase, dan pemeriksaan HTTP terhadap situs live. Bagian yang tidak dapat
diverifikasi ditandai **BELUM JELAS**.*
