let lastMouseLogTime = 0;
let mouseInsidePlayer = false;
let mouseInsideVideo = false;

let mouseLeftPressing = false;
let timeMouseLeftPressing = 0;
let mouseLeftPrevX = 0;
let mouseLeftPrevY = 0;
let mouseLeftPrevPoint = null;

// Визначаємо mouse-події, які браузер згенерував саме з touch-вводу.
function isTouchGeneratedMouseEvent(event)
{
    return !!(event.sourceCapabilities && event.sourceCapabilities.firesTouchEvents);
}

function initMouseForMoqPlayer()
{
    const video = document.getElementById("video");
    const playerArea = document.getElementById("playerArea");

    if (!video)
    {
        log("Mouse ERROR: video element not found");
        return;
    }

    if (!playerArea)
    {
        log("Mouse ERROR: playerArea element not found");
        return;
    }

    // Вхід в область player
    playerArea.addEventListener("mouseenter", function()
    {
        mouseInsidePlayer = true;
        mouseInsideVideo = false;
        keyboardCapture = false;
        playerArea.focus();
    });

    // Вихід з області player
    playerArea.addEventListener("mouseleave", function()
    {
        mouseInsidePlayer = false;
        mouseInsideVideo = false;
        keyboardCapture = false;
    });

    // Рух миші
    video.addEventListener("mousemove", function(event)
    {
        if (isTouchGeneratedMouseEvent(event))
            return;

        if (!mouseInsidePlayer)
            return;

        const p = getMouseCoordinates(event);

        mouseInsideVideo = (p != null);
        keyboardCapture = mouseInsideVideo;

        if (p == null)
            return;

        onVideoMouseMove(p.x, p.y, p.width, p.height);
    });

    // Натискання кнопок миші
    playerArea.addEventListener("mousedown", function(event)
    {
        if (isTouchGeneratedMouseEvent(event))
            return;

        if (!mouseInsidePlayer)
            return;

        const p = getMouseCoordinates(event);

        // Ігноруємо клік поза фактичним відеокадром.
        if (p == null)
            return;

        onVideoMouseButton(
            event.button,
            true,
            p.x,
            p.y,
            p.width,
            p.height
        );
    });

    // Відпускання кнопок миші
    playerArea.addEventListener("mouseup", function(event)
    {
        if (isTouchGeneratedMouseEvent(event))
            return;

        if (!mouseInsidePlayer)
            return;

        const p = getMouseCoordinates(event);

        if (p == null)
            return;

        onVideoMouseButton(
            event.button,
            false,
            p.x,
            p.y,
            p.width,
            p.height
        );
    });

    // Колесо миші
    playerArea.addEventListener("wheel", function(event)
    {
        if (isTouchGeneratedMouseEvent(event))
            return;

        if (!mouseInsidePlayer)
            return;

        const p = getMouseCoordinates(event);

        if (p == null)
            return;

        event.preventDefault();

        onVideoMouseWheel(
            -event.deltaY,
            p.x,
            p.y,
            p.width,
            p.height
        );
    }, { passive: false });

    // Заборона стандартного контекстного меню
    playerArea.addEventListener("contextmenu", function(event)
    {
        event.preventDefault();
    });

    initTouchForVideoPlayer(video, playerArea);
}

function initMouseForWebRTCPlayer()
{
    const video = document.getElementById("video");
    const playerArea = document.getElementById("playerArea");

    if (!video || !playerArea)
    {
        log("Mouse ERROR: video or playerArea element not found");
        return;
    }

    playerArea.addEventListener("mouseenter", () =>
    {
        mouseInsidePlayer = true;
        mouseInsideVideo = true;
        keyboardCapture = mouseInsideVideo;
        playerArea.focus();
    });

    playerArea.addEventListener("mouseleave", () =>
    {
        mouseInsidePlayer = false;
        mouseInsideVideo = false;
        keyboardCapture = false;
    });

    // Натискання кнопок миші
    playerArea.addEventListener("mousedown", (event) =>
    {
        if (isTouchGeneratedMouseEvent(event))
            return;

        if (!mouseInsidePlayer)
            return;

        const p = getMouseCoordinates(event);

        if (p == null)
            return;

        onVideoMouseButton(
            event.button,
            true,
            p.x,
            p.y,
            p.width,
            p.height
        );
    });

    // Відпускання кнопок миші
    playerArea.addEventListener("mouseup", (event) =>
    {
        if (isTouchGeneratedMouseEvent(event))
            return;

        if (!mouseInsidePlayer)
            return;

        const p = getMouseCoordinates(event);

        if (p == null)
            return;

        onVideoMouseButton(
            event.button,
            false,
            p.x,
            p.y,
            p.width,
            p.height
        );
    });

    // Колесо миші
    playerArea.addEventListener("wheel", (event) =>
    {
        if (isTouchGeneratedMouseEvent(event))
            return;

        if (!mouseInsidePlayer)
            return;

        event.preventDefault();

        const p = getMouseCoordinates(event);

        if (p == null)
            return;

        onVideoMouseWheel(
            -event.deltaY,
            p.x,
            p.y,
            p.width,
            p.height
        );
    }, { passive: false });

    // Заборона стандартного контекстного меню
    playerArea.addEventListener("contextmenu", (event) =>
    {
        event.preventDefault();
    });

    // Рух миші
    video.addEventListener("mousemove", (event) =>
    {
        if (isTouchGeneratedMouseEvent(event))
            return;

        if (!mouseInsidePlayer)
            return;

        const p = getMouseCoordinates(event);

        mouseInsideVideo = (p != null);
        keyboardCapture = mouseInsideVideo;

        if (p == null)
            return;

        onVideoMouseMove(
            p.x,
            p.y,
            p.width,
            p.height
        );
    });

    initTouchForVideoPlayer(video, playerArea);
}

