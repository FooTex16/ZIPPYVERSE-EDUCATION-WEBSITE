# docs — Dokumen Proyek ZippyVerse

Folder ini memuat seluruh dokumen **proses dan penilaian** proyek.
Dokumen penggunaan (panduan bermain, keterangan teknis) ada di [`README.md`](../README.md)
di akar repositori, dan dokumen acuan bagi agen AI ada di [`AGENTS.md`](../AGENTS.md).

Versi cetak (PDF) dari sebagian dokumen di bawah tersedia di
[`../DOKUMEN-ACUAN-AI/`](../DOKUMEN-ACUAN-AI/).

---

## Dokumen pengajuan

| Berkas | Isi | Ukuran |
| --- | --- | ---: |
| [`JURNAL-PROMPT-DAN-LOG-MENTAH.md`](JURNAL-PROMPT-DAN-LOG-MENTAH.md) | **Berkas utama untuk diunggah ke formulir.** Tiga bagian: jurnal 5 slot terkurasi, log mentah awal–akhir, dan pemetaan slot ke nomor prompt | 114.344 |
| [`ANALISIS-KESESUAIAN.md`](ANALISIS-KESESUAIAN.md) | Penilaian enam gerbang kelayakan, lengkap dengan bukti pengambilan langsung | 12.020 |
| [`LAPORAN-PAKET-SUBMIT.md`](LAPORAN-PAKET-SUBMIT.md) | Daftar isi paket beserta ukurannya dan daftar pekerjaan yang masih tersisa | 11.795 |

## Sumber jurnal

Kedua berkas ini adalah sumber yang disalin kata demi kata ke dalam
`JURNAL-PROMPT-DAN-LOG-MENTAH.md`. Isinya **identik byte demi byte** dengan
Bagian I dan Bagian II berkas utama — sudah diperiksa, bukan sekadar diklaim.

| Berkas | Isi | Ukuran |
| --- | --- | ---: |
| [`JURNAL-PROMPT.md`](JURNAL-PROMPT.md) | Jurnal prompt terkurasi — tepat 5 slot, seluruhnya teks asli, 0 placeholder | 17.793 |
| [`LOG-PROMPT-MENTAH.md`](LOG-PROMPT-MENTAH.md) | Log mentah awal–akhir — 77 prompt pengguna + 3 pesan subagen di Lampiran B | 92.719 |

> **Soal penomoran.** Acuannya adalah judul `## Prompt #N` di
> `LOG-PROMPT-MENTAH.md`: **#1–#77 untuk pesan manusia, #78–#80 untuk
> Lampiran B**. Nomor ini berbeda 3 dari urutan baris mentah sejak Prompt #35
> karena tiga baris subagen tidak dihitung dalam 77. Selalu kutip penomoran
> milik `LOG-PROMPT-MENTAH.md` sendiri.

## Pemeriksaan kualitas

| Berkas | Isi | Ukuran |
| --- | --- | ---: |
| [`CHECKLIST-FINAL.md`](CHECKLIST-FINAL.md) | Daftar kesiapan pengajuan — tiap butir diberi status dan catatan | 10.516 |
| [`CEK-3-KOMPONEN.md`](CEK-3-KOMPONEN.md) | Hasil pemeriksaan konsistensi antar dokumen, beserta tindakan yang masih perlu dilakukan | 9.115 |

## Lain-lain

| Berkas | Isi | Ukuran |
| --- | --- | ---: |
| [`PROMPT_METEOR_LEONARDO.md`](PROMPT_METEOR_LEONARDO.md) | Prompt Leonardo.Ai untuk ikon meteor pada layar loading. **Saat ini opsional** — layar loading memakai kepala meteor berbasis CSS, bukan PNG | 3.592 |

---

## Catatan

- **Angka ukuran** di atas dihitung langsung dari berkas saat dokumen ini
  ditulis. Angka itu berubah bila ada berkas yang disunting ulang.
- **Berkas yang sengaja TIDAK ada di repositori** ini: `AUDIT_REPORT.md`,
  `VERIFIKASI-DEPLOY.md`, `JURNAL-DEBUGGING.md`, `LAPORAN-BUG.md`,
  `CEK-AKHIR.md`, dan dokumen rekonstruksi. Alasan pengasingannya dijelaskan
  di `AGENTS.md` §5.4 — singkatnya, sebagian memuat temuan keamanan yang
  masih terbuka, dan menerbitkannya ke repositori publik berarti membagikan
  peta serangannya.
- **Tidak ada rahasia di folder ini.** Berkas `.env.local` berada di akar dan
  masuk `.gitignore`.
