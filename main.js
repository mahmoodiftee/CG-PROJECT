import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const createRenderer = (rendererSettings) => {
  const defaultRendererSettings = {
    antialias: true,
    alpha: true
  };

  const { antialias, alpha } = {
    ...defaultRendererSettings,
    ...rendererSettings
  };

  const renderer = new THREE.WebGLRenderer({ antialias, alpha });
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  return renderer;
};

const createScene = (color) => {
  const scene = new THREE.Scene();

  scene.background = new THREE.Color(color);

  return scene;
};

const createCamera = (cameraSettings) => {
  let defaultSettings = {
    fov: 50,
    aspect: window.innerWidth / window.innerHeight,
    near: 0.1,
    far: 1000,
    position: { x: 0, y: 0, z: 35 }
  };

  const { fov, aspect, near, far, position } = {
    ...defaultSettings,
    ...cameraSettings
  };

  const camera = new THREE.PerspectiveCamera(
    fov, // fov = Field of View
    aspect, // aspect ratio
    near, // near clipping plane
    far // far clipping plane
  );

  // Move the camera back so we can view the scene
  camera.position.set(position.x, position.y, position.z);

  return camera;
};

const createLights = () => {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(10, 10, 10);

  return { ambientLight, directionalLight };
};

const createControls = (camera, canvas, controlSettings) => {
  const defaultControlSettings = {
    enabled: true,
    enableDamping: true,
    autoRotate: false,
    enablePan: true,
    enableZoom: true
  };

  const { enableDamping, autoRotate, enabled, enablePan } = {
    ...defaultControlSettings,
    ...controlSettings
  };

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = enableDamping;
  controls.autoRotate = autoRotate;
  controls.enabled = enabled;
  controls.enablePan = enablePan;
  controls.update();

  return {
    orbitControls: controls,
    tick: () => {
      controls.update();
    }
  };
};

const createHelicopter = () => {
  const helicopter = new THREE.Group();

  // Helicopter body
  const bodyGeometry = new THREE.CylinderGeometry(2, 2, 10, 32);
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x00ff00,
    map: new THREE.TextureLoader().load('https://i.ibb.co/HY3jVpf/6627691.jpg')
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.rotation.z = Math.PI / 2; // Rotate body to horizontal position
  helicopter.add(body);

  // Helicopter tail
  const tailGeometry = new THREE.CylinderGeometry(0.5, 0.5, 7, 32);
  const tailMaterial = new THREE.MeshStandardMaterial({
    color: 0x00ff00,
    map: new THREE.TextureLoader().load('https://i.ibb.co/HY3jVpf/6627691.jpg')
  });
  const tail = new THREE.Mesh(tailGeometry, tailMaterial);
  tail.position.set(-8, 0, 0); // Position the tail at the end of the body
  helicopter.add(tail);

  // Helicopter main rotor
  const rotorGeometry = new THREE.BoxGeometry(0.2, 15, 1);
  const rotorMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
  const rotor = new THREE.Mesh(rotorGeometry, rotorMaterial);
  rotor.position.set(0, 0, 2.5); // Position rotor on top of the body
  helicopter.add(rotor);

  const radiansPerSecond = THREE.MathUtils.degToRad(180);
  return {
    helicopter: helicopter,
    tick: (delta) => {
      rotor.rotation.z += radiansPerSecond * delta;
    }
  };
};

class World {
  constructor(container) {
    this.scene = createScene('#030712');
    this.camera = createCamera();
    this.renderer = createRenderer();
    this.helicopter = createHelicopter();
    this.lights = createLights();

    this.scene.add(
      this.lights.ambientLight,
      this.lights.directionalLight,
      this.helicopter.helicopter
    );

    this.controls = createControls(this.camera, this.renderer.domElement);
    this.loop = new Loop(this.camera, this.scene, this.renderer);
    this.loop.updatables.push(this.controls);
    this.loop.updatables.push(this.helicopter);

    container.appendChild(this.renderer.domElement);
    this.resizer = new Resizer(container, this.camera, this.renderer);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  async init() {
    this.controls.orbitControls.target.copy(this.helicopter.helicopter.position);
  }

  start() {
    this.loop.start();
  }

  stop() {
    this.loop.stop();
  }
}

const clock = new THREE.Clock();

class Loop {
  constructor(camera, scene, renderer) {
    this.camera = camera;
    this.scene = scene;
    this.renderer = renderer;
    this.updatables = [];
  }

  tick() {
    const delta = clock.getDelta();
    for (const object of this.updatables) {
      object.tick(delta);
    }
  }

  start() {
    this.renderer.setAnimationLoop(() => {
      this.tick();
      this.renderer.render(this.scene, this.camera);
    });
  }

  stop() {
    this.renderer.setAnimationLoop(null);
  }
}

class Resizer {
  constructor(container, camera, renderer, onResizeCallback) {
    this.setSize(container, camera, renderer);
    this.onResizeCallback = onResizeCallback;

    window.addEventListener('resize', () => {
      this.setSize(container, camera, renderer);
      if (onResizeCallback) this.onResize(onResizeCallback);
    });
  }

  onResize(onResizeCallback) {
    onResizeCallback();
  }

  setSize(container, camera, renderer) {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
  }
}

const main = async () => {
  const container = document.getElementById('main-container');

  const world = new World(container);

  await world.init();

  world.start();
};

main().catch((err) => {
  console.error(err.message);
});
