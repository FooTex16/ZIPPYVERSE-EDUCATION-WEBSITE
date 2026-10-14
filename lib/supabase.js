// ============================================================
// Supabase Client - aman dipakai di browser & server
// ============================================================

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseEnabled = Boolean(url && key);

export const supabase = supabaseEnabled
  ? createClient(url, key, {
      auth: {
        // Sesi autentikasi harus bertahan antar-pemuatan halaman. Selama ini
        // ketiganya dimatikan karena situs belum memiliki sistem akun sama
        // sekali - tidak ada yang perlu dipertahankan. Halaman Daftar/Masuk
        // kini membutuhkannya, jika tidak pengguna langsung keluar tiap kali
        // memuat ulang halaman.
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;