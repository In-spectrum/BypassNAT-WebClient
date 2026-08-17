// player.js


let playerReader = null;
let playerStreamUrl = null;
let playerError = 0;


/*
    Watchdog відеопотоку.

    Якщо нових відеокадрів немає
    протягом PLAYER_FRAME_TIMEOUT,
    вважаємо, що стрім завис.
*/

let playerWatchdogTimer = null;
let playerLastFrameTime = 0;
let playerFrameCallbackId = null;

const PLAYER_FRAME_TIMEOUT = 2000;


// Запуск MediaMTX WebRTC player
function startPlayer(url)
{
    AppState.bRunStream = false;


    const video =
        document.getElementById("video");


    if(!video)
    {
        log(
            "Player ERROR: video element not found"
        );

        return;
    }


    log(
        "Player: start"
    );

    log(
        "Player URL: " +
        url
    );


    // Зупиняємо попередній reader
    stopPlayer();


    playerStreamUrl =
        url;


    // MediaMTX WebRTC Reader
    playerReader =
        new MediaMTXWebRTCReader({

            url: url,

            user: "",
            pass: "",
            token: "",


            onError: function(error)
            {
                log(
                    "Player ERROR: " +
                    error
                );


                setPlayerStatus(
                    "error"
                );
            },


            onTrack: function(event)
            {
                log(
                    "Player: received " +
                    event.track.kind +
                    " track"
                );


                if(
                    event.streams &&
                    event.streams.length > 0
                )
                {

                    log("Player: event.streams = " + event.streams);
                    log("Player: event.streams.length = " + event.streams.length);
                    log("Player: event.streams[0] = " + event.streams[0]);

                    video.srcObject =
                        event.streams[0];


                    video.play()
                        .then(function()
                        {
                            log(
                                "Player: playback started"
                            );


                            setPlayerStatus(
                                "connected"
                            );


                            /*
                                Запускаємо контроль
                                фактичного надходження
                                відеокадрів.
                            */

                            startPlayerWatchdog();

                        })
                        .catch(function(error)
                        {
                            log(
                                "Player play ERROR: " +
                                error.message
                            );


                            setPlayerStatus(
                                "error"
                            );
                        });
                }
            },


            onDataChannel: function(event)
            {
                log(
                    "Player: data channel opened"
                );


                event.channel.binaryType =
                    "arraybuffer";


                event.channel.onmessage =
                    function(messageEvent)
                    {
                        log(
                            "Player data channel message"
                        );
                    };
            }
        });


    setPlayerStatus(
        "connecting"
    );
}


// --------------------------------------------------
// Watchdog відеопотоку
// --------------------------------------------------

function startPlayerWatchdog()
{
    stopPlayerWatchdog();


    const video =
        document.getElementById("video");


    if(!video)
        return;


    /*
        Запам'ятовуємо момент,
        коли почався контроль.
    */

    playerLastFrameTime =
        performance.now();


    /*
        requestVideoFrameCallback()
        викликається браузером при
        фактичному отриманні нового
        відеокадру.

        Це краще, ніж перевіряти
        readyState, оскільки readyState
        може залишатися нормальним навіть
        після зупинки потоку.
    */

    if(
        "requestVideoFrameCallback" in video
    )
    {
        function frameCallback()
        {
            playerLastFrameTime =
                performance.now();


            playerFrameCallbackId =
                video.requestVideoFrameCallback(
                    frameCallback
                );
        }


        playerFrameCallbackId =
            video.requestVideoFrameCallback(
                frameCallback
            );
    }
    else
    {
        /*
            Старі браузери.

            Якщо requestVideoFrameCallback
            відсутній, watchdog не зможе
            контролювати фактичні кадри.
        */

        log(
            "Player WARNING: " +
            "requestVideoFrameCallback " +
            "is not supported"
        );
    }


    /*
        Періодична перевірка.
    */

    playerWatchdogTimer =
        setInterval(
            function()
            {
                /*
                    Плеєр уже не запущений.
                */

                // if(
                //     !AppState.bRunStream
                // )
                // {
                //     return;
                // }


                /*
                    Якщо браузер не підтримує
                    requestVideoFrameCallback,
                    перевіряти фактичні кадри
                    неможливо.
                */

                if(
                    !(
                        "requestVideoFrameCallback"
                        in video
                    )
                )
                {
                    return;
                }


                const now =
                    performance.now();


                const elapsed =
                    now -
                    playerLastFrameTime;


                /*
                    Нових кадрів немає
                    довше заданого часу.
                */

                if(
                    elapsed >
                    PLAYER_FRAME_TIMEOUT
                )
                {
                    // log(
                    //     "Player ERROR: " +
                    //     "video stream stopped, " +
                    //     "no frames for " +
                    //     Math.round(elapsed) +
                    //     " ms"
                    // );


                    AppState.bRunStream = false;
                }
                else{
                    AppState.bRunStream = true;                    
                }
            },
            500
        );
}


function stopPlayerWatchdog()
{
    /*
        Зупиняємо таймер.
    */

    if(playerWatchdogTimer)
    {
        clearInterval(
            playerWatchdogTimer
        );


        playerWatchdogTimer =
            null;
    }


    /*
        Скасовуємо requestVideoFrameCallback.
    */

    const video =
        document.getElementById("video");


    if(
        video &&
        playerFrameCallbackId !== null &&
        video.cancelVideoFrameCallback
    )
    {
        try
        {
            video.cancelVideoFrameCallback(
                playerFrameCallbackId
            );
        }
        catch(error)
        {
        }
    }


    playerFrameCallbackId =
        null;


    playerLastFrameTime =
        0;
}


// --------------------------------------------------
// Зупинка MediaMTX player
// --------------------------------------------------

function stopPlayer()
{
    AppState.bRunStream = false;


    /*
        Обов'язково зупиняємо watchdog.
    */

    stopPlayerWatchdog();


    playerError = 0;


    const video =
        document.getElementById("video");


    if(playerReader)
    {
        try
        {
            playerReader.close();
        }
        catch(error)
        {
            log(
                "Player close ERROR: " +
                error.message
            );
        }


        playerReader = null;
    }


    if(video)
    {
        video.pause();

        video.srcObject = null;
    }


    playerStreamUrl =
        null;


    setPlayerStatus(
        "disconnected"
    );
}


// --------------------------------------------------
// Індикатор стану
// --------------------------------------------------

function setPlayerStatus(status)
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
                // "#00ff00";
                "#ff0000";


            playerError =
                0;


            break;


        case "error":

            AppState.bRunStream =
                false;


            indicator.style.backgroundColor =
                //"#ff0000";
                "#00000080";


            playerError++;


            break;


        default:

            AppState.bRunStream =
                false;


            indicator.style.backgroundColor =
                "#00000080";


            break;
    }


    /*
        Якщо помилок стало занадто багато,
        повністю перезапускаємо player.
    */

    if(playerError > 10)
    {
        playerError = 0;

        stopPlayer();
    }
}