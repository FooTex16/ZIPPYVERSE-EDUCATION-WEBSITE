# 02 · RINGKASAN PRD — ZippyVerse

Dokumen ringkas kebutuhan produk. Seluruh isi bersumber dari kode yang benar-
benar ada dan dari log prompt asli — tidak ada fitur yang dikarang.

| | |
| --- | --- |
| Nama produk | **ZippyVerse — Petualangan di Planet Luminara** |
| Tema | Innovating Education Through Technology |
| Subtema | Web Education for Kids (untuk anak SD) |
| Versi | 1.0.0 (`package.json`) |
| Status | Ter-deploy dan berjalan |

---

## 1 · Latar Belakang & Masalah

### 1.1 · Masalah utama

Anak SD jaman sekarang menghabiskan waktu menonton video yang menggulir tanpa
henti. Tontonan semacam itu menuntut **nol usaha** dari anak namun memberi
**nol manfaat**:

| | Tontonan passif | Yang dibutuhkan |
| --- | --- | --- |
| Usaha | nol | ada — harus memilih jawaban |
| Pengingat | tidak ada rasa selesai | ada ronde, skor, hadiah |
| Hasil | tidak ada yang dipraktikkan | soal terpecahkan, koin terkumpul |
| Kebiasaan | menunggu konten berikutnya | kembali karena energi pulih dan misi baru |

### 1.2 · Mengapa sulit

Prompt yang memulai proyek menyebutnya terang-terangan: mencari *"hal apa yang
bikin anak anak tertarik untuk mencoba website ini dan merubah kebiasaan mereka
dari yang kecanduan sosmed menjadi sering bermain ini sambil belajar"*.
Masalahnya bukan bahan ajar — melainkan **alasan untuk kembali**.

### 1.3 · Batasan nyata yang harus dihormati

1. **Anak SD bukan pengguna sabar.** Mereka akan menutup halaman yang terasa
   seperti pekerjaan rumah.
2. **Belum lancar membaca.** Soal tertulis saja tidak cukup.
3. **Sinyal tidak selalu ada.** Permainan tidak boleh mati saat jaringan hilang.
4. **Perangkat sekolah menengah ke bawah.** Animasi berat membuat gerakan patah.

---

## 2 · Solusi

**ZippyVerse menukar tontonan pasif menjadi misi singkat yang menuntut
jawaban.** Anak tetap merasa sedang bermain — ada pulau, bos, koin, dan kostum
— namun setiap poin berasal dari upaya memecahkan soal.

### Tiga keputusan desain inti

| # | Keputusan | Alasan |
| --- | --- | --- |
| 1 | **Satu misi ±3 menit** | Lebih pendek daripada satu video, sehingga berhenti di tengah bukan kekalahan |
| 2 | **Tidak ada kata "gagal" di layar** | Jawaban salah dijawab dengan petunjuk, bukan teguran — anak yang merasa bodoh akan berhenti bermain |
| 3 | **Seluruh soal direkam suara Indonesia** | Anak yang belum lancar membaca tetap bisa bermain |

### Empat pilar teknologi yang mewujudkan tema

| Pilar | Wujud di produk |
| --- | --- |
| **Inovating** | Satu misi 3 menit, tanpa kata "gagal", energi yang pulih perlahan, peti hadiah tiap 3 pulau |
| **Education** | 19 misi / 143 butir soal menutup matematika, bahasa Indonesia, IPA, IPS, seni, dan logika |
| **Through** | Jembatan berupa suara, animasi `transform`, dan umpan balik seketika |
| **Technology** | AI Gemini untuk pertanyaan bebas, narasi suara TTS, sinkronisasi awan, dasbor orang tua |

---

## 3 · Target Pengguna

| Peran | Siapa | Kebutuhan utama |
| --- | --- | --- |
| **Pemain** | Anak SD, 6–12 tahun | Bermain tanpa merasa sedang diajar; tidak perlu lancar membaca |
| **Akun Pendamping** | Orang tua / wali | Satu akun untuk banyak anak; tahu apa yang dikerjakan anaknya di layar |
| **Pengelola** | Guru / pengelola konten | Menyunting pulau, misi, nilai, dan data akun lewat `/admin` |
| **Tamu** | Pengunjung tanpa akun | Bisa mencoba **Pulau Perkenalan** tanpa mendaftar |

### Perilaku pengguna yang dirancang

- **Anak:** masuk → peta → pilih pulau → pilih misi → main → dapat koin/XP →
  belanja kostum → energi habis → menunggu sambil tetap bisa membuka yang lain.
- **Orang tua:** masuk → lihat daftar anak → buka dasbor perkembangan
  (**baca-saja**, tidak bisa mengubah nilai dari sana).

---

## 4 · Daftar Fitur

### 4.1 · Fitur utama

| # | Fitur | Bukti di kode |
| --- | --- | --- |
| 1 | **9 pulau di satu peta** — 6 dapat dimainkan, 3 masih "segera hadir" | `lib/gameData.js` baris 61–216 |
| 2 | **19 misi / 143 butir soal** | `lib/gameData.js`, `lib/missionsExtra.js`, `lib/trialIsland.js` |
| 3 | **6 tipe misi berbeda** | `dragcount` · `blitz` · `boss` · `mcq` · `scramble` · `order` |
| 4 | **Bos sebagai penutup pulau** | `components/Boss.jsx`, `MissionBoss.jsx` |
| 5 | **Energi & pemulihan** — maks 20, biaya 2 per misi, pulih 8 menit | `lib/store.js` baris 23–26 |
| 6 | **Koin, XP, level, peti hadiah** | `lib/store.js` |
| 7 | **8 kostum yang bisa dibuka** | `lib/gameData.js` baris 391–399 |
| 8 | **Tantangan Harian** — 38 soal, 5 dipakai per hari, diacak dengan benih tanggal | `lib/missionsExtra.js` `SOAL_HARIAN` |
| 9 | **Percakapan dengan Zippy (AI)** | `app/api/zippy/route.js` |
| 10 | **Suara Indonesia untuk seluruh soal & petunjuk** | `lib/speech.js`, 211 mp3 di `public/audio/` |
| 11 | **Banyak profil anak pada satu akun Pendamping** | `lib/profil.js`, `app/api/anak/route.js` |
| 12 | **Dasbor perkembangan baca-saja** | `app/dashboard/page.jsx` |

