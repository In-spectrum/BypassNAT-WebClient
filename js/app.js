const sidebar = document.getElementById('sidebar');
const btnOpen = document.getElementById('btnOpen');
const loggerBody = document.getElementById('loggerBody');
const txtFindClient = document.getElementById("txtFindClient");
const lstClients = document.getElementById("lstClients");
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

let wsClient = new WebSocketClient();


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

txtFindClient.addEventListener("input", () => {

    lstClients.innerHTML = "";

    const desktopLogin = txtFindClient.value;

    if (desktopLogin.length === 0)
        return;

     const packet =
            Protocol.createSearchDesktop(
                AppState.clientId,
                desktopLogin
            );

    // try
    // {
    //     const packet =
    //         Protocol.createSearchDesktop(
    //             AppState.clientId,
    //             desktopLogin
    //         );

    //     log("SearchDesktop 2: " + desktopLogin);
    // }
    // catch(error)
    // {
    //     log(
    //         "SearchDesktop ERROR: " +
    //         error.message
    //     );

    //     console.error(
    //         "SearchDesktop ERROR:",
    //         error
    //     );
    // }

    wsClient.send(packet);

});

function log(text)
{
    const now = new Date();

    const time =
        now.getHours().toString().padStart(2, '0') + ":" +
        now.getMinutes().toString().padStart(2, '0') + ":" +
        now.getSeconds().toString().padStart(2, '0');

    // Чи був скрол вже внизу
    const isAtBottom =
        loggerBody.scrollHeight -
        loggerBody.scrollTop -
        loggerBody.clientHeight < 10;

    loggerBody.innerHTML +=
        "[" + time + "] " + text + "<br>";

    // Автоматично вниз тільки якщо до цього були внизу
    if (isAtBottom) {
        loggerBody.scrollTop =
            loggerBody.scrollHeight;
    }
}

function setConnectionStatus(connected)
{
    const indicator =
        document.getElementById("connectionStatusIndicator");

    if (!indicator)
        return;

    if (connected)
    {
        // Підключено
        indicator.style.backgroundColor = "#4da6ff";
    }
    else
    {
        // Не підключено
        indicator.style.backgroundColor = "#808080";
    }
}

function fClientDisconnect()
{
    if (wsClient)
    {
        wsClient.disconnect();
    }
}

function showMessage(id, sData)
{
    //  log(
    //     "app.showMessage: " +
    //     "Id=" + id +
    //     ", Data=" + sData
    // );

    // Якщо повідомлення вже існує — видаляємо його
    const oldMessage = document.getElementById("clientMessage");
    if (oldMessage)
        oldMessage.remove();

    // Затемнення сторінки
    const overlay = document.createElement("div");
    overlay.id = "clientMessage";

    overlay.style.position = "fixed";
    overlay.style.left = "0";
    overlay.style.top = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";

    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.45)";

    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";

    overlay.style.zIndex = "10000";


    // Вікно повідомлення
    const messageBox = document.createElement("div");

    messageBox.style.minWidth = "300px";
    messageBox.style.maxWidth = "600px";

    messageBox.style.backgroundColor = "#ffffff";
    messageBox.style.borderRadius = "8px";

    messageBox.style.padding = "25px";

    messageBox.style.boxShadow =
        "0 4px 20px rgba(0, 0, 0, 0.35)";

    messageBox.style.textAlign = "center";


    // Текст повідомлення
    const messageText = document.createElement("div");

    messageText.style.fontSize = "16px";
    messageText.style.color = "#222222";
    messageText.style.whiteSpace = "pre-wrap";

    messageText.textContent = sData;


    // ID повідомлення
    const messageId = document.createElement("div");

    messageId.style.marginTop = "10px";
    messageId.style.fontSize = "12px";
    messageId.style.color = "#888888";

    //messageId.textContent = "ID: " + id;


    // Кнопка OK
    const button = document.createElement("button");

    button.textContent = "OK";

    button.style.marginTop = "20px";
    button.style.padding = "8px 25px";

    button.style.border = "none";
    button.style.borderRadius = "4px";

    button.style.cursor = "pointer";

    button.onclick = function()
    {
        overlay.remove();
    };


    messageBox.appendChild(messageText);
    messageBox.appendChild(messageId);
    messageBox.appendChild(button);

    overlay.appendChild(messageBox);

    document.body.appendChild(overlay);
}

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

/*
    --------------------------------------------------
    WebSocket
    --------------------------------------------------
*/

