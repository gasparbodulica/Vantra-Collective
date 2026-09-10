import * as THREE from 'three';

/**
 * Hero background — the Vantra story in 3D.
 * BRANDS cluster on the left, CREATORS cluster on the right, a glowing VANTRA
 * core in the middle. Energy pulses travel from both sides through the core,
 * showing Vantra as the bridge. Sides are fixed (no flipping rotation) so the
 * left/middle/right reading always holds.
 */
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
  camera.position.set(0, 0, 9);
  camera.lookAt(0, 0, 0);

  const ACCENT = 0xC8390F;  // brands
  const WARM   = 0xE56A2A;  // creators
  const BRIGHT = 0xFFB183;  // pulses / core highlight

  const system = new THREE.Group();
  system.position.set(0.4, 0.2, 0);
  scene.add(system);

  /* ---- helpers ---- */
  const wireMat  = (c, o) => new THREE.MeshBasicMaterial({ color: c, wireframe: true, transparent: true, opacity: o });
  const solidMat = (c, o) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o });

  function node(x, y, z, r, color, op) {
    const g = new THREE.Group();
    const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), wireMat(color, op));
    const dot   = new THREE.Mesh(new THREE.SphereGeometry(r * 0.4, 12, 12), solidMat(color, Math.min(op + 0.25, 0.9)));
    g.add(shell, dot);
    g.position.set(x, y, z);
    system.add(g);
    return { g, oy: y, amp: 0.10 + Math.random() * 0.14, spd: 0.4 + Math.random() * 0.5, ph: Math.random() * 6 };
  }

  /* ================================================================
     HUBS + SATELLITES
     ================================================================ */
  const brandHubPos   = new THREE.Vector3(-3.6, 0.3, 0);
  const corePos       = new THREE.Vector3( 0.0, 0.3, 0);
  const creatorHubPos = new THREE.Vector3( 3.6, 0.3, 0);

  // Brand cluster (left)
  const brandHub = node(brandHubPos.x, brandHubPos.y, brandHubPos.z, 0.34, ACCENT, 0.55);
  const brandSats = [
    node(-5.0,  1.3,  0.3, 0.13, ACCENT, 0.40),
    node(-4.7, -1.1, -0.4, 0.11, ACCENT, 0.34),
    node(-2.6,  1.7, -0.3, 0.12, 0xA82C08, 0.34),
    node(-2.8, -1.5,  0.4, 0.10, ACCENT, 0.30),
    node(-5.4,  0.0, -0.2, 0.10, 0xA82C08, 0.28),
  ];

  // Creator cluster (right)
  const creatorHub = node(creatorHubPos.x, creatorHubPos.y, creatorHubPos.z, 0.34, WARM, 0.55);
  const creatorSats = [
    node( 5.0,  1.3,  0.3, 0.13, WARM, 0.40),
    node( 4.7, -1.1, -0.4, 0.11, WARM, 0.34),
    node( 2.6,  1.7, -0.3, 0.12, 0xF08040, 0.34),
    node( 2.8, -1.5,  0.4, 0.10, WARM, 0.30),
    node( 5.4,  0.0, -0.2, 0.10, 0xF08040, 0.28),
  ];

  /* ---- Vantra core (centre, glowing) — grouped so it can float as one ---- */
  const coreGroup = new THREE.Group();
  coreGroup.position.copy(corePos);
  system.add(coreGroup);
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 24), solidMat(BRIGHT, 0.9));
  coreGroup.add(core);
  const coreShell = new THREE.Mesh(new THREE.IcosahedronGeometry(0.7, 1), wireMat(ACCENT, 0.55));
  coreGroup.add(coreShell);
  [[1.05, 0.10], [1.5, 0.05]].forEach(([r, o]) => {
    coreGroup.add(new THREE.Mesh(new THREE.SphereGeometry(r, 20, 20), solidMat(ACCENT, o)));
  });
  const coreRing = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.011, 10, 100), solidMat(ACCENT, 0.35));
  coreRing.rotation.set(1.2, 0.4, 0);
  coreGroup.add(coreRing);

  /* ================================================================
     CONNECTIONS
     ================================================================ */
  const linePairs = [
    // main spine: brand hub → core → creator hub (brighter)
    [brandHub.g.position, corePos, 0.40],
    [corePos, creatorHub.g.position, 0.40],
    // hub → satellites
    ...brandSats.map(s => [brandHub.g.position, s.g.position, 0.16]),
    ...creatorSats.map(s => [creatorHub.g.position, s.g.position, 0.16]),
  ];
  const lines = linePairs.map(([a, b, op]) => {
    const geo = new THREE.BufferGeometry().setFromPoints([a.clone(), b.clone()]);
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: ACCENT, transparent: true, opacity: op }));
    system.add(line);
    return { line, a, b };
  });

  /* ================================================================
     PULSES — travel brand→core→creator and creator→core→brand
     ================================================================ */
  function makePulse(dir, phase) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), solidMat(BRIGHT, 0.95));
    system.add(m);
    return { m, dir, phase };
  }
  const pulses = [
    makePulse( 1, 0.0), makePulse( 1, 1.0),   // brands → creators
    makePulse(-1, 0.5), makePulse(-1, 1.5),   // creators → brands
  ];
  const _a = new THREE.Vector3(), _b = new THREE.Vector3();
  function pulseAt(u, dir) {
    // u in [0,2): first half brandHub→core, second half core→creatorHub
    const B = dir === 1 ? brandHubPos : creatorHubPos;
    const C = dir === 1 ? creatorHubPos : brandHubPos;
    if (u < 1) return _a.copy(B).lerp(corePos, u);
    return _b.copy(corePos).lerp(C, u - 1);
  }

  /* ---- Mouse parallax ---- */
  let mx = 0, my = 0, tx = 0, ty = 0;
  window.addEventListener('mousemove', e => {
    mx = e.clientX / window.innerWidth  - 0.5;
    my = e.clientY / window.innerHeight - 0.5;
  }, { passive: true });

  /* ---- Animate ---- */
  const clock = new THREE.Clock();
  const allNodes = [brandHub, creatorHub, ...brandSats, ...creatorSats];

  (function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Float nodes (bob only — no side-swapping rotation)
    allNodes.forEach(n => {
      n.g.position.y = n.oy + Math.sin(t * n.spd + n.ph) * n.amp;
      n.g.children[0].rotation.y += 0.004;
      n.g.children[0].rotation.x += 0.002;
    });

    // Update lines to follow their endpoints
    lines.forEach(({ line, a, b }) => {
      const p = line.geometry.attributes.position;
      p.setXYZ(0, a.x, a.y, a.z);
      p.setXYZ(1, b.x, b.y, b.z);
      p.needsUpdate = true;
    });

    // Central Vantra blob floats up & down; lines + pulses follow via corePos
    corePos.y = 0.3 + Math.sin(t * 0.6) * 0.55;
    coreGroup.position.y = corePos.y;
    core.scale.setScalar(0.9 + Math.sin(t * 1.4) * 0.12);
    coreShell.rotation.y += 0.006;
    coreShell.rotation.x += 0.003;
    coreRing.rotation.z += 0.01;

    // Pulses flow through the hub
    pulses.forEach(p => {
      const u = ((t * 0.5 + p.phase) % 2);
      const v = pulseAt(u, p.dir);
      p.m.position.copy(v);
      // brighten as it passes through the core
      const near = 1 - Math.min(Math.abs(u - 1), 1);
      p.m.scale.setScalar(0.8 + near * 1.2);
    });

    // Camera parallax (small, so sides never invert)
    tx += (mx * 0.5 - tx) * 0.04;
    ty += (my * 0.5 - ty) * 0.04;
    camera.position.x += (tx * 0.7 - camera.position.x) * 0.05;
    camera.position.y += (-ty * 0.5 - camera.position.y) * 0.05;
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
