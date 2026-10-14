// ============================================================
// Profil Anak pada Akun Pendamping.
//
// IDE UTAMA: satu Akun Pendamping memuat banyak profil anak. Yang berpindah
// saat anak berganti adalah SELURUH simpanan permainannya, bukan sekadar
// nama. Jadi tiap anak punya koin, energi, dan kemajuan pulau sendiri-
// sendiri, sementara logika permainan di lib/store.js TIDAK PERLU DIUBAH
// sama sekali.
//
// Kenapa cara ini dipilih?
// Karena lib/store.js sudah lulus 106 ujian yang semuanya membaca
// `load()`/`update()` secara langsung. Kalau kemajuan tiap anak dipindah ke
// struktur bersarang (`progres[anakId].islands`), seluruh fungsi store dan
// seluruh ujian harus disentuh. Dengan menukar blob simpanan, `load()`
// tetap mengembalikan "simpanan anak yang sedang aktif" persis seperti
// sediakala.
//
// PEMBATAS: hanya KUNCI_PERMAINAN yang ikut berpindah. Kunci akun
// (`pendamping`, `anak`, `anakAktif`, `simpanan`) menempel pada perangkat
// dan tidak pernah diwariskan ke profil anak mana pun.
// ============================================================

import { load, persist, update, emptySave } from "./store.js";

/**
 * Angkat kemajuan anak yang sedang aktif dari blob TERATAS ke gudang
 * `simpanan[anakAktif]`.
 *
 * Saat seorang anak bermain, kemajuannya menempel di blob posisi teratas
 * (hasil penukaran `pilihAnak`), bukan di gudang. Kalau blob itu dibuang
 * tanpa dipindah lebih dulu, kemajuannya ikut hilang - itulah penyebab
 * "kok anaknya malah ke-reset" padahal daftar anaknya masih terbaca.
 *
 * @param {object} s simpanan saat ini
 * @returns {{anak: Array, simpanan: Object}} pasangan yang sudah aman
 */
function angkatAnakAktif(s) {
  const anak = Array.isArray(s.anak) ? s.anak : [];
  const simpanan = { ...(s.simpanan || {}) };
  if (s.anakAktif && anak.some((a) => a.id === s.anakAktif)) {
    simpanan[s.anakAktif] = ambilPermainan(s);
  }
  return { anak, simpanan };
}

/**
 * Mulai bermain sebagai TAMU.
 *
 * Aturannya:
 *   - Blob permainan AKTIF dibuang hanya bila masih dipegang akun
 *     (`pendamping`/`anakAktif` ada), supaya tamu tidak mewarisi koin,
 *     pulau, dan kostum anak. Tamu murni tetap menyimpan kemajuannya.
 *   - Daftar anak dan gudang simpanannya SELALU dipertahankan. Itu milik
 *     Akun Pendamping; menghapusnya di sini membuat daftar anak raip tiap
 *     kali orang tua sempat mencoba mode tamu.
 *   - `pendamping` dan `anakAktif` dipaksa null agar pemain benar-benar
 *     dihitung tamu, bukan orang yang sedang menyamar.
 *
 * @param {string} nama nama panggilan tamu
 * @returns {object} simpanan baru
 */
export function mulaiTamu(nama) {
  let hasil = null;

  update((s) => {
    const jejakAkun = Boolean(s.pendamping) || Boolean(s.anakAktif);
    const { anak, simpanan } = angkatAnakAktif(s);

    hasil = {
      ...(jejakAkun ? emptySave() : s),
      pendamping: null,
      anakAktif: null,
      anak,
      simpanan,
      nickname: String(nama || "").trim().slice(0, 18) || "Penjelajah",
    };
    return hasil;
  });

  return hasil;
}

/**
 * Kunci simpanan yang dimiliki SETIAP ANAK.
 *
 * Menambah kunci di sini artinya menambah kemajuan yang bisa dibawa anak
 * saat berganti profil. Kunci akun sengaja tidak ada di daftar ini.
 */
const KUNCI_PERMAINAN = [
  "nickname",
  "playerId",
  "coins",
  "xp",
  "streak",
  "lastPlayDate",
  "playSeconds",
  "islands",
  "costumes",
  "equipped",
  "totalCorrect",
  "totalWrong",
  "stamina",
  "staminaAt",
  "rewardDate",
  "rewardDay",
];

/** Ambil hanya kemajuan permainan dari sebuah simpanan. */
function ambilPermainan(s) {
  const out = {};
  for (const k of KUNCI_PERMAINAN) {
    if (k in s) out[k] = s[k];
  }
  return out;
}

/** Apakah perangkat ini tertaut ke Akun Pendamping? */
export function adaAkunPendamping(s) {
  return Boolean((s || load()).pendamping);
}

/**
 * Daftar profil anak yang tersimpan di akun Pendamping ini.
 * @returns {Array<{id:string,nama:string}>}
 */
export function daftarAnak(s) {
  const save = s || load();
  return Array.isArray(save.anak) ? save.anak : [];
}

/** Berapa banyak anak yang sudah didaftarkan. */
export const MAKS_ANAK = 6;

