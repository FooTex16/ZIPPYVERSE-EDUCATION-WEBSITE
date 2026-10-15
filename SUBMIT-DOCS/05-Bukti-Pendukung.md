# 05 · BUKTI PENDUKUNG — ZippyVerse

Berkas ini mengumpulkan **bukti**, bukan klaim. Setiap baris punya sumber yang
bisa dibuka ulang: berkas kode, perintah, atau pemeriksaan langsung terhadap
situs yang sudah hidup di internet.

---

## 1 · Tabel Fitur vs Relevansi Tema

Tema **"Innovating Education Through Technology"**, subtema **"Web Education for
Kids (untuk anak SD)"**.

### 1.1 · Inovating

| Fitur | Bukti di kode | Mengapa ini inovatif |
| --- | --- | --- |
| Satu misi ±3 menit | Desain durasi ronde pada 6 komponen misi | Lebih pendek daripada satu video — berhenti di tengah bukan kekalahan |
| **Tidak ada kata "gagal" di layar** | Jawaban salah dijawab lewat petunjuk, bukan teguran | Menghilangkan rasa malu yang membuat anak berhenti |
| Energi pulih perlahan | `STAMINA_REGEN_MS` 8 menit, `lib/store.js` baris 26 | Mendorong istirahat, bukan kecanduan |
| Peti hadiah tiap 3 pulau | `PULAU_PER_PETI = 3`, `lib/store.js` baris 351 | Tujuan jangka pendek yang terasa tercapai |
| Pengingat lembut | `components/PengingatDiam.jsx` | Anak diam 10 detik **diingatkan**, bukan ditegur |
| Tantangan Harian diacak per tanggal | `SOAL_HARIAN`, 38 soal, benih tanggal | Soal berbeda tiap hari tanpa kehilangan kesinambungan |
| Bank soal cadangan luring | `lib/zippyBrain.js` | AI tetap menjawab meski kunci hilang atau jaringan putus |

### 1.2 · Education

| Kelompok | Misi | Butir | Sumber |
| --- | --- | --- | --- |
| Pulau Angka (Matematika) | 3 | 33 | `lib/gameData.js` |
| Pulau Kata · Sains · Kreatif · Bumi | 12 | 74 | `lib/missionsExtra.js` |
| Pulau Perkenalan (uji coba) | 3 | 36 | `lib/trialIsland.js` |
| Tantangan Harian | 1 | 5 (dari 38 soal) | `lib/missionsExtra.js` |
| **Total** | **19** | **143** | dihitung dari objek soal di kode |

| Cakupan pelajaran | Pulau |
| --- | --- |
| Matematika | Pulau Angka |
| Bahasa Indonesia | Pulau Kata |
| IPA | Pulau Sains |
| Seni | Pulau Kreatif |
| IPS | Pulau Bumi |
| Bahasa Inggris · Musik · Teknologi | **3 pulau "segera hadir"** |

### 1.3 · Through (jembatan)

| Fitur | Bukti |
| --- | --- |
| Seluruh soal & petunjuk **direkam suara Indonesia** | 211 mp3 di `public/audio/`, `lib/speech.js` |
| Anak belum lancar membaca tetap bisa bermain | Keputusan desain no. 3 |
| Varian petunjuk agar tidak monoton | `lib/petunjukHitung.js` |
| Narasi teks dinormalkan sebelum dibacakan | `lib/bacaTeks.js` |
| Gerakan hanya `transform` & `opacity` | Seluruh `keyframes` di `tailwind.config.js` |
| Hormati `prefers-reduced-motion` | `app/globals.css` — pemilih `html:not([data-motion="on"])` |

### 1.4 · Technology

| Fitur | Bukti |
| --- | --- |
| AI menjawab pertanyaan bebas | `app/api/zippy/route.js` — `mode: "gemini"` / `"fallback"` |
| Batas token & riwayat agar hemat | `MAX_HISTORY = 6`, `MAX_MSG_CHARS = 280`, `maxOutputTokens: 220` |
| Pembatas laju per IP | `RATE_MAX = 12` per 60 detik — **terbukti di situs live** |
| Pemutus arus 5 menit bila model gagal | `route.js` baris 152 |
| Sinkronisasi awan yang tidak pernah menghapus | Daftar kosong ≠ kegagalan (`daftarRusak`) |
| Banyak anak pada satu akun | `lib/profil.js`, `/api/anak` |
| Peran diverifikasi di **server** | `app/api/admin/route.js` cek `app_metadata.role` |
| Alamat absolut disatukan | `lib/situsUrl.js` |

---

## 2 · Daftar Halaman

