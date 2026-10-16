// ============================================================
// Uji lapisan konten: validasi, overlay, dan naskah
// ============================================================
//
// Tiga hal yang dijaga berkas ini:
//
//   1. ISI BAWAAN LOLOS. Bila pengembang tidak pernah menyunting apa pun,
//      seluruh pulau dan misi yang sudah ada harus dinyatakan sah. Kalau
//      tidak, satu ketikan salah di validator akan mengosongkan permainan
//      seluruh anak.
//
//   2. ISI RUSAK DITOLAK. Muatan yang cacat tidak boleh sampai menggantikan
//      isi bawaan - kalau lolos, peta tampil tanpa isi di layar anak.
//
//   3. OBJEKNYA TETAP. Overlay mengubah ISI objek ISLANDS/MISSIONS, bukan
//      mengganti objeknya. Tujuh berkas mengimpor konstanta itu; mengganti
//      objeknya hanya memperbarui sebagian dari mereka.

import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";

// ---- Tiruan localStorage, dipasang sebelum modul konten dibuka ----
// lib/konten.js membaca localStorage SAAT MODUL DIMUAT, jadi tiruan ini
// harus sudah ada lebih dulu.
const mem = new Map();
globalThis.window = {
  localStorage: {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => mem.set(k, String(v)),
    removeItem: (k) => mem.delete(k),
  },
};

const { ISLANDS, MISSIONS } = await import("../lib/gameData.js");
const { TRIAL_SLUG } = await import("../lib/trialIsland.js");
const { DAILY_SLUG } = await import("../lib/missionsExtra.js");
const { periksaKonten, TIPE_MISI } = await import("../lib/validasiKonten.js");
const K = await import("../lib/konten.js");

const salinIsi = () => ({
  planets: ISLANDS.map((p) => ({ ...p, positions: { ...(p.positions || {}) } })),
  missions: JSON.parse(JSON.stringify(MISSIONS)),
});

// Selalu kembalikan isi ke keadaan pabrik sesudah tiap uji yang menyentuhnya.
afterEach(() => K.pulihkanBawaan());

describe("periksaKonten - isi bawaan", () => {
  it("seluruh pulau dan misi bawaan dinyatakan sah", () => {
    const hasil = periksaKonten(salinIsi());
    assert.deepEqual(
      { sah: hasil.sah, galat: hasil.galat },
      { sah: true, galat: [] },
      `Isi bawaan seharusnya lolos. Galat: ${hasil.galat.join(" | ")}`
    );
  });

  it("mengenal persis enam tipe misi yang dipakai pemain", () => {
    assert.deepEqual([...TIPE_MISI].sort(), [
      "blitz",
      "boss",
      "dragcount",
      "mcq",
      "order",
      "scramble",
    ]);
  });

  it("misi harian tidak ikut diperiksa sebagai milik pulau (slugnya tak berada di planets)", () => {
    const isi = salinIsi();
    assert.ok(isi.missions[DAILY_SLUG], "harus ada misi harian");
    assert.equal(
      periksaKonten(isi).sah,
      true,
      "misi dengan slug yang tidak ada di daftar planet harus dilewati, bukan dianggap galat"
    );
  });
});

