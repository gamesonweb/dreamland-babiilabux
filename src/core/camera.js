import { FreeCamera, Vector3 } from "@babylonjs/core";

export function createCamera(scene, canvas) {
  const camera = new FreeCamera("FreeCamera", new Vector3(0, 2, 0), scene);
  camera.setTarget(new Vector3(0, 2.3, 2));
  camera.speed = 0.1;
  camera.angularSensibility = 1000;
  camera.checkCollisions = true;
  camera.applyGravity = true;
  camera.ellipsoid = new Vector3(0.5, 1, 0.5);
  camera.minZ = 0.1;

  // Configuration des contrôles clavier pour ZQSD
  camera.inputs.attached.keyboard.keysUp.push(90);    // Z 
  camera.inputs.attached.keyboard.keysUp.push(87);    // W 
  camera.inputs.attached.keyboard.keysLeft.push(81);  // Q 
  camera.inputs.attached.keyboard.keysLeft.push(65);  // A 
  camera.inputs.attached.keyboard.keysDown.push(83);  // S
  camera.inputs.attached.keyboard.keysRight.push(68);  // D

  // Attache les contrôles de la caméra au canvas
  camera.attachControl(canvas, true);

  return camera;
}