import * as T from './vendor/three.module.js';

export function createOffice(container, projects) {
  const scene = new T.Scene();
  scene.background = new T.Color(0x24211c);
  const camera = new T.PerspectiveCamera(42, 1, .035, 40);
  const renderer = new T.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;

  const material = (color, roughness = .75, metalness = 0) => new T.MeshStandardMaterial({color, roughness, metalness});
  const place = (geometry, finish, x, y, z) => {
    const mesh = new T.Mesh(geometry, finish);
    mesh.position.set(x,y,z);
    mesh.castShadow = mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  };
  const box = (w,h,d,m,x,y,z) => place(new T.BoxGeometry(w,h,d),m,x,y,z);
  const rounded = (w,h,d,r,m,x,y,z) => {
    const shape = new T.Shape();
    const a=w/2-r,b=h/2-r;
    shape.moveTo(-a,-b); shape.lineTo(a,-b); shape.lineTo(a,b); shape.lineTo(-a,b); shape.closePath();
    const geometry = new T.ExtrudeGeometry(shape,{depth:d-2*r,bevelEnabled:true,bevelSize:r,bevelThickness:r,bevelSegments:4,steps:1});
    geometry.translate(0,0,-(d-2*r)/2);
    return place(geometry,m,x,y,z);
  };
  const cylinder = (a,b,h,m,x,y,z) => place(new T.CylinderGeometry(a,b,h,40),m,x,y,z);
  const joint = (start,end,r,m) => {
    const a = new T.Vector3(...start), b = new T.Vector3(...end);
    const mid = a.clone().lerp(b,.5);
    const rod = cylinder(r,r,a.distanceTo(b),m,...mid.toArray());
    rod.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b.sub(a).normalize());
  };
  const woodCanvas = document.createElement('canvas');
  woodCanvas.width = 1024;
  woodCanvas.height = 512;
  const ctx = woodCanvas.getContext('2d');
  ctx.fillStyle = '#815437';
  ctx.fillRect(0,0,1024,512);
  for(let i=0;i<650;i++){
    const y = (i * 19.731) % 512;
    ctx.strokeStyle = i % 3 ? 'rgba(37,17,7,.11)' : 'rgba(255,189,116,.13)';
    ctx.beginPath();
    for(let x=0;x<=1024;x+=12){
      const grain = y + 2*Math.sin(x*.018+i) + 3*Math.sin(x*.005+i*.7);
      if(x===0) ctx.moveTo(x,grain); else ctx.lineTo(x,grain);
    }
    ctx.stroke();
  }
  const woodMap = new T.CanvasTexture(woodCanvas);
  woodMap.colorSpace = T.SRGBColorSpace;
  const walnut = new T.MeshStandardMaterial({map:woodMap,roughness:.56});
  const black = material(0x252826,.43,.25);
  const brass = material(0x9f7648,.36,.54);
  const wall = material(0x625e50);
  const paper = material(0xd8c4a7);
  box(18, .14, 15, material(0x42372c),0,-.08,0);
  box(18, 8, .2, wall,0,3.8,-2.85);
  box(7, .15, .14, paper,0,.09,-2.7);
  rounded(3.95,.125,1.48,.023,walnut,0,1.05,0);
  for(const x of [-1.75,1.75]) for(const z of [-.61,.61]) box(.11,1.02,.11,black,x,.51,z);
  box(1.8,1.37,.08,black,1.31,2.8,-2.7);
  const sky = new T.MeshBasicMaterial({color:0x667e88});
  box(1.71,1.28,.035,sky,1.31,2.8,-2.64);
  for(let i=0;i<12;i++){
    const height=.09+(i*7%11)*.025;
    box(.115,height,.01,material(i%2?0x56666a:0x526165),.53+i*.142,2.18+height/2,-2.618);
  }
  box(.055,1.29,.03,black,1.31,2.8,-2.61);
  box(1.72,.055,.03,black,1.31,2.8,-2.61);
  box(1.93,.065,.19,walnut,1.31,2.1,-2.59);
  for(let i=0;i<11;i++) box(1.7,.025,.065,material(0x867965),1.31,3.42-i*.045,-2.59);
  box(.65,.8,.07,walnut,-1.43,2.69,-2.63);
  box(.56,.71,.035,paper,-1.43,2.69,-2.584);
  box(.28,.28,.01,material(0x84583d),-1.43,2.76,-2.562);

  rounded(1.63,1.02,.09,.018,black,.21,1.87,-.38);
  box(.11,.41,.13,black,.21,1.34,-.4);
  box(.49,.039,.3,black,.21,1.137,-.34);
  const screen = new T.MeshBasicMaterial({color:0x101716,toneMapped:false});
  place(new T.PlaneGeometry(1.55,.873),screen,.21,1.89,-.332).castShadow=false;
  const light = new T.MeshBasicMaterial({color:0x815432});
  place(new T.SphereGeometry(.008,12,8),light,.94,1.39,-.33);
  const loader = new T.TextureLoader();
  const captures = projects.map(project => {
    const texture = loader.load(project.image,() => { if(!frame) frame=requestAnimationFrame(draw); });
    texture.colorSpace = T.SRGBColorSpace;
    return texture;
  });
  const bootCanvas = document.createElement('canvas');
  bootCanvas.width=640; bootCanvas.height=360;
  const boot = bootCanvas.getContext('2d');
  boot.fillStyle='#101917'; boot.fillRect(0,0,640,360);
  boot.fillStyle='#f3d5a3'; boot.textAlign='center'; boot.font='64px Georgia';
  boot.fillText('kron.',320,184);
  boot.fillStyle='#8f9b8c'; boot.fillRect(276,219,88,2);
  const bootMap = new T.CanvasTexture(bootCanvas);
  bootMap.colorSpace=T.SRGBColorSpace;

  const key = material(0xc5b59a);
  box(.88,.037,.28,black,.2,1.13,.34);
  for(let row=0;row<5;row++) for(let col=0;col<15;col++){
    box(.046,.016,.04,(row+col)%19===0?brass:key,-.199+col*.057,1.156,.235+row*.05);
  }
  box(.23,.017,.042,key,.2,1.159,.435);
  const mouse = place(new T.SphereGeometry(.085,24,16),black,.82,1.14,.36);
  mouse.scale.set(.64,.36,1);
  box(.34,.035,.27,material(0x464c3c),1.45,1.132,.26).rotation.y=.22;
  box(.30,.015,.24,paper,1.45,1.151,.26).rotation.y=.22;
  joint([1.28,1.165,.13],[1.58,1.165,.34],.008,brass);

  cylinder(.18,.19,.043,brass,-1.36,1.135,-.25);
  joint([-1.36,1.15,-.25],[-1.5,1.91,-.31],.022,brass);
  joint([-1.5,1.91,-.31],[-1.19,2.36,-.14],.022,brass);
  const shade = cylinder(.10,.23,.16,material(0x585b42),-1.15,2.37,-.13);
  shade.rotation.z=-.19;
  place(new T.SphereGeometry(.057,24,16),new T.MeshBasicMaterial({color:0xffd8a2}),-1.17,2.28,-.13);
  const pool = new T.PointLight(0xffbc75,12,6,2);
  pool.position.set(-1.17,2.21,-.13);
  scene.add(pool);
  const mug = material(0xc4a177,.29);
  const cupProfile = [[0,0],[.086,0],[.102,.018],[.106,.168],[.097,.17],[.093,.028],[0,.028]];
  place(new T.LatheGeometry(cupProfile.map(([x,y])=>new T.Vector2(x,y)),48),mug,1.33,1.113,-.29);
  place(new T.TorusGeometry(.057,.012,12,32),mug,1.44,1.21,-.29);
  cylinder(.091,.091,.007,material(0x392119,.24),1.33,1.235,-.29);
  cylinder(.21,.15,.25,material(0x8d553f),1.66,1.23,-.49);
  cylinder(.196,.196,.02,material(0x30261d),1.66,1.354,-.49);
  const foliage = [material(0x37492b),material(0x52613c),material(0x6e7546)];
  for(let i=0;i<17;i++){
    const angle=i*2.399, radius=.15+(i%4)*.04, y=1.51+(i%6)*.07;
    const x=1.66+Math.cos(angle)*radius,z=-.49+Math.sin(angle)*radius;
    joint([1.66,1.35,-.49],[x,y,z],.008,foliage[0]);
    const leaf=place(new T.SphereGeometry(.09,16,12),foliage[i%3],x,y,z);
    leaf.scale.set(.55,.16,1.6); leaf.rotation.set(.45,angle,.3);
  }
  const upholstery=material(0x47382c,.94);
  const chairBack=rounded(.69,.63,.095,.035,upholstery,-.78,.94,1.15);
  chairBack.rotation.x=-.12;
  const seat=rounded(.67,.64,.11,.04,upholstery,-.78,.60,.94);
  seat.rotation.x=-Math.PI/2;
  cylinder(.04,.05,.49,black,-.78,.30,.96);
  for(let i=0;i<5;i++){
    const angle=i*Math.PI*2/5;
    const x=-.78+Math.cos(angle)*.34,z=.96+Math.sin(angle)*.34;
    joint([-.78,.115,.96],[x,.087,z],.022,black);
    place(new T.SphereGeometry(.042,16,10),black,x,.047,z);
  }
  scene.add(new T.HemisphereLight(0xc9d9e5,0x725744,1.1));
  const sun = new T.DirectionalLight(0xffe2b8,2.55);
  sun.position.set(2.4,5.6,2.6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048,2048);
  sun.shadow.normalBias=.025;
  sun.shadow.radius=4;
  Object.assign(sun.shadow.camera,{left:-4,right:4,top:4,bottom:-4});
  scene.add(sun);

  let current=0, target=0, frame=0, index=-1, showing=false, awake=false;
  const aim = new T.Vector3();
  function draw(){
    frame=0;
    current += (target-current)*.15;
    if(Math.abs(target-current)<.0002) current=target;
    const raw=Math.min(1,current/.43);
    const t=raw*raw*(3-2*raw);
    const aspect=camera.aspect;
    const portrait=aspect<.85;
    const close=Math.max(1.33,1.55/(2*Math.tan(T.MathUtils.degToRad(21))*aspect*.87));
    camera.position.set(T.MathUtils.lerp(portrait?1.3:2.6,.21,t),T.MathUtils.lerp(portrait?2.9:2.65,1.89,t),T.MathUtils.lerp(portrait?6.65:4.25,close-.332,t));
    aim.set(T.MathUtils.lerp(portrait?.12:-.52,.21,t),T.MathUtils.lerp(portrait?2.55:1.83,1.89,t),-.332);
    camera.lookAt(aim);
    renderer.render(scene,camera);
    if(current!==target) frame=requestAnimationFrame(draw);
  }
  function resize(){
    camera.aspect=container.clientWidth/Math.max(1,container.clientHeight);
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth,container.clientHeight,false);
    if(frame) cancelAnimationFrame(frame);
    draw();
  }
  container.append(renderer.domElement);
  renderer.shadowMap.needsUpdate=true;
  resize();
  return {
    resize,
    set(progress, project, power, display){
      if(target===progress && index===project && awake===power && showing===display) return;
      target=progress; index=project; awake=power; showing=display;
      screen.map=display?captures[project]:power?bootMap:null;
      screen.color.set(screen.map?0xffffff:0x101716);
      screen.needsUpdate=true;
      light.color.set(power?0xffdf9c:0x815432);
      if(!frame) frame=requestAnimationFrame(draw);
    }
  };
}
