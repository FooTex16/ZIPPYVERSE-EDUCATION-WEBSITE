-- ============================================================
-- MIGRASI ZippyVerse - jalankan MANUAL di Supabase SQL Editor
-- ============================================================
--
-- CARA PAKAI
--   Buka Supabase Dashboard -> SQL Editor -> New query -> tempel seluruh
--   berkas ini -> Run. Tidak ada yang perlu diubah.
--
-- AMAN?
--   Ya. Seluruh pernyataan memakai `if not exists`, jadi bisa dijalankan
--   berulang tanpa merusak apa pun. Tidak ada DROP, tidak ada DELETE,
--   tidak ada pengubahan baris yang sudah ada.
--
-- APA YANG DIBUKA SETELAH INI
--   1. F-04  kolom `score` di tabel progress - selama ini setiap logMission
--            dibalas 400 PGRST204 karena kolomnya belum ada.
--   2. B     daftar anak per akun Pendamping, sehingga panel admin bisa
--            menampilkan "pendamping -> anak-anaknya" lalu mengelolanya.
--   3. D     tabel planet + misi, supaya admin bisa menambah/mengubah planet
--            dan hasilnya langsung berlaku untuk SELURUH akun anak.
--
-- Setelah ini selesai, beri tahu saya - langsung saya kerjakan sisi
-- panelnya (CRUD admin, halaman "Lihat Planet", lalu pembuat audio).
-- ============================================================


-- ------------------------------------------------------------
-- 1. F-04: perbaikan tabel progress yang sudah ada
-- ------------------------------------------------------------
-- `score` adalah kolom yang diminta logMission saat anak menyelesaikan misi.
-- Tanpanya supabase-js membalas 400 (PGRST204) dan kemajuan tidak pernah
-- tersimpan ke awan.

alter table public.progress
  add column if not exists score integer not null default 0;

create index if not exists progress_player_id_idx on public.progress (player_id);


-- ------------------------------------------------------------
-- 2. Profil akun Pendamping
-- ------------------------------------------------------------
-- Tabel ini pelengkap `auth.users`. Supabase Auth sudah menyimpan email dan
-- kata sandi; yang kita tambahkan di sini hanyalah peran dan tempat
-- menautkan anak-anak.

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  role        text not null default 'pendamping',
  created_at  timestamptz not null default now()
);


-- ------------------------------------------------------------
-- 3. Anak - inti dari permintaan "list pendamping, lalu lihat anaknya"
-- ------------------------------------------------------------
-- Satu pendamping boleh punya banyak anak (MAKS_ANAK = 6 di sisi klien).

create table if not exists public.children (
  id            uuid primary key default gen_random_uuid(),
  pendamping_id uuid not null references auth.users (id) on delete cascade,
  nama          text not null,
  created_at    timestamptz not null default now(),
  -- Satu pendamping tidak boleh punya dua anak bernama sama: mencegah
  -- baris kembar saat tombol simpan ditekan dua kali.
  constraint children_nama_unik unique (pendamping_id, nama)
);

create index if not exists children_pendamping_idx
  on public.children (pendamping_id);


-- ------------------------------------------------------------
-- 4. Tautan anak ke baris kemajuan miliknya
-- ------------------------------------------------------------
-- Selama ini `players` adalah baris anonim: nickname "Zepta" atau "Tester"
-- tidak bisa ditelusuri siapa pemiliknya. Kolom ini yang menjawabnya.
--
-- Baris LAMA sengaja TIDAK diisi (tidak bisa ditebak pemiliknya); hanya
-- anak yang dibuat sesudah migrasi yang tertaut.

alter table public.players
  add column if not exists child_id uuid references public.children (id) on delete set null;

create index if not exists players_child_idx on public.players (child_id);


-- ------------------------------------------------------------
-- 5. Planet - materi "Lihat Planet" dan "tambah planet baru"
-- ------------------------------------------------------------
-- Isinya mengikuti bentuk `ISLANDS` di lib/gameData.js apa adanya, supaya
-- hasil admin bisa langsung dipakai halaman peta tanpa penerjemahan.

