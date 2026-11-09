// Karakter kartun chibi dari bentuk dasar (kepala besar, mata bulat, kacamata, hoodie) — dianimasikan secara prosedural.
import * as THREE from 'three';
import { part, toon } from './toon.js';

const S = (r, w = 24, h = 18) => new THREE.SphereGeometry(r, w, h);
const CAP = (r, l) => new THREE.CapsuleGeometry(r, l, 6, 14);

export function createCharacter(o) {
  const root = new THREE.Group();
  const body = new THREE.Group(); root.add(body);
  const W = 0.018;

  // ---------- kaki ----------
  const legs = [];
  for (const sx of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(0.085 * sx, 0.6, 0); body.add(hip);
    const leg = part(CAP(0.062, 0.36), o.legs, { w: W }); leg.position.y = -0.26; hip.add(leg);
    const shoe = new THREE.Group(); shoe.position.set(0, -0.53, 0.04); hip.add(shoe);
    const sole = part(new THREE.CapsuleGeometry(0.075, 0.1, 4, 12).rotateX(Math.PI / 2).scale(1, 0.75, 1), o.shoe, { w: W }); shoe.add(sole);
    if (o.shoeAccent) { const toe = part(S(0.05, 14, 10).scale(1.1, 0.7, 1), o.shoeAccent, { w: 0.012 }); toe.position.set(0, -0.005, 0.08); shoe.add(toe); }
    legs.push(hip);
  }

  // ---------- badan ----------
  const torso = new THREE.Group(); torso.position.y = 0.62; body.add(torso);
  if (o.dress) {
    const skirt = part(new THREE.CylinderGeometry(0.13, 0.31, 0.42, 28, 1, true), o.dress, { w: W, opts: { side: THREE.DoubleSide } });
    skirt.position.y = 0.05; torso.add(skirt);
    const top = part(CAP(0.14, 0.12), o.top, { w: W }); top.position.y = 0.3; torso.add(top);
    const belt = part(new THREE.TorusGeometry(0.135, 0.022, 8, 28).rotateX(Math.PI / 2), o.accent || '#ffffff', { w: 0.01 }); belt.position.y = 0.22; torso.add(belt);
  } else {
    const hoodie = part(CAP(0.17, 0.2), o.top, { w: W }); hoodie.position.y = 0.24; hoodie.scale.set(1, 1, 0.85); torso.add(hoodie);
    const shirt = part(new THREE.BoxGeometry(0.12, 0.22, 0.02), o.shirt || '#ffffff', { w: 0.008 }); shirt.position.set(0, 0.3, 0.145); torso.add(shirt);
    if (o.tie) {
      const tie = part(new THREE.BoxGeometry(0.045, 0.2, 0.02), o.tie, { w: 0.008 }); tie.position.set(0, 0.29, 0.16); torso.add(tie);
      const knot = part(S(0.028, 10, 8), o.tie, { w: 0.008 }); knot.position.set(0, 0.39, 0.16); torso.add(knot);
    }
    const hood = part(new THREE.TorusGeometry(0.12, 0.05, 10, 24).rotateX(Math.PI / 2.3), o.top, { w: W }); hood.position.set(0, 0.46, -0.04); torso.add(hood);
    if (o.belt) { const b = part(new THREE.CylinderGeometry(0.15, 0.15, 0.05, 24), o.belt, { w: 0.01 }); b.position.y = 0.04; torso.add(b); }
  }

  // ---------- lengan ----------
  const arms = [];
  for (const sx of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(0.2 * sx, 0.98, 0); body.add(sh);
    const arm = part(CAP(0.055, 0.26), o.sleeve || o.top, { w: W }); arm.position.y = -0.17; sh.add(arm);
    const hand = part(S(0.05, 14, 10), o.skin, { w: 0.012 }); hand.position.y = -0.36; sh.add(hand);
    sh.rotation.z = 0.12 * sx;
    arms.push(sh);
  }

  // ---------- kepala ----------
  const head = new THREE.Group(); head.position.y = 1.08; body.add(head);
  const neck = part(new THREE.CylinderGeometry(0.05, 0.06, 0.1, 12), o.skin, { w: 0 }); neck.position.y = 0.02; head.add(neck);
  const skull = part(S(0.3, 32, 24).scale(1, 0.95, 0.92), o.skin, { w: 0.022 }); skull.position.y = 0.3; head.add(skull);
  for (const sx of [-1, 1]) { const ear = part(S(0.06, 12, 10).scale(0.6, 1, 0.8), o.skin, { w: 0.012 }); ear.position.set(0.29 * sx, 0.29, -0.01); head.add(ear); }
  const face = new THREE.Group(); face.position.set(0, 0.3, 0); head.add(face);
  const eyes = [];
  for (const sx of [-1, 1]) {
    const eye = new THREE.Group(); eye.position.set(0.1 * sx, 0.02, 0.255); face.add(eye);
    const white = new THREE.Mesh(S(0.062, 18, 14).scale(0.85, 1.05, 0.4), toon('#ffffff')); eye.add(white);
    const pupil = new THREE.Mesh(S(0.034, 14, 10).scale(1, 1.15, 0.5), toon('#24161a')); pupil.position.set(0.004 * sx, -0.004, 0.022); eye.add(pupil);
    const shine = new THREE.Mesh(S(0.011, 8, 6), toon('#ffffff', { emissive: '#ffffff', ei: 1 })); shine.position.set(0.012, 0.016, 0.038); eye.add(shine);
    eyes.push(eye);
    if (o.lashes) { const lash = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.009, 6, 16, Math.PI * 0.8), toon('#24161a')); lash.rotation.z = Math.PI * 0.1; lash.position.set(0, 0.006, 0.02); eye.add(lash); }
    const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.011, 0.06, 3, 6).rotateZ(Math.PI / 2), toon(o.hair)); brow.position.set(0.1 * sx, 0.11, 0.262); brow.rotation.z = -0.15 * sx; face.add(brow);
  }
  if (o.blush !== false) for (const sx of [-1, 1]) {
    const b = new THREE.Mesh(S(0.04, 12, 8).scale(1.3, 0.6, 0.3), new THREE.MeshBasicMaterial({ color: '#ff8fa3', transparent: true, opacity: 0.55, depthWrite: false }));
    b.position.set(0.17 * sx, -0.07, 0.235); face.add(b);
  }
  const nose = part(S(0.026, 10, 8), o.skin, { w: 0.008 }); nose.position.set(0, -0.03, 0.275); face.add(nose);
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.009, 6, 16, Math.PI), toon('#7a2b33')); mouth.rotation.z = Math.PI; mouth.position.set(0, -0.1, 0.262); face.add(mouth);
  if (o.glasses) {
    const gm = toon(o.glasses);
    for (const sx of [-1, 1]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.016, 8, 24), gm); ring.scale.set(1.05, 0.9, 1); ring.position.set(0.105 * sx, 0.02, 0.29); face.add(ring); }
    const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.05, 6).rotateZ(Math.PI / 2), gm); bridge.position.set(0, 0.035, 0.3); face.add(bridge);
    for (const sx of [-1, 1]) { const arm = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.015, 0.22), gm); arm.position.set(0.25 * sx, 0.04, 0.17); arm.rotation.y = 0.12 * sx; face.add(arm); }
  }

  // ---------- rambut ----------
  const hair = new THREE.Group(); hair.position.y = 0.3; head.add(hair);
  const cap = part(new THREE.SphereGeometry(0.318, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.56), o.hair, { w: 0.02 });
  cap.rotation.x = -0.32; cap.position.set(0, 0.015, -0.02); hair.add(cap);
  if (o.hairStyle === 'messy') {
    const tufts = [[0, 0.3, 0.12, -0.5, 0, 0.13], [-0.12, 0.29, 0.06, -0.3, 0.5, 0.11], [0.13, 0.28, 0.05, -0.3, -0.5, 0.11], [0.04, 0.32, -0.06, 0.2, -0.2, 0.12],
      [-0.06, 0.24, 0.2, -1.1, 0.2, 0.09], [0.1, 0.22, 0.2, -1.0, -0.4, 0.09], [-0.2, 0.16, 0.16, -0.9, 0.9, 0.08], [0.21, 0.15, 0.15, -0.9, -0.9, 0.08]];
    for (const [x, y, z, rx, rz, s] of tufts) {
      const t = part(new THREE.ConeGeometry(s * 0.7, s * 2.2, 10), o.hair, { w: 0.014 }); t.position.set(x, y, z); t.rotation.set(rx, 0, rz); hair.add(t);
    }
    for (const sx of [-1, 1]) { const side = part(S(0.09, 14, 10).scale(0.55, 1.2, 1), o.hair, { w: 0.012 }); side.position.set(0.27 * sx, 0.04, 0.06); hair.add(side); }
  } else if (o.hairStyle === 'long') {
    const back = part(CAP(0.24, 0.28).scale(1.05, 1, 0.55), o.hair, { w: 0.02 }); back.position.set(0, -0.2, -0.13); hair.add(back);
    for (const sx of [-1, 1]) {
      const lock = part(CAP(0.07, 0.36), o.hair, { w: 0.014 }); lock.position.set(0.25 * sx, -0.16, 0.06); lock.rotation.z = -0.08 * sx; hair.add(lock);
    }
    const bangs = part(new THREE.SphereGeometry(0.31, 28, 12, -Math.PI * 0.32, Math.PI * 0.64, Math.PI * 0.18, Math.PI * 0.2), o.hair, { w: 0.012, opts: { side: THREE.DoubleSide } });
    bangs.position.set(0, 0.0, 0.03); hair.add(bangs);
    if (o.clip) {
      const flower = new THREE.Group(); flower.position.set(0.2, 0.18, 0.18); hair.add(flower);
      for (let i = 0; i < 5; i++) { const p = part(S(0.035, 10, 8), o.clip, { w: 0.008 }); const a = (i / 5) * Math.PI * 2; p.position.set(Math.cos(a) * 0.04, Math.sin(a) * 0.04, 0); flower.add(p); }
      flower.add(part(S(0.03, 10, 8), '#ffd85e', { w: 0.008 }));
    }
  }

  root.traverse((m) => { if (m.isMesh && !m.userData.isOutline) m.castShadow = true; });

  // ---------- animasi ----------
  const st = { phase: 0, speed: 0, blink: 2 + Math.random() * 2, t: Math.random() * 10, talk: false, pose: null, poseK: 0, look: 0, jump: 0 };
  const POSES = {
    kneel: { hipL: -1.45, hipR: 0.15, lean: 0.12, armL: -1.2, armR: -1.2, bodyY: -0.26 },
    sit: { hipL: -1.5, hipR: -1.5, lean: -0.05, armL: -0.3, armR: -0.3, bodyY: -0.2 },
    cheer: { hipL: 0, hipR: 0, lean: 0, armL: -2.7, armR: -2.7, bodyY: 0 },
    hands: { hipL: 0, hipR: 0, lean: 0.05, armL: -0.9, armR: -0.9, bodyY: 0 },
  };
  let poseDef = POSES.hands;

  return {
    root, head,
    get position() { return root.position; },
    setPose(name) { st.pose = name; if (name) poseDef = POSES[name]; },
    talk(on) { st.talk = on; },
    hop() { st.jump = 1; },
    update(dt, speed = 0) {
      st.t += dt; st.speed += (speed - st.speed) * Math.min(1, dt * 10);
      const sp = st.speed, moving = Math.min(1, sp / 1.2);
      st.phase += dt * (4 + sp * 3.4) * (sp > 0.05 ? 1 : 0);
      st.poseK += ((st.pose ? 1 : 0) - st.poseK) * Math.min(1, dt * 6);
      const pk = st.poseK, P = poseDef;
      const s = Math.sin(st.phase), swing = 0.75 * moving * (1 - pk);
      legs[0].rotation.x = s * swing + (P.hipL ?? 0) * pk;
      legs[1].rotation.x = -s * swing + (P.hipR ?? 0) * pk;
      // lutut ditekuk saat berlutut/duduk (shoe ikut turun via rotasi kaki)
      arms[0].rotation.x = -s * swing * 0.9 + (P.armL ?? 0) * pk;
      arms[1].rotation.x = s * swing * 0.9 + (P.armR ?? 0) * pk;
      arms[0].rotation.z = -0.12 - 0.06 * moving - (st.pose === 'cheer' ? 0.35 * pk : 0);
      arms[1].rotation.z = 0.12 + 0.06 * moving + (st.pose === 'cheer' ? 0.35 * pk : 0);
      const breathe = Math.sin(st.t * 2.2) * 0.012 * (1 - moving);
      if (st.jump > 0) st.jump = Math.max(0, st.jump - dt * 2.2);
      const hopY = Math.sin(st.jump * Math.PI) * 0.35;
      body.position.y = Math.abs(Math.cos(st.phase)) * 0.06 * moving + breathe + (P.bodyY ?? 0) * pk + hopY;
      body.rotation.x = 0.09 * moving + (P.lean ?? 0) * pk;
      torso.scale.set(1 + breathe * 0.8, 1 + breathe, 1);
      head.rotation.z = Math.sin(st.t * 1.3) * 0.04 * (1 - moving) + Math.sin(st.phase) * 0.03 * moving;
      head.rotation.x = st.talk ? Math.sin(st.t * 9) * 0.06 : Math.sin(st.t * 0.9) * 0.03;
      mouth.scale.y = st.talk ? 0.6 + Math.abs(Math.sin(st.t * 14)) * 1.4 : 1;
      // berkedip
      st.blink -= dt;
      const bl = st.blink < 0.12 ? 0.1 : 1;
      if (st.blink < 0) st.blink = 2 + Math.random() * 3;
      for (const e of eyes) e.scale.y = bl;
    },
  };
}

