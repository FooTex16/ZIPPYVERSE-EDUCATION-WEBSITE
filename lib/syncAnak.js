// ============================================================
// Sinkronisasi daftar anak dengan awan
// ============================================================
//
// MENGAPA INI ADA
//
// Selama ini daftar anak hidup sepenuhnya di localStorage satu perangkat.
// Itu bekerja untuk keluarga pemilik perangkat, tetapi membuat panel admin
// buta: pengelola membuka tabel `children` dan tidak melihat apa pun,
// padahal perangkat keluarga penuh dengan anak.
//
// Jadi perangkat perlu mengirim daftarnya, dan perlu menerima kembali
// perubahan yang dibuat pengelola.
//
// ATURAN YANG TIDAK BOLEH DILANGGAR: DAFTAR KOSONG TIDAK MENGIKIS APA PUN
//
// `terapkanDaftarAwan()` menerima daftar dari awan lalu menerapkannya ke
// perangkat. Bila kekosongan diartikan sebagai "hapus semua anak", maka
// satu kali Supabase tidak terjangkau, satu kali respons terpotong, atau
// satu kali tabel belum dibuat akan langsung menghapus seluruh anak
// keluarga - persis jenis kerusakan yang sudah pernah terjadi pada akun ini.
//
// Karena itu kekosongan selalu berarti "tidak ada yang bisa diputuskan",
// bukan "tidak ada anak". Hapus massal hanya mungkin dilakukan lewat panel
// admin satu per satu, yang memang disengaja.
//
// KEKOSONGAN JUGA TIDAK PERNAH MENGHAPUS ANAK DARI AKUN LAIN
//
// Seluruh fungsi di sini bekerja pada daftar anak milik SATU pendamping
// (yang token sesinya dipakai). Tidak ada tempat kode ini mengubah `akun`
// milik akun lain, maupun `pendamping` yang sedang menempel.

import { supabase, supabaseEnabled } from "./supabase.js";
import { load, update } from "./store.js";

/** Ambil token sesi Supabase yang sedang berjalan. */
async function tokenSesi() {
  if (!supabaseEnabled) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || null;
  } catch {
    return null;
  }
}

/**
 * Satukan catatan perangkat dengan catatan awan untuk SATU anak.
 *
 * Dua identitas memang harus hidup berdampingan dan tidak boleh diseragamkan:
 *
 *   `id`    nanoid pendek milik perangkat. Dipakai sebagai kunci gudang
 *           kemajuan (`s.simpanan`), jadi menggantinya akan memutus seluruh
 *           kemajuan anak.
 *   `awan`  uuid pada tabel `children`. Satu-satunya jalan menautkan anak
 *           ini ke baris `players` miliknya, dan lewat tautan itulah nilai
 *           pemainnya bisa dikelola dari panel admin.
 *
 * Sebelum kolom `awan` ada, tautan ke `players` tidak mungkin dibentuk:
 * perangkat hanya menyimpan nanoid, sementara `players.child_id` menuntut
 * uuid. Akibatnya pengelola bisa melihat seorang anak di panel, tetapi tidak
 * bisa menyentuh nilai pemainnya sama sekali.
 *
 * @param {{id:string,nama:string}} w catatan dari awan
 * @param {object} [lama] catatan perangkat bila anak ini sudah dikenal
 */
function satukanAnak(w, lama) {
  return lama ? { ...lama, awan: w.id } : { id: w.id, nama: w.nama, awan: w.id };
}

/**
 * Terapkan daftar anak dari awan ke sebuah objek simpanan.
 *
 * FUNGSI MURNI: tidak menyentuh localStorage, tidak memanggil jaringan.
 * Sifatnya bisa - dan memang - diuji langsung di Node.
 *
 * Aturannya, berurutan:
 *
 *   1. Bukan daftar / daftar kosong  -> kembalikan apa adanya.
 *      Bukan berarti "hapus", melainkan "tidak ada yang bisa diputuskan".
 *   2. Perangkat belum punya anak    -> ambil semuanya dari awan.
 *   3. Selain itu                    -> cocokkan berdasarkan NAMA.
 *      Anak awan yang tidak dikenal perangkat disisipkan; anak perangkat
 *      yang tidak ada di awan dihapus - di sinilah penghapusan dari panel
 *      admin ikut sampai ke perangkat.
 *   4. Gudang kemajuan anak yang tersisa dipertahankan; anak yang terbuang
 *      gudangnya ikut dibuang supaya tidak menyisakan sampah.
 *
 * @param {object} s         simpanan saat ini
 * @param {Array<{id:string,nama:string}>} awan daftar dari server
 * @returns {object} simpanan baru (atau simpanan lama bila tidak berubah)
 */
