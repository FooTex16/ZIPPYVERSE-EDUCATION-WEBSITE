// ============================================================
// Teks tetap untuk jendela ngobrol Zippy
// ============================================================
//
// Dipisah dari komponennya supaya bisa ikut direkam menjadi audio suara
// Indonesia oleh scripts/kumpulTeks.mjs. Balasan inilah yang paling sering
// muncul, jadi percakapan tetap terdengar berlogat Indonesia walaupun
// perangkat tidak punya suara Indonesia sama sekali.

/** Sapaan awal saat jendela ngobrol dibuka. */
export const SAPAAN = {
  from: "zippy",
  text: "Hai! Aku Zippy. Mau ngobrol atau minta bantuan hitung?",
};

/** Balasan ketika jawaban dari AI tidak terbaca. */
export const JAWABAN_RUSAK = "Hmm, Zippy belum paham. Coba lagi ya!";

/** Balasan ketika koneksi ke server AI terputus. */
export const JAWABAN_PUTUS = "Ups, koneksi ke Zippy terputus. Tapi aku tetap di sini!";

/** Kumpulan semua teks tetap di atas, untuk keperluan rekaman audio. */
export const TEKS_CHAT = [SAPAAN.text, JAWABAN_RUSAK, JAWABAN_PUTUS];
