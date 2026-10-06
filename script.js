const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const rebuildButton = document.getElementById("rebuild");

let width = 0;
let height = 0;
let dpr = 1;

let particles = [];
let sparks = [];
let waves = [];
let stars = [];

let mouse = {
    x: -1000,
    y: -1000,
    active: false
};

let completed = false;
let buildProgress = 0;
let startTime = performance.now();

const TAU = Math.PI * 2;


/* =========================
   RESIZE
========================= */

function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );

    createStars();
}

window.addEventListener("resize", resize);


/* =========================
   HEART EQUATION
========================= */

function heart(t) {
    return {
        x: 16 * Math.pow(Math.sin(t), 3),

        y:
            13 * Math.cos(t)
            - 5 * Math.cos(2 * t)
            - 2 * Math.cos(3 * t)
            - Math.cos(4 * t)
    };
}


/* =========================
   HEART POINT
========================= */

function heartPoint() {
    const t = Math.random() * TAU;
    const h = heart(t);

    const scale =
        Math.min(width, height) * 0.018;

    const fill =
        Math.sqrt(Math.random());

    return {
        x: h.x * scale * fill,
        y: -h.y * scale * fill
    };
}


/* =========================
   STARS
========================= */

function createStars() {
    stars = [];

    const amount = Math.min(
        180,
        Math.floor(width * height / 9000)
    );

    for (let i = 0; i < amount; i++) {
        stars.push({
            x: Math.random() * width,
            y: Math.random() * height,

            size:
                Math.random() * 1.8 + 0.3,

            alpha: Math.random(),

            speed:
                Math.random() * 0.5 + 0.1
        });
    }
}


/* =========================
   PARTICLES
========================= */

function createParticles() {
    particles = [];

    const count = Math.min(
        4200,
        Math.max(
            1800,
            Math.floor(width * height / 320)
        )
    );

    const centerX = width / 2;
    const centerY = height * 0.44;

    for (let i = 0; i < count; i++) {

        const target = heartPoint();

        const startX =
            centerX +
            (Math.random() - 0.5) *
            width * 0.8;

        const startY =
            height +
            Math.random() * 180;

        particles.push({
            x: startX,
            y: startY,

            tx: centerX + target.x,
            ty: centerY + target.y,

            vx: 0,
            vy: 0,

            size:
                Math.random() * 1.8 + 0.5,

            delay:
                Math.random() * 0.18,

            phase:
                Math.random() * TAU,

            hue:
                Math.random() * 90 + 285,

            alpha:
                Math.random() * 0.65 + 0.35,

            glow:
                Math.random() * 12 + 5
        });
    }
}


/* =========================
   SPARKS
========================= */

function createSpark(
    x,
    y,
    amount = 1
) {
    for (let i = 0; i < amount; i++) {

        const angle =
            Math.random() * TAU;

        const speed =
            Math.random() * 5 + 1;

        sparks.push({
            x,
            y,

            vx:
                Math.cos(angle) * speed,

            vy:
                Math.sin(angle) * speed,

            life: 1,

            decay:
                Math.random() * 0.025 + 0.015,

            size:
                Math.random() * 2.5 + 0.5,

            hue:
                Math.random() * 100 + 280
        });
    }
}


/* =========================
   WAVES
========================= */

function createWave(x, y) {
    waves.push({
        x,
        y,

        radius: 10,

        alpha: 1,

        speed: 8
    });
}


/* =========================
   INITIALIZE
========================= */

function initialize() {
    particles = [];
    sparks = [];
    waves = [];

    completed = false;
    buildProgress = 0;

    startTime = performance.now();

    createParticles();
}


/* =========================
   MOUSE
========================= */

window.addEventListener(
    "pointermove",
    event => {
        mouse.x = event.clientX;
        mouse.y = event.clientY;
        mouse.active = true;
    }
);

window.addEventListener(
    "pointerleave",
    () => {
        mouse.active = false;
    }
);


