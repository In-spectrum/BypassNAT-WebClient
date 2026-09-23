// hls-player.js


let hlsPlayer = null;
let hlsPlayerStreamUrl = null;
let hlsPlayerError = 0;


/*
    --------------------------------------------------
    Watchdog відеопотоку
    --------------------------------------------------

    Якщо нових відеокадрів немає
    протягом HLS_PLAYER_FRAME_TIMEOUT,
    вважаємо, що HLS-потік завис.
*/

let hlsPlayerWatchdogTimer = null;
let hlsPlayerLastFrameTime = 0;
let hlsPlayerFrameCallbackId = null;

const HLS_PLAYER_FRAME_TIMEOUT = 3000;


/*
    --------------------------------------------------
    Запуск HLS player
    --------------------------------------------------
*/

function startHlsPlayer(url)
{
    AppState.bRunStream = false;


    const video =
        document.getElementById("video");


    if(!video)
    {
        log(
            "HLS Player ERROR: video element not found"
        );

        return;
    }


    log(
        "startHlsPlayer: URL: " +
        url
    );


    /*
        Зупиняємо попередній HLS player.
    */

    stopHlsPlayer();


    hlsPlayerStreamUrl =
        url;


    /*
        --------------------------------------------------
        Перевіряємо підтримку HLS.js
        --------------------------------------------------
    */

    if(typeof Hls === "undefined")
    {
        log(
            "HLS Player ERROR: Hls.js is not loaded"
        );

        AppState.bStreamError =
            true;

        setPlayerStatus(
            "error"
        );

        return;
    }


    /*
        --------------------------------------------------
        Нативний HLS
        --------------------------------------------------

        Деякі браузери, наприклад Safari,
        можуть відтворювати HLS без Hls.js.
    */

    if(
        !Hls.isSupported() &&
        video.canPlayType(
            "application/vnd.apple.mpegurl"
        )
    )
    {
        log(
            "HLS Player: using native HLS"
        );


        video.src =
            url;


        video.load();


        const playPromise =
            video.play();


        if(playPromise !== undefined)
        {
            playPromise
                .then(function()
                {
                    setPlayerStatus(
                        "connected"
                    );

                    startHlsPlayerWatchdog();
                })
                .catch(function(error)
                {
                    log(
                        "HLS Player play ERROR: " +
                        error.message
                    );

                    AppState.bStreamError =
                        true;

                    setPlayerStatus(
                        "error"
                    );
                });
        }
        else
        {
            setPlayerStatus(
                "connected"
            );

            startHlsPlayerWatchdog();
        }


        return;
    }


    /*
        --------------------------------------------------
        Hls.js
        --------------------------------------------------
    */

    if(!Hls.isSupported())
    {
        log(
            "HLS Player ERROR: HLS is not supported"
        );

        AppState.bStreamError =
            true;

        setPlayerStatus(
            "error"
        );

        return;
    }


    /*
        --------------------------------------------------
        Створюємо Hls instance
        --------------------------------------------------
    */

    hlsPlayer =
      new Hls(
          {
              lowLatencyMode: true,

              liveSyncDurationCount: 2,

              liveMaxLatencyDurationCount: 4,

              maxLiveSyncPlaybackRate: 1.5,

              backBufferLength: 2,

              enableWorker: true,

              autoStartLoad: true
          }
      );


    /*
        --------------------------------------------------
        MANIFEST_PARSED
        --------------------------------------------------
    */

    hlsPlayer.on(
        Hls.Events.MANIFEST_PARSED,
        function()
        {
            log(
                "HLS Player: manifest parsed"
            );


            /*
                Запускаємо HTML5 video.
            */

            const playPromise =
                video.play();


            if(playPromise !== undefined)
            {
                playPromise
                    .then(function()
                    {
                        /*
                            play() успішний.
                        */

                        setPlayerStatus(
                            "connected"
                        );


                        /*
                            Запускаємо watchdog.
                        */

                        startHlsPlayerWatchdog();
                    })
                    .catch(function(error)
                    {
                        log(
                            "HLS Player play ERROR: " +
                            error.message
                        );


                        AppState.bStreamError =
                            true;


                        setPlayerStatus(
                            "error"
                        );
                    });
            }
            else
            {
                setPlayerStatus(
                    "connected"
                );

                startHlsPlayerWatchdog();
            }
        }
    );


    /*
        --------------------------------------------------
        MEDIA_ATTACHED
        --------------------------------------------------
    */

    hlsPlayer.on(
        Hls.Events.MEDIA_ATTACHED,
        function()
        {
            log(
                "HLS Player: media attached"
            );
        }
    );


    /*
        --------------------------------------------------
        FRAG_LOADED
        --------------------------------------------------

        Фрагмент HLS успішно завантажений.
        Це корисно для діагностики.
        --------------------------------------------------
    */

    hlsPlayer.on(
        Hls.Events.FRAG_LOADED,
        function()
        {
            /*
                Тут навмисно нічого не робимо.

                Сам факт FRAG_LOADED означає,
                що HLS media data приходить.
            */
        }
    );


    /*
        --------------------------------------------------
        ERROR
        --------------------------------------------------
    */

    hlsPlayer.on(
        Hls.Events.ERROR,
        function(
            event,
            data
        )
        {
            log(
                "HLS Player ERROR: " +
                data.type +
                " / " +
                data.details +
                " / fatal=" +
                data.fatal
            );


            /*
                --------------------------------------------------
                Non-fatal error
                --------------------------------------------------

                Hls.js сам намагається
                відновити playback.
                --------------------------------------------------
            */

            if(!data.fatal)
            {
                return;
            }


            /*
                Fatal error.
            */

            AppState.bStreamError =
                true;


            hlsPlayerError++;


            /*
                --------------------------------------------------
                NETWORK_ERROR
                --------------------------------------------------
            */

            if(
                data.type ===
                Hls.ErrorTypes.NETWORK_ERROR
            )
            {
                log(
                    "HLS Player: trying to recover network error"
                );


                if(hlsPlayer)
                {
                    hlsPlayer.startLoad();
                }


                return;
            }


            /*
                --------------------------------------------------
                MEDIA_ERROR
                --------------------------------------------------
            */

            if(
                data.type ===
                Hls.ErrorTypes.MEDIA_ERROR
            )
            {
                log(
                    "HLS Player: trying to recover media error"
                );


                if(hlsPlayer)
                {
                    hlsPlayer.recoverMediaError();
                }


                return;
            }


            /*
                --------------------------------------------------
                Невідновлювана помилка.
                --------------------------------------------------
            */

            log(
                "HLS Player: fatal error, restarting"
            );


            if(
                hlsPlayerError >
                10
            )
            {
                hlsPlayerError =
                    0;


                stopHlsPlayer();
            }
        }
    );


    /*
        --------------------------------------------------
        Підключаємо HLS source
        --------------------------------------------------
    */

    hlsPlayer.loadSource(
        url
    );


    /*
        Підключаємо HLS до існуючого
        <video id="video">
    */

    hlsPlayer.attachMedia(
        video
    );


    /*
        Player створений,
        очікуємо manifest / playback.
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

function startHlsPlayerWatchdog()
{
    /*
        Якщо watchdog уже працює —
        спочатку його зупиняємо.
    */

    stopHlsPlayerWatchdog();


    const video =
        document.getElementById("video");


    if(!video)
        return;


    /*
        Запам'ятовуємо момент,
        коли почався контроль.
    */

    hlsPlayerLastFrameTime =
        performance.now();


    /*
        --------------------------------------------------
        requestVideoFrameCallback
        --------------------------------------------------

        Callback викликається браузером,
        коли реально відображається
        новий відеокадр.
    */

    if(
        "requestVideoFrameCallback" in video
    )
    {
        function frameCallback()
        {
            hlsPlayerLastFrameTime =
                performance.now();


            hlsPlayerFrameCallbackId =
                video.requestVideoFrameCallback(
                    frameCallback
                );
        }


        hlsPlayerFrameCallbackId =
            video.requestVideoFrameCallback(
                frameCallback
            );
    }
    else
    {
        log(
            "HLS Player WARNING: " +
            "requestVideoFrameCallback " +
            "is not supported"
        );
    }


    /*
        --------------------------------------------------
        Періодична перевірка
        --------------------------------------------------
    */

    hlsPlayerWatchdogTimer =
        setInterval(
            function()
            {
                /*
                    Якщо browser не підтримує
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

                if(!hlsPlayer)
                {
                    AppState.bRunStream =
                        false;

                    return;
                }


                const now =
                    performance.now();


                const elapsed =
                    now -
                    hlsPlayerLastFrameTime;


                /*
                    --------------------------------------------------
                    Нових кадрів немає.
                    --------------------------------------------------
                */

                if(
                    elapsed >
                    HLS_PLAYER_FRAME_TIMEOUT
                )
                {
                    AppState.bRunStream =
                        false;

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

function stopHlsPlayerWatchdog()
{
    /*
        Зупиняємо interval.
    */

    if(hlsPlayerWatchdogTimer)
    {
        clearInterval(
            hlsPlayerWatchdogTimer
        );


        hlsPlayerWatchdogTimer =
            null;
    }


    /*
        Скасовуємо requestVideoFrameCallback.
    */

    const video =
        document.getElementById("video");


    if(
        video &&
        hlsPlayerFrameCallbackId !== null &&
        video.cancelVideoFrameCallback
    )
    {
        try
        {
            video.cancelVideoFrameCallback(
                hlsPlayerFrameCallbackId
            );
        }
        catch(error)
        {
            /*
                Callback уже міг бути
                виконаний браузером.
            */
        }
    }


    hlsPlayerFrameCallbackId =
        null;


    hlsPlayerLastFrameTime =
        0;
}


/*
    --------------------------------------------------
    Зупинка HLS player
    --------------------------------------------------
*/

function stopHlsPlayer()
{
    /*
        Потік більше не вважається запущеним.
    */

    AppState.bRunStream =
        false;


    /*
        Зупиняємо watchdog.
    */

    stopHlsPlayerWatchdog();


    /*
        Скидаємо лічильник помилок.
    */

    hlsPlayerError =
        0;


    const video =
        document.getElementById("video");


    /*
        --------------------------------------------------
        Зупиняємо Hls.js
        --------------------------------------------------
    */

    if(hlsPlayer)
    {
        try
        {
            hlsPlayer.stopLoad();
        }
        catch(error)
        {
        }


        try
        {
            hlsPlayer.detachMedia();
        }
        catch(error)
        {
        }


        try
        {
            hlsPlayer.destroy();
        }
        catch(error)
        {
            log(
                "HLS Player close ERROR: " +
                error.message
            );
        }


        hlsPlayer =
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
            HLS.js використовує video.src,
            тому очищаємо саме src.
        */

        try
        {
            video.removeAttribute(
                "src"
            );

            video.load();
        }
        catch(error)
        {
        }


        /*
            Якщо попередній player залишив
            MediaStream — очищаємо його теж.

            Це дозволяє безпечно переключатися
            між WebRTC та HLS.
        */

        try
        {
            video.srcObject =
                null;
        }
        catch(error)
        {
        }
    }


    /*
        URL поточного stream більше
        не активний.
    */

    hlsPlayerStreamUrl =
        null;


    /*
        Стан player = disconnected.
    */

    setPlayerStatus(
        "disconnected"
    );
}