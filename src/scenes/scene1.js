import {  
  Scene, 
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
import { createCamera } from "../core/camera";
import { createLighting } from "../core/lighting.js";
import { playAmbientSound } from "../core/sounds.js"; // import de la fonction pour le son ambiant
import { showIntroText, nextIntroText, skipIntro} from "../ui/intro.js";
import { canPlay, canAdvanceText, introText, currentTextIndex } from "../ui/intro.js";
import { AdvancedDynamicTexture, StackPanel, TextBlock, Button, Rectangle, Control, Grid } from "@babylonjs/gui/2D";
import { showAccueil } from "../ui/accueil.js";


export function setupScene1(engine, canvas, goToScene2) {
  // Création de la scène
const scene = new Scene(engine);
scene.collisionsEnabled = true;
// Lumière
const light = createLighting(scene, 0);


// Création de la caméras
const camera = createCamera(scene, canvas);

let flashlight = null;  // Référence globale à la lampe torche
let inventory = { flashlight: false, key: false }; // Inventaire

// Matériau pour la lampe torche
const flashlightMaterial = new BABYLON.StandardMaterial("flashlightMat", scene);
flashlightMaterial.diffuseColor = new BABYLON.Color3(1, 1, 0); // Jaune vif
flashlightMaterial.emissiveColor = new BABYLON.Color3(0.85, 0.73, 0.83);  // Lampe torche visible, bleue sous la spotlight


// Interface de l'inventaire
// Interface améliorée de l'inventaire
const introTexture = AdvancedDynamicTexture.CreateFullscreenUI("IntroUI", true, scene);
const uiTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene); // Pour l'inventaire
const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene);

// Charger la police Google Font (Cinzel)
const fontLink = document.createElement("link");
fontLink.href = "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap";
fontLink.rel = "stylesheet";
document.head.appendChild(fontLink);

const inventoryPanel = new Rectangle();
inventoryPanel.width = "300px";
inventoryPanel.height = "100%";
inventoryPanel.thickness = 0;
inventoryPanel.background = "rgba(0, 0, 0, 0.8)";
inventoryPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
inventoryPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
inventoryPanel.isVisible = false;
uiTexture.addControl(inventoryPanel);


// Contenu de l'inventaire
const inventoryLayout = new StackPanel();
inventoryLayout.width = "100%";
inventoryLayout.height = "100%";
inventoryLayout.paddingTop = "10px";
inventoryLayout.paddingLeft = "10px";
inventoryLayout.paddingRight = "10px";
inventoryPanel.addControl(inventoryLayout);

// 🟥 Bouton de fermeture (croix en haut)
const closeButton = Button.CreateSimpleButton("closeBtn", "❌");
closeButton.width = "30px";
closeButton.height = "30px";
closeButton.color = "white";
closeButton.background = "transparent";
closeButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
closeButton.onPointerUpObservable.add(() => {
    inventoryPanel.isVisible = false;
});
inventoryLayout.addControl(closeButton);

// Titre
const titleText = new TextBlock();
titleText.text = "Inventaire";
titleText.height = "40px";
titleText.color = "white";
titleText.fontSize = 24;
titleText.paddingBottom = "10px";
titleText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
inventoryLayout.addControl(titleText);

// Liste des objets
const itemList = new StackPanel();
itemList.height = "200px";
itemList.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
inventoryLayout.addControl(itemList);

// Zone de description
const itemDescription = new TextBlock();
itemDescription.text = "Sélectionnez un objet pour voir sa description";
itemDescription.color = "white";
itemDescription.fontSize = 16;
itemDescription.textWrapping = true;
itemDescription.height = "80px";
itemDescription.paddingTop = "10px";
inventoryLayout.addControl(itemDescription);

// 🔘 Bouton pour afficher les commandes
const helpButton = Button.CreateSimpleButton("helpBtn", "Afficher les commandes");
helpButton.width = "100%";
helpButton.height = "40px";
helpButton.color = "white";
helpButton.background = "#666";
helpButton.paddingTop = "20px";
helpButton.onPointerUpObservable.add(() => {
    // Tu peux ici afficher un autre panneau d’aide, par exemple :
    alert("Commandes :\n- [1] Équiper lampe\n- [2] Équiper clé\n- [R] Déséquiper\n- [E/I] Inventaire\n- [Esc] Fermer");
});
inventoryLayout.addControl(helpButton);

// Fonction pour mettre à jour l'inventaire
function updateInventoryText() {
    itemList.clearControls(); // Vide la liste d’objets

    const createItemButton = (id, label, description) => {
        const isEquipped = equippedItemName === id;

        const btn = Button.CreateSimpleButton(id + "Btn", label);
        btn.width = "100%";
        btn.height = "30px";
        btn.color = "white";
        btn.background = isEquipped ? "#8854d0" : "#444"; // Violet si équipé

        btn.onPointerUpObservable.add(() => {
            itemDescription.text = description;
            equipItem(id);
            updateInventoryText(); // Mettre à jour l’état visuel après clic
        });

        itemList.addControl(btn);
    };

    if (inventory.flashlight) {
        createItemButton("flashlight", "Lampe torche", "Lampe torche : Permet d'éclairer les zones sombres.");
    }

    if (inventory.key) {
        createItemButton("key", "Clé", "Clé : Permet d’ouvrir une porte verrouillée.");
    }
    if (inventory.levier) {
        
        createItemButton("levier", "Levier", "Un morceau de levier. Peut-être qu'il peut être utilisé quelque part ?");
    }

    if (!inventory.flashlight && !inventory.key) {
        itemDescription.text = "(Inventaire vide)";
    }
}


// Création du UI overlay noir
const blackOverlay = new Rectangle();
blackOverlay.width = 1;
blackOverlay.height = 1;
blackOverlay.color = "black";
blackOverlay.background = "black";
blackOverlay.alpha = 0;
advancedTexture.addControl(blackOverlay);
function animateOverlay(toAlpha, duration = 1000, callback = null) {
    const animation = new BABYLON.Animation("fade", "alpha", 60, 
        BABYLON.Animation.ANIMATIONTYPE_FLOAT,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);

    const keys = [
        { frame: 0, value: blackOverlay.alpha },
        { frame: 60, value: toAlpha }
    ];

    animation.setKeys(keys);

    blackOverlay.animations = [];
    blackOverlay.animations.push(animation);

    scene.beginAnimation(blackOverlay, 0, 60, false, 60 / duration * 1000, () => {
        if (callback) callback();
    });
}


let equippedItem = null; // Objet actuellement équipé
let flashlightOn = true; // La lampe est allumée par défaut

window.addEventListener("keydown", (event) => {
    if (event.key === "e" || event.key === "E" || event.key === "i" || event.key === "I") { inventoryPanel.isVisible = !inventoryPanel.isVisible ; updateInventoryText(); }
    if (event.key === "Escape") {
        puzzlePanel.isVisible = false;
        inventoryPanel.isVisible = false;
    }
    if (event.key === "1" || event.key === "&") equipItem("flashlight");
    if (event.key === "2" || event.key === "é") equipItem("key");
    if (event.key === "3" || event.key === '"') equipItem("levier");
    if (event.key === "r" || event.key === "R") unequipItem();

    // Éteindre la lampe torche si la barre espace est enfoncée
    if (event.code === "Space" && flashlightOn) {
        flashlightOn = false;

        animateOverlay(1, 10000, () => {
            if (spotlight) spotlight.intensity = 0;
            if (lampe) lampe.setEnabled(false);

            animateOverlay(0, 10000);
        });
    }
});

window.addEventListener("keyup", (event) => {
    if (event.code === "Space" && !flashlightOn) {
        animateOverlay(1, 10000, () => {
            flashlightOn = true;

            if (spotlight) spotlight.intensity = 50; // Remettre l’intensité souhaitée
            if (lampe) lampe.setEnabled(true);

            animateOverlay(0, 10000);
        });
    }
});




// Créer et afficher les textes d'introduction
showIntroText(introTexture, introText, currentTextIndex, camera, canvas);

// Écouter l'appui sur la touche espace pour passer à l'introduction suivante
scene.onKeyboardObservable.add((keyboardInfo) => {
    if (keyboardInfo.event.code === "Space" && canAdvanceText) {
        nextIntroText(camera, canvas);
    }
});