| # | Rute | Berkas | Siapa yang memakai |
| --- | --- | --- | --- |
| 1 | `/` | `app/page.jsx` | Pengunjung baru & akun Pendamping |
| 2 | `/daftar` | `app/daftar/page.jsx` | Calon akun Pendamping |
| 3 | `/peta` | `app/peta/page.jsx` | Anak — memilih pulau, berbelanja kostum |
| 4 | `/pulau/[slug]` | `app/pulau/[slug]/page.jsx` | Anak — memilih misi, bermain, menerima hadiah |
| 5 | `/dashboard` | `app/dashboard/page.jsx` | Orang tua — perkembangan (baca-saja) |
| 6 | `/profil` | `app/profil/page.jsx` | Akun Pendamping |
| 7 | `/admin` | `app/admin/page.jsx` | Pengelola — gerbang PIN |
| 8 | 404 | `app/not-found.jsx` | Siapa pun yang salah alamat |

### Endpoint API

| # | Endpoint | Metode | Peran |
| --- | --- | --- | --- |
| 1 | `/api/zippy` | `POST` | Jawaban AI Zippy |
| 2 | `/api/admin` | `GET`, `POST` | Kewenangan pengelola (diverifikasi server) |
| 3 | `/api/anak` | `GET`, `POST` | Daftar anak per akun |
| 4 | `/api/masukan` | `POST`, `GET` | Umpan balik — maks 5 pesan/hari |

### Dukungan mesin pencari

| Berkas | Isi terverifikasi |
| --- | --- |
| `app/robots.txt` → `robots.js` | `User-Agent: *`, `Allow: /`, larangan `/admin`, `/peta`, `/pulau/`, dan `Sitemap` menunjuk domain benar |
| `app/sitemap.js` | **9 `<loc>`**, seluruhnya di `https://zippyverse.vercel.app/` |
| `app/icon.svg` | Ikon tab — **HTTP 200**, 925 byte |
| `app/layout.jsx` | Judul, deskripsi, `og:url` — **tanpa `localhost`** |

---

## 3 · Fitur Inovatif

| # | Fitur inovatif | Mengapa layak disebut inovatif | Kondisi |
| --- | --- | --- | --- |
| 1 | **Zippy — AI pendamping yang menjawab pertanyaan bebas** | Anak bisa bertanya di luar bank soal, dan diarahkan kembali ke pelajaran SD dalam maksimal 2 kalimat | ⚠️ `mode: "fallback"` — `GEMINI_API_KEY` belum terisi di Vercel |
| 2 | **Suara Indonesia untuk seluruh soal** | Anak belum lancar membaca tetap bisa bermain tanpa bantuan orang dewasa | ✅ 211 mp3 terpasang |
| 3 | **Bank soal cadangan luring** | AI tetap menjawab meski kunci hilang atau jaringan putus — permainan tidak pernah mati | ✅ `lib/zippyBrain.js` |
| 4 | **Tanpa kata "gagal" di layar** | Jawaban salah dijawab dengan petunjuk; anak yang merasa bodoh justru yang berhenti | ✅ terpasang |
| 5 | **Peta luar angkasa yang terus bergerak** | Latar hidup tanpa membebani perangkat — hanya `transform` & `opacity` | ✅ `SpaceBackdrop.jsx` |
| 6 | **14 ekspresi maskot yang dipra-muat saat perangkat menganggur** | Maskot tidak pernah tampil kosong, tanpa memperebutkan lebar pita di awal muat | ✅ `lib/preload.js` |
| 7 | **Bos SVG murni sebagai penutup pulau** | Tidak ada berkas gambar bos — digambar dengan kode | ✅ `components/Boss.jsx` |
| 8 | **Pembatas laju per IP** | Melindungi biaya API dari penggunaan berlebih | ✅ terbukti: 12 `200` lalu `429` |
| 9 | **Kebijakan "daftar kosong tidak menghapus"** | Kegagalan sinkronisasi tidak pernah menghapus kemajuan anak | ✅ `daftarRusak` |
| 10 | **Mode pengembang pada peta** | Menyunting pulau & misi langsung dari antarmuka, lalu "Terapkan Update" | ✅ |

---

## 4 · Catatan Responsivitas & Performa

### 4.1 · Sasaran yang diwajibkan

| Lebar | Sasaran | Status pengujian |
| --- | --- | --- |
| **320 px** | Rapi, tidak ada tumpah mendatar | ❌ **BELUM DIUJI** |
| **375 px** | Rapi, target sentuh terpakai nyaman | ❌ **BELUM DIUJI** |
| **768 px** | Rapi pada tablet | ❌ **BELUM DIUJI** |
| 1366 px | Nyaman | ⚠️ sebagian — lewat emulasi |
| 1920 px | Nyaman | ✅ teruji |
| HP fisik | Sentuh, gerak seret, lanskap | ❌ **BELUM DIUJI** |

