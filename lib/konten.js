// ============================================================
// Lapisan konten: bawaan -> naskah -> awan -> permainan
// ============================================================
//
// CARA KERJANYA SINGKAT
//
//   1. lib/gameData.js   berisi ISLANDS + MISSIONS sebagai ISI BAWAAN yang
//                        dikirim bersama halaman. Inilah yang dipakai bila
//                        tidak ada apa pun di awan - persis perilaku situs
//                        sebelum fitur ini ada.
//   2. naskah (draft)    suntingan developer, disimpan di localStorage
//                        perangkat developer. BELUM BERLAKU untuk pemain.
//   3. awan              hasil tombol "Terapkan Update", ditulis ke tabel
//                        `planets` + `missions` lewat /api/admin.
//   4. overlay           isi awan MENGGANTI isi bawaan di tempat, lewat
//                        mutasi pada objek yang sama sehingga seluruh
//                        berkas yang mengimpor ISLANDS/MISSIONS ikut melihat
//                        isinya yang baru tanpa perlu diubah satu per satu.
//
// MENGAPA MUTASI, BUKAN PERGANTIAN OBJEK
//
//   ISLANDS dan MISSIONS diimpor sebagai konstanta oleh tujuh berkas, dan
//   beberapa di antaranya memakainya di luar komponen React. Menggantikan
//   objeknya dengan yang baru hanya mengubah berkas yang mengimpor langsung;
//   berkas lain tetap memegang objek lama. Mengubah ISI objeknya membuat
//   semua referensi ikut terbaca, tanpa menyentuh satu pun berkas pemakai.
//
// ATURAN PALING PENTING: KONTEN RUSAK TIDAK PERNAH MENGGANTIKAN BAWAAN
//
//   Satu baris JSON yang cacat cukup untuk membuat peta kosong atau misi
//   tanpa soal, dan anak-anak akan melihatnya - bukan developer. Karena itu
//   setiap muatan diperiksa dulu secara utuh (SELURUH planet, SELURUH misi,
//   SELURUH putaran). Ada satu yang gagal -> seluruh muatan dibuang dan
//   isi bawaan tetap dipakai. Tidak ada "setengah terpasang".

import { supabase, supabaseEnabled } from "./supabase.js";
import { ISLANDS, MISSIONS } from "./gameData.js";
import { DAILY_SLUG } from "./missionsExtra.js";
import { TRIAL_SLUG } from "./trialIsland.js";
import { periksaKonten, TIPE_MISI } from "./validasiKonten.js";

/** Penanda versi di awan. Bumped setiap kali developer menekan Terapkan. */
export const KUNCI_AWAN = "zippyverse_kontenAwan_v1";

/** Naskah developer (belum diterapkan). */
export const KUNCI_DRAF = "zippyverse_kontenDraf_v1";

/**
 * Pemeriksaan ada di lib/validasiKonten.js (murni, tanpa impor) supaya bisa
 * dipakai peramban DAN server tanpa menarik graf modul permainan.
 * Diteruskan kembali dari sini supaya penyunting cukup mengimpor satu berkas.
 */
export { periksaKonten, TIPE_MISI };

// ---------------------------------------------------------------
// Salinan suci isi bawaan - dipakai untuk memulihkan keadaan awal
// ---------------------------------------------------------------
// Diambil SEBELUM overlay pertama dijalankan, sehingga selalu berisi
// isi pabrik apa adanya.
const AWAL_ISLANDS = Object.freeze(ISLANDS.map((i) => ({ ...i })));
const AWAL_MISSIONS = deepCopy(MISSIONS);

