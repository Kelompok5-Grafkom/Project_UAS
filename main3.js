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
ambLight.name = 'ambLight_day'
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

      if (c.name !== 'Ground' && !c.name.includes('SM_Electric_Pole') && !c.name.includes('SM_Street_Board')) {
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
  model.rotation.y = 1.57
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
  dayMode: false
};

function onKeyDown(event) {
  switch (event.keyCode) {
    case "N".charCodeAt(0):
    case "n".charCodeAt(0):
      keys['nightMode'] = true
      break;
    case "M".charCodeAt(0):
    case "m".charCodeAt(0):
      keys['dayMode'] = true
      break;
  }
}

function onKeyUp(event) {
  switch (event.keyCode) {
    case "N".charCodeAt(0):
    case "n".charCodeAt(0):
      keys['nightMode'] = false
      break;
    case "M".charCodeAt(0):
    case "m".charCodeAt(0):
      keys['dayMode'] = false
      break;
  }
}

document.addEventListener("keydown", (e) => onKeyDown(e), false);
document.addEventListener("keyup", (e) => onKeyUp(e), false);

console.log(scene);
var isAmbient = false;
var isDir = false;
function render(dt) {
  // Night & Day mode
  if (keys['nightMode']) {
    isDir = false;
    uniforms["sunPosition"].value.set(0, 0, 0);

    scene.children.forEach(s => {
      if (s instanceof THREE.DirectionalLight) {
        scene.remove(s);
      }

      if (s.name == 'ambLight_day') {
        scene.remove(s);
      }

      if (s.name == 'ambLight_night') {
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
        [39.449, 5.584, 27.51],
        [46.674, 5.366, 32.435],
        [50.467, 5.642, 32.494],
        [46.28, 5.623, 27.494],
        [50.409, 5.657, 27.509],
        [57.924, 5.563, 27.483],
        [57.77, 5.623, 32.484],
        [64.085, 5.399, 27.417],
        [64.013, 5.69, 32.448],
        [46.855, 5.553, 42.445],
        [50.064, 5.353, 42.456],
        [46.834, 5.607, 50.509],
        [49.994, 5.566, 50.463],
      ];
      // Lampu Jalan
      for (var i = 0; i < point_light.length; i++) {
        light = new THREE.PointLight(0xedcd6b, 30);
        light.position.set(point_light[i][0], point_light[i][1], point_light[i][2]);
        scene.add(light);
      }

      var ambLight = new THREE.AmbientLight(0x000038);
      ambLight.intensity = 10;
      ambLight.name = 'ambLight_night'
      scene.add(ambLight);
    }
  }

  if (keys['dayMode']) {
    console.log(scene);
    isAmbient = false;
    uniforms['sunPosition'].value.copy(sun);

    scene.children.forEach(s => {
      if (s.name == 'ambLight_night') {
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
      ambLight.name = 'ambLight_day';
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

window.addEventListener('keydown', (event) => {
  if (event.key === '+') {
    camera.fov = Math.max(10, camera.fov - 1);
    camera.updateProjectionMatrix();
  } else if (event.key === '-') {
    camera.fov = Math.min(100, camera.fov + 1); 
    camera.updateProjectionMatrix();
  }
});

requestAnimationFrame(animate);
