"use client";

import { useEffect, useRef, useState } from "react";
import { AudioLines, Check, TriangleAlert } from "lucide-react";
import {
  isSpeechEnabled,
  setSpeechEnabled,
  getVoiceName,
  setVoiceName,
  speak,
  stopSpeaking,
  useDaftarSuara,
  jenisPerangkat,
} from "@/lib/speech";
import { cakupanAudio } from "@/lib/audioSoal";

function bahasaDasar(v) {
  return String(v?.lang || "")
    .toLowerCase()
    .replace("_", "-")
    .split("-")[0];
}

// Langkah memasang suara Indonesia berbeda tiap perangkat. Teksnya dibuat
// khusus karena mayoritas penggunanya anak yang meminjam hp orang tuanya.
// Catatan: panah memakai karakter "→" langsung, bukan &rarr;, karena entri
// HTML tidak ditafsirkan di dalam string JavaScript.
const PETUNJUK_SUARA = {
  android: {
    judul: "Pengaturan HP",
    langkah:
      "Bahasa & input → Teks-ke-suara → Unduh suara bahasa Indonesia, lalu muat ulang halaman ini.",
  },
  ios: {
    judul: "Pengaturan iPhone / iPad",
    langkah:
      "Aksesibilitas → Isi Teks yang Dibicarakan → Suara → cari Indonesia → Unduh, lalu muat ulang halaman ini.",
  },
  desktop: {
    judul: "Pengaturan browser",
    langkah:
      "Bahasa → tambahkan Bahasa Indonesia, lalu muat ulang halaman ini. Chrome menyediakan suara Google Bahasa Indonesia.",
  },
};

/**
 * Menu suara baca soal.
 *
 * Selain tombol hidup/mati, menu ini memuat daftar suara perangkat dan
 * mengutamakan yang berbahasa Indonesia. Ini penting karena logat Zippy
 * ditentukan oleh suara yang dipakai: kalau perangkat hanya menyediakan
 * suara Inggris, soal Indonesia akan terdengar berlogat Inggris.
 */
export default function SpeechMenu() {
  const [buka, setBuka] = useState(false);
  const [aktif, setAktif] = useState(true);
  const [terpilih, setTerpilih] = useState("");
  const wrapRef = useRef(null);
  const suara = useDaftarSuara();

  useEffect(() => {
    setAktif(isSpeechEnabled());
    setTerpilih(getVoiceName());
  }, []);

  // Tutup menu saat mengklik di luar.
  useEffect(() => {
    if (!buka) return;
    const diLuar = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setBuka(false);
    };
    document.addEventListener("mousedown", diLuar);
    document.addEventListener("touchstart", diLuar);
    return () => {
      document.removeEventListener("mousedown", diLuar);
      document.removeEventListener("touchstart", diLuar);
    };
  }, [buka]);

  const toggle = () => {
    const v = !aktif;
    setAktif(v);
    setSpeechEnabled(v);
    if (v) speak("Halo! Aku Zippy. Aku akan membacakan soalmu.", { paksa: true });
    else stopSpeaking();
  };

  const pilih = (nama) => {
    setVoiceName(nama);
    setTerpilih(nama);
    // Dengarkan langsung contohnya supaya logatnya bisa diperiksa.
    speak("Halo! Aku Zippy. Aku akan membacakan soalmu.", { paksa: true });
  };

  const adaIndo = suara.some((v) => bahasaDasar(v) === "id");
  const aktifKini = suara.find((v) => v.name === terpilih);
  const petunjuk = PETUNJUK_SUARA[jenisPerangkat()] || PETUNJUK_SUARA.desktop;
  const cakupan = cakupanAudio();

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setBuka((b) => !b)}
        aria-label={aktif ? "Pengaturan suara baca soal aktif" : "Pengaturan suara baca soal mati"}
        title="Suara baca soal"
        className={`grid h-8 w-8 place-items-center rounded-full transition active:scale-90 sm:h-9 sm:w-9 ${
          aktif ? "bg-zippy-yellow/50 text-zippy-navy" : "bg-zippy-navy/10 text-zippy-navy/45"
        }`}
      >
        <AudioLines className="h-5 w-5" strokeWidth={2.6} />
      </button>

      {buka && (
        <div className="absolute right-0 z-50 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-3xl bg-cream p-4 text-zippy-navy shadow-pop">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-sm font-black">Baca soal</span>
            <button
              onClick={toggle}
              role="switch"
              aria-checked={aktif}
              aria-label="Hidupkan atau matikan suara baca soal"
              className={`relative h-7 w-12 rounded-full transition ${
                aktif ? "bg-zippy-teal" : "bg-zippy-navy/20"
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                  aktif ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>

          {cakupan > 0 ? (
            <p className="mb-3 rounded-2xl bg-zippy-teal/15 p-2.5 text-[11px] font-bold leading-snug text-zippy-navy/80">
              Semua soal sudah terekam dengan suara Zippy berbahasa Indonesia, jadi logatnya tetap
              benar di HP apa pun dan tetap berbunyi walaupun tanpa internet.
            </p>
          ) : (
            !adaIndo &&
            suara.length > 0 && (
              <p className="mb-3 rounded-2xl bg-zippy-yellow/35 p-2.5 text-[11px] font-bold leading-snug">
                <span className="mb-1 flex items-start gap-1.5">
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.6} />
                  <span>
                    Belum ada suara Indonesia di perangkat ini, jadi soal masih dibacakan berlogat
                    asing.
                  </span>
                </span>
                <span className="block pl-6 text-zippy-navy/75">
                  Caranya: buka <b>{petunjuk.judul}</b>, lalu ikuti {petunjuk.langkah}
                </span>
              </p>
            )
          )}

          <p className="mb-1 text-[11px] font-black uppercase tracking-wider text-zippy-navy/50">
            {cakupan > 0 ? "Suara cadangan perangkat" : "Pilih suara Zippy"}
          </p>

          <div className="max-h-60 space-y-1 overflow-y-auto pr-1">
            {suara.length === 0 && (
              <p className="py-3 text-center text-xs font-bold text-zippy-navy/50">
                Memuat daftar suara...
              </p>
            )}
            {suara.map((v) => {
              const indo = bahasaDasar(v) === "id";
              const dipilih = v.name === terpilih;
              return (
                <button
                  key={v.name}
                  onClick={() => pilih(v.name)}
                  className={`flex w-full items-center justify-between gap-2 rounded-2xl px-3 py-2 text-left text-xs font-bold transition ${
                    dipilih ? "bg-zippy-teal text-white" : "bg-zippy-navy/5 hover:bg-zippy-navy/10"
                  }`}
                >
                  <span className="min-w-0 truncate">{v.name}</span>
                  <span className="flex shrink-0 items-center gap-1">
                    {indo && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                          dipilih ? "bg-white/25 text-white" : "bg-zippy-yellow text-zippy-navy"
                        }`}
                      >
                        Indonesia
                      </span>
                    )}
                    {dipilih && <Check className="h-4 w-4" strokeWidth={3} />}
                  </span>
                </button>
              );
            })}
          </div>

          {aktifKini && (
            <p className="mt-2 truncate text-[11px] font-bold text-zippy-navy/55">
              Dipakai: {aktifKini.lang || "tanpa kode bahasa"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
