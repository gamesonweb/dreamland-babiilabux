import { 
  Engine, 
  Scene, 
  FreeCamera, 
  HemisphericLight, 
  Vector3, 
  MeshBuilder, 
  StandardMaterial, 
  Color3,
  Texture,
  PBRMaterial,
  SceneLoader
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import { ActionManager, ExecuteCodeAction } from "@babylonjs/core/Actions";
import { createEngine } from "../core/engine.js";
import { createCamera } from "../core/camera";
import { createLighting } from "../core/lighting.js";
import { playAmbientSound } from "../core/sounds.js";
import { AdvancedDynamicTexture, StackPanel, TextBlock, Button, Rectangle, Control, Grid } from "@babylonjs/gui/2D";

export function setupScene2(engine, canvas){
    const scene = new Scene(engine);
    const camera = createCamera(scene, canvas);

  
// Sol 1
const ground = MeshBuilder.CreateGround("ground", { width: 10, height: 10, subdivisions: 100 }, scene);
const groundMaterial = new PBRMaterial("groundMaterial", scene);

groundMaterial.albedoTexture = new Texture("../Textures/floor_diffuse.jpg", scene);
groundMaterial.albedoTexture.uScale = 3;
groundMaterial.albedoTexture.vScale = 3;

groundMaterial.bumpTexture = null;
groundMaterial.invertNormalMapX = true; 
groundMaterial.invertNormalMapY = true;

groundMaterial.metallicTexture = new Texture("../Textures/floor_roughness.jpg", scene);
groundMaterial.useRoughnessFromMetallicTextureAlpha = false;
groundMaterial.useRoughnessFromMetallicTextureGreen = true;
groundMaterial.roughness = 1;

groundMaterial.displacementTexture = new Texture("../Textures/floor_displacement.jpg", scene);
groundMaterial.displacementScale = 0.2;
groundMaterial.displacementBias = 0;

ground.material = groundMaterial;
ground.checkCollisions = true;

// Toit



// Sol 2
const ground2 = MeshBuilder.CreateGround("ground2", { width: 10, height: 10, subdivisions: 100 }, scene);
const ground2Material = new PBRMaterial("ground2Material", scene);

ground2Material.albedoTexture = new Texture("../Textures/dream_floor.jpg", scene);
ground2Material.albedoTexture.uScale = 1;
ground2Material.albedoTexture.vScale = 1;

ground2Material.emissiveTexture = new Texture("../Textures/dream_floor.jpg", scene);
ground2Material.emissiveTexture.uScale = 1;
ground2Material.emissiveTexture.vScale = 1;

ground2Material.bumpTexture = null;
ground2Material.invertNormalMapX = true; 
ground2Material.invertNormalMapY = true;

ground2Material.metallicTexture = new Texture("../Textures/dream_floor.jpg", scene);
ground2Material.useRoughnessFromMetallicTextureAlpha = false;
ground2Material.useRoughnessFromMetallicTextureGreen = true;
ground2Material.roughness = 1;

ground2Material.displacementTexture = new Texture("../Textures/dream_floor.jpg", scene);
ground2Material.displacementScale = 0.2;
ground2Material.displacementBias = 0;

ground2.material = ground2Material;
ground2.checkCollisions = true;





const ceiling = MeshBuilder.CreateGround("ceiling", { width: 10, height: 10 }, scene);
const ceilingMaterial = new StandardMaterial("ceilingMat", scene);
ceilingMaterial.diffuseTexture = new Texture("../Textures/toit_diffuse.jpg", scene); // Ajout de la texture
ceilingMaterial.displacementTexture = new Texture("../Textures/toit_displacement.jpg", scene); // Ajout de la texture
ceilingMaterial.bumpTexture = new Texture("../Textures/toit_normal.jpg", scene); // Ajout de la texture
ceilingMaterial.metallicTexture = new Texture("../Textures/toit_rough.jpg", scene);
ceiling.material = ceilingMaterial;
ceiling.position = new Vector3(0, 4, 0);
ceiling.rotation = new Vector3(Math.PI, 0, 0);
ceiling.checkCollisions = true;



// Matériau PBR pour les murs
const wallMaterial = new PBRMaterial("wallMat", scene);
wallMaterial.albedoTexture = new Texture("../Textures/wall_brick_diffuse.jpg", scene);
wallMaterial.bumpTexture = new Texture("../Textures/wall_brick_normal.jpg", scene);
wallMaterial.metallicTexture = new Texture("../Textures/wall_brick_roughness.jpg", scene);
wallMaterial.displacementTexture = new Texture("../Textures/wall_brick_displacement.jpg", scene);
wallMaterial.backFaceCulling = false;


wallMaterial.bumpTexture.level = 1.0; // Niveau d'intensité de la texture normale
wallMaterial.roughness = 0.8; // Ajustez en fonction de l'effet désiré
wallMaterial.metallic = 0.1; // Ajustez en fonction du niveau métallique du matériau
wallMaterial.displacementScale = 0.2; // Ajuster cette valeur pour un relief plus ou moins marqué
wallMaterial.displacementBias = 0;  // Ajuster le biais pour décaler le relief si nécessaire

// Murs
// Mur 1 (devant)
const wall1 = BABYLON.MeshBuilder.CreatePlane("wall1", { width: 10, height: 4 }, scene);
wall1.material = wallMaterial;
wall1.position = new BABYLON.Vector3(0, 2, -5);
wall1.rotation = new BABYLON.Vector3(0, Math.PI, 0); // Rotation pour l'orientation correcte
wall1.checkCollisions = true;

// Mur 2 (gauche)
const wall2 = BABYLON.MeshBuilder.CreatePlane("wall2", { width: 10, height: 4 }, scene);
wall2.material = wallMaterial;
wall2.position = new BABYLON.Vector3(-5, 2, 0);
wall2.rotation = new BABYLON.Vector3(0, -Math.PI / 2, 0); // Orientation vers la gauche
wall2.checkCollisions = true;

// === Parchemin ===
const parcheminMaterial = new PBRMaterial("parcheminMat", scene);
parcheminMaterial.albedoTexture = new Texture("../Textures/AideParchemin.jpg", scene);
parcheminMaterial.albedoTexture.level = 1.0;
parcheminMaterial.metallic = 0.0;
parcheminMaterial.roughness = 0.9;
parcheminMaterial.invertNormalMapX = true;
parcheminMaterial.invertNormalMapY = true;

// Création du mesh - une fine plane posée sur une table
const parchemin = MeshBuilder.CreatePlane("parchemin", { width: 0.3, height: 0.2 }, scene);
parchemin.material = parcheminMaterial;

// Positionnement à plat sur une table (assume que la table est à y = 1 par exemple)
parchemin.rotation = new Vector3(Math.PI / 2, 0, 0);  // A plat
parchemin.position = new Vector3(3.6, 1.15, 4);         // Juste au-dessus de la surface de la table


    engine.runRenderLoop(() => scene.render());

    return () => {
        ui.dispose();
        scene.dispose();
    };

}