// Écouter la pression de la barre d'espace pour passer au texte suivant
function handleSpacebarEvent() {
    window.addEventListener("keydown", function(event) {
        if (event.key === " " && !canPlay) { // Assurez-vous que le jeu ne commence pas avant la fin de l'intro
            nextIntroText(camera, canvas);
        }
    });
}

// Initialiser le jeu
function initGame() {
    showIntroText(introTexture, introText, currentTextIndex, camera, canvas);   // Afficher le texte d'introduction
    handleSpacebarEvent(); // Gérer les événements de la barre d'espace
}

initGame();

  
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
parcheminMaterial.albedoTexture = new Texture("../Textures/ParcheminTableaux.png", scene);
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



// === Tableau 1 ===
const tableau1Material = new PBRMaterial("tableau1Mat", scene);
tableau1Material.albedoTexture = new Texture("../Textures/tableau1.png", scene);
tableau1Material.albedoTexture.level = 0.8;
tableau1Material.metallic = 0.0;
tableau1Material.roughness = 0.8;
tableau1Material.metallicTexture = new Texture("../Textures/wood_roughness.jpg", scene);
tableau1Material.useRoughnessFromMetallicTextureAlpha = false;
tableau1Material.bumpTexture = new Texture("../Textures/wood_normal.jpg", scene);
tableau1Material.invertNormalMapX = true;
tableau1Material.invertNormalMapY = true;

const tableau1 = MeshBuilder.CreatePlane("tableau1", { width: 2, height: 1.3 }, scene);
tableau1.position = new Vector3(-4.9, 2.15, 7.5);
tableau1.rotation = new Vector3(0, -Math.PI / 2, 0);
tableau1.material = tableau1Material;

// === Tableau 2 ===
const tableau2Material = new PBRMaterial("tableau2Mat", scene);
tableau2Material.albedoTexture = new Texture("../Textures/tableau2.png", scene);
tableau2Material.albedoTexture.level = 0.8;
tableau2Material.metallic = 0.0;
tableau2Material.roughness = 0.8;
tableau2Material.metallicTexture = new Texture("../Textures/wood_roughness.jpg", scene);
tableau2Material.useRoughnessFromMetallicTextureAlpha = false;
tableau2Material.bumpTexture = new Texture("../Textures/wood_normal.jpg", scene);
tableau2Material.invertNormalMapX = true;
tableau2Material.invertNormalMapY = true;
tableau2Material.backFaceCulling = false;

const tableau2 = MeshBuilder.CreatePlane("tableau2", { width: 2, height: 1.3 }, scene);
tableau2.position = new Vector3(-2.9, 2.15, 9.9);
tableau2.rotation = new Vector3(0, 0, 0);
tableau2.material = tableau2Material;

// === Tableau 3 ===
const tableau3Material = new PBRMaterial("tableau3Mat", scene);
tableau3Material.albedoTexture = new Texture("../Textures/tableau3.png", scene);
tableau3Material.albedoTexture.level = 0.8;
tableau3Material.metallic = 0.0;
tableau3Material.roughness = 0.8;
tableau3Material.metallicTexture = new Texture("../Textures/wood_roughness.jpg", scene);
tableau3Material.useRoughnessFromMetallicTextureAlpha = false;
tableau3Material.bumpTexture = new Texture("../Textures/wood_normal.jpg", scene);
tableau3Material.invertNormalMapX = true;
tableau3Material.invertNormalMapY = true;
tableau3Material.backFaceCulling = false;

const tableau3 = MeshBuilder.CreatePlane("tableau3", { width: 2, height: 1.3 }, scene);
tableau3.position = new Vector3(0, 2.15, 9.9);
tableau3.rotation = new Vector3(0, 0, 0);
tableau3.material = tableau3Material;


// Variable pour stocker l'angle actuel de rotation
let currentRotationtab1 = 0;

// Ajouter un gestionnaire d'événements pour détecter le clic
tableau1.actionManager = new BABYLON.ActionManager(scene);
tableau1.actionManager.registerAction(
    new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, function () {
        currentRotationtab1 += BABYLON.Tools.ToRadians(-22.5);
        
        // Appliquer la rotation autour de l'axe Y
        tableau1.rotation.z = currentRotationtab1;
        console.log(currentRotationtab1);
    })
);

let currentRotationtab2 = 0;

// Ajouter un gestionnaire d'événements pour détecter le clic
tableau2.actionManager = new BABYLON.ActionManager(scene);
tableau2.actionManager.registerAction(
    new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, function () {
        currentRotationtab2 += BABYLON.Tools.ToRadians(-22.5);
        
        // Appliquer la rotation autour de l'axe Y
        tableau2.rotation.z = currentRotationtab2;
        console.log(currentRotationtab2);
    })
);

let currentRotationtab3 = 0;

// Ajouter un gestionnaire d'événements pour détecter le clic
tableau3.actionManager = new BABYLON.ActionManager(scene);
tableau3.actionManager.registerAction(
    new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, function () {
        currentRotationtab3 += BABYLON.Tools.ToRadians(-22.5);
        
        // Appliquer la rotation autour de l'axe Y
        tableau3.rotation.z = currentRotationtab3;
        console.log(currentRotationtab3);
    })
);

const advancedTextureTab = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene);
// === GUI commune pour les tableaux ===
const tableauLabel = new BABYLON.GUI.TextBlock();
tableauLabel.text = "Cliquer pour tourner";
tableauLabel.color = "white";
tableauLabel.fontSize = 24;
tableauLabel.top = "-40px";
tableauLabel.isVisible = false;
advancedTextureTab.addControl(tableauLabel);

function createHoverHighlightForMesh(mesh, distanceThreshold = 4) {
    if (!mesh.actionManager) {
        mesh.actionManager = new BABYLON.ActionManager(scene);
    }

    // Active l'outline, couleur et largeur initiale à 0
    mesh.renderOutline = true;
    mesh.outlineWidth = 0;
    mesh.outlineColor = BABYLON.Color3.Black();

    mesh.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, function () {
            const distance = BABYLON.Vector3.Distance(mesh.position, camera.position);
            if (distance < distanceThreshold) {
                mesh.outlineWidth = 0.1; // active l’outline pour surbrillance
            }
        })
    );

    mesh.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, function () {
            mesh.outlineWidth = 0; // désactive l’outline
        })
    );
}



createHoverHighlightForMesh(tableau1);
createHoverHighlightForMesh(tableau2);
createHoverHighlightForMesh(tableau3);


const tableauReveMaterial = new BABYLON.StandardMaterial("tableauReveMat", scene);
tableauReveMaterial.diffuseColor = new BABYLON.Color3(1, 1, 0); // Jaune vif
tableauReveMaterial.emissiveColor = new BABYLON.Color3(0.85, 0.73, 0.83);  // Lampe torche visible, bleue sous la spotlight

const tableau1Reve = BABYLON.MeshBuilder.CreatePlane("tableau1Reve", { width: 1.8, height: 1.17 }, scene);
tableau1Reve.position = new BABYLON.Vector3(-4.85, 2.15, 7.5);
tableau1Reve.rotation = new BABYLON.Vector3(0, -Math.PI / 2, 0); 
tableau1Reve.material = tableauReveMaterial;
tableau1Reve.rotation.z = 0;

const tableau2Reve = BABYLON.MeshBuilder.CreatePlane("tableau2Reve", { width: 1.8, height: 1.17 }, scene);
tableau2Reve.position = new BABYLON.Vector3(-2.9, 2.15, 9.85);
tableau2Reve.rotation = new BABYLON.Vector3(0, 0, 0); 
tableau2Reve.material = tableauReveMaterial;
tableau2Reve.rotation.z = 90;

const tableau3Reve = BABYLON.MeshBuilder.CreatePlane("tableau3Reve", { width: 1.8, height: 1.17 }, scene);
tableau3Reve.position = new BABYLON.Vector3(0, 2.15, 9.85);
tableau3Reve.rotation = new BABYLON.Vector3(0, 0, 0); 
tableau3Reve.material = tableauReveMaterial;
tableau3Reve.rotation.z = 22.5;

