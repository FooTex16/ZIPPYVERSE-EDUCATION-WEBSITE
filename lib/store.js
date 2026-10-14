// ============================================================
// Game Store - LocalStorage sebagai sumber utama, Supabase sync
// ============================================================

import { supabase, supabaseEnabled } from "./supabase.js";
import { bacaConfig } from "./adminConfig.js";
import { koinMisi, xpMisi, hadiahHarian, energiMaks, regenMs, biayaEnergi } from "./costumePerks.js";

const KEY = "zippyverse_save_v1";

// ---------------- Stamina ----------------
//
// Anak punya "energi" terbatas supaya tidak bermain terus-menerus sampai
// lupa waktu. Tiap misi memakai stamina, dan stamina pulih pelan-pelan
// sehingga anak secara alami perlu beristirahat.
//
// CATATAN: keempat nilai di bawah adalah NILAI BAWAAN dan sengaja tetap
// diekspor sebagai konstanta biasa. `tests/store.test.mjs` mengimpornya dan
// membandingkan nilai persis. Nilai yang benar-benar dipakai saat bermain
// dibaca lewat `bacaConfig()`/`perkOf()` — yang mengembalikan angka yang sama
// persis selama admin belum mengubah pengaturan dan anak memakai kostum
// tanpa keistimewaan. Lihat lib/adminConfig.js dan lib/costumePerks.js.
export const MAX_STAMINA = 20;
export const STAMINA_PER_MISSION = 2;
// 1 poin tiap 8 menit -> dari 0 penuh lagi dalam ± 2 jam 40 menit.
export const STAMINA_REGEN_MS = 8 * 60 * 1000;

// ---------------- Hadiah harian ----------------
//
// Rangkaian 7 hari. Kalau anak bolong sehari, rangkaian dimulai dari awal
// supaya ada alasan untuk bermain setiap hari tanpa harus bermain lama-lama.
export const DAILY_REWARDS = [50, 75, 100, 125, 150, 200, 300];

// ---------------- Nilai efektif (bawaan + pengaturan admin + kostum) -------

/** Batas energi yang sedang berlaku. */
export function maxStaminaAktif(s) {
  return energiMaks((s || load()).equipped, bacaConfig().maxStamina);
}

/** Lama pulih 1 poin energi, dalam milidetik. */
export function regenAktif(s) {
  return regenMs((s || load()).equipped, bacaConfig().staminaRegenMenit * 60 * 1000);
}

/** Biaya energi untuk satu misi. */
export function biayaMisiAktif(s) {
  return biayaEnergi((s || load()).equipped, bacaConfig().staminaPerMission);
}

export const emptySave = () => ({
  nickname: "",
  playerId: null,
  coins: 0,
  xp: 0,
  streak: 1,
  lastPlayDate: null,
  playSeconds: 0,
  islands: {}, // slug -> { done: bool, missions: {missionId: bestScore} }
  costumes: ["default"],
  equipped: "default",
  totalCorrect: 0,
  totalWrong: 0,
  stamina: MAX_STAMINA,
  staminaAt: 0, // timestamp saat poin terakhir dipulihkan
  rewardDate: null, // tanggal hadiah harian terakhir diambil
  rewardDay: 0, // berapa hari sudah terkumpul dalam rangkaian berjalan

  // ---------------- Peti hadiah ----------------
  // Daftar tingkat peti yang sudah pernah dibuka, mis. [1, 3] berarti peti
  // pertama (tiga pulau) dan ketiga (sembilan pulau) sudah, peti kedua belum.
  // Disimpan sebagai daftar tingkat - bukan penanda "sudah pernah dapat" -
  // supaya pengelola bisa menambah jumlah tingkat tanpa perlu memutus
  // penghitungan lama anak.
  petiDibuka: [],

  // ---------------- Akun Pendamping ----------------
  // Keempat kunci ini bersifat AKUN, bukan milik satu anak, jadi tidak pernah
  // ikut berpindah saat anak berganti profil (lihat lib/profil.js).
  //
  // `pendamping` adalah sakelar utama mode tamu: selama masih null pengunjung
  // dihitung tamu dan hanya boleh memainkan Pulau Perkenalan.
  pendamping: null, // { id, email } akun Pendamping yang tertaut di perangkat ini
  anak: [], // daftar profil anak: [{ id, nama }]
  anakAktif: null, // id profil anak yang sedang bermain
  simpanan: {}, // id profil anak -> kemajuan permainan anak itu

  // ---------------- Laci per akun ----------------
  // Daftar anak di atas HANYA berisi milik akun yang sedang menempel. Ketika
  // akun dilepas atau akun lain masuk, isinya dipindahkan ke laci di bawah
  // ini dengan kunci pemiliknya.
  //
  // Mengapa perlu laci? Karena perangkat ini dipakai bergantian oleh banyak
  // akun Pendamping dalam satu keluarga. Tanpa laci, keluar lalu masuk dengan
  // akun BERBEDA membuat anak-anak akun pertama masih tertinggal dan ikut
  // tampil di akun kedua - yang berarti data anak bocor antar akun.
  //
  // `anakPemilik` mencatat siapa pemilik isi `anak`/`simpanan` yang sedang
  // menempel di posisi teratas, supaya pindah akun bisa dilakukan tanpa
  // menebak-nebak dan tanpa kehilangan data siapa pun.
  anakPemilik: null, // id akun pemilik `anak` yang sedang menempel, atau null
  akun: {}, // id akun Pendamping -> { anak: [], simpanan: {} }
});

