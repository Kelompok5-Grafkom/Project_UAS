import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { MTLLoader } from "three/addons/loaders/MTLLoader.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Sky } from "three/addons/objects/Sky.js";
import { Player, PlayerController, ThirdPersonCamera } from "./player.js";
import { mod } from "three/examples/jsm/nodes/Nodes.js";

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xaec9f5);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 0, 0);
camera.lookAt(0, 0, 0);

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 2, 0);
controls.update();

// LIGHT
// Directional Light

var color = 0xffffff;
var light = new THREE.DirectionalLight(color, 1.0);
var dirLight = new THREE.DirectionalLight(color, 8);
dirLight.position.set(0, 50, 0);
dirLight.castShadow = true;
dirLight.shadow.camera.near = 1;
dirLight.shadow.camera.far = 90000;
dirLight.shadow.camera.right = 100;
dirLight.shadow.camera.left = -100;
dirLight.shadow.camera.top = 100;
dirLight.shadow.camera.bottom = -100;
dirLight.shadow.mapSize.width = 4096;
dirLight.shadow.mapSize.height = 4096;

scene.add(dirLight);
// scene.add(new THREE.CameraHelper(dirLight.shadow.camera));

// Ambient Light
var ambLight = new THREE.AmbientLight(color);
ambLight.intensity = 0.5;
ambLight.name = "ambLight_day";
scene.add(ambLight);

// plane
{
  var planeGeo = new THREE.PlaneGeometry(20000, 20000);
  var planeMat = new THREE.MeshPhongMaterial({ color: "#707070" });
  var plane = new THREE.Mesh(planeGeo, planeMat);
  plane.rotation.x = Math.PI * -0.5;
  plane.position.y = 1.18;
  plane.castShadow = true;
  plane.receiveShadow = true;
  scene.add(plane);
}

//Geometry
const objects = [];

// Bubbles
let bubbles = [];
function createBubbles() {
  const bubbleGeometry = new THREE.SphereGeometry(0.1, 32, 32);
  const bubbleMaterial = new THREE.MeshPhongMaterial({
    color: 0x9fdbfc,
    opacity: 0.3,
    transparent: true,
    roughness: 0.1,
    metalness: 0.9,
    reflectivity: 1,
  });

  for (let i = 0; i < 1000; i++) {
    const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
    bubble.position.set(
      (Math.random() - 0.5) * 50,
      (Math.random() - 0.5) * 50,
      (Math.random() - 0.5) * 50
    );
    bubble.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.1,
      (Math.random() - 0.5) * 0.1,
      (Math.random() - 0.5) * 0.1
    );
    scene.add(bubble);
    bubbles.push(bubble);
  }
}

createBubbles();

let mapBoundingBoxes = [];
// GLTF
const mapLoader = new GLTFLoader().setPath("resources/project/");
mapLoader.load("Map.gltf", function (gltf) {
  const model = gltf.scene;

  model.traverse((c) => {
    if (c.isMesh) {
      c.receiveShadow = true;
      c.castShadow = true;

      if (
        c.name !== "Ground" &&
        !c.name.includes("SM_Electric_Pole") &&
        !c.name.includes("SM_Street_Board")
      ) {
        const box = new THREE.Box3().setFromObject(c);
        mapBoundingBoxes.push(box);
      }
    }
  });
  renderer.compileAsync(model, camera, scene);

  scene.add(model);
});

// Langit dan matahari
let sky = new Sky();
let sun = new THREE.Vector3();
sky.scale.setScalar(450000);
scene.add(sky);

const uniforms = sky.material.uniforms;

uniforms["turbidity"].value = 10;
uniforms["rayleigh"].value = 3;
uniforms["mieCoefficient"].value = 0.005;
uniforms["mieDirectionalG"].value = 0.7;

const phi = THREE.MathUtils.degToRad(90 - 5);
const theta = THREE.MathUtils.degToRad(180);
sun.setFromSphericalCoords(1, phi, theta);
uniforms["sunPosition"].value.copy(sun);