function deepCopy(x) {
  try {
    return JSON.parse(JSON.stringify(x));
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------
// Penyimpanan perangkat
// ---------------------------------------------------------------

function bacaJson(kunci) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(kunci);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function tulisJson(kunci, nilai) {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(kunci, JSON.stringify(nilai));
    return true;
  } catch {
    // Kuota penuh atau mode privat: konten gagal disimpan, tetapi permainan
    // tetap jalan memakai isi bawaan. Gagal simpan bukan alasan untuk
    // menggagalkan halaman.
    return false;
  }
}

// ---------------------------------------------------------------
// Salinan kerja (naskah developer)
// ---------------------------------------------------------------

/**
 * Salinan kerja untuk disunting.
 *
 * Bila pernah ada naskah tersimpan, naskah itulah yang dibuka - supaya
 * suntingan yang belum sempat diterapkan tidak hilang hanya karena halaman
 * dimuat ulang. Kalau belum pernah ada, isi awan dipakai; kalau awan juga
 * kosong, isi bawaan.
 *
 * @returns {{planets: Array, missions: Object}|null}
 */
export function bacaDraf() {
  const d = bacaJson(KUNCI_DRAF);
  if (d && Array.isArray(d.planets) && d.missions && typeof d.missions === "object") return d;
  const awan = bacaJson(KUNCI_AWAN);
  if (awan && Array.isArray(awan.planets) && awan.missions) return awan;
  return { planets: AWAL_ISLANDS.map((p) => ({ ...p })), missions: deepCopy(AWAL_MISSIONS) };
}

/** Simpan naskah. Mengembalikan false bila penyimpanan gagal (kuota/pribadi). */
export function tulisDraf(isi) {
  return tulisJson(KUNCI_DRAF, isi);
}

/** Buang naskah supaya kembali ke isi yang sedang berlaku di awan. */
export function hapusDraf() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KUNCI_DRAF);
  } catch {
    /* abaikan */
  }
}

/** Apakah ada suntingan yang belum diterapkan? */
export function adaDraf() {
  const d = bacaJson(KUNCI_DRAF);
  if (!d) return false;
  const awan = bacaJson(KUNCI_AWAN);
  try {
    return JSON.stringify(d) !== JSON.stringify(awan || isiAwal());
  } catch {
    return true;
  }
}

function isiAwal() {
  return { planets: AWAL_ISLANDS.map((p) => ({ ...p })), missions: deepCopy(AWAL_MISSIONS) };
}

// ---------------------------------------------------------------
// Overlay - ganti isi bawaan di tempat
// ---------------------------------------------------------------

/**
 * Ganti ISLANDS dan MISSIONS di tempat dengan isi yang sudah diperiksa.
 *
 * @param {{planets:Array, missions:Object}|null} isi  null = kembali bawaan
 */
export function terapkanKonten(isi) {
  // null = kembalikan ke isi bawaan (dipakai bila awan kosong atau muatan
  // gagal pemeriksaan di tengah jalan).
  if (isi === null || isi === undefined) {
    pulihkanBawaan();
    return { ok: true, pulih: true };
  }

  const hasil = periksaKonten(isi);
  if (!hasil.sah) return { ok: false, galat: hasil.galat };

  // --- Pulau: ganti isi array, jangan ganti arraynya.
  const baru = isi.planets.map((p) => ({ ...p }));

  // Pengaman: Pulau Perkenalan dan Tantangan Harian tidak boleh lenyap.
  // Tamu hanya boleh memainkan pulau perkenalan, dan bila ia hilang maka
  // pengunjung belum masuk akun sama sekali tidak punya apa pun untuk
  // dimainkan. Developer memang tidak pernah menghapusnya lewat panel
  // (keduanya tidak muncul di daftar kelola pulau), tetapi naskah yang
  // disunting tangan bisa saja kehilangan keduanya.
  for (const jaga of AWAL_ISLANDS) {
    if ((jaga.trial || jaga.daily) && !baru.some((x) => x.slug === jaga.slug)) {
      // Disisipkan di DEPAN, bukan di belakang: Pulau Perkenalan memang
      // berada di urutan pertama pada rantai pulau, dan menaruhnya di ujung
      // akan membuat garis rantai di halaman peta melewati seluruh pulau
      // hanya untuk kembali ke titik awal.
      baru.unshift({ ...jaga });
    }
  }

  ISLANDS.splice(0, ISLANDS.length, ...baru);

  // --- Misi: bersihkan kunci lama, isi ulang.
  for (const k of Object.keys(MISSIONS)) delete MISSIONS[k];

  let terisi = 0;
  for (const [slug, daftar] of Object.entries(isi.missions)) {
    if (!slugAdaDi(baru, slug)) continue;
    MISSIONS[slug] = (daftar || []).map((m) => ({ ...m, rounds: (m.rounds || []).map((r) => ({ ...r })) }));
    terisi += MISSIONS[slug].length;
  }

  // Jagaan sama seperti pulau: kedua slug ini tidak pernah berada di tabel
  // planets, jadi tidak pernah ikut terkirim dari awan. Tanpanya Tantangan
  // Harian hilang dari menu anak dan tamu kehilangan satu-satunya pulau
  // yang boleh ia mainkan.
  for (const slugJaga of JAGAAN_MISSIONS) {
    if (!Array.isArray(MISSIONS[slugJaga]) || MISSIONS[slugJaga].length === 0) {
      MISSIONS[slugJaga] = deepCopy(AWAL_MISSIONS[slugJaga] || []);
    }
  }

  if (terisi === 0) {
    // Tidak ada misi yang berhasil dipasang - kembalikan semuanya, jangan
    // biarkan peta penuh pulau tanpa satu pun isi misi.
    pulihkanBawaan();
    return { ok: false, galat: ["Muatan tidak memuat misi yang bisa dipasang."] };
  }

  return { ok: true, jumlahPulau: baru.length, jumlahMisi: terisi };
}

