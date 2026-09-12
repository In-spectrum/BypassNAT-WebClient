const sidebar = document.getElementById('sidebar');
const btnOpen = document.getElementById("btnOpen");
const main = document.getElementById("main");;
const logger = document.getElementById("logger");
const btnLogger = document.getElementById("btnLogger");
const loggerBody = document.getElementById('loggerBody');
const txtFindClient = document.getElementById("txtFindClient");
const lstClients = document.getElementById("lstClients");
const video = document.getElementById("video");
const playerArea = document.getElementById("playerArea");
const cbScreenCapture = document.getElementById("cbScreenCapture");


// =====================================================
// SETTINGS SECTIONS (ACCORDION)
// =====================================================

function toggleSettingsSection(section)
{
    const title = section.querySelector(".blockTitle");
    const content = section.querySelector(".blockContent");

    if(!title || !content)
        return;

    const isOpen = !content.hidden;

    content.hidden = isOpen;
    title.setAttribute("aria-expanded", String(!isOpen));
    section.classList.toggle("isOpen", !isOpen);
}

document.querySelectorAll(".settingsSection .blockTitle").forEach(title =>
{
    const section =
        title.closest(".settingsSection");

    if(!section)
        return;

    if(section.id === "commandLineSection")
        return;

    title.addEventListener("click", () =>
    {
        toggleSettingsSection(section);
    });

    title.addEventListener("keydown", event =>
    {
        if(event.key === "Enter" || event.key === " ")
        {
            event.preventDefault();
            toggleSettingsSection(section);
        }
    });
});


const playerState =
{
    frameWidth: 0,
    frameHeight: 0,
    videoReady: false
};

const LOG_VIEW_SIZE = 100;
let logLines = [];
let loggerVisible = true;

let menuVisible = true;

let m_bOldClient = false;
let m_iTimeSearchClient = 0;

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
    "txtWebRTCPort"
).value =
    AppState.sWebRTCPort;


document.getElementById(
    "txtServerIP"
).value =
    "127.0.0.1";


document.getElementById(
    "txtServerPassword"
).value =
    "1111";

btnLogger.onclick = () => {

    loggerVisible = !loggerVisible;

    if (loggerVisible) {

        logger.classList.remove("hidden");

        main.classList.remove("fullscreen");
        sidebar.classList.remove("fullscreen");
        btnLogger.classList.remove("fullscreen");

        btnLogger.innerHTML = "▼";

    } else {

        logger.classList.add("hidden");

        main.classList.add("fullscreen");
        sidebar.classList.add("fullscreen");
        btnLogger.classList.add("fullscreen");

        btnLogger.innerHTML = "▲";
    }
};

btnOpen.onclick = () => {

    menuVisible = !menuVisible;

    if (menuVisible) {
        sidebar.style.display = "block";

        // Кнопка справа від sidebar
        btnOpen.style.left = "300px";

        btnOpen.innerHTML = "◀";

    } else {

        sidebar.style.display = "none";

        // Кнопка біля лівого краю
        btnOpen.style.left = "0px";

        btnOpen.innerHTML = "▶";
    }
};


document.getElementById('btnClear').onclick = () =>
{
    logLines = [];

    loggerBody.innerHTML = "";
};


cbScreenCapture.addEventListener("change", () => {

    AppState.bScreanCapture = cbScreenCapture.checked;

    if(!cbScreenCapture.checked)
    {
        document.getElementById("idTxtWebRTCPort").style.display = "none";  // сховати
    }
    else
    {
       document.getElementById("idTxtWebRTCPort").style.display = "flex";  // показати
    }

    if(AppState.iDeskConnectStatus > 0)
    {
        fConnectDevice();
    }

});

