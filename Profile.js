const canvas = document.getElementById("snow");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
const sparkCanvas = document.getElementById("click-spark");
const sparkCtx = sparkCanvas.getContext("2d");
const cursorPoint = document.querySelector(".cursor-point");

let snowflakes = [];
let sparks = [];
let cursorFrame;
const sparkSize = 10;
const sparkCount = 5;
const sparkRadius = 15;
const sparkDuration = 450;
const sparkScale = 0.6;

function updateCursorPoint(event) {
    cancelAnimationFrame(cursorFrame);
    cursorFrame = requestAnimationFrame(() => {
        cursorPoint.style.left = `${event.clientX}px`;
        cursorPoint.style.top = `${event.clientY}px`;
        cursorPoint.classList.add("is-visible");
    });
}

document.addEventListener("pointermove", updateCursorPoint);
document.addEventListener("pointerleave", () => {
    cursorPoint.classList.remove("is-visible");
});

function resizeSparkCanvas() {
    sparkCanvas.width = window.innerWidth;
    sparkCanvas.height = window.innerHeight;
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    createSnow();
}

function createSnow() {
    snowflakes = [];

    const amount = Math.floor(
        (canvas.width * canvas.height) / 10000
    );

    for (let i = 0; i < amount; i++) {
        snowflakes.push({
            x: Math.random() * canvas.width,

            y: Math.random() * canvas.height,

            size: Math.random() < 0.75
                ? 3
                : Math.random() * 4 + 3,

            speed: Math.random() * 1.2 + 0.4,

            drift: Math.random() * 0.6 - 0.3
        });
    }
}

function drawSnow() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#c47f2c";

    for (const snow of snowflakes) {

        /*
         * Rectangle instead of circle
         * = pixel-style snow
         */
        ctx.fillRect(
            Math.floor(snow.x),
            Math.floor(snow.y),
            Math.floor(snow.size),
            Math.floor(snow.size)
        );

        snow.y += snow.speed;
        snow.x += snow.drift;

        // When snow reaches bottom
        if (snow.y > canvas.height) {
            snow.y = -snow.size;
            snow.x = Math.random() * canvas.width;
        }

        // Keep snow inside horizontal boundaries
        if (snow.x > canvas.width) {
            snow.x = 0;
        }

        if (snow.x < 0) {
            snow.x = canvas.width;
        }
    }

    requestAnimationFrame(drawSnow);
}

function drawSparks(timestamp) {
    sparkCtx.clearRect(0, 0, sparkCanvas.width, sparkCanvas.height);

    sparks = sparks.filter(spark => {
        const progress = Math.min((timestamp - spark.startTime) / sparkDuration, 1);
        const eased = progress * (2 - progress);

        if (progress >= 1) {
            return false;
        }

        const distance = eased * sparkRadius * sparkScale;
        const lineLength = sparkSize * (1 - eased);
        const startX = spark.x + distance * Math.cos(spark.angle);
        const startY = spark.y + distance * Math.sin(spark.angle);
        const endX = spark.x + (distance + lineLength) * Math.cos(spark.angle);
        const endY = spark.y + (distance + lineLength) * Math.sin(spark.angle);

        sparkCtx.strokeStyle = "#c47f2c";
        sparkCtx.lineWidth = 2;
        sparkCtx.beginPath();
        sparkCtx.moveTo(startX, startY);
        sparkCtx.lineTo(endX, endY);
        sparkCtx.stroke();

        return true;
    });

    requestAnimationFrame(drawSparks);
}

document.addEventListener("click", event => {
    const now = performance.now();

    for (let i = 0; i < sparkCount; i++) {
        sparks.push({
            x: event.clientX,
            y: event.clientY,
            angle: (2 * Math.PI * i) / sparkCount,
            startTime: now
        });
    }

});

document.querySelectorAll("[data-share]").forEach(button => {
    button.addEventListener("click", event => {
        event.stopPropagation();
        const shareType = button.dataset.share;
        const pageUrl = window.location.href;
        const shareText = "You Found Vaibhav's Page ✦";

        if (shareType === "copy") {
            navigator.clipboard?.writeText(pageUrl);
            button.setAttribute("aria-label", "Link copied");
            button.classList.add("is-copied");
            setTimeout(() => {
                button.setAttribute("aria-label", "Copy link");
                button.classList.remove("is-copied");
            }, 900);
            return;
        }

        const shareUrls = {
            twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(pageUrl)}`,
            instagram: "https://www.instagram.com/",
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`
        };

        window.open(shareUrls[shareType], "_blank", "noopener,noreferrer");
    });
});

const profileMenu = document.querySelector(".profile-menu");
const profileTrigger = document.querySelector(".profile-trigger");
const profileDropdown = document.querySelector(".profile-dropdown");
const achievementAlert = document.querySelector("#achievement-alert");
const achievementClose = document.querySelector(".achievement-close");
const achievementSound = new Audio("orb.mp3");
const clickSound = new Audio("minecraft_click.mp3");
achievementSound.preload = "auto";
achievementSound.volume = 1;
clickSound.preload = "auto";
clickSound.volume = 1;
clickSound.load();

const clickAudioContext = window.AudioContext || window.webkitAudioContext;
const clickContext = clickAudioContext ? new clickAudioContext() : null;
let clickBuffer;

if (clickContext) {
    fetch("minecraft_click.mp3")
        .then(response => response.arrayBuffer())
        .then(data => clickContext.decodeAudioData(data))
        .then(buffer => {
            clickBuffer = buffer;
        })
        .catch(() => {});
}

function playClickSound() {
    if (clickContext && clickBuffer) {
        clickContext.resume();
        const source = clickContext.createBufferSource();
        source.buffer = clickBuffer;
        source.connect(clickContext.destination);
        source.start(0);
        return;
    }

    clickSound.currentTime = 0;
    clickSound.play().catch(() => {});
}

document.addEventListener("pointerdown", playClickSound);

function playAchievementSound() {
    if (!achievementSound) return;

    achievementSound.currentTime = 0;
    achievementSound.play().catch(() => {
        document.addEventListener("pointerdown", () => {
            achievementSound.currentTime = 0;
            achievementSound.play().catch(() => {});
        }, { once: true });
    });
}

window.addEventListener("load", () => {
    setTimeout(playAchievementSound, 350);
});

achievementClose.addEventListener("click", () => {
    achievementAlert.hidden = true;
});

function setProfileMenu(open) {
    profileMenu.classList.toggle("is-open", open);
    profileTrigger.setAttribute("aria-expanded", String(open));
    profileDropdown.hidden = !open;
}

profileTrigger.addEventListener("click", event => {
    event.stopPropagation();
    setProfileMenu(profileDropdown.hidden);
});

document.addEventListener("click", event => {
    if (!profileMenu.contains(event.target)) {
        setProfileMenu(false);
    }
});

document.querySelector("[data-profile-action=\"Sign Out\"]").addEventListener("click", () => {
    window.location.reload();
});

window.addEventListener("resize", resizeCanvas);
window.addEventListener("resize", resizeSparkCanvas);

resizeCanvas();
resizeSparkCanvas();
drawSnow();
requestAnimationFrame(drawSparks);