export function terapkanDaftarAwan(s, awan) {
  // (1) Kekosongan tidak pernah mengikis apa pun. Lihat catatan di atas.
  if (!Array.isArray(awan) || awan.length === 0) return s;

  const lokal = Array.isArray(s.anak) ? s.anak : [];

  // (2) Perangkat bersih: langsung pakai milik awan.
  if (lokal.length === 0) {
    return { ...s, anak: awan.map((w) => ({ id: w.id, nama: w.nama, awan: w.id })) };
  }

  // (3) Cocokkan berdasarkan nama.
  //
  // Nama dipakai sebagai jembatan karena id perangkat berupa nanoid pendek
  // sementara kolom `children.id` menuntut uuid - keduanya tidak pernah bisa
  // dibandingkan langsung. Nama juga satu-satunya yang dijamin unik per
  // pendamping lewat batas `children_nama_unik`.
  const perNama = new Map(lokal.map((a) => [a.nama, a]));
  const anak = awan.map((w) => satukanAnak(w, perNama.get(w.nama)));

  const idDipakai = new Set(anak.map((a) => a.id));

  // (4) Buang gudang milik anak yang sudah tidak ada.
  const simpanan = {};
  for (const [k, v] of Object.entries(s.simpanan || {})) {
    if (idDipakai.has(k)) simpanan[k] = v;
  }

  // Bila anak yang sedang bermain ikut terhapus, ia harus dilepas - kalau
  // dibiarkan, ia akan tetap dianggap aktif padahal tidak ada lagi di daftar.
  const anakAktif = idDipakai.has(s.anakAktif) ? s.anakAktif : null;

  const hasil = { ...s, anak, simpanan, anakAktif };

  // Tidak ada yang berubah - jangan menulis ulang localStorage tanpa perlu.
  // `awan` ikut diperiksa: uuid anak yang berganti (anak lama dihapus dan
  // yang baru dibuat dengan nama sama) harus merapikan tautannya juga,
  // kalau tidak nilai pemainnya akan tertaut ke baris milik orang lain.
  const berubah =
    anak.length !== lokal.length ||
    anak.some(
      (a, i) => a.id !== lokal[i]?.id || a.nama !== lokal[i]?.nama || a.awan !== lokal[i]?.awan
    ) ||
    anakAktif !== s.anakAktif;

  return berubah ? hasil : s;
}

/**
 * Ambil daftar anak dari awan.
 *
 * @returns {Promise<{ok:boolean, anak?:Array, galat?:string}>}
 */
export async function tarikAnak() {
  const token = await tokenSesi();
  if (!token) return { ok: false, galat: "Belum masuk akun." };

  try {
    const res = await fetch("/api/anak?aksi=tarik", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const teks = await res.text();
    let data = null;
    try {
      data = JSON.parse(teks);
    } catch {
      data = null;
    }
    if (!data) return { ok: false, galat: `Server membalas bukan JSON (${res.status}).` };
    return data;
  } catch {
    return { ok: false, galat: "Gagal menghubungi server." };
  }
}

/**
 * Kirim daftar anak milik akun ini ke awan.
 *
 * Daftar diambil dari perangkat SEKARANG, jadi pemanggil cukup memanggil
 * fungsi ini tanpa perlu meneruskan apa pun setelah mengubah simpanan.
 *
 * @returns {Promise<{ok:boolean, anak?:Array, galat?:string}>}
 */
export async function sampenAnak() {
  const token = await tokenSesi();
  if (!token) return { ok: false, galat: "Belum masuk akun." };

  const anak = Array.isArray(load().anak) ? load().anak : [];

  try {
    const res = await fetch("/api/anak", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ anak }),
      cache: "no-store",
    });
    const teks = await res.text();
    let data = null;
    try {
      data = JSON.parse(teks);
    } catch {
      data = null;
    }
    if (!data) return { ok: false, galat: `Server membalas bukan JSON (${res.status}).` };
    return data;
  } catch {
    return { ok: false, galat: "Gagal menghubungi server." };
  }
}

/**
 * Siklus lengkap dipanggil setiap kali sebuah akun menempel di perangkat.
 *
 * Urutannya penting:
 *
 *   1. TARIK dulu - bila awan sudah punya daftar (mis. sudah pernah disinkronkan
 *      atau pengelola menambah anak), perangkat mengikuti. Perubahan pengelola
 *      langsung terbawa.
 *   2. Bila awan KOSONG, perangkat MENYIAPKAN isi awan dengan mengirim daftarnya.
 *      Ini penyebab tabel `children` awalnya kosong: migrasi baru dibuat dan
 *      belum ada yang pernah mengirim apa pun.
 *
 * Tidak ada yang dikirim bila perangkat tidak punya anak, sehingga akun yang
 * benar-benar kosong tetap terlihat kosong di panel - bukan dipalsukan.
 *
 * Gagal di sini bukan bencana: simpanan lokal tetap utuh dan sinkronisasi
 * dicoba lagi pada pemasangan berikutnya.
 */
