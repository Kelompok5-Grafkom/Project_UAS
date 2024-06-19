import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { MTLLoader } from "three/addons/loaders/MTLLoader.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Sky } from "three/addons/objects/Sky.js";

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xaec9f5);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 0, 100);
camera.lookAt(0, 0, 0);

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 5, 0);
controls.update();

// LIGHT
// Directional Light

var color = 0xffffff;
var light = new THREE.DirectionalLight(color, 5);
// light.position.set(0, 10, 0);
// light.target.position.set(-5, 0, 0);
// scene.add(light);
// scene.add(light.target);

// Hemisphere Light
// light = new THREE.HemisphereLight(0xb1e1ff, 0xb97a20, 5); //skyColor, groundColor, intensity
// scene.add(light);

// Point Light
// light = new THREE.PointLight(0xffff00, 500); //color, intensity
// light.position.set(10, 10, 0);
// scene.add(light);

// Spot Light
// light = new THREE.SpotLight(0xff0000, 500); //color, intensity
// light.position.set(10, 10, 0);
// scene.add(light);

//Geometry
const objects = [];

// plane
// {
//   var planetGeo = new THREE.PlaneGeometry(200, 200);
//   var planetMat = new THREE.MeshPhongMaterial({ color: "#4a250d" });
//   var mesh = new THREE.Mesh(planetGeo, planetMat);
//   mesh.rotation.x = Math.PI * -0.5;
//   mesh.position.y = -15;
//   scene.add(mesh);
// }

// GLTF
const mapLoader = new GLTFLoader().setPath("resources/project/");
mapLoader.load("Map2.gltf", function (gltf) {
  const model = gltf.scene;

  renderer.compileAsync(model, camera, scene);

  scene.add(model);
});

// Langit
let sky = new Sky();
let sun = new THREE.Vector3();
sky.scale.setScalar(450000);
scene.add(sky);

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
  [49.994, 5.566, 50.463]
];

// Lampu Jalan
for (var i = 0; i < point_light.length; i++) {
  light = new THREE.PointLight(0xedcd6b, 30);
  light.position.set(point_light[i][0], point_light[i][1], point_light[i][2]);
  scene.add(light);
}

const uniforms = sky.material.uniforms;

uniforms["turbidity"].value = 10;
uniforms["rayleigh"].value = 3;
uniforms["mieCoefficient"].value = 0.005;
uniforms["mieDirectionalG"].value = 0.7;

const phi = THREE.MathUtils.degToRad(90 - 5);
const theta = THREE.MathUtils.degToRad(180);

sun.setFromSphericalCoords(1, phi, theta);

uniforms["sunPosition"].value.copy(sun);

const objLoader = new GLTFLoader().setPath("resources/object/object/");
objLoader.load("car1.gltf", function (gltf) {
  const model = gltf.scene;

  model.position.y = 1.25;
  model.position.x = 5;
  model.position.z = 2;
  renderer.compileAsync(model, camera, scene);

  scene.add(model);
});

var anims = null;
const clock = new THREE.Clock();

let mixer;
var _animations = {};
const _OnLoad = (animName, anim, param) => {
  const clip = anim.animations[param];
  const action = mixer.clipAction(clip);

  _animations[animName] = {
    clip: clip,
    action: action,
  };
};

const fbxLoader = new FBXLoader();
fbxLoader.load("resources/project/Farmer.fbx", (object) => {
  mixer = new THREE.AnimationMixer(object);

  // mencatat animation yang diperlukan. setelah dicatat, dipanggil menggunakan function di screenshot an, trs dijalankan menggunakan keyboard listener dan dijalankan di animate
  _OnLoad("walk", object, 0);
  _OnLoad("run", object, 1);

  // const action = _animations['walk'].action;
  // action.play();

  object.traverse(function (child) {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  console.log(_animations);
  object.scale.x = object.scale.y = object.scale.z = 0.01;
  object.position.y = 1.25;

  scene.add(object);
});

console.log(_animations);

var walk = false;
var run = false;

var keydown = function (e) {
  var keyCode = e.keyCode;

  if (keyCode == 87) {
    walk = true;
    // if (walk)
    //   walk = false;
    // else {
    //   walk = true;
    //   run = false;
    // }
  }

  if (keyCode == 83) {
    run = true;
    // if (run)
    //   run = false;
    // else {
    //   run = true;
    //   walk = false;
    // }
  }

  return false;
};

var keyup = function (e) {
  walk = false;
  run = false;

  return false;
};

document.addEventListener("keydown", keydown);
document.addEventListener("keyup", keyup);

var time_prev = 0;
function animate(time) {
  var dt = time - time_prev;
  dt *= 0.1;

  objects.forEach((obj) => {
    obj.rotation.z += dt * 0.01;
  });
  const delta = clock.getDelta();

  if (mixer) mixer.update(delta);

  renderer.render(scene, camera);

  if (_animations["walk"] && _animations["run"]) {
    const walkAction = _animations["walk"].action;
    const runAction = _animations["run"].action;
    if (walk) {
      walkAction.play();
    } else {
      walkAction.stop();
    }

    if (run) {
      runAction.play();
    } else {
      runAction.stop();
    }
  }

  time_prev = time;
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