describe("periksaKonten - menolak isi rusak", () => {
  const kembali = () => ({ planets: [], missions: {} });

  function tolak(isi, kata) {
    const hasil = periksaKonten(isi);
    assert.equal(hasil.sah, false, `Seharusnya ditolak: ${kata}`);
    assert.ok(
      hasil.galat.some((g) => g.includes(kata)),
      `Galat seharusnya menyebut "${kata}". Dapat: ${hasil.galat.join(" | ")}`
    );
    return hasil;
  }

  it("menolak muatan kosong", () => {
    const h = periksaKonten(kembali());
    assert.equal(h.sah, false);
  });

  it("menolak bentuk yang bukan { planets, missions }", () => {
    assert.equal(periksaKonten(null).sah, false);
    assert.equal(periksaKonten({}).sah, false);
    assert.equal(periksaKonten({ planets: {}, missions: {} }).sah, false);
    assert.equal(periksaKonten({ planets: [], missions: [] }).sah, false);
  });

  it("menolak slug ganda", () => {
    const isi = salinIsi();
    isi.planets[1].slug = isi.planets[2].slug;
    tolak(isi, "kembar");
  });

  it("menolak slug yang bukan huruf kecil", () => {
    const isi = salinIsi();
    isi.planets[1].slug = "Pulau BARU!";
    tolak(isi, "tidak sah");
  });

  it("menolak posisi yang bukan persentase angka", () => {
    const isi = salinIsi();
    isi.planets[1].positions.lg = { top: "tinggi", left: "kiri" };
    tolak(isi, "persentase");
  });

  it("menolak pulau bermain yang misinya kosong", () => {
    const isi = salinIsi();
    isi.missions[isi.planets[1].slug] = [];
    tolak(isi, "kosong");
  });

  it("tipe yang tidak dikenal ditolak", () => {
    const isi = salinIsi();
    const slug = isi.planets[1].slug;
    isi.missions[slug][0].type = "pilihan-ganda-baru";
    tolak(isi, "tidak dikenal");
  });

  it("misi tanpa putaran soal ditolak", () => {
    const isi = salinIsi();
    const slug = isi.planets[1].slug;
    isi.missions[slug][0].rounds = [];
    tolak(isi, "putaran soal");
  });

  it("jawaban benar yang tidak ada di daftar pilihan ditolak", () => {
    const isi = salinIsi();
    const slug = isi.planets[1].slug;
    const misi = isi.missions[slug].find((m) => m.type === "mcq" || m.type === "blitz");
    assert.ok(misi, "harus ada misi pilihan ganda di isi bawaan");
    misi.rounds[0].a = "jawaban yang tidak pernah ada";
    tolak(isi, "jawaban benar tidak ada");
  });

  it("dragcount dengan jumlah tak ada di pilihan ditolak", () => {
    const isi = salinIsi();
    const slug = isi.planets[1].slug;
    const misi = isi.missions[slug].find((m) => m.type === "dragcount");
    if (!misi) return; // pulau ini memang tidak punya dragcount

    // `count` berupa angka yang valid, tetapi tidak ada di daftar pilihan -
    // anak tidak akan pernah bisa menjawab benar. Itu tetap harus ditolak.
    misi.rounds[0].count = 99;
    tolak(isi, "jawaban benar tidak ada");

    // Begitu angkanya masuk ke daftar, muatan itu sah kembali.
    misi.rounds[0].options = [1, 2, 99];
    assert.equal(periksaKonten(isi).sah, true, "setelah diperbaiki harus lolos");

    // Angka yang bukan angka ditolak dengan pesan berbeda.
    misi.rounds[0].count = "tiga";
    tolak(isi, "jumlah benda");
  });

  it("order dengan panjang jawaban berbeda dari daftar ditolak", () => {
    const isi = salinIsi();
    const slug = isi.planets[1].slug;
    const misi = isi.missions[slug].find((m) => m.type === "order");
    if (!misi) return;
    misi.rounds[0].answer = misi.rounds[0].answer.slice(0, 1);
    tolak(isi, "berbeda");
  });

  it("scramble tanpa kata ditolak", () => {
    const isi = salinIsi();
    const slug = isi.planets[1].slug;
    const misi = isi.missions[slug].find((m) => m.type === "scramble");
    if (!misi) return;
    misi.rounds[0].answer = "   ";
    tolak(isi, "jawaban kosong");
  });

  it("id misi kembar dalam satu pulau ditolak", () => {
    const isi = salinIsi();
    const slug = isi.planets[1].slug;
    const daftar = isi.missions[slug];
    if (daftar.length < 2) return;
    daftar[1].id = daftar[0].id;
    tolak(isi, "kembar");
  });
});

