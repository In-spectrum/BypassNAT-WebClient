// player.js


let playerReader = null;
let playerStreamUrl = null;
let playerError = 0;


/*
    --------------------------------------------------
    Watchdog відеопотоку
    --------------------------------------------------

    Якщо нових відеокадрів немає
    протягом PLAYER_FRAME_TIMEOUT,
    вважаємо, що стрім завис.
*/

let playerWatchdogTimer = null;
let playerLastFrameTime = 0;
let playerFrameCallbackId = null;

const PLAYER_FRAME_TIMEOUT = 2000;


/*
    --------------------------------------------------
    Запуск MediaMTX WebRTC player
    --------------------------------------------------
*/

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
        "startPlayer 2: URL: " +
        url
    );


    /*
        Зупиняємо попередній player.
    */

    stopPlayer();


    playerStreamUrl =
        url;


    /*
        --------------------------------------------------
        MediaMTX WebRTC Reader
        --------------------------------------------------
    */

    playerReader =
        new MediaMTXWebRTCReader({

            url: url,

            user: "",
            pass: "",
            token: "",


            /*
                --------------------------------------------------
                Помилка WebRTC / WHEP
                --------------------------------------------------
            */

            onError: function(error)
            {
                log(
                    "Player ERROR: " +
                    error
                );

                AppState.bStreamError = true;

                setPlayerStatus(
                    "error"
                );
            },


            /*
                --------------------------------------------------
                Отримання WebRTC track
                --------------------------------------------------

                MediaMTX зазвичай викликає onTrack
                окремо для:

                    video
                    audio

                Але обидва track можуть належати
                одному й тому самому MediaStream.

                Тому srcObject та play()
                встановлюємо тільки один раз.
                --------------------------------------------------
            */

            onTrack: function(event)
            {
                // log(
                //     "Player: received " +
                //     event.track.kind +
                //     " track"
                // );


                /*
                    Діагностика.
                */

                // if(event.streams)
                // {
                //     log(
                //         "Player: event.streams.length = " +
                //         event.streams.length
                //     );
                // }


                /*
                    Якщо stream відсутній —
                    нічого не робимо.
                */

                if(
                    !event.streams ||
                    event.streams.length === 0
                )
                {
                    log(
                        "Player WARNING: track has no MediaStream"
                    );

                    return;
                }


                const stream =
                    event.streams[0];


                /*
                    --------------------------------------------------
                    ВАЖЛИВО
                    --------------------------------------------------

                    onTrack викликається двічі:

                        video
                        audio

                    Але це може бути один і той самий stream.

                    Не можна кожного разу робити:

                        video.srcObject = stream;
                        video.play();

                    інакше другий track може перервати
                    перший play().
                    --------------------------------------------------
                */

                if(video.srcObject === stream)
                {
                    // log(
                    //     "Player: MediaStream already assigned"
                    // );

                    return;
                }


                /*
                    Встановлюємо stream тільки один раз.
                */

                video.srcObject =
                    stream;


                // log(
                //     "Player: MediaStream assigned"
                // );


                /*
                    --------------------------------------------------
                    Запускаємо відтворення
                    --------------------------------------------------
                */

                const playPromise =
                    video.play();


                /*
                    play() повертає Promise.
                */

                if(playPromise !== undefined)
                {
                    playPromise
                        .then(function()
                        {
                            // log(
                            //     "Player: playback started 1"
                            // );


                            /*
                                Статус connected ставимо
                                тільки після успішного play().
                            */

                            setPlayerStatus(
                                "connected"
                            );


                            /*
                                Запускаємо watchdog.
                            */

                            startPlayerWatchdog();
                        })
                        .catch(function(error)
                        {
                            /*
                                AbortError може виникнути,
                                якщо браузер у цей момент
                                почав новий load request.

                                Після виправлення подвійного
                                srcObject це не повинно
                                відбуватися при нормальному
                                запуску.
                            */

                            log(
                                "Player play ERROR: " +
                                error.message
                            );


                            setPlayerStatus(
                                "error"
                            );
                        });
                }
                else
                {
                    /*
                        Старий браузер,
                        який не повертає Promise.
                    */

                    // log(
                    //     "Player: playback started 2"
                    // );


                    setPlayerStatus(
                        "connected"
                    );


                    startPlayerWatchdog();
                }
            },


            /*
                --------------------------------------------------
                Data Channel
                --------------------------------------------------
            */

            onDataChannel: function(event)
            {
                log(
                    "Player: data channel opened"
                );


                if(!event.channel)
                    return;


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


    /*
        Player створений,
        очікуємо WebRTC connection.
    */

    setPlayerStatus(
        "connecting"
    );
}


/*
    --------------------------------------------------
    Watchdog відеопотоку
    --------------------------------------------------
*/

function startPlayerWatchdog()
{
    /*
        Якщо watchdog уже працює —
        спочатку його зупиняємо.
    */

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
        --------------------------------------------------
        requestVideoFrameCallback
        --------------------------------------------------

        Цей callback викликається браузером,
        коли реально відображається новий
        відеокадр.

        Це значно краще для watchdog,
        ніж перевіряти readyState.
    */

    if(
        "requestVideoFrameCallback" in video
    )
    {
        function frameCallback()
        {
            /*
                Отримано новий відеокадр.
            */

            playerLastFrameTime =
                performance.now();


            /*
                Продовжуємо стежити
                за наступним кадром.
            */

            playerFrameCallbackId =
                video.requestVideoFrameCallback(
                    frameCallback
                );
        }


        /*
            Реєструємо перший callback.
        */

        playerFrameCallbackId =
            video.requestVideoFrameCallback(
                frameCallback
            );
    }
    else
    {
        /*
            Старі браузери.

            Фактичний контроль кадрів
            неможливий.
        */

        log(
            "Player WARNING: " +
            "requestVideoFrameCallback " +
            "is not supported"
        );
    }


    /*
        --------------------------------------------------
        Періодична перевірка
        --------------------------------------------------
    */

    playerWatchdogTimer =
        setInterval(
            function()
            {
                /*
                    Якщо браузер не підтримує
                    requestVideoFrameCallback,
                    перевіряти кадри неможливо.
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


                /*
                    Player уже зупинений.
                */

                if(
                    !playerReader
                )
                {
                    AppState.bRunStream =
                        false;

                    return;
                }


                const now =
                    performance.now();


                const elapsed =
                    now -
                    playerLastFrameTime;


                /*
                    --------------------------------------------------
                    Нових кадрів немає.
                    --------------------------------------------------
                */

                if(
                    elapsed >
                    PLAYER_FRAME_TIMEOUT
                )
                {
                    AppState.bRunStream =
                        false;


                    /*
                        Не викликаємо тут stopPlayer().

                        MediaMTXWebRTCReader сам контролює
                        стан WebRTC connection та виконує
                        retry при помилці.
                    */

                    return;
                }


                /*
                    Кадри надходять нормально.
                */

                AppState.bRunStream =
                    true;
            },
            500
        );
}


/*
    --------------------------------------------------
    Зупинка Watchdog
    --------------------------------------------------
*/

function stopPlayerWatchdog()
{
    /*
        Зупиняємо interval.
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
            /*
                Нічого не робимо.

                Callback уже міг бути виконаний
                або скасований браузером.
            */
        }
    }


    playerFrameCallbackId =
        null;


    playerLastFrameTime =
        0;
}


