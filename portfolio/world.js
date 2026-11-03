import * as THREE from './vendor/three.module.js';

// A built architectural model: scroll moves the camera through the clear center aisle.
export async function createWorld(container, { onReady } = {}) {
  if (!container) throw new Error('The world needs a canvas container.');
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#f5eee7');
  scene.fog = new THREE.Fog('#f5eee7', 220, 480);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 700 ? 1.25 : 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .98;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;';
  container.append(renderer.domElement);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.08, 500);
  const resources = new Set();
  const materials = new Map();
  const geometries = new Map();
  let progress = 0, targetProgress = 0, raf = 0, destroyed = false;

  const surfaceTexture = kind => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d'); let seed = 217;
    const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    ctx.fillStyle = '#faf8f3'; ctx.fillRect(0, 0, 256, 256);
    if (kind === 'brick') {
      ctx.fillStyle = '#bdb7ac'; ctx.fillRect(0, 0, 256, 256);
      for (let y = 0; y < 8; y++) for (let x = -1; x < 5; x++) {
        const shade = 224 + Math.floor(random() * 25); ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
        ctx.fillRect(x * 64 + (y % 2 ? 32 : 0) + 2, y * 32 + 2, 60, 28);
      }
    } else if (kind === 'wood') {
      for (let i = 0; i < 120; i++) {
        ctx.strokeStyle = `rgba(108,88,64,${.025 + random() * .05})`; ctx.lineWidth = random() * 1.4 + .3;
        const x = random() * 256; ctx.beginPath(); ctx.moveTo(x, 0); ctx.bezierCurveTo(x + 8, 80, x - 7, 170, x + 5, 256); ctx.stroke();
      }
    } else {
      const image = ctx.getImageData(0, 0, 256, 256);
      for (let i = 0; i < image.data.length; i += 4) {
        const value = 238 + Math.floor(random() * 18); image.data[i] = image.data[i + 1] = image.data[i + 2] = value;
      }
      ctx.putImageData(image, 0, 0);
    }
    const texture = new THREE.CanvasTexture(canvas); texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4; resources.add(texture); return texture;
  };
  const plaster = surfaceTexture('plaster'), woodGrain = surfaceTexture('wood'), brick = surfaceTexture('brick');
  brick.repeat.set(6, 3);
  const reflectionFaces = Array.from({ length: 6 }, (_, face) => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = face === 2 ? '#f7f4e9' : face === 3 ? '#bcb6a4' : '#e8e9df'; ctx.fillRect(0, 0, 128, 128);
    if (face !== 2 && face !== 3) {
      ctx.fillStyle = '#cdcbbd'; ctx.fillRect(0, 78, 128, 50);
      ctx.fillStyle = '#a9b1a6'; ctx.fillRect(10, 48, 24, 30); ctx.fillRect(78, 42, 36, 36);
      ctx.fillStyle = '#edf0e7'; ctx.fillRect(16, 55, 5, 12); ctx.fillRect(25, 55, 5, 12); ctx.fillRect(86, 49, 8, 17);
    }
    return canvas;
  });
  const reflection = new THREE.CubeTexture(reflectionFaces); reflection.colorSpace = THREE.SRGBColorSpace; reflection.needsUpdate = true;
  resources.add(reflection); scene.environment = reflection; scene.environmentIntensity = .35;

  const mat = (color, extras = {}) => {
    const key = color + JSON.stringify(Object.fromEntries(Object.entries(extras).map(([key, value]) => [key, value?.isTexture ? value.uuid : value])));
    if (!materials.has(key)) {
      const material = new THREE.MeshStandardMaterial({ color, roughness: .8, metalness: 0, map: plaster, bumpMap: plaster, bumpScale: .012, ...extras });
      materials.set(key, material); resources.add(material);
    }
    return materials.get(key);
  };
  const colors = { ivory: '#f0dfcd', white: '#fffaf0', ink: '#284c45', wood: '#c29572', oak: '#d3ad88', olive: '#71966c', brass: '#d1ab70', blue: '#b95a74', clay: '#d5977c', pastry: '#c78b4d' };
  const roundedGeometry = (w, h, d) => {
    const key = [w, h, d].join(',');
    if (geometries.has(key)) return geometries.get(key);
    const bevel = Math.min(.035, w / 12, h / 12, d / 5), corner = bevel * .7;
    const a = w / 2 - bevel, b = h / 2 - bevel;
    const shape = new THREE.Shape();
    shape.moveTo(-a + corner, -b); shape.lineTo(a - corner, -b);
    shape.quadraticCurveTo(a, -b, a, -b + corner); shape.lineTo(a, b - corner);
    shape.quadraticCurveTo(a, b, a - corner, b); shape.lineTo(-a + corner, b);
    shape.quadraticCurveTo(-a, b, -a, b - corner); shape.lineTo(-a, -b + corner);
    shape.quadraticCurveTo(-a, -b, -a + corner, -b);
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: d - bevel * 2, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: bevel, bevelThickness: bevel, curveSegments: 3 });
    geometry.translate(0, 0, -d / 2 + bevel); geometry.computeVertexNormals();
    geometries.set(key, geometry); resources.add(geometry); return geometry;
  };
  const box = (parent, w, h, d, material, x = 0, y = 0, z = 0, rotation = 0) => {
    const geometry = roundedGeometry(w, h, d);
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
    cylinder(group, .45, .32, .7, '#dbab89', 0, .35, 0);
    torus(group, .43, .045, '#e8bb98', 0, .7, 0, [Math.PI / 2, 0, 0]);
    for (let i = 0; i < 8; i++) {
      const angle = i / 8 * Math.PI * 2;
      const stem = cylinder(group, .022, .03, 1.2 + (i % 3) * .18, colors.olive, Math.cos(angle) * .12, 1.04, Math.sin(angle) * .12, 8);
      stem.rotation.z = Math.cos(angle) * .35;
      const leaf = sphere(group, .37, i % 2 ? '#91ab73' : '#5d8a67', Math.cos(angle) * .33, 1.55 + (i % 3) * .15, Math.sin(angle) * .33, [.35, 1, .65]);
      leaf.rotation.z = -Math.cos(angle) * .55;
    }
    for (let i = 0; i < 1; i++) {
      const x = (i - 1) * .26, y = 1.7 + (i % 2) * .24, z = .1 - (i % 2) * .3;
      for (let petal = 0; petal < 5; petal++) {
        const angle = petal / 5 * Math.PI * 2;
        sphere(group, .12, i % 2 ? '#e9a7af' : '#f4d6a0', x + Math.cos(angle) * .12, y + Math.sin(angle) * .12, z, [1, 1, .45]);
      }
      sphere(group, .07, '#d9a445', x, y, z + .06);
    }
  };
  const scallop = (parent, x, y, z, width, color) => {
    const shape = new THREE.Shape(); shape.moveTo(-width / 2, .12); shape.lineTo(width / 2, .12);
    shape.lineTo(width / 2, -.08); shape.quadraticCurveTo(width / 2, -.24, 0, -.24);
    shape.quadraticCurveTo(-width / 2, -.24, -width / 2, -.08); shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: .09, bevelEnabled: true, bevelThickness: .02, bevelSize: .02, bevelSegments: 2, curveSegments: 10 }); resources.add(geometry);
    const mesh = new THREE.Mesh(geometry, mat(color)); mesh.position.set(x, y, z); mesh.castShadow = true; parent.add(mesh);
  };
  const hangingSign = (parent, text, x, y, z, ink, background) => {
    box(parent, 1.5, .12, .12, ink, x, y + .9, z - .2);
    cylinder(parent, .025, .025, .55, ink, x + .45, y + .57, z - .2, 8);
    const disc = cylinder(parent, .65, .65, .15, background, x + .45, y - .2, z - .2, 40); disc.rotation.x = Math.PI / 2;
    const texture = panelTexture(text, background, ink, { width: 512, height: 512, size: 90 });
    const material = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }); resources.add(material);
    const geometry = new THREE.CircleGeometry(.6, 40); resources.add(geometry);
    const face = new THREE.Mesh(geometry, material); face.position.set(x + .45, y - .2, z - .105); parent.add(face);
  };
  const bench = (parent, x, z, color) => {
    for (const y of [.62, 1.28]) for (let i = 0; i < 3; i++) box(parent, 2.35, .12, .18, color, x, y + (y > 1 ? i * .2 : 0), z + (y < 1 ? i * .21 : -.12));
    for (const dx of [-.85, .85]) {
      box(parent, .1, .65, .7, '#647e72', x + dx, .28, z + .2);
      box(parent, .1, 1.5, .1, '#647e72', x + dx, .7, z - .12);
    }
  };

  scene.add(new THREE.HemisphereLight('#fff8ed', '#a6aaa5', 1.9));
  const sunlight = new THREE.DirectionalLight('#fff1d9', 3.4);
  sunlight.position.set(-30, 55, 35); sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(2048, 2048);
  sunlight.shadow.camera.left = -55; sunlight.shadow.camera.right = 55;
  sunlight.shadow.camera.top = 55; sunlight.shadow.camera.bottom = -55;
  sunlight.shadow.camera.near = .5; sunlight.shadow.camera.far = 180;
  sunlight.shadow.normalBias = .04; sunlight.shadow.bias = -.0001;
  scene.add(sunlight); scene.add(sunlight.target);
  const fill = new THREE.DirectionalLight('#f5f7ff', .7); fill.position.set(25, 20, -25); scene.add(fill);
  const groundMaterial = new THREE.ShadowMaterial({ opacity: .13 }); resources.add(groundMaterial);
  const ground = box(scene, 400, .2, 400, groundMaterial, 0, -.75, 5);
  ground.castShadow = false;
  // One connected pavement and street replaces the original isolated gallery islands.
  box(scene, 54, .3, 43, '#d8cfc1', 0, -.46, 18);
  box(scene, 43.5, .13, 33.5, '#b4b5ae', 0, -.24, 19.5);
  for (const x of [-22.3, 22.3]) box(scene, .22, .24, 34, '#eee5d6', x, -.1, 19.5);
  box(scene, 44.6, .24, .22, '#eee5d6', 0, -.1, 2.6);
  for (const z of [5.5, 34]) for (let i = 0; i < 7; i++) box(scene, 2.4, .012, .8, '#e9e4d8', -8.1 + i * 2.7, -.165, z);
  for (const x of [-24.2, 24.2]) for (let z = 4; z < 39; z += 2.8) box(scene, 3.2, .035, .04, '#bcb3a5', x, -.285, z);

  const worlds = [], screens = [];
  const storefront = (name, z, palette) => {
    const group = new THREE.Group(); group.position.z = z; scene.add(group); worlds.push(group);
    // Roof and back center stay open: a cutaway model and a continuous walkable aisle.
    box(group, 13, .4, 15.5, palette.floor, 0, -.22, 0);
    box(group, 13.4, .2, 3.3, '#e7d4c0', 0, -.33, 8.7);
    box(group, .32, 5.7, 14.8, palette.wall, -6.1, 2.65, -.3);
    box(group, .32, 2.3, 14.8, palette.wall, 6.1, .95, -.3);
    box(group, 2.1, 5.7, .35, palette.wall, -5.2, 2.65, -7.5);
    box(group, 2.1, 5.7, .35, palette.wall, 5.2, 2.65, -7.5);
    box(group, 12.7, .48, .65, palette.trim, 0, 5.66, 7.2);
    box(group, .45, 5.65, .6, palette.trim, -6.1, 2.65, 7.2);
    box(group, .45, 5.65, .6, palette.trim, 6.1, 2.65, 7.2);
    box(group, 13.05, .24, 1.1, palette.wall, 0, 6.35, 7.13);
    box(group, 12.55, 2.15, .5, palette.wall, 0, 7.5, 7.12);
    box(group, 13.1, .19, .85, palette.trim, 0, 8.65, 7.14);
    for (const x of [-4.6, -2.3, 0, 2.3, 4.6]) {
      box(group, 1.5, 1.3, .12, '#f1e9dc', x, 7.5, 7.46);
      box(group, 1.3, 1.11, .08, mat('#9baca8', { metalness: .45, roughness: .2, bumpScale: 0 }), x, 7.5, 7.54);
      box(group, .045, 1.11, .1, '#e7e1d3', x, 7.5, 7.6);
      box(group, 1.3, .045, .1, '#e7e1d3', x, 7.52, 7.6);
    }
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

  const coffee = storefront('Before Coffee', 0, { floor: '#dbc4a5', wall: '#f4e5cf', trim: '#527967', sign: '#fff4dc', threshold: '#6e8e71' });
  // The awning's stripes are modeled pieces of cloth, not a screen-space texture.
  for (let i = 0; i < 14; i++) {
    const stripe = i % 2 ? '#fff1d7' : '#8baa80';
    const awning = box(coffee, .91, .12, 2.25, stripe, -5.92 + i * .91, 4.95, 8.6);
    awning.rotation.x = -.13;
    scallop(coffee, -5.92 + i * .91, 4.77, 9.7, .88, stripe);
  }
  hangingSign(coffee, 'coffee', 5.9, 4.3, 8.15, '#527967', '#fff1d7');
  bench(coffee, -4.6, 10.2, '#c68c68');
  // A small parked bicycle makes the model read as a lived-in neighborhood.
  const bicycle = new THREE.Group(); bicycle.position.set(5.6, .26, 10.2); bicycle.rotation.y = -.25; coffee.add(bicycle);
  for (const x of [-.8, .8]) {
    torus(bicycle, .52, .06, '#71827a', x, .55, 0);
    torus(bicycle, .43, .025, '#e6d9be', x, .55, 0);
  }
  const bicycleBar = (a, b, color, radius = .045) => {
    const from = new THREE.Vector3(...a), to = new THREE.Vector3(...b), direction = to.clone().sub(from);
    const geometry = new THREE.CylinderGeometry(radius, radius, direction.length(), 10); resources.add(geometry);
    const mesh = new THREE.Mesh(geometry, mat(color)); mesh.position.copy(from.add(to).multiplyScalar(.5));
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize()); bicycle.add(mesh);
  };
  for (const [a, b] of [[[ -.8, .55, 0 ], [0, .55, 0]], [[-.8, .55, 0], [-.2, 1.2, 0]], [[-.2, 1.2, 0], [0, .55, 0]], [[-.2, 1.2, 0], [.6, 1.2, 0]], [[.6, 1.2, 0], [0, .55, 0]], [[.6, 1.2, 0], [.8, .55, 0]], [[.6, 1.2, 0], [.55, 1.55, 0]]]) bicycleBar(a, b, '#cf8e77');
  box(bicycle, .45, .1, .22, '#80674f', -.2, 1.3, 0);
  box(bicycle, .4, .07, .07, '#71827a', .52, 1.55, 0);
  box(coffee, 3.6, 1.8, 7.9, mat(colors.oak, { map: woodGrain, bumpMap: woodGrain, bumpScale: .025 }), -3.95, .8, -1.5);
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
    cylinder(coffee, .37, .37, .035, '#ebd5b8', -3.6, 1.88, z);
  }
  for (let i = 0; i < 3; i++) {
    const crescent = torus(coffee, .26, .12, '#cf9454', -3.8 + i * .65, 1.99, 3.15, [Math.PI / 2, .12, .2], Math.PI * 1.25);
    crescent.scale.set(1.2, 1, .75);
    sphere(coffee, .09, '#f3cca0', -3.8 + i * .65, 2.08, 3.15, [.6, .35, 1.9]);
  }
  // Steam curves are static sculptural wisps; scroll changes their gentle lean.
  const steam = new THREE.Group(); coffee.add(steam);
  for (let i = 0; i < 2; i++) {
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(.09, .22, 0), new THREE.Vector3(-.04, .44, .02), new THREE.Vector3(.07, .68, 0)]);
    const geometry = new THREE.TubeGeometry(curve, 16, .025, 6, false); resources.add(geometry);
    const mesh = new THREE.Mesh(geometry, mat('#fffaf2', { transparent: true, opacity: .65, depthWrite: false }));
    mesh.position.set(-3.7 + i * .18, 2.3, 1.4); steam.add(mesh);
  }
  const cafeBoard = new THREE.Group(); cafeBoard.position.set(3.1, .05, 10.0); cafeBoard.rotation.y = -.15; coffee.add(cafeBoard);
  const boardFront = box(cafeBoard, 1.05, 1.55, .11, '#d9b38d', 0, .83, 0); boardFront.rotation.x = -.12;
  const boardBack = box(cafeBoard, 1.05, 1.55, .11, '#d9b38d', 0, .83, -.52); boardBack.rotation.x = .12;
  sign(cafeBoard, 'hello', .8, .78, 0, .99, .11, '#63836d', '#fff2d8', { width: 512, height: 512, size: 115 });
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

  const barber = storefront('Luxury Cut', -34, { floor: '#f0e0cb', wall: '#e5e8d9', trim: '#588c89', sign: '#fff4de', threshold: '#769d91' });
  box(barber, 12.8, .23, 1.2, '#e1b987', 0, 6.1, 7.1);
  hangingSign(barber, 'LC', -6.8, 4.1, 8.1, '#558b85', '#fff0d6');
  bench(barber, -4.6, 10.2, '#bd8971');
  // A checker floor is actual square stone tile geometry within this shop.
  for (let x = 0; x < 8; x++) for (let z = 0; z < 9; z++) {
    if ((x + z) % 2) box(barber, 1.48, .018, 1.48, '#a7c3b7', -5.25 + x * 1.5, .001, -6.5 + z * 1.5);
  }
  for (const z of [-3.3, 1.1]) {
    const station = new THREE.Group(); station.position.set(-3.6, 0, z); station.rotation.y = .12; barber.add(station);
    cylinder(station, .65, .7, .1, '#565e57', 0, .1, 0);
    cylinder(station, .12, .17, .72, '#9b9d89', 0, .5, 0);
    box(station, 1.3, .4, 1.5, '#5a8a80', 0, 1, 0);
    box(station, 1.3, 1.25, .4, '#5a8a80', 0, 1.65, -.58);
    box(station, .8, .34, .32, '#dfac93', 0, 2.32, -.58);
    box(station, 1.05, .06, 1.1, '#73a194', 0, 1.22, .02);
    for (const x of [-.69, .69]) {
      box(station, .16, .16, 1.3, '#a9a184', x, 1.45, .05);
      box(station, .08, .5, .08, '#7f887b', x, 1.2, .5);
    }
    box(station, .85, .08, .7, '#a9a184', 0, .52, .95);
    box(barber, .22, 3.4, 2.7, '#b4a16c', -5.78, 3.1, z - .2);
    box(barber, .04, 3.1, 2.45, mat('#d8e0d8', { metalness: .7, roughness: .18 }), -5.63, 3.1, z - .2);
  }
  box(barber, 2.7, 1.5, 3.0, '#709d92', 4.3, .67, -4.8);
  box(barber, 2.9, .18, 3.2, '#ddd5bd', 4.3, 1.5, -4.8);
  const pole = new THREE.Group(); pole.position.set(5.45, 2.5, 7.65); barber.add(pole);
  cylinder(pole, .21, .21, 1.8, '#e4ddc7', 0, 0, 0);
  for (let i = 0; i < 8; i++) {
    const stripe = cylinder(pole, .217, .217, .11, i % 2 ? '#6caaa5' : '#df9d8e', 0, -.72 + i * .2, 0, 24);
    stripe.rotation.z = -.28;
  }
  sphere(pole, .27, '#b8ad8c', 0, 1, 0); sphere(pole, .27, '#b8ad8c', 0, -1, 0);

  const bakery = storefront("Judith's Bakery", -68, { floor: '#eed5bb', wall: '#fff0dc', trim: '#b95a74', sign: '#fff3df', threshold: '#e7b89d' });
  hangingSign(bakery, 'bakery', 5.9, 4.3, 8.2, '#ad5270', '#ffe9d9');
  bench(bakery, 4.6, 10.2, '#bd6a7b');
  for (let i = 0; i < 7; i++) {
    const stripe = i % 2 ? '#fff3dc' : '#d592a3';
    const panel = box(bakery, 1.8, .15, 2.0, stripe, -5.4 + i * 1.8, 5.0, 8.4);
    panel.rotation.x = -.12;
    scallop(bakery, -5.4 + i * 1.8, 4.82, 9.42, 1.76, stripe);
  }
  const bread = (x, y, z, size = 1, rotation = 0) => {
    const loaf = sphere(bakery, .42 * size, '#b67f43', x, y, z, [1.5, .7, .72]); loaf.rotation.y = rotation;
    for (let i = -1; i <= 1; i++) {
      const score = box(bakery, .06 * size, .018, .36 * size, '#e3b979', x + i * .22 * size, y + .27 * size, z, -.25);
      score.rotation.z = -.1;
    }
  };
  box(bakery, 3.8, 1.5, 8.1, '#d8a390', -3.9, .65, -1.5);
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
  for (let i = 0; i < 3; i++) {
    const z = 3.1 - i * 1.05;
    cylinder(bakery, .34, .34, .04, '#f6e8d4', -3.1, 1.62, z);
    cylinder(bakery, .23, .23, .23, '#e3b776', -3.1, 1.76, z);
    sphere(bakery, .24, i % 2 ? '#f0b4ba' : '#fff2d6', -3.1, 1.9, z, [1, .5, 1]);
    sphere(bakery, .065, '#b9566e', -3.1, 2.035, z);
  }
  for (const z of [-5.5, -1.5, 2.5]) box(bakery, .14, 4.2, .14, colors.blue, 5.85, 2, z);

  // Three featured storefronts share the same north-side street frontage.
  coffee.position.set(-15, 0, -7); barber.position.set(0, 0, -7); bakery.position.set(15, 0, -7);

  const florist = storefront('Flowers', 0, { floor: '#d7ccba', wall: '#eee6d6', trim: '#708975', sign: '#fff4df', threshold: '#b4bd9d' });
  florist.position.set(-29, 0, 11); florist.rotation.y = Math.PI / 3; florist.scale.set(.64, .78, .62);
  for (const x of [-3.9, 3.9]) {
    box(florist, 2.8, .85, 3.7, mat('#a7977d', { map: woodGrain, bumpMap: woodGrain, bumpScale: .02 }), x, .3, 4.8);
    for (let i = 0; i < 3; i++) plant(florist, x + (i - 1) * .65, 4.5 + (i % 2) * 1.1, .6);
  }
  for (const x of [-3.9, 3.9]) {
    box(florist, 3.1, 1.7, 6.6, '#c8c2aa', x, .6, -.7);
    for (let i = 0; i < 4; i++) plant(florist, x, -3 + i * 1.45, .8);
  }

  const tailor = storefront('Tailor', 0, { floor: '#d7c8b0', wall: '#e9dfce', trim: '#65798a', sign: '#fff5e2', threshold: '#baa788' });
  tailor.position.set(29, 0, 12); tailor.rotation.y = -Math.PI / 3; tailor.scale.set(.64, .78, .62);
  box(tailor, 3.7, 1.7, 8, mat('#ac8b6b', { map: woodGrain, bumpMap: woodGrain, bumpScale: .015 }), -3.8, .7, -.5);
  box(tailor, 4, .15, 8.2, '#ded4c0', -3.8, 1.65, -.5);
  for (let i = 0; i < 5; i++) box(tailor, 1.55, .2, 1.35, ['#8a9b9e', '#b2ad8f', '#c2b1a1', '#7c8b7b', '#b99486'][i], -3.8, 1.85 + i * .19, 1.4);
  const dressForm = new THREE.Group(); tailor.add(dressForm); dressForm.position.set(3.8, .2, 3.5);
  cylinder(dressForm, .08, .08, 1.2, '#8e8678', 0, .65, 0);
  sphere(dressForm, .7, '#d9c8a9', 0, 2.2, 0, [.7, 1.05, .45]);
  cylinder(dressForm, .15, .18, .4, '#c2aa89', 0, 3.0, 0);
  box(dressForm, 1.4, .1, .15, '#8e8678', 0, .1, 0);
  box(dressForm, .15, .1, 1.4, '#8e8678', 0, .1, 0);

  const garage = storefront('Garage', 0, { floor: '#b7b7aa', wall: mat('#b4937d', { map: brick, bumpMap: brick, bumpScale: .05 }), trim: '#69736a', sign: '#fff5e1', threshold: '#969f94' });
  garage.position.set(-29, 0, 29); garage.rotation.y = Math.PI / 3; garage.scale.set(.64, .78, .62);
  for (const x of [-4, 4]) {
    box(garage, 3.3, 2.4, 2.3, '#8d9a91', x, 1, -4.4);
    for (let i = 0; i < 4; i++) box(garage, 3.1, .025, .05, '#b9bfb4', x, .3 + i * .55, -3.22);
  }
  const makeCar = (parent, x, z, color) => {
    const car = new THREE.Group(); parent.add(car); car.position.set(x, .1, z);
    box(car, 1.85, .6, 3.8, color, 0, .65, 0);
    box(car, 1.55, .65, 1.9, mat('#7b9397', { metalness: .3, roughness: .25, bumpScale: 0 }), 0, 1.2, -.2);
    box(car, 1.6, .13, 2.15, color, 0, 1.58, -.2);
    for (const dx of [-.96, .96]) for (const dz of [-1.15, 1.15]) {
      const wheel = cylinder(car, .36, .36, .2, '#474d49', dx, .42, dz, 24); wheel.rotation.z = Math.PI / 2;
      const hub = cylinder(car, .19, .19, .22, '#b7bab0', dx, .42, dz, 24); hub.rotation.z = Math.PI / 2;
    }
    for (const dx of [-.65, .65]) box(car, .4, .13, .08, '#f4e4b7', dx, .8, 1.93);
    return car;
  };
  makeCar(garage, 0, -.4, '#aeb7a2');
  const streetCar = makeCar(scene, 18.6, 27, '#9ca9a4'); streetCar.rotation.y = -.04;

  const streetTree = (x, z) => {
    box(scene, 2.2, .15, 2.2, '#adad99', x, -.1, z);
    cylinder(scene, .11, .17, 3.9, mat('#9e8974', { map: woodGrain, bumpMap: woodGrain }), x, 1.85, z, 12);
    sphere(scene, 1.65, '#91a181', x, 4.8, z, [1, 1.15, .92]);
    sphere(scene, 1.05, '#a0ae8c', x + .9, 4.4, z + .2, [.8, 1, 1]);
    sphere(scene, 1.1, '#849879', x - .75, 4.6, z - .2, [.9, 1, .9]);
  };
  const streetLamp = (x, z) => {
    cylinder(scene, .07, .12, 5.6, '#646f66', x, 2.6, z, 12);
    box(scene, 1.15, .09, .12, '#646f66', x + .42, 5.32, z);
    box(scene, .54, .22, .7, '#657168', x + .9, 5.18, z);
    box(scene, .43, .06, .6, mat('#fff2d2', { emissive: '#edd0a0', emissiveIntensity: .2 }), x + .9, 5.03, z);
  };
  for (const [x, z] of [[-24.5, 4.8], [24.5, 4.8], [-24.5, 37], [24.5, 32]]) streetTree(x, z);
  for (const [x, z] of [[-22.8, 19], [22.8, 20], [-22.8, 34]]) streetLamp(x, z);
  bench(scene, 24.4, 29, '#af9477');
  // The three framed screens are the real portfolio work, not imaginary UI.
  const loader = new THREE.TextureLoader();
  const screenDefinitions = [
    [coffee, 'assets/rooms/before-coffee-desktop.jpg.webp', '#527967'],
    [barber, 'assets/rooms/luxury-cut-desktop.jpg.webp', '#588c89'],
    [bakery, 'assets/rooms/judiths-bakery-desktop.jpg.webp', '#b95a74']
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
    screens.push({ proof, group });
  }));

  const poses = [
    { p: 0, eye: [53, 41, 76], target: [-14, 1, 8] },
    { p: .08, eye: [-5, 16, 31], target: [-15, 2.7, -4] },
    { p: .14, eye: [-15, 5.2, 11], target: [-15, 3.1, -10] },
    { p: .21, eye: [-15, 3.2, -5.4], target: [-15, 3.2, -12.6] },
    { p: .28, eye: [-15, 4.5, 8], target: [-15, 3, -7] },
    { p: .36, eye: [-5, 13, 23], target: [0, 2.5, -6] },
    { p: .44, eye: [0, 4.5, 10], target: [0, 3.1, -10] },
    { p: .52, eye: [0, 3.2, -5.4], target: [0, 3.2, -12.6] },
    { p: .60, eye: [0, 4.5, 8], target: [0, 3, -7] },
    { p: .68, eye: [9, 13, 23], target: [15, 2.5, -6] },
    { p: .76, eye: [15, 4.5, 10], target: [15, 3.1, -10] },
    { p: .83, eye: [15, 3.2, -5.4], target: [15, 3.2, -12.6] },
    { p: .9, eye: [15, 6, 13], target: [15, 2.5, -7] },
    { p: 1, eye: [45, 37, 65], target: [0, 1, 10] }
  ];
  const eye = new THREE.Vector3(), target = new THREE.Vector3();
  const smooth = t => t * t * (3 - 2 * t);
  const portraitViewport = () => container.clientWidth < 700 || (container.clientWidth < 1000 && container.clientHeight > container.clientWidth);
  function draw() {
    raf = 0; if (destroyed) return;
    progress = Math.abs(targetProgress - progress) < .00005 ? targetProgress : progress + (targetProgress - progress) * .24;
    let i = 0; while (i < poses.length - 2 && progress > poses[i + 1].p) i++;
    const a = poses[i], b = poses[i + 1], t = smooth(THREE.MathUtils.clamp((progress - a.p) / (b.p - a.p), 0, 1));
    eye.fromArray(a.eye).lerp(new THREE.Vector3(...b.eye), t);
    target.fromArray(a.target).lerp(new THREE.Vector3(...b.target), t);
    let phoneOpening = 0;
    // Pull the phone camera back and center its subject; the desktop leaves room for the title.
    if (portraitViewport() && progress < .13) {
      const opening = 1 - smooth(progress / .13); phoneOpening = opening;
      eye.lerp(new THREE.Vector3(13, 115, 110), opening);
      target.lerp(new THREE.Vector3(0, 12, 13), opening);
    }
    const viewFov = portraitViewport() ? 50 + phoneOpening * 10 : 42;
    if (camera.fov !== viewFov) { camera.fov = viewFov; camera.updateProjectionMatrix(); }
    camera.position.copy(eye); camera.lookAt(target);
    steam.rotation.z = Math.sin(progress * 24) * .035;
    screens.forEach(({ proof, group }) => { proof.visible = group.worldToLocal(eye.clone()).z > -5; });
    renderer.render(scene, camera);
    container.dataset.cameraProgress = progress.toFixed(4);
    if (Math.abs(targetProgress - progress) > .00005) requestDraw();
  }
  function requestDraw() { if (!raf && !destroyed) raf = requestAnimationFrame(draw); }
  function resize() {
    if (destroyed) return;
    const width = Math.max(1, container.clientWidth), height = Math.max(1, container.clientHeight);
    renderer.setSize(width, height, false); camera.aspect = width / height; camera.fov = portraitViewport() ? 50 : 42; camera.updateProjectionMatrix(); requestDraw();
  }
  const observer = new ResizeObserver(resize); observer.observe(container);
  function contextLost(event) {
    event.preventDefault(); container.dispatchEvent(new CustomEvent('worlderror', { detail: 'WebGL context lost' }));
  }
  renderer.domElement.addEventListener('webglcontextlost', contextLost);
  sunlight.target.position.set(0, 0, 12);
  renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true;
  container.dataset.storeCount = String(worlds.length);
  resize(); draw(); onReady?.();
  return {
    setProgress(value) {
      const next = THREE.MathUtils.clamp(Number(value) || 0, 0, 1);
      if (Math.abs(next - targetProgress) < .000001 && Math.abs(next - progress) < .00005) return;
      targetProgress = next; requestDraw();
    },
    resize,
    destroy() {
      destroyed = true; if (raf) cancelAnimationFrame(raf); observer.disconnect();
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      for (const resource of resources) resource.dispose?.(); renderer.dispose(); renderer.domElement.remove();
    }
  };
}