/*
    Сенсорне керування:
    - touchstart: натискання лівої кнопки;
    - touchmove: рух курсора;
    - touchend: відпускання лівої кнопки;
    - touchcancel: примусове відпускання кнопки.
*/
function initTouchForVideoPlayer(video, playerArea)
{
    if (!video || !playerArea)
        return;

    let activeTouchId = null;
    let lastPosition = null;

    // Вимикаємо прокручування та масштабування жестами в області плеєра.
    //playerArea.style.touchAction = "none";

    playerArea.addEventListener("touchstart", function(event)
    {
        // Не обробляємо другий палець, поки активний перший.
        if (activeTouchId !== null)
            return;

        let selectedTouch = null;
        let selectedPosition = null;

        for (const touch of Array.from(event.changedTouches))
        {
            const p = getMouseCoordinates(touch);

            if (p !== null)
            {
                selectedTouch = touch;
                selectedPosition = p;
                break;
            }
        }

        // Дотик поза фактичним відеокадром ігноруємо.
        if (!selectedTouch || !selectedPosition)
            return;

        event.preventDefault();

        activeTouchId = selectedTouch.identifier;
        lastPosition = selectedPosition;

        mouseInsidePlayer = true;
        mouseInsideVideo = true;
        keyboardCapture = true;

        playerArea.focus();

        mouseLeftPressing = true;
        timeMouseLeftPressing = 0;
        mouseLeftPrevPoint = lastPosition;

        // Натискання лівої кнопки миші.
        onVideoMouseButton(
            0,
            true,
            selectedPosition.x,
            selectedPosition.y,
            selectedPosition.width,
            selectedPosition.height
        );
    }, { passive: false });

    // Рух пальця передаємо як рух курсора.
    playerArea.addEventListener("touchmove", function(event)
    {
        if (activeTouchId === null)
            return;

        const touch = Array.from(event.changedTouches).find(
            item => item.identifier === activeTouchId
        );

        if (!touch)
            return;

        event.preventDefault();

        const p = getMouseCoordinates(touch);

        if (!p)
            return;

        lastPosition = p;

        mouseInsideVideo = true;
        keyboardCapture = true;

        if(     Math.abs(mouseLeftPrevPoint.x - lastPosition.x) > 5
            ||  Math.abs(mouseLeftPrevPoint.y - lastPosition.y) > 5
        )
        {
            timeMouseLeftPressing = 0;
            mouseLeftPressing = false;
        }
        

        onVideoMouseMove(
            p.x,
            p.y,
            p.width,
            p.height
        );
    }, { passive: false });

    function releaseTouch(event)
    {
        if (activeTouchId === null)
            return;

        playerArea.style.touchAction = "flex";

        const touch = Array.from(event.changedTouches).find(
            item => item.identifier === activeTouchId
        );

        if (!touch)
            return;

        event.preventDefault();

        timeMouseLeftPressing = 0;
        mouseLeftPressing = false;

        // Якщо палець уже поза кадром, використовуємо останні координати.
        const p = getMouseCoordinates(touch) || lastPosition;

        if (p)
        {
            // Відпускання лівої кнопки миші.
            onVideoMouseButton(
                0,
                false,
                p.x,
                p.y,
                p.width,
                p.height
            );
        }

        activeTouchId = null;
        lastPosition = null;

        mouseInsideVideo = false;
        keyboardCapture = false;
    }

    playerArea.addEventListener(
        "touchend",
        releaseTouch,
        { passive: false }
    );

    playerArea.addEventListener(
        "touchcancel",
        releaseTouch,
        { passive: false }
    );
}

