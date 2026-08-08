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

let wsClient = new WebSocketClient();
let clientId = "";

let menuVisible = true;
let lastMouseLogTime = 0;
let mouseInsidePlayer = false;
let keyboardCapture = false;


const generatedLogin =
    Protocol.generateLogin();

const generatedPassword =
    Protocol.generatePassword();


document.getElementById(
    "txtUserLogin"
).value =
    generatedLogin;


document.getElementById(
    "txtUserPassword"
).value =
    generatedPassword;


document.getElementById(
    "txtServerPort"
).value =
    "1236";


document.getElementById(
    "txtServerIP"
).value =
    "127.0.0.1";


document.getElementById(
    "txtServerPassword"
).value =
    "1111";



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



/*
    --------------------------------------------------
    WebSocket
    --------------------------------------------------
*/


wsClient.onConnected =
function()
{

    log(
        "WebSocket: підключення успішне."
    );


    sendLogin();

};



wsClient.onDisconnected =
function()
{

    log(
        "WebSocket: з'єднання закрито."
    );

};



wsClient.onError =
function(error)
{

    log(
        "WebSocket: помилка."
    );

};



wsClient.onData =
function(data)
{

    handleServerData(data);

};

wsClient.onSend =
function(data)
{
    logSentData(data);
};

function logSentData(data)
{
    /*
        ArrayBuffer
    */

    if(data instanceof ArrayBuffer)
    {
        const bytes =
            new Uint8Array(data);


        let hex = "";

        for(let i = 0; i < bytes.length; i++)
        {
            hex +=
                bytes[i]
                .toString(16)
                .padStart(2, "0")
                .toUpperCase();

            if(i < bytes.length - 1)
                hex += " ";
        }


        log(
            "CLIENT SEND: " +
            bytes.length +
            " bytes"
        );


        log(
            "CLIENT HEX: " +
            hex
        );


        try
        {
            const text =
                new TextDecoder(
                    "utf-8"
                ).decode(bytes);


            if(text !== "")
            {
                log(
                    "CLIENT TEXT: " +
                    text
                );
            }
        }
        catch(e)
        {
            /*
                Дані не є UTF-8 текстом.
            */
        }

        return;
    }


    /*
        Uint8Array
    */

    if(data instanceof Uint8Array)
    {
        const bytes =
            data;


        let hex = "";

        for(let i = 0; i < bytes.length; i++)
        {
            hex +=
                bytes[i]
                .toString(16)
                .padStart(2, "0")
                .toUpperCase();

            if(i < bytes.length - 1)
                hex += " ";
        }


        log(
            "CLIENT SEND: " +
            bytes.length +
            " bytes"
        );


        log(
            "CLIENT HEX: " +
            hex
        );


        try
        {
            const text =
                new TextDecoder(
                    "utf-8"
                ).decode(bytes);


            if(text !== "")
            {
                log(
                    "CLIENT TEXT: " +
                    text
                );
            }
        }
        catch(e)
        {
        }

        return;
    }


    /*
        Звичайний текст.
    */

    if(typeof data === "string")
    {
        log(
            "CLIENT SEND TEXT: " +
            data
        );

        return;
    }


    /*
        Інший тип даних.
    */

    log(
        "CLIENT SEND: дані невідомого типу."
    );
}

function sendLogin()
{

    const serverPassword =
        document.getElementById(
            "txtServerPassword"
        ).value;


    const login =
        document.getElementById(
            "txtUserLogin"
        ).value.trim();


    const password =
        document.getElementById(
            "txtUserPassword"
        ).value;


    const packet =
        Protocol.createLogin(
            serverPassword,
            login,
            password,
            clientId
        );


    if(wsClient.send(packet))
    {

        log(
            "Авторизаційні дані відправлено."
        );

    }
    else
    {

        log(
            "Помилка: не вдалося відправити авторизаційні дані."
        );

    }

}



function handleServerData(data)
{

    /*
        Відповідь сервера.
        Вивід виконується тільки тут.
    */

    try
    {

        const text =
            new TextDecoder(
                "utf-8"
            ).decode(data);


        log(
            "SERVER: " + text
        );


        /*
            Тимчасово очікуємо JSON.
            Пізніше тут буде Protocol.parsePacket().
        */

        try
        {

            const response =
                JSON.parse(text);


            if(
                response.clientId !== undefined &&
                response.clientId !== null &&
                response.clientId !== ""
            )
            {

                clientId =
                    String(
                        response.clientId
                    );


                log(
                    "Client ID збережено: " +
                    clientId
                );

            }

        }
        catch(e)
        {
            /*
                Відповідь не JSON.
                Вона вже виведена у лог.
            */
        }

    }
    catch(e)
    {

        log(
            "SERVER: помилка перетворення binary у текст."
        );

    }

}



/*
    --------------------------------------------------
    Підключення до сервера
    --------------------------------------------------
*/


document.getElementById(
    "btnConnectServer"
)
.onclick = function()
{

    const ip =
        document.getElementById(
            "txtServerIP"
        ).value.trim();


    const port =
        document.getElementById(
            "txtServerPort"
        ).value.trim();


    const serverPassword =
        document.getElementById(
            "txtServerPassword"
        ).value;


    const login =
        document.getElementById(
            "txtUserLogin"
        ).value.trim();


    const password =
        document.getElementById(
            "txtUserPassword"
        ).value;



    /*
        Перевірка всіх полів.
    */

    if(ip === "")
    {
        log(
            "Помилка: не вказаний IP сервера."
        );

        return;
    }


    if(port === "")
    {
        log(
            "Помилка: не вказаний порт сервера."
        );

        return;
    }


    const portNumber =
        Number(port);


    if(
        !Number.isInteger(portNumber) ||
        portNumber < 1 ||
        portNumber > 65535
    )
    {
        log(
            "Помилка: некоректний порт сервера."
        );

        return;
    }


    if(serverPassword === "")
    {
        log(
            "Помилка: не вказаний пароль сервера."
        );

        return;
    }


    if(login === "")
    {
        log(
            "Помилка: не вказаний логін."
        );

        return;
    }


    if(password === "")
    {
        log(
            "Помилка: не вказаний пароль."
        );

        return;
    }



    /*
        Якщо підключення вже активне —
        робимо disconnect.

        Саме нове підключення виконає
        WebSocketClient.connect().
    */

    if(
        wsClient.socket &&
        (
            wsClient.socket.readyState ===
            WebSocket.OPEN ||

            wsClient.socket.readyState ===
            WebSocket.CONNECTING
        )
    )
    {

        log(
            "Активне підключення. Виконується disconnect."
        );


        wsClient.disconnect();

    }



    const url =
        "ws://" +
        ip +
        ":" +
        portNumber;


    log(
        "Підключення до " + url
    );


    wsClient.connect(url);

};




video.addEventListener("loadedmetadata", () =>
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

    // log("Курсор увійшов у плеєр.");
});


playerArea.addEventListener("mouseleave", () =>
{
    mouseInsidePlayer = false;
    keyboardCapture = false;

    // log("Курсор покинув плеєр.");
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

    // log(
    //     "Mouse WHEEL  delta=" +
    //     delta +
    //     "  x=" +
    //     x +
    //     "  y=" +
    //     y
    // );
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

    // log(
    //     "Mouse " +
    //     (pressed ? "DOWN" : "UP") +
    //     "  " +
    //     mouseButtonName(button) +
    //     "  x=" + x +
    //     "  y=" + y
    // );
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

        // log("Mouse: x=" + x + "  y=" + y);
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