describe("terapkanKonten - mengganti isi di tempat", () => {
  it("objek ISLANDS yang dipakai tujuh berkas tetap sama", () => {
    const asli = ISLANDS;
    const asliMisi = MISSIONS;
    const isi = salinIsi();
    isi.planets[1] = { ...isi.planets[1], name: "Nama Baru" };

    const hasil = K.terapkanKonten(isi);
    assert.equal(hasil.ok, true, String(hasil.galat?.join(" | ")));
    assert.equal(ISLANDS, asli, "identitas array harus tetap sama");
    assert.equal(MISSIONS, asliMisi, "identitas objek misi juga harus tetap sama");
    assert.equal(ISLANDS[1].name, "Nama Baru");
  });

  it("objek MISSIONS juga tetap sama dan isinya ikut berubah", () => {
    const asli = MISSIONS;
    const slug = salinIsi().planets[1].slug;
    const isi = salinIsi();
    isi.missions[slug] = isi.missions[slug].map((m) => ({ ...m, title: "Diubah Total" }));

    assert.equal(K.terapkanKonten(isi).ok, true);
    assert.equal(MISSIONS, asli);
    assert.equal(MISSIONS[slug][0].title, "Diubah Total");
  });

  it("misi harian dan pulau perkenalan tidak pernah lenyap", () => {
    const isi = salinIsi();
    delete isi.missions[DAILY_SLUG];
    isi.planets = isi.planets.filter((p) => p.slug !== TRIAL_SLUG);
    delete isi.missions[TRIAL_SLUG];

    const hasil = K.terapkanKonten(isi);
    assert.equal(hasil.ok, true, String(hasil.galat?.join(" | ")));
    assert.ok(ISLANDS.some((p) => p.slug === TRIAL_SLUG), "pulau perkenalan harus kembali");
    assert.equal(ISLANDS[0].slug, TRIAL_SLUG, "pulau perkenalan harus tetap di urutan pertama");
    assert.ok(
      Array.isArray(MISSIONS[DAILY_SLUG]) && MISSIONS[DAILY_SLUG].length > 0,
      "misi harian harus kembali"
    );
    assert.ok(MISSIONS[TRIAL_SLUG].length > 0, "isi pulau perkenalan harus kembali");
  });

  it("isi rusak tidak pernah menyentuh permainan", () => {
    const sebelum = K.jariKonten();
    const isi = salinIsi();
    isi.missions[isi.planets[1].slug] = [];
    isi.planets[1].slug = "Slug Tak Sah!!";

    const hasil = K.terapkanKonten(isi);
    assert.equal(hasil.ok, false);
    assert.ok(Array.isArray(hasil.galat) && hasil.galat.length > 0);
    assert.equal(K.jariKonten(), sebelum, "isi di layar tidak boleh berubah sama sekali");
  });

  it("muatan yang seluruh misinya kosong ditolak sebelum menyentuh apa pun", () => {
    const sebelum = K.jariKonten();
    const isi = salinIsi();
    for (const k of Object.keys(isi.missions)) isi.missions[k] = [];

    const hasil = K.terapkanKonten(isi);
    assert.equal(hasil.ok, false);
    assert.equal(K.jariKonten(), sebelum, "isi bawaan harus tetap utuh");
    assert.ok(ISLANDS.length > 1, "pulau bawaan masih utuh");
  });

  it("null mengembalikan seluruh isi ke keadaan pabrik", () => {
    const isi = salinIsi();
    isi.planets[1] = { ...isi.planets[1], name: "Sementara" };
    K.terapkanKonten(isi);
    assert.equal(ISLANDS[1].name, "Sementara");

    const hasil = K.terapkanKonten(null);
    assert.equal(hasil.ok, true);
    assert.notEqual(ISLANDS[1].name, "Sementara");
  });
});

