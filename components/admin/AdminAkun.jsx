"use client";

/**
 * Panel Admin — Kelola Akun
 *
 * Menjawab kebutuhan: "list pendamping, lalu lihat anak-anaknya, dan anak
 * itu bisa diedit datanya; pendamping juga bisa ditambah atau dihapus -
 * jadi panel ini mengatur semua data akun di website ini."
 *
 * PERBEDAAN PENTING DENGAN TAB "Data Akun"
 *
 *   Data Akun   mengelola nilai pemain yang tersimpan di awan. Tab ini dulu
 *               bernama "Perangkat" karena hanya menyentuh save browser INI;
 *               begitu ada tab ini, nama lama itu terdengar seolah panel
 *               punya dua tempat menyimpan anak yang berbeda.
 *   Kelola Akun mengelola STRUKTUR akun: siapa Pendamping, siapa anaknya,
 *              dan akun mana yang berperan pengelola. Perubahannya terbaca
 *              oleh perangkat manapun yang masuk dengan akun yang sama -
 *              itulah sebabnya tab ini ada.
 *
 * DENGAN AKUN ADMIN
 *
 * Akun berperan pengelola (perannya `admin` pada `app_metadata`) TIDAK
 * diperlakukan sebagai akun Pendamping walaupun sama-sama satu akun
 * Supabase. Ia tidak memuat profil anak dan tidak muncul di layar pilih
 * nama anak, jadi ditampilkan terpisah dengan lencana "Admin" - bukan
 * bersama daftar keluarga beserta isian tambah anaknya.
 *
 * Seluruh aksi tulis melewati /api/admin, yang mewajibkan peran pengelola
 * pada token sesi. Bentuk formulir di sini hanyalah pembungkus: aturan
 * panjang nama, jumlah anak, dan keunikan nama semuanya diperiksa ulang di
 * server, karena formulir bisa dilewati lewat Alat Pengembang.
 *
 * Daftar ini diisi dua sumber: akun dari Supabase Auth, anak dari tabel
 * `children`. Sinkronisasi dari perangkat keluarga terjadi setiap kali akun
 * dipasang di perangkatnya (lihat lib/syncAnak.js).
 */

import { useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  Pencil,
  Trash2,
  RefreshCw,
  Save,
  X,
  ChevronDown,
  Baby,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { tulisAdmin } from "@/lib/adminApi";
import { play } from "@/lib/sfx";

/** Sama dengan MAKS_ANAK di lib/profil.js - diperiksa ulang di server. */
const MAKS_ANAK = 6;

/** Sama dengan batas pada tambahAnak(): 18 karakter. */
const MAKS_NAMA = 18;

export default function AdminAkun() {
  const [daftar, setDaftar] = useState(null); // null = masih memuat
  const [daftarRusak, setDaftarRusak] = useState(false);
  const [pesan, setPesan] = useState("");
  const [galat, setGalat] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [buka, setBuka] = useState(null); // email pendamping yang dibuka

  // Formulir tambah pendamping
  const [bukaFormAkun, setBukaFormAkun] = useState(false);
  const [akunBaru, setAkunBaru] = useState({ email: "", sandi: "" });

  // Formulir tambah anak, dipisah per pendamping: { [idPendamping]: nama }
  const [anakBaru, setAnakBaru] = useState({});

  // Penyunting nama anak: { idPendamping, idAnak, nama }
  const [mengedit, setMengedit] = useState(null);
  const [nilaiEdit, setNilaiEdit] = useState("");

  function umumkan(t) {
    setPesan(t);
    setGalat("");
    setTimeout(() => setPesan(""), 3600);
  }

  function galangkan(t) {
    setGalat(t);
    setPesan("");
    setTimeout(() => setGalat(""), 6000);
  }

  async function muat() {
    setSibuk(true);
    const r = await tulisAdmin("pendamping.daftar");
    setSibuk(false);
    if (!r.ok) {
      setDaftar([]);
      // Daftar GAGAL dimuat, bukan kosong. Keduanya sengaja dibedakan:
      // bila daftar gagal lalu layar tetap menulis "Belum ada akun
      // Pendamping", pengelola bisa membacanya sebagai "tidak ada akun di
      // database" lalu membuat atau menghapus akun di atas dasar yang salah.
      setDaftarRusak(true);
      galangkan(r.galat || "Gagal memuat daftar akun.");
      return;
    }
    setDaftarRusak(false);
    setDaftar(r.pendamping || []);
    setGalat("");
  }

  useEffect(() => {
    muat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Jalankan satu aksi tulis, lalu muat ulang daftar. */
  async function jalankan(aksi, isi, sukses) {
    if (sibuk) return;
    setSibuk(true);
    const r = await tulisAdmin(aksi, isi);
    setSibuk(false);

    if (!r.ok) {
      galangkan(r.galat || "Aksi gagal dijalankan.");
      return false;
    }

    play("yeay");
    umumkan(sukses);
    await muat();
    return true;
  }

  // ---------------------------------------------------------- Pendamping

  async function buatPendamping(e) {
    e.preventDefault();
    const ok = await jalankan(
      "pendamping.buat",
      { email: akunBaru.email, sandi: akunBaru.sandi },
      `Akun Pendamping ${akunBaru.email.trim()} dibuat.`
    );
    if (ok) {
      setAkunBaru({ email: "", sandi: "" });
      setBukaFormAkun(false);
    }
  }

  async function hapusPendamping(p) {
    if (p.iniPengelola) {
      galangkan("Ini akun yang sedang dipakai untuk masuk. Tidak bisa dihapus.");
      return;
    }

    const jumlah = (p.anak || []).length;
    const isi = jumlah
      ? `Hapus akun ${p.email}?\n\nAkun ini punya ${jumlah} anak. Seluruh anaknya ikut terhapus beserta akunnya, karena terikat langsung ke pemiliknya. Tindakan ini tidak bisa dibatalkan.`
      : `Hapus akun ${p.email}?\n\nTindakan ini tidak bisa dibatalkan.`;

    if (!window.confirm(isi)) return;

    await jalankan(
      "pendamping.hapus",
      { id: p.id },
      `Akun ${p.email} dihapus${jumlah ? " beserta anak-anaknya" : ""}.`
    );
    setBuka(null);
  }

  // ---------------------------------------------------------- Anak

  async function tambahAnak(p) {
    const nama = (anakBaru[p.id] || "").trim();
    if (!nama) return;

    const ok = await jalankan(
      "anak.simpan",
      { pendamping_id: p.id, nama },
      `${nama} ditambahkan ke ${p.email}.`
    );
    if (ok) setAnakBaru({ ...anakBaru, [p.id]: "" });
  }

  function mulaiEdit(p, a) {
    setMengedit({ idPendamping: p.id, idAnak: a.id });
    setNilaiEdit(a.nama);
  }

  async function simpanEdit() {
    const nama = nilaiEdit.trim();
    if (!nama) return;
    const ok = await jalankan(
      "anak.simpan",
      { id: mengedit.idAnak, pendamping_id: mengedit.idPendamping, nama },
      `Nama anak diubah menjadi ${nama}.`
    );
    if (ok) setMengedit(null);
  }

  async function hapusAnak(p, a) {
    const isi = `Hapus profil anak "${a.nama}"?\n\nKemajuannya di basis data ikut terhapus. Tindakan ini tidak bisa dibatalkan.`;
    if (!window.confirm(isi)) return;

    await jalankan("anak.hapus", { id: a.id }, `${a.nama} dihapus.`);
  }

  // ---------------------------------------------------------- Render

  if (daftar === null) return <Kotak>Memuat daftar akun...</Kotak>;

  // Dua kelompok berbeda, sengaja tidak dicampur:
  //
  //   Akun Pendamping  keluarga yang punya profil anak. Ini yang dihitung
  //                    sebagai "keluarga" dan yang boleh menampung anak.
  //   Akun Admin       peran pengelola panel. Tidak memuat profil anak dan
  //                    tidak muncul di layar pilih nama anak. Kalau ia ikut
  //                    dihitung, "Akun Pendamping" selalu kelebihan satu dan
  //                    rata-rata anak per akun ikut meleset.
  const akunAdmin = daftar.filter((p) => p.pengelola);
  const akunPendamping = daftar.filter((p) => !p.pengelola);
  const totalAnak = akunPendamping.reduce((n, p) => n + (p.anak || []).length, 0);

  return (
    <div className="space-y-4">
      {pesan && (
        <div className="rounded-2xl bg-emerald-100 px-4 py-3 text-sm font-black text-emerald-800">
          {pesan}
        </div>
      )}
      {galat && (
        <div className="rounded-2xl bg-red-100 px-4 py-3 text-sm font-black text-red-800">
          {galat}
        </div>
      )}

      {/* Ringkasan */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Ringkas label="Akun Pendamping" nilai={daftarRusak ? "—" : akunPendamping.length} />
        <Ringkas label="Akun Admin" nilai={daftarRusak ? "—" : akunAdmin.length} />
        <Ringkas label="Total Anak" nilai={daftarRusak ? "—" : totalAnak} />
        <Ringkas label="Batas Anak" nilai={`${MAKS_ANAK} / akun`} />
      </div>

      {/* Alat */}
      <Kotak judul="Kelola Akun Pendamping">
        <div className="flex flex-wrap gap-2">
          <TombolKecil onClick={muat} ikon={RefreshCw} netral disabled={sibuk}>
            {sibuk ? "Memuat..." : "Muat Ulang"}
          </TombolKecil>
          <TombolKecil onClick={() => setBukaFormAkun((v) => !v)} ikon={UserPlus}>
            {bukaFormAkun ? "Batal" : "Tambah Pendamping"}
          </TombolKecil>
        </div>

        {bukaFormAkun && (
          <form onSubmit={buatPendamping} className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-black text-zippy-navy">Alamat surel</span>
              <input
                type="email"
                required
                value={akunBaru.email}
                onChange={(e) => setAkunBaru({ ...akunBaru, email: e.target.value })}
                placeholder="nama@contoh.com"
                className="w-full rounded-xl border-2 border-zippy-navy/15 bg-white px-3 py-2 text-sm font-bold text-zippy-navy outline-none focus:border-zippy-teal"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-black text-zippy-navy">
                Kata sandi (min. 8)
              </span>
              <input
                type="text"
                required
                minLength={8}
                value={akunBaru.sandi}
                onChange={(e) => setAkunBaru({ ...akunBaru, sandi: e.target.value })}
                placeholder="minimal 8 karakter"
                className="w-full rounded-xl border-2 border-zippy-navy/15 bg-white px-3 py-2 text-sm font-bold text-zippy-navy outline-none focus:border-zippy-teal"
              />
            </label>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={sibuk}
                className="btn-pop flex w-full items-center justify-center gap-2 rounded-2xl bg-zippy-teal px-4 py-3 font-black text-white disabled:opacity-40 sm:w-auto"
              >
                <Save className="h-5 w-5" strokeWidth={2.8} /> Buat Akun
              </button>
            </div>
          </form>
        )}

        <p className="mt-3 text-[11px] font-bold leading-relaxed text-zippy-navy/60">
          Akun baru langsung bisa dipakai masuk tanpa konfirmasi surel, karena memang
          dibuat oleh pengelola. Kata sandi disimpan oleh Supabase Auth - tidak pernah
          lewat panel ini.
        </p>
      </Kotak>

      {/* Daftar pendamping */}
      <Kotak judul="Daftar Pendamping">
        {daftarRusak && (
          <div className="rounded-2xl border-2 border-red-300 bg-red-50 p-3">
            <p className="text-sm font-black text-red-800">
              Daftar tidak bisa dimuat.
            </p>
            <p className="mt-1 text-[11px] font-bold leading-relaxed text-red-700">
              Karena itu layar ini TIDAK menampilkan jumlah akun - bukan berarti
              akunnya tidak ada. Pesan penyebabnya ada di pita merah di atas.
              Memuat ulang setelah penyebabnya beres akan mengisi daftar ini.
            </p>
          </div>
        )}

        {!daftarRusak && daftar.length === 0 && (
          <p className="text-sm font-bold text-zippy-navy/60">
            Belum ada akun Pendamping. Buat yang pertama lewat tombol di atas.
          </p>
        )}

        <div className="space-y-3">
          {daftar.map((p) => {
            const terbuka = buka === p.id;

            // --------------------------------------------------------
            // Akun berperan pengelola - ditampilkan TERPISAH
            // --------------------------------------------------------
            // Ia memang satu akun Supabase seperti akun lain, tetapi
            // perannya pengelola panel, bukan keluarga. Ia tidak memuat
            // profil anak dan tidak muncul di layar pilih nama anak.
            //
            // Kalau akun ini digabung ke daftar Pendamping seperti sebelumnya,
            // ia akan terbaca sebagai "akun keluarga yang anaknya tinggal
            // dihapus" - padahal akun inilah yang justru memegang kunci panel.
            if (p.pengelola) {
              return (
                <div
                  key={p.id}
                  className="rounded-2xl border-2 border-zippy-yellow/70 bg-zippy-yellow/12 p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-zippy-yellow/35 text-zippy-navy">
                      <ShieldCheck className="h-5 w-5" strokeWidth={2.8} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-black text-zippy-navy">
                        {p.email}
                      </span>
                      <span className="block text-[11px] font-bold text-zippy-navy/60">
                        Akun admin khusus · bukan akun Pendamping
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full bg-zippy-navy px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-zippy-yellow">
                      Admin
                    </span>
                  </div>

                  <p className="mt-2 text-[11px] font-bold leading-relaxed text-zippy-navy/65">
                    Akun ini hanya untuk membuka Panel Admin dan Setting Peta.
                    Tidak memuat profil anak, jadi tidak ada isian tambah anak
                    di sini - sama sekali berbeda dari akun keluarga di bawahnya.
                  </p>

                  {!p.iniPengelola && (
                    <div className="mt-3 border-t-2 border-zippy-navy/10 pt-3">
                      <button
                        onClick={() => hapusPendamping(p)}
                        disabled={sibuk}
                        className="flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-black text-white transition hover:bg-red-600 active:scale-95 disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={3} /> Hapus Akun Ini
                      </button>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div
                key={p.id}
                className="rounded-2xl border-2 border-zippy-navy/10 bg-white p-3"
              >
                <button
                  onClick={() => setBuka(terbuka ? null : p.id)}
                  className="flex w-full items-center gap-3 text-left"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-zippy-teal/15 text-zippy-teal">
                    <Users className="h-5 w-5" strokeWidth={2.8} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-black text-zippy-navy">
                      {p.email}
                    </span>
                    <span className="block text-[11px] font-bold text-zippy-navy/55">
                      {(p.anak || []).length} anak ·{" "}
                      {p.iniPengelola ? "pengelola panel ini" : "akun keluarga"}
                    </span>
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-zippy-navy/50 transition-transform ${
                      terbuka ? "rotate-180" : ""
                    }`}
                    strokeWidth={2.8}
                  />
                </button>

                {terbuka && (
                  <div className="mt-3 border-t-2 border-zippy-navy/10 pt-3">
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-zippy-navy/50">
                      <Baby className="h-4 w-4" strokeWidth={2.8} /> Anak-anaknya
                    </p>

                    {(p.anak || []).length === 0 && (
                      <p className="mb-2 text-xs font-bold text-zippy-navy/55">
                        Belum ada anak. Tambahkan lewat kolom di bawah.
                      </p>
                    )}

                    <ul className="space-y-2">
                      {(p.anak || []).map((a) => {
                        const sedangEdit = mengedit?.idAnak === a.id;
                        return (
                          <li
                            key={a.id}
                            className="flex flex-wrap items-center gap-2 rounded-xl bg-cream px-3 py-2"
                          >
                            {sedangEdit ? (
                              <>
                                <input
                                  autoFocus
                                  value={nilaiEdit}
                                  onChange={(e) => setNilaiEdit(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") simpanEdit();
                                    if (e.key === "Escape") setMengedit(null);
                                  }}
                                  maxLength={MAKS_NAMA}
                                  className="min-w-0 flex-1 rounded-lg border-2 border-zippy-teal bg-white px-2 py-1.5 text-sm font-bold text-zippy-navy outline-none"
                                />
                                <button
                                  onClick={simpanEdit}
                                  disabled={sibuk}
                                  className="grid h-8 w-8 place-items-center rounded-lg bg-zippy-teal text-white transition active:scale-95 disabled:opacity-40"
                                  aria-label="Simpan nama"
                                >
                                  <Save className="h-4 w-4" strokeWidth={3} />
                                </button>
                                <button
                                  onClick={() => setMengedit(null)}
                                  className="grid h-8 w-8 place-items-center rounded-lg bg-zippy-navy/10 text-zippy-navy transition active:scale-95"
                                  aria-label="Batal"
                                >
                                  <X className="h-4 w-4" strokeWidth={3} />
                                </button>
                              </>
                            ) : (
                              <>
                                <span className="min-w-0 flex-1 truncate text-sm font-black text-zippy-navy">
                                  {a.nama}
                                </span>
                                <button
                                  onClick={() => mulaiEdit(p, a)}
                                  className="grid h-8 w-8 place-items-center rounded-lg bg-zippy-teal/15 text-zippy-teal transition hover:bg-zippy-teal/25 active:scale-95"
                                  aria-label={`Ubah nama ${a.nama}`}
                                >
                                  <Pencil className="h-4 w-4" strokeWidth={3} />
                                </button>
                                <button
                                  onClick={() => hapusAnak(p, a)}
                                  disabled={sibuk}
                                  className="grid h-8 w-8 place-items-center rounded-lg bg-red-500/15 text-red-600 transition hover:bg-red-500/25 active:scale-95 disabled:opacity-40"
                                  aria-label={`Hapus ${a.nama}`}
                                >
                                  <Trash2 className="h-4 w-4" strokeWidth={3} />
                                </button>
                              </>
                            )}
                          </li>
                        );
                      })}
                    </ul>

                    {/* Tambah anak */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <input
                        value={anakBaru[p.id] || ""}
                        onChange={(e) =>
                          setAnakBaru({ ...anakBaru, [p.id]: e.target.value })
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") tambahAnak(p);
                        }}
                        placeholder="Nama anak"
                        maxLength={MAKS_NAMA}
                        disabled={(p.anak || []).length >= MAKS_ANAK}
                        className="min-w-0 flex-1 rounded-xl border-2 border-zippy-navy/15 bg-white px-3 py-2 text-sm font-bold text-zippy-navy outline-none focus:border-zippy-teal disabled:opacity-50"
                      />
                      <button
                        onClick={() => tambahAnak(p)}
                        disabled={
                          sibuk ||
                          !(anakBaru[p.id] || "").trim() ||
                          (p.anak || []).length >= MAKS_ANAK
                        }
                        className="flex items-center gap-2 rounded-xl bg-zippy-teal px-4 py-2 text-sm font-black text-white transition active:scale-95 disabled:opacity-40"
                      >
                        <UserPlus className="h-4 w-4" strokeWidth={3} /> Tambah
                      </button>
                    </div>
                    {(p.anak || []).length >= MAKS_ANAK && (
                      <p className="mt-1 text-[11px] font-bold text-zippy-navy/55">
                        Sudah mencapai batas {MAKS_ANAK} anak.
                      </p>
                    )}

                    {/* Hapus pendamping */}
                    <div className="mt-4 border-t-2 border-zippy-navy/10 pt-3">
                      <button
                        onClick={() => hapusPendamping(p)}
                        disabled={sibuk || p.iniPengelola}
                        className="flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-black text-white transition hover:bg-red-600 active:scale-95 disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={3} /> Hapus Akun Ini
                      </button>
                      {p.iniPengelola && (
                        <p className="mt-1 flex items-start gap-1.5 text-[11px] font-bold leading-relaxed text-amber-700">
                          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={3} />
                          Tidak bisa dihapus: inilah akun yang sedang membuka panel.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Kotak>

      {/* Keterangan */}
      <Kotak judul="Sejauh mana perubahan ini berlaku">
        <ul className="space-y-1.5 text-[11px] font-bold leading-relaxed text-zippy-navy/70">
          <li>
            <b>Anak yang ditambah/dihapus di sini</b> terbaca oleh perangkat yang
            masuk dengan akun tersebut, pada pemasangan akun berikutnya.
          </li>
          <li>
            <b>Anak yang ditambah di perangkat keluarga</b> otomatis terkirim ke sini
            begitu orang tua menekan simpan.
          </li>
          <li>
            <b>Halaman &quot;Kelola Akun&quot; ini tidak menyentuh kemajuan bermain</b> (koin,
            XP, pulau). Kemajuan ada di tab <b>Data Akun</b> dan <b>Supabase</b>.
          </li>
          <li>
            <b>Akun berperan pengelola tampil terpisah</b> dengan lencana{" "}
            <b>Admin</b>. Akun itu bukan akun Pendamping, jadi tidak memuat
            profil anak dan tidak ikut dihitung pada ringkasan keluarga.
          </li>
          <li>
            Penghapusan selalu diminta ulang lewat kotak konfirmasi, dan tidak ada
            tombol yang menghapus banyak data sekaligus tanpa menyebutkan apa yang
            akan hilang.
          </li>
        </ul>
      </Kotak>
    </div>
  );
}

function Ringkas({ label, nilai }) {
  return (
    <div className="rounded-2xl bg-white/90 p-3 text-center shadow-pop">
      <p className="text-[10px] font-black uppercase tracking-wide text-zippy-navy/50">{label}</p>
      <p className="truncate font-display text-lg font-bold text-zippy-navy">{nilai}</p>
    </div>
  );
}

function Kotak({ judul, children }) {
  return (
    <section className="rounded-3xl border-2 border-zippy-navy/10 bg-cream p-4 shadow-pop">
      {judul && (
        <h3 className="mb-3 font-display text-base font-bold text-zippy-navy sm:text-lg">
          {judul}
        </h3>
      )}
      {children}
    </section>
  );
}

function TombolKecil({ onClick, ikon: Ikon, children, netral = false, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-black text-white transition active:scale-95 disabled:opacity-40 ${
        netral ? "bg-zippy-navy hover:bg-zippy-navy/85" : "bg-zippy-teal hover:bg-zippy-teal/85"
      }`}
    >
      <Ikon className="h-4 w-4" strokeWidth={3} />
      {children}
    </button>
  );
}
