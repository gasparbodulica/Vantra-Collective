import * as THREE from 'three';

export function initHeroScene(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Use window dimensions — container is position:absolute and offsetWidth=0 at DOMContentLoaded
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
  scene.add(new THREE.AmbientLight(0xffffff, 0.8));
  const keyLight = new THREE.PointLight(0xC8390F, 3, 40);
  keyLight.position.set(5, 4, 6);
  scene.add(keyLight);
  const fillLight = new THREE.PointLight(0xff8c6a, 1, 30);
  fillLight.position.set(-6, -3, 4);
  scene.add(fillLight);

  /* ---- Materials ---- */
  // Main wireframe — bright rust, clearly visible
  function wireMat(color, opacity) {
    return new THREE.MeshBasicMaterial({
      color,
      wireframe: true,
      transparent: true,
      opacity,
    });
  }

  /* ---- Objects ---- */
  const objects = [];

  // PRIMARY — large torus knot, right side, clearly visible
  const knot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1.3, 0.42, 160, 20, 2, 3),
    wireMat(0xC8390F, 0.55)
  );
  knot.position.set(3.8, 0.3, 0);
  knot.rotation.set(0.4, 0.8, 0.1);
  scene.add(knot);
  objects.push({ mesh: knot, rx: 0.003, ry: 0.005, fy: 0.28, fs: 0.65 });

  // SECONDARY — icosahedron, upper left
  const ico = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.9, 1),
    wireMat(0x2a1208, 0.38)
  );
  ico.position.set(-4.4, 2.0, -0.5);
  ico.rotation.set(1.2, 0.4, 0.6);
  scene.add(ico);
  objects.push({ mesh: ico, rx: 0.004, ry: 0.003, fy: 0.2, fs: 0.5 });

  // TERTIARY — small torus, lower left foreground
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.55, 0.17, 20, 60),
    wireMat(0xC8390F, 0.32)
  );
  ring.position.set(-3.0, -1.8, 1.0);
  ring.rotation.set(0.8, 0.3, 0.2);
  scene.add(ring);
  objects.push({ mesh: ring, rx: 0.003, ry: 0.007, fy: 0.22, fs: 0.9 });

  // QUATERNARY — octahedron, bottom right
  const oct = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.65, 0),
    wireMat(0x2a1208, 0.30)
  );
  oct.position.set(2.2, -2.6, 0.5);
  oct.rotation.set(0.5, 1.0, 0.3);
  scene.add(oct);
  objects.push({ mesh: oct, rx: 0.006, ry: 0.003, fy: 0.25, fs: 0.6 });

  // BACKGROUND — second small torus knot, upper right depth layer
  const knot2 = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.75, 0.22, 100, 16, 3, 4),
    wireMat(0xC8390F, 0.18)
  );
  knot2.position.set(5.5, 2.5, -2.0);
  knot2.rotation.set(0.6, 1.2, 0.4);
  scene.add(knot2);
  objects.push({ mesh: knot2, rx: 0.004, ry: 0.003, fy: 0.15, fs: 0.45 });

  // Store original Y for float animation
  objects.forEach(o => { o.oy = o.mesh.position.y; });

  /* ---- Mouse parallax ---- */
  let mx = 0, my = 0, tx = 0, ty = 0;
  window.addEventListener('mousemove', e => {
    mx = (e.clientX / window.innerWidth  - 0.5);
    my = (e.clientY / window.innerHeight - 0.5);
  }, { passive: true });

  /* ---- Animate ---- */
  const clock = new THREE.Clock();

  (function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    tx += (mx * 0.7 - tx) * 0.04;
    ty += (my * 0.7 - ty) * 0.04;

    objects.forEach(o => {
      o.mesh.rotation.x += o.rx;
      o.mesh.rotation.y += o.ry;
      o.mesh.position.y  = o.oy + Math.sin(t * o.fs) * o.fy;
    });

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