/**
 * Rapikan struktur save supaya setiap pulau selalu punya `missions`.
 *
 * Save lama (atau yang pernah ditulis separuh jadi) bisa berbentuk
 * `{ done: true }` tanpa `missions`. Kondisi itu dulu membuat completeMission
 * melempar TypeError "Cannot read properties of undefined", sehingga layar
 * selesai misi tampil kosong. Dengan normalisasi ini setiap pembacaan
 * dijamin menemukan objek `missions`, walau isinya masih kosong.
 */
function normalisasi(s) {
  if (!s.islands || typeof s.islands !== "object") s.islands = {};
  for (const [slug, isl] of Object.entries(s.islands)) {
    if (!isl || typeof isl !== "object") {
      s.islands[slug] = { done: false, missions: {} };
      continue;
    }
    if (!isl.missions || typeof isl.missions !== "object") isl.missions = {};
    isl.done = Boolean(isl.done);
  }
  if (typeof s.stamina !== "number" || isNaN(s.stamina)) s.stamina = MAX_STAMINA;
  // Batas atas memakai nilai efektif, supaya anak yang mengenakan kostum
  // berenergi lebih besar tidak kehilangan poin tambahannya saat membuka
  // permainan.
  const maks = maxStaminaAktif(s);
  s.stamina = Math.max(0, Math.min(maks, s.stamina));
  if (typeof s.staminaAt !== "number" || isNaN(s.staminaAt)) s.staminaAt = 0;
  if (typeof s.rewardDay !== "number" || isNaN(s.rewardDay)) s.rewardDay = 0;
  return s;
}

/**
 * Pulihkan stamina berdasarkan waktu yang sudah berlalu.
 *
 * Dipanggil di setiap `load()` supaya angkanya selalu terkini walaupun anak
 * membuka aplikasi setelah lama tinggal. Hasilnya ikut tersimpan begitu ada
 * `update()` berikutnya, jadi tidak ada tulis localStorage yang berlebihan.
 */
function refillStamina(s) {
  const now = Date.now();
  const maks = maxStaminaAktif(s);
  const interval = regenAktif(s);
  if (!s.staminaAt) {
    s.staminaAt = now;
    if (s.stamina >= maks) s.stamina = maks;
    return s;
  }
  if (s.stamina >= maks) {
    s.staminaAt = now;
    return s;
  }
  const gained = Math.floor((now - s.staminaAt) / interval);
  if (gained > 0) {
    s.stamina = Math.min(maks, s.stamina + gained);
    s.staminaAt = s.stamina >= maks ? now : s.staminaAt + gained * interval;
  }
  return s;
}

export function load() {
  if (typeof window === "undefined") return emptySave();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return refillStamina(emptySave());
    return refillStamina(normalisasi({ ...emptySave(), ...JSON.parse(raw) }));
  } catch {
    return refillStamina(emptySave());
  }
}

export function persist(s) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}

export function update(fn) {
  const s = load();
  const next = fn(s) || s;
  persist(next);
  return next;
}

