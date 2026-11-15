import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const box = document.querySelector('.scene3d');
const canvas = box.querySelector('.scene3d__canvas');
const hotspots = [...box.querySelectorAll('.hotspot')];
const mobile = innerWidth < 900;

const clamp01 = x => Math.min(1, Math.max(0, x));
const smooth = x => x * x * (3 - 2 * x);
const ramp = (p, a, b) => smooth(clamp01((p - a) / (b - a)));
const lerp = (a, b, t) => a + (b - a) * t;
const stageOf = p => (p < 0.30 ? 0 : p < 0.55 ? 1 : p < 0.80 ? 2 : 3);
const bell = (p, k) => 1 - ramp(Math.abs(p - k), 0.04, 0.16);
const V = (x, y, z) => new THREE.Vector3(x, y, z);

let renderer = null;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
} catch (e) { /* нет WebGL: остаётся постер */ }

if (renderer) main().catch(() => {});

async function main() {
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  // r185: PCFSoftShadowMap объявлен устаревшим и сам заменяется на PCFShadowMap (мягкий PCF) — берём его сразу, без предупреждения в консоли
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false; // геометрия статична: тени считаем один раз

  const stageBg = ['#0D1A28', '#171C22', '#22130F', '#17120F'].map(c => new THREE.Color(c));
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(stageBg[0].clone(), 0.006);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 400);

  /* свет */
  scene.add(new THREE.HemisphereLight(0x8AA4C6, 0x1A2230, 1.15));
  const moon = new THREE.DirectionalLight(0xBFD4FF, 1.6);
  moon.position.set(-20, 40, 10);
  moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048);
  Object.assign(moon.shadow.camera, { left: -36, right: 36, top: 36, bottom: -36, near: 1, far: 120 });
  moon.shadow.bias = -0.0005;
  scene.add(moon);
  const lamp = {
    house: new THREE.PointLight(0xFFB768, 0, 24, 2),
    banya: new THREE.PointLight(0xFF9040, 0, 13, 2),
    chan: new THREE.PointLight(0xFFB060, 0, 10, 2)
  };
  lamp.house.position.set(2, 2.2, 6.5);
  lamp.banya.position.set(-6.2, 1.8, 12.5);
  lamp.chan.position.set(-15.6, 2.4, 13.4);
  scene.add(lamp.house, lamp.banya, lamp.chan);

  /* модель */
  const gltf = await new GLTFLoader().loadAsync('assets/models/site.glb?v=1');
  const mats = {};
  gltf.scene.traverse(o => {
    if (!o.isMesh) return;
    o.castShadow = o.receiveShadow = true;
    mats[o.material.name] = o.material;
  });
  // обшивка дома тёмно-зелёная, как на фото: ночью чуть светлее, чтобы цвет читался
  if (mats.G_Siding) mats.G_Siding.color.set('#35553F');
  if (mats.G_Water_Chan) { mats.G_Water_Chan.color.set('#143432'); mats.G_Water_Chan.emissive.set('#2F6B63'); }
  // деревья, которые на крупных планах закрывают баню и чан
  gltf.scene.traverse(o => { if (/^Tree(09|10|11|12)_/.test(o.name)) o.visible = false; });
  if (mats.G_Sail) { mats.G_Sail.side = THREE.DoubleSide; mats.G_Sail.needsUpdate = true; }
  scene.add(gltf.scene);
  const bounds = new THREE.Box3().setFromObject(gltf.scene), mid = bounds.getCenter(V(0, 0, 0));

  /* мягкий круг для пара, дыма и снега */
  const dot = document.createElement('canvas');
  dot.width = dot.height = 64;
  const dg = dot.getContext('2d'), grad = dg.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
  dg.fillStyle = grad; dg.fillRect(0, 0, 64, 64);
  const dotTex = new THREE.CanvasTexture(dot);
  dotTex.colorSpace = THREE.SRGBColorSpace;

  /* снег */
  const SN = mobile ? 280 : 700, snowPos = new Float32Array(SN * 3), snowV = new Float32Array(SN);
  for (let i = 0; i < SN; i++) {
    snowPos[i * 3] = mid.x + (Math.random() - 0.5) * 70;
    snowPos[i * 3 + 1] = Math.random() * 30;
    snowPos[i * 3 + 2] = mid.z + (Math.random() - 0.5) * 70;
    snowV[i] = 1.2 + Math.random() * 1.2;
  }
  const snowGeo = new THREE.BufferGeometry();
  snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
  const snow = new THREE.Points(snowGeo, new THREE.PointsMaterial({ size: 0.18, color: 0xffffff, map: dotTex, transparent: true, opacity: 0.8, depthWrite: false }));
  snow.frustumCulled = false;
  scene.add(snow);

  /* пар над чаном и дым из трубы бани */
  const puffs = (n, color, base, rise, s0, s1, peak, period, drift, weightOf) => Array.from({ length: n }, (_, i) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, color, transparent: true, depthWrite: false, opacity: 0 }));
    scene.add(sp);
    return { sp, i, n, base, rise, s0, s1, peak, period, drift, weightOf, jx: Math.sin(i * 12.9898) * 0.5, jz: Math.cos(i * 78.233) * 0.5 };
  });
  const steam = puffs(14, 0xE4F4F2, V(-15.6, 1.8, 13.4), 3.5, 0.6, 2.2, 0.35, 6, 0.3, p => (p > 0.92 ? 1 : bell(p, 0.92)));
  const smoke = puffs(8, 0x8FA3B5, V(-12.2, 4.9, 11.8), 4, 0.6, 2.4, 0.3, 7, 0.9, p => bell(p, 0.67));
  const puffAll = steam.concat(smoke);
  const puffStep = (time, p) => {
    for (const q of puffAll) {
      const u = (time / q.period + q.i / q.n) % 1, w = q.weightOf(p);
      q.sp.position.set(q.base.x + q.jx + q.drift * u * 2, q.base.y + q.rise * u, q.base.z + q.jz);
      q.sp.scale.setScalar(lerp(q.s0, q.s1, u));
      q.sp.material.opacity = (u < 0.3 ? u / 0.3 : (1 - u) / 0.7) * q.peak * w;
    }
  };

  /* камера */
  const keys = [
    { p: 0.22, pos: V(46, 40, 52), look: V(0, 1, 2) },
    { p: 0.42, pos: V(17, 17, 27), look: V(1, 2, 0.5) },
    { p: 0.67, pos: V(3, 13, 31), look: V(-10, 1.5, 12) },
    { p: 0.92, pos: V(-19, 9.5, 29), look: V(-15.2, 1.5, 13.2) }
  ];
  const tPos = V(0, 0, 0), tLook = V(0, 0, 0), look = V(0, 0, 0), tmp = V(0, 0, 0);
  function pose(p, time) {
    let a = keys[0], b = keys[0], u = 0;
    if (p >= keys[3].p) a = b = keys[3];
    else if (p > keys[0].p) {
      let i = 0;
      while (p >= keys[i + 1].p) i++;
      a = keys[i]; b = keys[i + 1]; u = smooth((p - a.p) / (b.p - a.p));
    }
    tPos.lerpVectors(a.pos, b.pos, u);
    tLook.lerpVectors(a.look, b.look, u);
    const amp = 1 - ramp(p, 0.18, 0.24);
    if (amp > 0) { // «дыхание» в паузе: азимут ±2°
      const ang = Math.sin(time * 6.2832 / 9) * 0.0349066 * amp, c = Math.cos(ang), s = Math.sin(ang);
      tmp.copy(tPos).sub(tLook);
      tPos.set(tLook.x + tmp.x * c + tmp.z * s, tPos.y, tLook.z - tmp.x * s + tmp.z * c);
    }
    // на широком экране сцена сдвинута вправо (см. resize), поэтому камера отходит дальше
    tPos.sub(tLook).multiplyScalar(camera.aspect < 1 ? 1.18 : 1.3).add(tLook);
  }

  /* свет и хотспоты по прогрессу */
  const anchors = [V(2, 7.2, -3), V(-10.4, 5, 12.5), V(-15.6, 3.4, 13.4)];
  function lights(p) {
    const h = ramp(p, 0.24, 0.40), b = ramp(p, 0.50, 0.64), c = ramp(p, 0.74, 0.90);
    if (mats.G_Glow_House) mats.G_Glow_House.emissiveIntensity = lerp(0.25, 3.2, h);
    if (mats.G_Glow_Banya) mats.G_Glow_Banya.emissiveIntensity = lerp(0.2, 3.0, b);
    if (mats.G_Water_Chan) mats.G_Water_Chan.emissiveIntensity = lerp(0.3, 1.1, c);
    lamp.house.intensity = 70 * h; lamp.banya.intensity = 36 * b; lamp.chan.intensity = 22 * c;
  }
  function markers(p) {
    const w = box.clientWidth, h = box.clientHeight, s = stageOf(p);
    camera.updateMatrixWorld();
    for (const el of hotspots) {
      const i = el.dataset.go - 1, q = tmp.copy(anchors[i]).project(camera);
      const o = q.z > 1 ? 0 : s === i + 1 ? 0 : p < 0.26 ? 1 : 0.55;
      el.style.transform = `translate(${((q.x * 0.5 + 0.5) * w).toFixed(1)}px,${((-q.y * 0.5 + 0.5) * h).toFixed(1)}px)`;
      el.style.opacity = o;
      el.style.visibility = o ? 'visible' : 'hidden';
    }
  }

  /* кадр */
  const st = window.ScrollTrigger && ScrollTrigger.getById('plot');
  let pTarget = st && st.animation ? st.animation.progress() : 0;
  let ready = false, first = true;

  function step(dt, time, snap) {
    const p = pTarget;
    pose(p, time);
    if (snap || first) { camera.position.copy(tPos); look.copy(tLook); scene.fog.color.copy(stageBg[stageOf(p)]); }
    else {
      camera.position.lerp(tPos, 0.08); look.lerp(tLook, 0.08);
      scene.fog.color.lerp(stageBg[stageOf(p)], 0.05);
    }
    camera.lookAt(look);
    lights(p);
    for (let i = 0; i < SN; i++) {
      const k = i * 3;
      snowPos[k] += 0.35 * dt;
      snowPos[k + 1] -= snowV[i] * dt;
      if (snowPos[k + 1] < 0) snowPos[k + 1] += 30;
      if (snowPos[k] > mid.x + 35) snowPos[k] -= 70;
    }
    snowGeo.attributes.position.needsUpdate = true;
    puffStep(time, p);
    markers(p);
  }
  const render = () => {
    renderer.render(scene, camera);
    if (first) { first = false; ready = true; box.dataset.ready = 'true'; }
  };

  function resize() {
    const w = box.clientWidth, h = box.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = camera.aspect < 1 ? 44 : 30;
    // десктоп: макет уходит в правые две трети, слева остаётся место под текст
    if (camera.aspect >= 1.2) camera.setViewOffset(w, h, -w * 0.17, h * 0.03, w, h); else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    if (ready) { step(0, performance.now() / 1000, true); render(); }
  }
  new ResizeObserver(resize).observe(box);
  resize();

  window.addEventListener('plot:progress', e => { pTarget = e.detail.p; });
  window.__plot = { setProgress(p) { pTarget = p; step(0, performance.now() / 1000, true); render(); } };

  /* первый кадр сразу: компиляция шейдеров и готовность постера до появления сцены */
  renderer.shadowMap.needsUpdate = true;
  step(0, performance.now() / 1000, true);
  render();

  /* цикл только пока сцена видна */
  let raf = 0, last = 0, inView = false;
  const frame = now => {
    raf = 0;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    step(dt, now / 1000, false);
    render();
    sync();
  };
  const sync = () => {
    const on = inView && !document.hidden;
    if (on && !raf) { last = 0; raf = requestAnimationFrame(frame); }
    else if (!on && raf) { cancelAnimationFrame(raf); raf = 0; }
  };
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; sync(); }).observe(box);
  document.addEventListener('visibilitychange', sync);
}