create table if not exists public.planets (
  slug        text primary key,
  name        text not null,
  subject     text,
  icon        text,
  color       text,
  tagline     text,
  desc        text,
  -- Posisi di peta, disimpan sebagai JSON: { top, left } per breakpoint.
  positions   jsonb not null default '{}'::jsonb,
  -- urutan di rantai permainan; pulau ke-n hanya terbuka setelah ke-(n-1)
  urutan      integer not null default 0,
  -- true = pulau masa depan (selalu terkunci), false = bisa dimainkan
  soon        boolean not null default false,
  aktif       boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists planets_urutan_idx on public.planets (urutan);


-- ------------------------------------------------------------
-- 6. Misi di dalam planet
-- ------------------------------------------------------------
-- `rounds` disimpan sebagai JSONB karena bentuknya bergantung pada tipe
-- misi, dan keenam tipe itu sudah didefinisikan di sisi klien:
--
--   mcq / blitz / boss : { q, a, o[], hint? }
--   dragcount          : { emoji, count, options[] }
--   scramble           : { scrambled, answer, hint }
--   order              : { items[], answer[], hint }

create table if not exists public.missions (
  id          uuid primary key default gen_random_uuid(),
  planet_slug text not null references public.planets (slug) on delete cascade,
  urutan      integer not null default 0,
  tipe        text not null check (tipe in ('mcq','scramble','order','dragcount','blitz','boss')),
  nama        text,
  title       text not null,
  subtitle    text,
  rounds      jsonb not null default '[]'::jsonb,
  reward      integer not null default 50,
  xp          integer not null default 35,
  duration    integer,
  aktif       boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint missions_unik unique (planet_slug, urutan)
);

create index if not exists missions_planet_idx on public.missions (planet_slug, urutan);


-- ------------------------------------------------------------
-- 7. Penanda waktu ubah, dipakai klien untuk tahu kapan perlu memuat ulang
-- ------------------------------------------------------------
create or replace function public.sentuh_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists planets_sentuh on public.planets;
create trigger planets_sentuh
  before update on public.planets
  for each row execute function public.sentuh_updated_at();

drop trigger if exists missions_sentuh on public.missions;
create trigger missions_sentuh
  before update on public.missions
  for each row execute function public.sentuh_updated_at();


-- ------------------------------------------------------------
-- 8. RLS - siapa boleh membaca dan menulis
-- ------------------------------------------------------------
-- Prinsipnya:
--   * Anak (publik) hanya boleh MEMBACA planet & misi. Tanpa ini peta
--     tidak akan tampil sama sekali bagi yang belum masuk akun.
--   * Menulis planet/misi HANYA lewat panel admin, yang memakai kunci
--     service role - kunci itu melewati RLS dan tidak pernah sampai ke
--     peramban.
--   * Anak dan profil hanya boleh dibaca pemiliknya sendiri.

alter table public.planets    enable row level security;
alter table public.missions   enable row level security;
alter table public.children   enable row level security;
alter table public.profiles   enable row level security;

-- Publik boleh membaca isi planet (dibutuhkan halaman peta dan halaman pulau).
-- Tabel `profiles` TIDAK ikut dibuka - hanya pemiliknya yang boleh membaca.

drop policy if exists planets_baca on public.planets;
create policy planets_baca on public.planets
  for select using (true);

drop policy if exists missions_baca on public.missions;
create policy missions_baca on public.missions
  for select using (true);

-- Pemilik boleh membaca profil dan anaknya sendiri.
drop policy if exists profiles_baca_sendiri on public.profiles;
create policy profiles_baca_sendiri on public.profiles
  for select using (auth.uid() = id);

drop policy if exists children_baca_sendiri on public.children;
create policy children_baca_sendiri on public.children
  for select using (auth.uid() = pendamping_id);

drop policy if exists children_tulis_sendiri on public.children;
create policy children_tulis_sendiri on public.children
  for all using (auth.uid() = pendamping_id)
  with check (auth.uid() = pendamping_id);

drop policy if exists profiles_tulis_sendiri on public.profiles;
create policy profiles_tulis_sendiri on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists profiles_ubah_sendiri on public.profiles;
create policy profiles_ubah_sendiri on public.profiles
  for update using (auth.uid() = id);
