// Fade in the website on load
window.addEventListener("load", () => {
    document.body.style.opacity = "1";
});

// Function to fade out the cover screen
function fadeOutCover() {
    const coverScreen = document.getElementById("coverScreen");
    if (coverScreen) {
        coverScreen.style.opacity = "0";
        setTimeout(() => {
            coverScreen.style.display = "none";
        }, 1500);
    }
}

// Initialize Cesium
const viewer = new Cesium.Viewer('cesiumContainer', {
    terrainProvider: new Cesium.EllipsoidTerrainProvider(),
    baseLayer: Cesium.ImageryLayer.fromProviderAsync(
        Cesium.ArcGisMapServerImageryProvider.fromUrl(
            'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
        )
    ),
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
    requestRenderMode: false
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

// ✅ **Retrieve last saved position or default**
let geminiLat = parseFloat(sessionStorage.getItem("geminiLat")) || 18.2000;
let geminiLon = parseFloat(sessionStorage.getItem("geminiLon")) || -144.9500;
const geminiAltitude = 2000000;
const geminiSpeed = 0.1; // Adjusted for better control
let currentRotation = 0;

// ✅ **Load Images (Idle & Movement)**
const images = {
    idle: '../model/gemini.png',
    up: '../model/gemini-up.png'
};

// ✅ **Create Gemini Entity**
const gemini = viewer.entities.add({
    name: 'Gemini',
    position: Cesium.Cartesian3.fromDegrees(geminiLon, geminiLat, geminiAltitude),
    billboard: {
        image: images.idle,
        scale: 0.5,
        alignedAxis: Cesium.Cartesian3.ZERO,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        eyeOffset: new Cesium.Cartesian3(0, 0, 0),
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        verticalOrigin: Cesium.VerticalOrigin.CENTER,
        rotation: 0
    }
});

// ✅ **Lock Camera on Gemini**
viewer.trackedEntity = gemini;

// ✅ **Set Camera Initial View**
viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(geminiLon, geminiLat - 10, 10000000),
    orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-30),
        roll: 0
    }
});

// ✅ **Get Coordinate UI Elements**
const latDisplay = document.getElementById("lat");
const lonDisplay = document.getElementById("lon");

// ✅ **Key State Tracking**
let keysPressed = {};

// ✅ **Handle Key Press for Movement**
window.addEventListener('keydown', (e) => {
    keysPressed[e.key.toLowerCase()] = true;
    updateGeminiImage();
    if (!moveLoopRunning) {
        moveLoopRunning = true;
        requestAnimationFrame(updateGeminiMovement);
    }
});

// ✅ **Handle Key Release to Reset Image**
window.addEventListener('keyup', (e) => {
    delete keysPressed[e.key.toLowerCase()];
    if (Object.keys(keysPressed).length === 0) {
        setGeminiImage(images.idle, 0);
    }
});

// ✅ **Function to Update Gemini's Image**
function updateGeminiImage() {
    let newImage = images.up;
    let newRotation = 0;

    const movingUp = keysPressed['w'];
    const movingDown = keysPressed['s'];
    const movingLeft = keysPressed['a'];
    const movingRight = keysPressed['d'];

    if (movingUp && movingRight) newRotation = Cesium.Math.toRadians(-45);
    else if (movingUp && movingLeft) newRotation = Cesium.Math.toRadians(45);
    else if (movingDown && movingRight) newRotation = Cesium.Math.toRadians(-135);
    else if (movingDown && movingLeft) newRotation = Cesium.Math.toRadians(135);
    else if (movingUp) newRotation = Cesium.Math.toRadians(0);
    else if (movingDown) newRotation = Cesium.Math.toRadians(180);
    else if (movingLeft) newRotation = Cesium.Math.toRadians(90);
    else if (movingRight) newRotation = Cesium.Math.toRadians(-90);

    setGeminiImage(newImage, newRotation);
}

// ✅ **Function to Set Gemini's Image & Rotation**
function setGeminiImage(imagePath, rotation) {
    if (gemini.billboard.image !== imagePath || currentRotation !== rotation) {
        currentRotation = rotation;
        gemini.billboard.image = imagePath;
        gemini.billboard.rotation = rotation;
    }
}
 
