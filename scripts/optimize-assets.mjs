// Konversi aset PNG (sumber) menjadi WebP yang jauh lebih ringan.
// Jalankan: node scripts/optimize-assets.mjs
import { readdir, stat, unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(".");
const FOLDERS = [
  { dir: "public/zippy", size: 420 },
  { dir: "public/islands", size: 320 },
];

let before = 0;
let after = 0;
let count = 0;

for (const { dir, size } of FOLDERS) {
  const abs = path.join(ROOT, dir);
  const files = (await readdir(abs)).filter((f) => f.toLowerCase().endsWith(".png"));

  for (const file of files) {
    const src = path.join(abs, file);
    const out = path.join(abs, file.replace(/\.png$/i, ".webp"));

    const statBefore = await stat(src);
    before += statBefore.size;

    await sharp(src)
      .resize({ width: size, height: size, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, effort: 6 })
      .toFile(out);

    const statAfter = await stat(out);
    after += statAfter.size;
    count++;

    // Hapus PNG asal supaya tidakdobrak doubel dan repo tetap ringan
    await unlink(src);

    const pct = Math.round((1 - statAfter.size / statBefore.size) * 100);
    console.log(
      `  ${file.padEnd(22)} ${(statBefore.size / 1024).toFixed(0).padStart(5)} KB` +
        `  ->  ${(statAfter.size / 1024).toFixed(0).padStart(4)} KB  (-${pct}%)`
    );
  }
}

console.log(
  `\nTotal ${count} aset: ${(before / 1024 / 1024).toFixed(1)} MB` +
    ` -> ${(after / 1024 / 1024).toFixed(2)} MB` +
    ` (-${Math.round((1 - after / before) * 100)}%)`
);