// ============================================================
// Pemeriksaan konten pulau & misi
// ============================================================
//
// Berkas ini MURNI: tidak mengimpor apa pun, tidak menyentuh peramban,
// tidak memanggil jaringan. Sengaja - pemeriksaan yang sama harus dijalankan
// DI DUA TEMPAT yang tidak boleh saling percaya:
//
//   1. Peramban  menolak konten awan yang rusak SEBELUM menyentuh permainan,
//                supaya peta tidak pernah kosong di layar anak.
//   2. Server    menolak naskah yang rusak SEBELUM ditulis ke awan, supaya
//                satu klik "Terapkan" dari formulir yang salah tidak
//                mengganti isi situs untuk SELURUH pemain.
//
// Kalau validator ada di dalam berkas yang mengimpor Supabase dan gameData,
// sisi server akan ikut menarik seluruh graf modul permainan - dan uji Node
// yang memuat berkas ini akan runtuh karena peramban tidak ada.
//
// ATURAN: SEMUA ATAU TIDAK SAMA SEKALI
//
// Satu baris JSON yang cacat cukup membuat pulau tampil tanpa isi misi.
// Karena itu pemeriksaan berjalan untuk SELURUH muatan; ada satu yang gagal,
// seluruh muatan ditolak. Tidak ada "setengah terpasang".

/** Tipe misi yang dikenal pemain. Sama persis dengan CHECK di MIGRASI.sql. */
export const TIPE_MISI = ["mcq", "scramble", "order", "dragcount", "blitz", "boss"];

/** Batas-batas yang dipakai panel saat menyunting, dicek ulang di sini. */
export const BATAS = {
  pulau: 40,
  misiPerPulau: 12,
  putaranPerMisi: 60,
  panjangNamaPulau: 60,
  panjangJudul: 80,
  panjangTagline: 90,
  panjangDesc: 240,
};

const slugPantas = (s) => typeof s === "string" && /^[a-z0-9-]{1,40}$/.test(s);

/**
 * Periksa satu planet.
 * @param {any} p
 * @returns {string|null} pesan galat, atau null bila sah
 */
function periksaPlanet(p) {
  if (!p || typeof p !== "object" || Array.isArray(p)) return "planet bukan objek";
  if (!slugPantas(p.slug)) return `slug "${p?.slug}" tidak sah (huruf kecil, angka, strip)`;
  if (typeof p.name !== "string" || !p.name.trim()) return `planet ${p.slug} tanpa nama`;
  if (p.name.length > BATAS.panjangNamaPulau) {
    return `nama planet ${p.slug} terlalu panjang (maks ${BATAS.panjangNamaPulau})`;
  }
  if (p.tagline != null && String(p.tagline).length > BATAS.panjangTagline) {
    return `tagline ${p.slug} terlalu panjang (maks ${BATAS.panjangTagline})`;
  }
  if (p.desc != null && String(p.desc).length > BATAS.panjangDesc) {
    return `deskripsi ${p.slug} terlalu panjang (maks ${BATAS.panjangDesc})`;
  }
  if (p.color != null && p.color !== "" && !/^#[0-9a-f]{3,8}$/i.test(String(p.color))) {
    return `warna ${p.slug} bukan heksadesimal (contoh: #FFC93C)`;
  }
  if (p.icon != null && typeof p.icon !== "string") return `ikon ${p.slug} bukan teks`;
  if (p.icon && p.icon.length > 200) return `ikon ${p.slug} terlalu panjang (maks 200)`;

  // Halaman peta menghitung garis rantai dengan parseFloat atas persentase
  // ini. Angka yang bukan angka membuat garis melayang ke NaN lalu putus,
  // jadi setidaknya `lg` (desktop) harus terbaca sebagai persentase.
  const pos = p.positions || {};
  const lg = pos.lg || p.pos;
  if (!lg || typeof lg.top !== "string" || typeof lg.left !== "string") {
    return `planet ${p.slug} tanpa posisi lg`;
  }
  if (isNaN(parseFloat(lg.top)) || isNaN(parseFloat(lg.left))) {
    return `posisi lg planet ${p.slug} bukan persentase angka (contoh: "8%")`;
  }
  return null;
}

/** Bentuk putaran berbeda tiap tipe - sengaja diperiksa satu per satu. */
function periksaPutaran(tipe, r, i) {
  const w = (t) => `putaran ${i + 1} (tipe ${tipe}): ${t}`;
  if (!r || typeof r !== "object" || Array.isArray(r)) return w("bukan objek");

  if (tipe === "dragcount") {
    if (typeof r.count !== "number" || r.count < 1) return w("jumlah benda tidak sah");
    if (!Array.isArray(r.options) || r.options.length < 2) return w("pilihan kurang dari dua");
    if (!r.options.includes(r.count)) return w("jawaban benar tidak ada di daftar pilihan");
    if (typeof r.emoji !== "string" || !r.emoji) return w("emoji kosong");
    return null;
  }

  if (tipe === "scramble") {
    if (typeof r.answer !== "string" || !r.answer.trim()) return w("jawaban kosong");
    if (typeof r.scrambled !== "string" || !r.scrambled.trim()) return w("huruf acak kosong");
    return null;
  }

  if (tipe === "order") {
    if (!Array.isArray(r.items) || r.items.length < 2) return w("daftar urutan kurang dari dua");
    if (!Array.isArray(r.answer) || r.answer.length !== r.items.length) {
      return w("panjang jawaban berbeda dari daftar urutan");
    }
    return null;
  }

  // mcq, blitz, boss
  if (typeof r.q !== "string" || !r.q.trim()) return w("pertanyaan kosong");
  if (!Array.isArray(r.o) || r.o.length < 2) return w("pilihan kurang dari dua");
  if (!r.o.includes(r.a)) return w("jawaban benar tidak ada di daftar pilihan");
  return null;
}