/* =========================
   CLICK INTERACTION
========================= */

window.addEventListener(
    "pointerdown",
    event => {

        mouse.x = event.clientX;
        mouse.y = event.clientY;

        createWave(
            mouse.x,
            mouse.y
        );

        createSpark(
            mouse.x,
            mouse.y,
            25
        );
    }
);


/* =========================
   SMOOTH HEART BUILD
========================= */

function updateParticles(time) {

    const elapsed =
        time - startTime;

    /*
       2400ms:
       سريع لكن سلس
    */

    const BUILD_DURATION = 2400;

    buildProgress =
        Math.min(
            1,
            elapsed / BUILD_DURATION
        );

    const centerX =
        width / 2;

    const centerY =
        height * 0.44;

    for (const p of particles) {

        const localProgress =
            Math.max(
                0,
                Math.min(
                    1,
                    (buildProgress - p.delay) /
                    (1 - p.delay)
                )
            );

        /*
           SmoothStep
        */

        const eased =
            localProgress *
            localProgress *
            (3 - 2 * localProgress);

        /*
           البداية من الأسفل
        */

        const verticalGate =
            Math.min(
                1,
                eased * 1.22
            );

        let targetY =
            height -
            (height - p.ty) *
            verticalGate;

        /*
           موجة خفيفة أثناء التشكيل
        */

        targetY +=
            Math.sin(
                time * 0.004 +
                p.phase
            ) *
            (1 - eased) *
            14;

        const targetX =
            centerX +
            (p.tx - centerX) *
            eased;

        /*
           حركة سلسة بدون اهتزاز زائد
        */

        p.vx +=
            (targetX - p.x) *
            0.045;

        p.vy +=
            (targetY - p.y) *
            0.045;

        p.vx *= 0.82;
        p.vy *= 0.82;

        p.x += p.vx;
        p.y += p.vy;


        /* =========================
           MOUSE INTERACTION
        ========================= */

        if (mouse.active) {

            const dx =
                p.x - mouse.x;

            const dy =
                p.y - mouse.y;

            const dist =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );

            const radius = 120;

            if (dist < radius) {

                const force =
                    (1 - dist / radius) *
                    2.2;

                p.x +=
                    (dx / (dist || 1)) *
                    force;

                p.y +=
                    (dy / (dist || 1)) *
                    force;
            }
        }
    }


    /* =========================
       COMPLETED
    ========================= */

    if (
        buildProgress >= 1 &&
        !completed
    ) {
        completed = true;

        /*
           لا يوجد انفجار هنا.
           القلب يبقى مكتملًا.
        */
    }
}


/* =========================
   SPARK UPDATE
========================= */

function updateSparks() {

    for (
        let i = sparks.length - 1;
        i >= 0;
        i--
    ) {

        const s = sparks[i];

        s.x += s.vx;
        s.y += s.vy;

        s.vx *= 0.97;
        s.vy *= 0.97;

        s.vy += 0.025;

        s.life -= s.decay;

        if (s.life <= 0) {
            sparks.splice(i, 1);
        }
    }
}


/* =========================
   WAVES UPDATE
========================= */

function updateWaves() {

    for (
        let i = waves.length - 1;
        i >= 0;
        i--
    ) {

        const w = waves[i];

        w.radius += w.speed;

        w.alpha *= 0.965;

        if (w.alpha < 0.01) {
            waves.splice(i, 1);
        }
    }
}


/* =========================
   DRAW STARS
========================= */

function drawStars(time) {

    for (const s of stars) {

        const pulse =
            0.5 +
            Math.sin(
                time * 0.002 * s.speed
            ) * 0.5;

        ctx.globalAlpha =
            s.alpha * pulse;

        ctx.fillStyle =
            "#ffffff";

        ctx.beginPath();

        ctx.arc(
            s.x,
            s.y,
            s.size,
            0,
            TAU
        );

        ctx.fill();
    }

    ctx.globalAlpha = 1;
}


