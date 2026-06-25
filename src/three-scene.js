import * as THREE from 'three';

export function initHeroScene(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  let w = window.innerWidth;
  let h = window.innerHeight;

  /* ---- Renderer ---- */
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  /* ---- Scene & Camera ---- */
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
  camera.position.set(0, 0, 7);

  /* ---- Lights ---- */
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const key = new THREE.PointLight(0xC8390F, 5, 35);
  key.position.set(3, 4, 5);
  scene.add(key);
  const fill = new THREE.PointLight(0xff8855, 1.5, 25);
  fill.position.set(-4, -2, 3);
  scene.add(fill);

  /* ---- Helpers ---- */
  function sphereMat(color, opacity) {
    return new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity });
  }
  function solidMat(color, opacity) {
    return new THREE.MeshBasicMaterial({ color, transparent: true, opacity });
  }

  /* ================================================================
     NODES — each is a floating sphere representing a brand or creator
     ================================================================ */
  const nodeData = [
    // [x,    y,    z,    radius, color,    opacity, floatAmp, floatSpeed]
    // ── Brand hub (right)
    [ 3.0,  0.2,  0.0,  0.30,  0xC8390F,  0.70,   0.30, 0.50],
    // ── Creator hub (left)
    [-2.8,  0.4,  0.3,  0.26,  0xC8390F,  0.60,   0.28, 0.58],
    // ── Brand satellites
    [ 1.6,  1.8, -0.4,  0.12,  0xC8390F,  0.35,   0.20, 0.72],
    [ 2.0, -1.5,  0.7,  0.10,  0xC8390F,  0.28,   0.18, 0.65],
    [ 4.4,  0.6, -0.5,  0.11,  0xC8390F,  0.25,   0.22, 0.80],
    [ 3.8, -0.8, -0.3,  0.09,  0xd45010,  0.22,   0.16, 0.90],
    // ── Creator satellites
    [-1.4,  2.0,  0.2,  0.12,  0xC8390F,  0.35,   0.22, 0.68],
    [-2.2, -1.6,  0.5,  0.10,  0xC8390F,  0.28,   0.19, 0.75],
    [-4.2,  0.4, -0.5,  0.11,  0xd45010,  0.25,   0.24, 0.60],
    [-3.6, -0.6, -0.4,  0.09,  0xC8390F,  0.20,   0.15, 0.85],
    // ── Floating neutral nodes
    [ 0.3,  2.8, -0.6,  0.09,  0xb83000,  0.20,   0.25, 0.55],
    [ 0.6, -2.6,  0.5,  0.08,  0xC8390F,  0.18,   0.20, 0.70],
  ];

  const nodes = nodeData.map(([x, y, z, r, color, op, fa, fs]) => {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(r, 10, 7),
      sphereMat(color, op)
    );
    mesh.position.set(x, y, z);
    scene.add(mesh);
    return { mesh, oy: y, floatAmp: fa, floatSpeed: fs };
  });

  // Solid inner dot for the two hub nodes — gives them a glowing centre feel
  [0, 1].forEach(i => {
    const r = nodeData[i][3] * 0.35;
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(r, 8, 6),
      solidMat(0xC8390F, 0.55)
    );
    dot.position.copy(nodes[i].mesh.position);
    scene.add(dot);
    nodes[i].dot = dot;
  });

  /* ================================================================
     CONNECTIONS — lines between nodes
     ================================================================ */
  const connectionPairs = [
    // Brand hub (0) ↔ Creator hub (1) — the main link, slightly brighter
    [0, 1, 0.30],
    // Brand hub → satellites
    [0, 2, 0.14], [0, 3, 0.12], [0, 4, 0.10], [0, 5, 0.09],
    // Creator hub → satellites
    [1, 6, 0.14], [1, 7, 0.12], [1, 8, 0.10], [1, 9, 0.09],
    // Cross-connections (network feel)
    [2, 6, 0.07], [3, 7, 0.06], [10, 0, 0.08], [11, 1, 0.07],
    // Satellite to satellite
    [4, 5, 0.06], [8, 9, 0.06],
  ];

  const lines = connectionPairs.map(([ai, bi, opacity]) => {
    const geo = new THREE.BufferGeometry().setFromPoints([
      nodes[ai].mesh.position.clone(),
      nodes[bi].mesh.position.clone(),
    ]);
    const mat = new THREE.LineBasicMaterial({
      color: 0xC8390F, transparent: true, opacity,
    });
    const line = new THREE.Line(geo, mat);
    scene.add(line);
    return { line, ai, bi };
  });

  /* ================================================================
     PLATFORM RINGS — represent TikTok / Instagram / YouTube
     ================================================================ */
  const ringConfigs = [
    // [x,   y,    z,    radius, tube,  rotX, rotY, rotZ, opacity]
    [ 0.5,  0.3,  -2.0,  2.8,  0.025,  0.4,  0.2,  0.0,  0.10],  // large background
    [-1.0, -0.5,  -0.8,  1.4,  0.018,  1.1,  0.5,  0.3,  0.12],  // mid left
    [ 2.0,  1.0,  -1.2,  1.0,  0.015,  0.7,  1.2,  0.8,  0.09],  // upper right
  ];

  const rings = ringConfigs.map(([x, y, z, r, tube, rx, ry, rz, op]) => {
    const mesh = new THREE.Mesh(
      new THREE.TorusGeometry(r, tube, 16, 80),
      new THREE.MeshBasicMaterial({ color: 0xC8390F, transparent: true, opacity: op })
    );
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    scene.add(mesh);
    return { mesh, oy: y, baseRx: rx };
  });

  /* ---- Mouse parallax ---- */
  let mx = 0, my = 0, tx = 0, ty = 0;
  window.addEventListener('mousemove', e => {
    mx = e.clientX / window.innerWidth  - 0.5;
    my = e.clientY / window.innerHeight - 0.5;
  }, { passive: true });

  /* ---- Animate ---- */
  const clock = new THREE.Clock();

  (function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    tx += (mx * 0.7 - tx) * 0.04;
    ty += (my * 0.7 - ty) * 0.04;

    // Float nodes
    nodes.forEach(n => {
      n.mesh.position.y = n.oy + Math.sin(t * n.floatSpeed) * n.floatAmp;
      n.mesh.rotation.y += 0.003;
      if (n.dot) n.dot.position.copy(n.mesh.position);
    });

    // Update connection lines to follow their nodes
    lines.forEach(({ line, ai, bi }) => {
      const pos = line.geometry.attributes.position;
      const a = nodes[ai].mesh.position;
      const b = nodes[bi].mesh.position;
      pos.setXYZ(0, a.x, a.y, a.z);
      pos.setXYZ(1, b.x, b.y, b.z);
      pos.needsUpdate = true;
    });

    // Slowly rotate rings
    rings.forEach((r, i) => {
      r.mesh.rotation.z += 0.0015 + i * 0.0005;
      r.mesh.rotation.x = r.baseRx + Math.sin(t * 0.2 + i) * 0.04;
      r.mesh.position.y = r.oy + Math.sin(t * 0.3 + i * 1.2) * 0.1;
    });

    // Camera parallax
    camera.position.x += (tx * 0.5 - camera.position.x) * 0.05;
    camera.position.y += (-ty * 0.4 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }());

  /* ---- Resize ---- */
  window.addEventListener('resize', () => {
    w = window.innerWidth;
    h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }, { passive: true });
}
