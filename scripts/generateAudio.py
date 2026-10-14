# ============================================================
# Buat berkas audio suara Zippy untuk semua soal
# ============================================================
#
# Jalankan:  py scripts/generateAudio.py
#
# Sumber suara: Microsoft Edge online TTS (gratis, tanpa kunci API),
# lewat paket edge-tts. Pilihan suaranya id-ID-GadisNeural karena terdengar
# muda, ramah, dan positif - paling cocok untuk maskot anak-anak.
#
# Keluaran: public/audio/<kunci>.mp3  dan sudah ada manifest.json
# (dibuat oleh scripts/kumpulTeks.mjs).
#
# Skrip ini idempoten: berkas yang sudah ada tidak dibuat ulang, jadi aman
# dijalankan berkali-kali atau dilanjutkan bila terputus.

import asyncio
import json
import sys
from pathlib import Path

import edge_tts

AKAR = Path(__file__).resolve().parent.parent
DAFTAR_TEKS = AKAR / "scripts" / ".teksSoal.json"
KELUARAN = AKAR / "public" / "audio"

# Suara maskot: muda, ramah, positif.
SUKARA = "id-ID-GadisNeural"
# Sedikit lebih pelan dan agak lebih tinggi nadanya supaya terdengar seperti
# teman kecil yang ceria, bukan pembaca berita.
LAJU = "-5%"
NADA = "+5Hz"

# Batas permintaan bersamaan. Terlalu banyak berisiko dibatasi layanannya.
PARALEL = 5


async def sintesis(teks: str, tujuan: Path, sem: asyncio.Semaphore) -> str:
    """Kembalikan 'ok', 'gagal', atau 'lewati'."""
    async with sem:
        for percobaan in range(3):
            try:
                com = edge_tts.Communicate(teks, SUKARA, rate=LAJU, pitch=NADA)
                await com.save(str(tujuan))
                if tujuan.exists() and tujuan.stat().st_size > 0:
                    return "ok"
            except Exception as exc:  # noqa: BLE001 - ingin mencoba ulang semua galat
                if percobaan == 2:
                    print(f"  GAGAL: {teks[:50]!r} -> {exc}")
                    return "gagal"
                await asyncio.sleep(1.2 * (percobaan + 1))
    return "gagal"


async def utama() -> int:
    if not DAFTAR_TEKS.exists():
        print("Belum ada scripts/.teksSoal.json. Jalankan dulu: node scripts/kumpulTeks.mjs")
        return 1

    entri = json.loads(DAFTAR_TEKS.read_text(encoding="utf-8"))
    KELUARAN.mkdir(parents=True, exist_ok=True)

    # Buang berkas yang sudah ada supaya proses bisa dilanjutkan.
    sisa = []
    for e in entri:
        tujuan = KELUARAN / f"{e['kunci']}.mp3"
        if tujuan.exists() and tujuan.stat().st_size > 0:
            continue
        sisa.append(e)

    print(f"Teks unik   : {len(entri)}")
    print(f"Sudah ada   : {len(entri) - len(sisa)}")
    print(f"Perlu dibuat: {len(sisa)}")
    print(f"Suara       : {SUKARA} (laju {LAJU}, nada {NADA})")
    if not sisa:
        print("Semua berkas audio sudah lengkap.")
        return 0

    sem = asyncio.Semaphore(PARALEL)
    tugas = [
        sintesis(e["teks"], KELUARAN / f"{e['kunci']}.mp3", sem) for e in sisa
    ]

    hasil = []
    selesai = 0
    for coro in asyncio.as_completed(tugas):
        hasil.append(await coro)
        selesai += 1
        if selesai % 10 == 0 or selesai == len(tugas):
            print(f"  {selesai}/{len(tugas)} selesai")

    ok = hasil.count("ok")
    gagal = hasil.count("gagal")
    ukuran = sum(f.stat().st_size for f in KELUARAN.glob("*.mp3"))
    print("-" * 46)
    print(f"Berhasil: {ok}   Gagal: {gagal}")
    print(f"Total ukuran audio: {ukuran / 1024 / 1024:.2f} MB")
    return 1 if gagal else 0


if __name__ == "__main__":
    sys.exit(asyncio.run(utama()))
