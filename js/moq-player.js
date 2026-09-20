// moq-player.js


let moqPlayerReader = null;
let moqPlayerError = 0;


// URL останнього стріму.
// Потрібен для повторного запуску після підтвердження сертифіката.
let moqPlayerLastUrl = "";


// Чи зараз показано повідомлення про TLS-сертифікат.
let moqPlayerCertificateDialog = false;


/*
    --------------------------------------------------
    Start MoQ player
    --------------------------------------------------
*/

function startMoqPlayer(url)
{
    AppState.bRunStream = false;


    const video =
        document.getElementById("video");


    if(!video)
    {
        log(
            "MoQ Player ERROR: video element not found"
        );

        return;
    }


    log(
        "MoQ Player URL: " +
        url
    );


    moqPlayerLastUrl = url;


    stopMoqPlayer();


    const fingerprintUrl =
        new URL(
            "fingerprint",
            url.endsWith("/")
                ? url
                : url + "/"
        );


    log(
        "MoQ Player fingerprint URL: " +
        fingerprintUrl.toString()
    );


    try
    {
        moqPlayerReader =
            new MediaMTXMoQReader({

                fingerprintUrl:
                    fingerprintUrl,

                url:
                    url,

                user:
                    "",

                pass:
                    "",

                token:
                    "",

                videoElement:
                    video,


                onError:
                    function(error)
                    {
                        log(
                            "MoQ Player ERROR: " +
                            error
                        );


                        AppState.bStreamError =
                            true;


                        /*
                            --------------------------------------------------
                            TLS / certificate error
                            --------------------------------------------------
                        */

                        const errorText =
                            String(error || "");


                        if(
                            errorText.includes(
                                "Failed to fetch"
                            )
                            ||
                            errorText.includes(
                                "CERT_AUTHORITY_INVALID"
                            )
                            ||
                            errorText.includes(
                                "certificate"
                            )
                            ||
                            errorText.includes(
                                "Certificate"
                            )
                            ||
                            errorText.includes(
                                "TLS"
                            )
                            ||
                            errorText.includes(
                                "Opening handshake failed"
                            )
                        )
                        {
                            log(
                                "MoQ Player: possible TLS certificate problem"
                            );


                            showMoqCertificateDialog(
                                moqPlayerLastUrl
                            );


                            return;
                        }


                        setMoqPlayerStatus(
                            "error"
                        );
                    },


                onSubscribed:
                    function(hasAudio)
                    {
                        log(
                            "MoQ Player: subscribed, audio=" +
                            hasAudio
                        );


                        AppState.bStreamError =
                            false;


                        moqPlayerCertificateDialog =
                            false;


                        setMoqPlayerStatus(
                            "connected"
                        );
                    },


                onAudioMuted:
                    function(muted)
                    {
                        log(
                            "MoQ Player: audio muted=" +
                            muted
                        );
                    }
            });
    }
    catch(error)
    {
        log(
            "MoQ Player CREATE ERROR: " +
            error.message
        );


        moqPlayerReader =
            null;


        setMoqPlayerStatus(
            "error"
        );
    }


    setMoqPlayerStatus(
        "connecting"
    );
}


/*
    --------------------------------------------------
    Stop
    --------------------------------------------------
*/

function stopMoqPlayer()
{
    AppState.bRunStream =
        false;


    if(moqPlayerReader)
    {
        try
        {
            if(
                typeof moqPlayerReader.close ===
                "function"
            )
            {
                moqPlayerReader.close();
            }
        }
        catch(error)
        {
            log(
                "stopMoqPlayer ERROR 2.5: " +
                error.message
            );
        }


        moqPlayerReader =
            null;
    }


    const video =
        document.getElementById("video");


    if(video)
    {
        video.innerHTML = "";
    }


    setMoqPlayerStatus(
        "disconnected"
    );
}


/*
    --------------------------------------------------
    TLS certificate dialog
    --------------------------------------------------
*/