function oldClient()
{
    if(m_bOldClient)
    {
        for (let i = lstClients.options.length - 1; i >= 0; i--) {
            const option = lstClients.options[i];

            if (option.dataset.connected === "false") {
                option.remove();
            }
        }
    }
    else
    {
       for (const option of lstClients.options) {
            option.dataset.connected = "false";
       }
    }

    m_bOldClient = !m_bOldClient;

    m_iTimeSearchClient = 0;
   
}

function addClient( _optionIn )
{
    m_iTimeSearchClient = 0;

    let a_bAdd = false;

    for (const option of lstClients.options) {
        if (option.value === _optionIn.value) {
            option.dataset.connected = "true";
            option.textContent = _optionIn.textContent;

            if(_optionIn.value === AppState.sDeskId)
            {
                AppState.sDeskLogin = option.textContent;
                option.selected = true;

                document.querySelector('label[for="txtDeviceUse"]').textContent = "Device control:";
                document.querySelector('label[for="txtLogDeviceUse"]').textContent = AppState.sDeskLogin;
            }

            a_bAdd = true;
            break;
        }
    }

    if(!a_bAdd)
    {    
        lstClients.appendChild(
            _optionIn
        );

    }

    m_iTimeSearchClient = 0;
}

function searchClient()
{
    // log("searchClient 0: "
    //     + AppState.sMyId
    // );

    m_iTimeSearchClient = 0;

    oldClient();
    
    if (AppState.sMyId.length  === 0)
        return;

    //lstClients.innerHTML = "";

    const desktopLogin = txtFindClient.value;

    // log("searchClient 2: "
    //     + desktopLogin
    // );

    if (desktopLogin.length === 0)
    {
        lstClients.innerHTML = "";
        return;
    }
       

     const packet =
            Protocol.createSearchDesktop(
                AppState.sMyId,
                desktopLogin
            );

    // try
    // {
    //     const packet =
    //         Protocol.createSearchDesktop(
    //             AppState.sMyId,
    //             desktopLogin
    //         );

    //     log("searchClient 2: " + desktopLogin);
    // }
    // catch(error)
    // {
    //     log(
    //         "searchClient ERROR: " +
    //         error.message
    //     );

    //     console.error(
    //         "searchClient ERROR:",
    //         error
    //     );
    // }

    wsClient.send(packet);
}

txtFindClient.addEventListener("input", () => {
    
    searchClient();   

});

function log(text)
{
    console.log(text);
    return;

    const now = new Date();

    const time =
        now.getHours().toString().padStart(2, '0') + ":" +
        now.getMinutes().toString().padStart(2, '0') + ":" +
        now.getSeconds().toString().padStart(2, '0');

    const line =
        "[" + time + "] " + text;


    /*
        Додаємо рядок у масив.
    */

    logLines.push(line);


    /*
        Залишаємо тільки останні 50 рядків.
    */

    if(logLines.length > LOG_VIEW_SIZE)
    {
        logLines.splice(
            0,
            logLines.length - LOG_VIEW_SIZE
        );
    }


    /*
        Чи був scrollbar внизу
        до оновлення.
    */

    const isAtBottom =
        loggerBody.scrollHeight -
        loggerBody.scrollTop -
        loggerBody.clientHeight < 10;


    /*
        Оновлюємо logger.
    */

    loggerBody.innerHTML =
        logLines.join("<br>");


    /*
        Якщо користувач був внизу —
        прокручуємо вниз.

        Якщо він читав старі повідомлення
        вище — не рухаємо його.
    */

    if(isAtBottom)
    {
        loggerBody.scrollTop =
            loggerBody.scrollHeight;
    }
}

