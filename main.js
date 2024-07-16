import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

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

const loadGLTFModel = async (scene) => {
  const loader = new GLTFLoader();
  return new Promise((resolve, reject) => {
    loader.load('scene.gltf', (gltf) => {
      const model = gltf.scene;
      model.scale.set(2, 2, 2); // Adjust the scale as needed
      scene.add(model);
      resolve(model);
    }, undefined, reject);
  });
};

class World {
  constructor(container) {
    this.scene = createScene('#030712');
    this.camera = createCamera();
    this.renderer = createRenderer();
    this.lights = createLights();

    this.scene.add(this.lights.ambientLight, this.lights.directionalLight);

    this.controls = createControls(this.camera, this.renderer.domElement);
    this.loop = new Loop(this.camera, this.scene, this.renderer);
    this.loop.updatables.push(this.controls);

    container.appendChild(this.renderer.domElement);
    this.resizer = new Resizer(container, this.camera, this.renderer);
  }

  async init() {
    this.helicopter = await loadGLTFModel(this.scene);
    this.controls.orbitControls.target.copy(this.helicopter.position);
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