// --- Tanggal hari ini (YYYY-MM-DD) ---
export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/**
 * Dipanggil saat anak mulai bermain.
 * Menghitung streak harian.
 */
export function touchStreak() {
  return update((s) => {
    const t = today();
    if (s.lastPlayDate === t) return s;
    const yesterday = (() => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;
    })();
    s.streak = s.lastPlayDate === yesterday ? s.streak + 1 : 1;
    s.lastPlayDate = t;
    return s;
  });
}

export function addPlayTime(sec) {
  return update((s) => {
    s.playSeconds += sec;
    return s;
  });
}

// ---------------- Stamina: biar anak mau beristirahat ----------------

/** Baca status stamina tanpa menulis apa pun. */
export function staminaInfo(s) {
  const save = s || load();
  const maks = maxStaminaAktif(save);
  const interval = regenAktif(save);
  const value = save.stamina ?? maks;
  let nextMs = 0;
  if (value < maks) {
    const at = save.staminaAt || Date.now();
    nextMs = Math.max(0, interval - (Date.now() - at));
  }
  return {
    value,
    max: maks,
    nextMs,
    canPlay: value >= biayaMisiAktif(save),
  };
}

/**
 * Pakai stamina untuk mulai satu misi.
 * @returns {{ok:boolean, value:number, reason?:string}}
 */
export function spendStamina(amount) {
  let out = { ok: false, value: 0 };
  update((s) => {
    refillStamina(s);
    // Biayanya dihitung di sini, bukan dari pemanggil, supaya keistimewaan
    // kostum "Mode Pemikir" (misi cuma 1 energi) berlaku di semua halaman
    // tanpa tiap halaman harus mengingat untuk menghitungnya sendiri.
    const cost = amount ?? biayaMisiAktif(s);
    if (s.stamina < cost) {
      out = { ok: false, value: s.stamina, reason: "habis" };
      return s;
    }
    s.stamina -= cost;
    out = { ok: true, value: s.stamina };
    return s;
  });
  return out;
}

// ---------------- Hadiah harian ----------------

function hariKe(dari, ke) {
  if (!dari) return 999;
  const a = new Date(`${dari}T00:00:00`);
  const b = new Date(`${ke}T00:00:00`);
  if (isNaN(a) || isNaN(b)) return 999;
  return Math.round((b - a) / 86400000);
}

/**
 * Status hadiah harian hari ini.
 * @returns {{claimedToday:boolean, day:number, amount:number,
 *            progress:number, claimable:boolean, total:number}}
 * `day`     = hari ke berapa dalam rangkaian yang sedang berlaku (1..7)
 * `progress`= berapa hari sudah berhasil diklaim dalam rangkaian ini
 */
export function rewardInfo(s) {
  const save = s || load();
  // Daftar hadiah dibaca dari pengaturan konten supaya admin bisa menyesuaikan
  // besarnya tanpa menyunting kode. Nilainya jatuh ke DAILY_REWARDS bila tidak
  // ada pengaturan tersimpan, jadi angkanya tetap persis [50,75,...,300].
  const hadiah = bacaConfig().dailyRewards;
  const t = today();
  const claimedToday = save.rewardDate === t;
  const bolong = hariKe(save.rewardDate, t) > 1;
  let base = save.rewardDay || 0;
  if (base >= hadiah.length) base = 0; // siklus selesai, mulai lagi
  if (bolong) base = 0; // bolong sehari, rangkaian putus

  const day = claimedToday ? Math.max(base, 1) : Math.min(base + 1, hadiah.length);
  return {
    claimedToday,
    day,
    amount: hadiah[day - 1] || 0,
    progress: base,
    claimable: !claimedToday,
    total: hadiah.length,
  };
}

/** Klaim hadiah hari ini. Aman dipanggil berulang, hasil nol kalau sudah. */
export function claimDailyReward() {
  let out = { coins: 0, day: 0, already: false };
  update((s) => {
    const info = rewardInfo(s);
    if (info.claimedToday) {
      out = { coins: 0, day: info.day, already: true };
      return s;
    }
    // Kostum "Mode Party" menambah hadiah login, jadi anak punya alasan
    // mengenakannya saat membuka permainan tiap hari.
    const dapat = hadiahHarian(info.amount, s.equipped);
    s.coins += dapat;
    s.rewardDate = today();
    s.rewardDay = info.day;
    out = { coins: dapat, day: info.day, already: false };
    sinkron(s);
    return s;
  });
  return out;
}