/**
 * Tambah profil anak baru.
 *
 * Hanya menambah daftar; tidak mengganti anak yang sedang bermain, karena
 * yang memanggil biasanya orang tua yang sedang menyiapkan akun, bukan anak
 * yang sedang bermain.
 *
 * @param {string} nama nama panggilan anak (maks 18 karakter)
 * @returns {{ok:boolean, alasan?:string, id?:string}}
 */
export function tambahAnak(nama) {
  const bersih = String(nama || "").trim().slice(0, 18);
  if (!bersih) return { ok: false, alasan: "Nama anak belum diisi." };

  let idBaru = null;
  update((s) => {
    const anak = Array.isArray(s.anak) ? s.anak : [];
    if (anak.length >= MAKS_ANAK) return s;
    // ID berbasis waktu supaya tidak perlu generator acak - generator acak
    // akan membuat hasil server dan hasil render berbeda saat hidrasi.
    idBaru = `a${Date.now().toString(36)}${anak.length}`;
    return { ...s, anak: [...anak, { id: idBaru, nama: bersih }] };
  });

  if (!idBaru) {
    return { ok: false, alasan: `Maksimal ${MAKS_ANAK} profil anak.` };
  }
  return { ok: true, id: idBaru };
}

/**
 * Ganti anak yang sedang bermain.
 *
 * Simpanan anak lama diletakkan ke `simpanan[anakLama]`, lalu simpanan anak
 * tujuan diangkat menjadi simpanan aktif. Anak pertama kali dipilih akan
 * memulai dari simpanan kosong - bukan mewarisi milik anak lain.
 *
 * @param {string} id id profil anak yang dipilih
 * @returns {object|null} simpanan baru, atau null kalau id tidak dikenal
 */
export function pilihAnak(id) {
  if (!id) return null;
  let hasil = null;

  update((s) => {
    const anak = Array.isArray(s.anak) ? s.anak : [];
    if (!anak.some((a) => a.id === id)) return s;

    const simpanan = { ...(s.simpanan || {}) };
    // Simpanan anak yang sedang aktif selalu ada di posisi teratas, jadi
    // dia harus dikembalikan ke gudangnya sebelum anak lain diambil.
    if (s.anakAktif && s.anakAktif !== id) {
      simpanan[s.anakAktif] = ambilPermainan(s);
    }

    const sumber = simpanan[id] || null;
    const tujuan = anak.find((a) => a.id === id);
    hasil = {
      ...emptySave(),
      ...(sumber || {}),
      // Nama tampilan selalu mengikuti profil anak yang dipilih.
      // Tanpa baris ini, anak baru memulai dengan nickname kosong sehingga
      // HUD menampilkan ruang kosong tempat nama seharusnya berada.
      nickname: tujuan ? tujuan.nama : "",
      // Kunci akun tidak pernah ikut pindah ke profil anak.
      pendamping: s.pendamping || null,
      anak,
      anakAktif: id,
      simpanan,
    };
    return hasil;
  });

  if (hasil) persist(hasil);
  return hasil;
}

/**
 * Hapus profil anak beserta kemajuannya.
 * Tindakan ini tidak bisa dibatalkan, jadi hanya dipanggil dari tombol yang
 * sudah dikonfirmasi pengguna.
 */
export function hapusAnak(id) {
  return update((s) => {
    const anak = (Array.isArray(s.anak) ? s.anak : []).filter((a) => a.id !== id);
    const simpanan = { ...(s.simpanan || {}) };
    delete simpanan[id];

    const next = { ...s, anak, simpanan };
    if (s.anakAktif === id) {
      // Anak yang dihapus sedang bermain: kembalikan ke keadaan awal
      // supaya tidak menyisakan kemajuan miliknya di layar.
      return {
        ...emptySave(),
        pendamping: s.pendamping || null,
        anak,
        anakAktif: null,
        simpanan,
        nickname: "",
      };
    }
    return next;
  });
}

/**
 * Keluar dari Akun Pendamping: lepas PERANGKAT ini dari akun.
 *
 * Yang dihapus: sakelar `pendamping`, anak yang sedang aktif, dan blob
 * permainan AKTIF. Yang DIPERTAHANKAN: daftar anak beserta gudang
 * kemajuan mereka.
 *
 * Mengapa dipertahankan? Karena keluar bukan berarti akunnya dihapus.
 * Orang tua harus bisa keluar lalu masuk lagi dan menemukan anak-anaknya
 * utuh seperti sediakala. Dulu ketiganya ikut dibuang, sehingga setiap
 * keluar-masuk daftar anak raib.
 *
 * Mengapa blob aktif tetap dibuang? Blob posisi teratas adalah milik anak
 * yang terakhir bermain. Bila dibiarkan, tamu berikutnya yang menekan
 * "Mulai Bermain" akan mewarisi koin, pulau, dan kostumnya.
 *
 * Karena kemajuan anak yang sedang aktif ada di blob teratas (bukan di
 * gudang), ia disimpan lebih dulu ke `simpanan[anakAktif]` supaya tidak
 * ikut hilang.
 *
 * @returns {object} simpanan baru
 */
export function lepasProfil() {
  let hasil = null;

  update((s) => {
    const { anak, simpanan } = angkatAnakAktif(s);

    hasil = {
      ...emptySave(),
      anak,
      anakAktif: null,
      simpanan,
    };
    return hasil;
  });

  return hasil;
}
