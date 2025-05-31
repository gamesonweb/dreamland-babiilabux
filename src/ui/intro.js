import { SceneLoader, Vector3 } from "@babylonjs/core";
import { AdvancedDynamicTexture, StackPanel, TextBlock, Button, Rectangle, Control } from "@babylonjs/gui/2D";


// === Texte qui défile ===
const introText = [
    "Appuie sur espace",
    "Ugh... que se passe-t-il ?",
    "Où suis-je ?",
    "Inconnu : Dans le monde des rêves",
    "Qui parle ?",
    "Répondez !",
    "Inconnu : Je ne peux rien te dire",
    "Inconnu : Pour l'instant tu es coincé ici",
    "Je comprends rien",
    "Inconnu : La réalité est un concept flou ici",
    "Appuie sur espace pour voir le mondes des rêves",
    "*Déplace la caméra avec la souris*",
    "*Bouge avec les flèches*",
    "*Active ton inventaire avec E*",
    "*Récupère un objet en cliquant dessus*",
    "*Equipe le avec la touche associée [1-9]*",
    "*Appuie sur echap pour quitter une interface*"
];


let canAdvanceText = true;
let currentTextIndex = 0;
let textBlock = null;
let canPlay = false;
let introPanel = null; // Référence globale au panneau d'introduction
let background = null; // Référence globale au fond sombre

export function showIntroText(introTexture, introText, currentTextIndex, camera, canvas) {
    // init panneau de d'introduction
    introPanel = new StackPanel();
    introTexture.addControl(introPanel);

    introPanel.width = "600px";
    introPanel.height = "150px";
    introPanel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    introPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;

    // Fond sombre avec une légère transparence
    background = new Rectangle();
    background.width = "100%";
    background.height = "100%";
    background.background = "rgba(0, 0, 0, 1)";
    introPanel.addControl(background);

    // Créer un TextBlock pour afficher les phrases
    textBlock = new TextBlock();
    textBlock.text = introText[currentTextIndex];
    textBlock.fontSize = 24;
    textBlock.color = "white";
    textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    textBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    introPanel.addControl(textBlock);

    // Ajouter le bouton "Skip" pour sauter l'introduction
    // Ajouter le bouton "Skip" pour sauter l'introduction
const skipButton = Button.CreateSimpleButton("skipBtn", "SKIP");
skipButton.width = "80px";
skipButton.height = "30px";
skipButton.color = "white";
skipButton.background = "#888"; // gris
skipButton.alpha = 0.8; // légèrement transparent
skipButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
skipButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
skipButton.top = "-10px";
skipButton.left = "-10px"; // décalage depuis le coin bas droit
    skipButton.onPointerUpObservable.add(() => {
    skipIntro(introTexture, camera, canvas); // Quand on clique sur "SKIP", on saute l'intro
});
introPanel.addControl(skipButton);
}

// Démarrer le jeu et masquer l'interface d'introduction
export function startGame(camera, canvas) {
    // Masquer l'interface du texte d'introduction (en supprimant le panneau entier)
    if (introPanel) {
        introPanel.dispose();
        introPanel = null;
    }
    if (background) { // <-- Ajoute ce test
        background.dispose();
        background = null;
    }
    if (textBlock) {
        textBlock.dispose();
        textBlock = null;
    }

    camera.attachControl(canvas, true);  // Permet à la caméra de suivre la souris sans clic
    // Permettre au joueur de commencer à jouer
    canPlay = true;
    
}

// Afficher le texte suivant
export function nextIntroText(camera, canvas) {
    if (!canAdvanceText) return;

    canAdvanceText = false; // Empêche les appels multiples rapides
    setTimeout(() => {
        canAdvanceText = true; // Autorise à nouveau le changement de texte après 1 seconde
    }, 1000);

    currentTextIndex++;
    if (currentTextIndex < introText.length) {
        textBlock.text = introText[currentTextIndex];

        // Changer la couleur et le style du texte selon le contenu
        if (introText[currentTextIndex].includes("*")) {
            textBlock.color = "white";
            textBlock.fontStyle = "bold italic";
        } else if (introText[currentTextIndex].includes("Inconnu")) {
            textBlock.color = "purple";
            textBlock.fontStyle = "italic";
        } else {
            textBlock.color = "white";
            textBlock.fontStyle = "normal";
        }
    } else {
        setTimeout(() => {
            startGame(camera, canvas); // Lancer le jeu après la fin de l'intro
        }, 300);
    }
}


export function skipIntro(introTexture, camera, canvas) {
    currentTextIndex = introText.length; // Avancer directement à la fin
    nextIntroText(camera, canvas); // Change le texte à la fin et commence le jeu

    // Supprimer tous les contrôles d'interface 2D, y compris l'intro
    if (introPanel) {
        

        introPanel.dispose();
        introPanel = null; // Réinitialiser la variable de référence
    }

    // Désactiver l'affichage de l'interface 2D
    introTexture.dispose();

    // Permettre au joueur de commencer à jouer
    canPlay = true;
    
    // Réactiver le contrôle de la caméra pour le jeu
    camera.attachControl(canvas, true); // Reprendre le contrôle de la caméra proprement
}


//=== export des variables ===
export {canPlay, canAdvanceText, introText, currentTextIndex, textBlock, introPanel, background};