let carBoundingBoxes = [];
const objLoader = new GLTFLoader().setPath("resources/object/object/");
objLoader.load("car1.gltf", function (gltf) {
  const model = gltf.scene;

  model.position.y = 1.25;
  model.position.x = 5;
  model.position.z = 2;
  model.traverse((c) => {
    if (c.isMesh) {
      c.receiveShadow = true;
      c.castShadow = true;
    }
  });
  renderer.compileAsync(model, camera, scene);

  scene.add(model);

  const carBoundingBox = new THREE.Box3().setFromObject(model);
  carBoundingBoxes.push(carBoundingBox);
});

objLoader.load("car2.gltf", function (gltf) {
  const model = gltf.scene;

  model.position.y = 1.25;
  model.position.x = 22;
  model.position.z = 10;
  model.rotation.y = 1.57;
  model.traverse((c) => {
    if (c.isMesh) {
      c.receiveShadow = true;
      c.castShadow = true;
    }
  });
  renderer.compileAsync(model, camera, scene);

  scene.add(model);

  const carBoundingBox = new THREE.Box3().setFromObject(model);
  carBoundingBoxes.push(carBoundingBox);
});

objLoader.load("car3.gltf", function (gltf) {
  const model = gltf.scene;

  model.position.y = 1.25;
  model.position.x = 35;
  model.position.z = -2;
  model.rotation.y = 3.14;
  model.traverse((c) => {
    if (c.isMesh) {
      c.receiveShadow = true;
      c.castShadow = true;
    }
  });
  renderer.compileAsync(model, camera, scene);

  scene.add(model);

  const carBoundingBox = new THREE.Box3().setFromObject(model);
  carBoundingBoxes.push(carBoundingBox);
});

objLoader.load("car4.gltf", function (gltf) {
  const model = gltf.scene;

  model.position.y = 1.25;
  model.position.x = -12;
  model.position.z = 2;
  model.traverse((c) => {
    if (c.isMesh) {
      c.receiveShadow = true;
      c.castShadow = true;
    }
  });
  renderer.compileAsync(model, camera, scene);

  scene.add(model);

  const carBoundingBox = new THREE.Box3().setFromObject(model);
  carBoundingBoxes.push(carBoundingBox);
});

const fbxLoader = new FBXLoader();
const mixers = [];

fbxLoader.load(
  "resources/project/Jerry.fbx",
  (object) => {
    object.scale.setScalar(0.02);
    object.position.set(37, 1.3, 25);
    scene.add(object);

    const mixer = new THREE.AnimationMixer(object);
    mixers.push(mixer);
    object.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    const carBoundingBox = new THREE.Box3().setFromObject(object);
    carBoundingBoxes.push(carBoundingBox);

    const animations = object.animations;
    animations.forEach((clip) => {
      const action = mixer.clipAction(clip);
      action.play();
    });
  },
  (xhr) => {
    console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
  },
  (error) => {
    console.log(error);
  }
);

fbxLoader.load(
  "resources/project/sitting.fbx",
  (object) => {
    object.scale.setScalar(0.01);
    object.position.set(53, 1.2, 27.95);
    scene.add(object);

    const mixer = new THREE.AnimationMixer(object);
    mixers.push(mixer);
    object.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    const carBoundingBox = new THREE.Box3().setFromObject(object);
    carBoundingBoxes.push(carBoundingBox);

    const animations = object.animations;
    animations.forEach((clip) => {
      const action = mixer.clipAction(clip);
      action.play();
    });
  },
  (xhr) => {
    console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
  },
  (error) => {
    console.log(error);
  }
);

fbxLoader.load(
  "resources/project/Phone Call.fbx",
  (object) => {
    object.scale.setScalar(0.01);
    object.position.set(8, 1.22, -12);
    scene.add(object);

    const mixer = new THREE.AnimationMixer(object);
    mixers.push(mixer);
    object.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    const carBoundingBox = new THREE.Box3().setFromObject(object);
    carBoundingBoxes.push(carBoundingBox);

    const animations = object.animations;
    animations.forEach((clip) => {
      const action = mixer.clipAction(clip);
      action.play();
    });
  },
  (xhr) => {
    console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
  },
  (error) => {
    console.log(error);
  }
);


// THIRD PERSON
var player = new Player(
  new ThirdPersonCamera(
    camera,
    new THREE.Vector3(0, 2, -5),
    new THREE.Vector3(0, 0, 0)
  ),
  new PlayerController(),
  scene,
  10
);

