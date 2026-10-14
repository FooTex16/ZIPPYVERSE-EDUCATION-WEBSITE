import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { askZippy } from "@/lib/zippyBrain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Zippy mengingat percakapan sebelumnya.
 *
 * Token dihemat dengan tiga cara:
 * 1. Hanya 6 pesan terakhir (3 giliran) yang dikirim sebagai konteks.
 * 2. `maxOutputTokens` dibatasi 220 token, jadi jawaban selalu ringkas.
 * 3. Ditambah `thinkingConfig` budget rendah supaya model tidak berpikir
 *    terlalu lama atau boros.
 */
const MAX_HISTORY = 6;
const MAX_MSG_CHARS = 280;

// ---------------- Pembatas laju ----------------
//
// Endpoint ini memakai model AI berbayar dan tidak mewajibkan masuk, jadi
// tanpa pembatas siapa pun bisa membanjirinya dari luar situs dan menghabiskan
// kuota. Anak yang mengetik normal jauh di bawah batas ini (satu pesan per
// kali menekan kirim), sehingga 12 permintaan per menit tidak mengganggu
// pemakaian sehari-hari.
//
// Catatan: ini penyimpanan di memori, jadi berlaku per server. Cukup untuk
// deployment `next start` tunggal yang dipakai sekarang. Bila pindah ke
// beberapa instance/serverless, pembatasnya perlu dipindah ke penyimpanan
// bersama (misalnya Redis atau tabel Supabase).
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX = 12;
const rateBuckets = new Map(); // ip -> { count, resetAt }

