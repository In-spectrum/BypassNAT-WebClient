const sidebar = document.getElementById('sidebar');
const btnOpen = document.getElementById('btnOpen');
const loggerBody = document.getElementById('loggerBody');
const video = document.getElementById("video");
const playerArea = document.getElementById("playerArea");
const playerState =
{
    frameWidth: 0,
    frameHeight: 0,
    videoReady: false
};

let menuVisible = true;
let lastMouseLogTime = 0;
let mouseInsidePlayer = false;
let keyboardCapture = false;

btnOpen.onclick = () => {

    menuVisible = !menuVisible;

    if (menuVisible) {
        sidebar.style.display = "block";
        btnOpen.innerHTML = "❮";
    } else {
        sidebar.style.display = "none";
        btnOpen.innerHTML = "❯";
    }
};

document.getElementById('btnClear').onclick = () => {
    loggerBody.innerHTML = "";
};

function log(text)
{
    const now = new Date();

    const time =
        now.getHours().toString().padStart(2, '0') + ":" +
        now.getMinutes().toString().padStart(2, '0') + ":" +
        now.getSeconds().toString().padStart(2, '0');

    loggerBody.innerHTML += "[" + time + "] " + text + "<br>";

    loggerBody.scrollTop = loggerBody.scrollHeight;
}

playerArea.addEventListener("loadedmetadata", () =>
{
    playerState.frameWidth = video.videoWidth;
    playerState.frameHeight = video.videoHeight;
    playerState.videoReady = true;

    log(
        "Відео: " +
        playerState.frameWidth +
        " × " +
        playerState.frameHeight
    );
})

playerArea.addEventListener("playing", () =>
{
    log("Відтворення відео розпочато.");
});

playerArea.addEventListener("ended", () =>
{
    log("Відтворення завершено.");
});

playerArea.addEventListener("error", () =>
{
    log("Помилка відтворення відео.");
});

playerArea.addEventListener("mouseenter", () =>
{
    mouseInsidePlayer = true;
    keyboardCapture = true;

    playerArea.focus();

    log("Курсор увійшов у плеєр.");
});


playerArea.addEventListener("mouseleave", () =>
{
    mouseInsidePlayer = false;
    keyboardCapture = false;

    log("Курсор покинув плеєр.");
});

playerArea.addEventListener("mousedown", (event) =>
{
    if (!mouseInsidePlayer)
        return;

    const p = getVideoCoordinates(event);

    if (p == null)
        return;

    onVideoMouseButton(
        event.button,
        true,
        p.x,
        p.y
    );
});

playerArea.addEventListener("mouseup", (event) =>
{
    if (!mouseInsidePlayer)
        return;

    const p = getVideoCoordinates(event);

    if (p == null)
        return;

    onVideoMouseButton(
        event.button,
        false,
        p.x,
        p.y
    );
});

playerArea.addEventListener("wheel", (event) =>
{
    if (!mouseInsidePlayer)
        return;

    event.preventDefault();

    const p = getVideoCoordinates(event);

    if (p == null)
        return;

    onVideoMouseWheel(
        event.deltaY,
        p.x,
        p.y
    );

}, { passive:false });

playerArea.addEventListener("contextmenu", (event) =>
{
    event.preventDefault();
});

function onVideoMouseWheel(delta, x, y)
{
    /*
        Тут пізніше буде:
        sendMouseWheel(delta, x, y);
    */

    log(
        "Mouse WHEEL  delta=" +
        delta +
        "  x=" +
        x +
        "  y=" +
        y
    );
}

function mouseButtonName(button)
{
    switch (button)
    {
        case 0: return "LEFT";
        case 1: return "MIDDLE";
        case 2: return "RIGHT";
        case 3: return "BACK";
        case 4: return "FORWARD";
        default: return button.toString();
    }
}

function onVideoMouseButton(button, pressed, x, y)
{
    /*
        Тут пізніше буде:
        sendMouseButton(button, pressed, x, y);
    */

    log(
        "Mouse " +
        (pressed ? "DOWN" : "UP") +
        "  " +
        mouseButtonName(button) +
        "  x=" + x +
        "  y=" + y
    );
}

function getVideoCoordinates(event)
{
    const rect = video.getBoundingClientRect();

    const frameWidth = video.videoWidth;
    const frameHeight = video.videoHeight;

    /*
        Відео ще не відтворюється.
        Повертаємо координати відносно елемента <video>.
    */

    if (frameWidth === 0 || frameHeight === 0)
    {
        return {

            x: Math.round(event.clientX - rect.left),

            y: Math.round(event.clientY - rect.top)

        };
    }

    const elementWidth = rect.width;
    const elementHeight = rect.height;

    const scale = Math.min(
        elementWidth / frameWidth,
        elementHeight / frameHeight
    );

    const displayedWidth = frameWidth * scale;
    const displayedHeight = frameHeight * scale;

    const offsetX = (elementWidth - displayedWidth) / 2;
    const offsetY = (elementHeight - displayedHeight) / 2;

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    /*
        Курсор знаходиться на чорних полях.
    */

    if (
        x < offsetX ||
        x > offsetX + displayedWidth ||
        y < offsetY ||
        y > offsetY + displayedHeight
    )
    {
        return null;
    }

    return {

        x: Math.round(
            (x - offsetX) *
            frameWidth /
            displayedWidth
        ),

        y: Math.round(
            (y - offsetY) *
            frameHeight /
            displayedHeight
        )

    };
}

function onVideoMouseMove(x, y)
{
    /*
        Тут пізніше буде:
        - відправка WebSocket;
        - обробка натиснутих кнопок;
        - інші події.
    */

    const now = Date.now();

    if (now - lastMouseLogTime >= 100)
    {
        lastMouseLogTime = now;

        log("Mouse: x=" + x + "  y=" + y);
    }
}

video.addEventListener("mousemove", (event) =>
{
    if (!mouseInsidePlayer)
        return;

    const p = getVideoCoordinates(event);

    if (p == null)
        return;

    onVideoMouseMove(p.x, p.y);
});

log("Програму запущено.");
log("Інтерфейс готовий.");