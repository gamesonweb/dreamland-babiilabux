import { StackPanel, TextBlock, Button, Rectangle, Control } from "@babylonjs/gui/2D";

// État de l'inventaire
let inventory = {
    flashlight: false,
    key: false,
    levier: false
};
let equippedItemName = null;

// UI Babylon.js
let inventoryPanel, inventoryLayout, itemList, itemDescription, helpButton, advancedTexture;

// Initialisation de l'UI de l'inventaire
export function createInventoryUI(scene) {
    advancedTexture = advancedTexture || scene.advancedTexture || scene.getEngine().getRenderingCanvas().advancedTexture;
    if (!advancedTexture) {
        advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene);
    }

    // Panneau principal
    inventoryPanel = new Rectangle();
    inventoryPanel.width = "300px";
    inventoryPanel.height = "100%";
    inventoryPanel.thickness = 0;
    inventoryPanel.background = "rgba(0, 0, 0, 0.8)";
    inventoryPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    inventoryPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    inventoryPanel.isVisible = false;
    advancedTexture.addControl(inventoryPanel);

    // Layout vertical
    inventoryLayout = new StackPanel();
    inventoryLayout.width = "100%";
    inventoryLayout.height = "100%";
    inventoryLayout.paddingTop = "10px";
    inventoryLayout.paddingLeft = "10px";
    inventoryLayout.paddingRight = "10px";
    inventoryPanel.addControl(inventoryLayout);

    // Bouton de fermeture
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
    itemList = new StackPanel();
    itemList.height = "200px";
    itemList.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    inventoryLayout.addControl(itemList);

    // Zone de description
    itemDescription = new TextBlock();
    itemDescription.text = "Sélectionnez un objet pour voir sa description";
    itemDescription.color = "white";
    itemDescription.fontSize = 16;
    itemDescription.textWrapping = true;
    itemDescription.height = "80px";
    itemDescription.paddingTop = "10px";
    inventoryLayout.addControl(itemDescription);

    // Bouton d'aide
    helpButton = Button.CreateSimpleButton("helpBtn", "Afficher les commandes");
    helpButton.width = "100%";
    helpButton.height = "40px";
    helpButton.color = "white";
    helpButton.background = "#666";
    helpButton.paddingTop = "20px";
    helpButton.onPointerUpObservable.add(() => {
        alert("Commandes :\n- [1] Équiper lampe\n- [2] Équiper clé\n- [3] Équiper levier\n- [R] Déséquiper\n- [E/I] Inventaire\n- [Esc] Fermer");
    });
    inventoryLayout.addControl(helpButton);

    updateInventoryUI();
}

// Met à jour l'affichage de l'inventaire
export function updateInventoryUI() {
    if (!itemList) return;
    itemList.clearControls();

    const createItemButton = (id, label, description) => {
        const isEquipped = equippedItemName === id;
        const btn = Button.CreateSimpleButton(id + "Btn", label);
        btn.width = "100%";
        btn.height = "30px";
        btn.color = "white";
        btn.background = isEquipped ? "#8854d0" : "#444";
        btn.onPointerUpObservable.add(() => {
            itemDescription.text = description;
            equipItem(id);
            updateInventoryUI();
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
    if (!inventory.flashlight && !inventory.key && !inventory.levier) {
        itemDescription.text = "(Inventaire vide)";
    }
}

// Ajoute un objet à l'inventaire
export function addItem(item) {
    inventory[item] = true;
    updateInventoryUI();
}

// Retire un objet de l'inventaire
export function removeItem(item) {
    inventory[item] = false;
    if (equippedItemName === item) {
        unequipItem();
    }
    updateInventoryUI();
}

// Vérifie si un objet est dans l'inventaire
export function hasItem(item) {
    return !!inventory[item];
}

// Équipe un objet (juste l'état, pas le mesh 3D)
export function equipItem(item) {
    if (!inventory[item]) return;
    if (equippedItemName === item) {
        unequipItem();
        return;
    }
    equippedItemName = item;
    updateInventoryUI();
}

// Déséquipe l'objet
export function unequipItem() {
    equippedItemName = null;
    updateInventoryUI();
}

// Affiche ou masque l'inventaire
export function toggleInventory() {
    if (inventoryPanel) {
        inventoryPanel.isVisible = !inventoryPanel.isVisible;
        updateInventoryUI();
    }
}

// Pour accès à l'état de l'inventaire depuis l'extérieur
export function getInventoryState() {
    return { ...inventory };
}

/**
 * Collecte un objet et l’ajoute à l’inventaire si besoin.
 * @param {string} item - "key", "flashlight", "levier"
 * @param {object} options - { mesh?: BABYLON.Mesh, onCollect?: function }
 */
export function collectItem(item, options = {}) {
    if (!hasItem(item)) {
        addItem(item);
        // La gestion du mesh (disable, hide, etc.) doit se faire dans la scène
        if (typeof options.onCollect === "function") {
            options.onCollect();
        }
    }
}