/**
 * Periksa satu misi beserta seluruh putarannya.
 * @param {any} m
 * @returns {string|null}
 */
function periksaMisi(m) {
  if (!m || typeof m !== "object" || Array.isArray(m)) return "misi bukan objek";
  if (typeof m.id !== "string" || !m.id) return "misi tanpa id";
  if (m.id.length > 60) return `id misi ${m.id} terlalu panjang`;
  if (!TIPE_MISI.includes(m.type)) {
    return `misi ${m.id} bertipe "${m.type}" yang tidak dikenal (harus salah satu dari: ${TIPE_MISI.join(", ")})`;
  }
  if (typeof m.title !== "string" || !m.title.trim()) return `misi ${m.id} tanpa judul`;
  if (m.title.length > BATAS.panjangJudul) {
    return `judul misi ${m.id} terlalu panjang (maks ${BATAS.panjangJudul})`;
  }
  if (!Array.isArray(m.rounds) || m.rounds.length === 0) {
    return `misi ${m.id} tidak punya putaran soal`;
  }
  if (m.rounds.length > BATAS.putaranPerMisi) {
    return `misi ${m.id} terlalu banyak putaran (maks ${BATAS.putaranPerMisi})`;
  }
  if (typeof m.reward !== "number" || !isFinite(m.reward) || m.reward < 0) {
    return `hadiah koin misi ${m.id} tidak sah`;
  }
  if (typeof m.xp !== "number" || !isFinite(m.xp) || m.xp < 0) return `XP misi ${m.id} tidak sah`;
  if (m.duration != null && (typeof m.duration !== "number" || m.duration < 5)) {
    return `durasi misi ${m.id} tidak sah (min 5 detik)`;
  }

  for (let i = 0; i < m.rounds.length; i++) {
    const galat = periksaPutaran(m.type, m.rounds[i], i);
    if (galat) return `misi "${m.title}": ${galat}`;
  }
  return null;
}

/**
 * Periksa SELURUH muatan sekaligus.
 *
 * @param {{planets?:Array, missions?:Object}} isi
 * @returns {{sah:boolean, galat:string[]}}
 */
export function periksaKonten(isi) {
  const galat = [];

  if (!isi || typeof isi !== "object") {
    return { sah: false, galat: ["Muatan bukan objek { planets, missions }."] };
  }
  if (!Array.isArray(isi.planets)) return { sah: false, galat: ["Daftar planet bukan larik."] };
  if (!isi.missions || typeof isi.missions !== "object" || Array.isArray(isi.missions)) {
    return { sah: false, galat: ["Daftar misi bukan objek."] };
  }

  if (isi.planets.length === 0) galat.push("Tidak ada satu pun planet.");
  if (isi.planets.length > BATAS.pulau) {
    galat.push(`Jumlah planet melebihi batas ${BATAS.pulau}.`);
  }

  const slugAda = new Set();
  for (const p of isi.planets) {
    const g = periksaPlanet(p);
    if (g) galat.push(g);
    if (p && typeof p.slug === "string") {
      if (slugAda.has(p.slug)) galat.push(`Slug "${p.slug}" kembar - setiap planet harus unik.`);
      slugAda.add(p.slug);
    }
  }

  let jumlahMisi = 0;
  for (const [slug, daftar] of Object.entries(isi.missions)) {
    // Misi milik planet yang sudah dihapus. Ini bukan kerusakan: menghapus
    // planet memang menghapus seluruh misinya, dan baris ini hanya tertinggal
    // di naskah. Dilewati tanpa dihitung sebagai galat.
    if (!slugAda.has(slug)) continue;

    if (!Array.isArray(daftar)) {
      galat.push(`Misi pulau "${slug}" bukan daftar.`);
      continue;
    }
    if (daftar.length > BATAS.misiPerPulau) {
      galat.push(`Pulau "${slug}" punya lebih dari ${BATAS.misiPerPulau} misi.`);
    }
    jumlahMisi += daftar.length;

    const idKembar = new Set();
    for (const m of daftar) {
      const g = periksaMisi(m);
      if (g) galat.push(g);
      if (m && typeof m.id === "string") {
        if (idKembar.has(m.id)) galat.push(`Id misi "${m.id}" kembar di pulau "${slug}".`);
        idKembar.add(m.id);
      }
    }

    // Pulau yang BISA dimainkan wajib berisi. Pulau "segera hadir" memang
    // belum punya misi apa pun, dan itu memang keadaannya sejak awal.
    const p = isi.planets.find((x) => x && x.slug === slug);
    const bisaDimainkan = p && !p.soon;
    if (bisaDimainkan && daftar.length === 0) {
      galat.push(`Pulau "${slug}" bisa dimainkan tapi misinya kosong.`);
    }
  }

  if (jumlahMisi === 0) galat.push("Tidak ada satu pun misi dalam muatan.");

  return { sah: galat.length === 0, galat };
}