tableau1Reve.isPickable = false;
tableau2Reve.isPickable = false;
tableau3Reve.isPickable = false;

let tableauxValide = false;

function procheDeLUnDes(valeur, listeValeurs, tolerance = 0.1) {
    return listeValeurs.some(v => Math.abs(valeur - v) < tolerance);
}

const valeursTab1 = [0, -Math.PI, -2 * Math.PI, -3 * Math.PI];
const valeursTab2 = [-1.1780972450961724, -4.319689898685965, -7.461282552275762, -10.602875205865558];
const valeursTab3 = [-2.748893571891069, -5.890486225480863, -9.03207887907066, -12.173671532660457];

function verifierOrientations() {
    // tolérance pour éviter problèmes avec les flottants (par ex. 0.0001)
    const tolerance = 0.01;

    const compareAngles = (a, b) => Math.abs(a - b) < tolerance;

    if (
        procheDeLUnDes(currentRotationtab1, valeursTab1) &&
        procheDeLUnDes(currentRotationtab2, valeursTab2) &&
        procheDeLUnDes(currentRotationtab3, valeursTab3)
    ) {
        tableauxValide = true;
        console.log("Tableaux validés !");
        return true;
        
    } else {
        tableauxValide = false;
        console.log("Tableaux non validés !");
        return false;
        

    }
}

function checkLighting() {
    let lightIntensity = 0;

    // Calculer l'intensité totale des lumières dans la scène
    scene.lights.forEach(light => {
        if (light.isEnabled() && light.intensity) {
            lightIntensity += light.intensity;
        }
    });

    // Définir un seuil d'intensité lumineuse (ex : 0.5)
    let seuilLuminosite = 0.5;

    // Ajuster la transparence du tableau en fonction de la lumière
    if (lightIntensity > seuilLuminosite) {
        tableau1Reve.visibility = 0;
        tableau2Reve.visibility = 0;
        tableau3Reve.visibility = 0;  // Rendre le tableau invisible
    } else {
        tableau1Reve.visibility = 1;
        tableau2Reve.visibility = 1;
        tableau3Reve.visibility = 1;  // Rendre le tableau visible
    }
}



// Mur 3 (droite)
const wall3 = BABYLON.MeshBuilder.CreatePlane("wall3", { width: 10, height: 4 }, scene);
wall3.material = wallMaterial;
wall3.position = new BABYLON.Vector3(5, 2, 0);
wall3.rotation = new BABYLON.Vector3(0, Math.PI / 2, 0); // Orientation vers la droite
wall3.checkCollisions = true;

// Mur 4 (derrière)
// Mur arrière (divisé en 2 pour laisser la place à la porte)
const wallThickness = 0.2; // Ajuste l'épaisseur selon ton besoin

const wall4Left = BABYLON.MeshBuilder.CreateBox("wall4Left", { width: 4.3, height: 4, depth: wallThickness }, scene);
wall4Left.material = wallMaterial;
wall4Left.position = new BABYLON.Vector3(-2.85, 2, 5); // Même position
wall4Left.checkCollisions = true;

const wall4Right = BABYLON.MeshBuilder.CreateBox("wall4Right", { width: 4.3, height: 4, depth: wallThickness }, scene);
wall4Right.material = wallMaterial;
wall4Right.position = new BABYLON.Vector3(2.85, 2, 5); // Même position
wall4Right.checkCollisions = true;

const wall4Middle = BABYLON.MeshBuilder.CreateBox("wall4Right", { width: 1.4, height: 1, depth: wallThickness }, scene);
wall4Middle.material = wallMaterial;
wall4Middle.position = new BABYLON.Vector3(0, 3.5, 5); // Même position
wall4Middle.checkCollisions = true;


// Ajout de la deuxième salle (même dimensions que la première)
const groundsalle2 = BABYLON.MeshBuilder.CreateGround("ground2", { width: 10, height: 10 }, scene);
groundsalle2.material = groundMaterial;
groundsalle2.position.z = 10; // Derrière la première salle
groundsalle2.checkCollisions = true;

const ground2salle2 = BABYLON.MeshBuilder.CreateGround("ground2", { width: 10, height: 10 }, scene);
ground2salle2.material = ground2Material;
ground2salle2.position.z = 10; // Derrière la première salle
ground2salle2.checkCollisions = true;



// Plafond de la deuxième salle
const ceiling2 = BABYLON.MeshBuilder.CreateGround("ceiling2", { width: 10, height: 10 }, scene);
ceiling2.material = ceilingMaterial;
ceiling2.position = new BABYLON.Vector3(0, 4, 10);
ceiling2.rotation = new BABYLON.Vector3(Math.PI, 0, 0);
ceiling2.checkCollisions = true;

// Murs de la deuxième salle
const wall5 = BABYLON.MeshBuilder.CreatePlane("wall5", { width: 10, height: 4 }, scene);
wall5.material = wallMaterial;
wall5.position = new BABYLON.Vector3(0, 2, 15);
wall5.rotation = new BABYLON.Vector3(0, Math.PI, 0);
wall5.checkCollisions = true;

const wall6 = BABYLON.MeshBuilder.CreatePlane("wall6", { width: 10, height: 4 }, scene);
wall6.material = wallMaterial;
wall6.position = new BABYLON.Vector3(-5, 2, 10);
wall6.rotation = new BABYLON.Vector3(0, -Math.PI / 2, 0);
wall6.checkCollisions = true;

const wall7 = BABYLON.MeshBuilder.CreatePlane("wall7", { width: 10, height: 4 }, scene);
wall7.material = wallMaterial;
wall7.position = new BABYLON.Vector3(5, 2, 10);
wall7.rotation = new BABYLON.Vector3(0, Math.PI / 2, 0);
wall7.checkCollisions = true;

// Mur 8 (tout au fond, retourné de 180°)
const wall8 = BABYLON.MeshBuilder.CreatePlane("wall8", { width: 10, height: 4 }, scene);
wall8.material = wallMaterial;
wall8.position = new BABYLON.Vector3(0, 2, 10); // Position arrière sur l'axe Z
wall8.checkCollisions = true;




// Création du matériau PBR pour la porte
const doorPBRMaterial = new PBRMaterial("doorPBRMat", scene);

// Texture diffuse (albedo)
doorPBRMaterial.albedoTexture = new Texture("../Textures/wood_door.jpg", scene);

// Texture de rugosité
doorPBRMaterial.metallicTexture = new Texture("../Textures/wood_roughness.jpg", scene);
doorPBRMaterial.roughness = 0.8;

// Normal map
doorPBRMaterial.bumpTexture = new Texture("../Textures/wood_normal.jpg", scene);
doorPBRMaterial.invertNormalMapX = true;
doorPBRMaterial.invertNormalMapY = true;

// Métallisation
doorPBRMaterial.metallic = 0.0;

// Affichage des deux faces
doorPBRMaterial.backFaceCulling = false;

// Création de la géométrie de la porte
const door = MeshBuilder.CreateBox("door", { height: 3, width: 1.4, depth: 0.1 }, scene);
door.setPivotPoint(new Vector3(0.7, 0, 0)); // Pivot à gauche

// Application du matériau
door.material = doorPBRMaterial;

// Positionnement
door.position = new Vector3(0, 1.5, 5);

// Collisions
door.checkCollisions = true;

// Variable d'ouverture
let doorOpen = false;


// Texte de feedback
const advancedTextureDoor = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene);
const doorLabel = new BABYLON.GUI.TextBlock();
doorLabel.text = "Porte verrouillée";
doorLabel.color = "white";
doorLabel.fontSize = 24;
doorLabel.top = "-40px";
doorLabel.isVisible = false;
advancedTextureDoor.addControl(doorLabel);

// Pour suivre la position de la porte
const labelLink = new BABYLON.GUI.Rectangle();
labelLink.isVisible = false;
advancedTextureDoor.addControl(labelLink);
doorLabel.linkWithMesh(door);

// Action Manager pour la porte
door.actionManager = new BABYLON.ActionManager(scene);

// Survol : afficher "porte verrouillée"
door.actionManager.registerAction(
    new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, function () {
        const distance = BABYLON.Vector3.Distance(door.position, camera.position);
        if (distance < 4) {
            if (equippedItem && equippedItem.name === '__root__') {
                doorLabel.text = " ";
            } else {
                doorLabel.text = "Porte verrouillée";
            }
            doorLabel.isVisible = true;
        }
    })
);


