# Prompt Leonardo.Ai — Ikon Meteor untuk Layar Loading

Prompt ini dipakai untuk membuat **icon meteor** (kepala + ekor) yang nanti
dipasang sebagai gambar pada animasi loading ZippyVerse.

> Catatan: animasinya sudah selesai dibuat (CSS murni di
> `components/LoadingMeteors.jsx` + `@keyframes meteorFall` di
> `app/globals.css`). Ikon di bawah ini opsional — saat ini layar loading sudah
> memakai kepala meteor CSS yang digambar otomatis. Ganti ke PNG hanya bila
> ingin hasilnya lebih "cartoon / game-like".

---

## 1. Prompt utama (utamakan ini)

```
Cute cartoon comet meteor icon for a kids educational space game, single
meteor flying diagonally down to the left, round glowing cream-white head with
a warm golden-yellow trailing tail that fades into the transparent background,
small sparkles and tiny stars around the tail, thick clean navy outline,
friendly playful sticker style, glossy vector illustration, flat shading with
soft highlights, vibrant palette of teal #2AA5A0, mint #B2D8D5, yellow #FFC93C,
cream #FFF6E5 and deep navy #0F2C3D, centered, isolated on transparent
background, game UI asset, no text, no watermark
```

## 2. Prompt alternatif (gaya lebih "blobby / mascot")

```
Chibi comet mascot icon, smiling golden comet with a fluffy gradient tail,
pixel-perfect 2D game power-up item, rounded shapes, bold navy outline,
sticker style, bright yellow #FFC93C core with cream #FFF6E5 rim light and
teal #2AA5A0 sparkles, isolated on transparent background, no text, no
watermark, high contrast, mobile game icon
```

## 3. Negative prompt

```
realistic photo, 3d render, blurry, noisy, dark background, text, letters,
logo, watermark, signature, human, face, planet, earth, multiple objects,
low quality, jpeg artifacts, cropped, frame, border
```

---

## Pengaturan yang disarankan di Leonardo.Ai

| Setelan | Nilai |
| --- | --- |
| Model | Leonardo Phoenix / DreamShaper v7 |
| Style | Game Art / Illustration |
| Aspect Ratio | **1:1** (ikon) atau **16:9** bila dipakai sebagai latar |
| Alchemy | ON |
| Transparency Background | **ON** (wajib, supaya PNG-nya punya alpha) |
| Prompt Magic / Elements | ON (kuatkan gaya ikon) |
| Guidance Scale | 7 – 9 |
| Number of images | 4 (pilih yang ekornya paling lurus) |
| Resolution | 1024 × 1024 |

**Petunjuk arah:** meteor harus meluncur dari **kanan-atas ke kiri-bawah**,
dengan ekor mengarah ke **kanan-atas** (ekor = jejak yang tertinggal). Kepala
berada di ujung **kiri-bawah**. Ini persis mengikuti arah animasi
`meteorFall` yang sudah dibuat.

---

## Spesifikasi aset

- Format: **PNG** dengan latar transparan, lalu dikonversi ke **WebP**
  (pakai `sharp`, sudah jadi kebiasaan di proyek ini).
- Ukuran render: **512 × 512 px** (ekor muat penuh, tetap ringan < 20 KB).
- Penamaan file:
  - `public/loading/meteor-1.webp` (variasi besar)
  - `public/loading/meteor-2.webp` (variasi sedang)
  - `public/loading/meteor-3.webp` (variasi kecil)
- Area kosong: beri sedikit padding transparan (± 5%) supaya box-shadow
  cahaya kepala tidak terpotong.

## Cara memasangnya

1. Letakkan tiga file WebP di `public/loading/`.
2. Di `components/LoadingMeteors.jsx`, ganti elemen `<i />` (ekor CSS) dengan:

   ```jsx
   <img src="/loading/meteor-1.webp" alt="" className="w-full" />
   ```

   dan tambahkan `src` ke masing-masing entri di array `METEORS`.
3. Elemen `::after` di `.meteor` (kepala bercahaya) bisa dihapus bila kepala
   sudah ikut tergambar di gambar.
4. Uji ulang di `public/__uji.html` — pastikan tidak ada elemen yang keluar
   layar (scrollWidth − innerWidth harus tetap ≤ 0).