// ============================================================
// Peti hadiah - hadiah besar tiap tiga pulau tamat
// ============================================================
//
// MENGAPA PERLU PETI
//
// Koin dari misi diberikan sedikit demi sedikit, sehingga kemenangan terasa
// pelan dan tidak pernah ada momen "menang besar". Peti menambalnya: setiap
// tiga pulau yang ditamatkan, sebuah peti muncul di peta dan menunggu untuk
// ditekan. Anak punya sesuatu yang jelas untuk DILIHAT dan DINANTI, bukan
// sekadar angka koin yang naik sendiri.
//
// MENGAPA TIAP TIGA PULAU, BUKTI TIAP PULAU
//
// Satu pulau sudah berisi tiga misi dan menamatkannya sendiri sudah terasa
// sebagai pencapaian. Bila peti muncul tiap pulau, ia cepat menjadi hal
// biasa. Tiap tiga pulau jaraknya cukup jauh untuk membuat anak benar-benar
// mengejar, dan cukup dekat untuk tidak putus asa di tengah jalan.

/** Berapa pulau tamat yang dibutuhkan untuk satu peti. */
export const PULAU_PER_PETI = 3;

/** Pulau yang sudah ditamatkan (misi ketiganya selesai). */
export function jumlahPulauSelesai(s) {
  return Object.values((s || load()).islands || {}).filter((i) => i && i.done).length;
}

/**
 * Koin di dalam peti tingkat tertentu.
 *
 * Harus lebih berharga daripada sekadar mengulang misi, sebab untuk
 * membukanya anak harus menamatkan tiga pulau penuh - bukan satu misi.
 */
export function koinPeti(tingkat) {
  return 100 * Math.max(1, tingkat || 1);
}

/**
 * Tingkatan peti yang sedang menunggu dibuka, atau null bila tidak ada.
 *
 * Bila beberapa tingkat tertinggal sekaligus (mis. anak menamatkan enam
 * pulau berturut-turut sebelum sempat membuka apa pun), yang PALING AWAL
 * dipilih lebih dulu. Dengan begitu hadiah yang datang berurutan dan mudah
 * dilacak anak, bukan melompat-lompat.
 */
export function petiTertunda(s) {
  const simpanan = s || load();
  const sudah = jumlahPulauSelesai(simpanan);
  const dibuka = Array.isArray(simpanan.petiDibuka) ? simpanan.petiDibuka : [];
  const tertinggi = Math.floor(sudah / PULAU_PER_PETI);
  for (let t = 1; t <= tertinggi; t += 1) {
    if (!dibuka.includes(t)) return t;
  }
  return null;
}

/**
 * Buka peti tingkat tertentu.
 *
 * Aman dipanggil berulang: bila tingkat itu sudah dibuka atau memang belum
 * terbuka, tidak ada koin yang diberikan dan simpanan tidak ditulis ulang.
 */
export function klaimPeti(tingkat) {
  // @type {{koin:number, tingkat:number, ok:boolean}}
  let out = { koin: 0, tingkat: 0, ok: false };

  update((s) => {
    const tertunda = petiTertunda(s);
    if (!tertunda || tertunda !== tingkat) {
      out = { koin: 0, tingkat: tertunda || 0, ok: false };
      return s;
    }

    const koin = koinPeti(tertunda);
    s.coins += koin;
    if (!Array.isArray(s.petiDibuka)) s.petiDibuka = [];
    s.petiDibuka.push(tertunda);
    out = { koin, tingkat: tertunda, ok: true };
    sinkron(s);
    return s;
  });

  return out;
}

export function recordAnswer(correct) {
  return update((s) => {
    if (correct) s.totalCorrect += 1;
    else s.totalWrong += 1;
    return s;
  });
}

/**
 * Catat hasil jawaban sekaligus dalam jumlah banyak,
 * dipakai setelah satu misi selesai.
 */