export async function sinkronMasuk() {
  const tarik = await tarikAnak();
  if (!tarik.ok) return tarik;

  const awan = Array.isArray(tarik.anak) ? tarik.anak : [];

  if (awan.length === 0) {
    const lokal = Array.isArray(load().anak) ? load().anak : [];
    if (lokal.length === 0) return { ok: true, anak: [] };
    return sampenAnak();
  }

  update((s) => terapkanDaftarAwan(s, awan));

  // Nilai pemain ikut ditarik, supaya suntingan pengelola dari panel admin
  // sampai juga ke perangkat anak. Dilakukan SETELAH daftar diterapkan,
  // sebab penautan baris pemain membutuhkan `awan` yang baru diperbarui.
  await adopsiNilaiPemain();

  return { ok: true, anak: awan };
}

/**
 * Adopsi nilai pemain yang disunting pengelola dari panel admin.
 *
 * CARA KERJANYA - PEMBANDING, BUKAN WAKTU
 *
 * Tabel `players` tidak punya kolom waktu perubahan, sehingga tidak ada
 * cara bertanya "kapan nilai ini terakhir disentuh". Yang dipakai adalah
 * pembanding: setiap kali perangkat mendorong nilai, ia menyimpan salinan
 * angka yang dikirimkannya (`s.pemainCermin`). Pada tarikan berikutnya bila
 * nilai awan BERBEDA dari pembanding itu, berarti seseorang mengubahnya di
 * luar perangkat ini - dan yang diambil adalah nilai awan.
 *
 * Bila awan sama dengan pembanding, tidak ada yang diadopsi: anak memang
 * tidak bermain di tempat lain dan pengelola tidak menyunting apa pun.
 *
 * KEKOSONGAN PEMBANDING TIDAK PERNAH DIARTIKAN SEBAGAI "ADA SUNTINGAN"
 *
 * Perangkat yang belum pernah mendering nilainya tidak mempunyai pembanding,
 * sehingga tidak mungkin membedakan "awan berubah" dari "awan memang begini
 * sejak awal". Dalam keadaan ragu begini nilai awan TIDAK diadopsi. Lebih
 * baik suntingan pengelola terlihat pada tarikan berikutnya, daripada
 * kemajuan anak yang sebenarnya tertimpa oleh angka lama di basis data.
 *
 * Kegalatan di sini bukan bencana: nilai awan tidak berubah dan percobaan
 * berikutnya akan mengambilnya lagi.
 *
 * @returns {Promise<{ok:boolean, perubahan?:boolean, reason?:string}>}
 */
export async function adopsiNilaiPemain() {
  if (!supabaseEnabled) return { ok: false, reason: "supabase nonaktif" };

  const s = load();
  const anak = (s.anak || []).find((a) => a.id === s.anakAktif);
  if (!anak || !anak.awan) return { ok: false, reason: "anak aktif belum bertaut" };

  try {
    const { data, error } = await supabase
      .from("players")
      .select("id, coins, xp, streak")
      .eq("child_id", anak.awan)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return { ok: false, reason: error.message };
    if (!data) return { ok: false, reason: "anak ini belum punya catatan pemain" };

    const cermin = s.pemainCermin;
    const punyaPembanding = Boolean(cermin) && s.playerId === data.id;

    if (!punyaPembanding) {
      // Perangkat ini belum pernah mendorong nilainya, jadi tidak mungkin
      // membedakan "awan berubah" dari "awan memang begini sejak awal". Yang
      // diadopsi hanya bila perangkatnya benar-benar MASIH KOSONG - persis
      // keadaan anak yang belum pernah bermain, padahal pengelola sudah
      // menyiapkan nilai awalnya lewat panel. Tanpa cabang ini, suntingan
      // pengelola tidak akan pernah terbaca oleh anak yang belum bermain,
      // dan tombol Edit Data terasa tidak berpengaruh apa pun.
      //
      // Kalau di perangkat ini ada kemajuan nyata, kemajuan itulah yang
      // dipertahankan. Lebih baik pengelola mengulang suntingannya nanti,
      // daripada kemajuan anak hilang gara-gara satu baris awan yang belum
      // sempat disinkronkan.
      const masihKosong =
        !s.playerId &&
        !s.coins &&
        !s.xp &&
        Object.values(s.islands || {}).every((i) => !i || !i.done);
      if (!masihKosong) return { ok: true, perubahan: false };
    } else if (
      cermin.coins === data.coins &&
      cermin.xp === data.xp &&
      cermin.streak === data.streak
    ) {
      // Awan dan perangkat sama persis: anak tidak bermain di tempat lain
      // dan pengelola tidak menyunting apa pun. Tidak ada yang perlu ditulis.
      return { ok: true, perubahan: false };
    }

    update((s2) => {
      s2.coins = data.coins;
      s2.xp = data.xp;
      s2.streak = data.streak;
      s2.playerId = data.id;
      s2.pemainCermin = { coins: data.coins, xp: data.xp, streak: data.streak };
      return s2;
    });

    return { ok: true, perubahan: true };
  } catch (e) {
    return { ok: false, reason: e && e.message ? e.message : String(e) };
  }
}
