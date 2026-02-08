const dialogBox = document.querySelector(".story-mode .dialog");
const dialogText = dialogBox.querySelector(".text");

/**
 * @type {HTMLCanvasElement}
 */
const canvas = document.getElementById("moma");
let ctx = canvas.getContext("2d");
canvas.width = 64;
canvas.height = 64;


const A = new (window.AudioContext || webkitAudioContext)();
let Audios = {};

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

["mi", "mo", "ma", "step"].forEach(k =>
    fetch("/sounds/" + k + ".wav")
        .then(r => r.arrayBuffer())
        .then(b => A.decodeAudioData(b))
        .then(b => Audios[k] = b)
);

const V = c => /[aei]/i.test(c) ? "mi" : /[ou]/i.test(c) ? "mo" : "ma";
function say(text) {
    let wordIndex = 0;
    const interval = setInterval(() => {
        const words = text.split(" ");

        const char = words[wordIndex++];
        if (char) runAudio(V(char[0]), 0.5, 0.85 + Math.random() * 0.1);

        if (wordIndex >= words.length) clearInterval(interval);

    }, 300);
};

function runAudio(filename, volume = 0.5, rate = 1) {
    const source = A.createBufferSource();
    const gain = A.createGain();

    source.buffer = Audios[filename];
    source.playbackRate.value = rate;
    gain.gain.value = volume;

    source.connect(gain).connect(A.destination);
    source.start();
}

async function chat(text) {
    dialogText.textContent = "";
    for (let i1 = 0; i1 < text.split(" ").length; i1++) {
        say(text.split(" ")[i1]);
        for (let i2 = 0; i2 < text.split(" ")[i1].length; i2++) {
            dialogText.textContent += text.split(" ")[i1][i2];
            await new Promise(r => setTimeout(r, 100));
        }
        dialogText.textContent += " ";
    }
}

function loadAssets() {
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
let lastFrameTime = 0;
let frameSpeed = 100;
let reverseAnimation = false;
let momaPosition = { x: 0, y: 0 };

function start() {
    animate();
}


function animate(timestamp) {
    requestAnimationFrame(animate);

    if (timestamp - lastFrameTime < frameSpeed) return;
    lastFrameTime = timestamp;

    let img = MOMA_IMAGES[currentAnimation].image;

    if (currentAnimation === "walking") walkToThePage();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img,
        currentFrame * 64, 0,
        64, 64,
        momaPosition.x, momaPosition.y,
        64, 64
    );

    if (reverseAnimation) {
        if (currentFrame > 0) currentFrame--;
        if (currentFrame <= 0) {
            reverseAnimation = false;
            currentAnimation = "idle";
        }
    } else {
        currentFrame++;
        if (MOMA_IMAGES[currentAnimation].frames <= currentFrame) currentFrame = 0;
    }
}


window.onclick = async () => {
    frameSpeed = 250;
    currentFrame = 0;
    currentAnimation = "walking";
    await new Promise(r => setTimeout(r, 250 * MOMA_IMAGES.walking.frames));
    frameSpeed = 100;
    currentFrame = 0;
    currentAnimation = "gtoWaving";
    await new Promise(r => setTimeout(r, 100 * MOMA_IMAGES.gtoWaving.frames));
    currentFrame = 0;
    currentAnimation = "waving";
    dialogBox.style.animation = "showDialog 0.5s forwards";
    await new Promise(r => setTimeout(r, 300));
    await chat("Hello There!");
    await new Promise(r => setTimeout(r, 3000));

    currentAnimation = "gtoWaving";
    currentFrame = MOMA_IMAGES[currentAnimation].frames - 3;
    reverseAnimation = true;

}

function walkToThePage() {
    if (currentFrame === 0) momaPosition.x = 32;

    if (momaPosition.x > 0) momaPosition.x -= 32 / MOMA_IMAGES[currentAnimation].frames;
    if (currentFrame % 2 === 0) runAudio("step", 0.3, 0.9 + Math.random() * 0.2);

    if (currentFrame >= MOMA_IMAGES[currentAnimation].frames - 1) {
        momaPosition.x = 0;
        frameSpeed = 100;
        currentAnimation = "idle";
    }
}


loadAssets();