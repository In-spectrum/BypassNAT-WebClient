let lastMouseLogTime = 0;
let mouseInsidePlayer = false;
let mouseInsideVideo = false;


function initMouse()
{
  
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
        keyboardCapture = mouseInsideVideo;
    });


    /*
        Ліва / права / інші кнопки миші - натискання.
    */
    playerArea.addEventListener("mousedown", (event) =>
    {
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


    /*
        Ліва / права / інші кнопки миші - відпускання.
    */
    playerArea.addEventListener("mouseup", (event) =>
    {
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


    /*
        Колесо миші.
    */
    playerArea.addEventListener("wheel", (event) =>
    {
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

    }, { passive:false });


    /*
        Забороняємо стандартне context menu
        браузера на праву кнопку.
    */
    playerArea.addEventListener("contextmenu", (event) =>
    {
        event.preventDefault();
    });


    /*
        Рух миші.
    */
    video.addEventListener("mousemove", (event) =>
    {
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
}


/*
    Повертає координати миші
    відносно області, в якій знаходиться video.

    x/y - координати миші у вікні video.
    width/height - поточний розмір video.
*/
function getMouseCoordinates(event)
{
    const rect =
        video.getBoundingClientRect();


    const frameWidth =
        video.videoWidth;

    const frameHeight =
        video.videoHeight;


    /*
        Відео ще не має розміру кадру.
    */
    if (
        frameWidth === 0 ||
        frameHeight === 0
    )
    {
        return null;
    }


    const elementWidth =
        rect.width;

    const elementHeight =
        rect.height;


    /*
        object-fit: contain

        Визначаємо фактичний розмір
        відображеного відеокадру.
    */
    const scale =
        Math.min(
            elementWidth / frameWidth,
            elementHeight / frameHeight
        );


    const displayedWidth =
        frameWidth * scale;

    const displayedHeight =
        frameHeight * scale;


    /*
        Відступи від країв video
        до фактичного відеокадру.
    */
    const offsetX =
        (elementWidth - displayedWidth) / 2;

    const offsetY =
        (elementHeight - displayedHeight) / 2;


    /*
        Координати миші
        відносно елемента video.
    */
    const mouseX =
        event.clientX - rect.left;

    const mouseY =
        event.clientY - rect.top;


    /*
        Курсор знаходиться
        на чорному полі.
    */
    if (
        mouseX < offsetX ||
        mouseX > offsetX + displayedWidth ||
        mouseY < offsetY ||
        mouseY > offsetY + displayedHeight
    )
    {
        return null;
    }


    /*
        Координати відносно
        саме відображеного кадру.

        0 ... displayedWidth
        0 ... displayedHeight
    */
    const x =
        mouseX - offsetX;

    const y =
        mouseY - offsetY;


    return {
        x: x,
        y: y,

        width: displayedWidth,
        height: displayedHeight
    };
}


/*
    Колесо миші.

    C++/QML:

        slSendMouseEvent(
            4,
            wheel.angleDelta.y < 0 ? 0 : 1,
            1,
            X,
            Y
        );
*/
function onVideoMouseWheel(
    delta,
    x,
    y,
    width,
    height
)
{

    if(!AppState.sMyId || !AppState.sDeskId)
        return; 

    /*
        deltaY < 0:
            0

        deltaY >= 0:
            1
    */
    const direction =
        delta < 0 ? 0 : 1;


    const normalizedX =
        normalizeMouseCoordinate(
            x,
            width
        );


    const normalizedY =
        normalizeMouseCoordinate(
            y,
            height
        );


    const packet =
        Protocol.createMouseEvents(
            AppState.sMyId,
            AppState.sDeskId,
            4,
            direction,
            1,
            normalizedX,
            normalizedY
        );


    if (packet != null)
    {
        wsClient.send(packet);
    }


    // log(
    //     "Mouse WHEEL direction=" +
    //     direction +
    //     " x=" +
    //     normalizedX +
    //     " y=" +
    //     normalizedY
    // );
}


/*
    Кнопка миші.

    event.button:

        0 - LEFT
        1 - MIDDLE
        2 - RIGHT
        3 - BACK
        4 - FORWARD
*/
function onVideoMouseButton(
    button,
    pressed,
    x,
    y,
    width,
    height
)
{
    if(!AppState.sMyId || !AppState.sDeskId)
        return; 
    /*
        Зараз передаємо:
            0 -> LEFT
            2 -> RIGHT

        Інші кнопки поки ігноруємо.
    */

    let mouseButton;


    if (button === 0)
    {
        mouseButton = true;
    }
    else if (button === 2)
    {
        mouseButton = false;
    }
    else
    {
        return;
    }


    const normalizedX =
        normalizeMouseCoordinate(
            x,
            width
        );


    const normalizedY =
        normalizeMouseCoordinate(
            y,
            height
        );


    /*
        Натискання:

            LEFT:
                1, true,  1

            RIGHT:
                1, false, 1
    */
    if (pressed)
    {
        const packet =
            Protocol.createMouseEvents(                
                AppState.sMyId,
                AppState.sDeskId,
                1,
                mouseButton,
                1,
                normalizedX,
                normalizedY
            );


        if (packet != null)
        {
            wsClient.send(packet);
        }
    }
    /*
        Відпускання:

            LEFT:
                2, true,  0

            RIGHT:
                2, false, 0
    */
    else
    {
        const packet =
            Protocol.createMouseEvents(
                AppState.sMyId,
                AppState.sDeskId,
                2,
                mouseButton,
                0,
                normalizedX,
                normalizedY
            );


        if (packet != null)
        {
            wsClient.send(packet);
        }
    }


    // log(
    //     "Mouse " +
    //     (pressed ? "DOWN" : "UP") +
    //     " " +
    //     mouseButtonName(button) +
    //     " x=" +
    //     normalizedX +
    //     " y=" +
    //     normalizedY
    // );
}


/*
    Рух курсора.

    C++/QML:

        slSendMouseEvent(
            3,
            true,
            0,
            X,
            Y
        );
*/
function onVideoMouseMove(
    x,
    y,
    width,
    height
)
{
    if(!AppState.sMyId || !AppState.sDeskId || !AppState.bRunStream)
        return;    

    const now =
        Date.now();


    /*
        Не відправляємо рух частіше,
        ніж 10 разів на секунду.
    */
    if (
        now - lastMouseLogTime < 100
    )
    {
        return;
    }


    lastMouseLogTime = now;


    const normalizedX =
        normalizeMouseCoordinate(
            x,
            width
        );


    const normalizedY =
        normalizeMouseCoordinate(
            y,
            height
        );


    const packet =
        Protocol.createMouseEvents(
            AppState.sMyId,
            AppState.sDeskId,
            3,
            true,
            0,
            normalizedX,
            normalizedY
        );


    if (packet != null)
    {
        wsClient.send(packet);
    }


    // log(
    //     "Mouse MOVE x=" +
    //     normalizedX +
    //     " y=" +
    //     normalizedY
    // );
}


/*
    Перетворення координати:

        100 * (100 * value / size)

    тобто:

        value * 10000 / size

    Результат:
        0 ... 10000
*/
function normalizeMouseCoordinate(
    value,
    size
)
{
    if (size <= 0)
        return 0;


    let result =
        Math.round(
            10000 * value / size
        );


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