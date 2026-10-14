"use client";

/**
 * Panel Admin ZippyVerse
 * ======================
 *
 * Halaman khusus untuk mengelola seluruh data permainan: kemajuan pemain di
 * perangkat ini, isi tabel Supabase, dan angka-angka konten (harga kostum,
 * hadiah harian, batas energi).
 *
 * TIGA HAL YANG HARUS DIPAHAMI SIAPA PUN YANG MEMBAKA BERKAS INI:
 *
 *  1. PIN di sini bukan keamanan. Kode halaman ini dikirim ke browser seperti
 *     kode lainnya, sehingga siapa pun yang membuka Alat Pengembang bisa
 *     membaca dan melewati PIN. PIN hanya untuk menghalangi anak iseng.
 *     Peringatan ini juga ditampilkan di dalam halaman, bukan cuma di sini.
 *
 *  2. Bagian Supabase HANYA BISA MEMBACA. Halaman ini memakai kunci anon yang
 *     sama dengan yang dipakai seluruh pengunjung, dan kunci itu tidak
 *     seharusnya dipakai untuk mengubah data pemain lain. Menambah, mengubah,
 *     atau menghapus baris harus dilakukan lewat dasbor Supabase dengan kunci
 *     service role yang tidak pernah boleh masuk ke berkas klien.
 *
 *  3. Pengaturan konten disimpan di localStorage perangkat ini saja. Ini
 *     bukan pengaturan server — tiap perangkat punya nilai sendiri-sendiri.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldAlert, ShieldCheck, ArrowLeft, KeyRound, LogIn } from "lucide-react";
import { pinSudahAda, pinSah, buatPin, cekPin } from "@/lib/adminAuth";
import { periksaStatusAdmin } from "@/lib/adminApi";
import { supabase, supabaseEnabled } from "@/lib/supabase";
import AdminPerangkat from "@/components/admin/AdminPerangkat";
import AdminSupabase from "@/components/admin/AdminSupabase";
import AdminKonten from "@/components/admin/AdminKonten";
import AdminAkun from "@/components/admin/AdminAkun";

const TAB = [
  { id: "akun", label: "Kelola Akun", desc: "Pendamping & anak mereka" },
  { id: "perangkat", label: "Perangkat", desc: "Kemajuan pemain di browser ini" },
  { id: "supabase", label: "Supabase", desc: "Telusuri tabel (baca saja)" },
  { id: "konten", label: "Konten", desc: "Harga, hadiah, batas energi" },
];

/**
 * Tahapan gerbang panel.
 *
 * Panel ini ditutup DUA lapis, dan keduanya punya tugas yang BERBEDA —
 * sengaja tidak digabung supaya kelemahan satu lapis tidak ikut menjatuhkan
 * lapis lainnya:
 *
 *   1. SUPABASE — lapisan yang sesungguhnya. Server memeriksa
 *      `app_metadata.role` pemegang token lewat /api/admin. Metadata itu
 *      ditulis Supabase dari sisi server dan TIDAK BISA diubah dari peramban,
 *      sehingga tidak ada pengunjung yang bisa menaikkan derajatnya sendiri
 *      lewat Alat Pengembang. Berbeda dengan `user_metadata`, yang memang
 *      boleh diubah pemilik akun.
 *
 *   2. PIN — lapis kedua, bukan pengaman utama. Sesi Supabase bertahan antar
 *      pemuatan halaman, jadi siapa pun yang memegang laptop orang tua yang
 *      sudah masuk akan membuka panel tanpa diminta sandi apa pun. PIN
 *      menghalangi kejadian itu, dan menghalangi anak iseng menekan-nekan.
 *
 * Bila `SUPABASE_SERVICE_ROLE_KEY` belum diisi, lapis pertama tidak bisa
 * dijalankan — dan memang tidak ada hak istimewa apa pun yang bisa
 * diberikan, karena yang ada di peramban hanyalah kunci anon milik semua
 * orang. Panel lalu memakai PIN saja, dengan menyatakan hal itu apa adanya.
 */
const TAHAP = {
  MUAT: "muat",
  SUPABASE: "supabase",
  PIN: "pin",
  BUKA: "buka",
};