function ambilIp(req) {
  const xff = req.headers?.get?.("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers?.get?.("x-real-ip") || "unknown";
}

/**
 * @returns {{ok: boolean, sisa: number}}
 */
function cekRateLimit(ip) {
  const now = Date.now();
  let b = rateBuckets.get(ip);
  if (!b || now >= b.resetAt) {
    b = { count: 0, resetAt: now + RATE_WINDOW_MS };
    rateBuckets.set(ip, b);
  }
  b.count += 1;
  // Buang entri kadaluarsa supaya peta tidak tumbuh tanpa batas.
  if (rateBuckets.size > 1000) {
    for (const [k, v] of rateBuckets) if (now >= v.resetAt) rateBuckets.delete(k);
  }
  const ok = b.count <= RATE_MAX;
  return { ok, sisa: Math.max(0, RATE_MAX - b.count) };
}

const BASE_PROMPT = `Kamu adalah Zippy, Si Penjelajah Ilmu dari Planet Luminara.
Kepribadian: eksentrik, kocak, penasaran, optimis, dan selalu bersemangat.

Aturan wajib:
1. Jawab dalam Bahasa Indonesia yang sederhana dan ramah untuk anak SD kelas 1-6.
2. Maksimal 2 kalimat pendek. Boleh memakai satu emoji saja.
3. Akhiri dengan pertanyaan pemantik rasa ingin tahu agar anak mau bertanya lagi.
4. Ingat percakapan sebelumnya. Kalau anak menyebut "itu", "tadi", atau
   "yang tadi", rujuklah ke jawabanmu sebelumnya, jangan jawab dari nol.
5. Kalau pertanyaannya di luar pelajaran SD, arahkan kembali ke petualangan
   ZippyVerse dengan ramah, jangan menggurui.
6. Jangan membahas hal yang tidak pantas untuk anak.
7. Kalau anak belum memberi konteks, jawab singkat lalu ajukan balik.`;

/** Susun system prompt dengan konteks permainan anak. */
function buildSystemPrompt(context) {
  if (!context || typeof context !== "object") return BASE_PROMPT;

  const facts = [];
  if (context.nickname) facts.push(`nama anak: ${String(context.nickname).slice(0, 20)}`);
  if (context.island) facts.push(`sedang di: ${String(context.island).slice(0, 40)}`);
  if (context.mission) facts.push(`misi: ${String(context.mission).slice(0, 40)}`);
  if (Number.isFinite(context.level)) facts.push(`level penjelajah: ${context.level}`);
  if (Number.isFinite(context.coins)) facts.push(`koin bintang: ${context.coins}`);
  if (Number.isFinite(context.correct)) facts.push(`jawaban benar: ${context.correct}`);

  if (!facts.length) return BASE_PROMPT;

  return `${BASE_PROMPT}

KONTEKS PEMAIN SAAT INI (gunakan agar jawaban relevan, jangan diulang ke anak):
- ${facts.join("\n- ")}`;
}

/**
 * Ubah riwayat percakapan menjadi format `contents` milik Gemini.
 * Hanya menyisakan MAX_HISTORY pesan terakhir untuk menghemat token.
 * Pesan pertama Zippy (sapaan) dibuang karena tidak perlu.
 */
function buildHistory(history) {
  if (!Array.isArray(history)) return [];

  const cleaned = history
    .filter((m) => m && (m.from === "me" || m.from === "zippy") && typeof m.text === "string")
    .map((m) => ({
      role: m.from === "me" ? "user" : "model",
      text: m.text.slice(0, MAX_MSG_CHARS).trim(),
    }))
    .filter((m) => m.text.length > 0);

  return cleaned.slice(-MAX_HISTORY);
}

// Daftar model yang dicoba berurutan, dari yang paling baru.
// Model lama seperti 1.5 dan 2.0 sudah dinonaktifkan oleh Google.
const CANDIDATE_MODELS = ["gemini-3.5-flash-lite", "gemini-3.5-flash"];

// Batas waktu per model supaya presentasi tidak pernah menggantung.
const MODEL_TIMEOUT_MS = 15000;

/**
 * Ambil teks dari respons Gemini.
 * SDK terbaru kadang mengekspos `text` sebagai fungsi, bukan string.
 */
function extractText(result) {
  const response = result?.response;
  if (!response) return null;

  if (typeof response.text === "function") {
    try {
      const v = response.text();
      if (typeof v === "string" && v.trim()) return v.trim();
    } catch {}
  }
  if (typeof response.text === "string" && response.text.trim()) {
    return response.text.trim();
  }
  try {
    const parts = response?.candidates?.[0]?.content?.parts || [];
    const joined = parts
      .map((p) => (typeof p?.text === "string" ? p.text : ""))
      .join("")
      .trim();
    return joined || null;
  } catch {
    return null;
  }
}

// Pemutus arus: kalau semua model gagal, lewati Gemini selama 5 menit
// supaya chat tetap responsif saat presentasi.
let skipGeminiUntil = 0;

export async function POST(req) {
  // Dihitung paling awal supaya permintaan sampah pun ikut terhitung,
  // sehingga tidak bisa membakar kuota dengan body yang rusak.
  const limit = cekRateLimit(ambilIp(req));
  if (!limit.ok) {
    return NextResponse.json(
      {
        reply:
          "Wah, Zippy kehabisan napas. Tunggu sebentar ya, lalu kirim lagi!",
        // `fallback` supaya label di jendela chat tetap konsisten dengan
        // logika yang sudah ada (bukan model AI yang menjawab).
        mode: "fallback",
      },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  let message = "";
  let history = [];
  let context = null;

  try {
    const body = await req.json();
    message = String(body?.message || "").slice(0, MAX_MSG_CHARS);
    history = body?.history;
    context = body?.context;
  } catch {
    return NextResponse.json({ reply: "Zippy gagal membaca pesanmu." }, { status: 400 });
  }

  if (!message.trim()) {
    return NextResponse.json({ reply: "Kamu mau nanya apa, Sahabat?" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const now = Date.now();

  // Mode cadangan: jawaban dari bank pengetahuan lokal.
  if (!apiKey || now < skipGeminiUntil) {
    return NextResponse.json({
      reply: askZippy(message, history),
      mode: "fallback",
      memory: history.length > 0,
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const systemInstruction = buildSystemPrompt(context);
    const past = buildHistory(history);

    let lastErr = null;

    for (const name of CANDIDATE_MODELS) {
      try {
        const model = genAI.getGenerativeModel({
          model: name,
          systemInstruction,
          // Batas token supaya jawaban ringkas dan murah.
          generationConfig: {
            maxOutputTokens: 220,
            temperature: 0.8,
            topP: 0.9,
          },
        });

        // Gabungkan riwayat + pesan baru supaya model ingat percakapan.
        const contents = [
          ...past.map((m) => ({
            role: m.role,
            parts: [{ text: m.text }],
          })),
          { role: "user", parts: [{ text: message }] },
        ];

        const result = await model.generateContent({ contents }, {
          requestOptions: { timeout: MODEL_TIMEOUT_MS },
        });

        const text = extractText(result);
        if (text) {
          skipGeminiUntil = 0;
          return NextResponse.json({
            reply: text,
            mode: "gemini",
            model: name,
            memory: past.length,
          });
        }
        lastErr = new Error("Respons kosong dari " + name);
      } catch (e) {
        lastErr = e;
      }
    }

    // Semua model gagal, tandai untuk sementara waktu.
    skipGeminiUntil = Date.now() + 5 * 60 * 1000;
    console.error(
      "[Zippy AI] Semua model gagal, pindah ke mode cadangan:",
      lastErr?.message || lastErr
    );
    return NextResponse.json({
      reply: askZippy(message, history),
      mode: "fallback",
    });
  } catch (err) {
    skipGeminiUntil = Date.now() + 5 * 60 * 1000;
    console.error("[Zippy AI] Gemini gagal:", err?.message || err);
    return NextResponse.json({
      reply: askZippy(message, history),
      mode: "fallback",
    });
  }
}