export function recordAnswers(correctCount, wrongCount) {
  return update((s) => {
    s.totalCorrect += Math.max(0, correctCount || 0);
    s.totalWrong += Math.max(0, wrongCount || 0);
    return s;
  });
}

/**
 * Selesaikan satu misi.
 *
 * Aturan koin (sesuai aturan main ZippyVerse):
 *  - Pulau biasa yang SUDAH TAMAT tidak bisa diulang -> 0 koin. Anak diajak
 *    pindah ke Tantangan Harian atau menunggu tantangan besok untuk koin.
 *  - Tantangan Harian: hadiah penuh sekali sehari. Kalau kuncinya tanggalnya
 *    sudah ada, koinnya 0 (masih boleh bermain untuk latihan).
 *  - Pulau biasa yang belum tamat: hadiah penuh saat pertama, 30% saat diulang.
 *
 * @param {{daily?:boolean}} opts
 * @returns {{coins:number, firstClear:boolean}}
 */
export function completeMission(slug, missionId, coins, xp, score, opts = {}) {
  const firstClear = { v: false, coins: 0 };
  update((s) => {
    // Lengkapi strukturnya di sini juga, karena save bisa datang dari
    // sumber yang tidak melewati load() (misalnya objek hasil merge).
    const isl = { done: false, missions: {}, ...(s.islands[slug] || {}) };
    if (!isl.missions || typeof isl.missions !== "object") isl.missions = {};
    const prev = isl.missions[missionId];
    const isFirst = prev === undefined;
    const islandTamat = Boolean(isl.done);

    let gained;
    if (opts.daily) {
      // Hadiah harian: sekali sehari, besok hadiahnya datang lagi.
      gained = isFirst ? coins : 0;
    } else if (islandTamat) {
      // Pulau sudah selesai semua -> tidak bisa menambang koin lagi.
      gained = 0;
    } else if (isFirst) {
      gained = coins;
    } else {
      gained = Math.round(coins * 0.3);
    }

    // Bonus kostum dihitung dari koin yang benar-benar didapat (sudah 0 bila
    // pulau tamat atau tantangan hari ini sudah diklaim), sehingga kostum tidak
    // pernah bisa dipakai untuk menambang koin dari pulau yang sudah tamat.
    const dapatKoin = koinMisi(gained, s.equipped);
    s.coins += dapatKoin;
    s.xp += xpMisi(xp, s.equipped);
    if (score > (prev ?? -1)) isl.missions[missionId] = score;
    // Pulau dianggap selesai bila ketiga misinya benar-benar dikerjakan
    // sampai ada jawaban benar (skor > 0) — bukan sekadar "pernah dicoba".
    //
    // Dulu syaratnya hanya `Object.keys(...).length >= 3`, sehingga anak yang
    // menjawab salah semua tetap diberi tahu "Semua misinya sudah selesai",
    // pulau terkunci, dan pulau berikutnya ikut terbuka. Lihat temuan F-02.
    //
    // Ambangnya sengaja dibiarkan rendah (minimal satu jawaban benar) karena
    // `done` tidak pernah kembali ke `false`: ambang yang terlalu tinggi bisa
    // mengunci anak keluar dari pulau secara permanen, dan itu jauh lebih
    // merugikan daripada pulau sedikit mudah terbuka.
    const misiSelesai = Object.values(isl.missions).filter((v) => v > 0).length;
    if (misiSelesai >= 3) isl.done = true;
    s.islands[slug] = isl;
    firstClear.v = isFirst;
    firstClear.coins = dapatKoin;
    sinkron(s);
    return s;
  });
  return firstClear;
}

export function isIslandDone(slug) {
  const s = load();
  return Boolean(s.islands[slug]?.done);
}

// ---------------- Supabase sync ----------------

/** Pemisah uuid pada kolom children.id dan players.child_id. */
const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * uuid anak aktif pada tabel `children`, bila perangkat sudah mengetahuinya.
 *
 * Anak yang ditambahkan lewat panel admin lahir sebagai uuid dari awan,
 * sedangkan yang dibuat pertama kali di perangkat memakai nanoid pendek.
 * Hanya yang berbentuk uuid yang bisa ditautkan ke `players.child_id`; selama
 * belum ada, tautan tidak ditulis sama sekali - bukan ditulis null, sebab
 * null berarti memutus tautan yang mungkin sudah benar.
 */