function slugAdaDi(daftar, slug) {
  return daftar.some((x) => x.slug === slug);
}

/** Kembalikan seluruh isi ke keadaan pabrik. */
export function pulihkanBawaan() {
  ISLANDS.splice(0, ISLANDS.length, ...AWAL_ISLANDS.map((i) => ({ ...i })));
  for (const k of Object.keys(MISSIONS)) delete MISSIONS[k];
  Object.assign(MISSIONS, deepCopy(AWAL_MISSIONS));
}

/**
 * Sidik jari isi yang sedang terpasang.
 *
 * Dipakai untuk menentukan apakah isi barusan benar-benar BERUBAH. Tanpa ini,
 * setiap pemuatan halaman akan "memasang ulang" konten yang isinya sama
 * persis - dan karena pemasangan ulang merestart komponen, anak yang sedang
 * berada di tengah misi akan terlempar keluar tanpa alasan.
 *
 * @returns {string}
 */
export function jariKonten() {
  try {
    return JSON.stringify({ p: ISLANDS, m: MISSIONS });
  } catch {
    return "tak-terhitung";
  }
}

// Slug dua pulau khusus yang tidak pernah berada di tabel planets:
// Tantangan Harian disimpan dengan slug sendiri supaya bisa dipakai di
// halaman pulau yang sama, dan Pulau Perkenalan hanya ada di sisi klien.
const JAGAAN_MISSIONS = [DAILY_SLUG, TRIAL_SLUG];

// ---------------------------------------------------------------
// Muat dari awan
// ---------------------------------------------------------------

/**
 * Ambil isi yang sedang BERLAKU dari Supabase, lalu pasang.
 *
 * Baca dilakukan langsung dengan kunci anon karena kebijakan RLS untuk
 * `planets` dan `missions` memang membaca publik - halaman peta dan halaman
 * pulau membutuhkannya, termasuk bagi pengunjung yang belum mendaftar.
 *
 * @returns {Promise<{ok:boolean, versi?:string, galat?:string}>}
 */
export async function muatKontenAwan() {
  if (!supabaseEnabled || !supabase) return { ok: false, galat: "Supabase belum dikonfigurasi." };

  try {
    const [{ data: planets, error: e1 }, { data: missions, error: e2 }] = await Promise.all([
      supabase.from("planets").select("*").eq("aktif", true),
      supabase.from("missions").select("*").eq("aktif", true),
    ]);

    if (e1 || e2) {
      // Baca gagal: bukan berarti kontennya kosong. Dibiarkan memakai isi
      // yang tersimpan (atau bawaan) - kegagalan jaringan sekecil apa pun
      // tidak boleh mengosongkan peta.
      return { ok: false, galat: e1?.message || e2?.message || "Gagal membaca konten." };
    }
    if (!planets || planets.length === 0) {
      // Belum pernah ada yang diterapkan. Bawaan tetap dipakai, dan ini
      // bukan kesalahan.
      return { ok: true, kosong: true, versi: null };
    }

    const isi = susunDariTabel(planets, missions || []);
    const hasil = periksaKonten(isi);
    if (!hasil.sah) {
      // Ada baris di awan tapi bentuknya tidak layak. Jangan sentuh apa pun.
      return { ok: false, galat: "Konten di awan tidak lolos pemeriksaan: " + hasil.galat[0] };
    }

    const versi = versiDari(planets, missions || []);
    const lama = bacaJson(KUNCI_AWAN);
    const sama = lama && lama.versi === versi;

    if (!sama) tulisJson(KUNCI_AWAN, { versi, planets: isi.planets, missions: isi.missions });

    const pasang = terapkanKonten(isi);
    if (!pasang.ok) return { ok: false, galat: pasang.galat.join(" ") };

    return { ok: true, versi, berubah: !sama, ...pasang };
  } catch (err) {
    return { ok: false, galat: err?.message || "Gagal menghubungi server." };
  }
}

