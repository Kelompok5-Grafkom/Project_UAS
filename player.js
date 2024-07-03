import * as THREE from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { shiftLeft, shiftRight } from "three/examples/jsm/nodes/Nodes.js";

export class Player {
    constructor(camera, controller, scene, speed) {
        this.camera = camera;
        this.controller = controller;
        this.scene = scene;
        this.speed = speed;
        this.state = "idle";
        this.rotationVector = new THREE.Vector3(0, 0, 0);
        this.currentRotation = new THREE.Euler(0, 0, 0);
        this.animations = {};
        this.lastRotation = 0;
        this.cameraRotationX = 0;
        this.cameraRotationY = 0;
        this.cameraRotationZ = 0;

        this.camera.setup(new THREE.Vector3(0, 0, 0), this.rotationVector, this.cameraRotationY, this.cameraRotationZ);

        // this.mesh = new THREE.Mesh(
        //     new THREE.BoxGeometry(1,1,1),
        //     new THREE.MeshPhongMaterial({color: 0xFF1111})
        // );
        // this.scene.add(this.mesh);
        // this.mesh.castShadow = true;
        // this.mesh.receiveShadow = true;

        this.boundingBox = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());

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

    updateBoundingBox() {
        if (this.mesh) {
            this.boundingBox.setFromObject(this.mesh);
        }
    }

    checkCollision(carBoundingBoxes) {
        for (let i = 0; i < carBoundingBoxes.length; i++) {
            if (this.boundingBox.intersectsBox(carBoundingBoxes[i])) {
                return true;
            }
        }
        return false;
    }

    update(dt, carBoundingBoxes) {
        if (this.mesh && this.animations) {
            this.updateBoundingBox();
            const originalPosition = this.mesh.position.clone();

            this.lastRotation = this.mesh.rotation.y;
            var direction = new THREE.Vector3(0, 0, 0);

            if (this.controller.keys['forward']) {
                direction.z += this.speed * dt;
                // this.mesh.rotation.y = Math.PI / 2;
            }
            if (this.controller.keys['backward']) {
                direction.z -= this.speed * dt;
                // this.mesh.rotation.y = -Math.PI / 2;
            }
            if (this.controller.keys['left']) {
                // direction.z = -1;
                this.currentRotation.y += (Math.PI / 2) * dt;
            }
            if (this.controller.keys['right']) {
                // direction.z = 1;
                this.currentRotation.y -= (Math.PI / 2) * dt
            }
            if (this.controller.keys['shiftRight']) {
                this.cameraRotationY += (Math.PI / 2) * dt
            }
            if (this.controller.keys['shiftLeft']) {
                this.cameraRotationY -= (Math.PI / 2) * dt
            }
            if (this.controller.isFirstPerson) {
                this.cameraRotationZ = 0;
            }

            this.lastRotation = this.mesh.rotation.y;
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

            if (this.controller.keys["tiltLeft"]) {
                this.cameraRotationZ = Math.min(
                    this.cameraRotationZ + this.speed * dt,
                    15 * (Math.PI / 180)
                );
            }
            if (this.controller.keys["tiltRight"]) {
                this.cameraRotationZ = Math.max(
                    this.cameraRotationZ - this.speed * dt,
                    -15 * (Math.PI / 180)
                );
            }

            if (!this.controller.keys['tiltLeft'] && !this.controller.keys['tiltRight']) {
                this.cameraRotationZ = 0;
            }
            // else {
            //     // If no tilt keys are pressed, reset cameraRotationZ to zero
            //     if (this.cameraRotationZ > 0) {
            //         this.cameraRotationZ = Math.max(this.cameraRotationZ - this.speed * dt, 0);
            //     } else if (this.cameraRotationZ < 0) {
            //         this.cameraRotationZ = Math.min(this.cameraRotationZ + this.speed * dt, 0);
            //     }
            // }

            if (this.controller.mouseDown) {
                var dtMouse = this.controller.deltaMousePos;
                dtMouse.x = dtMouse.x / Math.PI;
                dtMouse.y = dtMouse.y / Math.PI;

                this.rotationVector.y += dtMouse.x * dt * 10;
                this.rotationVector.z += dtMouse.y * dt * 10;
            }
            this.currentRotation.y += this.rotationVector.y * dt;
            this.currentRotation.z += this.rotationVector.z * dt;
            this.rotationVector.set(0, 0, 0);
            // this.mesh.rotation.y += this.currentRotation.y;

            // var forwardVector = new THREE.Vector3(1, 0, 0);
            // var rightVector = new THREE.Vector3(0, 0, 1);
            // forwardVector.applyAxisAngle(
            //     new THREE.Vector3(0, 1, 0),
            //     this.rotationVector.y
            // );
            // rightVector.applyAxisAngle(
            //     new THREE.Vector3(0, 1, 0),
            //     this.rotationVector.y
            // );

            // this.mesh.position.add(
            //     forwardVector.multiplyScalar(dt * this.speed * direction.x)
            // );
            // this.mesh.position.add(
            //     rightVector.multiplyScalar(dt * this.speed * direction.z)
            // );
            direction.applyAxisAngle(
                new THREE.Vector3(0, 1, 0),
                this.currentRotation.y
            );

            if (this.controller.isFirstPerson) {
                direction.applyAxisAngle(
                    new THREE.Vector3(0, 1, 0),
                    this.cameraRotationY
                );
            }

            this.mesh.position.add(direction);
            this.mesh.rotation.copy(this.currentRotation);

            this.updateBoundingBox();
            if (this.checkCollision(carBoundingBoxes)) {
                // Revert to original position if collision is detected
                this.mesh.position.copy(originalPosition);
            } else {
                this.camera.setup(this.mesh.position, this.currentRotation, this.cameraRotationY, this.cameraRotationZ);
            }


            this.camera.setup(this.mesh.position, this.currentRotation, this.cameraRotationY, this.cameraRotationZ);

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
            shiftRight: false,
            shiftLeft: false,
            tiltRight: false,
            tiltLeft: false,
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
        // document.addEventListener("wheel", (e) => this.onMouseWheel(e), false);
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
            case "E".charCodeAt(0):
            case "e".charCodeAt(0):
                this.keys["tiltRight"] = true;
                break;
            case "Q".charCodeAt(0):
            case "q".charCodeAt(0):
                this.keys["tiltLeft"] = true;
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
            case 39:
                this.keys['shiftRight'] = true
                break;
            case 37:
                this.keys['shiftLeft'] = true
                break
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
            case "E".charCodeAt(0):
            case "e".charCodeAt(0):
                this.keys["tiltRight"] = false;
                break;
            case "Q".charCodeAt(0):
            case "q".charCodeAt(0):
                this.keys["tiltLeft"] = false;
                break;
            case 39:
                this.keys['shiftRight'] = false
                break;
            case 37:
                this.keys['shiftLeft'] = false
                break
        }
    }
}

