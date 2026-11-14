'use client';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Model Bohr 3D per unsur — file .glb dari Google (lewat Periodic-Table-JSON),
// dimuat langsung dari storage.googleapis.com saat unsur dipilih.
export default function BohrModel({ url, name }) {
  const mountRef = useRef(null);
  const [status, setStatus] = useState('loading'); // loading | ok | error

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !url) return;
    setStatus('loading');

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 0.8, 5.4);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
      raf = requestAnimationFrame(animate);
      if (mixer) mixer.update(clock.getDelta());
      controls.update();
      renderer.render(scene, camera);
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
  }, [url]);

  return (
    <div>
      <div
        ref={mountRef}
        style={{
          width: '100%', height: 280, borderRadius: 12, overflow: 'hidden',
          background: 'radial-gradient(ellipse at center, #101d38 0%, #0b1428 70%)',
          border: '1px solid #1e2f52',
        }}
        role="img"
        aria-label={`Model Bohr 3D ${name}`}
      />
      {status === 'loading' && (
        <p style={{ fontSize: 13, color: '#94a3b8', margin: '8px 0 0' }}>Memuat model 3D {name}…</p>
      )}
      {status === 'error' && (
        <p style={{ fontSize: 13, color: '#f87171', margin: '8px 0 0' }}>Model 3D-nya nggak bisa dimuat — periksa koneksi internetmu, lalu pilih unsur lain.</p>
      )}
      {status === 'ok' && (
        <p style={{ fontSize: 13, color: '#94a3b8', margin: '8px 0 0' }}>Seret buat muter · Scroll buat zoom · Modelnya muter sendiri pelan-pelan</p>
      )}
    </div>
  );
}