// Fin du survol : cacher le texte
door.actionManager.registerAction(
    new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, function () {
        doorLabel.isVisible = false;
    })
);

// Clic sur la porte
door.actionManager.registerAction(
    new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, function () {
        const distance = BABYLON.Vector3.Distance(door.position, camera.position);
        if (distance < 4 && equippedItem && equippedItem.name === '__root__') {
            if (!doorOpen) {
                doorLabel.isVisible = false;
                openDoor();
            }
        }
    })
);


function openDoor() {
    doorOpen = true;
    const animation = new BABYLON.Animation(
        "doorOpenAnimation",
        "rotation.y",
        30,
        BABYLON.Animation.ANIMATIONTYPE_FLOAT,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    const keys = [
        { frame: 0, value: 0 },
        { frame: 30, value: Math.PI / 2 }
    ];

    animation.setKeys(keys);
    door.animations = [animation];
    scene.beginAnimation(door, 0, 30, false);
}




async function loadBed() {
    try {
        const result = await SceneLoader.ImportMeshAsync("", "/models/", "bed_agape.glb", scene);
        if (result.meshes && result.meshes.length > 0) {
            let bed = result.meshes[0]; // Récupérer l'objet principal du modèle du lit

            // Ajuster la position pour placer le lit dans un coin
            bed.position = new Vector3(-3.2, 0, -3.7); // Ajuste en fonction de ta scène

            // Mise à l'échelle pour s'assurer que le lit a la bonne taille
            bed.scaling = new Vector3(0.015, 0.015, 0.015); // Ajuste selon la taille du modèle

            // Rotation si nécessaire
            bed.rotation.y = Math.PI / 2; // Tourne le lit de 90° si besoin
            bed.checkCollisions = true;

            console.log("Lit importé et positionné !");
        } else {
            console.error("Erreur : Aucun modèle GLB chargé.");
        }
    } catch (error) {
        console.error("Erreur lors du chargement du modèle GLB du lit : ", error);
    }
}

// Appel de la fonction pour charger le lit
loadBed();

let lampe = null; // Globalement accessible



let spotlight = null;


// === Charger la lampe et la lumière ===
async function loadLampe() {
    try {
        const result = await SceneLoader.ImportMeshAsync("", "/models/", "lantern.glb", scene);
        if (result.meshes && result.meshes.length > 0) {
            lampe = result.meshes[0];

            lampe.parent = camera;
            lampe.scaling = new BABYLON.Vector3(0.001, 0.001, 0.001);
            lampe.position = new BABYLON.Vector3(-0.15, -0.15, 0.4);
            lampe.rotation = new BABYLON.Vector3(0, 0, 0);
            lampe.checkCollisions = true;
            lampe.setEnabled(true);

            // Création de la lumière
            spotlight = new BABYLON.SpotLight(
                "lanternLight",
                lampe.getAbsolutePosition(),
                camera.getDirection(BABYLON.Vector3.Forward()),
                Math.PI / 3,
                2,
                scene
            );

            spotlight.intensity = 50;
            spotlight.range = 15;
            spotlight.falloffType = BABYLON.Light.FALLOFF_LINEAR;
            spotlight.diffuse = new BABYLON.Color3(1.0, 0.78, 0.4);
            spotlight.specular = new BABYLON.Color3(0.8, 0.6, 0.3);

            // Mettre à jour position/direction à chaque frame
            scene.onBeforeRenderObservable.add(() => {
                if (lampe && spotlight) {
                    spotlight.position = lampe.getAbsolutePosition();
                    spotlight.direction = camera.getDirection(BABYLON.Vector3.Forward());
                }
            });

            console.log("Lampe torche et lumière chargées !");
        } else {
            console.error("Erreur : Aucun mesh trouvé dans le modèle.");
        }
    } catch (error) {
        console.error("Erreur lors du chargement de la lampe torche :", error);
    }
}

loadLampe();


 // Masquer la lampe au début

async function loadBook() {
    try {
        const result = await SceneLoader.ImportMeshAsync("", "/models/", "book.glb", scene);
        const book = result.meshes[0]; // Récupérer l'objet principal du modèle du livre

        // Ajuster la position pour placer le livre dans la scène
        book.position = new Vector3(-2.7, 1.8, 4.25); // Ajuste en fonction de ta scène

        // Mise à l'échelle pour s'assurer que le livre a la bonne taille
        book.scaling = new Vector3(1, 1, 1); // Ajuste selon la taille du modèle

        // Rotation si nécessaire
        book.rotation.y = Math.PI / 2; // Tourne le livre de 90° si besoin
        book.checkCollisions = true;

        console.log("Livre importé et positionné !");
    } catch (error) {
        console.error("Erreur lors du chargement du modèle GLB : ", error);
    }
}

// Appel de la fonction pour charger le livre
loadBook();

async function loadDesk() {
    try {
        const result = await SceneLoader.ImportMeshAsync("", "/models/", "desk.glb", scene);
        if (result.meshes && result.meshes.length > 0) {
            let desk = result.meshes[0]; // Récupérer l'objet principal du modèle du bureau

            // Ajuster la position pour placer le bureau dans un coin
            desk.position = new Vector3(4, 0, 4.25); // Ajuste en fonction de ta scène

            // Mise à l'échelle pour s'assurer que le bureau a la bonne taille
            desk.scaling = new Vector3(1.25, 1.25, 1.25); // Ajuste selon la taille du modèle

            // Activer les collisions pour le modèle
            desk.checkCollisions = true;

            // Si nécessaire, activer un environnement sombre
            console.log("Bureau importé, positionné et visible seulement dans l'obscurité !");
        } else {
            console.error("Erreur : Aucun modèle GLB chargé.");
        }
    } catch (error) {
        console.error("Erreur lors du chargement du modèle GLB du bureau : ", error);
    }
}

// Appel de la fonction pour charger le bureau
loadDesk();


// Chargement du modèle GLB du bureau et chaise
async function loadCommonTableAndChair() {
    try {
        const result = await SceneLoader.ImportMeshAsync("", "/models/", "common_table_and_chair.glb", scene);
        if (result.meshes && result.meshes.length > 0) {
            let common_table_and_chair = result.meshes[0]; // Récupérer l'objet principal du modèle (table et chaise)

            // Ajuster la position pour placer la table et la chaise dans un coin
            common_table_and_chair.position = new Vector3(2, 0, -2); // Ajuste en fonction de ta scène

            // Mise à l'échelle pour s'assurer que la table et la chaise ont la bonne taille
            common_table_and_chair.scaling = new Vector3(0.006, 0.006, 0.006); // Ajuste selon la taille du modèle

            // Activer les collisions pour le modèle
            common_table_and_chair.checkCollisions = true;

            // Si nécessaire, activer un environnement sombre
            console.log("Table et chaise importées, positionnées et visibles seulement dans l'obscurité !");
        } else {
            console.error("Erreur : Aucun modèle GLB chargé.");
        }
    } catch (error) {
        console.error("Erreur lors du chargement du modèle GLB de la table et chaise : ", error);
    }
}

// Appel de la fonction pour charger la table et la chaise
loadCommonTableAndChair();


let key=null;

BABYLON.SceneLoader.ImportMesh("", "/models/", "key.glb", scene, function (meshes) {
    key = meshes[0]; // Récupérer l'objet principal du modèle

    // Ajuster la position pour placer le modèle dans la scène
    key.position = new BABYLON.Vector3(2, 1.05, -2); // Ajuste en fonction de ta scène

    // Mise à l'échelle du modèle pour s'assurer qu'il a la bonne taille
    key.scaling = new BABYLON.Vector3(0.0007, 0.0007, 0.0007); // Ajuste selon la taille du modèle

    // Réinitialiser la rotation
    key.rotation = new BABYLON.Vector3(0, 0, 0); // Réinitialiser la rotation initiale

    // Appliquer la rotation autour de l'axe X pour passer du vertical à l'horizontal
    key.rotation.x = Math.PI / 2;  // 90 degrés en radians (rotation autour de l'axe X)


    // Activer les collisions
    key.checkCollisions = true;
    meshes.forEach((mesh, index) => {
        console.log(`Mesh ${index}: ${mesh.name}`);
    });

    // Créer un matériau émissif pour le bureau
    let emissiveMaterial = new BABYLON.StandardMaterial("emissiveMat", scene);
    emissiveMaterial.emissiveColor = new BABYLON.Color3(0.85, 0.73, 0.83);  // Couleur bleue douce qui émane du bureau
    emissiveMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);  // Pas de couleur diffuse, reste noir dans la lumière
    emissiveMaterial.specularColor = new BABYLON.Color3(0, 0, 0);  // Pas de spéculaire, aucune brillance

    // Appliquer le matériau émissif à chaque mesh du modèle
    meshes.forEach((mesh) => {
        mesh.material = emissiveMaterial; // Appliquer le matériau à chaque partie du modèle
        mesh.isPickable = true; 
    });

    scene.ambientColor = new BABYLON.Color3(0, 0, 0); // Éclairage ambiant sombre pour forcer l'obscurité

    // Fonction pour vérifier l'intensité de la lumière de la scène
    function checkLighting() {
        // On récupère l'intensité totale des lumières dans la scène (exemple avec une lumière directionnelle)
        let lightIntensity = 0;
        scene.lights.forEach(light => {
            if (light.intensity) {
                lightIntensity += light.intensity;
            }
        });

        // Si l'intensité lumineuse est supérieure à un seuil (par exemple 0.5), on cache le bureau
        if (lightIntensity > 0.5) {
            key.setEnabled(false);  // Masquer le bureau si la lumière est assez forte
            ground2Material.alpha = 0; 
            ground2Material.emissiveColor = new BABYLON.Color3(0, 0, 0); // Pas d'émission
        } else {
            key.setEnabled(true);
            ground2Material.alpha = 1;  // Afficher le bureau si la lumière est faible
            ground2Material.emissiveColor = new BABYLON.Color3(1, 0.4, 0.6); // Blanc teinté de rose

        }
    }
    

    // Vérification de l'éclairage à chaque frame
    scene.onBeforeRenderObservable.add(() => {
        checkLighting();
    });
// Après le chargement du modèle et la création du label :

// Trouve le mesh "principal" pour le label (par exemple le premier mesh qui est pickable et visible)
const meshForLabel = meshes.find(m => m.isPickable && m.isVisible) || key;

const keyLabel = new BABYLON.GUI.TextBlock();
keyLabel.text = "Cliquer pour récupérer";
keyLabel.color = "white";
keyLabel.fontSize = 24;
keyLabel.top = "-40px";
keyLabel.isVisible = false;
advancedTextureDoor.addControl(keyLabel);
keyLabel.linkWithMesh(meshForLabel);

// ActionManager sur chaque mesh pour détecter les événements
meshes.forEach(mesh => { mesh.actionManager = new BABYLON.ActionManager(scene);

    // Stocke le matériau original
    const originalMaterial = mesh.material;

    mesh.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, function () {
            if (!key.isEnabled()) {
                return;
            }
            const distance = BABYLON.Vector3.Distance(mesh.position, camera.position);
            if (distance < 3) {
                // Appliquer un matériau de surbrillance (par exemple un matériau émissif)
                mesh.material = new BABYLON.StandardMaterial("highlightMat", scene);
                mesh.material.emissiveColor = new BABYLON.Color3(255, 255, 255); // jaune lumineux
            }
        })
    );

    mesh.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, function () {
            // Revenir au matériau original
            mesh.material = originalMaterial;
        })
    );

    mesh.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, function () {
            const distance = BABYLON.Vector3.Distance(mesh.position, camera.position);
            if (distance < 3) {
                equippedItem = key;
                key.setEnabled(false);
                mesh.material = originalMaterial; // Juste pour être sûr
            }
        })
    );
});


    
});

