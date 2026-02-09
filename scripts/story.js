const storyMode = document.querySelector(".story-mode");
const dialogBox = storyMode.querySelector(".dialog");
const dialogText = dialogBox.querySelector(".text");
const dialogOptions = dialogBox.querySelector(".options");

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

async function chat(text, withAnimation = true, clear = true) {
    if (clear) dialogText.innerHTML = ""; else dialogText.innerHTML += "<br>";
    for (let i1 = 0; i1 < text.split(" ").length; i1++) {
        say(text.split(" ")[i1]);
        for (let i2 = 0; i2 < text.split(" ")[i1].length; i2++) {
            dialogText.innerHTML += text.split(" ")[i1][i2];

            if (withAnimation) {
                currentAnimation = "talking" + (i2 % 2 + 1);
                currentFrame = 0;

                if (i1 >= text.split(" ").length - 1 && i2 >= text.split(" ")[i1].length - 1) currentAnimation = "idle";
            }

            await sleep(100);
        }
        dialogText.innerHTML += " ";
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

const sleep = async (ms) => new Promise(r => setTimeout(r, ms));

async function buttonClick() {
    return await new Promise(resolve => {
        dialogOptions.querySelectorAll("button").forEach(button => {
            button.onclick = () => {
                resolve(button.textContent);
            };
        });
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

setInterval(() => {
    if (currentAnimation === "crying" && currentFrame !== 0) {
        runAudio("mi", 0.4 / currentFrame, 0.9 + Math.random() * 0.2);
    }
}, 333);

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

const storyParts = {
    join_wave: async () => {
        frameSpeed = 250;
        currentFrame = 0;
        currentAnimation = "walking";
        await sleep(280 * MOMA_IMAGES.walking.frames);
        frameSpeed = 100;
        currentFrame = 0;
        currentAnimation = "gtoWaving";
        await sleep(100 * MOMA_IMAGES.gtoWaving.frames);
        currentFrame = 0;
        currentAnimation = "waving";
        dialogBox.style.animation = "showDialog 0.5s forwards";
        await sleep(300);
        await chat("Hello There!", false);
        await sleep(3000);

        currentAnimation = "gtoWaving";
        currentFrame = MOMA_IMAGES[currentAnimation].frames - 3;
        reverseAnimation = true;
        await sleep(100 * MOMA_IMAGES.gtoWaving.frames / 2);

        await chat("I am MoMa, your guide!");
        await sleep(300);
    },
    ask_show_around: async (again) => {
        await chat(`${again ? "So" : "Do"} you want me to show you around?`);

        if (again) {
            currentFrame = 0;
            currentAnimation = "happy";
        }

        dialogOptions.style.animation = "showOptions 0.5s forwards";
        return (await buttonClick()) == "Yes";
    },
    ask_cancel_sure: async () => {
        dialogOptions.style.animation = "hideOptions 0.5s forwards";
        await chat("Are you sure??");
        currentFrame = 0;
        currentAnimation = "crying";
        dialogOptions.style.animation = "showOptions 0.5s forwards";
        return (await buttonClick()) === "Yes";
    },
    cancel_show_around: async () => {
        await chat("Ok bye...");

        frameSpeed = 250;
        currentFrame = MOMA_IMAGES.walking.frames - 1;
        currentAnimation = "walking";
        reverseAnimation = true;
        await sleep(250 * MOMA_IMAGES.walking.frames / 2);

        dialogBox.style.animation = "hideDialog 0.5s forwards";
        await sleep(300);
        storyMode.classList.remove("wbg");
    },
    start_questioning_show_around: async (again) => {
        if (await storyParts.ask_show_around(again)) {
            dialogOptions.style.animation = "hideOptions 0.5s forwards";
            return true;
        } else {
            let btnClk2 = await storyParts.ask_cancel_sure();
            dialogOptions.style.animation = "hideOptions 0.5s forwards";

            if (btnClk2) {
                await storyParts.cancel_show_around();
                return false;
            } else {
                return await storyParts.start_questioning_show_around(true);
            }
        }
    },
    show_around: async () => {
        await chat("Great!");

        if (window.innerWidth < 1024) {
            window.scrollTo({ top: 0, behavior: "smooth" });
            await sleep(500);

            storyMode.style.setProperty("--wbg-height", "0px");
        } else {
            storyMode.style.setProperty("--wbg-width", `calc(100% - (${document.querySelector(".me").clientWidth}px + ${getComputedStyle(document.querySelector("section")).marginLeft} + 10px))`);
        }

        await chat(`Here ${window.innerWidth > 1024 ? "on the left side" : ""} you can see my photo with my social links!`);
        dialogOptions.classList.add("ctn");
        dialogOptions.style.animation = "showOptions 0.5s forwards";

        await sleep(500);

        if (window.innerWidth < 1024) {
            storyMode.style.transform = `translate(50%, calc(-100% + ${dialogBox.clientHeight}px))`;
            storyMode.style.scale = "0.5";
        }

        await buttonClick();
        dialogOptions.style.animation = "hideOptions 0.5s forwards";
        await sleep(400);
        dialogOptions.classList.remove("ctn");


        if (window.innerWidth < 1024) {
            window.scrollTo({ top: document.querySelector(".aboutme").offsetTop - 20, behavior: "smooth" });
            await sleep(500);
        } else {
            storyMode.style.setProperty("--wbg-transform", `translate(calc(-${document.querySelector(".aboutme").clientWidth}px - ${getComputedStyle(document.querySelector("section")).marginRight} + 10px), 0)`);
            storyMode.style.setProperty("--wbg-width", `calc(100% - (${document.querySelector(".aboutme").clientWidth}px + ${getComputedStyle(document.querySelector("section")).marginRight} - 10px))`);
        }

        await chat("And here are all the pages we can explore!");
        await sleep(1000);

        if (window.innerWidth > 1024) {
            storyMode.style.setProperty("--wbg-transform", `translate(-1000%, 0)`);
            storyMode.style.setProperty("--wbg-height", `0px`);
            await sleep(400);
        }
        storyMode.classList.remove("wbg");

        storyMode.style.transform = `translate(50%, 50%)`;
        storyMode.style.scale = "0.5";

        dialogOptions.classList.add("ctn");
        dialogOptions.style.animation = "showOptions 0.5s forwards";
        await buttonClick();
        dialogOptions.style.animation = "hideOptions 0.5s forwards";
        await sleep(400);
        dialogOptions.classList.remove("ctn");

        await chat("Lets start with the services page!");

        await sleep(400);

        document.getElementById("page-Services").click();
        await sleep(500);
        window.scrollTo({ top: document.querySelector(".aboutme").offsetTop - 20, behavior: "smooth" });
        await chat("Here you can see all the services I offer!");
        await sleep(1000);
        await chat("Take your time exploring!", true, false);
        await sleep(1000);
        await chat("");

        dialogOptions.classList.add("ctn");
        dialogOptions.style.animation = "showOptions 0.5s forwards";
        await buttonClick();
        dialogOptions.style.animation = "hideOptions 0.5s forwards";
        await sleep(400);
        dialogOptions.classList.remove("ctn");


        await chat("Ok, Lets go now to the achivements page!");
        await sleep(400);
        document.getElementById("page-Achievements").click();
        await sleep(500);

        await chat("Here you can see all the achivements I have unlocked in my life!");
        await sleep(1000);
        await chat("If the place I was in had been better for me, I could have made even better achievements! :')");
        await sleep(2000);
        await chat("");

        dialogOptions.classList.add("ctn");
        dialogOptions.style.animation = "showOptions 0.5s forwards";

        if (window.innerWidth < 1024) {
            storyMode.style.transform = `translate(50%, calc(-100% + ${dialogBox.clientHeight}px))`;
        }

        await buttonClick();
        dialogOptions.style.animation = "hideOptions 0.5s forwards";
        await sleep(400);
        dialogOptions.classList.remove("ctn");


        await chat("Finally, Lets show you my projects!");
        await sleep(400);
        document.getElementById("page-Projects").click();
        await sleep(500);

        await chat("Here you can see all the projects I have worked on!");
        await sleep(1000);
        await chat("Take your time exploring!", true, false);
        await sleep(1000);
        await chat("");

        dialogOptions.classList.add("ctn");
        dialogOptions.style.animation = "showOptions 0.5s forwards";

        await buttonClick();
        dialogOptions.style.animation = "hideOptions 0.5s forwards";
        await sleep(400);
        dialogOptions.classList.remove("ctn");


        storyMode.style.transform = `unset`;
        storyMode.style.scale = "1";

        await chat("I think you got a good look around!");
        await sleep(400);
        document.querySelectorAll(".page-back")[0].click();
        await sleep(500);

        await chat("I hope you liked the tour and the website style!");
        await sleep(200);
        await chat("And I'm very happy if you contact me to start a project together!", true, false);
        await sleep(1500);
        await chat("I will leave you now, do what ever you want <3");
        await sleep(200);

        dialogOptions.querySelector("button:nth-of-type(3)").textContent = "Bye!";

        dialogOptions.classList.add("ctn");
        dialogOptions.style.animation = "showOptions 0.5s forwards";

        await buttonClick();
        dialogOptions.style.animation = "hideOptions 0.5s forwards";
        await sleep(400);
        dialogOptions.classList.remove("ctn");

        await storyParts.cancel_show_around();
    }
}

setInterval(() => {
    if (dialogOptions.clientHeight < 2) {
        dialogOptions.style.marginTop = "unset";
    } else if (dialogText.textContent.length > 1) {
        dialogOptions.style.marginTop = "";
    }
}, 500);

let fc = false;
window.onclick = async () => {
    if (fc) return;
    fc = true;

    await storyParts.join_wave();
    let showAround = await storyParts.start_questioning_show_around();
    if (!showAround) return;

    document.querySelectorAll(".page-back")[0].click();

    await storyParts.show_around();

}

function walkToThePage() {
    if (currentFrame === 0) momaPosition.x = reverseAnimation ? 0 : 32;

    if (reverseAnimation) {
        if (momaPosition.x < 36) {
            momaPosition.x += 32 / MOMA_IMAGES[currentAnimation].frames;
        }
    } else {
        if (momaPosition.x > 0) {
            momaPosition.x -= 32 / MOMA_IMAGES[currentAnimation].frames;
        }
    }

    if (currentFrame % 2 === 0) runAudio("step", 0.3, 0.9 + Math.random() * 0.2);

    if (reverseAnimation) {
        if (currentFrame <= 0) {
            momaPosition.x = 0;
            frameSpeed = 100;
            currentAnimation = "idle";
        }
    } else {
        if (currentFrame >= MOMA_IMAGES[currentAnimation].frames - 1) {
            momaPosition.x = 0;
            frameSpeed = 100;
            currentAnimation = "idle";
        }
    }
}


loadAssets();