function showMoqCertificateDialog(url)
{
    /*
        Не показуємо декілька однакових вікон,
        якщо moq-reader викличе onError декілька разів.
    */

    if(moqPlayerCertificateDialog)
    {
        return;
    }


    moqPlayerCertificateDialog =
        true;


    /*
        --------------------------------------------------
        Повністю зупиняємо поточний reader.

        ВАЖЛИВО:
        stopMoqPlayer() тут НЕ використовуємо,
        тому що воно очищає video та змінює інтерфейс.
        Нам потрібно залишити можливість показати
        наше повідомлення.
        --------------------------------------------------
    */

    if(moqPlayerReader)
    {
        try
        {
            if(
                typeof moqPlayerReader.close ===
                "function"
            )
            {
                moqPlayerReader.close();
            }
        }
        catch(error)
        {
            log(
                "MoQ Player certificate stop ERROR: " +
                error.message
            );
        }


        moqPlayerReader =
            null;
    }


    AppState.bRunStream =
        false;


    setMoqPlayerStatus(
        "error"
    );


    /*
        --------------------------------------------------
        Визначаємо origin MediaMTX.
        --------------------------------------------------
    */

    let mediaMtxUrl = "";


    try
    {
        const streamUrl =
            new URL(url);


        mediaMtxUrl =
            streamUrl.origin + "/";
    }
    catch(error)
    {
        log(
            "MoQ Player certificate URL ERROR: " +
            error.message
        );


        return;
    }


    /*
        --------------------------------------------------
        Створюємо overlay
        --------------------------------------------------
    */

    let overlay =
        document.getElementById(
            "moqCertificateDialog"
        );


    if(overlay)
    {
        overlay.remove();
    }


    overlay =
        document.createElement(
            "div"
        );


    overlay.id =
        "moqCertificateDialog";


    overlay.style.position =
        "fixed";

    overlay.style.left =
        "0";

    overlay.style.top =
        "0";

    overlay.style.width =
        "100%";

    overlay.style.height =
        "100%";

    overlay.style.background =
        "rgba(0,0,0,0.88)";

    overlay.style.zIndex =
        "2147483647";

    overlay.style.display =
        "flex";

    overlay.style.alignItems =
        "center";

    overlay.style.justifyContent =
        "center";

    overlay.style.fontFamily =
        "Arial, sans-serif";


    /*
        --------------------------------------------------
        ПЕРШЕ ПОВІДОМЛЕННЯ
        --------------------------------------------------
    */

    overlay.innerHTML =

        '<div id="moqCertificateBox" ' +

        'style="' +

        'width:min(620px,90%);' +
        'background:#202020;' +
        'color:white;' +
        'padding:30px;' +
        'border-radius:10px;' +
        'box-sizing:border-box;' +
        'box-shadow:0 0 30px rgba(0,0,0,.6);' +
        'text-align:center;' +

        '">' +


        '<div style="' +
        'font-size:22px;' +
        'font-weight:bold;' +
        'margin-bottom:22px;' +
        '">' +

        'Потрібне підтвердження доступу' +

        '</div>' +


        '<div style="' +
        'font-size:16px;' +
        'line-height:1.55;' +
        'margin-bottom:18px;' +
        '">' +

        'З’єднання з сервером ' +

        '<b>' +
        escapeMoqHtml(
            mediaMtxUrl
        ) +
        '</b>' +

        ' не є довіреним для браузера, ' +
        'оскільки сертифікат HTTPS не підтверджений.' +

        '</div>' +


        '<div style="' +
        'font-size:16px;' +
        'line-height:1.55;' +
        'margin-bottom:28px;' +
        '">' +

        'Щоб отримати відео, необхідно один раз ' +
        'підтвердити у браузері доступ до цього сервера. ' +

        'Після натискання «Продовжити» буде відкрито ' +
        'окрему сторінку MediaMTX, де браузер покаже ' +
        'попередження щодо сертифіката.' +

        '</div>' +


        '<div style="' +
        'display:flex;' +
        'gap:15px;' +
        'justify-content:center;' +
        'flex-wrap:wrap;' +
        '">' +


        '<button id="moqCertificateContinue" ' +

        'style="' +
        'padding:12px 28px;' +
        'font-size:16px;' +
        'cursor:pointer;' +
        'border:0;' +
        'border-radius:5px;' +
        '">' +

        'Продовжити' +

        '</button>' +


        '<button id="moqCertificateClose" ' +

        'style="' +
        'padding:12px 28px;' +
        'font-size:16px;' +
        'cursor:pointer;' +
        'border:0;' +
        'border-radius:5px;' +
        '">' +

        'Закрити' +

        '</button>' +


        '</div>' +

        '</div>';


    document.body.appendChild(
        overlay
    );


    /*
        --------------------------------------------------
        КНОПКА "ЗАКРИТИ"
        --------------------------------------------------
    */

    const closeButton =
        document.getElementById(
            "moqCertificateClose"
        );


    if(closeButton)
    {
        closeButton.onclick =
            function()
            {
                log(
                    "MoQ Player: certificate dialog closed"
                );


                moqPlayerCertificateDialog =
                    false;


                overlay.remove();


                //stopMoqPlayer();
                fDisconnectDevice();
            };
    }


    /*
        --------------------------------------------------
        КНОПКА "ПРОДОВЖИТИ"
        --------------------------------------------------
    */

    const continueButton =
        document.getElementById(
            "moqCertificateContinue"
        );


    if(continueButton)
    {
        continueButton.onclick =
            function()
            {
                log(
                    "MoQ Player: certificate confirmation requested: " +
                    mediaMtxUrl
                );


                /*
                    Перемикаємо це ж вікно
                    на другий екран.
                */

                showMoqCertificateWaiting(
                    overlay,
                    mediaMtxUrl
                );


                /*
                    Відкриваємо стандартну сторінку
                    MediaMTX.

                    Chrome / Edge тут повинні показати
                    своє попередження сертифіката.
                */

                const newWindow =
                    window.open(
                        mediaMtxUrl,
                        "_blank"
                    );


                /*
                    Popup заблокований браузером.
                    У такому випадку наша сторінка
                    все одно залишається з кнопкою
                    перезапуску.
                */

                if(!newWindow)
                {
                    log(
                        "MoQ Player: browser blocked certificate window"
                    );
                }
            };
    }
}