/*
    --------------------------------------------------
    Зупинка MediaMTX player
    --------------------------------------------------
*/

function stopPlayer()
{
    /*
        Потік більше не вважається запущеним.
    */

    AppState.bRunStream =
        false;


    /*
        Зупиняємо watchdog.
    */

    stopPlayerWatchdog();


    /*
        Скидаємо лічильник помилок.
    */

    playerError =
        0;


    const video =
        document.getElementById("video");


    /*
        --------------------------------------------------
        Закриваємо MediaMTX WebRTC Reader
        --------------------------------------------------
    */

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


        playerReader =
            null;
    }


    /*
        --------------------------------------------------
        Зупиняємо HTML5 video
        --------------------------------------------------
    */

    if(video)
    {
        try
        {
            video.pause();
        }
        catch(error)
        {
        }


        /*
            Видаляємо WebRTC MediaStream.
        */

        video.srcObject =
            null;
    }


    /*
        URL поточного stream більше не активний.
    */

    playerStreamUrl =
        null;


    /*
        Стан player = disconnected.
    */

    setPlayerStatus(
        "disconnected"
    );
}


/*
    --------------------------------------------------
    Індикатор стану Player
    --------------------------------------------------
*/

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
        /*
            --------------------------------------------------
            Connecting
            --------------------------------------------------
        */

        case "connecting":

            AppState.bRunStream =
                false;


            indicator.style.backgroundColor =
                "#ffff00";


            break;


        /*
            --------------------------------------------------
            Connected
            --------------------------------------------------
        */

        case "connected":

            /*
                Важливо:

                тут play() уже успішно завершився.
            */

            AppState.bRunStream =
                true;


            indicator.style.backgroundColor =
                "#ff0000";


            playerError =
                0;


            break;


        /*
            --------------------------------------------------
            Error
            --------------------------------------------------
        */

        case "error":

            AppState.bRunStream =
                false;


            indicator.style.backgroundColor =
                "#00000080";


            playerError++;


            break;


        /*
            --------------------------------------------------
            Disconnected
            --------------------------------------------------
        */

        default:

            AppState.bRunStream =
                false;


            indicator.style.backgroundColor =
                "#00000080";


            break;
    }


    /*
        --------------------------------------------------
        Захист від великої кількості помилок
        --------------------------------------------------

        MediaMTXWebRTCReader має власний retry,
        але якщо помилки накопичуються,
        повністю перезапускаємо player.
    */

    if(playerError > 10)
    {
        log(
            "Player: too many errors, restarting"
        );


        playerError =
            0;


        stopPlayer();
    }
}