### 4.2 · Fitur tambahan

| Fitur | Keterangan |
| --- | --- |
| Pulau Perkenalan untuk tamu | Bisa dicoba tanpa mendaftar; kemajuan di `localStorage` |
| Login harian | `DAILY_REWARDS = [50, 75, 100, 125, 150, 200, 300]` |
| Pengingat lembut | `components/PengingatDiam.jsx` — anak diam 10 detik diingatkan tanpa ditegur |
| Toko kostum | `components/ShopModal.jsx` |
| Panel pengelola bertingkat PIN | `/admin`, peran diverifikasi di **server** |
| Mode pengembang pada peta | Sunting pulau & misi lalu "Terapkan Update" |
| Kanal umpan balik | `/api/masukan`, maksimal **5 pesan per hari** per perangkat |
| Latar luar angkasa bergerak | `components/SpaceBackdrop.jsx`, animasi hanya `transform`/`opacity` |
| Hormati preferensi gerak | `prefers-reduced-motion` ditangani di `app/globals.css` |
| Sinkronisasi awan tanpa risiko kehilangan | Daftar kosong **tidak pernah** menimpa data perangkat |

---

## 5 · Alur Pengguna Utama

### 5.1 · Alur anak (tanpa akun — tamu)

```
Halaman pengantar  →  Peta dunia  →  Pulau Perkenalan  →  Pilih misi
        ↓                                                       ↓
   mendaftar jadi                                        main (±3 menit)
   Akun Pendamping                                             ↓
                                                    skor → koin/XP → hadiah
                                                               ↓
                                              energi berkurang 2 → lanjut/balik
```

**Titik putus yang dirancang berhenti:** bila energi habis, anak **bukan**
dihadapkan pada layar kegagalan — melainkan ditawari hal lain yang tetap bisa
dibuka (toko, profil, tantangan harian) sembari menunggu energi pulih.

### 5.2 · Alur orang tua

```
/daftar  →  buat Akun Pendamping  →  tambah profil anak
                                            ↓
              /dashboard  ←────────  pilih anak
         (lihat perkembangan — baca-saja)
```

### 5.3 · Alur pengelola

```
/admin  →  gerbang PIN  →  peran diperiksa di server (app_metadata.role)
                                   ↓
              sunting pulau / misi / nilai / data akun
```

---

## 6 · Catatan Ide Awal dari AI

Proyek ini lahir dari permintaan ide kepada AI, bukan dari PRD buatan sendiri.
Dua prompt pembuka menentukan seluruh arah (disalin apa adanya dari log):

**Prompt #8 — 11 Okt 2026, 13:48:09 WIB (permintaan ide)**

> saya ingin membuat sebuah website untuk lomba berbasis vibe coding dengan tema
> "Innovating Education Through Technology" dengan subtema "WEB EDUCATION FOR
> KIDS (untuk anak SD)". coba kamu buatkan ide ide website yang bagus untuk di
> zaman sekarang dan ditargetkan untuk anak sd di era modern ini. permasalahannya
> anak anak sekarang rata rata banyak yang lebih dominan menonton video di sosmed
> ketimbang di pakai untuk belajar gadget tersebut jadi hal apa yang bikin anak
> anak tertarik untuk mencoba website ini dan merubah kebiasaan mereka dari yang
> kecanduan sosmed menjadi sering bermain ini sambil belajar dan menambah
> wawasan mereka. mungkin ini cukup sulit untuk di bikin tapi percayalah pasti
> ada solusinya. dengan maskot yang berna Zippy

**Prompt #9 — 11 Okt 2026, 13:55:18 WIB (pemilihan ide, 7 menit kemudian)**

> ide 1 ZIPPYVERSE - Petualangan di Planet Luminara juga bagus coba buatkan
> tantangan dalam pembuatan website ini dan apa saja yang di perlukan

### Yang dicatat dan yang TIDAK dikarang

| Hal | Keterangan |
| --- | --- |
| Ide berasal dari AI | ✅ tercatat — prompt #8 meminta ide, #9 memilih |
| **Alasan memilih ide 1** | **Hanya kata "juga bagus"** — tidak ada alasan lebih rinci yang tertulis, jadi tidak ditambahkan |
| Yang diminta setelah ide jatuh | **Tantangan pembuatan + daftar kebutuhan** — artinya sebelum kode ditulis yang diminta adalah pemetaan risiko, **bukan** file PRD |
| PRD | Diminta pada Prompt #6 (6 Okt) tetapi **tidak pernah menjadi berkas** |
| Dokumen acuan | Ditulis **belakangan** dari isi kode yang sudah jadi → `AGENTS.md` |

> **Alur yang jujur:** ide diminta ke AI → AI mengusulkan → manusia memilih satu
> → AI langsung membangun → acuan disusun belakangan dari kode yang sudah jadi.

---

*Disusun 15 Okt 2026. Seluruh angka dan nama fitur dapat diverifikasi dengan
membuka berkas yang disebut pada kolom "Bukti di kode".*
