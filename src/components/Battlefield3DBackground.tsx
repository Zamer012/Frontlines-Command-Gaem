import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

interface Battlefield3DBackgroundProps {
  className?: string;
  isPaused?: boolean;
  activeSkinId?: string;
}

export const Battlefield3DBackground: React.FC<Battlefield3DBackgroundProps> = ({
  className = '',
  isPaused = false,
  activeSkinId = 'skin_default',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let animId = 0;
    let timerId = 0;
    let isDisposed = false;

    // Detect software WebGL to adapt performance gracefully
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene & Camera setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070c10);
    scene.fog = new THREE.FogExp2(0x070c10, 0.022);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.5, 200);
    camera.position.set(-18, 11, 24);
    camera.lookAt(0, 1.5, 0);

    // 2. Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 3. Studio Environment Reflection
    try {
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();
    } catch {
      // fallback
    }

    // 4. Lighting Rig (Warm key, cool fill, dramatic rim)
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x1e293b, 0.7);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfff1cf, 2.2);
    dirLight.position.set(15, 25, 12);
    if (!isSoftwareGl) {
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
      dirLight.shadow.camera.near = 0.5;
      dirLight.shadow.camera.far = 80;
      const d = 25;
      dirLight.shadow.camera.left = -d;
      dirLight.shadow.camera.right = d;
      dirLight.shadow.camera.top = d;
      dirLight.shadow.camera.bottom = -d;
      dirLight.shadow.bias = -0.0005;
      dirLight.shadow.normalBias = 0.02;
    }
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x06b6d4, 1.4);
    rimLight.position.set(-20, 8, -15);
    scene.add(rimLight);

    const redRimLight = new THREE.DirectionalLight(0xef4444, 1.8);
    redRimLight.position.set(20, 10, -10);
    scene.add(redRimLight);

    // 5. Procedural Battlefield Terrain (Mud, Craters, Trenches)
    const groundGeo = new THREE.PlaneGeometry(80, 80, 48, 48);
    groundGeo.rotateX(-Math.PI / 2);
    const pos = groundGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      // Create subtle rolling crater variations
      let y = Math.sin(x * 0.15) * Math.cos(z * 0.15) * 0.6;
      // Trench depression along middle
      const trenchDist = Math.abs(x - 0.5);
      if (trenchDist < 3) {
        y -= (1 - trenchDist / 3) * 0.9;
      }
      pos.setY(i, y);
    }
    groundGeo.computeVertexNormals();

    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1a2126,
      roughness: 0.9,
      metalness: 0.1,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.receiveShadow = !isSoftwareGl;
    scene.add(groundMesh);

    // Decorative Dragon's Teeth (Concrete tank barricades)
    const toothGeo = new THREE.ConeGeometry(0.7, 1.2, 4);
    const toothMat = new THREE.MeshStandardMaterial({
      color: 0x2e3840,
      roughness: 0.85,
      metalness: 0.15,
    });
    const teethGroup = new THREE.Group();
    for (let i = -10; i <= 10; i += 2.2) {
      const tooth = new THREE.Mesh(toothGeo, toothMat);
      tooth.position.set(i + (Math.random() - 0.5) * 0.4, 0.6, (Math.random() - 0.5) * 2);
      tooth.rotation.y = Math.random() * Math.PI;
      tooth.castShadow = !isSoftwareGl;
      teethGroup.add(tooth);
    }
    scene.add(teethGroup);

    // 6. BUILD PROCEDURAL 3D COMBAT UNITS (Composite 3-12 parts)
    let playerArmorColor = 0x1e3a5f;
    let playerAccentColor = 0x38bdf8;
    let playerUniformColor = 0x224466;

    if (activeSkinId === 'skin_neko') {
      playerArmorColor = 0xf472b6;
      playerAccentColor = 0xec4899;
      playerUniformColor = 0xf472b6;
    } else if (activeSkinId === 'skin_desert') {
      playerArmorColor = 0xc29a6d;
      playerAccentColor = 0xf59e0b;
      playerUniformColor = 0x8c6841;
    } else if (activeSkinId === 'skin_arctic') {
      playerArmorColor = 0xe2e8f0;
      playerAccentColor = 0x7dd3fc;
      playerUniformColor = 0xcbd5e1;
    } else if (activeSkinId === 'skin_stealth') {
      playerArmorColor = 0x16191c;
      playerAccentColor = 0xef4444;
      playerUniformColor = 0x0d0f11;
    } else if (activeSkinId === 'skin_cyber') {
      playerArmorColor = 0x0f172a;
      playerAccentColor = 0x22d3ee;
      playerUniformColor = 0x1e293b;
    } else if (activeSkinId === 'skin_ww2_germany') {
      playerArmorColor = 0x434c56;
      playerAccentColor = 0xcbd5e1;
      playerUniformColor = 0x3f474f;
    } else if (activeSkinId === 'skin_ww2_britain') {
      playerArmorColor = 0x3d4a36;
      playerAccentColor = 0xeab308;
      playerUniformColor = 0x524b33;
    } else if (activeSkinId === 'skin_modern_usa') {
      playerArmorColor = 0x8c7b57;
      playerAccentColor = 0x38bdf8;
      playerUniformColor = 0x615438;
    } else if (activeSkinId === 'skin_girls_und_panzer') {
      playerArmorColor = 0x545c49;
      playerAccentColor = 0xfb7185;
      playerUniformColor = 0xffffff;
    } else if (activeSkinId === 'skin_toy_soldiers') {
      playerArmorColor = 0x16a34a;
      playerAccentColor = 0x4ade80;
      playerUniformColor = 0x15803d;
    } else if (activeSkinId === 'skin_napoleonic_france') {
      playerArmorColor = 0x1e3a8a;
      playerAccentColor = 0x3b82f6;
      playerUniformColor = 0x1e3a8a;
    } else if (activeSkinId === 'skin_napoleonic_britain') {
      playerArmorColor = 0xdc2626;
      playerAccentColor = 0xef4444;
      playerUniformColor = 0xdc2626;
    } else if (activeSkinId === 'skin_imperial_japan') {
      playerArmorColor = 0x655e42;
      playerAccentColor = 0xeab308;
      playerUniformColor = 0x4d462f;
    }

    // Common shared materials
    const blueArmorMat = new THREE.MeshStandardMaterial({
      color: playerArmorColor,
      roughness: activeSkinId === 'skin_toy_soldiers' ? 0.2 : 0.45,
      metalness: activeSkinId === 'skin_toy_soldiers' ? 0.1 : 0.65,
    });
    const blueAccentMat = new THREE.MeshStandardMaterial({
      color: playerAccentColor,
      roughness: 0.3,
      metalness: 0.8,
      emissive: playerAccentColor,
      emissiveIntensity: 0.4,
    });

    const redArmorMat = new THREE.MeshStandardMaterial({
      color: 0x4a1d24,
      roughness: 0.45,
      metalness: 0.65,
    });
    const redAccentMat = new THREE.MeshStandardMaterial({
      color: 0xf87171,
      roughness: 0.3,
      metalness: 0.8,
      emissive: 0xdc2626,
      emissiveIntensity: 0.4,
    });

    const treadMat = new THREE.MeshStandardMaterial({
      color: 0x111619,
      roughness: 0.9,
      metalness: 0.3,
    });
    const metalGunMat = new THREE.MeshStandardMaterial({
      color: 0x182025,
      roughness: 0.35,
      metalness: 0.85,
    });

    // Helper: Create a 3D Battle Tank
    const createTank = (isBlue: boolean): THREE.Group => {
      const tank = new THREE.Group();
      const armorMat = isBlue ? blueArmorMat : redArmorMat;
      const accentMat = isBlue ? blueAccentMat : redAccentMat;

      // 1. Tracks (Left & Right)
      const leftTread = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.8, 4.2), treadMat);
      leftTread.position.set(-1.4, 0.4, 0);
      leftTread.castShadow = !isSoftwareGl;
      tank.add(leftTread);

      const rightTread = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.8, 4.2), treadMat);
      rightTread.position.set(1.4, 0.4, 0);
      rightTread.castShadow = !isSoftwareGl;
      tank.add(rightTread);

      // Road wheels detail
      for (let w = -1.6; w <= 1.6; w += 0.8) {
        const wheelL = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.2, 12), metalGunMat);
        wheelL.rotation.z = Math.PI / 2;
        wheelL.position.set(-1.9, 0.4, w);
        tank.add(wheelL);

        const wheelR = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.2, 12), metalGunMat);
        wheelR.rotation.z = Math.PI / 2;
        wheelR.position.set(1.9, 0.4, w);
        tank.add(wheelR);
      }

      // 2. Main Hull Body
      const hull = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 3.8), armorMat);
      hull.position.set(0, 0.75, 0);
      hull.castShadow = !isSoftwareGl;
      tank.add(hull);

      // Front sloped armor glacis
      const glacis = new THREE.Mesh(new THREE.BoxGeometry(2.38, 0.4, 1.2), armorMat);
      glacis.position.set(0, 0.85, 1.8);
      glacis.rotation.x = -Math.PI / 6;
      tank.add(glacis);

      // 3. Rotating Turret
      const turretGroup = new THREE.Group();
      turretGroup.position.set(0, 1.35, -0.2);

      const turret = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.75, 2.2), armorMat);
      turret.castShadow = !isSoftwareGl;
      turretGroup.add(turret);

      // Commander Hatch
      const hatch = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.25, 12), accentMat);
      hatch.position.set(0.45, 0.45, -0.3);
      turretGroup.add(hatch);

      // Antenna
      const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.4, 6), metalGunMat);
      antenna.position.set(-0.6, 0.9, -0.6);
      turretGroup.add(antenna);

      // 4. Main Cannon Barrel with Muzzle Brake
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 3.4, 12), metalGunMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.1, 1.8);
      barrel.castShadow = !isSoftwareGl;
      turretGroup.add(barrel);

      const muzzleBrake = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.5, 12), accentMat);
      muzzleBrake.rotation.x = Math.PI / 2;
      muzzleBrake.position.set(0, 0.1, 3.5);
      turretGroup.add(muzzleBrake);

      tank.add(turretGroup);
      tank.userData = { turret: turretGroup, isBlue };
      return tank;
    };

    // Helper: Create a 3D Soldier
    const createSoldier = (isBlue: boolean): THREE.Group => {
      const soldier = new THREE.Group();
      const uniformColor = isBlue ? playerUniformColor : 0x66222b;
      const uniformMat = new THREE.MeshStandardMaterial({ color: uniformColor, roughness: 0.8 });
      const skinMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.7 });
      const gearMat = new THREE.MeshStandardMaterial({ color: 0x1f2421, roughness: 0.9 });
      const helmetMat = isBlue ? blueAccentMat : redAccentMat;

      // Legs
      const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.8), uniformMat);
      leftLeg.position.set(-0.2, 0.4, 0);
      soldier.add(leftLeg);

      const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.8), uniformMat);
      rightLeg.position.set(0.2, 0.4, 0);
      soldier.add(rightLeg);

      // Torso
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.75, 0.35), uniformMat);
      torso.position.set(0, 1.15, 0);
      soldier.add(torso);

      // Backpack
      const pack = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.25), gearMat);
      pack.position.set(0, 1.15, -0.25);
      soldier.add(pack);

      // Head & Helmet
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), skinMat);
      head.position.set(0, 1.7, 0);
      soldier.add(head);

      const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), helmetMat);
      helmet.position.set(0, 1.75, 0);
      soldier.add(helmet);

      // Rifle
      const rifle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 1.1), metalGunMat);
      rifle.position.set(0.25, 1.25, 0.45);
      rifle.rotation.x = -Math.PI / 12;
      soldier.add(rifle);

      return soldier;
    };

    // Helper: Create a 3D Heavy Walker Mech
    const createMech = (isBlue: boolean): THREE.Group => {
      const mech = new THREE.Group();
      const armorMat = isBlue ? blueArmorMat : redArmorMat;
      const accentMat = isBlue ? blueAccentMat : redAccentMat;

      // 2 Articulated Legs
      for (const side of [-1, 1]) {
        const hip = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), metalGunMat);
        hip.position.set(side * 1.5, 2.2, 0);
        mech.add(hip);

        const upperLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.8), armorMat);
        upperLeg.position.set(side * 1.5, 1.4, -0.2);
        upperLeg.rotation.x = Math.PI / 8;
        mech.add(upperLeg);

        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, 1.4), treadMat);
        foot.position.set(side * 1.5, 0.15, 0.2);
        mech.add(foot);
      }

      // Torso Chassis
      const torso = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.6, 2.2), armorMat);
      torso.position.set(0, 3.1, 0);
      mech.add(torso);

      // Glowing Visor
      const visor = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.35, 0.2), accentMat);
      visor.position.set(0, 3.2, 1.15);
      mech.add(visor);

      // Twin Cannons
      for (const side of [-1, 1]) {
        const gun = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 3.2, 10), metalGunMat);
        gun.rotation.x = Math.PI / 2;
        gun.position.set(side * 1.5, 3.0, 1.4);
        mech.add(gun);
      }

      return mech;
    };

    // Helper: Create an Attack Gunship
    const createGunship = (isBlue: boolean): THREE.Group => {
      const gunship = new THREE.Group();
      const armorMat = isBlue ? blueArmorMat : redArmorMat;
      const accentMat = isBlue ? blueAccentMat : redAccentMat;

      // Fuselage
      const body = new THREE.Mesh(new THREE.ConeGeometry(0.9, 4.5, 8), armorMat);
      body.rotation.x = -Math.PI / 2;
      body.position.set(0, 0, 0);
      gunship.add(body);

      // Cockpit Canopy
      const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 10), accentMat);
      canopy.scale.set(1, 0.8, 1.8);
      canopy.position.set(0, 0.35, 1.0);
      gunship.add(canopy);

      // Wing pylons
      const wings = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.15, 0.8), armorMat);
      wings.position.set(0, 0, 0.2);
      gunship.add(wings);

      // Rotor Mast & Spinning Blades
      const rotorGroup = new THREE.Group();
      rotorGroup.position.set(0, 0.9, 0.4);
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.4), metalGunMat);
      rotorGroup.add(mast);

      const blades = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.05, 0.3), metalGunMat);
      blades.position.set(0, 0.2, 0);
      rotorGroup.add(blades);

      gunship.add(rotorGroup);
      gunship.userData = { rotor: blades };
      return gunship;
    };

    // Place Blue Vanguard Battlegroup (West flank, advancing East)
    const blueTank = createTank(true);
    blueTank.position.set(-8, 0, 3);
    blueTank.rotation.y = Math.PI / 2 - 0.2;
    scene.add(blueTank);

    const blueMech = createMech(true);
    blueMech.position.set(-11, 0, -4);
    blueMech.rotation.y = Math.PI / 2 - 0.1;
    scene.add(blueMech);

    const blueGunship = createGunship(true);
    blueGunship.position.set(-13, 6.5, 0);
    blueGunship.rotation.y = Math.PI / 2 - 0.3;
    blueGunship.rotation.z = -0.15;
    scene.add(blueGunship);

    for (let i = 0; i < 4; i++) {
      const soldier = createSoldier(true);
      soldier.position.set(-5 + Math.random() * 2, 0, -2 + i * 2.2);
      soldier.rotation.y = Math.PI / 2 + (Math.random() - 0.5) * 0.4;
      scene.add(soldier);
    }

    // Place Red Ironclad Battlegroup (East flank, defending/firing West)
    const redTank = createTank(false);
    redTank.position.set(8, 0, -2);
    redTank.rotation.y = -Math.PI / 2 + 0.15;
    scene.add(redTank);

    const redTank2 = createTank(false);
    redTank2.position.set(11, 0, 4);
    redTank2.rotation.y = -Math.PI / 2 - 0.25;
    scene.add(redTank2);

    for (let i = 0; i < 4; i++) {
      const soldier = createSoldier(false);
      soldier.position.set(5 + Math.random() * 2, 0, -3 + i * 2.5);
      soldier.rotation.y = -Math.PI / 2 + (Math.random() - 0.5) * 0.4;
      scene.add(soldier);
    }

    // 7. Dynamic Projectile Particles, Muzzle Flashes & Tracers
    const tracerCount = 12;
    const tracers: Array<{
      mesh: THREE.Mesh;
      start: THREE.Vector3;
      end: THREE.Vector3;
      progress: number;
      speed: number;
      isBlue: boolean;
    }> = [];

    const blueTracerMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const redTracerMat = new THREE.MeshBasicMaterial({ color: 0xf87171 });
    const tracerGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.4, 6);
    tracerGeo.rotateX(Math.PI / 2);

    for (let i = 0; i < tracerCount; i++) {
      const isBlue = i % 2 === 0;
      const mesh = new THREE.Mesh(tracerGeo, isBlue ? blueTracerMat : redTracerMat);
      const start = isBlue
        ? new THREE.Vector3(-8 + Math.random() * 4, 1.2 + Math.random() * 2, -2 + Math.random() * 6)
        : new THREE.Vector3(8 - Math.random() * 4, 1.2 + Math.random() * 2, -3 + Math.random() * 6);
      const end = isBlue
        ? new THREE.Vector3(7 + Math.random() * 4, 0.5 + Math.random() * 1.5, -2 + Math.random() * 6)
        : new THREE.Vector3(-7 - Math.random() * 4, 0.5 + Math.random() * 1.5, -2 + Math.random() * 6);

      mesh.position.copy(start);
      mesh.lookAt(end);
      scene.add(mesh);

      tracers.push({
        mesh,
        start,
        end,
        progress: Math.random(),
        speed: 0.015 + Math.random() * 0.02,
        isBlue,
      });
    }

    // Particle Sparks & Smoke
    const sparkCount = 60;
    const sparkGeo = new THREE.BufferGeometry();
    const sparkPos = new Float32Array(sparkCount * 3);
    const sparkVels: Array<THREE.Vector3> = [];

    for (let i = 0; i < sparkCount; i++) {
      sparkPos[i * 3] = (Math.random() - 0.5) * 16;
      sparkPos[i * 3 + 1] = Math.random() * 3;
      sparkPos[i * 3 + 2] = (Math.random() - 0.5) * 14;
      sparkVels.push(
        new THREE.Vector3((Math.random() - 0.5) * 0.04, 0.02 + Math.random() * 0.04, (Math.random() - 0.5) * 0.04)
      );
    }
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
    const sparkMat = new THREE.PointsMaterial({
      color: 0xfbbf24,
      size: 0.25,
      transparent: true,
      opacity: 0.85,
    });
    const sparkPoints = new THREE.Points(sparkGeo, sparkMat);
    scene.add(sparkPoints);

    // 8. Animation & Render Loop with Software-WebGL Guard
    let clock = new THREE.Clock();

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (isDisposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          timerId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          timerId = window.setTimeout(cb, 80);
        }
      };
      timerId = window.setTimeout(poll, 5);
    };

    const animate = () => {
      if (isDisposed) return;
      const dt = clock.getDelta();
      const time = clock.getElapsedTime();

      if (!isPaused) {
        // Slow cinematic camera orbit around center conflict
        const camAngle = time * 0.08 - 0.7;
        const camDist = 26;
        camera.position.x = Math.sin(camAngle) * camDist;
        camera.position.z = Math.cos(camAngle) * camDist + 4;
        camera.position.y = 11 + Math.sin(time * 0.2) * 1.5;
        camera.lookAt(0, 1.8, 0);

        // Animate Gunship rotor and hover bob
        if (blueGunship.userData.rotor) {
          blueGunship.userData.rotor.rotation.y += 0.45;
          blueGunship.position.y = 6.5 + Math.sin(time * 2.5) * 0.35;
        }

        // Slight tank turret tracking
        if (blueTank.userData.turret) {
          blueTank.userData.turret.rotation.y = Math.sin(time * 0.8) * 0.2;
        }
        if (redTank.userData.turret) {
          redTank.userData.turret.rotation.y = Math.sin(time * 0.7 + 1) * 0.2;
        }

        // Animate Tracers
        tracers.forEach((t) => {
          t.progress += t.speed;
          if (t.progress >= 1) {
            t.progress = 0;
            // Retarget slightly
            t.start.y = 1.0 + Math.random() * 1.5;
            t.end.y = 0.5 + Math.random() * 1.5;
          }
          t.mesh.position.lerpVectors(t.start, t.end, t.progress);
          t.mesh.lookAt(t.end);
        });

        // Animate Sparks
        const posAttr = sparkGeo.attributes.position;
        for (let i = 0; i < sparkCount; i++) {
          let py = posAttr.getY(i) + sparkVels[i].y;
          let px = posAttr.getX(i) + sparkVels[i].x;
          let pz = posAttr.getZ(i) + sparkVels[i].z;

          if (py > 6) {
            py = 0.2;
            px = (Math.random() - 0.5) * 16;
            pz = (Math.random() - 0.5) * 14;
          }
          posAttr.setXYZ(i, px, py, pz);
        }
        posAttr.needsUpdate = true;
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(animate);
      } else {
        animId = requestAnimationFrame(animate);
      }
    };

    // Pre-warm shaders
    if (!isSoftwareGl) {
      try {
        renderer.compile(scene, camera);
      } catch {
        // ignore
      }
    }

    animate();

    // Resize handler
    const handleResize = () => {
      if (!container || isDisposed) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animId);
      clearTimeout(timerId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      groundGeo.dispose();
      groundMat.dispose();
      toothGeo.dispose();
      toothMat.dispose();
      blueArmorMat.dispose();
      blueAccentMat.dispose();
      redArmorMat.dispose();
      redAccentMat.dispose();
      treadMat.dispose();
      metalGunMat.dispose();
      sparkGeo.dispose();
      sparkMat.dispose();
      tracerGeo.dispose();
      blueTracerMat.dispose();
      redTracerMat.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isPaused, activeSkinId]);

  return (
    <div
      ref={mountRef}
      className={`absolute inset-0 w-full h-full overflow-hidden pointer-events-none ${className}`}
      data-testid="battlefield-3d-background"
    />
  );
};
