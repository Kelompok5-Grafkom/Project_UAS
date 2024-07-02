import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";

export class Player {
    constructor(camera, controller, scene, speed) {
        this.camera = camera;
        this.controller = controller;
        this.scene = scene;
        this.speed = speed;
        this.state = "idle";
        this.rotationVector = new THREE.Vector3(0, 0, 0);
        this.animations = {};
        this.lastRotation = 0;
        this.boundingBox = new THREE.Box3();

        this.camera.setup(new THREE.Vector3(0, 0, 0), this.rotationVector);

        // this.mesh = new THREE.Mesh(
        //     new THREE.BoxGeometry(1,1,1),
        //     new THREE.MeshPhongMaterial({color: 0xFF1111})
        // );
        // this.scene.add(this.mesh);
        // this.mesh.castShadow = true;
        // this.mesh.receiveShadow = true;

        this.loadModel();
    }

    setCamera(camera) {
        this.camera = camera;
    }

    loadModel() {
        var loader = new FBXLoader();
        loader.setPath('./resources/project/');
        loader.load('Breathing Idle.fbx', (fbx) => {
            fbx.scale.setScalar(0.005);
            fbx.position.y = 1.25;
            fbx.traverse(c => {
                if (c.isMesh) {
                    c.castShadow = true;
                }
            });
            this.mesh = fbx;
            this.scene.add(this.mesh);
            this.mesh.rotation.y += Math.PI / 2;

            this.mixer = new THREE.AnimationMixer(this.mesh);
            // console.log(fbx);

            var onLoad = (animName, anim, index) => {
                const clip = anim.animations[index];
                const action = this.mixer.clipAction(clip);

                this.animations[animName] = {
                    clip: clip,
                    action: action,
                };
            };

            const loader = new FBXLoader();
            loader.setPath('./resources/project/');
            loader.load('Breathing Idle.fbx', (fbx) => { onLoad('idle', fbx, 0) });
            loader.load('Running.fbx', (fbx) => { onLoad('run', fbx, 0) });


        });

    }

    update(dt, carBoundingBox) {
        if (this.mesh && this.animations) {
            this.lastRotation = this.mesh.rotation.y;
            var direction = new THREE.Vector3(0, 0, 0);

            if (this.controller.keys['forward']) {
                direction.x = 1;
                this.mesh.rotation.y = Math.PI / 2;
            }
            if (this.controller.keys['backward']) {
                direction.x = -1;
                this.mesh.rotation.y = -Math.PI / 2;
            }
            if (this.controller.keys['left']) {
                direction.z = -1;
                this.mesh.rotation.y = Math.PI;
            }
            if (this.controller.keys['right']) {
                direction.z = 1;
                this.mesh.rotation.y = 0;
            }
            // if (this.controller.keys['firstPerson'])
            //     this.camera = new ThirdPersonCamera(this.camera, new THREE.Vector3(-5, 2, 0), new THREE.Vector3(0, 0, 0));
            // if (this.controller.keys['thirdPerson'])
            //     this.camera = new ThirdPersonCamera(this.camera, new THREE.Vector3(0.2, 1, 0), new THREE.Vector3(0.5, 1, 0));

            // this.lastRotation = this.mesh.rotation.y;
            // console.log(direction.length())
            if (direction.length() == 0) {
                if (this.animations['idle']) {
                    if (this.state != "idle") {
                        this.mixer.stopAllAction();
                        this.state = "idle";
                    }
                    this.mixer.clipAction(this.animations['idle'].clip).play();
                }
            } else {
                if (this.animations['run']) {
                    if (this.state != "run") {
                        this.mixer.stopAllAction();
                        this.state = "run";
                    }
                    this.mixer.clipAction(this.animations['run'].clip).play();
                }
            }

            if (this.controller.mouseDown) {
                var dtMouse = this.controller.deltaMousePos;
                dtMouse.x = dtMouse.x / Math.PI;
                dtMouse.y = dtMouse.y / Math.PI;

                this.rotationVector.y += dtMouse.x * dt * 10;
                this.rotationVector.z += dtMouse.y * dt * 10;
            }
            this.mesh.rotation.y += this.rotationVector.y;

            var forwardVector = new THREE.Vector3(1, 0, 0);
            var rightVector = new THREE.Vector3(0, 0, 1);
            forwardVector.applyAxisAngle(
                new THREE.Vector3(0, 1, 0),
                this.rotationVector.y
            );
            rightVector.applyAxisAngle(
                new THREE.Vector3(0, 1, 0),
                this.rotationVector.y
            );

            const newPosition = new THREE.Vector3().copy(this.mesh.position);
            newPosition.add(
                forwardVector.multiplyScalar(dt * this.speed * direction.x)
            );
            newPosition.add(
                rightVector.multiplyScalar(dt * this.speed * direction.z)
            );

            this.boundingBox.setFromObject(this.mesh);

            if (this.boundingBox.intersectsBox(carBoundingBox)) {
                // Adjust position
                if (direction.x > 0) {
                    newPosition.x = Math.min(newPosition.x, carBoundingBox.min.x - this.boundingBox.min.x);
                } else if (direction.x < 0) {
                    newPosition.x = Math.max(newPosition.x, carBoundingBox.max.x - this.boundingBox.max.x);
                }

                if (direction.z > 0) {
                    newPosition.z = Math.min(newPosition.z, carBoundingBox.min.z - this.boundingBox.min.z);
                } else if (direction.z < 0) {
                    newPosition.z = Math.max(newPosition.z, carBoundingBox.max.z - this.boundingBox.max.z);
                }
            }

            this.mesh.position.copy(newPosition);
            this.camera.setup(this.mesh.position, this.rotationVector);

            if (this.mixer) {
                this.mixer.update(dt);
            }
        }
    }
}