describe("sidik jari dan naskah", () => {
  it("sidik jari berubah hanya bila isi benar-benar berubah", () => {
    const awal = K.jariKonten();
    assert.equal(K.jariKonten(), awal, "pembacaan tanpa perubahan harus sama");

    const isi = salinIsi();
    isi.planets[1] = { ...isi.planets[1], name: "Diganti" };
    K.terapkanKonten(isi);
    assert.notEqual(K.jariKonten(), awal);
  });

  it("naskah bisa disimpan, dibaca kembali, dan dibuang", () => {
    const isi = salinIsi();
    const jariSebelum = K.jariKonten();

    assert.equal(tulisAman(isi), true);

    const baca = K.bacaDraf();
    assert.equal(baca.planets.length, isi.planets.length);
    assert.deepEqual(Object.keys(baca.missions), Object.keys(isi.missions));

    // Menulis naskah TIDAK mengubah permainan - hanya "Terapkan Update"
    // (yang mengisi awan) yang melakukannya. Inilah yang membuat anak
    // tidak pernah melihat suntingan yang masih setengah jadi.
    assert.equal(K.jariKonten(), jariSebelum, "naskah tidak boleh mengubah isi permainan");

    K.hapusDraf();
    const baca2 = K.bacaDraf();
    assert.equal(baca2.planets.length, ISLANDS.length, "kembali ke isi bawaan");
  });

  it("adaDraf menandai suntingan yang berbeda dari yang berlaku", () => {
    K.hapusDraf();
    mem.delete(K.KUNCI_AWAN);
    assert.equal(K.adaDraf(), false, "tanpa naskah dan tanpa awan = tidak ada suntingan");

    const isi = salinIsi();
    isi.planets[1] = { ...isi.planets[1], name: "Disunting" };
    tulisAman(isi);
    assert.equal(K.adaDraf(), true);
    K.hapusDraf();
  });

  // Regression: tanda "Ada naskah belum diterapkan" pernah muncul padahal
  // isinya persis sama dengan isi yang berlaku. Kalau perbandingannya
  // reaktif terhadap BENTUK salinan (posisi yang ikut disalin atau tidak),
  // developer akan melihat suntingan yang tidak pernah ia buat, lalu menekan
  // Terapkan Update karena mengira ada perubahan.
  it("naskah yang persis sama dengan isi berlaku TIDAK ditandai kotor", () => {
    K.hapusDraf();
    mem.delete(K.KUNCI_AWAN);

    // 1. Ditulis persis dari pembacaan pertama (jalur bacaDraf -> tulisDraf).
    const dariBaca = K.bacaDraf();
    assert.equal(K.tulisDraf(dariBaca), true);
    assert.equal(K.adaDraf(), false, "salinan setia dari isi berlaku harus tetap bersih");
    K.hapusDraf();

    // 2. Ditulis dari salinan yang ikut menyalin `positions` (jalur panel).
    assert.equal(K.tulisDraf(salinIsi()), true);
    assert.equal(K.adaDraf(), false, "salinan mendalam juga harus tetap bersih");
    K.hapusDraf();
  });

  it("terapkanTersimpan tidak melakukan apa pun bila tidak ada isi tersimpan", () => {
    mem.delete(K.KUNCI_AWAN);
    const sebelum = K.jariKonten();
    assert.equal(K.terapkanTersimpan(), false);
    assert.equal(K.jariKonten(), sebelum);
  });

  it("isi awan yang rusak tidak terpasang meski sudah tersimpan", () => {
    const rusak = { versi: "x", planets: [{ slug: "AB", name: "", positions: {} }], missions: {} };
    mem.set(K.KUNCI_AWAN, JSON.stringify(rusak));
    const sebelum = K.jariKonten();
    assert.equal(K.terapkanTersimpan(), false);
    assert.equal(K.jariKonten(), sebelum, "isi rusak tidak boleh menggantikan bawaan");
    mem.delete(K.KUNCI_AWAN);
  });
});

describe("susunDariTabel - baris Supabase menjadi isi permainan", () => {
  const rowsPlanet = [
    {
      slug: "tes-pulau",
      name: "Pulau Tes",
      subject: "IPA",
      urutan: 0,
      soon: false,
      updated_at: "2026-01-01T00:00:00Z",
      positions: { sm: { top: "10%", left: "10%" }, lg: { top: "10%", left: "10%" } },
    },
  ];
  const rowsMisi = [
    {
      planet_slug: "tes-pulau",
      urutan: 0,
      tipe: "mcq",
      nama: "Misi 1",
      title: "Soal Pertama",
      rounds: [{ q: "Berapa 1+1?", a: "2", o: ["2", "3"] }],
      reward: 25,
      xp: 20,
      updated_at: "2026-01-02T00:00:00Z",
    },
  ];

  it("menyusun muatan yang lolos pemeriksaan", () => {
    const isi = K.susunDariTabel(rowsPlanet, rowsMisi);
    assert.equal(isi.planets.length, 1);
    assert.equal(isi.planets[0].slug, "tes-pulau");
    assert.equal(isi.missions["tes-pulau"].length, 1);
    assert.equal(isi.missions["tes-pulau"][0].type, "mcq");
    assert.equal(isi.missions["tes-pulau"][0].reward, 25);

    const hasil = periksaKonten(isi);
    assert.equal(hasil.sah, true, hasil.galat.join(" | "));
  });

  it("misi milik planet yang sudah dihapus dibuang, bukan dipaksa masuk", () => {
    const isi = K.susunDariTabel(rowsPlanet, [
      ...rowsMisi,
      { planet_slug: "sudah-tidak-ada", urutan: 0, tipe: "mcq", title: "Yatim", rounds: [], reward: 1, xp: 1 },
    ]);
    assert.equal(isi.missions["sudah-tidak-ada"], undefined);
    assert.equal(periksaKonten(isi).sah, true);
  });

  it("mengurutkan planet dan misi sesuai kolom urutan", () => {
    const isi = K.susunDariTabel(
      [
        { ...rowsPlanet[0], slug: "b", urutan: 1, positions: { lg: { top: "1%", left: "1%" } } },
        { ...rowsPlanet[0], slug: "a", urutan: 0, positions: { lg: { top: "1%", left: "1%" } } },
      ],
      [
        { ...rowsMisi[0], planet_slug: "a", urutan: 1, title: "Kedua", rounds: [{ q: "?", a: "1", o: ["1", "2"] }] },
        { ...rowsMisi[0], planet_slug: "a", urutan: 0, title: "Pertama", rounds: [{ q: "?", a: "1", o: ["1", "2"] }] },
      ]
    );
    assert.deepEqual(isi.planets.map((p) => p.slug), ["a", "b"]);
    assert.deepEqual(
      isi.missions["a"].map((m) => m.title),
      ["Pertama", "Kedua"]
    );
  });

  it("versi diambil dari perubahan terbaru di kedua tabel", () => {
    const isi = K.susunDariTabel(rowsPlanet, rowsMisi);
    assert.ok(isi); // struktur tetap utuh
    // versiDari bersifat internal; yang diuji di sini adalah muatan hasil
    // susunan tetap lolos validasi meski ada baris tanpa updated_at.
    const tanpaWaktu = K.susunDariTabel([{ ...rowsPlanet[0], updated_at: undefined }], [
      { ...rowsMisi[0], updated_at: undefined },
    ]);
    assert.equal(periksaKonten(tanpaWaktu).sah, true);
  });
});