let safe=null;
BABYLON.SceneLoader.ImportMesh("", "/models/", "antique_iron_safe.glb", scene, function (meshes) {
    safe = meshes[0]; // Récupérer l'objet principal du modèle

    safe.position = new BABYLON.Vector3(4, 0.6, 9); // Ajuste en fonction de ta scène

    // Mise à l'échelle du modèle pour s'assurer qu'il a la bonne taille
    safe.scaling = new BABYLON.Vector3(1.1, 1.1, 1.1); // Ajuste selon la taille du modèle

    // Activer les collisions
    safe.checkCollisions = true;

    // Créer un matériau émissif pour le bureau
    let emissiveMaterial = new BABYLON.StandardMaterial("emissiveMat", scene);
    emissiveMaterial.emissiveColor = new BABYLON.Color3(0.85, 0.73, 0.83);  // Couleur bleue douce qui émane du bureau
    emissiveMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);  // Pas de couleur diffuse, reste noir dans la lumière
    emissiveMaterial.specularColor = new BABYLON.Color3(0, 0, 0);  // Pas de spéculaire, aucune brillance

    // Appliquer le matériau émissif à chaque mesh du modèle
    meshes.forEach((mesh) => {
        mesh.material = emissiveMaterial; // Appliquer le matériau à chaque partie du modèle
        mesh.isPickable = true; // Empêcher de cliquer sur le modèle
    });

    scene.ambientColor = new BABYLON.Color3(0, 0, 0); // Éclairage ambiant sombre pour forcer l'obscurité

    // Fonction pour vérifier l'intensité de la lumière de la scène
    function checkLighting() {
        // On récupère l'intensité totale des lumières dans la scène (exemple avec une lumière directionnelle)
        let lightIntensity = 0;
        scene.lights.forEach(light => {
            if (light.intensity) {
                lightIntensity += light.intensity;
            }
        });

        // Si l'intensité lumineuse est supérieure à un seuil (par exemple 0.5), on cache le bureau
        if (lightIntensity > 0.5) {
            safe.setEnabled(false);  // Masquer le bureau si la lumière est assez forte
            ground2Material.alpha = 0; 
            ground2Material.emissiveColor = new BABYLON.Color3(0, 0, 0); // Pas d'émission
        } else {
            safe.setEnabled(true);
            ground2Material.alpha = 1;  // Afficher le bureau si la lumière est faible
            ground2Material.emissiveColor = new BABYLON.Color3(1, 0.4, 0.6); // Blanc teinté de rose

        }
    }
    

    // Vérification de l'éclairage à chaque frame
    scene.onBeforeRenderObservable.add(() => {
        checkLighting();
    });
    
});





async function loadCupboard() {
    try {
        const result = await SceneLoader.ImportMeshAsync("", "/models/", "cupboard.glb", scene);
        if (result.meshes && result.meshes.length > 0) {
            let cupboard = result.meshes[0]; // Récupérer l'objet principal du modèle (armoire)

            // Ajuster la position pour placer l'armoire dans la scène
            cupboard.position = new Vector3(-2.5, 0, 4.75); // Ajuste en fonction de ta scène

            // Mise à l'échelle pour s'assurer que l'armoire a la bonne taille
            cupboard.scaling = new Vector3(0.008, 0.008, 0.008); // Ajuste selon la taille du modèle

            // Activer les collisions pour le modèle
            cupboard.checkCollisions = true;

            console.log("Armoire importée et positionnée !");
        } else {
            console.error("Erreur : Aucun modèle GLB chargé.");
        }
    } catch (error) {
        console.error("Erreur lors du chargement du modèle GLB de l'armoire : ", error);
    }
}

// Appel de la fonction pour charger l'armoire
loadCupboard();

async function loadBaseLevier() {
    try {
        const result = await SceneLoader.ImportMeshAsync("", "/models/", "base_levier.glb", scene);
        if (result.meshes && result.meshes.length > 0) {
            let BaseLevier = result.meshes[0]; // Récupérer l'objet principal du modèle (armoire)

            // Ajuster la position pour placer l'armoire dans la scène
            BaseLevier.position = new Vector3(4.9, 2, 7.5); // Ajuste en fonction de ta scène

            // Mise à l'échelle pour s'assurer que l'armoire a la bonne taille
            BaseLevier.scaling = new Vector3(0.0025, 0.0025, 0.0025); // Ajuste selon la taille du modèle
            BaseLevier.rotation = new Vector3(0, Math.PI*1.5, 0);
            // Activer les collisions pour le modèle
            BaseLevier.checkCollisions = true;

            console.log("Armoire importée et positionnée !");
        } else {
            console.error("Erreur : Aucun modèle GLB chargé.");
        }
    } catch (error) {
        console.error("Erreur lors du chargement du modèle GLB de l'armoire : ", error);
    }
}


