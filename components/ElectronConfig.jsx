'use client';
import { useMemo, useState } from 'react';
import { ELECTRON_CONFIG } from '../data/electronConfig';

const SHELL_NAMES = ['K', 'L', 'M', 'N', 'O', 'P', 'Q'];
const AUFBAU_ORDER = ['1s', '2s', '2p', '3s', '3p', '4s', '3d', '4p', '5s', '4d', '5p', '6s', '4f', '5d', '6p', '7s', '5f', '6d', '7p'];
const CAPACITY = { s: 2, p: 6, d: 10, f: 14 };

// "1s2 2s2 2p6" -> [{ orb: '1s', n: 2 }, ...]
function parseConfig(str) {
  return str.trim().split(/\s+/).map((t) => {
    const m = t.match(/^(\d[spdf])(\d+)$/);
    return m ? { orb: m[1], n: parseInt(m[2], 10) } : null;
  }).filter(Boolean);
}

// Konfigurasi kalau ngikutin urutan Aufbau mentah-mentah (tanpa pengecualian).
function naiveConfig(z) {
  let left = z;
  const out = [];
  for (const orb of AUFBAU_ORDER) {
    if (left <= 0) break;
    const n = Math.min(CAPACITY[orb[1]], left);
    out.push({ orb, n });
    left -= n;
  }
  return out;
}

// "1s2 2s2" atau "[Ar] 3d5 4s1" -> tampilan dengan pangkat (1s², 3d⁵).
function Notation({ text }) {
  const clean = text.replace(/^\*/, '').trim();
  const tokens = clean.split(/\s+/);
  return (
    <span>
      {tokens.map((t, i) => {
        if (t.startsWith('[')) return <b key={i} style={{ color: '#fff' }}>{t}{i < tokens.length - 1 ? ' ' : ''}</b>;
        const m = t.match(/^(\d[spdf])(\d+)$/);
        if (!m) return <span key={i}>{t} </span>;
        return (
          <span key={i}>
            {m[1]}<sup style={{ fontSize: '0.7em' }}>{m[2]}</sup>
            {i < tokens.length - 1 ? ' ' : ''}
          </span>
        );
      })}
    </span>
  );
}