describe("susunDariTabel - penerjemahan kolom description", () => {
  // Kolom di tabel Supabase bernama `description`, sedangkan bentuk data
  // internal aplikasi memakai `desc` (lihat ISLANDS di lib/gameData.js).
  //
  // Penerjemahan ini pernah lupa di sisi PENULISAN, sehingga panel admin
  // selalu membalas "Gagal menulis planet: Kolom yang diminta tidak ada"
  // (Postgres PGRST204) dan isi yang diterapkan tidak pernah sampai ke
  // akun mana pun. Uji ini mencegah kegagalan yang sama terulang.
  const baris = {
    slug: "tes-desc",
    name: "Pulau Tes",
    urutan: 0,
    soon: false,
    description: "Deskripsi dari tabel Supabase",
    positions: { lg: { top: "1%", left: "1%" } },
  };

  it("kolom description di tabel menjadi properti desc di permainan", () => {
    const isi = K.susunDariTabel([baris], []);
    assert.equal(isi.planets.length, 1);
    assert.equal(isi.planets[0].desc, "Deskripsi dari tabel Supabase");
  });

  it("description bernilai null menghasilkan desc null, bukan properti nyasar", () => {
    const isi = K.susunDariTabel([{ ...baris, description: null }], []);
    assert.equal(isi.planets[0].desc, null);
    assert.equal("description" in isi.planets[0], false, "bentuk internal tidak boleh membawa nama kolom tabel");
  });

  it("baris yang tidak punya description pun tetap sah", () => {
    const tanpaDesc = { ...baris };
    delete tanpaDesc.description;
    // Muatan selalu butuh minimal satu misi - pemeriksaan validasi menolak
    // muatan tanpa misi sama sekali, apa pun isi planetnya.
    const isi = K.susunDariTabel([tanpaDesc], [
      {
        planet_slug: "tes-desc",
        urutan: 0,
        tipe: "mcq",
        nama: "Misi 1",
        title: "Soal Pertama",
        rounds: [{ q: "Berapa 1+1?", a: "2", o: ["2", "3"] }],
        reward: 25,
        xp: 20,
      },
    ]);
    assert.equal(isi.planets[0].desc, null);
    assert.equal(periksaKonten(isi).sah, true, periksaKonten(isi).galat.join(" | "));
  });
});

/** tulisDraf membalas false bila penyimpanan gagal; uji memakai versi aman. */
function tulisAman(isi) {
  try {
    return K.tulisDraf(isi) !== false;
  } catch {
    return false;
  }
}