/*
    --------------------------------------------------
    Друге повідомлення:
    очікування підтвердження сертифіката
    --------------------------------------------------
*/

function showMoqCertificateWaiting(
    overlay,
    mediaMtxUrl
)
{
    const box =
    document.getElementById(
    "moqCertificateBox"
    );


    if(!box)
    {
        return;
    }


    /*
        --------------------------------------------------
        Другий екран повідомлення
        --------------------------------------------------
    */

    box.innerHTML =

        '<div style="' +
        'font-size:22px;' +
        'font-weight:bold;' +
        'margin-bottom:20px;' +
        '">' +

        'Підтвердіть доступ до сервера' +

        '</div>' +


        '<div style="' +
        'font-size:16px;' +
        'line-height:1.5;' +
        'margin-bottom:15px;' +
        '">' +

        'У новій вкладці відкрито сторінку MediaMTX.' +

        '</div>' +


        '<div style="' +
        'font-size:15px;' +
        'word-break:break-all;' +
        'margin-bottom:20px;' +
        'padding:10px;' +
        'background:#111;' +
        'border-radius:5px;' +
        '">' +

        escapeMoqHtml(
            mediaMtxUrl
        ) +

        '</div>' +


        '<div style="' +
        'font-size:16px;' +
        'line-height:1.5;' +
        'margin-bottom:25px;' +
        '">' +

        'Якщо браузер покаже попередження про сертифікат, ' +
        'підтвердіть доступ до цього сервера. ' +
        'Після підтвердження поверніться до цієї сторінки ' +
        'та натисніть «ЗАПУСТИТИ ПЛЕЄР».' +

        '</div>' +


        '<div style="' +
        'display:flex;' +
        'gap:15px;' +
        'justify-content:center;' +
        'align-items:center;' +
        'flex-wrap:wrap;' +
        '">' +


        /*
            --------------------------------------------------
            Відкрити сторінку
            --------------------------------------------------
        */

        '<button id="moqCertificateOpen" ' +

        'style="' +
        'display:none;' +
        'padding:12px 25px;' +
        'font-size:16px;' +
        'cursor:pointer;' +
        'border:0;' +
        'border-radius:5px;' +
        '">' +

        'Відкрити сторінку' +

        '</button>' +


        /*
            --------------------------------------------------
            Запустити плеєр
            --------------------------------------------------
        */

        '<button id="moqCertificateReload" ' +

        'style="' +
        'padding:12px 25px;' +
        'font-size:16px;' +
        'cursor:pointer;' +
        'border:0;' +
        'border-radius:5px;' +
        '">' +

        'ЗАПУСТИТИ ПЛЕЄР' +

        '</button>' +


        /*
            --------------------------------------------------
            Закрити
            --------------------------------------------------
        */

        '<button id="moqCertificateCancel" ' +

        'style="' +
        'padding:12px 25px;' +
        'font-size:16px;' +
        'cursor:pointer;' +
        'border:0;' +
        'border-radius:5px;' +
        '">' +

        'ЗАКРИТИ' +

        '</button>' +

        '</div>';


    /*
        --------------------------------------------------
        Open certificate page
        --------------------------------------------------
    */

    const openButton =
        document.getElementById(
            "moqCertificateOpen"
        );


    if(openButton)
    {
        openButton.onclick =
            function()
            {
                log(
                    "MoQ Player: opening certificate confirmation page: " +
                    mediaMtxUrl
                );


                window.open(
                    mediaMtxUrl,
                    "_blank"
                );
            };
    }


    /*
        --------------------------------------------------
        Запустити плеєр
        --------------------------------------------------
    */

    const reloadButton =
        document.getElementById(
            "moqCertificateReload"
        );


    if(reloadButton)
    {
        reloadButton.onclick =
            function()
            {
                log(
                    "MoQ Player: retry after certificate confirmation"
                );


                /*
                    Спочатку закриваємо діалог.
                */

                if(overlay)
                {
                    overlay.remove();
                }


                moqPlayerCertificateDialog =
                    false;


                /*
                    Повторний запуск стріму.
                */

                if(moqPlayerLastUrl)
                {
                    // startMoqPlayer(
                    //     moqPlayerLastUrl
                    // );

                    fConnectDevice();
                }
                
            };
    }


    /*
        --------------------------------------------------
        ЗАКРИТИ
        --------------------------------------------------
    */

    const cancelButton =
        document.getElementById(
            "moqCertificateCancel"
        );


    if(cancelButton)
    {
        cancelButton.onclick =
            function()
            {
                log(
                    "MoQ Player: certificate dialog closed"
                );


                /*
                    Скидаємо стан діалогу.
                */

                moqPlayerCertificateDialog =
                    false;


                /*
                    Видаляємо наше повідомлення.
                */

                if(overlay)
                {
                    overlay.remove();
                }


                /*
                    Повністю зупиняємо MoQ Player.
                */

                //stopMoqPlayer();

                fDisconnectDevice();
            };
    }


}


/*
    --------------------------------------------------
    HTML escape
    --------------------------------------------------
*/

function escapeMoqHtml(value)
{
    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


/*
    --------------------------------------------------
    Player status
    --------------------------------------------------
*/

function setMoqPlayerStatus(status)
{
    const indicator =
        document.getElementById(
            "connectionStatusDevice"
        );


    if(!indicator)
        return;


    switch(status)
    {
        case "connecting":

            AppState.bRunStream =
                false;


            indicator.style.backgroundColor =
                "#ffff00";

            break;


        case "connected":

            AppState.bRunStream =
                true;


            indicator.style.backgroundColor =
                "#ff0000";


            moqPlayerError =
                0;

            break;


        case "error":

            AppState.bRunStream =
                false;


            indicator.style.backgroundColor =
                "#00000080";


            moqPlayerError++;

            break;


        default:

            AppState.bRunStream =
                false;


            indicator.style.backgroundColor =
                "#00000080";

            break;
    }
}