// Diagram Bohr sederhana: inti di tengah, kulit-kulitnya lingkaran, elektronnya titik.
// Elektronnya mengorbit beneran (animasi putar CSS) — kulit luar muternya lebih
// pelan daripada kulit dalam, kayak orbit Bohr yang periodenya nambah sama n.
function BohrDiagram({ shells, symbol, color, playing }) {
  const cx = 120, cy = 120;
  const step = shells.length > 1 ? 92 / shells.length : 0;
  const rings = shells.map((count, i) => {
    const r = 26 + i * step + (shells.length > 1 ? step / 2 : 34);
    const dots = [];
    for (let j = 0; j < count; j++) {
      const a = (-90 + (j * 360) / count) * Math.PI / 180;
      dots.push(<circle key={j} cx={cx + r * Math.cos(a)} cy={cy + r * Math.sin(a)} r={3.4} fill={`#${color}`} />);
    }
    return (
      <g key={i} className="bohr-orbit" style={{ animationDuration: `${5 + i * 2.5}s`, animationPlayState: playing ? 'running' : 'paused' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#334155" strokeWidth="1" />
        {dots}
      </g>
    );
  });
  return (
    <svg viewBox="0 0 240 240" width="100%" style={{ maxWidth: 220, display: 'block', margin: '0 auto' }} role="img" aria-label={`Diagram kulit Bohr ${symbol}`}>
      {rings}
      <circle cx={cx} cy={cy} r={17} fill={`#${color}`} />
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize={symbol.length > 1 ? 13 : 15} fontWeight="700" fill="#0b1428">{symbol}</text>
    </svg>
  );
}

export default function ElectronConfig({ el }) {
  const [orbitOn, setOrbitOn] = useState(true);
  const cfg = useMemo(() => ELECTRON_CONFIG.find((c) => c.n === el.n), [el.n]);
  const { shells, configStr, semantic, naiveStr, isException, lastOrb, valence, valenceShell, occMap } = useMemo(() => {
    if (!cfg) return {};
    const parts = parseConfig(cfg.config);
    const naive = naiveConfig(el.n);
    const occMap = {};
    parts.forEach((p) => { occMap[p.orb] = p.n; });
    return {
      shells: cfg.shells,
      configStr: cfg.config,
      semantic: cfg.semantic,
      naiveStr: naive.map((p) => `${p.orb}${p.n}`).join(' '),
      isException: naive.map((p) => `${p.orb}${p.n}`).join(' ') !== cfg.config,
      lastOrb: parts.length ? parts[parts.length - 1].orb : null,
      valence: cfg.shells[cfg.shells.length - 1],
      valenceShell: SHELL_NAMES[cfg.shells.length - 1],
      occMap,
    };
  }, [cfg, el.n]);

  if (!cfg) return null;
  const color = `#${el.color || '38bdf8'}`;

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ flex: '0 0 auto', margin: '0 auto' }}>
          <BohrDiagram shells={shells} symbol={el.s} color={el.color || '38bdf8'} playing={orbitOn} />
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 6 }}>
            <button className="toggle" style={{ width: 'auto', fontSize: 13, padding: '6px 12px' }} onClick={() => setOrbitOn(!orbitOn)} aria-pressed={orbitOn}>
              {orbitOn ? '⏸ Jeda orbit' : '▶ Putar orbit'}
            </button>
          </div>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: '6px 0 0', textAlign: 'center', lineHeight: 1.5 }}>
            Kulit Bohr {el.s}: {shells.join(' · ')}<br />Elektron valensi: <b style={{ color: '#fff' }}>{valence}</b> (kulit {valenceShell})
          </p>
        </div>
        <div style={{ flex: '1 1 260px', minWidth: 0 }}>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 4px' }}>Konfigurasi Bohr (per kulit)</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {shells.map((count, i) => (
              <span key={i} className="aufbau-pop" style={{ animationDelay: `${i * 80}ms`, display: 'inline-flex', flexDirection: 'column', alignItems: 'center', minWidth: 44, padding: '6px 8px', borderRadius: 8, border: `1px solid ${color}55`, background: 'rgba(255,255,255,0.03)' }}>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>{SHELL_NAMES[i]}</span>
                <b style={{ fontSize: 16, color: '#fff' }}>{count}</b>
              </span>
            ))}
            <span className="aufbau-pop" style={{ animationDelay: `${shells.length * 80}ms`, display: 'inline-flex', flexDirection: 'column', alignItems: 'center', minWidth: 44, padding: '6px 8px', borderRadius: 8, border: '1px solid #334155' }}>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>Total</span>
              <b style={{ fontSize: 16, color: '#fff' }}>{el.n}</b>
            </span>
          </div>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 4px' }}>Konfigurasi elektron (subkulit)</p>
          <p style={{ fontSize: 16, margin: '0 0 6px', lineHeight: 1.7, wordBreak: 'break-word' }}>
            <Notation text={configStr} />
          </p>
          {semantic && (
            <p style={{ fontSize: 14, margin: '0 0 6px', color: '#b8c6e6', lineHeight: 1.7 }}>
              Singkatnya: <Notation text={semantic} />
            </p>
          )}
          <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 12px', lineHeight: 1.6 }}>
            Dibaca: angka di depan = kulit (n), hurufnya = subkulit (s maks. 2, p maks. 6, d maks. 10, f maks. 14),
            pangkatnya = jumlah elektron di subkulit itu. Elektron valensi {el.s} ada {valence} di kulit {valenceShell} — itu yang ikut bereaksi kimia.
          </p>
          {isException && (
            <p style={{ fontSize: 13, margin: '0 0 12px', padding: '8px 10px', borderRadius: 8, border: '1px solid #f59e0b55', background: 'rgba(245,158,11,0.08)', color: '#fcd34d', lineHeight: 1.6 }}>
              ⚠ Pengecualian aturan Aufbau — kalau ngikutin urutan pengisian, {el.name} jadinya <Notation text={naiveStr} />.
              Kenyataannya <Notation text={configStr} />, karena tingkat energi subkulit terluarnya sangat berdekatan,
              jadi susunan yang paling stabil ternyata beda.
            </p>
          )}
        </div>
      </div>

      <p style={{ fontSize: 13, color: '#94a3b8', margin: '12px 0 6px' }}>Tabel Aufbau — urutan pengisian subkulit (dari energi terendah)</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {AUFBAU_ORDER.map((orb, i) => {
          const n = (occMap && occMap[orb]) || 0;
          const filled = n > 0;
          const isLast = orb === lastOrb;
          return (
            <span
              key={orb}
              className="aufbau-pop"
              title={filled ? `${orb}: ${n} elektron${isLast ? ' · elektron terakhir di sini' : ''}` : `${orb}: kosong buat ${el.s}`}
              style={{
                animationDelay: `${i * 70}ms`,
                display: 'inline-flex', flexDirection: 'column', alignItems: 'center', minWidth: 46,
                padding: '6px 8px', borderRadius: 8, lineHeight: 1.3,
                border: isLast ? `2px solid ${color}` : filled ? `1px solid ${color}88` : '1px solid #263248',
                background: filled ? 'rgba(255,255,255,0.05)' : 'transparent',
                opacity: filled ? 1 : 0.45,
              }}
            >
              <span style={{ fontSize: 11, color: '#94a3b8' }}>{i + 1}</span>
              <b style={{ fontSize: 14, color: filled ? '#fff' : '#94a3b8' }}>{orb}</b>
              <span style={{ fontSize: 12, color: filled ? color : '#64748b' }}>{filled ? `${n}e⁻` : '—'}</span>
              {isLast && <span style={{ fontSize: 10, color, fontWeight: 700 }}>terakhir</span>}
            </span>
          );
        })}
      </div>
      <p style={{ fontSize: 12, color: '#94a3b8', margin: '8px 0 0', lineHeight: 1.6 }}>
        Elektron mengisi subkulit dari energi terendah ke tertinggi — urutan ini yang disebut aturan Aufbau
        (dari bahasa Jerman <i>Aufbau</i>, artinya "membangun"). Kotak yang menyala = subkulit yang terisi buat {el.s},
        kotak redup = masih kosong.
      </p>
    </div>
  );
}