export default function AdminPage() {
  const [tahap, setTahap] = useState(TAHAP.MUAT);
  const [tab, setTab] = useState("perangkat");
  const [perluBuat, setPerluBuat] = useState(false);
  const [galatGerbang, setGalatGerbang] = useState("");
  const [layananAktif, setLayananAktif] = useState(false);

  // localStorage tidak bisa dibaca saat server merender, dan pemeriksaan peran
  // membutuhkan panggilan jaringan. Karena itu gerbang baru diputuskan setelah
  // halaman hidrasi, dan sebelum itu hanya menampilkan layar memuat — supaya
  // tidak ada perbedaan tampilan server/klien.
  useEffect(() => {
    let hidup = true;
    (async () => {
      const r = await periksaStatusAdmin();
      if (!hidup) return;
      setPerluBuat(!pinSudahAda());
      if (r.ok) {
        setLayananAktif(true);
        setTahap(TAHAP.PIN);
        return;
      }
      const galat = r.galat || "";
      if (/belum dikonfigurasi/i.test(galat)) {
        // Layanan pengelola memang belum dipasang. Tidak ada hak istimewa
        // yang bisa diberikan, jadi lanjut ke PIN dan katakan apa adanya.
        setLayananAktif(false);
        setTahap(TAHAP.PIN);
      } else {
        setLayananAktif(true);
        setGalatGerbang(galat);
        setTahap(TAHAP.SUPABASE);
      }
    })();
    return () => {
      hidup = false;
    };
  }, []);

  if (tahap === TAHAP.MUAT) {
    return (
      <main className="space-bg relative grid min-h-screen place-items-center">
        <p className="font-display text-lg font-bold text-white/80">Memeriksa izin...</p>
      </main>
    );
  }

  return (
    <main className="space-bg relative min-h-screen overflow-x-clip pb-14">
      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              aria-label="Kembali ke dasbor orang tua"
              className="grid h-10 w-10 place-items-center rounded-full bg-white/90 text-zippy-navy shadow-pop transition hover:bg-white active:scale-95"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2.8} />
            </Link>
            <div>
              <h1 className="font-display text-2xl font-bold text-white drop-shadow-[0_2px_8px_rgba(15,44,61,0.9)] sm:text-3xl">
                Panel Admin
              </h1>
              <p className="text-xs font-bold text-white/70 drop-shadow-[0_2px_6px_rgba(15,44,61,0.9)]">
                Pengelolaan seluruh data ZippyVerse
              </p>
            </div>
          </div>
          {tahap === TAHAP.BUKA && <KunciBadge />}
        </header>

        {tahap !== TAHAP.BUKA ? (
          tahap === TAHAP.SUPABASE ? (
            <GerbangSupabase
              galatAwal={galatGerbang}
              onLulus={() => {
                setGalatGerbang("");
                setTahap(TAHAP.PIN);
              }}
            />
          ) : (
            <GerbangPIN perluBuat={perluBuat} onBuka={() => setTahap(TAHAP.BUKA)} />
          )
        ) : (
          <>
            <PeringatanJujur layananAktif={layananAktif} />

            <nav className="mb-4 flex flex-wrap gap-2">
              {TAB.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`rounded-2xl px-4 py-2 text-left transition ${
                    tab === t.id
                      ? "bg-zippy-yellow text-zippy-navy shadow-pop"
                      : "bg-white/85 text-zippy-navy/70 hover:bg-white"
                  }`}
                >
                  <span className="block text-sm font-black">{t.label}</span>
                  <span className="block text-[10px] font-bold opacity-70">{t.desc}</span>
                </button>
              ))}
            </nav>

            {tab === "akun" && <AdminAkun />}
            {tab === "perangkat" && <AdminPerangkat />}
            {tab === "supabase" && <AdminSupabase />}
            {tab === "konten" && <AdminKonten />}
          </>
        )}
      </div>
    </main>
  );
}

function KunciBadge() {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1.5 text-xs font-black text-white">
      <ShieldCheck className="h-4 w-4" strokeWidth={3} />
      Panel terbuka
    </span>
  );
}