/** Gabungkan baris tabel menjadi bentuk { planets, missions }. */
export function susunDariTabel(planets, missions) {
  const urut = (a, b) => (a.urutan ?? 0) - (b.urutan ?? 0);

  const isiPlanet = planets.slice().sort(urut).map((t) => ({
    slug: t.slug,
    name: t.name,
    subject: t.subject ?? null,
    icon: t.icon ?? null,
    color: t.color ?? null,
    tagline: t.tagline ?? null,
    // Kolom di tabel bernama `description`; bentuk internal aplikasi `desc`.
    // Penerjemahan terbalik dibanding app/api/admin/route.js yang MENULIS.
    desc: t.description ?? null,
    positions: t.positions || {},
    pos: (t.positions && (t.positions.lg || t.positions.md)) || undefined,
    soon: !!t.soon,
    available: !t.soon,
    trial: t.slug === TRIAL_SLUG,
  }));

  const missionsPerSlug = {};
  const perPlanets = new Map(isiPlanet.map((p) => [p.slug, p]));

  const urutMisi = missions.slice().sort((a, b) => (a.urutan ?? 0) - (b.urutan ?? 0));
  for (const m of urutMisi) {
    if (!perPlanets.has(m.planet_slug)) continue; // milik planet yang sudah dihapus
    if (!missionsPerSlug[m.planet_slug]) missionsPerSlug[m.planet_slug] = [];
    const urutan = missionsPerSlug[m.planet_slug].length;
    missionsPerSlug[m.planet_slug].push({
      // Baris di database selalu berisi uuid. Cadangan di bawah hanya untuk
      // berjaga: `id` adalah kunci pemeriksaan keunikan, dan satu baris
      // bernilai NULL akan membuat seluruh muatan tertolak - padahal yang
      // salah cuma satu kolom.
      id: m.id || `t${m.planet_slug}-${urutan}`,
      type: m.tipe,
      name: m.nama || `Misi ${urutan + 1}`,
      title: m.title || m.nama || `Misi ${urutan + 1}`,
      subtitle: m.subtitle || "",
      rounds: Array.isArray(m.rounds) ? m.rounds : [],
      reward: typeof m.reward === "number" ? m.reward : 50,
      xp: typeof m.xp === "number" ? m.xp : 35,
      ...(m.duration ? { duration: m.duration } : {}),
    });
  }

  return { planets: isiPlanet, missions: missionsPerSlug };
}

/** Versi = perubahan terbaru di kedua tabel. */
function versiDari(planets, missions) {
  const semua = [...planets, ...missions].map((r) => r.updated_at || r.created_at || "");
  semua.sort();
  return semua[semua.length - 1] || "kosong";
}

/**
 * Terapkan isi awan yang tersimpan di perangkat (bila ada).
 *
 * Dipanggil sekali saat modul dimuat, SEBELUM berkas mana pun menghitung
 * nilai dari ISLANDS/MISSIONS - sehingga halaman yang menghitung konstanta
 * di tingkat modul pun sudah melihat isi yang benar.
 *
 * @returns {boolean} ada isi awan yang dipasang
 */
export function terapkanTersimpan() {
  const awan = bacaJson(KUNCI_AWAN);
  if (!awan || !Array.isArray(awan.planets)) return false;
  const hasil = terapkanKonten(awan);
  return hasil.ok;
}

// Pasang yang tersimpan begitu modul ini dibuka. Pemeriksaan di dalamnya
// sudah menolak muatan rusak, jadi tidak ada risiko halaman ini membuka
// permainan dengan isi cacat.
if (typeof window !== "undefined") {
  terapkanTersimpan();
}