wsClient.slControl =
(
    sId,
    iVar,
    sData
) =>
{
    log(
        "app.slControl: " +
        "Id=" + sId +
        ", Var=" + iVar +
        ", Data=" + sData
    );

        switch(iVar)
        {
            case 2:
            {
                if(AppState.sWithoutStream === sData)
                {
                    const mes = "User '" + AppState.sDeskLogin
                                         + "' not support screen capture."
                                         + "\nOnly command line use."  
                                         ;
                    showMessage(sId, mes);
                }
                else
                {

                    if(AppState.sStreamNewUrl !== sData)
                    {
                        AppState.sStreamNewUrl = sData;                        
                    }

                    const url =
                            "http://localhost:8889/live/" +
                            AppState.sStreamNewUrl +
                            "/whep";

                    setTimeout(function() {
                        startPlayer(url);
                    }, 2000);

                    log(
                        "app.slControl 2.2: " +
                        "AppState.sStreamNewUrl = " + url
                    );
                }
                
                break;
            }  
            case 5:
            {
                const option =
                    document.createElement("option");


                /*
                    Відображається логін клієнта.
                */

                option.textContent =
                    sData;


                /*
                    Зберігаємо його ID.
                */

                option.value =
                    sId;


                lstClients.appendChild(
                    option
                );


                break;
            }   
            case 12:
            {
                const id = parseInt(sId, 10);

                if (id > 200)
                {
                    m_bErrStream = true;

                    if (id === 200 + 2
                        || id === 200 + 5
                        || id === 200 + 7
                        || id === 200 + 9
                        || id === 200 + 10)
                    {
                        //slDisConnectDesktop(1);

                        if (id === 200 + 9)
                        {
                            fClientDisconnect();

                            // if (m_obMenu)
                            // {
                            //     m_obMenu.fConnectServer("0");
                            // }
                        }
                    }
                }

                if (AppState.sDeskId.length !== 0
                    || id === 200 + 2
                    || id === 200 + 4
                    || id === 200 + 5
                    || id === 200 + 6
                    || id === 200 + 7
                    || id === 200 + 8
                    || id === 200 + 9
                    || id === 200 + 10
                    || id === 200 + 11)
                {

                    showMessage(sId, sData);

                    //сообщение низкой активности клиента
                    if (id === 200 + 11)
                    {
                        //sgControl("", 24, "", "");
                    }
                }
                break;
            }

            case 16: //переконнектится к серверу с новым Id
            {               
                break;
            }
        }
};


/*
    Усі діагностичні повідомлення WebSocket
    виводимо у поле "Логи" на сторінці.
*/

wsClient.onLog =
function(text)
{
    log(text);
};


/*
    Усі діагностичні повідомлення ParserData
    також виводимо у поле "Логи".
*/

ParserData.onLog =
function(text)
{
    log(text);
};


wsClient.onConnected =
function()
{
    log(
        "WebSocket: підключення успішне."
    );

    setConnectionStatus(true);

    sendLogin();
};


wsClient.onDisconnected =
function()
{
    log(
        "WebSocket: з'єднання закрито."
    );
    setConnectionStatus(false);
};


wsClient.onError =
function(error)
{
    log(
        "WebSocket: помилка."
    );
    setConnectionStatus(false);
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
    if(data instanceof ArrayBuffer)
    {
        const bytes =
            new Uint8Array(data);


        log(
            "CLIENT SEND: " +
            bytes.length +
            " bytes"
        );


        log(
            "CLIENT HEX: " +
            toHex(bytes)
        );


        return;
    }


    if(data instanceof Uint8Array)
    {
        log(
            "CLIENT SEND: " +
            data.length +
            " bytes"
        );


        log(
            "CLIENT HEX: " +
            toHex(data)
        );


        return;
    }


    if(typeof data === "string")
    {
        log(
            "CLIENT SEND TEXT: " +
            data
        );

        return;
    }


    log(
        "CLIENT SEND: дані невідомого типу."
    );
}


function toHex(data)
{
    let bytes = null;


    if(data instanceof ArrayBuffer)
    {
        bytes =
            new Uint8Array(data);
    }
    else
    if(data instanceof Uint8Array)
    {
        bytes =
            data;
    }


    if(bytes === null)
        return "[unknown type]";


    let hex = "";


    for(let i = 0; i < bytes.length; i++)
    {
        if(i > 0)
            hex += " ";

        hex +=
            bytes[i]
                .toString(16)
                .padStart(2, "0")
                .toUpperCase();
    }


    return hex;
}


