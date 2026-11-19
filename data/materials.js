// Bentuk materi tiap unsur di suhu ruang (298 K, 1 atm).
// Dipakai oleh <MaterialForm/> — gambar SVG statis yang kelihatan 3D,
// BUKAN model 3D interaktif: tidak bisa diputar, di-zoom, atau diklik.
// Warna dasar diambil dari el.color (data unsur), lalu dibuat tiga tingkat
// terang (hi/mid/deep) supaya gradiennya memberi kesan volume.
// Untuk gas dan beberapa unsur terkenal, warnanya dioverride dengan warna
// tampilan aslinya (oksigen itu gas bening kebiruan, bukan merah — merah itu
// kode warna CPK, bukan warna materinya).

function hexToRgb(hex) {
  const h = String(hex || '8a94a6').replace('#', '');
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}
function mix(hex, target, f) {
  const [r, g, b] = hexToRgb(hex);
  const m = (c, t) => Math.round(c + (t - c) * f);
  return `rgb(${m(r, target)}, ${m(g, target)}, ${m(b, target)})`;
}
// Tiga tingkat dari satu warna dasar: kilau, warna tengah, bayangan.
export function shades(hex) {
  return { hi: mix(hex, 255, 0.62), mid: `#${String(hex || '8a94a6').replace('#', '')}`, deep: mix(hex, 0, 0.5) };
}

// Gas di suhu ruang: [kilau, tengah, bayangan] — tampilannya yang asli.
const GAS = {
  H: ['#ffffff', '#dfe9f5', '#9db4cc'],
  He: ['#eafcff', '#b8f2ff', '#6fc4dd'],
  N: ['#e8f1ff', '#b9d2ff', '#7ea6e8'],
  O: ['#eaf6ff', '#bfe4ff', '#7fb8e8'],
  F: ['#f4ffd6', '#d8f79b', '#a5cf5e'],
  Ne: ['#ffe9d9', '#ffc9a3', '#ff9a5c'],
  Cl: ['#f2ffd2', '#c9f27f', '#8fbf3f'],
  Ar: ['#efe9ff', '#cfc2ff', '#9a86e0'],
  Kr: ['#e6f4ff', '#b3dcf5', '#6ea8cf'],
  Xe: ['#eef2ff', '#c3cde8', '#8593b8'],
  Rn: ['#f0f2f5', '#ccd3dd', '#8b95a5'],
};

// Cair di suhu ruang — cuma ada dua unsur: raksa dan bromin.
const LIQUID = {
  Hg: ['#f2f4f8', '#c9cedb', '#7d8398'],
  Br: ['#e8a080', '#a62929', '#5c1414'],
};

// Padat yang warna CPK-nya menyesatkan kalau dipakai sebagai warna materi.
const SOLID = {
  C: ['#6b6b6b', '#2e2e2e', '#101010'], // grafit: hitam, bukan abu-abu terang
  Si: ['#c8d4e0', '#8a9bb0', '#4a5568'], // silikon: abu baja kebiruan
};

const METAL_CATS = new Set([
  'Logam alkali', 'Logam alkali tanah', 'Logam transisi',
  'Logam pasca-transisi', 'Lantanida', 'Aktinida',
  'Kemungkinan logam transisi', 'Kemungkinan logam pasca-transisi',
]);

// form: 'gas' | 'liquid' | 'metal' | 'crystal' | 'ghost'
// label: penjelasan singkat dalam bahasa Indonesia.
export function materialOf(el) {
  if (!el) return { form: 'ghost', ...shades('8a94a6'), label: 'Belum ada sampelnya' };
  // Superberat (104+) dan yang datanya belum ada: belum pernah ada sampel makroskopisnya.
  if (el.n >= 104 || el.melt == null) {
    return { form: 'ghost', ...shades(el.color || '8a94a6'), label: 'Belum ada sampelnya' };
  }
  if (el.boil != null && el.boil < 298) {
    const g = GAS[el.s];
    const [hi, mid, deep] = g || [shades(el.color).hi, shades(el.color).mid, shades(el.color).deep];
    return { form: 'gas', hi, mid, deep, label: 'Gas' };
  }
  if (el.melt < 298) {
    const l = LIQUID[el.s];
    const [hi, mid, deep] = l || [shades(el.color).hi, shades(el.color).mid, shades(el.color).deep];
    return { form: 'liquid', hi, mid, deep, label: 'Cair' };
  }
  const s = SOLID[el.s];
  if (s) {
    const [hi, mid, deep] = s;
    return { form: 'crystal', hi, mid, deep, label: 'Padat · kristal' };
  }
  if (METAL_CATS.has(el.cat)) {
    return { form: 'metal', ...shades(el.color), label: 'Padat · logam' };
  }
  return { form: 'crystal', ...shades(el.color), label: 'Padat · kristal' };
}