let isOrbitalMode = true;
let showBubbles = true;

setTimeout(() => {
  isOrbitalMode = false;
  bubbles.forEach((bubble) => scene.remove(bubble));
  showBubbles = false;
}, 10000);

var keys = {
  nightMode: false,
  dayMode: false,
};

function onKeyDown(event) {
  switch (event.keyCode) {
    case "N".charCodeAt(0):
    case "n".charCodeAt(0):
      keys["nightMode"] = true;
      break;
    case "M".charCodeAt(0):
    case "m".charCodeAt(0):
      keys["dayMode"] = true;
      break;
  }
}

function onKeyUp(event) {
  switch (event.keyCode) {
    case "N".charCodeAt(0):
    case "n".charCodeAt(0):
      keys["nightMode"] = false;
      break;
    case "M".charCodeAt(0):
    case "m".charCodeAt(0):
      keys["dayMode"] = false;
      break;
  }
}

document.addEventListener("keydown", (e) => onKeyDown(e), false);
document.addEventListener("keyup", (e) => onKeyUp(e), false);

console.log(scene);
var isAmbient = false;
var isDir = false;
function render(dt) {
  console.log(keys["nightMode"]);

  // Night & Day mode
  if (keys["nightMode"]) {
    isDir = false;
    uniforms["sunPosition"].value.set(0, 0, 0);

    scene.children.forEach((s) => {
      if (s instanceof THREE.DirectionalLight) {
        scene.remove(s);
      }

      if (s.name == "ambLight_day") {
        scene.remove(s);
      }

      if (s.name == "ambLight_night") {
        isAmbient = true;
      }
    });

    if (!isAmbient) {
      var point_light = [
        [1.279, 5.583, 4.007],
        [-3.051, 5.788, -4.046],
        [2.548, 5.63, -20.145],
        [28.205, 5.908, 20.436],
        [46.883, 5.624, 18.004],
        [28.192, 5.908, 20.972],
        [50.285, 5.374, 18.119],
        [46.877, 5.553, 9.513],
        [49.543, 5.638, 9.838],
        [32.874, 5.592, 27.539],
        [32.873, 5.583, 32.479],
        [39.403, 5.583, 32.509],
        [39.449, 5.584, 27.510],
        [46.674, 5.366, 32.435],
        [50.467, 5.642, 32.494],
        [46.280, 5.623, 27.494],
        [50.409, 5.657, 27.509],
        [57.924, 5.563, 27.483],
        [57.770, 5.623, 32.484],
        [64.085, 5.399, 27.417],
        [64.013, 5.690, 32.448],
        [46.855, 5.553, 42.445],
        [50.064, 5.353, 42.456],
        [46.834, 5.607, 50.509],
        [49.994, 5.566, 50.463],
        [184.046, 5.914, 117.487],
        [175.913, 5.849, 72.519],
        [184.112, 5.779, 63.461],
        [184.129, 5.836, 18.509],
        [187.992, 5.793, -3.491],
        [196.106, 5.785, -19.483],
        [188.136, 5.711, -37.488],
        [196.106, 5.820, -66.512],
        [164.049, 5.773, -73.476],
        [196.050, 5.761, -135.490],
        [169.519, 5.801, -148.100],
        [137.546, 5.766, -160.171],
        [99.491, 5.751, -152.012],
        [79.920, 5.803, -152.510],
        [36.538, 5.786, -187.820],
        [-7.455, 5.697, -207.871],
        [-16.113, 5.801, -181.515],
        [-7.936, 5.792, -178.492],
        [-51.852, 5.663, -157.473],
        [-52.097, 5.685, -181.554],
        [-57.460, 5.707, -171.893],
        [-76.392, 5.679, -164.171],
        [-88.039, 5.700, -135.442],
        [-108.561, 5.700, -116.038],
        [-99.669, 5.700, -108.486],
        [-112.484, 5.700, -80.077],
        [-103.474, 5.700, -80.000],
        [-116.065, 5.700, -55.494],
        [-123.935, 5.700, -48.484],
        [-136.493, 5.700, -56.038],
        [-140.044, 5.700, -71.495],
        [-147.984, 5.700, -53.466],
        [-137.449, 5.700, -32.043],
        [-140.073, 5.700, -15.479],
        [-133.448, 5.700, -4.009],
        [-120.459, 5.700, -4.009],
        [-112.069, 5.700, -17.487],
        [-126.454, 5.700, 51.958],
        [-123.499, 5.700, 88.027],
        [-99.830, 5.700, 140.458],
        [-111.893, 5.700, 120.485],
        [-87.462, 5.700, 127.936],
        [-52.435, 5.700, 159.873],
        [-7.131, 5.700, 148.504],
        [-0.500, 5.700, 140.000],
        [40.534, 5.700, 164.039],
        [31.516, 5.700, 148.009],
        [106.540, 5.700, 183.999],
        [126.176, 5.700, 160.503],
        [128.021, 5.700, 144.493],
        [128.021, 5.700, 122.480],
        [-43.898, 5.700, -133.489],
        [-52.082, 5.700, -126.486],
        [-47.483, 5.700, -103.863],
        [-7.931, 5.700, -101.473],
        [-9.443, 5.700, -112.103],
        [40.541, 5.700, -115.931],
        [52.070, 5.700, -117.477],
        [43.877, 5.700, -136.505],
        [56.524, 5.700, -139.997],
        [69.515, 5.700, -139.997],
        [58.522, 5.700, -148.112],
        [32.527, 5.700, -3.940],
        [19.503, 5.700, -28.025],
        [40.135, 5.700, -35.491],
        [31.887, 5.700, -47.500],
        [51.505, 5.700, -55.892],
        [61.551, 5.700, -64.150],
        [37.516, 5.700, -64.103],
        [19.976, 5.700, -87.503],
        [34.535, 5.700, -100.076],
        [51.509, 5.700, -92.024],
        [80.000, 5.700, -122.511],
        [88.000, 5.700, -99.500],
        [76.000, 5.700, -90.000],
        [80.000, 5.700, -89.586],
        [78.100, 5.700, -88.000],
        [78.100, 5.700, -91.900],
        [106.500, 5.700, -80.000],
        [104.000, 5.700, -93.500],
        [124.000, 5.700, -89.500],
        [-91.900, 5.700, -84.500],
        [-91.900, 5.700, -91.500],
        [-63.900, 5.700, -75.500],
        [-63.900, 5.700, -92.500],
        [-74.500, 5.700, -74.750],
        [-74.500, 5.700, -79.750],
        [-74.650, 5.700, -89.600],
        [-74.650, 5.700, -99.400],
        [-84.050, 5.700, -99.000],
        [-84.050, 5.700, -90.050],
        [-101.500, 5.700, -88.200],
        [-103.500, 5.700, -79.900],
        [16.500, 5.700, -55.850],
        [-28.100, 5.700, 12.500],
        [-28.100, 5.700, 40.500],
        [-40.000, 5.700, 44.500],
        [-19.850, 5.700, 48.500],
        [-52.400, 5.700, -40.100],
        [-51.475, 5.700, -20.000],
        [-64.000, 5.700, -43.500],
        [-88.000, 5.700, -36.500],
        [-88.000, 5.700, -22.500],
        [-88.000, 5.700, 5.500],
        [-64.000, 5.700, 55.500],
        [-51.500, 5.700, 104.000],
        [-56.000, 5.700, 94.500],
        [-105.500, 5.700, 40.000],
        [-26.500, 5.700, 112.250],
        [-20.500, 5.700, 140.000],
        [24.500, 5.700, 116.000],
        [58.500, 5.700, 100.000],
        [93.500, 5.700, 100.000],
        [104.000, 5.700, 108.500],
        [123.500, 5.700, 104.000],
        [145.500, 5.700, 112.000],
        [127.500, 5.700, 123.000],
        [151.600, 5.700, 86.000],
        [152.000, 5.700, 57.500],
        [160.000, 5.700, 62.500],
        [129.500, 5.700, -44.000],
        [84.500, 5.700, -44.000],
        [104.500, 5.700, 20.000],
        [122.500, 5.700, 20.000],
        [128.000, 5.700, 13.500],
        [123.500, 5.700, -8.000],
        [103.500, 5.700, -16.000],
        [152.000, 5.700, 24.500],
        [163.500, 5.700, 8.000],
        [160.000, 5.700, -8.500],
        [160.000, 5.700, -40.500],
        [152.000, 5.700, -22.500],
        [158.500, 5.700, -52.000],
        [140.000, 5.700, -58.480],
        [172.000, 5.700, -62.500],
        [118.500, 5.700, -124.000],
        [88.000, 5.700, -136.500],
        [44.000, 5.700, 82.500]
      ];
      // Lampu Jalan
      for (var i = 0; i < point_light.length; i++) {
        light = new THREE.PointLight(0xedcd6b, 30);
        light.position.set(
          point_light[i][0],
          point_light[i][1],
          point_light[i][2]
        );
        scene.add(light);
      }

      var ambLight = new THREE.AmbientLight(0x000038);
      ambLight.intensity = 10;
      ambLight.name = "ambLight_night";
      scene.add(ambLight);
    }
  }

  if (keys["dayMode"]) {
    console.log(scene);
    isAmbient = false;
    uniforms["sunPosition"].value.copy(sun);

    scene.children.forEach((s) => {
      if (s.name == "ambLight_night") {
        scene.remove(s);
      }

      if (s instanceof THREE.PointLight) {
        scene.remove(s);
      }
    });

    if (!isDir) {
      isDir = true;
      var dirLight = new THREE.DirectionalLight(color, 8);
      dirLight.position.set(0, 50, 0);
      dirLight.castShadow = true;
      dirLight.shadow.camera.near = 1;
      dirLight.shadow.camera.far = 90000;
      dirLight.shadow.camera.right = 100;
      dirLight.shadow.camera.left = -100;
      dirLight.shadow.camera.top = 100;
      dirLight.shadow.camera.bottom = -100;
      dirLight.shadow.mapSize.width = 4096;
      dirLight.shadow.mapSize.height = 4096;
      scene.add(dirLight);

      var ambLight = new THREE.AmbientLight(color);
      ambLight.intensity = 0.5;
      ambLight.name = "ambLight_day";
      scene.add(ambLight);
    }
  }

  if (player.controller.keys["freeMode"]) {
    controls.enabled = true;
  } else {
    controls.enabled = false;

    if (player.controller.keys["firstPerson"])
      player.setCamera(
        new ThirdPersonCamera(
          camera,
          new THREE.Vector3(0, 1.6, 0.5),
          new THREE.Vector3(0, 1.6, 0),
          true
        )
      );
    if (player.controller.keys["thirdPerson"])
      player.setCamera(
        new ThirdPersonCamera(
          camera,
          new THREE.Vector3(0, 2, -5),
          new THREE.Vector3(0, 0, 0)
        )
      );

    player.update(dt, carBoundingBoxes.concat(mapBoundingBoxes));

    // if (isOrbitalMode && player.mesh) {
    //   const radius = 5; // Distance from the player
    //   const speed = 0.038; // Orbit speed
    //   player.camera.orbit(player.mesh.position, radius, speed);
    // }
  }

  renderer.render(scene, camera);
}

const clock = new THREE.Clock();

let mixer;
var time_prev = 0;
function animate(time) {
  var dt = time - time_prev;
  dt *= 0.1;
  render(clock.getDelta());

  objects.forEach((obj) => {
    obj.rotation.z += dt * 0.01;
  });
  const delta = clock.getDelta();

  if (mixer) mixer.update(delta);

  mixers.forEach((mixer) => mixer.update(delta));

  // bubbles
  if (showBubbles) {
    bubbles.forEach((bubble) => {
      bubble.position.add(bubble.velocity);
    });
  }

  renderer.render(scene, camera);

  time_prev = time;
  requestAnimationFrame(animate);
}

window.addEventListener("keydown", (event) => {
  if (event.key === "+") {
    camera.fov = Math.max(10, camera.fov - 1);
    camera.updateProjectionMatrix();
  } else if (event.key === "-") {
    camera.fov = Math.min(100, camera.fov + 1);
    camera.updateProjectionMatrix();
  }
});

requestAnimationFrame(animate);