// Appel de la fonction pour charger l'armoire
loadBaseLevier();





let levierFinAnimationGroup = null;
async function loadLevierFin() {
    try {
        const result = await SceneLoader.ImportMeshAsync("", "/models/", "levier.glb", scene);

        if (result.meshes && result.meshes.length > 0) {
            let levierFin = result.meshes[0];
            levierFin.position = new Vector3(4.9, 2, 7.5);
            levierFin.scaling = new Vector3(0.0025, 0.0025, 0.0025);
            levierFin.checkCollisions = true;

            console.log("Levier importé et positionné !");

            // Stocker l'animation sans la jouer
            if (result.animationGroups.length > 0) {
                levierFinAnimationGroup = result.animationGroups[0];

                // On stoppe et on fixe à la première frame SANS lancer l’animation
                levierFinAnimationGroup.stop();
                levierFinAnimationGroup.reset(); // met toutes les cibles à la frame de départ
            }

        } else {
            console.error("Erreur : Aucun levier chargé.");
        }
    } catch (error) {
        console.error("Erreur lors du chargement du levier : ", error);
    }
}


// Déplacements (avec gestion des touches multiples)
const keyboardMap = {}; // Carte pour les touches enfoncées
let speed = 0.1; // Vitesse de déplacement

scene.actionManager = new ActionManager(scene);
scene.actionManager.registerAction(new ExecuteCodeAction(
    ActionManager.OnKeyDownTrigger,
    (evt) => {
        keyboardMap[evt.sourceEvent.key.toLowerCase()] = true;
    }
));
scene.actionManager.registerAction(new ExecuteCodeAction(
    ActionManager.OnKeyUpTrigger,
    (evt) => {
        keyboardMap[evt.sourceEvent.key.toLowerCase()] = false;
    }
));


let levierPret =  false;
let levierEntierPret =  false;
let equippedItemName = null; // Nom de l'objet équipé
let keyHand = null;
// Fonction pour équiper un objet
function equipItem(item) {
    if (!inventory[item]) return; // Si l'objet n'est pas dans l'inventaire, ne rien faire
    if (equippedItemName === item) {
        unequipItem();
        equippedItemName = null;
        updateInventoryText();
        return;
    }

    unequipItem(); // Retire l'objet précédemment équipé

    switch (item) {
        case "key": // 🔑 Ajout de la clé avec le modèle 3D
            // Charger le modèle de la clé (clé.glb)
            BABYLON.SceneLoader.ImportMesh("", "/models/", "key.glb", scene, function (meshes) {
                let keyHand = meshes[0]; // Récupère le modèle de la clé (premier mesh)                
                // Positionne la clé dans la main droite du personnage
                keyHand.parent = camera;
                keyHand.position = new BABYLON.Vector3(0.22, -0.05, 0.4); // On va ajuster cette position plus bas
                keyHand.scaling = new BABYLON.Vector3(0.0003, 0.0003, 0.0003); // Ajuste l'échelle pour que la clé soit à la bonne taille
                let emissiveMaterial = new BABYLON.StandardMaterial("emissiveMat", scene);
                emissiveMaterial.emissiveColor = new BABYLON.Color3(0.85, 0.73, 0.83);  // Couleur bleue douce qui émane du bureau
                emissiveMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);  // Pas de couleur diffuse, reste noir dans la lumière
                emissiveMaterial.specularColor = new BABYLON.Color3(0, 0, 0);  // Pas de spéculaire, aucune brillance
            
                // Appliquer le matériau émissif à chaque mesh du modèle
                meshes.forEach((mesh) => {
                    mesh.material = emissiveMaterial; // Appliquer le matériau à chaque partie du modèle
                });
                equippedItem = keyHand;
                equippedItemName = item; // Met à jour le nom de l'objet équipé
                

            });
            break;
        case "parchemin":
            // === Parchemin ===
            const parcheminMaterial = new PBRMaterial("parcheminMat", scene);
            parcheminMaterial.albedoTexture = new Texture("../Textures/ParcheminTableaux.png", scene);
            parcheminMaterial.albedoTexture.level = 1.0;
            parcheminMaterial.metallic = 0.0;
            parcheminMaterial.roughness = 0.9;
            parcheminMaterial.invertNormalMapX = true;
            parcheminMaterial.invertNormalMapY = true;
            parcheminMaterial.emissiveTexture = new Texture("../Textures/ParcheminTableaux.png", scene);
            parcheminMaterial.emissiveColor = new Color3(1, 1, 1); // pleine intensité

            // Création du mesh - une fine plane posée sur une table
            const parchemin = MeshBuilder.CreatePlane("parchemin", { width: 0.3, height: 0.2 }, scene);
            parchemin.material = parcheminMaterial;
            parchemin.parent = camera;


            // Positionnement à plat sur une table (assume que la table est à y = 1 par exemple)
            parchemin.rotation = new Vector3(0, 0, 0);  // A plat
            parchemin.position = new Vector3(0.22, -0.05, 0.4);         // Juste au-dessus de la surface de la table
            equippedItem = parchemin;
            equippedItemName = item; // Met à jour le nom de l'objet équipé
            break;
    case "levier": // 🔑 Ajout de la clé avec le modèle 3D
            // Charger le modèle de la clé (clé.glb)
            
        let levierDebAnimationGroup = null;
        async function loadLevier() {
            try {
                const result = await SceneLoader.ImportMeshAsync("", "/models/", "levier.glb", scene);
                
                if (result.meshes && result.meshes.length > 0) {
                    let levier = result.meshes[0];
                    levier.position = new Vector3(0.12, -0.05, 0.25);
                    levier.scaling = new Vector3(0.0008, 0.0008, 0.0008);
                    levier.checkCollisions = true;
                    levier.parent=camera;
                    levier.rotation = new Vector3(Math.PI / 3, 0, 0);

                    console.log("Levier importé et positionné !");

                    // Stocker l'animation sans la jouer
                    if (result.animationGroups.length > 0) {
                        levierDebAnimationGroup = result.animationGroups[0];

                        // On stoppe et on fixe à la première frame SANS lancer l’animation
                        levierDebAnimationGroup.stop();
                        levierDebAnimationGroup.reset(); // met toutes les cibles à la frame de départ
                    }

                    equippedItem = levier;
                    equippedItemName = 'item';
                    levierPret = true; // Met à jour le nom de l'objet équipé
                    

                } else {
                    console.error("Erreur : Aucun levier chargé.");
                }
            } catch (error) {
                console.error("Erreur lors du chargement du levier : ", error);
            }
        }
        loadLevier();
        

    }

    // Fixe l'objet équipé à la main droite
    if (equippedItem) {
        equippedItem.parent = rightHand;
        equippedItem.position = new Vector3(0, 0, 0.15); // Position relative à la main
        equippedItem.rotation = new Vector3(Math.PI / 2, 0, 0); // Rotation ajustée
    }
}



// Fonction pour déséquiper l'objet de la main
function unequipItem() {
    console.log(equippedItem);
    if (equippedItem) {
        // Si l'objet équipé est une lampe torche, supprimer la lumière
        if (equippedItem.spotlight) {
            equippedItem.spotlight.dispose(); // Supprime la lumière associée
            equippedItem.spotlight = null; // Réinitialise la référence à la lumière
        }
        if (equippedItem.name === "keyHand") {
            console.log("Retire key")
            keyHand.parent = null;  // Détache la clé de la main
            keyHand.dispose(); // Supprime la clé de la scène
        }
        if (equippedItem.name === "levierHand") {
            console.log("Retire levier")
            levierHand.parent = null;  // Détache la clé de la main
            levierHand.dispose(); // Supprime la clé de la scène
        }
        
        equippedItem.dispose(); // Supprime l'objet de la main
        equippedItem = null; // Réinitialise la variable
    }
}

