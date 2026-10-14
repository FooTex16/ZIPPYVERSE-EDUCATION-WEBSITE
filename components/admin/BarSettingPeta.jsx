"use client";

/**
 * Bar Setting Peta — bilah ruang kerja pengelola di atas peta.
 *
 * Hanya dirender ketika sesi berperan pengelola, jadi pemain biasa dan tamu
 * tidak pernah melihatnya (pengecekannya ada di app/peta/page.jsx, bukan di
 * sini).
 *
 * PERAN DUA TOMBOL
 *
 *   Kelola Pulau    mengubah NASKAH: menambah, mengubah, menghapus pulau dan
 *                   misinya. Naskah hanya hidup di perangkat ini dan BELUM
 *                   berpengaruh apa pun bagi pemain.
 *
 *   Terapkan Update mengirim naskah itu ke awan. Baru setelah tombol ini
 *                   ditekan isi barunya terbaca oleh seluruh akun anak - itulah
 *                   sebabnya tombolnya terpisah dan tidak pernah berjalan
 *                   sendiri.
 *
 * PEMISAHAN ITU SENGAJA
 *
 * Bila suntingan langsung berlaku, satu ketikan yang salah akan langsung
 * mengubah permainan bagi semua anak sekaligus, dan developer tidak sempat
 * memeriksanya. Dengan naskah terpisah, tombol Terapkan adalah titik di mana
 * developer memang bermaksud berkata: "sudah benar, sebarkan."
 */

import { useEffect, useState } from "react";
import { Globe, UploadCloud, CheckCircle2, AlertTriangle, Loader2, MapPinned } from "lucide-react";
import { bacaDraf, muatKontenAwan, periksaKonten } from "@/lib/konten";
import { tulisAdmin } from "@/lib/adminApi";
import { play } from "@/lib/sfx";

export default function BarSettingPeta({ onKelolaPulau, kotor: statusDraf }) {
  const [kotor, setKotor] = useState(Boolean(statusDraf));
  const [sibuk, setSibuk] = useState(false);
  const [sukses, setSukses] = useState("");
  const [galat, setGalat] = useState("");

  // Status datang dari halaman peta, yang menghitungnya ulang setiap kali
  // naskah ditulis. Bilah ini sengaja TIDAK menghitung sendiri: ia dipasang
  // hanya sekali, jadi hasil hitungannya akan membeku pada keadaan lama -
  // tanda "belum diterapkan" yang tidak pernah hilang, atau tanda "bersih"
  // padahal pengelola baru saja mengubah isi pulau.
  useEffect(() => {
    setKotor(Boolean(statusDraf));
  }, [statusDraf]);

  useEffect(() => {
    if (!sukses) return;
    const t = setTimeout(() => setSukses(""), 5000);
    return () => clearTimeout(t);
  }, [sukses]);

  async function terapkanUpdate() {
    if (sibuk) return;
    setGalat("");
    setSukses("");

    const isi = bacaDraf();

    // Diperiksa DUA KALI: di sini untuk pesan yang bisa dibaca developer
    // sebelum membuang waktu, dan sekali lagi di server yang menolaknya
    // sebelum menyentuh awan.
    const cek = periksaKonten(isi);
    if (!cek.sah) {
      play("wrong");
      setGalat(
        "Naskah belum bisa diterapkan. Perbaiki dulu: " +
          (cek.galat[0] || "isi tidak lengkap.") +
          (cek.galat.length > 1 ? ` (+${cek.galat.length - 1} lainnya)` : "")
      );
      return;
    }

    setSibuk(true);
    try {
      const r = await tulisAdmin("konten.terapkan", isi);
      if (!r.ok) {
        play("wrong");
        setGalat(
          r.detail?.length
            ? `${r.galat || "Gagal menerapkan."} ${r.detail[0]}`
            : r.galat || "Gagal menerapkan update."
        );
        return;
      }

      // Segarkan cache perangkat INI lebih dulu, supaya perbandingan
      // "ada naskah berubah?" di langkah berikutnya ikut berubah.
      try {
        await muatKontenAwan();
      } catch {
        /* pemuatan ulang sesaat lagi akan menariknya */
      }

      play("levelup");
      setSukses(r.pesan || "Update diterapkan.");
      setKotor(false);

      // Muat ulang peta. Sengaja penuh, bukan sekadar render ulang:
      // peta memakai beberapa nilai hasil `useMemo` yang dihitung saat
      // komponen dibuat, dan memuat ulang seluruh halaman menjamin tidak ada
      // satu pun nilai lama yang tertinggal. Ini tindakan jarang dan disengaja
      // oleh developer, jadi jeda sesaat tidak mengganggu siapa pun.
      setTimeout(() => window.location.reload(), 1400);
    } catch (e) {
      play("wrong");
      setGalat(e?.message || "Gagal menghubungi server.");
    } finally {
      setSibuk(false);
    }
  }

  return (
    <div className="relative z-30 mx-4 mt-3 sm:mx-5">
      <div className="flex flex-wrap items-center gap-2 rounded-3xl border-4 border-zippy-yellow bg-zippy-navy/85 px-3 py-2.5 backdrop-blur sm:px-4">
        <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-zippy-yellow">
          <MapPinned className="h-4 w-4" strokeWidth={3} />
          Mode Pengembang
        </span>

        <span
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black ${
            kotor ? "bg-zippy-yellow text-zippy-navy" : "bg-white/12 text-zippy-mint"
          }`}
          title={
            kotor
              ? "Ada suntingan yang belum dikirim ke awan."
              : "Isi di perangkat ini sama dengan yang sedang berlaku."
          }
        >
          {kotor ? (
            <>
              <AlertTriangle className="h-3.5 w-3.5" strokeWidth={3} /> Ada naskah belum
              diterapkan
            </>
          ) : (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={3} /> Sesuai versi berjalan
            </>
          )}
        </span>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              play("pop");
              if (onKelolaPulau) onKelolaPulau();
            }}
            className="btn-pop flex items-center gap-2 rounded-2xl bg-white/15 px-3 py-2 text-xs font-black text-white sm:text-sm"
          >
            <Globe className="h-4 w-4" strokeWidth={3} />
            Kelola Pulau
          </button>

          <button
            onClick={terapkanUpdate}
            disabled={sibuk}
            className={`btn-pop flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-black sm:text-sm ${
              kotor
                ? "bg-zippy-yellow text-zippy-navy"
                : "bg-zippy-teal text-white"
            } disabled:opacity-60`}
          >
            {sibuk ? (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={3} />
            ) : (
              <UploadCloud className="h-4 w-4" strokeWidth={3} />
            )}
            {sibuk ? "Menerapkan..." : "Terapkan Update"}
          </button>
        </div>
      </div>

      {/* Hasil aksi. Pesan berada DI DALAM bilah supaya tidak menutupi
          pulau-pulau di bawahnya, dan warnanya membedakan sukses dari gagal. */}
      {(sukses || galat) && (
        <div
          className={`mt-2 rounded-2xl px-3 py-2 text-xs font-black leading-relaxed sm:text-sm ${
            sukses
              ? "bg-emerald-500/95 text-white"
              : "bg-red-500/95 text-white"
          }`}
          role="status"
        >
          {sukses || galat}
        </div>
      )}

      <p className="mt-1.5 px-1 text-[10px] font-bold leading-relaxed text-white/50 sm:text-[11px]">
        Suntingan tersimpan sebagai naskah di perangkat ini dan belum berlaku bagi pemain.
        Tekan <b className="text-white/80">Terapkan Update</b> untuk menyebarkannya ke
        seluruh akun anak.
      </p>
    </div>
  );
}
