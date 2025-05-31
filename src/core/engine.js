import { Engine } from "@babylonjs/core";

export function createEngine() {
  const canvas = document.getElementById("renderCanvas");
  const engine = new Engine(canvas, true);
  return { engine, canvas };
}