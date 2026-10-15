# JURNAL PROMPT TERKURASI — ZippyVerse

Lima prompt yang mewakili proses *vibe coding* proyek ini, dipilih sesuai
kategori resmi. **Seluruh teks pada bagian "Prompt (asli)" disalin verbatim
dari `LOG-PROMPT-MENTAH.md`** — tidak diringkas dan tidak ditulis ulang.

| Slot | Kategori | Waktu (WIB) | Prompt |
| --- | --- | --- | --- |
| 1 | Ide / PRD | 11 Okt 2026 13:48 | #8 |
| 2 | Debugging | 15 Okt 2026 12:45 | #70 |
| 3 | Audit & Optimasi | 13 Okt 2026 13:10 | #34 |
| 4 | Finishing | 11 Okt 2026 20:06 | #15 |
| 5 | Bebas (deploy & verifikasi) | 15 Okt 2026 16:08 | #74 |

---

### Slot 1 — Ide / PRD

**Prompt (asli):** (LOG-PROMPT-MENTAH.md **Prompt #8** · 2026-10-11 13:48:09 WIB)

```
saya ingin membuat sebuah website untuk lomba berbasis vibe coding dengan tema "Innovating Education Through Technology" dengan subtema "WEB EDUCATION FOR KIDS (untuk anak SD)". coba kamu buatkan ide ide website yang bagus untuk di zaman sekarang dan ditargetkan untuk anak sd di era modern ini. permasalahannya anak anak sekarang rata rata banyak yang lebih dominan menonton video di sosmed ketimbang di pakai untuk belajar gadget tersebut jadi hal apa yang bikin anak anak tertarik untuk mencoba website ini dan merubah kebiasaan mereka dari yang kecanduan sosmed menjadi sering bermain ini sambil belajar dan menambah wawasan mereka. mungkin ini cukup sulit untuk di bikin tapi percayalah pasti ada solusinya. dengan maskot yang berna Zippy
```

**Prompt pemilih ide:** (LOG-PROMPT-MENTAH.md **Prompt #9** · 2026-10-11 13:55:18 WIB)

```
ide 1 ZIPPYVERSE - Petualangan di Planet Luminara juga bagus coba buatkan tantangan dalam pembuatan website ini dan apa saja yang di perlukan
```

**Konteks / masalah:**

Ide **diminta ke AI**, bukan lahir dari PRD buatan sendiri. Pada 11 Okt 13:48 WIB
saya mengirim satu prompt berisi tema, subtema, dan masalah nyata yang ingin
diselesaikan: anak SD lebih banyak menonton video di sosmed ketimbang memakai
gadget untuk belajar. Tujuannya eksplisit di prompt — mencari *"hal apa yang
bikin anak anak tertarik"* supaya kebiasaan bergeser dari kecanduan sosmed
menjadi belajar sambil bermain. Prompt itu juga menyebut maskot **Zippy**.

AI kemudian mengusulkan beberapa ide. Enam menit kemudian (13:55 WIB) saya
memilih **ide 1: ZIPPYVERSE — Petualangan di Planet Luminara**. Alasan yang
**tercatat dalam log hanya kata "juga bagus"** — tidak ada alasan lebih rinci
yang tertulis, sehingga tidak saya karang. Yang saya minta setelah pilihan jatuh
adalah dua hal sekaligus: **tantangan pembuatan** dan **daftar kebutuhan** —
artinya sebelum kode ditulis, yang diminta lebih dulu adalah pemetaan risiko,
bukan file PRD.

**Hasil / tindakan AI:**

Setelah ide dipilih, AI langsung membangun tanpa menunggu file PRD terpisah.
Prompt-prompt berikutnya (#10 ke atas, 11–13 Okt) seluruhnya berupa perintah
pembangunan: menghapus latar maskot, memasang ikon pulau, menjalankan di
localhost, mempercantik tampilan, menambah pulau dan mode perolehan koin.

Bukti bahwa PRD tidak pernah menjadi berkas terpisah: di dalam repo **tidak
ada `PRD.md`, `docs/`, `PLAN.md`, maupun `CLAUDE.md`** — hanya `README.md` yang
lahur bersama impor kode pertama.

Acuan pun **berkembang menjadi `AGENTS.md`** lewat tiga langkah yang semuanya
tercatat di log:

| Waktu | Prompt | Yang diminta |
| --- | --- | --- |
| 6 Okt 14:24 | #6 | *"bagus coba kamu buatkan prd dari website ini dalam format .md"* — permintaan PRD pertama; berkasnya tidak pernah masuk repo |
| 15 Okt 11:23 | #67 | Draf dokumen acuan AI Agent dengan struktur 5 bagian (Tujuan, Stack, Fitur, Aturan Kerja, Catatan Pengembangan) + tanda `[TINJAU]` |
| 15 Okt 17:18 | #76 | Perintah final: baca ulang seluruh project, perbarui `AGENTS.md` dengan struktur wajib 5 bagian, setiap klaim wajib dapat diverifikasi dari kode |

Jadi alurnya jujur seperti ini: **ide diminta ke AI → AI mengusulkan → saya
memilih satu → AI langsung membangun → acuan ditulis belakangan dari isi kode
yang sudah jadi**, bukan sebaliknya.

**Iterasi berikutnya:**

`AGENTS.md` lahir dari komit `58b09be` (*docs: tambah AGENTS.md sebagai acuan
AI Agent*, 15 Okt 17:33 WIB, 503 baris). Karena dokumen ini disusun **setelah
kode jadi**, ia memuat 6 tanda `[TINJAU]`. Semuanya **sudah diselesaikan pada
15 Okt 2026** dengan bukti pengambilan langsung. Temuan terpenting justru
membantah premis draf awal: instrumen lomba **tidak** meminta *"website edukasi
coding"*, melainkan subtema *"Web Education for Kids (untuk anak SD)"*
(Prompt #61) — sehingga isi kode berupa pelajaran umum SD **sudah sesuai**.
`Pulau Digital` (satu-satunya pulau teknologi) memang masih `available: false`
tanpa satu misi pun, tetapi itu peta jalan, bukan syarat penilaian.

---

### Slot 2 — Debugging

**Prompt (asli):** (LOG-PROMPT-MENTAH.md **Prompt #70** · 2026-10-15 12:45:08 WIB)

```
Ada bug pada project ini. Kerjakan dengan alur berikut (jangan langsung
menebak):
1. REPRODUKSI: jelaskan langkah untuk memicu bug dan gejala persisnya.
   Kalau perlu, usulkan cara saya mereproduksinya di browser.
2. DIAGNOSA: telusuri kode terkait (file, fungsi, state, data flow), cari
   akar masalahnya. Jelaskan KENAPA ini terjadi (bukan hanya "perbaiki X").
3. PERBAIKAN MINIMAL: terapkan fix yang paling kecil dan aman, tanpa
   mengubah fitur lain. Hindari menulis ulang besar-besaran.
4. VERIFIKASI: jalankan build/tes yang relevan, pastikan bug hilang dan
   tidak ada error baru.
5. COMMIT: commit dengan pesan deskriptif, misal:
   "fix: [fitur] - [masalah] ([penyebab])"
6. CATATAN JURNAL: tulis ringkasan untuk jurnal debugging:
   - Prompt yang saya pakai
   - Gejala & error
   - Akar masalah
   - Perbaikan yang dilakukan

Laporkan hasil tiap langkah. Simpan ringkasan ke JURNAL-DEBUGGING.md
(bisa berisi beberapa entri bug).
```

**Konteks / masalah:**

Prompt ini adalah **pemberhenti kebiasaan menebak**. Sebelumnya bug diperbaiki
sekenanya; sejak prompt ini, setiap perbaikan wajib melewati enam langkah.
Sehari sebelumnya (15 Okt 11:49, Prompt #68) saya memanggil perburuan bug
menyeluruh halaman demi halaman — hasilnya `LAPORAN-BUG.md` (23 KB) berisi
temuan berjenjang tanpa satu pun perbaikan, sesuai perintah *"JANGAN memperbaiki
dulu — hanya laporkan."*

Bug-bug yang menjadi sasaran alur ini nyata dan tercatat di `git log`:

| Commit | Masalah |
| --- | --- |
| `b479eca` | `/pulau/slug-tak-ada` terjebak layar "Memuat" selamanya |
| `adf28ff` | Tombol umpan balik terjebak "Mengirim..." |
| `88e02e4` | Kotak jawaban misi seret-angka tak bisa dipakai papan ketik |
| `7650138` | Halaman 404 tampil bahasa Inggris |
| `4325eb7` | Semua rute menampilkan judul sama (metadata di komponen klien) |
| `1f4d90a` | Pendengar papan ketik misi susun huruf terpasang ulang tiap render |
| `9e62e51` | Tombol panel tak melaporkan statusnya, target sentuh cuma 32 px |
| `9b503d8` | Huruf 9–11 px tak terbaca anak |
| `a90138b` | Target sentuh 20–36 px dan tombol tanpa nama |
| `603b146` | `og:url`/`sitemap`/`robots` menunjuk `localhost`, situs tanpa ikon |

**Hasil / tindakan AI:**

Sebanyak **18 komit `fix`** mendarat sepanjang 14–15 Okt. **Enam** di antaranya
memakai format penuh `fix: [fitur] - [masalah] ([penyebab])` yang lahir langsung
dari butir 5 prompt di atas; 12 sisanya tetap deskriptif namun tanpa bagian
`([penyebab])`. Tabel di atas memuat 10 yang paling mewakili — daftar lengkap
ada di `git log`. Ringkasan tiap entri (gejala → akar masalah → perbaikan →
verifikasi) tersimpan di **`JURNAL-DEBUGGING.md`** (37 KB, 7 entri, 15 pelajaran)
beserta `LAPORAN-BUG.md` (23 KB) sebagai dokumen temuan awal.

**Iterasi berikutnya:**

Dua bug sengaja tidak dibuka kembali: BUG-06 dan BUG-13. Entri 7 pada
`JURNAL-DEBUGGING.md` mencatat status jujur bahwa perbaikan BUG-16/BUG-17
(*alamat absolut menunjuk `localhost`*) **belum terkonfirmasi di situs live**
sampai deploy ulang dilakukan.

---

### Slot 3 — Audit & Optimasi

**Prompt (asli):** (LOG-PROMPT-MENTAH.md **Prompt #34** · 2026-10-13 13:10:54 WIB ·
21.767 karakter — potongan pembuka; **teks penuh ada di LOG-PROMPT-MENTAH.md**)

```
# COMPREHENSIVE EDUCATIONAL WEBSITE AUDIT & IMPROVEMENT PROMPT

## 1. ROLE AND OBJECTIVE

Act as a Senior Full-Stack Developer, UI/UX Designer, Educational Technology Specialist, QA Engineer, Web Security Auditor, Accessibility Specialist, and Performance Engineer.

Your task is to conduct a comprehensive, evidence-based audit of the educational website project available in the current workspace.

Evaluate the website beyond its visual appearance. Examine its educational effectiveness, functionality, user experience, responsive design, accessibility, security, privacy, performance, SEO, code quality, maintainability, and production readiness.

The ultimate objective is to determine whether the website is reliable, effective, secure, accessible, and suitable for its intended audience.

If the project targets elementary school students, prioritize age-appropriate learning experiences, child safety, simple navigation, engaging interactions, and accessible educational content.
```

[…potongan diakhiri di sini; lanjutan `## 2. NON-NEGOTIABLE AUDIT RULES` hingga
`## 8. START THE AUDIT NOW` dapat dibaca utuh di `LOG-PROMPT-MENTAH.md`,
Prompt #34, total 21.767 karakter.]

**Konteks / masalah:**

Audit diarahkan sebagai pekerjaan **berbasis bukti, bukan kesan**. Aturan yang
saya tetapkan sendiri di prompt itu cukup ketat: dilarang menganggap sebuah
fitur berjalan hanya karena elemen UI-nya ada, dilarang mengarang hasil tes
atau ukuran performa, wajib membedakan temuan terverifikasi dari dugaan, dan
secara eksplisit dilarang membocorkan rahasia ke laporan audit. Mode bawaannya
pun **`AUDIT ONLY`** — dilarang menyentuh kode pada putaran pertama.

Saat itu proyek belum ada di git (repo baru diinisialisasi 14 Okt), jadi audit
bekerja langsung di ruang kerja.

**Hasil / tindakan AI:**

Prompt ini memicu **tiga subagen audit paralel** pada 13 Okt 13:13 WIB —
*Security and privacy audit*, *Accessibility and SEO audit*, dan *Code quality
and content audit* (ketiganya tercatat di Lampiran B `LOG-PROMPT-MENTAH.md`).
Hasilnya digabung menjadi **`AUDIT_REPORT.md`** (77 KB) dengan temuan bernomor
`F-01` … `F-27` yang kemudian dipakai sebagai penanda lintas dokumen.

Perbaikan performa yang mengikuti dikumpulkan dalam satu komit
**`a2935de`** (*Percepat muatan halaman: font lokal, suara siap lebih dulu,
maskot tak pernah kosong*) yang memperbaiki empat hal sekaligus:

1. Font Google (dua asal luar yang menahan render awal) → dipindah ke
   `next/font`, disajikan dari asal sendiri.
2. Suara soal berikutnya diunduh selagi anak masih menjawab.
3. 14 ekspresi maskot dipra-muat saat perangkat menganggur (`lib/preload.js`).
4. Dua PNG mati (2,1 MB) dihapus; berkas statis diberi masa simpan cache.

Audit lanjutan untuk kesiapan submit ada di **Prompt #65** (15 Okt 11:05,
*"Lakukan audit akhir project ini untuk kesiapan lomba"*) yang menghasilkan
`CEK-AKHIR.md` (11,7 KB).

**Iterasi berikutnya:**

`AUDIT_REPORT.md` masih berada **di luar repo**. Keputusan yang belum diambil:
ikut dikomit sebagai bukti proses, atau disaring dulu karena sebagian isinya
memuat catatan keamanan.

---

### Slot 4 — Finishing

**Prompt (asli):** (LOG-PROMPT-MENTAH.md **Prompt #15** · 2026-10-11 20:06:13 WIB)

```
coba kamu perbagus tampilan website ini tanpa merubah fitur fungsi namun membuat website ini lebih hidup dan tidak berat . dan juga pastikan chat ai nya bisa membaca dan sinkron dengan chat seblumnya agar tidak ngawur dan hemat token
```

**Konteks / masalah:**

Dua tuntutan yang berlawanan arah diletakkan dalam satu kalimat: tampilan harus
**lebih hidup**, tetapi **tidak berat**, dan **fitur tidak boleh berubah**.
Tambahan ketiga adalah soal percakapan AI — jawaban Zippy di masa lalu dianggap
"ngawur" karena tidak mengenal riwayat percakapan sebelumnya, dan jawaban yang
panjang membakar token.

**Hasil / tindakan AI:**

- **"Lebih hidup tanpa berat"** dijawab dengan membatasi animasi hanya pada
  `transform` dan `opacity` — seluruh `keyframes` di `tailwind.config.js`
  (floaty, wiggle, bob, popIn, twinkle, drift, dll) mematuhinya, sehingga tidak
  ada hitung ulang tata letak. Animasi juga dimatikan bila perangkat meminta
  lewat `prefers-reduced-motion` (`app/globals.css` baris 357).
- **"Sinkron dengan chat sebelumnya"** diwujudkan di
  `app/api/zippy/route.js` → `buildHistory()` (baris 100–112) yang mengubah
  riwayat menjadi format `contents` milik Gemini dan **membuang sapaan awal
  Zippy** supaya percakapan tidak mengulang dari nol.
- **"Hemat token"** dijaga dua angka: `MAX_HISTORY = 6` (baris 17) hanya
  menyisakan 6 pesan terakhir, dan `MAX_MSG_CHARS = 280` (baris 18) memotong
  setiap pesan. Ditambah `maxOutputTokens: 220` pada konfigurasi model
  (baris 215) supaya jawaban selalu ringkas.

**Iterasi berikutnya:**

Keluhan serupa muncul kembali pada **Prompt #41** (13 Okt 21:46) untuk suara —
voice over dianggap monoton *"itu itu aja"*, dan soal `10 + 5` diucapkan *"sepuluh
oh lima"* tanpa kata "tambah"/"kurang". Perbaikan lanjutan mencakup variasi
voice over plus pengingat bila anak diam 10 detik. Prompt **#40** dan **#47**
menambahkan sentuhan akhir berupa halaman admin, kartu yang mengembang saat
hover/tekan, dan kolom kirim masukan.

---

### Slot 5 — Bebas: Deploy & Verifikasi

**Prompt (asli):** (LOG-PROMPT-MENTAH.md **Prompt #74** · 2026-10-15 16:08:23 WIB)

```
Website sudah di-deploy ke hosting. Verifikasi di URL live:
https://zippyverse.vercel.app/

Cek satu per satu:
1. Halaman terbuka tanpa error (buka langsung di URL).
2. Tidak ada aset 404: cek di DevTools Network apakah ada request gagal
   (gambar, CSS, JS, font, favicon) — terutama path absolut vs relatif,
   karena path yang salah adalah bug paling umum pasca-deploy.
3. Routing bekerja: muat ulang halaman selain "/" (mis. /tentang) tidak
   menghasilkan 404 (khusus SPA: cek perlu konfigurasi fallback hosting).
4. Form/fitur interaktif berfungsi di hosting (bukan hanya di localhost).
5. HTTPS aktif dan tidak ada konten campuran (mixed content).
6. Tampilan mobile & desktop di URL live.

Output: file VERIFIKASI-DEPLOY.md — tiap poin diberi status OK / ERROR +
bukti. Perbaiki yang error pakai PROMPT D2. Simpan hasilnya.
```

**Konteks / masalah:**

Ini bagian yang paling sering bohong: sebuah website bisa lolos build, lint, dan
184 pengujian **tetap rusak di internet**. Prompt itu menyorot dugaan yang paling
umum — *path absolut vs relatif* — dan meminta bukti per poin, bukan klaim
kelar.

**Hasil / tindakan AI:**

Enam poin diperiksa langsung terhadap `https://zippyverse.vercel.app/` dan
ditulis ke **`VERIFIKASI-DEPLOY.md`** (16,6 KB) berisi status OK/ERROR plus
bukti per poin. Hasilnya: 4 OK dan 3 ERROR — dan ketiganya **tidak muncul sama
sekali** di build, lint, test, maupun konsol:

| Temuan | Penyebab |
| --- | --- |
| `og:url`, `sitemap.xml`, `robots.txt` menunjuk `http://localhost:3000` | Alamat situs ditulis tiga kali dengan cadangan `localhost` |
| Tidak ada ikon situs (`/favicon.ico` → 404) | Belum ada `app/icon.svg` |
| AI Zippy tidak berjalan — semua jawaban `mode: "fallback"` | `GEMINI_API_KEY` kosong di Vercel; kode keluar sebelum sempat memanggil Gemini |

Dua yang pertama diperbaiki pada komit **`603b146`** lewat modul baru
`lib/situsUrl.js` (`alamatSitus()` membaca env Vercel) dan `app/icon.svg`.
Deteksi ketiga memakai bukti waktu respons **0,33–0,67 detik** — mustahil untuk
satu panggilan Gemini yang butuh 1–15 detik.

**Iterasi berikutnya:**

Sisa pekerjaan bukan lagi di kode, melainkan di dasbor Vercel: mengisi
`GEMINI_API_KEY`, menghubungkan integrasi Git (saat ini push ke GitHub **tidak
memicu deploy**), lalu melakukan deploy ulang. Setelah itu `mode` pada respons
`/api/zippy` harus berubah dari `fallback` menjadi `gemini`.

---

## Pemetaan Slot → File / Commit → Status

| Slot | Sumber prompt | File / commit | Status |
| --- | --- | --- | --- |
| 1 — Ide/PRD | `LOG-PROMPT-MENTAH.md` #8, #9, #6, #67, #76 | `AGENTS.md` · komit `58b09be` | **LENGKAP** |
| 2 — Debugging | `LOG-PROMPT-MENTAH.md` #70, #68 | `JURNAL-DEBUGGING.md` (di luar repo) · `LAPORAN-BUG.md` (di luar repo) · 12 komit `fix` `b479eca`…`603b146` | **LENGKAP** |
| 3 — Audit & Optimasi | `LOG-PROMPT-MENTAH.md` #34, #65 | `AUDIT_REPORT.md` (di luar repo) · `CEK-AKHIR.md` (di luar repo) · komit `a2935de` | **LENGKAP** — kutipan prompt dipotong berlabel, teks penuh di log |
| 4 — Finishing | `LOG-PROMPT-MENTAH.md` #15, #41, #40, #47 | `app/api/zippy/route.js` (`buildHistory`, `MAX_HISTORY`, `MAX_MSG_CHARS`) · `tailwind.config.js` · `app/globals.css` | **LENGKAP** |
| 5 — Bebas (deploy) | `LOG-PROMPT-MENTAH.md` #74 | `VERIFIKASI-DEPLOY.md` (di luar repo) · komit `603b146` · `lib/situsUrl.js` · `app/icon.svg` | **LENGKAP** |

### Catatan yang belum beres

| Hal | Keadaan |
| --- | --- |
| `ANALISIS-KESESUAIAN.md` | **BELUM ADA.** Diminta oleh Prompt #61 (15 Okt 10:28) tetapi berkasnya tidak pernah dibuat |
| `PRD.md` | **BELUM PERNAH ADA.** Diminta Prompt #6 (6 Okt) tetapi tidak pernah menjadi berkas; digantikan `AGENTS.md` |
| 6 file kerja (`JURNAL-DEBUGGING`, `LAPORAN-BUG`, `AUDIT_REPORT`, `CEK-AKHIR`, `REKONSTRUKSI-ALUR`, `REKONSTRUKSI-SLOT1`, `VERIFIKASI-DEPLOY`, `KERANGKA-JURNAL`) | Semuanya ada, tetapi **di luar repo** — hanya `AGENTS.md`, `LOG-PROMPT-MENTAH.md`, `README.md` yang ikut ter-commit |
| 6 tanda `[TINJAU]` di `AGENTS.md` | **SUDAH DISELESAIKAN** 15 Okt 2026 — berkas kini tanpa `[TINJAU]` |

---

*Disusun 2026-10-15. Seluruh kutipan prompt berasal dari
`LOG-PROMPT-MENTAH.md` (77 prompt pengguna, 2026-10-05 – 2026-10-15). Kategori
sesuai ketentuan: Ide/PRD, Debugging, Audit & Optimasi, Finishing, Bebas.*