function sendLogin()
{

    log(
        "LOGIN: використовується Client ID = " +
        (AppState.clientId || "<порожній>")
    );

     const keyDevServer = "";
        // document.getElementById(
        //     "txtDevServerKey"
        // ).value;

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
            login,
            password,
            AppState.clientId,
            keyDevServer,
            serverPassword
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
    if(!data)
        return;


    if(Array.isArray(data))
    {
        if(data.length === 0)
        {
            log(
                "app.handleServerData: SERVER: binary data отримано, але повного пакета ще немає."
            );

            return;
        }


        for(const packet of data)
        {
            if(!packet)
                continue;


            if(packet.type === 0x10)
            {
                log(
                    "app.handleServerData: SERVER: MESSAGE_STATUS. " +
                    "VAR=" + packet.variable +
                    ", DATA=" + (packet.dataText || "")
                );

                if(packet.validCRC === false)
                {
                    log(
                        "app.handleServerData: SERVER: MESSAGE_STATUS — CRC ПОМИЛКА."
                    );
                }
            }
            else if(packet.type === 0x07)
            {
                log(
                    "app.handleServerData: SERVER: NEW_ID. " +
                    "ID=" +
                    (AppState.clientId || "") +
                    ", DEV=" +
                    (packet.devServer !== undefined ?
                        packet.devServer :
                        "")
                );


                if(packet.validCRC === false)
                {
                    log(
                        "app.handleServerData:SERVER: NEW_ID — CRC ПОМИЛКА."
                    );
                }
            }
            else
            {
                log(
                    "app.handleServerData:SERVER: отримано пакет типу " +
                    packet.type
                );
            }
        }


        return;
    }


    log(
        "app.handleServerData: SERVER: ParserData повернув дані невідомого формату."
    );
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
    const keyDevServer = "";
        // document.getElementById(
        //     "txtDevServerKey"
        // ).value;

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

document.getElementById(
    "btnConnectClient"
)
.onclick = function()
{
    /*
        Перевіряємо наявність елементів
        у списку.
    */

    if(lstClients.options.length === 0)
    {
        log(
            "ConnectClient: список клієнтів порожній"
        );

        return;
    }


    /*
        Перевіряємо, чи вибраний елемент.
    */

    if(lstClients.selectedIndex < 0)
    {
        log(
            "ConnectClient: клієнт не вибраний"
        );

        return;
    }


    /*
        Отримуємо вибраний елемент.
    */

    const selectedOption =
        lstClients.options[
            lstClients.selectedIndex
        ];


    /*
        Login = текст елемента списку.
    */

    const login =
        selectedOption.textContent;


    /*
        ID = value елемента списку.
    */

    const id =
        selectedOption.value;


    /*
        Пароль.
    */

    const password =
        txtClientPassword.value;


    /*
        Перевірка паролю.
    */

    if(password.length < 4)
    {
        log(
            "ConnectClient: пароль повинен містити більше 3 символів"
        );

        return;
    }


    /*
        Формуємо пакет.
    */

    AppState.sDeskLogin = login;
    AppState.sDeskId = id;

    const packet =
        Protocol.createConnectToDesktop(
            AppState.sDeskLogin,
            password,
            AppState.sDeskId,
            true
        );


    /*
        Відправляємо на сервер.
    */

    if(
        wsClient.send(packet)
    )
    {
        log(
            "ConnectClient: пакет відправлено. " +
            "login=" +
            login +
            ", id=" +
            id
        );
    }
    else
    {
        log(
            "ConnectClient: не вдалося відправити пакет"
        );
    }
};

function startAppTimer() {
    setInterval(function() {

        //log("startAppTimer: running.");


        if(AppState.sDeskId.length > 0)
        {
            AppState.m_iTimeForWatcher++;

            if(AppState.m_iTimeForWatcher%5 == 0)
            {
                /*
                    Формуємо пакет.
                */

                const packet =
                    Protocol.fWatcher(
                        AppState.sDeskId,
                        AppState.clientId
                    );


                /*
                    Відправляємо на сервер.
                */

                if( wsClient.send(packet) )
                {
                    log(
                        "startAppTimer::fWatcher: пакет відправлено. "
                     );
                }
                else
                {
                    log(
                        "startAppTimer::fWatcher: не вдалося відправити пакет"
                    );
                }
            }

            if(AppState.m_iTimeForWatcher >= 10)
                AppState.m_iTimeForWatcher = 0;
        }

        // Тут пізніше додамо потрібну відправку даних
    }, 1000);
}

startAppTimer();
log("Програму запущено.");
log("Інтерфейс готовий.");