function setStatusConnectToDevice(connectedv)
{
    // log(
    //     "setStatusConnectToDevice: " +
    //     connectedv
    // );
    
    const indicator =
        document.getElementById("connectionStatusDevice");

    if (!indicator)
        return;

    if (connectedv)
    {
        AppState.iDeskConnectStatus = 2;

        // Підключено
        indicator.style.setProperty("--indicator-color", "#4da6ff");
        document.getElementById("deviceConnectionText").style.display = "none";  // сховати

        document.getElementById(
            "btnConnectClient"
        ).innerHTML = "Disconnect";

        //document.getElementById("btnConnectClient").style.display = "none";  // сховати


    }
    else
    {
        // Не підключено
        indicator.style.setProperty("--indicator-color", "#808080");

        //document.getElementById("btnConnectClient").style.display = "flex";  // показати
        
        AppState.iDeskConnectStatus = 0;

        if(AppState.sDeskId)
        {
            document.getElementById("deviceConnectionText").style.display = "flex";  // показати
            document.getElementById(
                "btnConnectClient"
            ).innerHTML = "Connecting... STOP";

            AppState.iDeskConnectStatus = 1;
        }
    }
}

function fConnectDevice()
{   
    setStatusConnectToDevice(false);
    stopPlayer();

    if(!AppState.sDeskLogin.length || !AppState.sDeskPassword.length || !AppState.sDeskId.length )
        return;

    document.getElementById(
            "btnConnectClient"
        ).innerHTML = "Connecting... STOP";

    AppState.iDeskConnectStatus = 1;

    AppState.iTimeDeskActive = 0;

    const packet =
        Protocol.createConnectToDesktop(
            AppState.sDeskLogin,
            AppState.sDeskPassword,
            AppState.sDeskId,
            AppState.bScreanCapture
        );


    /*
        Відправляємо на сервер.
    */

    if(
        wsClient.send(packet)
    )
    {
        // log(
        //     "ConnectClient: пакет відправлено. " +
        //     "login=" +
        //     AppState.sDeskLogin +
        //     ", id=" +
        //     AppState.sDeskId
        // );       
        
        
    }
    else
    {
        log(
            "ConnectClient: не вдалося відправити пакет"
        );
    }


    AppState.iTimeDeskActive = 0;
    AppState.bTimeDeskNoActiveShow = false;
    
}

function fDisconnectDevice()
{

    //log("fDisconnectDevice 0: " + AppState.sDeskId);

    document.getElementById(
                "clipboardRiadWrite"
            ).style.display = "none"; 

    stopPlayer();

    document.getElementById("deviceConnectionText").style.display = "none";  // сховати

    if(AppState.sDeskId.length > 0)
    {
        const packet =
        Protocol.createConnectToDesktop(
            "0",
            "0",
            "0",
            false
        );


        /*
            Відправляємо на сервер.
        */

        if(
            wsClient.send(packet)
        )
        {
            // log(
            //     "fDisconnectDevice: пакет відправлено. "
            // );

        

        }
        else
        {
            log(
                "fDisconnectDevice: не вдалося відправити пакет"
            );
        }

    }

    
    

    AppState.sDeskId = "";
    AppState.sDeskLogin = "";
    AppState.sDeskPassword = "";
    AppState.iTimeDeskActive = 0;

    document.querySelector('label[for="txtDeviceUse"]').textContent = "";
    document.querySelector('label[for="txtLogDeviceUse"]').textContent = "";

    AppState.sStreamNewUrl = "";
  
        
    setStatusConnectToDevice(false);

    document.getElementById(
            "btnConnectClient"
        ).innerHTML = "NEW connect";    

}

function setConnectionStatus(connected)
{
    AppState.serverConnected = connected;

    const btnConnectServer =
        document.getElementById("btnConnectServer");

    const indicator =
        document.getElementById("connectionStatusIndicator");

    if (!indicator)
        return;

    if (AppState.serverConnected)
    {
        // Підключено
        indicator.style.setProperty("--indicator-color", "#4da6ff");
        btnConnectServer.innerHTML = "Server disconnect";

        //перепідключаємося
        if(AppState.iDeskConnectStatus == 1)
        {
            fConnectDevice();
        }
        
    }
    else
    {
        // Не підключено
        indicator.style.setProperty("--indicator-color", "#808080");

        if(!AppState.serverConnecting)
            btnConnectServer.innerHTML = "Server connect";

        //перепідключаємося
        if(AppState.iDeskConnectStatus == 2)
        {
            fConnectDevice();
        }
    }

    document.getElementById("serverConnectionText").style.display = "none";  // сховати

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
    //log("Відтворення відео розпочато.");
});

