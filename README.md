# ZippyVerse — Petualangan di Planet Luminara

Game edukasi web untuk anak sekolah dasar, dibintangi maskot **Zippy**.

> 🌐 **Live:** <https://zippyverse.vercel.app/>
> 📦 **Kode:** <https://github.com/FooTex16/ZIPPYVERSE-EDUCATION-WEBSITE>

---

## Tujuan

Anak SD jaman sekarang menghabiskan waktu menonton video yang menggulir tanpa
henti. Tontonan semacam itu menuntut nol usaha dari anak namun memberi nol
manfaat: tidak ada yang dipraktikkan, tidak ada yang diingat, dan tidak ada
selesai. Yang didapat anak hanyalah kebiasaan menunggu konten berikutnya.

ZippyVerse menjawabnya dengan menukar tontonan pasif itu menjadi **misi
singkat yang menuntut jawaban**. Anak tetap merasa sedang bermain — ada pulau,
bos, koin, dan kostum — namun setiap poin yang dikumpulkan berasal dari upaya
memecahkan soal.

Tiga keputusan desain yang lahir dari tujuan tersebut:

1. **Satu misi berdurasi sekitar 3 menit.** Lebih pendek daripada satu video,
   sehingga berhenti di tengah bukan kekalahan.
2. **Tidak ada kata "gagal" di layar.** Jawaban salah dijawab dengan petunjuk,
   bukan teguran. Anak yang merasa bodoh akan berhenti bermain.
3. **Anak yang belum lancar membaca tetap bisa bermain.** Seluruh soal dan
   petunjuk direkam dalam suara Indonesia, jadi keterbatasan membaca bukan
   penghalang belajar.

Target penggunanya dua sekaligus: **anak** sebagai pemain, dan **orang tua**
yang perlu tahu apa sebenarnya yang dikerjakan anaknya di layar.

---

## Menjalankan

```bash
npm install
npm run dev
```

Buka alamat yang muncul di terminal, biasanya **http://localhost:3000**.

Untuk versi produksi:

```bash
npm run build
npm start
```