// ✅ **Static Location Pins**
const locations = [
    { name: "West Coast", lat: 25.1000, lon: -121.4000, link: "../Nations/west.html" },
    { name: "East Coast", lat: 23.0000, lon: -77.2500, link: "../Nations/east.html" },
    { name: "South America", lat: -1.2000, lon: -68.8500, link: "../Nations/latin.html" },
    { name: "Europe", lat: 42.4500, lon: 34.1500, link: "../Nations/euro.html" },
    { name: "Africa", lat: 17.9500, lon: 32.2500, link: "../Nations/midl.html" },
    { name: "Asia", lat: 23.9500, lon: 138.8000, link: "../Nations/asia.html" },
    { name: "Australia", lat: -47.7000, lon: 151.5400, link: "../Nations/ausi.html" }
];

locations.forEach(loc => {
    viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(loc.lon-1, loc.lat + 13, 0), // ✅ Corrected Latitude Offset
        point: {
            pixelSize: 15, // ✅ Bigger for better visibility
            color: Cesium.Color.RED,
            outlineColor: Cesium.Color.WHITE, // ✅ Outline for better contrast
            outlineWidth: 2
        }
    });
});




// ✅ **Ensure Gemini Moves Correctly**
let moveLoopRunning = false;

function updateGeminiMovement() {
    let moved = false;

    if (keysPressed['w']) { geminiLat += geminiSpeed; moved = true; }
    if (keysPressed['s']) { geminiLat -= geminiSpeed; moved = true; }
    if (keysPressed['a']) { geminiLon -= geminiSpeed; moved = true; }
    if (keysPressed['d']) { geminiLon += geminiSpeed; moved = true; }

    if (moved) {
        gemini.position = Cesium.Cartesian3.fromDegrees(geminiLon, geminiLat, geminiAltitude);
        latDisplay.textContent = geminiLat.toFixed(4);
        lonDisplay.textContent = geminiLon.toFixed(4);
        checkProximity();
        requestAnimationFrame(updateGeminiMovement);
    } else {
        moveLoopRunning = false;
    }
}

// ✅ **Fix Proximity Check for Side Panel**
function checkProximity() {
    let panelVisible = false;

    locations.forEach(loc => {
        // Adjust longitude difference to correctly wrap around at -180/180
        let lonDiff = Math.abs(geminiLon - loc.lon);
        lonDiff = Math.min(lonDiff, 360 - lonDiff); // Ensures correct shortest distance

        const latDiff = Math.abs(geminiLat - loc.lat);
        const distance = Math.sqrt(Math.pow(latDiff, 2) + Math.pow(lonDiff, 2));

        if (distance <= 5) {
            panelVisible = true;
            const sidePanel = document.getElementById("side-panel");

            // ✅ Ensure Panel is Displayed
            sidePanel.classList.add("show");
            sidePanel.style.display = "block";
            sidePanel.style.opacity = "1";

            // ✅ Update Side Panel Content
            document.getElementById("country-name").textContent = loc.name;
            const reconButton = document.getElementById("recon-button");

            // ✅ Fix: Reset Event Listeners to Prevent Multiple Clicks
            reconButton.replaceWith(reconButton.cloneNode(true));
            document.getElementById("recon-button").addEventListener("click", () => {
                sessionStorage.setItem("geminiLat", geminiLat.toFixed(4));
                sessionStorage.setItem("geminiLon", geminiLon.toFixed(4));
                window.location.href = loc.link;
            });
        }
    });

    // ✅ If no location is close, hide the panel
    if (!panelVisible) {
        document.getElementById("side-panel").classList.remove("show");
        document.getElementById("side-panel").style.display = "none";
        document.getElementById("side-panel").style.opacity = "0";
    }

    // ✅ Function to Load Visited Locations on Earth Page
function loadVisitedChecklist() {
    let visited = JSON.parse(sessionStorage.getItem("visitedLocations")) || [];
    
    visited.forEach(location => {
        let checkbox = document.getElementById(location);
        if (checkbox) {
            checkbox.checked = true;
        }
    });
}

// ✅ Call Function When Earth Page Loads
window.addEventListener("load", loadVisitedChecklist);

}