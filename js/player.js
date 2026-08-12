// player.js

let playerReader = null;
let playerStreamUrl = null;


// Запуск MediaMTX WebRTC player
function startPlayer(url) {

    const video = document.getElementById("video");

    if (!video) {
        log("Player ERROR: video element not found");
        return;
    }

    log("Player: start");
    log("Player URL: " + url);

    // Зупиняємо попередній reader
    stopPlayer();

    playerStreamUrl = url;

    // MediaMTX WebRTC Reader
    playerReader = new MediaMTXWebRTCReader({
        url: url,

        user: "",
        pass: "",
        token: "",

        onError: function(error) {

            log(
                "Player ERROR: " +
                error
            );

            setPlayerStatus("error");
        },

        onTrack: function(event) {

            log(
                "Player: received " +
                event.track.kind +
                " track"
            );

            if (
                event.streams &&
                event.streams.length > 0
            ) {

                video.srcObject =
                    event.streams[0];

                video.play()
                    .then(function() {

                        log(
                            "Player: playback started"
                        );

                        setPlayerStatus("connected");

                    })
                    .catch(function(error) {

                        log(
                            "Player play ERROR: " +
                            error.message
                        );

                        setPlayerStatus("error");
                    });
            }
        },

        onDataChannel: function(event) {

            log(
                "Player: data channel opened"
            );

            event.channel.binaryType =
                "arraybuffer";

            event.channel.onmessage =
                function(messageEvent) {

                    log(
                        "Player data channel message"
                    );
                };
        }
    });

    setPlayerStatus("connecting");
}


// Зупинка MediaMTX player
function stopPlayer() {

    const video =
        document.getElementById("video");

    if (playerReader) {

        try {
            playerReader.close();
        }
        catch (error) {
            log(
                "Player close ERROR: " +
                error.message
            );
        }

        playerReader = null;
    }

    if (video) {

        video.pause();

        video.srcObject = null;
    }

    playerStreamUrl = null;

    setPlayerStatus("disconnected");
}


// Індикатор стану
function setPlayerStatus(status) {

    const indicator =
        document.getElementById(
            "connectionStatusIndicator"
        );

    if (!indicator)
        return;

    switch (status) {

        case "connecting":
            indicator.style.backgroundColor =
                "#ffff00";
            break;

        case "connected":
            indicator.style.backgroundColor =
                "#00ff00";
            break;

        case "error":
            indicator.style.backgroundColor =
                "#ff0000";
            break;

        default:
            indicator.style.backgroundColor =
                "#808080";
            break;
    }
}