export class PlayerController {
    constructor() {
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            firstPerson: false,
            thirdPerson: false,
            freeMode: false
        };
        this.mousePos = new THREE.Vector2();
        this.mouseDown = false;
        this.deltaMousePos = new THREE.Vector2();
        document.addEventListener("keydown", (e) => this.onKeyDown(e), false);
        document.addEventListener("keyup", (e) => this.onKeyUp(e), false);
        document.addEventListener("mousemove", (e) => this.onMouseMove(e), false);
        document.addEventListener("mousedown", (e) => this.onMouseDown(e), false);
        document.addEventListener("mouseup", (e) => this.onMouseUp(e), false);
        document.addEventListener("wheel", (e) => this.onMouseWheel(e), false);
    }

    onMouseDown(event) {
        this.mouseDown = true;
    }
    onMouseUp(event) {
        this.mouseDown = false;
    }
    onMouseMove(event) {
        var currentMousePos = new THREE.Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1
        );
        this.deltaMousePos.addVectors(
            currentMousePos,
            this.mousePos.multiplyScalar(-1)
        );
        this.mousePos.copy(currentMousePos);
    }
    onMouseWheel(event) {
        this.camera.zoom += event.deltaY * 0.001;
        this.camera.updateProjectionMatrix();
    }
    onKeyDown(event) {
        switch (event.keyCode) {
            case "W".charCodeAt(0):
            case "w".charCodeAt(0):
                this.keys["forward"] = true;
                break;
            case "S".charCodeAt(0):
            case "s".charCodeAt(0):
                this.keys["backward"] = true;
                break;
            case "A".charCodeAt(0):
            case "a".charCodeAt(0):
                this.keys["left"] = true;
                break;
            case "D".charCodeAt(0):
            case "d".charCodeAt(0):
                this.keys["right"] = true;
                break;
            case "F".charCodeAt(0):
            case "f".charCodeAt(0):
                this.keys['firstPerson'] = true;
                this.keys['thirdPerson'] = false;
                break;
            case "T".charCodeAt(0):
            case "t".charCodeAt(0):
                this.keys['thirdPerson'] = true;
                this.keys['firstPerson'] = false;
                break;
            case "G".charCodeAt(0):
            case "g".charCodeAt(0):
                this.keys['freeMode'] = !this.keys['freeMode'];
                break;
            case "N".charCodeAt(0):
            case "n".charCodeAt(0):
                this.keys['nightMode'] = true
                break;
            case "M".charCodeAt(0):
            case "m".charCodeAt(0):
                this.keys['dayMode'] = true
                break;
        }
    }
    onKeyUp(event) {
        switch (event.keyCode) {
            case "W".charCodeAt(0):
            case "w".charCodeAt(0):
                this.keys["forward"] = false;
                break;
            case "S".charCodeAt(0):
            case "s".charCodeAt(0):
                this.keys["backward"] = false;
                break;
            case "A".charCodeAt(0):
            case "a".charCodeAt(0):
                this.keys["left"] = false;
                break;
            case "D".charCodeAt(0):
            case "d".charCodeAt(0):
                this.keys["right"] = false;
                break;
            case "N".charCodeAt(0):
            case "n".charCodeAt(0):
                this.keys['nightMode'] = false
                break;
            case "M".charCodeAt(0):
            case "m".charCodeAt(0):
                this.keys['dayMode'] = false
                break;
        }
    }
}

export class ThirdPersonCamera {
    constructor(camera, positionOffSet, targetOffSet) {
        this.camera = camera;
        this.positionOffSet = positionOffSet;
        this.targetOffSet = targetOffSet;
        this.angle = 0;
    }

    orbit(target, radius, speed) {
        this.angle += speed;
        const x = target.x + radius * Math.cos(this.angle);
        const z = target.z + radius * Math.sin(this.angle);
        const y = target.y + this.positionOffSet.y;
        this.camera.position.set(x, y, z);
        this.camera.lookAt(target);
    }

    setup(target, angle) {
        var temp = new THREE.Vector3(0, 0, 0);
        temp.copy(this.positionOffSet);
        temp.applyAxisAngle(new THREE.Vector3(angle.x, 1, 0), angle.y);
        temp.applyAxisAngle(new THREE.Vector3(angle.y, 0, 1), angle.z);
        temp.addVectors(target, temp);
        this.camera.position.copy(temp);
        temp = new THREE.Vector3(0, 0, 0);
        temp.addVectors(target, this.targetOffSet);
        this.camera.lookAt(temp);
    }
}