/*
    Повертає координати відносно фактичного відеокадру.
*/
function getMouseCoordinates(event)
{
    const video = document.getElementById("video");

    if (!video)
        return null;

    const canvasMoqPlayer = AppState.bMoqPlayer
        ? document.querySelector("#video canvas")
        : null;

    const rect = canvasMoqPlayer
        ? canvasMoqPlayer.getBoundingClientRect()
        : video.getBoundingClientRect();

    const frameWidth = canvasMoqPlayer
        ? canvasMoqPlayer.width
        : video.videoWidth;

    const frameHeight = canvasMoqPlayer
        ? canvasMoqPlayer.height
        : video.videoHeight;

    // Відео ще не має розміру кадру.
    if (frameWidth === 0 || frameHeight === 0)
        return null;

    const elementWidth = rect.width;
    const elementHeight = rect.height;

    // object-fit: contain
    const scale = Math.min(
        elementWidth / frameWidth,
        elementHeight / frameHeight
    );

    const displayedWidth = frameWidth * scale;
    const displayedHeight = frameHeight * scale;

    // Відступи від країв елемента до фактичного відеокадру.
    const offsetX = (elementWidth - displayedWidth) / 2;
    const offsetY = (elementHeight - displayedHeight) / 2;

    // Координати миші або дотику відносно елемента.
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Ігноруємо чорні поля навколо відео.
    if (
        mouseX < offsetX ||
        mouseX > offsetX + displayedWidth ||
        mouseY < offsetY ||
        mouseY > offsetY + displayedHeight
    )
    {
        return null;
    }

    return {
        x: mouseX - offsetX,
        y: mouseY - offsetY,
        width: displayedWidth,
        height: displayedHeight
    };
}

/*
    Колесо миші.
*/
function onVideoMouseWheel(delta, x, y, width, height)
{
    if (!AppState.sMyId || !AppState.sDeskId)
        return;

    const direction = delta < 0 ? 0 : 1;

    const normalizedX = normalizeMouseCoordinate(x, width);
    const normalizedY = normalizeMouseCoordinate(y, height);

    const packet = Protocol.createMouseEvents(
        AppState.sMyId,
        AppState.sDeskId,
        4,
        direction,
        1,
        normalizedX,
        normalizedY
    );

    if (packet != null)
        wsClient.send(packet);
}

/*
    Кнопка миші.
    button: 0 - LEFT, 2 - RIGHT.
*/
function onVideoMouseButton(button, pressed, x, y, width, height)
{
    if (!AppState.sMyId || !AppState.sDeskId)
        return;

    let mouseButton;

    if (button === 0)
        mouseButton = true;
    else if (button === 2)
        mouseButton = false;
    else
        return;

    const normalizedX = normalizeMouseCoordinate(x, width);
    const normalizedY = normalizeMouseCoordinate(y, height);

    
    mouseLeftPrevX = normalizedX;
    mouseLeftPrevY = normalizedY;

    const packet = Protocol.createMouseEvents(
        AppState.sMyId,
        AppState.sDeskId,
        pressed ? 1 : 2,
        mouseButton,
        pressed ? 1 : 0,
        normalizedX,
        normalizedY
    );

    if (packet != null)
        wsClient.send(packet);
}

/*
    Рух курсора.
*/
function onVideoMouseMove(x, y, width, height)
{
    if (!AppState.sMyId || !AppState.sDeskId || !AppState.bRunStream)
        return;

    const now = Date.now();

    // Не відправляємо рух частіше, ніж 10 разів на секунду.
    if (now - lastMouseLogTime < 100)
        return;

    lastMouseLogTime = now;

    const normalizedX = normalizeMouseCoordinate(x, width);
    const normalizedY = normalizeMouseCoordinate(y, height);

    const packet = Protocol.createMouseEvents(
        AppState.sMyId,
        AppState.sDeskId,
        3,
        true,
        0,
        normalizedX,
        normalizedY
    );

    if (packet != null)
        wsClient.send(packet);
}

/*
    Перетворення координати в діапазон 0 ... 10000.
*/
function normalizeMouseCoordinate(value, size)
{
    if (size <= 0)
        return 0;

    let result = Math.round(10000 * value / size);

    if (result < 0)
        result = 0;

    if (result > 10000)
        result = 10000;

    return result;
}

/*
    Назва кнопки для логування.
*/
function mouseButtonName(button)
{
    switch (button)
    {
        case 0:
            return "LEFT";

        case 1:
            return "MIDDLE";

        case 2:
            return "RIGHT";

        case 3:
            return "BACK";

        case 4:
            return "FORWARD";

        default:
            return button.toString();
    }
}