/**
 * Peringatan yang ditampilkan di dalam halaman.
 *
 * Ditulis langsung, bukan disembunyikan di tooltip: pemilik panel berhak tahu
 * persis seberapa jauh ia bisa mengandalkan gerbang ini. Isinya berbeda
 * tergantung apakah lapisan server sudah aktif atau belum.
 */
function PeringatanJujur({ layananAktif }) {
  return (
    <div className="mb-5 rounded-3xl border-2 border-amber-400/60 bg-amber-100/90 p-4">
      <p className="flex items-center gap-2 text-sm font-black text-amber-900">
        <ShieldAlert className="h-5 w-5 shrink-0" strokeWidth={2.8} />
        {layananAktif
          ? "Baca dulu: apa yang gerbang ini lindungi, dan apa yang tidak"
          : "Baca dulu: saat ini panel hanya dilindungi PIN"}
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-xs font-bold leading-relaxed text-amber-900/85">
        {layananAktif ? (
          <>
            <li>
            <b>Peran diverifikasi oleh server.</b> Sebelum panel terbuka,
            /api/admin memeriksa peran pada token sesi Anda lewat Supabase.
            Peran itu tidak bisa diubah dari peramban, jadi pengunjung tidak
            bisa menaikkan derajatnya sendiri.
          </li>
          <li>
            <b>Kunci service role tidak pernah sampai ke browser.</b> Seluruh
            akses istimewa terjadi di server; peramban hanya mengirim token
            sesi miliknya sendiri.
          </li>
          <li>
            PIN tetap dipakai sebagai <b>lapis kedua</b>. Sesi yang sudah hidup
            membuat panel terbuka tanpa diminta sandi apa pun; PIN menghalangi
            kejadian itu pada perangkat bersama.
          </li>
        </>
        ) : (
          <>
            <li>
            <b>SUPABASE_SERVICE_ROLE_KEY belum diisi.</b> Tanpa kunci itu server
            tidak memegang hak istimewa apa pun — dan kunci anon yang ada di
            peramban memang milik semua pengunjung. Untuk sekarang satu-satunya
            penghalang adalah PIN.
          </li>
          <li>
            <b>PIN di sini bukan keamanan sungguhan.</b> Kode halaman ini dikirim
            ke browser, sehingga siapa pun yang membuka Alat Pengembang bisa
            membacanya. Tambahkan kunci service role lalu isi peran{" "}
            <code className="rounded bg-amber-200/70 px-1">admin</code> pada
            akun Anda agar lapisan server ikut berjaga.
          </li>
        </>
        )}
        <li>
          Pengaturan konten berlaku untuk <b>perangkat ini saja</b>, bukan untuk
          semua pemain.
        </li>
      </ul>
    </div>
  );
}

/**
 * Terjemahkan pesan galat Supabase Auth ke Bahasa Indonesia.
 *
 * Pesan asli berbahasa Inggris dan sebagian bersifat teknis ("Invalid login
 * credentials"). Untuk pemilik panel, kalimat yang bisa langsung ditindak-
 * lanjuti jauh lebih berguna daripada kutipan mentah.
 */
function terjemahAuth(error) {
  const pesan = error?.message || "";
  const m = pesan.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "Email atau kata sandi salah.";
  if (m.includes("email not confirmed"))
    return "Email belum dikonfirmasi. Buka tautan di kotak masuk Anda terlebih dahulu.";
  if (m.includes("password should be at least"))
    return "Kata sandi terlalu pendek.";
  if (m.includes("rate limit") || m.includes("too many") || m.includes("security purposes"))
    return "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.";
  if (m.includes("fetch failed") || m.includes("network"))
    return "Gagal menghubungi server. Periksa koneksi internet.";
  if (m.includes("signups not allowed"))
    return "Pendaftaran sedang dimatikan. Hubungi pengelola situs.";
  return pesan || "Gagal masuk. Coba lagi.";
}

