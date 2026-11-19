'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import AtomSim from '../components/AtomSim';
import BohrModel from '../components/BohrModel';
import MaterialForm from '../components/MaterialForm';
import { ELEMENTS } from '../data/elements';
import { materialOf } from '../data/materials';

// Kartu yang bisa dibuka-tutup, dengan animasi halus (tinggi + opacity) dan panah yang berputar.
function Collapse({ open, onToggle, header, children, maxH }) {
  return (
    <div>
      <button type="button" onClick={onToggle} aria-expanded={open} style={{ all: 'unset', display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, cursor: 'pointer', boxSizing: 'border-box', textAlign: 'left' }}>
        <span style={{ flex: '1 1 auto', minWidth: 0 }}>{header}</span>
        <span aria-hidden style={{ display: 'inline-block', flex: '0 0 auto', color: '#94a3b8', fontSize: 16, lineHeight: 1.4, transition: 'transform 0.35s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
      </button>
      <div style={{ maxHeight: open ? (maxH || 400) : 0, opacity: open ? 1 : 0, overflow: 'hidden', transition: 'max-height 0.4s ease, opacity 0.3s ease' }}>
        {children}
      </div>
    </div>
  );
}

function getState(t, melt, boil, el, caps) {
  if (t === 0) return 'zero';
  if (t < 0.0000001 && caps.ferm) return 'fermionic';
  if (t < 0.001 && caps.bec) return 'bec';
  if (el.s === 'He' && t >= 0.001 && t < 2.17 && !caps.solid) return 'superfluid';
  if (el.n >= 104 && t < 10000) return 'unstable';
  if (caps.super && el.crit && t > el.crit.t && t < 10000) return 'supercritical';
  if (!caps.liquid) { const sub = Math.min(melt, boil); if (t < sub) return 'solid'; if (t < 10000) return 'gas'; return 'plasma'; }
  if (!caps.solid) { if (t < boil) return 'liquid'; if (t < 10000) return 'gas'; return 'plasma'; }
  if (t < melt) return 'solid';
  if (t < boil) return 'liquid';
  if (t < 10000) return 'gas';
  return 'plasma';
}

// Titik didih di tekanan lain, dari persamaan Clausius–Clapeyron:
// 1/T2 = 1/T1 - (R/dHvap) * ln(P2/P1), dengan dHvap diperkirakan pakai aturan Trouton dHvap ~ 85 * Tb.
// Titik leleh hampir nggak geser sama tekanan (kecuali helium), jadi cuma dikasih koreksi kecil.
function boilAtPressure(Tb, P) {
  if (!Tb || P <= 0) return Tb;
  const denom = 1 - (8.314 / 85) * Math.log(P);
  if (denom <= 0.2) return Tb * 5;
  return Tb / denom;
}

const INFO = {
  zero: { name: 'Nol Mutlak — 0 K', color: '#bfdbfe', tag: '❄️ Gerakannya berhenti', desc: 'Di 0 kelvin (−273,15 °C), atom udah nggak punya energi lagi. Gerakannya hampir berhenti total, sisa getaran kuantum doang yang kecil banget. Nggak ada yang bisa lebih dingin dari ini.', points: ['Kecepatan rata-rata: 0 m/s', 'Atom beku di tempatnya, rapi kayak kisi', 'Ini suhu paling dingin yang mungkin ada'] },
  fermionic: { name: 'Kondensat Fermionik', color: '#f472b6', tag: '🩷 Pasangan fermion di dekat 0 K', desc: 'Di dekat sekali dengan nol mutlak — sekitar 50 nano-kelvin — fermion (atom kayak kalium-40) yang biasanya nggak bisa numpuk, malah berpasangan jadi pasangan Cooper. Pasangan ini berperilaku kayak boson, jadi ribuan pasangan bisa nyatu dalam satu keadaan kuantum. Ini wujud keenam yang secara teori diprediksi, dan pertama kali berhasil dibuat tahun 2003.', points: ['Cuma ada di dekat 0 K, sekitar 50 nK', 'Fermion berpasangan, lalu pasangannya menyatu', 'Sepupu kuantumnya kondensat Bose–Einstein'] },
  bec: { name: 'Kondensat Bose–Einstein', color: '#c084fc', tag: '🟣 Jadi satu atom kuantum raksasa', desc: 'Kalau didinginkan sampai di bawah 0,000001 K (170 nano-kelvin), atom jadi pelan banget sampai gelombang kuantumnya saling nempel. Ribuan atom akhirnya jadi satu, kayak satu “super-atom” raksasa. Ini udah diprediksi Bose sama Einstein tahun 1924, baru berhasil dibuat tahun 1995.', points: ['Atom-atomnya nyatu dalam satu gelombang — awan ungu itu', 'Hampir nggak ada gerakan, hampir nggak ada panas', 'Wujud materi ke-5, lebih dingin dari luar angkasa'] },
  solid: { name: 'Padat', color: '#38bdf8', tag: '🧊 Kekunci di tempat, cuma getar', desc: 'Atomnya kekunci di tempatnya, rapi kayak kisi. Kalau dipanasin, atomnya cuma bisa getar makin kencang di situ-situ aja — nggak bisa kabur dari tetangganya. Nah, getaran inilah yang kita sebut suhu.', points: ['Tempatnya tetap, getarannya kecil', 'Makin panas, getarannya makin kencang', 'Bentuk dan volumenya tetap'] },
  liquid: { name: 'Cair', color: '#4ade80', tag: '💧 Saling lewat dan ngalir', desc: 'Atomnya udah cukup panas buat lepas dari tempatnya, tapi belum cukup buat kabur jauh-jauh. Jadi atomnya bisa ngalir dan saling lewat — makanya cairan bisa ngalir, tapi atomnya tetap nempel satu sama lain.', points: ['Atomnya bebas bergerak, tapi tetap berdekatan', 'Bentuknya ngikutin wadah', 'Lebih cepat dari padat, lebih lambat dari gas'] },
  gas: { name: 'Gas', color: '#facc15', tag: '💨 Ngebut, bebas, dan menyebar', desc: 'Di sini atom udah bebas total. Terbang lurus, nabrak dinding, nabrak atom lain, terus ngisi seluruh wadah. Makin panas, makin ngebut terbangnya.', points: ['Nggak punya bentuk atau volume tetap', 'Atomnya tabrakan miliaran kali tiap detik', 'Kecepatannya naik mengikuti √suhu'] },
  plasma: { name: 'Plasma', color: '#fb923c', tag: '⚡ Atomnya sampai tercabik', desc: 'Di atas ~10.000 K, atom bergerak seganas itu sampai tabrakannya ngelepasin elektron dari atom. Sisanya jadi sup inti bermuatan sama elektron bebas yang nyala — kayak yang ada di bintang, petir, sama lampu neon.', points: ['Elektron (titik kuning) lepas dari atomnya', 'Gas yang nyala dan bermuatan listrik', '99% alam semesta yang kelihatan itu plasma'] },
  superfluid: { name: 'Superfluid', color: '#22d3ee', tag: '🌊 Ngalir tanpa gesekan', desc: 'Helium cair di bawah 2,17 K (titik lambda) jadi helium II: ngalir tanpa gesekan sama sekali, bisa manjat keluar dari wadahnya dan ngalir lewat celah yang terlalu sempit buat cairan biasa. Ditemukan tahun 1938 oleh Kapitza dan Allen & Misener. Ini wujud kuantum — sebagian atomnya berperilaku kayak satu gelombang raksasa.', points: ['Viskositas nol — nggak ada gesekan', 'Cuma helium di bawah 2,17 K', 'Menghantarkan panas dengan cara yang aneh (efek termosifon)'] },
  supercritical: { name: 'Superkritis', color: '#a78bfa', tag: '🌀 Bukan cair, bukan gas', desc: 'Di atas titik kritis — suhu dan tekanan kritis unsur ini — cair dan gas nggak bisa dibedakan lagi. Yang ada cuma satu fluida padat yang ngalir kayak gas tapi rapatnya kayak cair. Nggak ada lagi batas mendidih di sini.', points: ['Cuma ada di atas suhu dan tekanan kritis', 'Cair dan gas jadi satu fase', 'Dipakai buat ekstraksi dan pendingin di industri'] },
  unstable: { name: 'Terlalu cepat meluruh', color: '#94a3b8', tag: '⏱️ Nggak sempat jadi zat curah', desc: 'Unsur superberat (nomor atom 104 ke atas) belum pernah ada sampel makroskopisnya. Mereka cuma dibuat atom per atom di akselerator, dan meluruh dalam hitungan milidetik sampai menit. Jadi padat, cair, dan gas dalam jumlah besar nggak bisa diamati — yang ada cuma atom-atom tunggal yang keburu meluruh.', points: ['Dibuat atom per atom, bukan sekilo-sekilo', 'Waktu paruhnya pendek banget', 'Sifatnya ditebak dari unsur sekelompoknya, bukan diukur langsung'] },
};

function fmtTemp(t) {
  if (t === 0) return '0';
  if (t < 0.001) return t.toExponential(1);
  if (t < 10) return t.toFixed(2);
  return Math.round(t).toLocaleString('id-ID');
}
function fmtK(v) { return v == null ? '—' : `${Math.round(v).toLocaleString('id-ID')} K`; }

const CAT_COLOR = {
  'Gas mulia': '#7dd3fc', 'Nonlogam diatomik': '#4ade80', 'Logam alkali': '#f87171',
  'Logam alkali tanah': '#fbbf24', 'Metaloid': '#a78bfa', 'Nonlogam poliatomik': '#34d399',
  'Logam transisi': '#f472b6', 'Logam pasca-transisi': '#94a3b8', 'Lantanida': '#f472b6',
  'Aktinida': '#fb923c',
  'Kemungkinan logam transisi': '#f472b6', 'Kemungkinan logam pasca-transisi': '#94a3b8',
  'Kemungkinan metaloid': '#a78bfa', 'Diprediksi gas mulia': '#7dd3fc',
};

export default function Home() {
  const [temp, setTemp] = useState(300);
  const [playing, setPlaying] = useState(true);
  const [elNum, setElNum] = useState(18); // Argon, default
  const [query, setQuery] = useState('');
  const [pressureLog, setPressureLog] = useState(0); // log10 tekanan (atm), 0 = 1 atm
  const [imf, setImf] = useState(1); // pengali gaya antar atom (what-if), 1 = normal
  const [openState, setOpenState] = useState(null); // kartu wujud yang lagi kebuka (accordion)
  const [mainOpen, setMainOpen] = useState(true); // penjelasan wujud sekarang
  const [openOther, setOpenOther] = useState({ Supersolid: true }); // item 'wujud lain' yang kebuka
  const atomCount = 84;
  const el = ELEMENTS.find((e) => e.n === elNum) || ELEMENTS[17];
  const pressure = Math.pow(10, pressureLog);
  const meltBase = (el.melt ?? 273) * imf;
  const boilBase = (el.boil ?? 373) * imf;
  // Aturan tekanan buat SEMUA wujud, buat SEMUA unsur:
  // - Padat: He baru bisa padat di >= ~25 bar (Keesom, 1926); unsur lain bisa padat di tekanan berapa pun.
  // - Cair: cuma ada kalau tekanan >= tekanan titik tripel unsur itu (el.tp). Di bawah itu, padat langsung menyublim jadi gas.
  //   Contoh: argon butuh >= 0,68 atm, nitrogen >= 0,124 atm, karbon >= 107 atm, arsenik >= 36 atm.
  // - BEC / fermionik: cuma ada di gas encer, jadi di model ini cuma kalau tekanan <= 1 atm.
  //   Aslinya BEC butuh vakum ultra-tinggi (kerapatan ~10^12 atom/cm3, sejuta kali lebih encer dari udara) —
  //   batas 1 atm di sini adalah penyederhanaan supaya wujudnya tetap kelihatan di tekanan normal.
  // - Superkritis: kalau tekanan > tekanan kritis DAN suhu > suhu kritis, cair dan gas jadi satu fase.
  const tp = el.tp || 0;
  const caps = {
    solid: el.solid || (el.s === 'He' && pressure >= 25),
    liquid: el.n < 104 && pressure >= tp && (el.liquid || el.s === 'C' || el.s === 'As'),
    gas: el.gas,
    bec: el.bec && pressure <= 1,
    ferm: el.ferm && pressure <= 1,
    super: !!(el.crit && pressure > el.crit.p),
  };
  caps.superfluid = el.s === 'He' && !caps.solid;
  const melt = meltBase * (1 + 0.005 * Math.log(pressure));
  const boil = boilAtPressure(boilBase, pressure);
  const hasData = el.melt != null && el.boil != null;
  const cohKj = el.boil ? (85 * el.boil / 1000) : null; // perkiraan energi kohesif, aturan Trouton
  const state = getState(temp, melt, boil, el, caps);
  const info = INFO[state];
  const mat = materialOf(el); // bentuk materi unsur yang dipilih, di suhu ruang

  const stats = useMemo(() => {
    const R = 8.314, M = (el.mass || 40) / 1000; // kg/mol
    const vrms = temp === 0 ? 0 : Math.sqrt((3 * R * temp) / M);
    const keEV = (1.5 * 1.380649e-23 * temp) / 1.602e-19;
    return { vrms, keEV };
  }, [temp, el]);

  const marker = temp === 0 ? 0 : (Math.log10(temp + 1) / Math.log10(15001)) * 100;
  // Segmen bar wujud: lebarnya mengikuti skala log suhu dan ambang unsur yang dipilih,
  // supaya penanda suhu selalu jatuh di dalam segmen wujud yang benar (dulu lebarnya sama rata,
  // jadi 1.310 K yang masih padat buat vanadium malah jatuh di zona plasma).
  const logFrac = (x) => (x === 0 ? 0 : Math.log10(x + 1) / Math.log10(15001));
  const solidEnd = caps.liquid ? melt : Math.min(melt, boil);
  const gasStart = caps.liquid ? boil : Math.min(melt, boil);
  const segs = [];
  if (el.n >= 104) { segs.push({ name: 'Tidak stabil', color: '#94a3b8', from: 0, to: logFrac(10000) }); }
  else {
    if (caps.ferm) segs.push({ name: 'Fermionik', color: '#f472b6', from: 0, to: logFrac(0.0000001) });
    if (caps.bec) segs.push({ name: 'BEC', color: '#c084fc', from: caps.ferm ? logFrac(0.0000001) : 0, to: logFrac(0.001) });
    const qStart = caps.bec ? logFrac(0.001) : caps.ferm ? logFrac(0.0000001) : 0;
    if (caps.solid) segs.push({ name: 'Padat', color: '#38bdf8', from: qStart, to: logFrac(solidEnd) });
    if (caps.superfluid) segs.push({ name: 'Superfluid', color: '#22d3ee', from: qStart, to: logFrac(2.17) });
    if (caps.liquid) segs.push({ name: 'Cair', color: '#4ade80', from: caps.superfluid ? logFrac(2.17) : caps.solid ? logFrac(melt) : qStart, to: logFrac(boil) });
    if (caps.gas) segs.push({ name: 'Gas', color: '#facc15', from: caps.liquid ? logFrac(boil) : caps.solid ? logFrac(solidEnd) : qStart, to: (caps.super && el.crit) ? logFrac(el.crit.t) : logFrac(10000) });
    if (caps.super && el.crit) segs.push({ name: 'Superkritis', color: '#a78bfa', from: logFrac(el.crit.t), to: logFrac(10000) });
  }
  segs.push({ name: 'Plasma', color: '#fb923c', from: logFrac(10000), to: 1 });
  // Gradiennya dibikin halus: tiap batas antar wujud dibaur (blend) selebar ~2% ke tiap sisi,
  // jadi warnanya ngalir, bukan patah keras. Segmen yang terlalu tipis buat dibaur dibiarkan apa adanya.
  const barBg = (() => {
    const vis = segs.filter((s) => (s.to - s.from) * 100 > 0.05);
    if (vis.length === 0) return 'linear-gradient(90deg, #334155, #334155)';
    const stops = [`${vis[0].color} 0.00%`];
    for (let i = 0; i < vis.length - 1; i++) {
      const b = vis[i].to * 100;
      const w = Math.min((vis[i].to - vis[i].from) * 100, (vis[i + 1].to - vis[i + 1].from) * 100);
      const bl = Math.min(2, w * 0.4);
      stops.push(`${vis[i].color} ${(b - bl).toFixed(2)}%`, `${vis[i + 1].color} ${(b + bl).toFixed(2)}%`);
    }
    stops.push(`${vis[vis.length - 1].color} 100.00%`);
    return `linear-gradient(90deg, ${stops.join(', ')})`;
  })();
  // Label skala yang posisinya nempel di titik aslinya (skala log), bukan dibagi rata — label yang terlalu berdekatan digabung jadi satu.
  const scaleLabels = (items) => {
    const merged = [];
    items.forEach((it) => {
      const last = merged[merged.length - 1];
      if (last && Math.abs(it.frac - last.frac) < 0.09) { last.text = `${last.text} · ${it.text}`; last.frac = (last.frac + it.frac) / 2; }
      else merged.push({ ...it });
    });
    // Label dijepit ke dalam bar: yang dekat tepi kanan rata kanan, yang dekat tepi kiri rata kiri,
    // jadi tidak pernah keluar dari bar (mis. label gabungan '10.000 K · plasma · 15.000 K' yang tadinya
    // berpusat di ~98% dan meluber ke kanan, apalagi di layar HP yang sempit).
    return (
      <div style={{ position: 'relative', height: 14, marginTop: 2, fontSize: 11, color: '#94a3b8' }}>
        {merged.map((m, i) => {
          const edge = m.frac <= 0.08 ? 'left' : m.frac >= 0.92 ? 'right' : 'center';
          return (
            <span key={i} style={{ position: 'absolute', left: edge === 'right' ? '100%' : edge === 'left' ? '0%' : `${(m.frac * 100).toFixed(2)}%`, transform: edge === 'right' ? 'translateX(-100%)' : edge === 'left' ? 'translateX(0)' : 'translateX(-50%)', whiteSpace: 'nowrap' }}>{m.text}</span>
          );
        })}
      </div>
    );
  };
  const barRef = useRef(null);
  const tempFromBar = (e) => {
    const rect = barRef.current.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    if (frac < 0.01) return setTemp(0);
    const t = Math.pow(10, frac * Math.log10(15001)) - 1;
    setTemp(Math.round(t / 5) * 5);
  };
  const selectEl = (n) => { setElNum(n); };
  useEffect(() => { setOpenState(state); }, [state]);
  const q = query.trim().toLowerCase();
  const matches = (e) => !q || e.s.toLowerCase() === q || e.name.toLowerCase().includes(q) || String(e.n) === q;
  const firstMatch = ELEMENTS.find(matches);

  const presets = [
    { label: 'Nol mutlak', t: 0 },
    ...(caps.ferm ? [{ label: 'Fermionik', t: 0.00000005 }] : []),
    ...(caps.bec ? [{ label: 'BEC', t: 0.00000017 }] : []),
    ...(caps.superfluid ? [{ label: 'Superfluid', t: 1 }] : []),
    ...(caps.solid && el.n < 104 ? [{ label: 'Padat', t: Math.round(melt * 0.6) }] : []),
    ...(caps.liquid && el.n < 104 ? [{ label: 'Cair', t: Math.round((melt + boil) / 2) }] : []),
    ...(caps.gas && el.n < 104 ? [{ label: 'Gas', t: Math.round(Math.min(boil * 2, 9000)) }] : []),
    ...(caps.super && el.crit ? [{ label: 'Superkritis', t: Math.round(Math.min(el.crit.t * 1.2, 9000)) }] : []),
    { label: 'Plasma', t: 12000 },
  ];

  return (
    <div className="wrap">
      <div className="liquid-bg" aria-hidden="true"><i className="blob b1" /><i className="blob b2" /><i className="blob b3" /><i className="blob b4" /></div>
      <header>
        <div className="eyebrow">FaseZat · Simulasi Fisika 3D Interaktif</div>
        <h1>Seberapa cepat sih atom bergerak?<br />Dari nol mutlak sampai plasma.</h1>
        <p>Suhu itu sebenarnya gerakan atom. Pilih unsur, atur suhu dan tekanannya — tiap unsur punya titik leleh dan titik didih sendiri, jadi wujudnya berubah di suhu yang beda-beda.</p>
        <div className="chipRow"><span className="chip">118 unsur</span><span className="chip">0–15.000 K</span><span className="chip">0,01–200 atm</span><span className="chip">10 wujud zat</span></div>
      </header>

      <div className="panel" style={{ marginTop: 18 }}>
        <p className="stepLabel"><b>COBA INI</b> · SATU KLIK LANGSUNG KE EKSPERIMENNYA</p>
        <div className="tryGrid">
          {[
            { ico: '🌊', name: 'Helium superfluid', desc: 'Helium cair di bawah 2,17 K ngalir tanpa gesekan.', n: 2, temp: 1, pLog: 0 },
            { ico: '🧊', name: 'Helium padat', desc: 'Di 1 atm helium nggak bisa beku — tekan sampai 30 atm.', n: 2, temp: 1, pLog: 1.48 },
            { ico: '💨', name: 'Argon menyublim', desc: 'Di 0,01 atm argon langsung padat ke gas, tanpa cair.', n: 18, temp: 50, pLog: -2 },
            { ico: '🔥', name: 'Karbon jadi cair', desc: 'Di 1 atm karbon menyublim — cairnya baru ada di 110 atm.', n: 6, temp: 4200, pLog: 2.04 },
            { ico: '🌀', name: 'Nitrogen superkritis', desc: 'Di atas 34 atm dan 126 K, cair dan gas jadi satu.', n: 7, temp: 150, pLog: 1.6 },
            { ico: '✨', name: 'BEC Rubidium', desc: 'Gas rubidium di 170 nK jadi satu gelombang raksasa.', n: 37, temp: 0.00000017, pLog: 0 },
          ].map((x) => (
            <button key={x.name} className="tryCard" onClick={() => { setElNum(x.n); setTemp(x.temp); setPressureLog(x.pLog); setImf(1); }}>
              <span className="ico">{x.ico}</span><b>{x.name}</b><span>{x.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="panel" style={{ marginTop: 14 }}>
        <p className="stepLabel"><b>01</b> · PILIH UNSURMU</p>
        <h2 style={{ margin: '0 0 4px' }}>Pilih unsurmu</h2>
        <p style={{ margin: '0 0 12px', color: '#b8c6e6', fontSize: 14, lineHeight: 1.6 }}>Klik kotaknya di tabel periodik, atau ketik nama / simbol / nomor atom di kolom cari. Semua 118 unsur pakai cara yang sama: titik leleh dan titik didihnya yang nentuin kapan padat, cair, dan gas. Tiap kotak juga nunjukin bentuk materi unsurnya di suhu ruang — gelembung buat gas, tetesan buat cair, bongkahan logam atau kristal buat padat. Gambarnya diam, bukan model 3D yang bisa diputar.</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && firstMatch) selectEl(firstMatch.n); }} placeholder="Cari unsur… misal Fe, Besi, Emas, 26" aria-label="Cari unsur" className="searchField" />
          {firstMatch && q && <button className="toggle" style={{ width: 'auto', flex: '0 0 auto' }} onClick={() => selectEl(firstMatch.n)}>Pilih {firstMatch.s}</button>}
        </div>
        <div className="ptable" role="grid" aria-label="Tabel periodik">
          {ELEMENTS.map((e) => (
            <button key={e.n} className={`tile ${e.n === elNum ? 'selected' : ''} ${q && !matches(e) ? 'dim' : ''}`} style={{ gridColumn: e.x, gridRow: e.y, borderColor: CAT_COLOR[e.cat] || '#334155' }} onClick={() => selectEl(e.n)} title={`${e.name} (${e.s}) · No. ${e.n} · meleleh ${fmtK(e.melt)} · mendidih ${fmtK(e.boil)}`}>
              <span className="tileNum">{e.n}</span>
              <span className="tileGem"><MaterialForm {...materialOf(e)} /></span>
              <span className="tileSym">{e.s}</span>
            </button>
          ))}
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>Yang dipilih: <b style={{ color: '#fff' }}>{el.name} ({el.s})</b> — No. atom {el.n} · massa {el.mass} u · {el.cat || ''}</div>
      </div>

      <div className="panel panel--hero" style={{ marginTop: 14 }}>
        <div className="sim">
          <AtomSim temp={temp} state={state} playing={playing} atomCount={atomCount} />
          <div className="stateBadge" style={{ color: info.color }}>{el.s} · {info.name}</div>
          <div className="hint">Seret buat muter · Scroll buat zoom · 3D, live</div>
        </div>

        <div className="controls">
        <p className="stepLabel" style={{ marginBottom: 8 }}><b>02</b> · ATUR SUHU &amp; WUJUD</p>
          <div className="tempRow">
            <div className="bigTemp">{fmtTemp(temp)} <small>K</small></div>
            <div style={{ color: '#94a3b8', flex: '1 1 auto', minWidth: 120, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {temp < 0.001 && temp > 0 ? '170 nano-kelvin' : `${(temp - 273.15).toLocaleString('id-ID', { maximumFractionDigits: 1 })} °C · ${((temp - 273.15) * 9 / 5 + 32).toLocaleString('id-ID', { maximumFractionDigits: 1 })} °F`}
            </div>
            <button className="toggle" onClick={() => setPlaying(!playing)} style={{ marginLeft: 'auto' }}>{playing ? '⏸ Jeda' : '▶ Main'}</button>
          </div>
          <input type="range" min="0" max="1000" step="1" value={Math.round(marker * 10)} onChange={(e) => { const frac = Number(e.target.value) / 1000; if (frac < 0.01) setTemp(0); else setTemp(Math.round((Math.pow(10, frac * Math.log10(15001)) - 1) / 5) * 5); }} aria-label="Suhu dalam kelvin (skala log, sinkron dengan bar wujud)" />
          {scaleLabels([{ frac: 0, text: '0 K · nol mutlak' }, { frac: logFrac(melt), text: `${fmtK(melt)} · meleleh` }, { frac: logFrac(boil), text: `${fmtK(boil)} · mendidih` }, { frac: logFrac(10000), text: '10.000 K · plasma' }, { frac: 1, text: '15.000 K' }])}
          <div className="bar" ref={barRef} role="slider" aria-label="Pindah wujud: seret buat ganti suhu" aria-valuenow={Math.round(temp)} aria-valuemin={0} aria-valuemax={15000} tabIndex={0} style={{ background: barBg, cursor: 'grab', touchAction: 'none' }}
            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); tempFromBar(e); }}
            onPointerMove={(e) => { if (e.buttons) tempFromBar(e); }}
            onKeyDown={(e) => { if (e.key === 'ArrowRight') setTemp(Math.min(15000, temp + 100)); if (e.key === 'ArrowLeft') setTemp(Math.max(0, temp - 100)); }}
            title="Seret bar ini buat ganti suhu dan wujud zat"><i style={{ left: `${marker}%` }} /></div>
          <div className="legend" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', justifyContent: 'flex-start' }}>{segs.map((s) => (<span key={s.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><i style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: s.color }} />{s.name}</span>))}</div>
          <div className="presets">
            {presets.map((p) => (
              <button key={p.label} className={temp === p.t ? 'active' : ''} onClick={() => setTemp(p.t)}>{p.label}</button>
            ))}
          </div>
          <div className="innerPanel" style={{ marginTop: 16 }}>
            <p className="stepLabel" style={{ marginBottom: 6 }}><b>03</b> · TEKANAN &amp; GAYA ANTAR ATOM</p>
            <h3 style={{ margin: '0 0 4px' }}>Tekanan &amp; gaya antar atom</h3>
            <p style={{ margin: '0 0 12px', color: '#b8c6e6', fontSize: 14, lineHeight: 1.6 }}>Wujud zat nggak cuma soal suhu. Tekanan itu seberapa keras atomnya ditekan dari luar; gaya antar atom itu seberapa kuat atomnya saling nempel dari dalam. Makin tinggi tekanan, titik didihnya naik (Clausius–Clapeyron). Makin kuat gayanya, titik leleh dan titik didihnya ikut naik. Gaya antar atom aslinya udah bawaan tiap unsur — slider di bawah ini cuma buat coba-coba "gimana kalau gayanya 2× lebih kuat".</p>
            <label style={{ display: 'block', fontSize: 14, marginBottom: 4 }}>Tekanan: <b>{pressure < 1 ? pressure.toFixed(2) : pressure < 10 ? pressure.toFixed(1) : Math.round(pressure)} atm</b> · {(pressure * 101.325).toLocaleString('id-ID', { maximumFractionDigits: 0 })} kPa · {(pressure * 1.01325).toLocaleString('id-ID', { maximumFractionDigits: 1 })} bar</label>
            <input type="range" min="-2" max="2.3" step="0.01" value={pressureLog} onChange={(e) => setPressureLog(Number(e.target.value))} aria-label="Tekanan dalam atm (skala log)" />
            {scaleLabels([{ frac: 0, text: '0,01 atm' }, { frac: 1 / 4.3, text: '0,1 atm' }, { frac: 2 / 4.3, text: '1 atm' }, { frac: 3 / 4.3, text: '10 atm' }, { frac: 1, text: '200 atm' }])}
            <label style={{ display: 'block', fontSize: 14, margin: '10px 0 4px' }}>Gaya antar atom: <b>{imf.toFixed(2)}×</b> {imf < 1 ? '· lebih lemah dari aslinya' : imf > 1 ? '· lebih kuat dari aslinya' : '· normal (bawaan unsur ini)'}</label>
            <input type="range" min="0.5" max="2" step="0.05" value={imf} onChange={(e) => setImf(Number(e.target.value))} aria-label="Pengali gaya antar atom" />
            {scaleLabels([{ frac: 0, text: '0,5× · lemah' }, { frac: 0.5 / 1.5, text: '1× · normal' }, { frac: 1, text: '2× · kuat' }])}
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 8, lineHeight: 1.6 }}>
              Buat {el.name} ({el.s}) di {pressure < 1 ? pressure.toFixed(2) : Math.round(pressure)} atm dan gaya {imf.toFixed(2)}×: meleleh di <b style={{ color: '#fff' }}>{fmtK(melt)}</b>, mendidih di <b style={{ color: '#fff' }}>{fmtK(boil)}</b>{cohKj ? <> · perkiraan energi kohesifnya <b style={{ color: '#fff' }}>{cohKj.toFixed(1)} kJ/mol</b> (aturan Trouton)</> : ''}.
              {el.s === 'He' && pressure >= 25 ? ' Tekananmu udah di atas ~25 bar, jadi helium akhirnya bisa padat.' : ''}
              {el.s === 'C' && pressure >= 107 ? ' Tekananmu udah di atas titik tripel karbon (107 atm), jadi karbon akhirnya bisa cair.' : ''}
              {el.s === 'As' && pressure >= 36 ? ' Tekananmu udah di atas titik tripel arsenik (36 atm), jadi arsenik akhirnya bisa cair.' : ''}
            </div>
            <button className="toggle" style={{ width: 'auto', marginTop: 10 }} onClick={() => { setPressureLog(0); setImf(1); }}>Reset ke 1 atm &amp; gaya normal</button>
          </div>
          <div className="stats">
            <div className="stat"><b>{stats.vrms === 0 ? '0' : Math.round(stats.vrms).toLocaleString('id-ID')} m/s</b><span>Kecepatan rata-rata atom (vᵣₘₛ)</span></div>
            <div className="stat"><b>{stats.keEV < 0.01 ? stats.keEV.toExponential(1) : stats.keEV.toFixed(2)} eV</b><span>Energi gerak tiap atom</span></div>
            <div className="stat"><b>{info.tag}</b><span>Atomnya lagi ngapain</span></div>
            <div className="stat"><b>{atomCount} atom</b><span>Di kotak 3D · {el.name} ({el.s})</span></div>
          </div>

          <div className="matCard">
            <div className="matBox" style={{ borderColor: `#${el.color || '38bdf8'}` }}>
              <span className="matGem"><MaterialForm {...mat} /></span>
              <span className="matSym" style={{ color: `#${el.color || '38bdf8'}` }}>{el.s}</span>
            </div>
            <div style={{ flex: '1 1 220px' }}>
              <b>{el.name} ({el.s}) — {el.cat || 'unsur'}</b>
              <div className="matLabel" style={{ marginTop: 4 }}>Bentuk materi di suhu ruang · {mat.label}</div>
              <div style={{ color: '#b8c6e6', fontSize: 14, lineHeight: 1.55 }}>Nomor atom {el.n} · massa atom {el.mass} u · di 1 atm meleleh di <b style={{ color: '#fff' }}>{fmtK(el.melt)}</b> · mendidih di <b style={{ color: '#fff' }}>{fmtK(el.boil)}</b>{!hasData ? ' · sebagian datanya belum tersedia, jadi simulasi pakai patokan umum' : ''}. Di tekanan dan gaya antar atom yang kamu atur sekarang: meleleh di <b style={{ color: '#fff' }}>{fmtK(melt)}</b>, mendidih di <b style={{ color: '#fff' }}>{fmtK(boil)}</b>. {el.n >= 104 ? 'Unsur superberat: belum pernah ada sampel makroskopisnya, cuma dibuat atom per atom dan meluruh dalam hitungan detik/menit, jadi padat, cair, dan gas curahnya nggak bisa diamati.' : el.s === 'He' && !caps.solid ? 'Helium satu-satunya unsur yang nggak bisa membeku di tekanan 1 atm, bahkan di 0 K — butuh sekitar 25 bar baru bisa padat. Naikin tekanannya di atas 25 bar biar dia bisa padat. Di bawah 2,17 K, helium cairnya jadi superfluid — ngalir tanpa gesekan.' : !caps.liquid ? `Di tekanan ini (${pressure < 1 ? pressure.toFixed(2) : Math.round(pressure)} atm), ${el.name} langsung menyublim dari padat ke gas di ${fmtK(Math.min(melt, boil))}, tanpa jadi cair dulu — cairnya butuh tekanan di atas ${tp} atm (titik tripelnya).` : 'Di bawah titik leleh dia padat, di antara titik leleh dan titik didih dia cair, di atas titik didih dia gas.'}{!caps.bec && el.bec ? ' Tekanan di atas 1 atm: gasnya terlalu rapat buat jadi BEC — BEC butuh gas encer.' : ''}{caps.super && el.crit ? ` Di atas titik kritis (${fmtK(el.crit.t)}, ${el.crit.p} atm), cair dan gas nggak bisa dibedakan lagi — jadi superkritis.` : ''}</div>
            </div>
            <div style={{ flex: '1 1 100%' }}>
              <p className="stepLabel" style={{ marginBottom: 6 }}>MODEL BOHR 3D</p>
              <BohrModel key={el.n} url={el.bohr} name={el.name} />
              <p style={{ fontSize: 12, color: '#94a3b8', margin: '6px 0 0', lineHeight: 1.6 }}>Inti atom di tengah, elektron mengorbit di kulitnya — skema Bohr buat {el.name}. Ini penyederhanaan: elektron aslinya bukan bola kecil yang mengorbit, melainkan awan peluang. Model 3D: Google, lewat Periodic-Table-JSON.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid2">
        <div className="panel stateCard" style={{ borderTop: `3px solid ${info.color}` }}>
          <p className="stepLabel" style={{ marginBottom: 6 }}><b>04</b> · WUJUDNYA SEKARANG</p>
          <Collapse open={mainOpen} onToggle={() => setMainOpen(!mainOpen)} maxH={600} header={<h2 style={{ color: info.color, margin: 0 }}>{el.s} · {info.name}</h2>}>
            <p style={{ marginTop: 10 }}>{info.desc}</p>
            <p style={{ color: '#7dd3fc', fontWeight: 700 }}>Buat {el.name} ({el.s}) di {pressure < 1 ? pressure.toFixed(2) : Math.round(pressure)} atm, gaya {imf.toFixed(2)}×: meleleh di {fmtK(melt)}, mendidih di {fmtK(boil)}.</p>
            <ul>{info.points.map((p) => <li key={p}>{p}</li>)}</ul>
          </Collapse>
        </div>
        <div className="panel stateCard">
          <h2>Intinya: panas itu gerakan</h2>
          <p>Suhu itu bukan yang <i>bikin</i> atom bergerak — suhu itu <i>ukuran</i> seberapa cepat atom bergerak rata-rata.</p>
          <p><code>vᵣₘₛ = √(3RT / M)</code> — kalau suhu mutlaknya digandakan, atom jadi sekitar 41% lebih cepat. M itu massa atom unsurnya, jadi atom yang ringan (kayak hidrogen) larinya lebih kencang daripada atom berat (kayak emas) di suhu yang sama. Kasih energi yang cukup, ikatan yang nahan padatan bakal putus (meleleh), terus atom kabur satu sama lain (mendidih), sampai akhirnya elektronnya pun lepas (plasma).</p>
          <p>Dinginkan ke arah sebaliknya, gerakannya pelan-pelan hilang: cair → padat → hampir diam di 0 K. Dinginkan lebih jauh lagi, sampai di bawah satu mikro-kelvin, mekanika kuantum yang ambil alih — tapi cuma buat unsur tertentu yang memang bisa: jadilah kondensat Bose–Einstein, dan di dekat 0 K, fermion yang berpasangan bisa jadi kondensat fermionik. Kalau unsurnya nggak bisa, dia tetap padat beku di suhu itu.</p>
        </div>
      </div>

      <p style={{ fontSize: 13, color: '#94a3b8', margin: '16px 0 0' }}>Klik kartu wujudnya buat buka atau tutup penjelasannya — kartu wujud yang lagi aktif kebuka otomatis.</p>
      <div className="cards">
        {Object.entries(INFO).filter(([k]) => (k !== 'fermionic' || caps.ferm) && (k !== 'bec' || caps.bec) && (k !== 'supercritical' || caps.super) && (k !== 'superfluid' || caps.superfluid) && (k !== 'solid' || caps.solid) && (k !== 'liquid' || caps.liquid) && (k !== 'gas' || caps.gas) && (k !== 'unstable' || el.n >= 104)).map(([k, v]) => (
          <div className="card" key={k} style={{ borderTop: `3px solid ${v.color}`, background: k === state ? '#101d38' : undefined }}>
            <Collapse open={openState === k} onToggle={() => setOpenState(openState === k ? null : k)} maxH={300} header={<><div className="k" style={{ color: v.color }}>{k === 'zero' ? '0 K' : k === 'fermionic' ? '< 0,0000001 K' : k === 'bec' ? '0,0000001–0,001 K' : k === 'unstable' ? 'No. atom 104–118' : k === 'solid' ? `< ${fmtK(melt)}` : k === 'liquid' ? (caps.superfluid ? `${fmtK(2.17)}–${fmtK(boil)}` : caps.solid ? `${fmtK(melt)}–${fmtK(boil)}` : `< ${fmtK(boil)}`) : k === 'superfluid' ? '0,001–2,17 K' : k === 'supercritical' ? `> ${fmtK(el.crit.t)} · di atas titik kritis` : k === 'gas' ? (caps.liquid ? `${fmtK(boil)}–10.000 K` : `> ${fmtK(Math.min(melt, boil))} · menyublim`) : '> 10.000 K'}</div><h3 style={{ margin: '0 0 2px' }}>{v.name}</h3></>}>
              <p style={{ marginTop: 8 }}>{v.desc}</p>
            </Collapse>
          </div>
        ))}
      </div>

      <div className="panel" style={{ marginTop: 18 }}>
        <h2 style={{ margin: '0 0 4px' }}>Wujud lain yang dikenal fisika — tapi nggak ada di slider ini</h2>
        <p style={{ margin: '0 0 12px', color: '#b8c6e6', fontSize: 14, lineHeight: 1.6 }}>Bukan karena ketinggalan — tapi karena wujud-wujud ini nggak bisa dipilih cuma dengan suhu dan tekanan di slider ini. Ini daftar lengkapnya:</p>
        <div style={{ display: 'grid', gap: 10 }}>
          <Collapse open={!!openOther['Supersolid']} onToggle={() => setOpenOther((o) => ({ ...o, 'Supersolid': !o['Supersolid'] }))} maxH={400} header={<b style={{ color: '#a5b4fc' }}>Supersolid</b>}><span style={{ color: '#b8c6e6', fontSize: 14, display: 'block', marginTop: 4, lineHeight: 1.6 }}> — padat yang ngalir tanpa gesekan. Diklaim tahun 2004 di helium padat di bawah 0,2 K (Kim & Chan), tapi tahun 2012 kelompok yang sama mengulang eksperimennya dengan desain yang lebih bersih dan tidak menemukan apa-apa — sinyalnya ternyata efek elastis, bukan supersolid. Supersolid baru benar-benar teramati tahun 2017 di gas atom ultra-dingin, bukan di helium padat. Jadi di situs ini dia nggak jadi wujud yang bisa dipilih.</span></Collapse>
          <Collapse open={!!openOther['Kristal cair']} onToggle={() => setOpenOther((o) => ({ ...o, 'Kristal cair': !o['Kristal cair'] }))} maxH={400} header={<b style={{ color: '#fda4af' }}>Kristal cair</b>}><span style={{ color: '#b8c6e6', fontSize: 14, display: 'block', marginTop: 4, lineHeight: 1.6 }}> — di antara padat dan cair: molekulnya sejajar tapi masih bisa ngalir (ini yang dipakai di layar LCD). Tapi ini wujudnya molekul panjang, bukan unsur — nggak ada unsur yang jadi kristal cair, jadi nggak muncul di tabel periodik ini.</span></Collapse>
          <Collapse open={!!openOther['Kaca / padat amorf']} onToggle={() => setOpenOther((o) => ({ ...o, 'Kaca / padat amorf': !o['Kaca / padat amorf'] }))} maxH={400} header={<b style={{ color: '#d6d3d1' }}>Kaca / padat amorf</b>}><span style={{ color: '#b8c6e6', fontSize: 14, display: 'block', marginTop: 4, lineHeight: 1.6 }}> — padat yang atomnya acak, bukan kristal rapi. Ini bukan wujud yang muncul di suhu tertentu, tapi hasil dari kecepatan pendinginan: cairan yang didinginkan super cepat sampai atomnya nggak sempat tersusun rapi. Silikon dan beberapa logam bisa jadi kaca, tapi butuh laju pendinginan jutaan derajat per detik.</span></Collapse>
          <Collapse open={!!openOther['Plasma quark-gluon']} onToggle={() => setOpenOther((o) => ({ ...o, 'Plasma quark-gluon': !o['Plasma quark-gluon'] }))} maxH={400} header={<b style={{ color: '#fca5a5' }}>Plasma quark-gluon</b>}><span style={{ color: '#b8c6e6', fontSize: 14, display: 'block', marginTop: 4, lineHeight: 1.6 }}> — di atas ~2 triliun K, proton dan neutronnya sendiri meleleh jadi sup quark dan gluon. Ini wujud sesaat setelah Big Bang, dibuat di RHIC dan LHC dengan menabrakkan inti atom. Slider situs ini mentok di 15.000 K — jauh banget dari 2 triliun K.</span></Collapse>
          <Collapse open={!!openOther['Materi degenerat']} onToggle={() => setOpenOther((o) => ({ ...o, 'Materi degenerat': !o['Materi degenerat'] }))} maxH={400} header={<b style={{ color: '#fcd34d' }}>Materi degenerat</b>}><span style={{ color: '#b8c6e6', fontSize: 14, display: 'block', marginTop: 4, lineHeight: 1.6 }}> — di inti bintang neutron, materi dipadatkan sampai ~10¹⁴ gram per cm³, dan tekanannya bukan dari suhu tapi dari prinsip Pauli. Bukan wujud yang bisa dibuat dengan suhu dan tekanan di laboratorium.</span></Collapse>
          <Collapse open={!!openOther['Alotrop padat']} onToggle={() => setOpenOther((o) => ({ ...o, 'Alotrop padat': !o['Alotrop padat'] }))} maxH={400} header={<b style={{ color: '#86efac' }}>Alotrop padat</b>}><span style={{ color: '#b8c6e6', fontSize: 14, display: 'block', marginTop: 4, lineHeight: 1.6 }}> — unsur yang sama bisa punya beberapa bentuk padat: karbon bisa jadi grafit atau berlian (berlian butuh ~12 GPa, sekitar 120.000 atm — jauh di luar slider 200 atm), timah berubah dari timah putih ke timah abu-abu di 13,2 °C, besi berubah fase di 912 °C. Ini fase-fase padat, bukan wujud baru — makanya di situs ini padat tetap satu wujud.</span></Collapse>
        </div>
      </div>

      <footer style={{ marginTop: 28, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,.12)', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 13, color: '#7d8aa8' }}>FaseZat · Visualisasi buat belajar, bukan alat ukur.</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a href="/sumber" className="footLink">Sumber</a>
          <a href="https://www.instagram.com/edge_ofuniverse?srtk=NG84NDhiNGtiZ29o" target="_blank" rel="noreferrer" className="footLink"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>@edge_ofuniverse</a>
        </div>
      </footer>
    </div>
  );
}
