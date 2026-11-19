// Bentuk materi unsur — gambar SVG STATIS yang kelihatan 3D.
// Sengaja TIDAK interaktif: tidak ada onClick, onDrag, hover yang mengubah
// bentuk, atau animasi pada gambarnya. Yang bisa diklik adalah tombol tile-nya
// (di page.js), bukan gambar ini — gambar ini cuma hiasan di dalam tile.
// pointer-events: none memastikan gambar tidak pernah menangkap interaksi.
//
// Bentuknya mengikuti wujud materi di suhu ruang (dari data/materials.js):
//   gas     → gelembung bening (bola transparan dengan kilau)
//   liquid  → tetesan (bentuk tetes air mengilap)
//   metal   → bongkahan logam ( segi banyak dengan faset + kilau logam)
//   crystal → kristal (pecahan segi banyak dengan faset)
//   ghost   → kristal pudar bergaris putus-putus (unsur yang belum ada sampelnya)

import { useId } from 'react';

export default function MaterialForm({ form, hi, mid, deep, className }) {
  const raw = useId().replace(/[^a-zA-Z0-9]/g, '');
  const g = `g${raw}`;
  const r = `r${raw}`;
  const l = `l${raw}`;
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false" style={{ pointerEvents: 'none', display: 'block' }}>
      <defs>
        <radialGradient id={g} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor={hi} stopOpacity="0.95" />
          <stop offset="45%" stopColor={mid} stopOpacity="0.85" />
          <stop offset="100%" stopColor={deep} stopOpacity="0.9" />
        </radialGradient>
        <radialGradient id={r} cx="35%" cy="28%" r="80%">
          <stop offset="0%" stopColor={hi} stopOpacity="0.55" />
          <stop offset="55%" stopColor={mid} stopOpacity="0.28" />
          <stop offset="100%" stopColor={deep} stopOpacity="0.12" />
        </radialGradient>
        <linearGradient id={l} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={hi} />
          <stop offset="55%" stopColor={mid} />
          <stop offset="100%" stopColor={deep} />
        </linearGradient>
      </defs>

      {form === 'gas' && (
        <g>
          <ellipse cx="32" cy="59" rx="13" ry="2.5" fill="#000" opacity="0.25" />
          <circle cx="32" cy="33" r="23" fill={`url(#${r})`} stroke="#ffffff" strokeOpacity="0.55" strokeWidth="1.2" />
          <ellipse cx="24" cy="23" rx="6.5" ry="4" fill="#fff" opacity="0.85" transform="rotate(-25 24 23)" />
          <circle cx="41" cy="42" r="4.5" fill="#fff" opacity="0.3" />
          <circle cx="39" cy="40" r="1.6" fill="#fff" opacity="0.5" />
        </g>
      )}

      {form === 'liquid' && (
        <g>
          <ellipse cx="32" cy="59" rx="13" ry="2.5" fill="#000" opacity="0.25" />
          <path d="M32 5 C32 5 15 28 15 41 a17 17 0 0 0 34 0 C49 28 32 5 32 5 Z" fill={`url(#${l})`} />
          <ellipse cx="25" cy="38" rx="4" ry="8" fill="#fff" opacity="0.75" transform="rotate(12 25 38)" />
          <ellipse cx="39" cy="48" rx="2.5" ry="4" fill="#fff" opacity="0.35" transform="rotate(12 39 48)" />
        </g>
      )}

      {form === 'metal' && (
        <g>
          <ellipse cx="32" cy="59" rx="15" ry="2.5" fill="#000" opacity="0.3" />
          <polygon points="14,44 20,20 32,11 50,22 52,44 32,55" fill={`url(#${l})`} />
          <polygon points="20,20 32,11 32,33 20,44" fill="#fff" opacity="0.14" />
          <polygon points="32,11 50,22 32,33" fill="#fff" opacity="0.22" />
          <polygon points="32,33 50,22 52,44 32,55" fill="#000" opacity="0.18" />
          <polyline points="20,20 32,33 50,22" fill="none" stroke="#000" strokeOpacity="0.25" strokeWidth="1" />
          <polyline points="32,33 32,55" fill="none" stroke="#000" strokeOpacity="0.22" strokeWidth="1" />
          <polyline points="20,20 32,11 50,22" fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="1" />
          <polygon points="22,22 30,14 33,17 25,25" fill="#fff" opacity="0.4" />
        </g>
      )}

      {form === 'crystal' && (
        <g>
          <ellipse cx="32" cy="59" rx="13" ry="2.5" fill="#000" opacity="0.3" />
          <polygon points="32,5 49,25 44,53 20,53 15,25" fill={`url(#${l})`} />
          <polygon points="32,5 49,25 32,33" fill="#fff" opacity="0.2" />
          <polygon points="32,5 15,25 32,33" fill="#fff" opacity="0.12" />
          <polygon points="32,33 49,25 44,53 32,53" fill="#000" opacity="0.16" />
          <polyline points="15,25 32,33 49,25" fill="none" stroke="#000" strokeOpacity="0.25" strokeWidth="1" />
          <polyline points="32,33 32,53" fill="none" stroke="#000" strokeOpacity="0.22" strokeWidth="1" />
          <polyline points="32,5 32,33" fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="1" />
          <polygon points="26,12 32,6 34,10 28,16" fill="#fff" opacity="0.4" />
        </g>
      )}

      {form === 'ghost' && (
        <g>
          <polygon points="32,5 49,25 44,53 20,53 15,25" fill={mid} opacity="0.22" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="1.2" strokeDasharray="3 2.5" />
          <polyline points="15,25 32,33 49,25" fill="none" stroke="#fff" strokeOpacity="0.25" strokeWidth="1" />
          <polyline points="32,5 32,33" fill="none" stroke="#fff" strokeOpacity="0.3" strokeWidth="1" />
        </g>
      )}
    </svg>
  );
}
