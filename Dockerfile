# syntax=docker/dockerfile:1
#
# ZippyVerse — image produksi, tiga tahap.
#
# Catatan penting bagi siapa pun yang mengubah berkas ini:
#
#   1. NEXT_PUBLIC_* harus tersedia SAAT BUILD, bukan hanya saat runtime.
#      Vite/Next menanam (inline) nilai NEXT_PUBLIC_* ke dalam bundle klien
#      pada tahap `next build`. Bila tidak diisi di sini, nilainya menjadi
#      undefined secara permanen di dalam kode yang sudah dibakar -> klien
#      Supabase rusak dan pendaftaran/login gagal TANPA ada pesan error.
#      Karena itu ketiganya dideklarasikan sebagai ARG sekaligus ENV.
#
#   2. `next/font/google` (Fredoka + Balow2) mengunduh berkas font dari
#      internet ketika `next build` berjalan. Build butuh akses keluar.
#
#   3. `output: "standalone"` di next.config.mjs membuat berkas di
#      .next/standalone berdiri sendiri tanpa perlu seluruh node_modules,
#      sehingga image akhir jauh lebih kecil.

# ---------------------------------------------------------------------------
# Tahap 1 · dependensi
# ---------------------------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app

# package-lock.json ikut disalin agar `npm ci` mengunci versi yang sama
# persis dengan yang dipakai pengembangan.
COPY package.json package-lock.json ./
RUN npm ci

# ---------------------------------------------------------------------------
# Tahap 2 · build
# ---------------------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SITE_URL

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# ---------------------------------------------------------------------------
# Tahap 3 · runtime
# ---------------------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Berjalan sebagai pengguna non-root. Traefik di Dokploy meneruskan trafik
# ke port 3000 di dalam kontainer.
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
