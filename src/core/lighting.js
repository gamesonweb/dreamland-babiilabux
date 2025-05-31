import { HemisphericLight, Vector3 } from "@babylonjs/core";

export function createLighting(scene, intensity) {
  const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
  light.intensity = intensity; // Intensité personnalisée
  return light;
}