// pakaian siap pakai untuk dua tokoh contoh
export const LOOKS = {
  cowok: { skin: '#f6c9a3', hair: '#7a4421', hairStyle: 'messy', top: '#2fa9a8', sleeve: '#2a4f9e', shirt: '#ffffff', tie: '#f08a1c', legs: '#5b3424', shoe: '#ffffff', shoeAccent: '#e8423f', belt: '#4a2a1a', glasses: '#1d1416' },
  cewek: { skin: '#f9d2b6', hair: '#3b2222', hairStyle: 'long', top: '#ffffff', dress: '#f47aa0', accent: '#ffffff', legs: '#f9d2b6', shoe: '#ff6b8f', lashes: true, clip: '#ffffff' },
  tamu: (i) => {
    const tops = ['#6cc3ff', '#ffb347', '#9b8cff', '#7bd389', '#ff8fab', '#f7d154', '#5fc4b8'];
    const hairs = ['#2b1b14', '#6b3a1e', '#1d1d1d', '#a0522d', '#4b2e1e'];
    const skins = ['#f6c9a3', '#e8b48f', '#c98d66', '#f9d2b6'];
    const girl = i % 2 === 1;
    return girl
      ? { skin: skins[i % 4], hair: hairs[(i + 2) % 5], hairStyle: 'long', top: '#ffffff', dress: tops[i % 7], legs: skins[i % 4], shoe: '#4a2a2a', lashes: true }
      : { skin: skins[(i + 1) % 4], hair: hairs[i % 5], hairStyle: 'messy', top: tops[(i + 3) % 7], legs: '#3d3d55', shoe: '#2a2a2a', glasses: i % 3 === 0 ? '#1d1416' : null };
  },
};