Berkas `.env.local` diperlukan agar fitur AI dan sinkronisasi aktif, lihat
bagian [Konfigurasi](#konfigurasi). Tanpa berkas itu situs tetap berjalan,
hanya Zippy AI dan sinkronisasi cloud yang nonaktif.

---

## Stack

| Lapisan | Pilihan | Alasan |
| --- | --- | --- |
| Kerangka | Next.js 15 (App Router) | Rute dinamis, optimasi gambar, dan SEO bawaan tanpa konfigurasi tambahan |
| Gaya | Tailwind CSS | Utilitas kelas memungkinkan penyesuaian layar kecil tanpa berkas CSS tambahan yang membesar |
| Animasi | Framer Motion | Animasi masuk/keluar halus dengan `transform`, aman untuk perangkat kelas menengah |
| Basis data | Supabase | Autentikasi dan penyimpanan terkelola, tanpa menulis server sendiri |
| Kecerdasan buatan | Gemini API | Menjawab pertanyaan anak dengan bahasa yang ramah dan terbatas token |
| Penyimpanan utama | `localStorage` | Permainan tetap jalan meski sinyal hilang — krusial untuk anak dengan kuota terbatas |
| Narasi soal | Rekaman mp3 lokal | Logat Indonesia sama di semua perangkat, berbunyi tanpa internet |

---

## Struktur Folder

```
zippyverse/
├── app/
│   ├── page.jsx                  Halaman pengantar untuk pengunjung baru
│   ├── daftar/page.jsx           Pendaftaran & pemasukan akun Pendamping
│   ├── peta/page.jsx             Peta dunia dan pemilihan pulau
│   ├── pulau/[slug]/page.jsx     Pemilihan misi, permainan, hadiah
│   ├── dashboard/page.jsx        Dasbor perkembangan anak
│   ├── admin/page.jsx            Panel pengelolaan (terkunci PIN)
│   ├── api/zippy/route.js        Endpoint Zippy AI
│   ├── robots.txt.js → robots.js Perayap mesin pencari
│   ├── sitemap.js                Peta situs
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
│   └── missions/                 6 komponen tipe misi
├── lib/
│   ├── gameData.js               Pulau, misi, kostum, aturan buka pulau
│   ├── missionsExtra.js          Konten 4 pulau + Tantangan Harian
│   ├── trialIsland.js            Konten Pulau Perkenalan (pengunjung tamu)
│   ├── store.js                  Simpanan perangkat + sinkron Supabase
│   ├── profil.js                 Profil anak pada satu akun Pendamping
│   ├── supabase.js               Koneksi Supabase
│   ├── adminConfig.js            Pengaturan panel admin
│   ├── bacaTeks.js               Normalisasi teks untuk narasi suara
│   ├── petunjukHitung.js         Varian petunjuk agar tidak monoton
│   ├── speech.js                 Pemutar suara soal
│   ├── sfx.js                    Efek suara permainan
│   └── zippyBrain.js             Jawaban cadangan saat AI tidak tersedia
├── scripts/                      Skrip bantu (audio, optimasi aset, audit)
└── tests/                        184 pengujian otomatis
```

---

## Fitur

### Permainan

| Fitur | Keterangan |
| --- | --- |
| 6 pulau dapat dimainkan | Perkenalan, Angka, Kata, Sains, Kreatif, Bumi — ditambah 3 pulau masa depan pada peta |
| 18 misi / 143 butir soal | Matematika, Bahasa Indonesia, IPA, IPS, seni, dan logika |
| 6 tipe misi | Seret angka, tantangan kilat, boss battle, pilihan ganda, susun kata, urutkan langkah |
| Tantangan Harian | Lima soal campuran yang berubah tiap hari, sehingga tidak ada yang bisa dihafal |
| Rantai buka pulau | Pulau berikutnya terbuka setelah pulau sebelumnya selesai |
| Opsi jawaban diacak | Jawaban benar tidak pernah selalu di urutan pertama |
| Koin, XP, energi | Energi berkurang tiap misi dan pulih sendiri, agar ritme bermain anak terjaga |
| Toko kostum | Delapan kostum, sebagian memberi keistimewaan nyata |

### Pendampingan

| Fitur | Keterangan |
| --- | --- |
| Zippy AI | Mengingat enam pesan terakhir sehingga jawabannya nyambung, dengan cadangan luring |
| Dasbor perkembangan | Ketepatan jawaban, waktu bermain, rangkaian hari, dan saran mendampingi |
| Pengingat lembut | Bila anak berhenti terlalu lama di satu layar, Zippy menawarkan bantuan |
| Suara membacakan soal | 211 rekaman mp3 berbahasa Indonesia (5,76 MB), berbunyi tanpa internet |
| Cadangan otomatis | Bila rekaman suatu teks belum ada, otomatis jatuh ke suara bawaan perangkat |

### Keamanan & Privasi

| Fitur | Keterangan |
| --- | --- |
| Tanpa iklan | Tidak ada iklan, tautan keluar, maupun ruang obrolan dengan orang asing |
| Data minimal | Hanya nama panggilan. Tidak ada tanggal lahir, nomor telepon, foto, maupun lokasi |
| Akses baca-saja | Halaman perkembangan hanya menampilkan data, tidak mengubahnya |

---

## Akun dan Peran

ZippyVerse mengenal tiga cara masuk, dengan hak yang berbeda-beda.

### 1. Pengunjung tamu

Tidak perlu mendaftar sama sekali. Anak langsung mengetik nama panggilan dan
bermain **Pulau Perkenalan** — satu pulau berisi 3 misi dengan soal yang tidak
duplikat dengan pulau mana pun, sehingga anak bisa merasakan permainannya
sebelum memutuskan untuk mendaftar.

Kemajuannya tersimpan di perangkat itu saja. Bila anak ingin membuka lima pulau
lainnya dan menyimpan kemajuannya, ia diarahkan untuk mendaftar.

### 2. Akun Pendamping

Satu akun keluarga yang mewadahi banyak profil anak. Orang tua mendaftarkan diri
lewat `email` dan `kata sandi`, lalu menambahkan profil anak sebanyak yang
diperlukan.

Sesi tetap tersimpan, jadi pemasukan hanya sekali. Setelah itu, ketika anak
membuka ZippyVerse di perangkat keluarga, ia cukup **memetik namanya sendiri
dari daftar** — tanpa mengetik ulang, tanpa mengingat kata sandi.

Tiap profil anak memiliki kemajuan **sendiri-sendiri**: koin, energi, dan
kemajuan pulau tidak pernah tercampur antar saudara.

### 3. Pengelola

Masuk lewat halaman `/admin` dengan PIN yang dibuat sendiri di perangkat itu.
Dipakai untuk mengatur isi situs, bukan untuk bermain.

---

## Aturan Kerja

Aturan ini berlaku bagi siapa pun — manusia maupun agen AI — yang akan mengubah
kode di repositori ini. Sebagian besar lahir dari kesalahan yang memang pernah
terjadi, bukan dari teori.

### Sebelum menyentuh kode

1. **Baca dulu, ubah kemudian.** Temukan pola yang sudah dipakai di berkas
   sejenis dan ikuti pola itu. Menambah gaya penulisan baru hanya membuat kode
   sulit dirawat.
2. **Perubahan harus kecil dan dapat dibedakan.** Satu tujuan per perubahan.
   Bila sebuah perubahan gagal, ia harus mudah dibatalkan tanpa menghapus
   pekerjaan lain.

### Batasan yang tidak boleh dilanggar

3. **Palet warna tetap.** Teal `#2AA5A0`, Mint `#B2D8D5`, Kuning `#FFC93C`,
   Krem `#FFF6E5`, Navy `#0F2C3D`. Inilah identitas visual ZippyVerse.
4. **Layar kecil dulu.** Setiap tampilan harus rapi pada lebar 320, 375, dan
   768 piksel, lalu tetap nyaman pada 1366 dan 1920. Gunakan `min-w-0` pada
   elemen di dalam wadah yang bisa mengecil.
5. **Animasi hanya `transform` dan `opacity`.** Properti seperti `top`, `left`,
   `width`, dan `height` memicu perhitungan ulang tata letak dan membuat gerakan
   patah di perangkat murah.
6. **Hormati `prefers-reduced-motion`.** Anak yang sensitif cahaya atau gerak
   berhak mematikan animasi, dan situs harus tetap terbaca ketika itu terjadi.
7. **Gambar memakai WebP** dan `<img>` selalu diberi `object-contain` bila
   kotaknya tidak persis sama rasio berkasnya. Tanpa itu, maskot Zippy terlihat
   melar.
8. **Rahasia tidak pernah masuk berkas.** Kunci API hanya di `.env.local` dan
   variabel server. Jangan pernah mencetaknya ke halaman, log, atau laporan.

### Sebelum menyatakan selesai

9. **Tiga perintah ini harus lulus**, tanpa kecuali:

   ```bash
   npm test        # 184 pengujian (33 rangkaian)
   npm run lint
   npm run build
   ```

10. **Periksa secara nyata di peramban**, jangan hanya percaya hasil build.
    Halaman yang sukses dibangun tetap bisa tampil kosong atau meluber.
11. **Jika menambah atau mengubah soal**, jalankan `npm run audio` agar rekaman
    suaranya ikut dibuat. Tanpa itu soal baru hanya dibacakan oleh suara
    bawaan perangkat, yang di sebagian HP tidak tersedia dalam Bahasa Indonesia.
12. **Jangan mengubah nilai bawaan yang dipakai pengujian.** `lib/costumePerks.js`
    harus tetap mengekspor objek kosong, dan nilai bawaan stamina di
    `lib/store.js` harus tetap persis seperti sekarang.

### Saat melaporkan

13. **Bedakan yang sudah dipastikan dari yang masih dugaan.** Hasil pengamatan
    langsung ditulis berbeda dari perkiraan tanpa bukti.
14. **Jangan memperbaiki sesuatu yang belum diminta izinnya.** Laporkan temuan
    lebih dulu.

---

## Konfigurasi

Seluruh rahasia berada di `.env.local` dan tidak boleh ikut ter-commit:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
GEMINI_API_KEY=...
NEXT_PUBLIC_SITE_URL=https://alamat-situs-anda
```

`NEXT_PUBLIC_SITE_URL` dipakai untuk tautan absolut pada OpenGraph dan sitemap.
Atur nilainya setelah situs di-host, misalnya
`https://zippyverse.vercel.app`. Bila tidak diatur, tautan akan memakai
`http://localhost:3000`.

### Zippy AI

Model yang dipakai `gemini-3.5-flash-lite`, lalu `gemini-3.5-flash` sebagai
cadangan. Enam pesan terakhir dikirim sebagai konteks sehingga jawaban saling
nyambung, dan `maxOutputTokens: 220` menjaga biaya serta kecepatan.

Bila Gemini gagal atau tidak ada internet, `lib/zippyBrain.js` mengambil alih
sehingga demo tetap berjalan. Pemutus sirkuit 5 menit mencegah chat ikut
melambat ketika layanan sedang bermasalah.

### Supabase

Tabel yang dipakai: `players` dan `progress`.

### Narasi suara

Seluruh soal dan petunjuk terekam sebagai mp3 di `public/audio/`, memakai suara
Indonesia `id-ID-GadisNeural` lewat Edge TTS — gratis dan tanpa kunci API.
Total **211 berkas, 5,76 MB**.

Keunggulan dibanding suara bawaan perangkat:

- Logat Indonesia sama di HP apa pun.
- Berbunyi sepenuhnya luring, aman untuk kuota terbatas.
- Tidak tergantung pada apakah perangkat sudah mengunduh suara Indonesia.

Untuk menghasilkan ulang:

```bash
npm run audio
```

Perintah itu dua tahap: `scripts/kumpulTeks.mjs` mengumpulkan seluruh teks dari
sumber data lalu menulis `lib/audioManifest.json`, dan `scripts/generateAudio.py`
mengubah tiap teks menjadi mp3. Skripnya idempoten, jadi berkas yang sudah ada
tidak dibuat ulang — aman dijalankan berulang atau dilanjutkan bila terputus.

---

## Catatan Teknis

### Performa

- **Aset gambar dalam WebP.** Semula 19 berkas PNG seberat 15,9 MB, kini
  0,44 MB (turun 97%). Jalankan ulang dengan
  `node scripts/optimize-assets.mjs`.
- **Latar luar angkasa** terdiri dari lima lapisan — nebula, bintang tiga
  kedalaman, bintang jatuh, debu naik, dan planet bercincin — namun hanya
  memakai 79 elemen.
- Seluruh animasi memakai `transform` dan `opacity` sehingga dihitung oleh GPU.
- Filter `blur` yang mahal diganti `radial-gradient`, dan `backdrop-blur`
  dimatikan otomatis di layar sempit.
- Di bawah 768px, lapisan ekstra disembunyikan lewat `.layer-extra` agar beban
  GPU tetap rendah di HP.

### Penyimpanan

`localStorage` menjadi sumber utama supaya permainan tidak bergantung sinyal.
Supabase dipakai untuk sinkronisasi dan dasbor.

Pemindahan antar profil anak dilakukan dengan menukar **seluruh blok simpanan**
(lihat `lib/profil.js`), bukan menyusun ulang struktur data. Dengan cara ini
`lib/store.js` — yang sudah lulus seluruh pengujian — tidak perlu diubah sama
sekali ketika sistem profil anak ditambahkan.

### Interaksi

- **Seret dan jatuh** memakai Pointer Events sehingga berfungsi di mouse
  maupun layar sentuh. Anak juga bisa mengetuk angka lalu mengetuk kotaknya.
- **Audio dinyalakan setelah interaksi pertama** karena kebijakan autoplay
  peramban.

---

## Alur Mencoba

1. **Halaman pengantar** — baca dulu apa itu ZippyVerse, baru tekan
   *Mulai Bermain*.
2. **Pulau Perkenalan** — tiga misi yang memperkenalkan seluruh tipe permainan
   tanpa perlu mendaftar.
3. **Mendaftar** — begitu anak ingin membuka lima pulau lainnya, ia diarahkan
   ke pendaftaran. Kemajuan yang sudah ada ikut terbawa.
4. **Peta** — lima pulau tujuan, Tantangan Harian, dan toko kostum.
5. **Pulau Angka** — mulai dari misi seret angka, lanjut ke tantangan kilat,
   lalu boss battle.
6. **Pulau Kata / Sains / Kreatif / Bumi** — menunjukkan variasi tipe misi:
   pilihan ganda berpetunjuk, susun kata, dan urutkan langkah percobaan.
7. **Suara Zippy** — dengarkan soal dibacakan, lalu matikan lewat tombol suara
   di HUD bila diinginkan.
8. **Chat Zippy** — tanyakan sesuatu, lalu lanjutkan dengan "itu lagi" untuk
   membuktikan AI-nya mengingat percakapan.
9. **Dasbor perkembangan** — lihat rangkuman waktu bermain dan ketepatan jawaban.

---

Maskot Zippy adalah karya orisinal yang dibuat khusus untuk proyek ini.