// Fonction pour collecter un objet
function collectItem(item) {
    console.log("Objet collecté : " + item);
    switch (item) {
        case "key":
            if (!inventory.key) {
                inventory.key = true;
                key.dispose(); // Supprime la clé de la scène
                updateInventoryText();
            }
            break;
        case "flashlight": // Gestion de la lampe torche
            if (!inventory.flashlight) {
                inventory.flashlight = true;
                flashlight.dispose(); // Supprime la lampe torche de la scène
                updateInventoryText();
            }
            break;
        case "levier": // Gestion de la lampe torche
            if (!inventory.levier) {
                inventory.levier = true;
                levier.dispose(); // Supprime la lampe torche de la scène
                updateInventoryText();
            }
            break;

    }
}

function createHitbox(name, size, position, showDebug = false, scene) {
    const hitbox = BABYLON.MeshBuilder.CreateBox(name, {
        width: size.x,
        height: size.y,
        depth: size.z
    }, scene);

    hitbox.position = new BABYLON.Vector3(position.x, position.y, position.z);
    hitbox.isPickable = true;
    hitbox.checkCollisions = true; // 🚫 empêche la caméra de traverser

    if (showDebug) {
        const debugMaterial = new BABYLON.StandardMaterial(name + "_mat", scene);
        debugMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0);
        debugMaterial.alpha = 0.3;
        hitbox.material = debugMaterial;
    } else {
        hitbox.visibility = 0;
    }

    return hitbox;
}


const bedHitbox = createHitbox(
    "triggerZone1",
    { x: 2.7, y: 3, z: 2.7 },            // Dimensions : largeur, hauteur, profondeur
    { x: -3.2, y: 0, z: -3.7 },          // Position
    false,                            // true pour afficher la hitbox
    scene                            // ta scène Babylon.js
);

const tableHitbox = createHitbox(
    "triggerZone1",
    { x: 2.7, y: 3, z: 3 },            // Dimensions : largeur, hauteur, profondeur
    { x: 2, y: 0, z: -2 },          // Position
    false,                            // true pour afficher la hitbox
    scene                            // ta scène Babylon.js
);

const deskHitbox = createHitbox(
    "triggerZone1",
    { x: 2, y: 3, z: 1.5 },            // Dimensions : largeur, hauteur, profondeur
    { x: 4, y: 0, z: 4.25 },          // Position
    false,                            // true pour afficher la hitbox
    scene                            // ta scène Babylon.js
);

const armoireHitbox = createHitbox(
    "triggerZone1",
    { x: 1.5, y: 3, z: 1.5 },            // Dimensions : largeur, hauteur, profondeur
    { x: -2.5, y: 0, z: 4.75 },          // Position
    false,                            // true pour afficher la hitbox
    scene                            // ta scène Babylon.js
);



// Panneau de notification
var notificationPanel = new BABYLON.GUI.Rectangle();
notificationPanel.width = "40%";
notificationPanel.height = "10%";
notificationPanel.cornerRadius = 10;
notificationPanel.color = "White";
notificationPanel.thickness = 3;
notificationPanel.background = "black";
notificationPanel.isVisible = false;
notificationPanel.top = "-30%"; // Position initiale hors écran
advancedTexture.addControl(notificationPanel);

var notificationText = new BABYLON.GUI.TextBlock();
notificationText.text = "";
notificationText.color = "white";
notificationText.fontSize = 24;
notificationPanel.addControl(notificationText);

// Fonction pour créer une animation avec callback
function animateNotification(property, from, to, onEnd = null) {
    let animation = new BABYLON.Animation(
        "notifAnim",
        property,
        60,
        BABYLON.Animation.ANIMATIONTYPE_STRING,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    let keys = [];
    keys.push({ frame: 0, value: from });
    keys.push({ frame: 20, value: to });
    animation.setKeys(keys);

    notificationPanel.animations = [];
    notificationPanel.animations.push(animation);

    let animatable = scene.beginAnimation(notificationPanel, 0, 20, false);
    
    if (onEnd) {
        animatable.onAnimationEnd = onEnd;
    }
}

// Fonction pour afficher une notification animée
function showNotification(message, color) {
    notificationText.text = message;
    notificationText.color = color;
    notificationPanel.isVisible = true;

    // Masquer après 3 secondes avec une animation de sortie
    setTimeout(() => {
            notificationPanel.isVisible = false;
    }, 3000);
}

var puzzlePanel = new BABYLON.GUI.Rectangle();
puzzlePanel.width = "50%";
puzzlePanel.height = "40%";
puzzlePanel.cornerRadius = 10;
puzzlePanel.color = "White";
puzzlePanel.thickness = 4;
puzzlePanel.background = "black";
puzzlePanel.isVisible = false;
advancedTexture.addControl(puzzlePanel);

// Création d'une grille pour aligner les chiffres horizontalement
var grid = new BABYLON.GUI.Grid();
grid.width = "100%";
grid.height = "80%";

// Ajouter 4 colonnes pour chaque chiffre
grid.addColumnDefinition(0.25);
grid.addColumnDefinition(0.25);
grid.addColumnDefinition(0.25);
grid.addColumnDefinition(0.25);

puzzlePanel.addControl(grid);

// Code secret
var colors = ["red", "blue", "green", "cyan"];
var selectors = [];
var enteredCode = [0, 0, 0, 0];
var secretCode = [3, 2, 1, 6];  // Exemple de code secret


// Création des cases de chiffres avec des couleurs différentes

for (let i = 0; i < 4; i++) {
    let stackPanel = new BABYLON.GUI.StackPanel();
    stackPanel.width = "100%";

    let label = new BABYLON.GUI.TextBlock();
    label.text = enteredCode[i].toString();
    label.color = colors[i];
    label.fontSize = 40;
    stackPanel.addControl(label);

    let buttonUp = BABYLON.GUI.Button.CreateSimpleButton("up" + i, "▲");
    buttonUp.width = "80px";
    buttonUp.height = "40px";
    buttonUp.onPointerClickObservable.add(() => {
        enteredCode[i] = (enteredCode[i] + 1) % 10;
        label.text = enteredCode[i].toString();
    });
    stackPanel.addControl(buttonUp);

    let buttonDown = BABYLON.GUI.Button.CreateSimpleButton("down" + i, "▼");
    buttonDown.width = "80px";
    buttonDown.height = "40px";
    buttonDown.onPointerClickObservable.add(() => {
        enteredCode[i] = (enteredCode[i] - 1 + 10) % 10;
        label.text = enteredCode[i].toString();
    });
    stackPanel.addControl(buttonDown);

    grid.addControl(stackPanel, 0, i); // Ajout dans la grille, ligne 0, colonne i
    selectors.push(label);
}

// Bouton pour valider le code
var validateButton = BABYLON.GUI.Button.CreateSimpleButton("validate", "Valider");
validateButton.top = "90px"; // Descend le bouton de 20 pixels
validateButton.width = "150px";
validateButton.height = "50px";
validateButton.color = "white";
validateButton.background = "green";
validateButton.onPointerClickObservable.add(() => {
    if (JSON.stringify(enteredCode) === JSON.stringify(secretCode)) {
        showNotification("✔️ Vous avez obtenu une partie du levier", "green");
        collectItem("levier");
        puzzlePanel.isVisible = false;
        safe.dispose(); // Supprime le coffre
        BABYLON.SceneLoader.ImportMesh("", "/models/", "antique_iron_safe_open.glb", scene, function (meshes) {
            let safe = meshes[0]; // Récupérer l'objet principal du modèle
        
            safe.position = new BABYLON.Vector3(4, 0.6, 9); // Ajuste en fonction de ta scène
        
            // Mise à l'échelle du modèle pour s'assurer qu'il a la bonne taille
            safe.scaling = new BABYLON.Vector3(1.1, 1.1, 1.1); // Ajuste selon la taille du modèle
        
            // Activer les collisions
            safe.checkCollisions = true;
        
            // Créer un matériau émissif pour le bureau
            let emissiveMaterial = new BABYLON.StandardMaterial("emissiveMat", scene);
            emissiveMaterial.emissiveColor = new BABYLON.Color3(0.85, 0.73, 0.83);  // Couleur bleue douce qui émane du bureau
            emissiveMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);  // Pas de couleur diffuse, reste noir dans la lumière
            emissiveMaterial.specularColor = new BABYLON.Color3(0, 0, 0);  // Pas de spéculaire, aucune brillance
        
            // Appliquer le matériau émissif à chaque mesh du modèle
            meshes.forEach((mesh) => {
                mesh.material = emissiveMaterial; // Appliquer le matériau à chaque partie du modèle
                mesh.isPickable = true; // Empêcher de cliquer sur le modèle
            });
        
            scene.ambientColor = new BABYLON.Color3(0, 0, 0); // Éclairage ambiant sombre pour forcer l'obscurité
        
            // Fonction pour vérifier l'intensité de la lumière de la scène
            function checkLighting() {
                // On récupère l'intensité totale des lumières dans la scène (exemple avec une lumière directionnelle)
                let lightIntensity = 0;
                scene.lights.forEach(light => {
                    if (light.intensity) {
                        lightIntensity += light.intensity;
                    }
                });
        
                // Si l'intensité lumineuse est supérieure à un seuil (par exemple 0.5), on cache le bureau
                if (lightIntensity > 0.5) {
                    safe.setEnabled(false);  // Masquer le bureau si la lumière est assez forte
                    ground2Material.alpha = 0; 
                    ground2Material.emissiveColor = new BABYLON.Color3(0, 0, 0); // Pas d'émission
                } else {
                    safe.setEnabled(true);
                    ground2Material.alpha = 1;  // Afficher le bureau si la lumière est faible
                    ground2Material.emissiveColor = new BABYLON.Color3(1, 0.4, 0.6); // Blanc teinté de rose
        
                }
            }
            
        
            // Vérification de l'éclairage à chaque frame
            scene.onBeforeRenderObservable.add(() => {
                checkLighting();
            });
            
        });

        
    } else {
        showNotification("❌ Mauvais code ! Réessayez.", "red");
        puzzlePanel.isVisible = false;
    }
});
puzzlePanel.addControl(validateButton);