export class ThirdPersonCamera {
    constructor(camera, positionOffSet, targetOffSet, isFirstPerson = false) {
        this.camera = camera;
        this.positionOffSet = positionOffSet;
        this.targetOffSet = targetOffSet;
        this.angle = 0;
        this.isFirstPerson = isFirstPerson;
    }

    orbit(target, radius, speed) {
        this.angle += speed;
        const x = target.x + radius * Math.cos(this.angle);
        const z = target.z + radius * Math.sin(this.angle);
        const y = target.y + this.positionOffSet.y;
        this.camera.position.set(x, y, z);
        this.camera.lookAt(target);
    }

    setup(target, angle, cameraRotationY = 0, cameraRotationZ = 0, xLevel = 0) {
        var temp = new THREE.Vector3(0, 0, 0);
        temp.copy(this.positionOffSet);
        temp.applyAxisAngle(new THREE.Vector3(angle.x, 1, 0), angle.y + cameraRotationY);
        // temp.applyAxisAngle(new THREE.Vector3(angle.y, 0, 1), angle.z);
        temp.add(target);

        this.camera.position.copy(temp);
        if (this.isFirstPerson) {
            this.camera.rotation.order = "YXZ"; // Ensure correct order of rotations
            this.camera.rotation.y = angle.y + Math.PI - cameraRotationY; // Yaw
            this.camera.rotation.x = -xLevel; // Pitch
            this.camera.rotation.z = cameraRotationZ; // Roll (if needed)
        } else {
            temp = new THREE.Vector3();
            temp.addVectors(target, this.targetOffSet);
            this.camera.lookAt(temp);
        }
    }
}