playerArea.addEventListener("ended", () =>
{
    //log("Відтворення завершено.");
});

playerArea.addEventListener("error", () =>
{
    //log("Помилка відтворення відео.");
});

initMouse();

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
    // log(
    //     "app.wsClient.slControl: " +
    //     "Id=" + sId +
    //     ", Var=" + iVar +
    //     ", Data=" + sData
    // );

    //     log(
    //     "app.wsClient.slControl: " +
    //     "Id=" + sId +
    //     ", Var=" + iVar
    // );

        switch(iVar)
        {
            case 2:
            {
                // log(
                //     "app.wsClient.slControl 0: " +
                //     "AppState.sStreamNewUrl = " + AppState.sStreamNewUrl
                // );

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
                    // log(
                    //     "app.wsClient.slControl 2.0: " +
                    //     "AppState.sStreamNewUrl = " + AppState.sStreamNewUrl
                    // );

                    if(AppState.sStreamNewUrl !== sData)
                    {
                        AppState.sStreamNewUrl = sData;                        
                    }

                    AppState.m_iTimeForWatcher = 0;

                    // log(
                    //     "app.wsClient.slControl 2.1: " +
                    //     AppState.sStreamNewUrl
                    // );

                    AppState.iTimeDeskActive = 0;

                    AppState.bStreamError = false;
                    setTimeout(function() {
                        fStreamStart();
                    }, 1000);

                    

                    // log(
                    //     "app.wsClient.slControl 2.10: ");
                }
                
                break;
            }  
            case 4:
            {
                //log("app.slControl 4.0: " + AppState.iTimeDeskActive );

                AppState.bTimeDeskNoActiveShow = false;
                AppState.iTimeDeskActive = 0;

                if(AppState.sDeskId.length)
                    setStatusConnectToDevice(true);          


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

                option.dataset.connected = "true";

                addClient(option);

                break;
            }   
            case 8:
            {
                /*
                    Clipboard від remote PC.
                */

                Clipboard.fBufferWrite(
                    parseInt(
                        sId,
                        10
                    ),
                    sData
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
                        fDisconnectDevice();

                        if (id === 200 + 9)
                        {
                            fClientDisconnect();
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
                if( AppState.sMyId !== sData)
                {
                    setConnectionStatus(false);

                    AppState.sMyId = sData;
                    startConnectServer();
                }

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

/*
    --------------------------------------------------
    File Copy
    --------------------------------------------------
*/

ParserData.slFileCopyRecive =
async function(
    sForId,
    sFromId,
    sFilePath,
    iFileSize,
    iPosition,
    baData
)
{
    if(!fileCopy)
    {
        return;
    }


    await fileCopy.writeReceiveFile(
        {
            //sForId,
            //sFromId,

            sFilePath,
            iFileSize,
            iPosition,
            baData
        }
    );
};

ParserData.slFileCopySend =
async function(
    sForId,
    sFromId,
    sFilePath,
    iPosition,
)
{
    if(!fileCopy)
    {
        return;
    }

    await fileCopy.sendFile(
        sFilePath,
        iPosition
    );
};
//////////////////


wsClient.onConnected =
function()
{  

    // log(
    //     "WebSocket: підключення успішне."
    // );

    setConnectionStatus(false);    

    sendLogin();

    if(AppState.sMyId.length)
        setConnectionStatus(true);
};


wsClient.onDisconnected =
function()
{
    // log(
    //     "WebSocket: з'єднання закрито."
    // );
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


        // log(
        //     "CLIENT SEND: " +
        //     bytes.length +
        //     " bytes"
        // );


        // log(
        //     "CLIENT HEX: " +
        //     toHex(bytes)
        // );


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

    // log(
    //     "sendLogin: використовується Client ID = " +
    //     (AppState.sMyId || "<порожній>")
    // );

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

        
        //одразу після конекта не завжди уходять дані на сервер
        //тому - запуск черз 1с.
        setTimeout(function() {

                        const packet =
                            Protocol.createLogin(
                                login,
                                password,
                                AppState.sMyId,
                                keyDevServer,
                                serverPassword
                            );


                        if(wsClient.send(packet))
                        {

                            // log(
                            //     "Авторизаційні дані відправлено."
                            // );

                            searchClient();

                        }
                        else
                        {

                            log(
                                "Помилка: не вдалося відправити авторизаційні дані."
                            );

                            showMessage(0, "Error.\r\nFailed to send authorization data.");
                        }

                    }, 1000);


    
}



function handleServerData(data)
{
    if(!data)
        return;

    if(!Array.isArray(data))
    {
        // log(
        //     "app.handleServerData: SERVER: ParserData повернув дані невідомого формату."
        // );

        return;
    }

    /*
        Порожній результат ParserData
        не є помилкою.

        Це може означати:
        - пакет ще накопичується;
        - дані не містили завершеного пакета;
        - пакет обробляється іншим механізмом.
    */

    if(data.length === 0)
        return;


    for(const packet of data)
    {
        if(!packet)
            continue;


        if(packet.type === 0x10)
        {
            // log(
            //     "app.handleServerData: SERVER: MESSAGE_STATUS. " +
            //     "VAR=" + packet.variable +
            //     ", DATA=" + (packet.dataText || "")
            // );

            if(packet.validCRC === false)
            {
                log(
                    "app.handleServerData: SERVER: MESSAGE_STATUS — CRC ПОМИЛКА."
                );
            }
        }
        else if(packet.type === 0x07)
        {
            // log(
            //     "app.handleServerData: SERVER: NEW_ID. " +
            //     "ID=" +
            //     (AppState.sMyId || "") +
            //     ", DEV=" +
            //     (packet.devServer !== undefined ?
            //         packet.devServer :
            //         "")
            // );


            if(packet.validCRC === false)
            {
                log(
                    "app.handleServerData: SERVER: NEW_ID — CRC ПОМИЛКА."
                );
            }
        }
        else
        {
            // log(
            //     "app.handleServerData: SERVER: отримано пакет типу " +
            //     packet.type
            // );
        }
    }
}



/*
    --------------------------------------------------
    Підключення до сервера
    --------------------------------------------------
*/

function startConnectServer() {

    document.getElementById("serverConnectionText").style.display = "flex";  // показати
    document.getElementById("btnConnectServer").innerHTML = "Server connecting... Stop!";

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

    if(ip === "" || !AppState.isValidIPv4(ip))
    {
        log(
            "Помилка: не вказаний IP сервера."
        );

        showMessage(0, "Error.\r\nThe server IP address is incorrect.");

        return;
    }


    if(port === "")
    {
        log(
            "Помилка: не вказаний порт сервера."
        );

        showMessage(0, "Error.\r\nThe server port is incorrect.");

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

        showMessage(0, "Error.\r\nThe server port is incorrect.");

        return;
    }


    if(serverPassword === "" || serverPassword.length < 4 || !AppState.isLatinLettersAndDigits(serverPassword ))
    {
        log(
            "Помилка: не вказаний пароль сервера."
        );

        if(AppState.isLatinLettersAndDigits(serverPassword ))
        {
            showMessage(0, "Error.\r\nThe server password is incorrect.");
        }
        else
        {
            showMessage(0, "Error.\r\nThe server password is incorrect.\r\nOnly [A-Z, a-z, 0-9]");
        }   

        return;
    }


    if(login === "" || login.length < 5 || !AppState.isLatinLettersAndDigits(login ))
    {
        log(
            "Помилка: не вказаний логін."
        );


        if(AppState.isLatinLettersAndDigits(login ))
        {
            showMessage(0, "Error.\r\nThe user login is incorrect.");
        }
        else
        {
            showMessage(0, "Error.\r\nThe user login is incorrect.\r\nOnly [A-Z, a-z, 0-9]");
        } 

        return;
    }


    if(password === "" || password.length < 5 || !AppState.isLatinLettersAndDigits(password))
    {
        log(
            "Помилка: не вказаний пароль."
        );

        if(AppState.isLatinLettersAndDigits(password))
        {
            showMessage(0, "Error.\r\nThe user password is incorrect.");
        }
        else
        {
            showMessage(0, "Error.\r\nThe user password is incorrect.\r\nOnly [A-Z, a-z, 0-9]");
        }

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

        // log(
        //     "Активне підключення. Виконується disconnect."
        // );


        wsClient.disconnect();

    }


    AppState.serverIP = ip;

    const url =
        "ws://" +
        AppState.serverIP +
        ":" +
        portNumber;


    // log(
    //     "Підключення до " + url
    // );


    wsClient.connect(url);

}


function setupPasswordButton(buttonId, inputId) {

    const button = document.getElementById(buttonId);
    const input = document.getElementById(inputId);

    if (!button || !input) {
        return;
    }

    button.addEventListener("click", () => {

        if (input.type === "password") {

            input.type = "text";
            button.innerHTML = "🙈";

        } else {

            input.type = "password";
            button.innerHTML = "👁";

        }

    });
}

document.getElementById(
    "btnConnectServer"
)
.onclick = function()
{

    if(AppState.serverConnected || AppState.serverConnecting)
    {
        fDisconnectDevice();

        AppState.serverConnectTime = 0;
        AppState.serverConnecting = false;
        document.getElementById("btnConnectServer").innerHTML = "Server connect";

        if (wsClient.socket) {
            wsClient.disconnect();
        }

        return;
    }

    
    AppState.serverConnectTime = 0;
    AppState.serverConnecting = true;
    startConnectServer();

};

document.getElementById(
    "btnConnectClient"
)
.onclick = async function()
{
     if(AppState.iDeskConnectStatus > 0)
    {
        fDisconnectDevice();
        
        return;
    }

    /*
        Перевіряємо наявність елементів
        у списку.
    */
      

    if(lstClients.options.length === 0)
    {
        log(
            "ConnectClient: список клієнтів порожній"
        );

        showMessage(0, "Device list is empty.");

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

        showMessage(0, "Device not selected.");

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

    if(password.length < 4 || !AppState.isLatinLettersAndDigits(password))
    {
        log(
            "ConnectClient: пароль повинен містити більше 4 символів"
        );

        if(AppState.isLatinLettersAndDigits(password))
        {
            showMessage(0, "Error.\r\nDevice password is incorrect.");
        }
        else
        {
            showMessage(0, "Error.\r\nDevice password is incorrect.\r\nOnly [A-Z, a-z, 0-9]");
        }

        return;
    }


    if(AppState.bScreanCapture)
    {       

        const WebRTC_port =
            document.getElementById(
                "txtWebRTCPort"
            ).value.trim();

        if(WebRTC_port === "")
        {
            log(
                "Помилка: не вказаний WebRTC-порт."
            );

            showMessage(0, "Error.\r\nThe WebRTC-port is incorrect.");

            return;
        }

        const WebRTCportNumber =
        Number(WebRTC_port);


        if(
            !Number.isInteger(WebRTCportNumber) ||
            WebRTCportNumber < 1 ||
            WebRTCportNumber > 65535
        )
        {
            log(
                "Помилка: некоректний WebRTC-порт."
            );

            showMessage(0, "Error.\r\nThe WebRTC-port is incorrect.");

            return;
        }

        AppState.sWebRTCPort = WebRTC_port;

        //  log(
        //         "btnConnectClient::sWebRTCPort: " +  AppState.sWebRTCPort
        //     );
    }

   
    /*
        Формуємо пакет.
    */

    AppState.sDeskLogin = login;
    AppState.sDeskId = id;
    AppState.sDeskPassword = password;   
    AppState.bTimeDeskNoActiveShow = false; 

    document.querySelector('label[for="txtDeviceUse"]').textContent = "Device control:";
    document.querySelector('label[for="txtLogDeviceUse"]').textContent = AppState.sDeskLogin;            


    /*
        Одноразовий запит дозволу
        на читання локального clipboard.

        Навіть при Deny підключення
        до remote PC продовжується.
    */

    const bClipboardReadPermission =
        await Clipboard.requestReadPermission();

    if(!bClipboardReadPermission)
    {
        log(
            "Clipboard: доступ на читання не наданий."
        );
    }  

    /*
        Підключення до remote PC.
    */
    fConnectDevice();
}


 function fStreamStart()
 {
    // log("app.fStreamStart 0: " +
    //     AppState.serverIP.length +
    //     " " + AppState.sWebRTCPort.length +
    //     " " +  AppState.sStreamNewUrl.length);

    if(!AppState.serverIP.length || !AppState.sWebRTCPort.length || !AppState.sStreamNewUrl.length)
        return;

    //log("app.fStreamStart 1: ");

    const url =
        "http://" +
        AppState.serverIP +
        ':' +
        AppState.sWebRTCPort + 
        "/live/" +
        AppState.sStreamNewUrl +
        "/whep";                            

    startPlayer(url);

    //log("app.fStreamStart 10: ");
 }


function fStreamWatcher()
{
    if(AppState.bScreanCapture
        && AppState.sStreamNewUrl.length 
        && AppState.sDeskId.length
    )
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
                        AppState.sMyId
                    );


                /*
                    Відправляємо на сервер.
                */

                if( wsClient.send(packet) )
                {
                    // log(
                    //     "fWatcher: пакет відправлено. "
                    // );

                    const now =
                        performance.now();

                    // log(
                    //    "fWatcher: пакет відправлено. " +
                    //     now.toFixed(0)
                    // );
                }
                else
                {
                    log(
                        "fWatcher: не вдалося відправити пакет"
                    );
                }
            }

            if(AppState.m_iTimeForWatcher >= 10)
                AppState.m_iTimeForWatcher = 0;
    }    
}

function startAppTimer() {
    setInterval(function() {

    //log("startAppTimer: running. ");

        if(AppState.serverConnected && AppState.sDeskId.length)
        {
            //log("startAppTimer 5.0:" + AppState.iTimeDeskActive );

            //перевірка, чи приходять від Девайса сигнали активності
            //, якщо ні - то перепідключаємося
            if(AppState.iTimeDeskActive >= 3)
            {
                //log("startAppTimer 5.1:");

                if(AppState.bTimeDeskNoActiveShow)
                {
                    // log(
                    //         "startAppTimer::fGetActiveClient 5: AppState.bTimeDeskNoActiveShow"
                    //     );

                    fConnectDevice();
                }           

                AppState.bTimeDeskNoActiveShow = !AppState.bTimeDeskNoActiveShow;

                const packet =
                        Protocol.fGetActiveClient(
                            AppState.sMyId
                        );


                    /*
                        Відправляємо на сервер.
                    */

                    if( wsClient.send(packet) )
                    {
                        // log(
                        //     "startAppTimer::fGetActiveClient: пакет відправлено. "
                        //  );
                    }
                    else
                    {
                        log(
                            "startAppTimer::fGetActiveClient: не вдалося відправити пакет"
                        );
                    }


                
                //sgSendMassang( MyProtocol::fGetActiveClient( StaticData::m_sMyId ) );

                AppState.iTimeDeskActive = -1;
            }
            else{
                
                //якщо звязок з Девайсом є, а відео відсутне - йде перепідключення 
                // (можливо змінився стрім-УРЛ, або не працює відео-сервер)
                if(AppState.iTimeDeskActive >= 2)
                {
                    if(AppState.bScreanCapture && !AppState.bRunStream)
                    {
                        if(AppState.bStreamError)
                        {
                            // log(
                            //     "startAppTimer::fGetActiveClient 6: AppState.bStreamError"
                            // );

                            AppState.bStreamError = false;
                            fConnectDevice();
                        }
                    }
                }
            }

            AppState.iTimeDeskActive++;


            //припиняє дозвіл на отримання Clipboard від кліента
            if(AppState.bScreanCapture 
                && AppState.bRunStream
                && AppState.iClipboardTimeCopy < 10
            )
            {
               AppState.iClipboardTimeCopy++;
            }
            
            
        }

    
        //відправка клієнту повідомлення
        // , що його дивляться (щоб продовжував стрім)
        fStreamWatcher();

        //повторне підключення до сервера
        // , якщо конект пропав
        // , а команда на підключення не відмінялася
        if(AppState.serverConnectTime == 3)
        {
            AppState.serverConnectTime = 0;

            if(AppState.serverConnecting && !AppState.serverConnected)
            {                
                // log(
                //         "startAppTimer::fGetActiveClient 7: AppState.serverConnecting"
                //     );

                startConnectServer();
            }
        }

        AppState.serverConnectTime++;    
        
        //контроль активності копіювання файла
        if(fileCopy && fileCopy.m_bCopying && fileCopy.m_iTimeCopying < 10)
        {
            fileCopy.m_iTimeCopying++;

            if(fileCopy.m_iTimeCopying == 7)
            {
                // log(
                //     "startAppTimer::fileCopy: closeTransferFile. "
                // );  
                
                showMessage(
                    0,
                    "Error.\n\nFile transfer failed.\nPlease check the connection to the remote device."
                );

                fileCopy.closeTransferFile();
            }
        }       
        
        if( AppState.serverConnected)
        {
            m_iTimeSearchClient++;

            if(m_iTimeSearchClient >= 3)
            {
                // log(
                //     "startAppTimer::searchClient 1: "
                // );

                searchClient();
            }
        }

    }, 1000);
}

function startThePage() {
    btnLogger.innerHTML = "▼";
    btnOpen.innerHTML = "◀";

    document.getElementById("serverConnectionText").style.display = "none";  // сховати
    document.getElementById("deviceConnectionText").style.display = "none";  // сховати

    setupPasswordButton(
        "btnShowServerPassword",
        "txtServerPassword"
    );

    setupPasswordButton(
        "btnShowUserPassword",
        "txtUserPassword"
    );

    setupPasswordButton(
        "btnShowClientPassword",
        "txtClientPassword"
    );

    btnLogger.style.display = "none";
    btnLogger.onclick();

    document.getElementById(
                "clipboardRiadWrite"
            ).style.display = "none";

    Keyboard.init();

    if(!cbScreenCapture.checked)
    {
        document.getElementById("idTxtWebRTCPort").style.display = "none";  // сховати
    }
    else
    {
       document.getElementById("idTxtWebRTCPort").style.display = "flex";  // показати
    }

    
    initializeCommandLine();

    showMessage(
        0,
        "This application is intended for remote device control.\n\n" +
        "No one can use this application to control your device\n" +
        "or view your desktop.\n\n" +
        "File and clipboard data are only exchanged\n" +
        "with your consent.\n\n" +
        "This web-client will not appear\nin the device finder for connections."
    );
    
    startAppTimer();
    log("Програму запущено.");
    log("Інтерфейс готовий.");
}

startThePage()