let loadingScreenDisplayed = false;
let loadingInProgress = false; // nouvelle variable
let levierDebAnimationGroup = null;
// Intégration dans le clic sur le coffre
scene.onPointerDown = function (evt, pickResult) { 
    if (!pickResult.hit) return;

    console.log(pickResult.pickedMesh.name);

    if (pickResult.pickedMesh.name === "flashlight") collectItem("flashlight");
    if (pickResult.pickedMesh.name === "Object_2") collectItem("key");
    if (pickResult.pickedMesh.name === "Safe_LP_M_SafeFrontPanel_0") puzzlePanel.isVisible = true;
    if (pickResult.pickedMesh.name === "Object_10") collectItem("levier");

    if (pickResult.pickedMesh.name === "wall7" && levierPret === true && !levierEntierPret) {
        async function loadLevier() {
            try {
                const result = await SceneLoader.ImportMeshAsync("", "/models/", "levier.glb", scene);

                if (result.meshes && result.meshes.length > 0) {
                    let levierDeb = result.meshes[0];
                    levierDeb.position = new Vector3(4.9, 2, 7.5);
                    levierDeb.scaling = new Vector3(0.0025, 0.0025, 0.0025);
                    levierDeb.rotation = new Vector3(0, Math.PI * 1.5, 0);
                    levierDeb.checkCollisions = true;

                    console.log("Levier importé et positionné !");

                    if (result.animationGroups.length > 0) {
                        levierDebAnimationGroup = result.animationGroups[0];

                        // Reset l'animation
                        levierDebAnimationGroup.stop();
                        levierDebAnimationGroup.reset();
                    }
                } else {
                    console.error("Erreur : Aucun levier chargé.");
                }
            } catch (error) {
                console.error("Erreur lors du chargement du levier : ", error);
            }
        }

        loadLevier();
        unequipItem();

        levierEntierPret = true;
        console.log(tableau1.rotation.z);
        console.log(tableau2.rotation.z);
        console.log(tableau3.rotation.z); 
    }
    if (pickResult.pickedMesh.name === "wall7" && levierEntierPret === true && verifierOrientations() ) {
         levierDebAnimationGroup.play(false); // Jouer levier

    if (loadingInProgress) return;
    loadingInProgress = true;

    setTimeout(() => {
        if (loadingScreenDisplayed) return;
        loadingScreenDisplayed = true;

        // Créer l'overlay noir
        const blackOverlay = document.createElement("div");
        blackOverlay.id = "blackCinematic";
        blackOverlay.style.position = "fixed";
        blackOverlay.style.top = "0";
        blackOverlay.style.left = "0";
        blackOverlay.style.width = "100%";
        blackOverlay.style.height = "100%";
        blackOverlay.style.backgroundColor = "black";
        blackOverlay.style.zIndex = "9999";
        blackOverlay.style.overflow = "hidden";
        blackOverlay.style.display = "flex";
        blackOverlay.style.justifyContent = "center";
        blackOverlay.style.alignItems = "center";

        // Créer le conteneur du texte animé
        const scrollContainer = document.createElement("div");
        scrollContainer.style.position = "relative";
        scrollContainer.style.width = "80%";
        scrollContainer.style.maxWidth = "800px";
        scrollContainer.style.height = "100%";
        scrollContainer.style.display = "flex";
        scrollContainer.style.justifyContent = "center";
        scrollContainer.style.alignItems = "center";
        scrollContainer.style.overflow = "hidden";

        const scrollText = document.createElement("div");
        scrollText.style.position = "absolute";
        scrollText.style.bottom = "-100%";
        scrollText.style.color = "white";
        scrollText.style.fontSize = "1.5em";
        scrollText.style.lineHeight = "2em";
        scrollText.style.textAlign = "center";
        scrollText.style.animation = "scrollUp 30s linear forwards";
        scrollText.style.fontFamily = "'Cinzel', serif";

        scrollText.innerHTML = `
            <p>Le levier s'abaisse lentement dans un grondement sourd...</p>
            <p>Les lumières vacillent, puis s’éteignent une à une.</p>
            <p>Inconnu : Bien, tu as réussi la première épreuve</p>
            <p>Inconnu : La frontière entre la réalité et le mondes des rêves s'écroule</p>
            <p>Inconnu : Mais tu n'es pas encore sauvé </p>
            <p>Inconnu : Il te reste encore un long et sinueux chemin à parcourir</p>
            <p>Es-tu prêt pour le deuxième niveau ?</p>
            <p>...</p>
            <p>Merci d’avoir joué.</p>
            <p>Créateurs :</p>
            <p>Nathan GUIRAL</p>
            <p>Paul LE CAIGNEC</p>
            <p>L3 MIAGE</p>
            <p>Dans le cadre de Games on Web</p>
        `;

        // Ajouter l'animation CSS
        const style = document.createElement("style");
        style.innerHTML = `
            @keyframes scrollUp {
                0% { bottom: -100%; }
                100% { bottom: 100%; }
            }
        `;

        document.head.appendChild(style);
        scrollContainer.appendChild(scrollText);
        blackOverlay.appendChild(scrollContainer);
        document.body.appendChild(blackOverlay);

        // Optionnel : bouton de fermeture après l'animation
        setTimeout(() => {
            const button = document.createElement("button");
            button.textContent = "Continuer";
            button.style.position = "absolute";
            button.style.bottom = "40px";
            button.style.left = "50%";
            button.style.transform = "translateX(-50%)";
            button.style.padding = "10px 20px";
            button.style.fontSize = "1em";
            button.style.border = "none";
            button.style.borderRadius = "8px";
            button.style.backgroundColor = "#ffffff";
            button.style.color = "#000000";
            button.style.cursor = "pointer";
            button.style.zIndex = "10000";

            button.onclick = () => {
                blackOverlay.remove();
                loadingInProgress = false;
                // goToScene2(); // <-- tu peux le décommenter si tu veux
            };

            blackOverlay.appendChild(button);
        }, 31000); // après le scroll (30s)

    }, 3000); // après le levier
}
}



showAccueil(scene, () => {
    startGame(camera, canvas);
});

// Intégration dans le clic sur le coffre
scene.registerBeforeRender(checkLighting);

// Boucle de rendu
engine.runRenderLoop(() => scene.render());
window.addEventListener("resize", () => engine.resize());


}