/**
 * Lapis pertama: masuk dengan akun Supabase yang berperan pengelola.
 *
 * Mengirim kata sandi bukan berarti kata sandi dipercaya begitu saja. Setelah
 * Supabase menerima sandi, token yang dihasilkan lalu dikirim ke /api/admin
 * dan DIVERIFIKASI ULANG di server — termasuk perannya. Barulah panel lanjut
 * ke lapis PIN.
 */
function GerbangSupabase({ galatAwal, onLulus }) {
  const [email, setEmail] = useState("");
  const [sandi, setSandi] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState(galatAwal || "");

  async function submit(e) {
    e.preventDefault();
    if (sibuk) return;
    if (!supabaseEnabled) {
      setPesan("Supabase belum dikonfigurasi di berkas .env.local.");
      return;
    }
    const surel = email.trim();
    if (!surel || !sandi) {
      setPesan("Isi email dan kata sandi terlebih dahulu.");
      return;
    }

    setSibuk(true);
    setPesan("");
    const { error } = await supabase.auth
      .signInWithPassword({ email: surel, password: sandi })
      .catch(() => ({ error: new Error("Gagal menghubungi server.") }));

    if (error) {
      setSibuk(false);
      setPesan(terjemahAuth(error));
      return;
    }

    // Masuk berhasil, tapi itu baru membuktikan siapa Anda — belum apa
    // peran Anda. Peran tetap harus diperiksa server.
    const ulang = await periksaStatusAdmin();
    setSibuk(false);
    if (!ulang.ok) {
      setPesan(ulang.galat || "Akun ini bukan akun pengelola.");
      await supabase.auth.signOut().catch(() => {});
      return;
    }
    onLulus();
  }

  return (
    <div className="mx-auto max-w-md rounded-[30px] border-4 border-zippy-teal bg-cream p-6 shadow-pop-lg">
      <div className="mb-4 grid place-items-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-zippy-teal/15 text-zippy-teal">
          <LogIn className="h-7 w-7" strokeWidth={2.8} />
        </span>
      </div>
      <h2 className="text-center font-display text-xl font-bold text-zippy-navy">
        Masuk sebagai Pengelola
      </h2>
      <p className="mt-1 text-center text-xs font-bold text-zippy-navy/60">
        Peran Anda diperiksa oleh server sebelum panel terbuka.
      </p>

      <form onSubmit={submit} className="mt-5 space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs font-black text-zippy-navy">Email</span>
          <input
            type="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setPesan("");
            }}
            className="w-full rounded-2xl border-2 border-zippy-navy/15 bg-white px-4 py-3 text-base font-bold text-zippy-navy outline-none focus:border-zippy-teal"
            placeholder="nama@contoh.com"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-black text-zippy-navy">
            Kata sandi
          </span>
          <input
            type="password"
            autoComplete="current-password"
            value={sandi}
            onChange={(e) => {
              setSandi(e.target.value);
              setPesan("");
            }}
            className="w-full rounded-2xl border-2 border-zippy-navy/15 bg-white px-4 py-3 text-base font-bold text-zippy-navy outline-none focus:border-zippy-teal"
            placeholder="••••••••"
          />
        </label>

        {pesan && (
          <p className="rounded-2xl bg-red-100 px-3 py-2 text-center text-xs font-black text-red-700">
            {pesan}
          </p>
        )}

        <button
          type="submit"
          disabled={sibuk}
          className="btn-pop w-full rounded-2xl bg-zippy-teal px-4 py-3 font-black text-white disabled:opacity-60"
        >
          {sibuk ? "Memeriksa..." : "Verifikasi Izin"}
        </button>
      </form>

      {/* Bentuk pendaftaran disengaja TIDAK disediakan di sini. Panel ini
          untuk akun pengelola yang sudah dibuat terpisah lewat /daftar, lalu
          diberi peran dari sisi server. Kalau tombol daftar ada di halaman
          ini, siapa pun bisa mendaftar dan mencoba peruntungannya. */}
      <p className="mt-4 rounded-2xl bg-zippy-navy/6 px-3 py-2 text-center text-[11px] font-bold leading-relaxed text-zippy-navy/65">
        Belum punya akun pengelola? Daftar lewat{" "}
        <span className="font-black text-zippy-teal">/daftar</span>, lalu beri
        peran <code className="rounded bg-zippy-navy/10 px-1">admin</code> pada
        akun itu dari dasbor Supabase.
      </p>
    </div>
  );
}

