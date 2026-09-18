// moq-player.js


let moqPlayerReader = null;
let moqPlayerError = 0;


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


    stopMoqPlayer();


    const fingerprintUrl =
        new URL(
            "fingerprint",
            url.endsWith("/")
                ? url
                : url + "/"
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
    Player status
    --------------------------------------------------
*/

function setMoqPlayerStatus(status)
{

    //log("setMoqPlayerStatus 0: ", status);

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