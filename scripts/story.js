/**
 * @type {HTMLCanvasElement}
 */
const canvas = document.getElementById("moma");
let ctx = canvas.getContext("2d");
canvas.width = 64;
canvas.height = 64;

ctx.imageSmoothingEnabled = false;
ctx.webkitImageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;

const IMAGES_FOLDER = "/images-ext/aseprite/moma/";

const MOMA_IMAGES = {
    crying: { image: new Image(), frames: 8 },
    gtoWaving: { image: new Image(), frames: 8 },
    waving: { image: new Image(), frames: 8 },
    walking: { image: new Image(), frames: 8 },
    idle: { image: new Image(), frames: 8 },
    happy: { image: new Image(), frames: 1 },
    talking1: { image: new Image(), frames: 1 },
    talking2: { image: new Image(), frames: 1 },
};

function loadImages() {
    // Set the source for each image
    Object.keys(MOMA_IMAGES).forEach((key) => {
        let img = MOMA_IMAGES[key];
        img.image.src = IMAGES_FOLDER + key + ".png";
    });

    // Wait for all images to load
    new Promise((resolve) => {
        let checkInterval = setInterval(() => {
            if (Object.values(MOMA_IMAGES).every((img) => img.image.complete)) {
                clearInterval(checkInterval);
                resolve();
            }
        }, 100);
    }).then(() => {
        start(); // Start the story mode
    });
}

let currentFrame = 0;
let currentAnimation = "idle";

function start() {
    animate();
}

let lastFrameTime = 0;

function animate(timestamp) {
    requestAnimationFrame(animate);

    if (timestamp - lastFrameTime < 100) return;
    lastFrameTime = timestamp;

    if (MOMA_IMAGES[currentAnimation].frames <= currentFrame) currentFrame = 0;

    let img = MOMA_IMAGES[currentAnimation].image;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img,
        currentFrame * 64, 0,
        64, 64,
        0, 0,
        64, 64
    );

    currentFrame++;
}


loadImages();