/* =========================
   DRAW PARTICLES
========================= */

function drawParticles(time) {

    const pulse =
        completed
            ? 1 +
              Math.sin(
                  time * 0.004
              ) * 0.025
            : 1;

    for (const p of particles) {

        const x =
            width / 2 +
            (p.x - width / 2) *
            pulse;

        const y =
            height * 0.44 +
            (p.y - height * 0.44) *
            pulse;

        /*
           ألوان حية ومتغيرة
        */

        const hue =
            (
                p.hue +
                time * 0.025 +
                y * 0.04
            ) % 360;

        const alpha =
            completed
                ? p.alpha
                : Math.min(
                    1,
                    p.alpha *
                    (buildProgress + 0.25)
                );

        ctx.globalAlpha = alpha;

        ctx.shadowBlur =
            p.glow;

        ctx.shadowColor =
            `hsl(${hue}, 100%, 65%)`;

        ctx.fillStyle =
            `hsl(${hue}, 100%, 65%)`;

        ctx.beginPath();

        ctx.arc(
            x,
            y,
            p.size,
            0,
            TAU
        );

        ctx.fill();
    }

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
}


/* =========================
   DRAW SPARKS
========================= */

function drawSparks() {

    for (const s of sparks) {

        ctx.globalAlpha =
            s.life;

        const hue =
            s.hue;

        ctx.shadowBlur = 18;

        ctx.shadowColor =
            `hsl(${hue},100%,65%)`;

        ctx.fillStyle =
            `hsl(${hue},100%,70%)`;

        ctx.beginPath();

        ctx.arc(
            s.x,
            s.y,
            s.size,
            0,
            TAU
        );

        ctx.fill();
    }

    ctx.shadowBlur = 0;

    ctx.globalAlpha = 1;
}


/* =========================
   DRAW WAVES
========================= */

function drawWaves() {

    for (const w of waves) {

        ctx.globalAlpha =
            w.alpha;

        ctx.lineWidth = 2;

        ctx.strokeStyle =
            `rgba(255,100,220,${w.alpha})`;

        ctx.shadowBlur = 25;

        ctx.shadowColor =
            "#ff3fd4";

        ctx.beginPath();

        ctx.arc(
            w.x,
            w.y,
            w.radius,
            0,
            TAU
        );

        ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
}


/* =========================
   BACKGROUND GLOW
========================= */

function drawBackground(time) {

    const cx =
        width / 2;

    const cy =
        height * 0.44;

    const radius =
        Math.min(width, height) *
        0.42;

    const gradient =
        ctx.createRadialGradient(
            cx,
            cy,
            0,
            cx,
            cy,
            radius
        );

    const pulse =
        0.5 +
        Math.sin(
            time * 0.002
        ) * 0.15;

    gradient.addColorStop(
        0,
        `rgba(
            255,
            40,
            190,
            ${0.10 + pulse * 0.08}
        )`
    );

    gradient.addColorStop(
        0.35,
        "rgba(130,40,255,0.06)"
    );

    gradient.addColorStop(
        1,
        "rgba(0,0,0,0)"
    );

    ctx.fillStyle =
        gradient;

    ctx.fillRect(
        0,
        0,
        width,
        height
    );
}


/* =========================
   ANIMATION LOOP
========================= */

function animate(time) {

    ctx.clearRect(
        0,
        0,
        width,
        height
    );

    drawBackground(time);

    drawStars(time);

    updateParticles(time);

    updateSparks();

    updateWaves();

    drawParticles(time);

    drawSparks();

    drawWaves();

    requestAnimationFrame(
        animate
    );
}


/* =========================
   REBUILD
========================= */

rebuildButton.addEventListener(
    "click",
    () => {
        initialize();
    }
);


/* =========================
   START
========================= */

resize();

initialize();

requestAnimationFrame(
    animate
);