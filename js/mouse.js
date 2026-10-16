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
    let secondTouchId = null;
    let lastPosition = null;
    let lastTwoFingerY = null;
    let touchMode = null; // "single" або "scroll"
    let leftButtonPressed = false;
    let pendingPressTimer = null;

    const PRESS_DELAY = 50;
    const SCROLL_THRESHOLD = 3;

    function findTouch(touches, id)
    {
        return Array.from(touches).find(
            touch => touch.identifier === id
        );
    }

    function getTouchPosition(touch)
    {
        return touch ? getMouseCoordinates(touch) : null;
    }

    function releaseLeftButton(position)
    {
        mouseLeftPressing = false;
        timeMouseLeftPressing = 0;

        if (!leftButtonPressed || !position)
            return;

        onVideoMouseButton(
            0, false,
            position.x, position.y,
            position.width, position.height
        );

        leftButtonPressed = false;

    }

    function cancelPendingPress()
    {
        
        timeMouseLeftPressing = 0;
        mouseLeftPressing = false;
        
        if (pendingPressTimer !== null)
        {
            clearTimeout(pendingPressTimer);
            pendingPressTimer = null;
        }

    }

    function startLeftButton(position)
    {
        if (leftButtonPressed || !position)
            return;

        onVideoMouseButton(
            0, true,
            position.x, position.y,
            position.width, position.height
        );

        leftButtonPressed = true;
        mouseLeftPressing = true;
        timeMouseLeftPressing = 0;
        mouseLeftPrevPoint = position;
    }

    function finishTouch()
    {
        cancelPendingPress();

        if (touchMode === "single")
            releaseLeftButton(lastPosition);

        activeTouchId = null;
        secondTouchId = null;
        lastPosition = null;
        lastTwoFingerY = null;
        touchMode = null;

        mouseInsideVideo = false;
        keyboardCapture = false;
    }

    playerArea.addEventListener("touchstart", function(event)
    {
        event.preventDefault();

        const touches = Array.from(event.touches);

        // Починаємо новий жест.
        if (activeTouchId === null)
        {
            const touch = touches.find(
                item => getTouchPosition(item) !== null
            );

            if (!touch)
                return;

            const p = getTouchPosition(touch);

            activeTouchId = touch.identifier;
            lastPosition = p;
            touchMode = "single";

            mouseInsidePlayer = true;
            mouseInsideVideo = true;
            keyboardCapture = true;

            playerArea.focus();

            // Невелика затримка дозволяє розпізнати
            // жест двома пальцями до натискання кнопки.
            pendingPressTimer = setTimeout(function()
            {
                pendingPressTimer = null;

                if (touchMode === "single")
                    startLeftButton(lastPosition);
            }, PRESS_DELAY);

            return;
        }

        // Другий палець: переходимо в режим прокручування.
        if (touchMode === "single" && secondTouchId === null)
        {
            const secondTouch = touches.find(
                item => item.identifier !== activeTouchId &&
                        getTouchPosition(item) !== null
            );

            if (!secondTouch)
                return;

            cancelPendingPress();

            // Якщо кнопка вже була натиснута,
            // відпускаємо її перед початком прокручування.
            releaseLeftButton(lastPosition);

            secondTouchId = secondTouch.identifier;
            touchMode = "scroll";

            const first = findTouch(touches, activeTouchId);
            const second = findTouch(touches, secondTouchId);

            if (!first || !second)
                return;

            lastTwoFingerY = (first.clientY + second.clientY) / 2;
        }
    }, { passive: false });

    playerArea.addEventListener("touchmove", function(event)
    {
        if (activeTouchId === null)
            return;

        event.preventDefault();

        const touches = Array.from(event.touches);

        // Режим двопальцевого прокручування.
        if (touchMode === "scroll")
        {
            const first = findTouch(touches, activeTouchId);
            const second = findTouch(touches, secondTouchId);

            if (!first || !second)
                return;

            const centerY = (first.clientY + second.clientY) / 2;

            if (lastTwoFingerY === null)
            {
                lastTwoFingerY = centerY;
                return;
            }

            const delta = lastTwoFingerY - centerY;

            if (Math.abs(delta) >= SCROLL_THRESHOLD)
            {
                const p = getTouchPosition(first) || lastPosition;

                if (p)
                {
                    // Додатне delta — рух пальців угору.
                    // Від'ємне delta — рух пальців униз.
                    onVideoTouchScroll(
                        delta,
                        p.x,
                        p.y,
                        p.width,
                        p.height
                    );
                }

                lastTwoFingerY = centerY;
            }

            return;
        }

        // Звичайний рух одним пальцем.
        const touch = findTouch(touches, activeTouchId);

        if (!touch)
            return;

        const p = getTouchPosition(touch);

        if (!p)
            return;

        if (//pendingPressTimer !== null &&
            lastPosition &&
            (
                Math.abs(p.x - lastPosition.x) > 5 ||
                Math.abs(p.y - lastPosition.y) > 5
            ))
        {
            cancelPendingPress();
            startLeftButton(lastPosition);
        }

        lastPosition = p;

        mouseInsideVideo = true;
        keyboardCapture = true;

        mouseLeftPrevPoint = p;

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

        event.preventDefault();

        const ended = Array.from(event.changedTouches);

        // Завершився жест двома пальцями.
        if (touchMode === "scroll")
        {
            const secondEnded = ended.some(
                touch => touch.identifier === secondTouchId
            );

            const firstEnded = ended.some(
                touch => touch.identifier === activeTouchId
            );

            if (secondEnded || firstEnded)
                finishTouch();

            return;
        }

        // Завершився дотик одним пальцем.
        const firstEnded = ended.some(
            touch => touch.identifier === activeTouchId
        );

        if (firstEnded)
            finishTouch();
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
    Обробка прокручування двома пальцями.

    delta > 0 — пальці рухаються вгору.
    delta < 0 — пальці рухаються вниз.

    Тут додай власну команду відправлення на сервер.
*/
function onVideoTouchScroll(delta, x, y, width, height)
{
    // TODO: додати відправлення команди на сервер.
    // delta — величина переміщення в CSS-пікселях.
    // x, y — координати всередині відеокадру.
    // width, height — розмір відображеного кадру.

    // Наприклад, для налагодження:
    // console.log("Touch scroll:", delta, x, y);

    
    onVideoMouseWheel(
            delta,
            x,
            y,
            width,
            height
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