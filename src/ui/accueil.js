import { AdvancedDynamicTexture, StackPanel, TextBlock, Button, Control, Image } from "@babylonjs/gui/2D";



/**
 * Affiche l'écran d'accueil et appelle onStart() quand le joueur clique sur "Démarrer".
 * @param {BABYLON.Scene} scene
 * @param {Function} onStart 
 * @returns {AdvancedDynamicTexture} 
 */
export function showAccueil(scene, onStart) {
    const accueilUI = AdvancedDynamicTexture.CreateFullscreenUI("AccueilUI", true, scene);

    // Image de fond
    const backgroundImage = new Image("backgroundImage", "/Textures/accueil.png");
    backgroundImage.stretch = Image.STRETCH_UNIFORM; // Ajuste l'image pour qu'elle s'adapte à l'écran
    accueilUI.addControl(backgroundImage);

    // Panneau centré
    const panel = new StackPanel();
    panel.width = "500px";
    panel.height = "350px";
    panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    accueilUI.addControl(panel);

    // Titre du jeu
    const title = new TextBlock();
    title.text = "ONEIROPHOBIA";
    title.fontSize = 60;
    title.color = "white";
    title.height = "120px";
    title.paddingBottom = "40px";
    title.fontStyle = "bold";
    title.fontFamily = "LucanyMore, cursive";
    panel.addControl(title);

    // Bouton "Démarrer"
    const startButton = Button.CreateSimpleButton("startButton", "Démarrer");
    startButton.width = "220px";
    startButton.height = "70px";
    startButton.color = "#7a2e1b"; // Texte rouge/marron foncé
    startButton.background = "#b39ddb"; // Violet clair
    startButton.fontSize = 28;
    startButton.cornerRadius = 20;
    startButton.thickness = 6;
    startButton.borderColor = "#7a2e1b"; // Bordure marron foncé
    startButton.paddingTop = "20px";

    // Effet d'ombre portée 
    startButton.shadowOffsetX = 4;
    startButton.shadowOffsetY = 4;
    startButton.shadowColor = "#6d3b1a";
    startButton.onPointerUpObservable.add(() => {
        accueilUI.dispose(); // Supprime l'écran d'accueil
        if (onStart) onStart();
    });
    panel.addControl(startButton);

    const subtitle = new TextBlock();
    subtitle.text = "Cliquez sur Démarrer pour jouer";
    subtitle.fontSize = 22;
    subtitle.color = "#cccccc";
    subtitle.height = "60px";
    subtitle.paddingTop = "30px";
    panel.addControl(subtitle);

    return accueilUI;
}