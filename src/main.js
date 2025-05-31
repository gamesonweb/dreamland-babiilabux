import { 
  Scene, 
} from "@babylonjs/core";
import { createEngine } from "./core/engine.js";
import { setupScene1 } from "./scenes/scene1.js";
import { setupScene2 } from "./scenes/scene2.js";
import { AdvancedDynamicTexture, Rectangle } from "@babylonjs/gui/2D";

// Overlay de transition global
let transitionTexture = null;
let transitionOverlay = null;

// Engine + Canvas
const { engine, canvas } = createEngine(); // Crée l'engine et le canvas
 

let cleanupCurrentScene = null;

function launchScene(setupSceneFn, ...args) {
    showTransition(engine, () => {
        if (cleanupCurrentScene) cleanupCurrentScene();
        cleanupCurrentScene = setupSceneFn(engine, canvas, ...args);
    });
}

// Fonctions de navigation
function goToScene1() {
    launchScene(setupScene1, goToScene2);
}
function goToScene2() {
    launchScene(setupScene2, goToScene1);
}

// Lancer la scène 1 au démarrage
goToScene1();

// Resize
window.addEventListener("resize", () => engine.resize());



// Fonction pour afficher un fondu noir
function showTransition(engine, callback) {
    if (!transitionTexture) {
        const tempScene = new Scene(engine);
        transitionTexture = AdvancedDynamicTexture.CreateFullscreenUI("TransitionUI", true, tempScene);
        transitionOverlay = new Rectangle();
        transitionOverlay.width = 1;
        transitionOverlay.height = 1;
        transitionOverlay.background = "black";
        transitionOverlay.alpha = 0;
        transitionTexture.addControl(transitionOverlay);
    }
    transitionOverlay.alpha = 0;
    transitionOverlay.isVisible = true;

    // Animation d'opacité (fade in)
    let alpha = 0;
    const fadeIn = setInterval(() => {
        alpha += 0.05;
        transitionOverlay.alpha = alpha;
        if (alpha >= 1) {
            clearInterval(fadeIn);
            if (callback) callback();
            // Animation d'opacité (fade out)
            let fadeOut = setInterval(() => {
                alpha -= 0.05;
                transitionOverlay.alpha = alpha;
                if (alpha <= 0) {
                    clearInterval(fadeOut);
                    transitionOverlay.isVisible = false;
                }
            }, 16);
        }
    }, 16);
}