function idAnakAwan(s) {
  const a = (s.anak || []).find((x) => x.id === s.anakAktif);
  const u = a && a.awan;
  return typeof u === "string" && RE_UUID.test(u) ? u : null;
}

/**
 * Nilai yang BARU SAJA dikirim ke awan, disimpan sebagai pembanding.
 *
 * Inilah satu-satunya cara mengetahui apakah awan berubah sejak perangkat
 * terakhir kali menulis. Tabel `players` tidak punya kolom waktu perubahan,
 * jadi tanpa pembanding ini suntingan pengelola mustahil dibedakan dari
 * kemajuan anak sendiri - dan perangkat akan menganggap nilainya selalu
 * benar, apa pun yang dilakukan panel admin.
 */
function cerminPemain(s) {
  return { coins: s.coins, xp: s.xp, streak: s.streak };
}

export async function syncToSupabase(s) {
  if (!supabaseEnabled) return { ok: false, reason: "supabase nonaktif" };
  try {
    if (!s.playerId) {
      if (!s.nickname) return { ok: false, reason: "belum ada nickname" };
      const { data, error } = await supabase
        .from("players")
        .insert({
          nickname: s.nickname,
          coins: s.coins,
          xp: s.xp,
          streak: s.streak,
          pulau_terbuka: Object.keys(s.islands).length || 1,
          child_id: idAnakAwan(s),
        })
        .select("id")
        .single();
      if (error) return { ok: false, reason: error.message };
      s.playerId = data.id;
      s.pemainCermin = cerminPemain(s);
      persist(s);
      return { ok: true, id: data.id };
    }

    const tautan = idAnakAwan(s);
    const { error } = await supabase
      .from("players")
      .update({
        coins: s.coins,
        xp: s.xp,
        streak: s.streak,
        pulau_terbuka: Object.keys(s.islands).length || 1,
        ...(tautan ? { child_id: tautan } : {}),
      })
      .eq("id", s.playerId);
    if (error) return { ok: false, reason: error.message };
    s.pemainCermin = cerminPemain(s);
    persist(s);
    return { ok: true, id: s.playerId };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

export async function logMission(playerId, pulau, misiKe, score, status) {
  if (!supabaseEnabled || !playerId) return;
  try {
    // supabase-js v2 TIDAK melempar galat untuk kegagalan jaringan/query;
    // galatnya dikembalikan lewat properti `error`. Karena itu `error` harus
    // diperiksa sendiri. Dulu satu-satunya penanganannya `catch {}`, yang
    // berarti kegagalan benar-benar hilang tanpa jejak.
    const { error } = await supabase.from("progress").insert({
      player_id: playerId,
      pulau,
      misi_ke: misiKe,
      score,
      status,
    });
    if (error) laporkanSync("progress: " + error.message);
  } catch (e) {
    laporkanSync("progress: " + (e && e.message ? e.message : e));
  }
}

/**
 * Laporkan kegagalan sinkronisasi tanpa membanjiri console.
 *
 * Alasan yang sama hanya dilaporkan sekali, karena fungsi ini dipanggil pada
 * setiap misi dan setiap klaim hadiah. Sebelum ada pemeriksaan ini, riwayat
 * dasbor orang tua kosong tanpa ada satu pun pesan galat yang muncul —
 * lihat temuan F-13 pada AUDIT_REPORT.md.
 */
const alasanSudahDilapor = new Set();
function laporkanSync(alasan) {
  if (alasanSudahDilapor.has(alasan)) return;
  alasanSudahDilapor.add(alasan);
  console.warn("[zippyverse] sinkronisasi Supabase gagal:", alasan);
}

/**
 * Panggil `syncToSupabase` tanpa memblokir, tapi tetap terlihat bila gagal.
 *
 * Dua panggilan sebelumnya membuang hasilnya begitu saja, jadi kegagalan
 * sinkronisasi sama sekali tak terdengar. Tidak ditambah `await` supaya
 * penulisan localStorage tidak tertunda oleh jaringan.
 */
function sinkron(s) {
  Promise.resolve(syncToSupabase(s)).then((r) => {
    if (r && r.ok === false && r.reason !== "supabase nonaktif") {
      laporkanSync(r.reason);
    }
  });
}