/** Gerbang PIN: membuat PIN baru, atau memasukkan PIN yang sudah ada. */
function GerbangPIN({ perluBuat, onBuka }) {
  const [mode, setMode] = useState(perluBuat ? "buat" : "masuk");
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [pesan, setPesan] = useState("");

  function submit(e) {
    e.preventDefault();
    if (mode === "masuk") {
      if (cekPin(a)) {
        onBuka();
      } else {
        setPesan("PIN salah. Coba lagi.");
        setA("");
      }
      return;
    }
    if (!pinSah(a)) {
      setPesan("PIN harus 4 sampai 8 angka.");
      return;
    }
    if (a !== b) {
      setPesan("Ketikan PIN-nya belum sama.");
      return;
    }
    if (buatPin(a)) {
      onBuka();
    } else {
      setPesan("PIN gagal disimpan. Coba lagi.");
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-[30px] border-4 border-zippy-teal bg-cream p-6 shadow-pop-lg">
      <div className="mb-4 grid place-items-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-zippy-teal/15 text-zippy-teal">
          <KeyRound className="h-7 w-7" strokeWidth={2.8} />
        </span>
      </div>
      <h2 className="text-center font-display text-xl font-bold text-zippy-navy">
        {mode === "buat" ? "Buat PIN Panel Admin" : "Masukkan PIN"}
      </h2>
      <p className="mt-1 text-center text-xs font-bold text-zippy-navy/60">
        {mode === "buat"
          ? "PIN ini dipakai untuk membuka panel di perangkat ini."
          : "Panel ini dikunci. Masukkan PIN orang tua."}
      </p>

      <form onSubmit={submit} className="mt-5 space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs font-black text-zippy-navy">
            {mode === "buat" ? "PIN baru" : "PIN"}
          </span>
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            value={a}
            onChange={(e) => {
              setA(e.target.value.replace(/\D/g, "").slice(0, 8));
              setPesan("");
            }}
            className="w-full rounded-2xl border-2 border-zippy-navy/15 bg-white px-4 py-3 text-center font-display text-2xl tracking-[0.4em] text-zippy-navy outline-none focus:border-zippy-teal"
            placeholder="••••"
          />
        </label>

        {mode === "buat" && (
          <label className="block">
            <span className="mb-1 block text-xs font-black text-zippy-navy">
              Ketik ulang PIN
            </span>
            <input
              type="password"
              inputMode="numeric"
              value={b}
              onChange={(e) => {
                setB(e.target.value.replace(/\D/g, "").slice(0, 8));
                setPesan("");
              }}
              className="w-full rounded-2xl border-2 border-zippy-navy/15 bg-white px-4 py-3 text-center font-display text-2xl tracking-[0.4em] text-zippy-navy outline-none focus:border-zippy-teal"
              placeholder="••••"
            />
          </label>
        )}

        {pesan && (
          <p className="rounded-2xl bg-red-100 px-3 py-2 text-center text-xs font-black text-red-700">
            {pesan}
          </p>
        )}

        <button
          type="submit"
          className="btn-pop w-full rounded-2xl bg-zippy-teal px-4 py-3 font-black text-white"
        >
          {mode === "buat" ? "Buat dan Buka Panel" : "Buka Panel"}
        </button>
      </form>

      {/* Jalur "lupa PIN" sengaja TIDAK disediakan. Kalau ada, anak cukup
          menekan "Lupa PIN" lalu membuat PIN baru — kuncinya jadi tidak
          berguna sama sekali. Admin yang benar-benar lupa PIN bisa membersihkan
          data peramban, yang memang cara aslinya mengatur ulang panel ini. */}
      <p className="mt-4 rounded-2xl bg-zippy-navy/6 px-3 py-2 text-center text-[11px] font-bold leading-relaxed text-zippy-navy/65">
        Ingat: PIN ini hanya penghalang, bukan kunci. Kode panel tetap bisa dibaca
        siapa pun lewat Alat Pengembang peramban.
      </p>
    </div>
  );
}