> **Mengapa belum:** lingkungan pengembangan dokumen ini **tidak memiliki alat
> pembesar lebar layar** dan tidak bisa menyentuh perangkat fisik. Menandai
> poin ini sebagai selesai berarti mengarang. **Harus diuji di perangkat
> asli.**

### 4.2 · Langkah yang sudah dikerjakan untuk responsif

| Upaya | Bukti |
| --- | --- |
| Mobile-first, `min-w-0` pada wadah yang mengecil | `AGENTS.md` §4.6 |
| Target sentuh diperbaiki dari 20–36 px → minimal 40 px | komit `a90138b` |
| Huruf 9–11 px diperbesar agar terbaca anak | komit `9b503d8`, `391e812` |
| Navbar mobile yang terpotong diperbaiki | `fix` pada 12 Okt |
| `touch-action: none` pada area seret-jatuh, `manipulation` pada tombol | `app/globals.css` |
| Tanpa `maximumScale: 1` — zoom pengguna tidak dicabut | `app/layout.jsx` |

### 4.3 · Hasil Lighthouse

Diuji **15 Okt 2026** pada situs live, mode emulasi ponsel:

| Kategori | Skor | Catatan |
| --- | --- | --- |
| **Aksesibilitas** | **100** | ✅ |
| **Praktik Terbaik** | **100** | ✅ |
| **SEO** | **83** | Skor turun karena ikon situs ketika itu belum ada |
| **Performa** | **BELUM TEREKAM** | Tidak ada angka yang tercatat — jangan dikarang |

> Ikon situs **sudah diperbaiki** (`app/icon.svg`, komit `603b146`) dan kini
> berstatus **HTTP 200** di situs live, sehingga penyebab skor SEO 83 sudah
> hilang — **tetapi pengukuran ulang belum dilakukan**, jadi skor terbaru masih
> **BELUM JELAS**.

### 4.4 · Optimasi performa yang sudah dilakukan

Dikumpulkan dalam satu komit `a2935de`:

| # | Sebelum | Sesudah |
| --- | --- | --- |
| 1 | Font Google dimuat dari dua asal luar, menahan render awal | Dipindah ke `next/font`, disajikan dari asal sendiri |
| 2 | Suara soal berikutnya dimuat setelah anak menjawab | Diunduh **selagi anak masih menjawab** |
| 3 | 14 ekspresi maskot dimuat serentak | Dipra-muat saat perangkat menganggur (`requestIdleCallback`) |
| 4 | Dua PNG mati seberat 2,1 MB | Dihapus; berkas statis diberi masa simpan cache |
| 5 | 19 berkas PNG 15,9 MB | Diubah ke **WebP** |

### 4.5 · Hasil pemeriksaan langsung terhadap situs live

Diperiksa 15 Okt 2026 pukul 19.47–19.52 WIB:

| Pemeriksaan | Hasil |
| --- | --- |
| `/` | **HTTP 200**, 75.583 byte, judul benar, **tanpa `localhost`** |
| `/robots.txt` | **HTTP 200**, sitemap menunjuk domain benar |
| `/sitemap.xml` | **HTTP 200**, **9 `<loc>`**, tanpa `localhost` |
| `/icon.svg` | **HTTP 200**, 925 byte |
| `/api/zippy` | **HTTP 200** — `mode: "fallback"`, 468–943 ms |
| Pembatas laju | 12 permintaan pertama `200`, permintaan ke-13 dst. **`429`** |
| Isi tabel Supabase `planets`/`missions`/`profiles` | **0 baris** (diperiksa dengan `service_role`) |

### 4.6 · Belum terverifikasi — jangan ditandai selesai

| # | Hal | Mengapa belum bisa dilakukan dari sini |
| --- | --- | --- |
| 1 | Uji lebar 320 / 375 / 768 px | Tidak ada alat pembesar lebar layar |
| 2 | Sentuh & seret nyata di HP | Tidak ada perangkat fisik |
| 3 | Tampilan lanskap | Butuh perangkat fisik |
| 4 | Kinerja HP kelas menengah | Butuh perangkat fisik |
| 5 | Narasi suara Indonesia di peramban HP | Butuh perangkat fisik |
| 6 | Skor Performa Lighthouse | Tidak pernah tercatat |
| 7 | Skor SEO setelah ikon diperbaiki | Pengukuran ulang belum dilakukan |

---

*Disusun 15 Okt 2026. Seluruh angka berasal dari penghitungan berkas, `git log`,
pemeriksaan HTTP langsung, dan kueri REST Supabase. Bagian yang belum bisa
diverifikasi ditandai **BELUM DIUJI** / **BELUM TEREKAM** / **BELUM JELAS**,
bukan ditebak.*