// ============================================================
// Kunci kemajuan stabil (permintaan 1)
// ============================================================
describe("susunDariTabel — kunci misi dibuat dari nomor urut", () => {
  // Baris database selalu berisi uuid yang BERUBAH SETIAP KALI admin
  // menerbitkan (route.js mengosongkan lalu menyisipkan ulang seluruh baris).
  // Bila kunci kemajuan diambil dari uuid, sekali admin menekan "Terapkan"
  // seluruh kemajuan anak tampak lenyap. Karena itu kuncinya harus dibuat
  // dari nomor urut, bukan dari uuid.
  const barisPlanet = [{ slug: "angka", name: "Pulau Angka", urutan: 0, soon: false }];
  const barisMisi = (uuids) =>
    uuids.map((id, i) => ({
      id,
      planet_slug: "angka",
      urutan: i,
      tipe: "mcq",
      nama: `Misi ${i + 1}`,
      title: `Soal ${i + 1}`,
      rounds: [{ q: "Berapa 1+1?", a: "2", o: ["2", "3"] }],
      reward: 25,
      xp: 20,
    }));

  it("id dihasilkan dari slug dan nomor urut, bukan dari uuid baris", () => {
    const isi = K.susunDariTabel(barisPlanet, barisMisi(["uuid-aaa", "uuid-bbb", "uuid-ccc"]));
    assert.equal(isi.missions.angka[0].id, "angka:0");
    assert.equal(isi.missions.angka[1].id, "angka:1");
    assert.equal(isi.missions.angka[2].id, "angka:2");
  });

  it("uuid berbeda tetap menghasilkan kunci yang sama — inilah inti perbaikannya", () => {
    const pertama = K.susunDariTabel(barisPlanet, barisMisi(["uuid-1", "uuid-2"]));
    const kedua = K.susunDariTabel(barisPlanet, barisMisi(["uuid-9", "uuid-8"]));
    assert.deepEqual(
      pertama.missions.angka.map((m) => m.id),
      kedua.missions.angka.map((m) => m.id),
      "menerbitkan ulang tidak boleh mengubah kunci kemajuan"
    );
  });

  it("baris tanpa id pun tetap menghasilkan kunci yang sama", () => {
    const tanpaId = barisMisi(["a", "b"]).map(({ id, ...sisa }) => sisa);
    const isi = K.susunDariTabel(barisPlanet, tanpaId);
    assert.equal(isi.missions.angka[0].id, "angka:0");
  });
});

describe("petaKunciLama — memetakan id statis lama ke kunci baru", () => {
  it("menghasilkan pemetaan dari id isi bawaan ke kunci nomor urut", () => {
    // `coba` adalah Pulau Perkenalan yang memang ada di isi bawaan, jadi
    // AWAL_MISSIONS["coba"] tersedia dan id lamanya bisa dipetakan.
    const isi = K.susunDariTabel(
      [{ slug: "coba", name: "Pulau Perkenalan", urutan: 0, soon: false }],
      [
        { planet_slug: "coba", urutan: 0, tipe: "mcq", nama: "Misi 1", title: "T1",
          rounds: [{ q: "1+1?", a: "2", o: ["2", "3"] }], reward: 20, xp: 15 },
        { planet_slug: "coba", urutan: 1, tipe: "mcq", nama: "Misi 2", title: "T2",
          rounds: [{ q: "2+2?", a: "4", o: ["4", "5"] }], reward: 20, xp: 15 },
      ]
    );
    const peta = K.petaKunciLama(isi);

    assert.ok(peta.coba, "harus ada pemetaan untuk pulau coba");
    const nilai = Object.values(peta.coba);
    assert.ok(nilai.includes("coba:0"), "harus memetakan ke kunci nomor urut");
    assert.ok(nilai.includes("coba:1"));
  });

  it("pulau yang tidak ada di isi bawaan dilewati tanpa galat", () => {
    const isi = K.susunDariTabel(
      [{ slug: "pulau-baru", name: "Baru", urutan: 0, soon: false }],
      [{ planet_slug: "pulau-baru", urutan: 0, tipe: "mcq", nama: "Misi 1", title: "B",
        rounds: [{ q: "1+1?", a: "2", o: ["2", "3"] }], reward: 20, xp: 15 }]
    );
    const peta = K.petaKunciLama(isi);
    assert.equal(peta["pulau-baru"], undefined, "pulau baru tidak punya kunci lama");
  });

  it("muatan tanpa misi menghasilkan peta kosong, bukan galat", () => {
    assert.deepEqual(K.petaKunciLama({ missions: {} }), {});
    assert.deepEqual(K.petaKunciLama(null), {});
  });
});
