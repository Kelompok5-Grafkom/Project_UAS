import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { MTLLoader } from "three/addons/loaders/MTLLoader.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

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
light.position.set(0, 10, 0);
light.target.position.set(-5, 0, 0);
scene.add(light);
scene.add(light.target);

// Hemisphere Light
light = new THREE.HemisphereLight(0xb1e1ff, 0xb97a20, 5); //skyColor, groundColor, intensity
scene.add(light);

// Point Light
light = new THREE.PointLight(0xffff00, 500); //color, intensity
light.position.set(10, 10, 0);
scene.add(light);

// Spot Light
light = new THREE.SpotLight(0xff0000, 500); //color, intensity
light.position.set(10, 10, 0);
scene.add(light);

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
const loader = new GLTFLoader().setPath("resources/project/");
loader.load("Map.gltf", function (gltf) {
  const model = gltf.scene;

  renderer.compileAsync(model, camera, scene);

  scene.add(model);
});

var time_prev = 0;
function animate(time) {
  var dt = time - time_prev;
  dt *= 0.1;

  objects.forEach((obj) => {
    obj.rotation.z += dt * 0.01;
  });

  renderer.render(scene, camera);

  time_prev = time;
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
