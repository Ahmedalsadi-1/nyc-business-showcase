import * as THREE from './vendor/three.module.js';

// A built architectural model: scroll moves the camera through the clear center aisle.
export async function createWorld(container, { onReady } = {}) {
  if (!container) throw new Error('The world needs a canvas container.');
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#e8e5dc');
  scene.fog = new THREE.Fog('#e8e5dc', 29, 94);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 700 ? 1.25 : 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;';
  container.append(renderer.domElement);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.08, 220);
  const resources = new Set();
  const materials = new Map();
  let progress = 0, raf = 0, destroyed = false;

  const mat = (color, extras = {}) => {
    const key = color + JSON.stringify(extras);
    if (!materials.has(key)) {
      const material = new THREE.MeshStandardMaterial({ color, roughness: .83, metalness: 0, ...extras });
      materials.set(key, material); resources.add(material);
    }
    return materials.get(key);
  };
  const colors = { ivory: '#e9e2d1', white: '#fffaf0', ink: '#1f3031', wood: '#a17c51', oak: '#c7a375', olive: '#5c6d50', brass: '#b69c60', blue: '#273cbb', clay: '#c17b58', pastry: '#b98242' };
  const box = (parent, w, h, d, material, x = 0, y = 0, z = 0, rotation = 0) => {
    const geometry = new THREE.BoxGeometry(w, h, d); resources.add(geometry);
    const mesh = new THREE.Mesh(geometry, typeof material === 'string' ? mat(material) : material);
    mesh.position.set(x, y, z); mesh.rotation.y = rotation;
    mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  };
  const cylinder = (parent, top, bottom, h, material, x, y, z, segments = 32) => {
    const geometry = new THREE.CylinderGeometry(top, bottom, h, segments); resources.add(geometry);
    const mesh = new THREE.Mesh(geometry, typeof material === 'string' ? mat(material) : material);
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  };
  const sphere = (parent, radius, material, x, y, z, scale = [1, 1, 1]) => {
    const geometry = new THREE.SphereGeometry(radius, 24, 16); resources.add(geometry);
    const mesh = new THREE.Mesh(geometry, typeof material === 'string' ? mat(material) : material);
    mesh.position.set(x, y, z); mesh.scale.set(...scale); mesh.castShadow = true; parent.add(mesh); return mesh;
  };
  const torus = (parent, radius, tube, material, x, y, z, rotation = [0, 0, 0], arc = Math.PI * 2) => {
    const geometry = new THREE.TorusGeometry(radius, tube, 12, 48, arc); resources.add(geometry);
    const mesh = new THREE.Mesh(geometry, typeof material === 'string' ? mat(material) : material);
    mesh.position.set(x, y, z); mesh.rotation.set(...rotation); mesh.castShadow = true; parent.add(mesh); return mesh;
  };
  const panelTexture = (text, background, ink, options = {}) => {
    const canvas = document.createElement('canvas'); canvas.width = options.width || 1536; canvas.height = options.height || 256;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = background; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `${options.weight || 500} ${options.size || 112}px ${options.family || 'Georgia'}`;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 4, canvas.width - 120);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4; resources.add(texture); return texture;
  };
  const sign = (parent, text, w, h, x, y, z, bg, ink, options) => {
    box(parent, w + .08, h + .08, .12, bg, x, y, z - .03);
    const material = new THREE.MeshBasicMaterial({ map: panelTexture(text, bg, ink, options), toneMapped: false }); resources.add(material);
    const geometry = new THREE.PlaneGeometry(w, h); resources.add(geometry);
    const face = new THREE.Mesh(geometry, material); face.position.set(x, y, z + .04); parent.add(face); return face;
  };
  const plant = (parent, x, z, scale = 1) => {
    const group = new THREE.Group(); parent.add(group); group.position.set(x, .05, z); group.scale.setScalar(scale);
    cylinder(group, .45, .32, .7, '#b78c69', 0, .35, 0);
    for (let i = 0; i < 8; i++) {
      const angle = i / 8 * Math.PI * 2;
      const stem = cylinder(group, .022, .03, 1.2 + (i % 3) * .18, colors.olive, Math.cos(angle) * .12, 1.04, Math.sin(angle) * .12, 8);
      stem.rotation.z = Math.cos(angle) * .35;
      const leaf = sphere(group, .37, i % 2 ? '#78825c' : '#526d4f', Math.cos(angle) * .33, 1.55 + (i % 3) * .15, Math.sin(angle) * .33, [.35, 1, .65]);
      leaf.rotation.z = -Math.cos(angle) * .55;
    }
  };

  scene.add(new THREE.HemisphereLight('#fffaf0', '#a5aaa0', 2.6));
  const sunlight = new THREE.DirectionalLight('#fff1d9', 4.0);
  sunlight.position.set(-15, 28, 18); sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(2048, 2048);
  sunlight.shadow.camera.left = -28; sunlight.shadow.camera.right = 28;
  sunlight.shadow.camera.top = 28; sunlight.shadow.camera.bottom = -28;
  sunlight.shadow.camera.near = .5; sunlight.shadow.camera.far = 140;
  sunlight.shadow.normalBias = .04; sunlight.shadow.bias = -.0001;
  scene.add(sunlight); scene.add(sunlight.target);
  const fill = new THREE.DirectionalLight('#f5f7ff', 1.1); fill.position.set(20, 12, -20); scene.add(fill);
  const ground = box(scene, 300, .2, 320, '#e8e5dc', 0, -.75, -40);
  ground.castShadow = false;
  box(scene, 4.2, .14, 110, '#d8d4c8', 0, -.5, -35);

  const worlds = [], screens = [];
  const storefront = (name, z, palette) => {
    const group = new THREE.Group(); group.position.z = z; scene.add(group); worlds.push(group);
    // Roof and back center stay open: a cutaway model and a continuous walkable aisle.
    box(group, 13, .4, 15.5, palette.floor, 0, -.22, 0);
    box(group, 13.4, .2, 2.1, '#d5d0c2', 0, -.33, 8.4);
    box(group, .32, 5.7, 14.8, palette.wall, -6.1, 2.65, -.3);
    box(group, .32, 2.3, 14.8, palette.wall, 6.1, .95, -.3);
    box(group, 2.1, 5.7, .35, palette.wall, -5.2, 2.65, -7.5);
    box(group, 2.1, 5.7, .35, palette.wall, 5.2, 2.65, -7.5);
    box(group, 12.7, .48, .65, palette.trim, 0, 5.66, 7.2);
    box(group, .45, 5.65, .6, palette.trim, -6.1, 2.65, 7.2);
    box(group, .45, 5.65, .6, palette.trim, 6.1, 2.65, 7.2);
    box(group, .3, 4.9, .45, palette.trim, -1.8, 2.3, 7.23);
    box(group, .3, 4.9, .45, palette.trim, 1.8, 2.3, 7.23);
    box(group, 3.8, .3, .45, palette.trim, 0, 4.85, 7.23);
    for (const x of [-3.95, 3.95]) {
      box(group, 3.7, .65, .25, palette.trim, x, .22, 7.22);
      box(group, 3.7, .15, .5, palette.trim, x, .65, 7.38);
      box(group, .1, 3.7, .15, palette.trim, x, 2.55, 7.2);
      box(group, 3.65, 3.8, .045, mat('#adc3ba', { transparent: true, opacity: .13, depthWrite: false, roughness: .25 }), x, 2.6, 7.23);
    }
    sign(group, name, 11.6, 1.0, 0, 5.67, 7.61, palette.trim, palette.sign, { size: 120 });
    box(group, 3.3, .12, .9, palette.threshold, 0, -.03, 7.55);
    // Open door is hinged to the right; there is no glass plane blocking the route.
    const door = new THREE.Group(); door.position.set(1.58, 0, 7.15); door.rotation.y = -Math.PI / 2.7; group.add(door);
    box(door, .14, 4.7, .13, palette.trim, -1.5, 2.3, 0);
    box(door, .14, 4.7, .13, palette.trim, 0, 2.3, 0);
    box(door, 1.6, .15, .13, palette.trim, -.75, 4.6, 0);
    box(door, 1.6, .3, .13, palette.trim, -.75, .12, 0);
    box(door, .1, .7, .1, colors.brass, -1.3, 2.05, .15);
    plant(group, -5.25, 8.4, .95); plant(group, 5.25, 8.4, .8);
    return group;
  };

  const coffee = storefront('Before Coffee', 0, { floor: '#cbbda3', wall: '#e7ddca', trim: '#46614a', sign: '#f7f0de', threshold: '#465640' });
  // The awning's stripes are modeled pieces of cloth, not a screen-space texture.
  for (let i = 0; i < 14; i++) {
    const awning = box(coffee, .91, .12, 2.25, i % 2 ? '#ded9c3' : '#6d7d58', -5.92 + i * .91, 4.95, 8.6);
    awning.rotation.x = -.13;
    box(coffee, .91, .36, .09, i % 2 ? '#ded9c3' : '#6d7d58', -5.92 + i * .91, 4.67, 9.7);
  }
  box(coffee, 3.6, 1.8, 7.9, colors.oak, -3.95, .8, -1.5);
  box(coffee, 3.9, .2, 8.2, '#e5d9c2', -3.95, 1.8, -1.5);
  for (let i = 0; i < 14; i++) box(coffee, .08, 1.5, .06, '#9e7f58', -2.12, .85, -5.1 + i * .55);
  box(coffee, 1.2, .75, 1.2, '#42514c', -3.6, 2.28, -.9);
  box(coffee, 1.35, .09, 1.3, '#d8d3bd', -3.6, 2.7, -.9);
  for (const z of [-.7, -.24]) {
    cylinder(coffee, .08, .08, .17, colors.brass, -3.1, 2.35, z, 16).rotation.z = Math.PI / 2;
    box(coffee, .1, .1, .4, '#263b33', -2.9, 2.35, z);
  }
  for (let i = 0; i < 3; i++) {
    const z = 1.4 + i * .8;
    cylinder(coffee, .25, .21, .36, '#faf5e7', -3.6, 2.09, z);
    cylinder(coffee, .215, .215, .015, '#5a3926', -3.6, 2.28, z);
    torus(coffee, .13, .035, '#faf5e7', -3.32, 2.09, z, [0, Math.PI / 2, 0]);
  }
  for (const z of [-3.4, 1.7]) {
    cylinder(coffee, .82, .82, .11, '#ad895b', 4, 1.25, z);
    cylinder(coffee, .08, .13, 1.24, '#52604a', 4, .6, z);
    for (const d of [-1, 1]) {
      cylinder(coffee, .38, .38, .13, '#d4ba8d', 4 + d * 1.1, .88, z);
      cylinder(coffee, .06, .08, .85, '#52604a', 4 + d * 1.1, .4, z);
    }
  }
  for (const z of [-3.8, 1.0]) {
    cylinder(coffee, .45, .18, .28, '#ded5ba', 1.9, 5.0, z);
    cylinder(coffee, .025, .025, 1.25, '#484b3d', 1.9, 5.75, z);
  }

  const barber = storefront('Luxury Cut', -34, { floor: '#c3c7b8', wall: '#cdd0bd', trim: '#243b35', sign: '#e4d6ad', threshold: '#263d37' });
  box(barber, 12.8, .23, 1.2, '#a99868', 0, 6.1, 7.1);
  // A checker floor is actual square stone tile geometry within this shop.
  for (let x = 0; x < 8; x++) for (let z = 0; z < 9; z++) {
    if ((x + z) % 2) box(barber, 1.48, .018, 1.48, '#56675d', -5.25 + x * 1.5, .001, -6.5 + z * 1.5);
  }
  for (const z of [-3.3, 1.1]) {
    const station = new THREE.Group(); station.position.set(-3.6, 0, z); station.rotation.y = .12; barber.add(station);
    cylinder(station, .65, .7, .1, '#565e57', 0, .1, 0);
    cylinder(station, .12, .17, .72, '#9b9d89', 0, .5, 0);
    box(station, 1.15, .3, 1.4, '#334b40', 0, 1, 0);
    box(station, 1.2, 1.25, .25, '#334b40', 0, 1.65, -.58);
    box(station, .7, .27, .2, '#334b40', 0, 2.32, -.58);
    for (const x of [-.69, .69]) {
      box(station, .16, .16, 1.3, '#a9a184', x, 1.45, .05);
      box(station, .08, .5, .08, '#7f887b', x, 1.2, .5);
    }
    box(station, .85, .08, .7, '#a9a184', 0, .52, .95);
    box(barber, .22, 3.4, 2.7, '#b4a16c', -5.78, 3.1, z - .2);
    box(barber, .04, 3.1, 2.45, mat('#d8e0d8', { metalness: .7, roughness: .18 }), -5.63, 3.1, z - .2);
  }
  box(barber, 2.7, 1.5, 3.0, '#344d40', 4.3, .67, -4.8);
  box(barber, 2.9, .18, 3.2, '#ddd5bd', 4.3, 1.5, -4.8);
  const pole = new THREE.Group(); pole.position.set(5.45, 2.5, 7.65); barber.add(pole);
  cylinder(pole, .21, .21, 1.8, '#e4ddc7', 0, 0, 0);
  for (let i = 0; i < 8; i++) {
    const stripe = cylinder(pole, .217, .217, .11, i % 2 ? '#335768' : '#a25243', 0, -.72 + i * .2, 0, 24);
    stripe.rotation.z = -.28;
  }
  sphere(pole, .27, '#b8ad8c', 0, 1, 0); sphere(pole, .27, '#b8ad8c', 0, -1, 0);

  const bakery = storefront("Judith's Bakery", -68, { floor: '#d7c7af', wall: '#eadcc7', trim: '#273cbb', sign: '#f9f0d5', threshold: '#d5ba92' });
  for (let i = 0; i < 7; i++) {
    const panel = box(bakery, 1.8, .15, 2.0, i % 2 ? '#f4ead5' : '#273cbb', -5.4 + i * 1.8, 5.0, 8.4);
    panel.rotation.x = -.12;
  }
  const bread = (x, y, z, size = 1, rotation = 0) => {
    const loaf = sphere(bakery, .42 * size, '#b67f43', x, y, z, [1.5, .7, .72]); loaf.rotation.y = rotation;
    for (let i = -1; i <= 1; i++) {
      const score = box(bakery, .06 * size, .018, .36 * size, '#e3b979', x + i * .22 * size, y + .27 * size, z, -.25);
      score.rotation.z = -.1;
    }
  };
  box(bakery, 3.8, 1.5, 8.1, '#c79b77', -3.9, .65, -1.5);
  box(bakery, 4, .15, 8.3, '#f0dbc0', -3.9, 1.47, -1.5);
  for (let i = 0; i < 4; i++) {
    box(bakery, 2.7, .1, 1.55, '#ad875f', -3.8, 1.62, -4.35 + i * 1.9);
    bread(-3.8, 1.88, -4.35 + i * 1.9, .7, .08);
    bread(-4.6, 1.8, -4.0 + i * 1.9, .55, -.22);
  }
  for (const y of [1.3, 2.7, 4.1]) {
    box(bakery, 1.5, .14, 9.8, '#a48262', 5.15, y, -1.1);
    for (let i = 0; i < 5; i++) bread(5.15, y + .3, -5 + i * 1.8, .65, Math.PI / 2);
  }
  for (const z of [-5.5, -1.5, 2.5]) box(bakery, .14, 4.2, .14, colors.blue, 5.85, 2, z);
  // The three framed screens are the real portfolio work, not imaginary UI.
  const loader = new THREE.TextureLoader();
  const screenDefinitions = [
    [coffee, 'assets/rooms/before-coffee-desktop.jpg.webp', '#394d3e'],
    [barber, 'assets/rooms/luxury-cut-desktop.jpg.webp', '#213b31'],
    [bakery, 'assets/rooms/judiths-bakery-desktop.jpg.webp', '#273cbb']
  ];
  await Promise.all(screenDefinitions.map(async ([group, url, trim]) => {
    const texture = await loader.loadAsync(new URL(url, import.meta.url).href);
    texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); resources.add(texture);
    const proof = new THREE.Group(); proof.position.set(0, 3.2, -5.6); group.add(proof);
    box(proof, 8.75, 5.56, .22, trim, 0, 0, -.04);
    const screenMaterial = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }); resources.add(screenMaterial);
    const geo = new THREE.PlaneGeometry(8.4, 5.25); resources.add(geo);
    const mesh = new THREE.Mesh(geo, screenMaterial); mesh.position.z = .09; proof.add(mesh);
    box(proof, .13, 1.3, .16, trim, -3.6, -3.1, -.05);
    box(proof, .13, 1.3, .16, trim, 3.6, -3.1, -.05);
    screens.push({ proof, z: group.position.z - 5.6 });
  }));

  const poses = [
    { p: 0, eye: [18, 12, 26], target: [-7.5, 2.0, 0] },
    { p: .10, eye: [6.5, 6.0, 19], target: [0, 2.3, .8] },
    { p: .18, eye: [.2, 3.1, 10.7], target: [0, 2.7, -4] },
    { p: .28, eye: [0, 3.1, 1.0], target: [0, 3.2, -5.6] },
    { p: .35, eye: [0, 3.1, -13], target: [0, 2.8, -29] },
    { p: .43, eye: [.2, 3.1, -23.0], target: [0, 2.8, -38] },
    { p: .55, eye: [0, 3.1, -33.1], target: [0, 3.2, -39.6] },
    { p: .63, eye: [0, 3.1, -47], target: [0, 2.8, -63] },
    { p: .71, eye: [.2, 3.1, -57.0], target: [0, 2.8, -72] },
    { p: .84, eye: [0, 3.1, -67.1], target: [0, 3.2, -73.6] },
    { p: .92, eye: [8, 10, -73], target: [0, 2.1, -68] },
    { p: 1, eye: [8, 12, -46], target: [0, 1.5, -68] }
  ];
  const eye = new THREE.Vector3(), target = new THREE.Vector3();
  const smooth = t => t * t * (3 - 2 * t);
  function draw() {
    raf = 0; if (destroyed) return;
    let i = 0; while (i < poses.length - 2 && progress > poses[i + 1].p) i++;
    const a = poses[i], b = poses[i + 1], t = smooth(THREE.MathUtils.clamp((progress - a.p) / (b.p - a.p), 0, 1));
    eye.fromArray(a.eye).lerp(new THREE.Vector3(...b.eye), t);
    target.fromArray(a.target).lerp(new THREE.Vector3(...b.target), t);
    // Wider phones see the whole miniature instead of a narrow crop of its doorway.
    if (container.clientWidth < 700 && progress < .15) eye.x += (1 - progress / .15) * 3;
    camera.position.copy(eye); camera.lookAt(target);
    sunlight.position.set(eye.x - 15, 28, eye.z + 18); sunlight.target.position.set(0, 0, eye.z - 4);
    worlds.forEach((group, n) => {
      group.visible = n === 0 ? progress < .37 : n === 1 ? progress > .16 && progress < .66 : progress > .43;
    });
    screens.forEach(({ proof, z }) => { proof.visible = eye.z - z > .65; });
    renderer.render(scene, camera);
  }
  function requestDraw() { if (!raf && !destroyed) raf = requestAnimationFrame(draw); }
  function resize() {
    if (destroyed) return;
    const width = Math.max(1, container.clientWidth), height = Math.max(1, container.clientHeight);
    renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); requestDraw();
  }
  const observer = new ResizeObserver(resize); observer.observe(container);
  function contextLost(event) {
    event.preventDefault(); container.dispatchEvent(new CustomEvent('worlderror', { detail: 'WebGL context lost' }));
  }
  renderer.domElement.addEventListener('webglcontextlost', contextLost);
  resize(); draw(); onReady?.();
  return {
    setProgress(value) { progress = THREE.MathUtils.clamp(Number(value) || 0, 0, 1); requestDraw(); },
    resize,
    destroy() {
      destroyed = true; if (raf) cancelAnimationFrame(raf); observer.disconnect();
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      for (const resource of resources) resource.dispose?.(); renderer.dispose(); renderer.domElement.remove();
    }
  };
}
