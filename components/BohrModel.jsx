'use client';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Model Bohr 3D per unsur — file .glb dari Google (lewat Periodic-Table-JSON),
// dimuat langsung dari storage.googleapis.com saat unsur dipilih.
// Kanvas 3D-nya baru dibuat pas kartunya kelihatan di layar (lazy-load):
// supaya waktu halaman dibuka cuma ada satu konteks WebGL (simulasi utama),
// bukan dua sekaligus — di HP, dua konteks sekaligus kadang bikin salah
// satunya gagal dan kanvasnya jadi putih.
export default function BohrModel({ url, name }) {
  const wrapRef = useRef(null);
  const mountRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState('loading'); // loading | ok | error

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (typeof IntersectionObserver === 'undefined') { setVisible(true); return; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { setVisible(true); io.disconnect(); }
    }, { rootMargin: '200px' });
    io.observe(wrap);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const mount = mountRef.current;
    if (!mount || !url) return;
    setStatus('loading');

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 0.8, 5.4);
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (e) {
      setStatus('error');
      return;
    }
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    // Batas piksel 1.5x (dulu 2x) — sama seperti simulasi utama.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.1;
    controls.enablePan = false;
    controls.minDistance = 2.4;
    controls.maxDistance = 11;

    scene.add(new THREE.AmbientLight(0xffffff, 1.15));
    const dir = new THREE.DirectionalLight(0xffffff, 1.7);
    dir.position.set(4, 6, 6);
    scene.add(dir);
    const dir2 = new THREE.DirectionalLight(0x93c5fd, 0.7);
    dir2.position.set(-5, -2, -4);
    scene.add(dir2);

    let raf = 0;
    let alive = true;
    let mixer = null;
    const clock = new THREE.Clock();
    // Berhenti total saat kartunya tidak kelihatan di layar (pengguna lagi
    // gulir ke atas/bawah) — observer ini yang menyalakan lagi pas kelihatan.
    let inView = true;
    const kick = () => { if (alive && !raf) raf = requestAnimationFrame(animate); };
    const io2 = new IntersectionObserver((entries) => {
      inView = entries.some((e) => e.isIntersecting);
      if (inView) kick();
    });
    io2.observe(mount);
    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => {
        if (!alive) return;
        const model = gltf.scene;
        // Normalisasi: pusatkan model dan skala supaya muat di layar,
        // karena tiap file .glb ukurannya beda-beda.
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const scale = 3.4 / maxDim;
        model.scale.setScalar(scale);
        model.position.sub(center.multiplyScalar(scale));
        scene.add(model);
        // Model Google ini punya animasi orbit elektron — jalankan supaya hidup.
        if (gltf.animations && gltf.animations.length > 0) {
          mixer = new THREE.AnimationMixer(model);
          gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
        }
        setStatus('ok');
      },
      undefined,
      () => { if (alive) setStatus('error'); }
    );

    const animate = () => {
      raf = 0;
      if (!alive || !inView) return; // loop berhenti; observer yang menyalakan lagi
      if (mixer) mixer.update(clock.getDelta());
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      if (!mount.clientWidth || !mount.clientHeight) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      io2.disconnect();
      window.removeEventListener('resize', onResize);
      controls.dispose();
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
        mats.forEach((m) => {
          Object.values(m).forEach((v) => { if (v && v.isTexture) v.dispose(); });
          m.dispose();
        });
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [url, visible]);

  return (
    <div>
      <div
        ref={wrapRef}
        style={{
          width: '100%', height: 280, borderRadius: 12, overflow: 'hidden',
          background: 'radial-gradient(ellipse at center, #101d38 0%, #0b1428 70%)',
          border: '1px solid #1e2f52',
        }}
        role="img"
        aria-label={`Model Bohr 3D ${name}`}
      >
        {visible ? (
          <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
            Model 3D {name} — gulir ke sini buat memuat
          </div>
        )}
      </div>
      {visible && status === 'loading' && (
        <p style={{ fontSize: 13, color: '#94a3b8', margin: '8px 0 0' }}>Memuat model 3D {name}…</p>
      )}
      {visible && status === 'error' && (
        <p style={{ fontSize: 13, color: '#f87171', margin: '8px 0 0' }}>Model 3D-nya nggak bisa dimuat — periksa koneksi internetmu, lalu pilih unsur lain.</p>
      )}
      {visible && status === 'ok' && (
        <p style={{ fontSize: 13, color: '#94a3b8', margin: '8px 0 0' }}>Seret buat muter · Scroll buat zoom · Modelnya muter sendiri pelan-pelan</p>
      )}
    </div>
  );
}
