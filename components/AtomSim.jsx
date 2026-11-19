'use client';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const BOX = 6.8;

function lattice(i, n = 84) {
  const s = Math.ceil(Math.cbrt(n));
  const spacing = 11 / s;
  const x = (i % s) - (s - 1) / 2;
  const y = (Math.floor(i / s) % s) - (s - 1) / 2;
  const z = (Math.floor(i / (s * s))) - (s - 1) / 2;
  return new THREE.Vector3(x * spacing, y * spacing + 0.4, z * spacing);
}
function randomInBox() {
  return new THREE.Vector3((Math.random() * 2 - 1) * BOX, (Math.random() * 2 - 1) * BOX, (Math.random() * 2 - 1) * BOX);
}

export default function AtomSim({ temp, state, playing, atomCount = 84 }) {
  const mountRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const live = useRef({ temp, state, playing });
  live.current = { temp, state, playing };

  useEffect(() => {
    const N = atomCount;
    const mount = mountRef.current;
    if (!mount) return;
    // Jangan bikin konteks WebGL sebelum kotaknya punya ukuran — kalau lebar/tinggi
    // masih 0 (mis. halaman baru dimuat atau baru balik dari cache), tunggu sampai
    // ada ukuran dulu, karena kamera dengan aspek 0/0 bikin kanvasnya putih kosong.
    if (mount.clientWidth === 0 || mount.clientHeight === 0) {
      const ro = new ResizeObserver(() => {
        if (mount.clientWidth > 0 && mount.clientHeight > 0) { ro.disconnect(); setRetryKey((k) => k + 1); }
      });
      ro.observe(mount);
      return () => ro.disconnect();
    }
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (e) {
      // Konteks WebGL gagal dibuat (kadang terjadi di HP) — tampilkan pesan + tombol coba lagi,
      // jangan biarkan kotaknya putih kosong.
      setFailed(true);
      return;
    }
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050914, 0.028);
    const camera = new THREE.PerspectiveCamera(52, mount.clientWidth / mount.clientHeight, 0.1, 200);
    camera.position.set(13, 9, 16);
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    // Batas piksel 1.5x (dulu 2x): di HP layarnya padat (DPR 2-3), render 2x itu
    // 4x piksel yang harus digambar tiap frame — sumber utama berat. 1.5x masih tajam.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    const canvas = renderer.domElement;
    mount.appendChild(canvas);

    // Kalau konteks WebGL-nya hilang di tengah jalan (GPU HP lagi sibuk),
    // tampilkan pesan + tombol coba lagi, bukan kanvas putih.
    const onLost = (e) => { e.preventDefault(); setFailed(true); };
    canvas.addEventListener('webglcontextlost', onLost);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.autoRotate = true; controls.autoRotateSpeed = 0.7;

    scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const dir = new THREE.DirectionalLight(0xffffff, 1.4); dir.position.set(8, 14, 10); scene.add(dir);
    const point = new THREE.PointLight(0x38bdf8, 60, 40); point.position.set(0, 0, 0); scene.add(point);

    // container box
    const box = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(BOX * 2 + 1, BOX * 2 + 1, BOX * 2 + 1)),
      new THREE.LineBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.9 })
    );
    scene.add(box);

    // BEC cloud
    const cloud = new THREE.Mesh(
      new THREE.SphereGeometry(2.6, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.16, depthWrite: false })
    );
    cloud.visible = false; scene.add(cloud);

    // Bola lebih sederhana di layar kecil (16 segmen, dulu 24): tiap atom
    // 24x24 itu ~1.150 segitiga, x84 atom = ~97 ribu segitiga per frame.
    const seg = mount.clientWidth < 820 ? 16 : 24;
    const atomGeo = new THREE.SphereGeometry(0.52, seg, seg);
    // SATU material untuk semua atom (dulu 84 material, satu per atom):
    // warnanya sama untuk semua atom di satu wujud, jadi tidak ada alasan
    // tiap atom punya material sendiri — satu material = jauh lebih ringan.
    const atomMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.25, metalness: 0.15, emissive: 0x0b2a4a, emissiveIntensity: 0.6 });
    const atoms = [];
    const anchors = [], currents = [], vels = [], phases = [];
    for (let i = 0; i < N; i++) {
      const m = new THREE.Mesh(atomGeo, atomMat);
      const a = lattice(i, N);
      m.position.copy(a);
      scene.add(m);
      atoms.push(m); anchors.push(a.clone()); currents.push(a.clone());
      vels.push(new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize());
      phases.push(Math.random() * Math.PI * 2);
    }
    // Target posisi padat/BEC/fermionik dihitung SEKALI di sini (dulu dibuat
    // ulang tiap atom tiap frame — 84 objek Vector3 baru per frame yang
    // harus dibersihkan GC terus-menerus).
    const becTargets = [], fermTargets = [];
    for (let i = 0; i < N; i++) {
      becTargets.push(new THREE.Vector3(Math.sin(i * 2.3) * 1.1, Math.cos(i * 1.7) * 0.9, Math.sin(i * 3.1) * 1.1));
      const pair = Math.floor(i / 2);
      fermTargets.push(new THREE.Vector3(Math.sin(pair * 2.3) * 1.2 + (i % 2 ? 0.35 : -0.35), Math.cos(pair * 1.7) * 1.0, Math.sin(pair * 3.1) * 1.2));
    }
    // electrons, only for plasma
    const eGeo = new THREE.SphereGeometry(0.16, 8, 8);
    const electrons = [];
    for (let i = 0; i < N; i++) {
      const m = new THREE.Mesh(eGeo, new THREE.MeshBasicMaterial({ color: 0xfde68a }));
      m.visible = false; scene.add(m); electrons.push(m);
    }

    const colors = { zero: 0xbfdbfe, fermionic: 0xf472b6, bec: 0xc084fc, solid: 0x38bdf8, liquid: 0x4ade80, gas: 0xfacc15, plasma: 0xfb923c, unstable: 0x94a3b8, superfluid: 0x22d3ee, supercritical: 0xa78bfa };
    const targetColor = new THREE.Color(0x38bdf8);

    let raf = 0;
    const clock = new THREE.Clock();
    const visRef = { current: true }; // kotaknya kelihatan di layar?
    const lastRef = { current: { temp: -1, state: '', playing: null } };
    let controlsDirty = true;
    const onControlsChange = () => { controlsDirty = true; };
    controls.addEventListener('change', onControlsChange);
    // 'start' (pengguna mulai menyeret) tidak memicu 'change' — tanpa ini,
    // seretan saat dijeda tidak pernah me-render karena loop-nya sedang skip.
    controls.addEventListener('start', onControlsChange);
    const kick = () => { if (!raf) raf = requestAnimationFrame(animate); };
    // Kotak tidak kelihatan (pengguna lagi gulir ke bawah): berhenti total,
    // jangan bakar GPU. Observer ini yang menyalakan lagi pas kelihatan.
    const io = new IntersectionObserver((entries) => {
      visRef.current = entries.some((e) => e.isIntersecting);
      if (visRef.current) kick();
    });
    io.observe(mount);

    const animate = () => {
      raf = 0;
      if (!visRef.current) return; // loop berhenti; observer yang menyalakan lagi
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      const { temp, state, playing } = live.current;
      controls.autoRotate = playing;
      // Saat dijeda, damping dimatikan: sisa putaran kamera diterapkan sekali
      // lalu berhenti total — kalau damping tetap hidup, kameranya merayap
      // pelan-pelan berpuluh-puluh frame dan loop tidak pernah berhenti.
      controls.enableDamping = playing;
      // Kalau dijeda dan tidak ada yang berubah (suhu/wujud sama, tidak ada
      // yang menyeret), lewati render — framenya sudah benar, tidak perlu
      // digambar ulang 60x/detik.
      const changed = temp !== lastRef.current.temp || state !== lastRef.current.state || playing !== lastRef.current.playing;
      if (!playing && !changed && !controlsDirty) { raf = requestAnimationFrame(animate); return; }
      lastRef.current = { temp, state, playing };
      controlsDirty = false;

      // Fisika + warna cuma jalan saat Main — saat Jeda, atom membeku persis
      // di tempatnya (dulu pun begitu: cabang !playing tidak menjalankan fisika).
      if (playing) {
      targetColor.setHex(colors[state] || 0x38bdf8);
      // Warna + pijar diatur sekali di material bersama (dulu per atom).
      atomMat.color.lerp(targetColor, 0.08);
      atomMat.emissive.copy(targetColor).multiplyScalar(state === 'plasma' ? 0.9 : 0.25);
      point.color.copy(targetColor);
      cloud.visible = state === 'bec' || state === 'zero' || state === 'fermionic';
      cloud.material.color.setHex(state === 'fermionic' ? 0xf472b6 : 0xa855f7);
      cloud.material.opacity = state === 'bec' || state === 'fermionic' ? 0.20 + Math.sin(t * 2) * 0.04 : 0.10;

      const isFixed = state === 'solid' || state === 'zero' || state === 'bec' || state === 'fermionic';
      const speedBase = state === 'plasma' ? 5.2 : state === 'gas' ? 3.4 : state === 'liquid' ? 1.5 : 0.4;
      // visual speed grows with sqrt(T), capped so it stays watchable
      const speed = Math.min(speedBase * (0.35 + Math.sqrt(Math.max(temp, 1)) / 18), 7);

      atoms.forEach((m, i) => {
        if (state === 'superfluid') {
          // Superfluid: ngalir tanpa gesekan — atomnya berputar halus, nggak mantul-mantul
          const r = 1.6 + (i % 5) * 1.1;
          const a = t * 0.35 + phases[i];
          m.position.set(Math.cos(a) * r, Math.sin(a * 0.7 + phases[i]) * 1.4, Math.sin(a) * r);
          const e = electrons[i]; e.visible = false;
          return;
        }
        if (isFixed) {
          // Fermionic condensate: atoms pair up (Cooper pairs) around the centre
          const target = state === 'bec' ? becTargets[i] : state === 'fermionic' ? fermTargets[i] : anchors[i];
          currents[i].lerp(target, 0.03);
          const amp = state === 'zero' ? 0 : state === 'bec' || state === 'fermionic' ? 0.06 : 0.07 + 0.32 * Math.sqrt(Math.max(temp, 0) / 273);
          const f = 2 + Math.sqrt(Math.max(temp, 1)) / 12;
          m.position.set(
            currents[i].x + Math.sin(t * f + phases[i]) * amp,
            currents[i].y + Math.sin(t * f * 1.3 + phases[i] * 2) * amp,
            currents[i].z + Math.cos(t * f * 0.8 + phases[i]) * amp
          );
          vels[i].set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
        } else {
          // free motion: liquid / gas / plasma
          const v = vels[i];
          if (v.lengthSq() < 0.1) v.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
          v.normalize().multiplyScalar(speed);
          m.position.addScaledVector(v, dt);
          ['x', 'y', 'z'].forEach((ax) => {
            if (m.position[ax] > BOX) { m.position[ax] = BOX; v[ax] = -Math.abs(v[ax]); }
            if (m.position[ax] < -BOX) { m.position[ax] = -BOX; v[ax] = Math.abs(v[ax]); }
          });
          currents[i].copy(m.position);
        }
        // plasma electrons orbit their atom
        const e = electrons[i];
        e.visible = state === 'plasma';
        if (e.visible) {
          const a = t * 9 + i;
          e.position.set(m.position.x + Math.cos(a) * 0.85, m.position.y + Math.sin(a * 1.3) * 0.85, m.position.z + Math.sin(a) * 0.85);
        }
      });
      } // end if (playing)

      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      controls.removeEventListener('change', onControlsChange);
      controls.removeEventListener('start', onControlsChange);
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('webglcontextlost', onLost);
      controls.dispose();
      renderer.dispose();
      if (canvas.parentNode === mount) mount.removeChild(canvas);
    };
  }, [atomCount, retryKey]);

  if (failed) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'radial-gradient(circle at 50% 35%,#132344,#050914 70%)', color: '#cbd5e1', padding: 16, textAlign: 'center' }}>
        <div style={{ fontSize: 28 }}>🛰️</div>
        <div style={{ fontWeight: 700 }}>Simulasi 3D-nya nggak kebuka</div>
        <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>Browser HP kadang gagal nyalain grafis 3D-nya — biasanya cuma sesekali. Coba muat ulang simulasinya, nggak perlu refresh halaman.</div>
        <button className="toggle" onClick={() => { setFailed(false); setRetryKey((k) => k + 1); }}>Muat ulang simulasi</button>
      </div>
    );
  }
  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
}
