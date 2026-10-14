/**
 * Konfigurasi ESLint ZippyVerse.
 *
 * Dijalankan lewat `npm run lint`.
 *
 * Catatan: `eslint-config-next@15.5` masih memakai format `.eslintrc` lama,
 * bukan flat config. Karena itu berkasnya `.eslintrc.js`, bukan
 * `eslint.config.mjs`. Migrasi ke ESLint CLI/flat config sebaiknya dilakukan
 * bersamaan dengan peningkatan ke Next 16, karena `next lint` sendiri sudah
 * deprecated di versi tersebut.
 *
 * Aturan yang sengaja dimatikan beserta alasannya:
 *
 * - `@next/next/no-img-element` (11 temuan)
 *   Seluruh gambar adalah berkas WebP/SVG lokal kecil di /public yang sudah
 *   dikompresi sebelumnya. Memakai next/image justru menambah beban optimizer
 *   di server dan berpotensi menimbulkan biaya penyedia gambar, padahal situs
 *   ini ditujukan untuk tetap ringan. Pemakaian <img> di sini disengaja.
 *
 * - `@next/next/no-page-custom-font` (1 temuan)
 *   Aturan ini dibuat untuk pages/_document.js. Di App Router, font dimuat
 *   lewat <link> pada app/layout.jsx sehingga aturannya tidak berlaku dan
 *   selalu memberi peringatan palsu.
 *
 * `react-hooks/exhaustive-deps` sengaja DIPERTAHANKAN aktif. Satu-satunya
 * temuannya (MissionScramble.jsx:160) sudah diperiksa manual: `pickLetter`
 * hanya membaca `busy`, `solved`, `done`, dan `pickedIds`, keempatnya sudah
 * ada di dependency array, jadi tidak ada risiko closure basi. Peringatan itu
 * dibiarkan terlihat sebagai bukti bahwa aturannya benar-benar berjalan.
 */
module.exports = {
  extends: ["next/core-web-vitals"],
  rules: {
    "@next/next/no-img-element": "off",
    "@next/next/no-page-custom-font": "off",
  },
};
