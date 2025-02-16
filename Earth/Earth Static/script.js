// Fade in the website on load
window.addEventListener("load", () => {
    document.body.style.opacity = "1";
});

// Function to fade out the cover screen
function fadeOutCover() {
    const coverScreen = document.getElementById("coverScreen");
    if (coverScreen) {
        coverScreen.style.opacity = "0"; // Smooth fade-out
        setTimeout(() => {
            coverScreen.style.display = "none";
        }, 1500); // Remove after fade
    }
}

// Initialize Cesium
const viewer = new Cesium.Viewer('cesiumContainer', {
    terrainProvider: new Cesium.EllipsoidTerrainProvider(),
    imageryProvider: new Cesium.ArcGisMapServerImageryProvider({
        url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
    }),
    infoBox: false,
    selectionIndicator: false,
    baseLayerPicker: false,
    navigationHelpButton: false,
    homeButton: false,
    sceneModePicker: false,
    geocoder: false,
    fullscreenButton: false,
    timeline: false,
    animation: false,
    creditContainer: undefined,
    requestRenderMode: true,
    maximumRenderTimeChange: Infinity
});

// Hide Cesium credits
viewer.cesiumWidget.creditContainer.style.display = "none";

// Prevent camera movement when clicking the screen
viewer.scene.screenSpaceCameraController.enableRotate = false;
viewer.scene.screenSpaceCameraController.enableTranslate = false;
viewer.scene.screenSpaceCameraController.enableZoom = false;
viewer.scene.screenSpaceCameraController.enableTilt = false;
viewer.scene.screenSpaceCameraController.enableLook = false;

// Optimize rendering
viewer.scene.globe.enableLighting = false;
viewer.scene.globe.depthTestAgainstTerrain = false;
viewer.scene.fog.enabled = false;
viewer.scene.shadowMap.enabled = false;

// Wait for Cesium to load completely, then fade out the cover
viewer.scene.globe.tileLoadProgressEvent.addEventListener((event) => {
    if (event === 0) {
        fadeOutCover();
    }
});

// Initialize the Gemini spacecraft (PNG Image) with New Initial Position
const geminiAltitude = 2000000;
let geminiLat = 18.2000; // ✅ Updated Latitude
let geminiLon = -144.9500; // ✅ Updated Longitude
const geminiSpeed = 0.05; // 🔹 Slower movement for better control
let currentRotation = 0; // Keep track of current rotation

// Load images (only using up image + static)
const images = {
    idle: '../model/gemini.png',
    up: '../model/gemini-up.png'
};

// Gemini entity with PNG sprite
const gemini = viewer.entities.add({
    name: 'Gemini',
    position: Cesium.Cartesian3.fromDegrees(geminiLon, geminiLat, geminiAltitude),
    billboard: {
        image: images.idle,
        scale: 0.5, // 🔹 Smaller size
        alignedAxis: Cesium.Cartesian3.ZERO,
        disableDepthTestDistance: Number.POSITIVE_INFINITY, // 🔹 Ensures it always renders above the Earth
        eyeOffset: new Cesium.Cartesian3(0, 0, 500000), // 🔹 Moves the PNG above the Earth
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        verticalOrigin: Cesium.VerticalOrigin.CENTER,
        rotation: 0 // Default orientation
    }
});

// 🔹 Lock camera onto Gemini from the beginning (same as clicking on it manually)
viewer.trackedEntity = gemini;

// Set camera to initial position
viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(geminiLon, geminiLat - 10, 10000000), // 🔹 Adjusted for better start view
    orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-30),
        roll: 0
    }
});

// Get the coordinate elements from HTML
const latDisplay = document.getElementById("lat");
const lonDisplay = document.getElementById("lon");

// Key state tracking for smooth movement
let keysPressed = {};
let isMoving = false;

// Handle key press for movement (Instant Image Switching)
window.addEventListener('keydown', (e) => {
    keysPressed[e.key.toLowerCase()] = true;
    updateGeminiImage();
    if (!isMoving) {
        isMoving = true;
        requestAnimationFrame(updateGeminiMovement);
    }
});

// Handle key release to reset image to idle
window.addEventListener('keyup', (e) => {
    delete keysPressed[e.key.toLowerCase()];
    if (Object.keys(keysPressed).length === 0) {
        isMoving = false;
        setGeminiImage(images.idle, 0);
    }
});

// Function to update Gemini's image and determine rotation angle dynamically
function updateGeminiImage() {
    let newImage = images.up;
    let newRotation = 0;

    const movingUp = keysPressed['w'];
    const movingDown = keysPressed['s'];
    const movingLeft = keysPressed['a'];
    const movingRight = keysPressed['d'];

    if (movingUp && movingRight) {
        newRotation = Cesium.Math.toRadians(-45);
    } else if (movingUp && movingLeft) {
        newRotation = Cesium.Math.toRadians(45);
    } else if (movingDown && movingRight) {
        newRotation = Cesium.Math.toRadians(-135);
    } else if (movingDown && movingLeft) {
        newRotation = Cesium.Math.toRadians(135);
    } else if (movingUp) {
        newRotation = Cesium.Math.toRadians(0);
    } else if (movingDown) {
        newRotation = Cesium.Math.toRadians(180);
    } else if (movingLeft) {
        newRotation = Cesium.Math.toRadians(90);
    } else if (movingRight) {
        newRotation = Cesium.Math.toRadians(-90);
    }

    setGeminiImage(newImage, newRotation);
}

// ✅ FIX: Re-Added `setGeminiImage` function
function setGeminiImage(imagePath, rotation) {
    if (gemini.billboard.image !== imagePath || currentRotation !== rotation) {
        currentRotation = rotation;
        gemini.billboard.image = imagePath;
        gemini.billboard.rotation = rotation;
    }
}

// Function to smoothly update movement & update coordinates in HTML
function updateGeminiMovement() {
    let moved = false;

    if (keysPressed['w']) {
        geminiLat += geminiSpeed;
        moved = true;
    }
    if (keysPressed['s']) {
        geminiLat -= geminiSpeed;
        moved = true;
    }
    if (keysPressed['a']) {
        geminiLon -= geminiSpeed;
        moved = true;
    }
    if (keysPressed['d']) {
        geminiLon += geminiSpeed;
        moved = true;
    }

    if (moved) {
        gemini.position = Cesium.Cartesian3.fromDegrees(geminiLon, geminiLat, geminiAltitude);
        latDisplay.textContent = geminiLat.toFixed(4);
        lonDisplay.textContent = geminiLon.toFixed(4);
        requestAnimationFrame(updateGeminiMovement);
    }
}
