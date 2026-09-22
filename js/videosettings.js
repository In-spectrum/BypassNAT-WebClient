// =====================================================
// VIDEO SETTINGS
// =====================================================

let videoSettingsLoaded = false;

let videoSettingsSizeF = 1;
let videoSettingsFPS = 25;
let videoSettingsEncoderV = 0;
let videoSettingsEncSpeed = 0;
let videoSettingsBitrate = 25;
let videoSettingsLatencyZ = 1;
let videoSettingsRTSP = true;
let videoSettingsSound = 0;


// -----------------------------------------------------
// Завантаження Video settings
// -----------------------------------------------------

function loadVideoSettings()
{
    if(videoSettingsLoaded)
    {
        showVideoSettings();
        return;
    }


    fetch("videosettings.html")
        .then(response =>
        {
            if(!response.ok)
            {
                throw new Error(
                    "Cannot load videosettings.html: " +
                    response.status
                );
            }

            return response.text();
        })
        .then(html =>
        {
            document.body.insertAdjacentHTML(
                "beforeend",
                html
            );


            const btnCancel =
                document.getElementById(
                    "btnVideoSettingsCancel"
                );

            if(btnCancel)
            {
                btnCancel.addEventListener(
                    "click",
                    hideVideoSettings
                );
            }


            const fps =
                document.getElementById(
                    "videoSettingsFps"
                );

            const fpsValue =
                document.getElementById(
                    "videoSettingsFpsValue"
                );

            if(fps && fpsValue)
            {
                fps.addEventListener(
                    "input",
                    () =>
                    {
                        fpsValue.textContent =
                            fps.value;
                    }
                );
            }


            const bitrate =
                document.getElementById(
                    "videoSettingsBitrate"
                );

            const bitrateValue =
                document.getElementById(
                    "videoSettingsBitrateValue"
                );

            if(bitrate && bitrateValue)
            {
                bitrate.addEventListener(
                    "input",
                    () =>
                    {
                        bitrateValue.textContent =
                            bitrate.value +
                            " Mbit.";
                    }
                );
            }


            const btnApply =
                document.getElementById(
                    "btnVideoSettingsApply"
                );

            if(btnApply)
            {
                btnApply.addEventListener(
                    "click",
                    videoSettingsApply
                );
            }


            const btnDefaults =
                document.getElementById(
                    "btnVideoSettingsDefaults"
                );

            if(btnDefaults)
            {
                btnDefaults.addEventListener(
                    "click",
                    videoSettingsDefaults
                );
            }


            // -----------------------------------------------------
            // Encoder
            // -----------------------------------------------------

            const encoderRadios =
                document.querySelectorAll(
                    'input[name="videoEncoder"]'
                );


            encoderRadios.forEach(
                radio =>
                {
                    radio.addEventListener(
                        "change",
                        updateEncodingSpeedVisibility
                    );
                }
            );


            updateEncodingSpeedVisibility();


            videoSettingsLoaded = true;

            showVideoSettings();
        })
        .catch(error =>
        {
            console.error(
                "Video settings load error:",
                error
            );
        });
}


// -----------------------------------------------------
// Encoder
// -----------------------------------------------------

function updateEncodingSpeedVisibility()
{
    const gpu =
        document.querySelector(
            'input[name="videoEncoder"][value="gpu"]'
        );

    const encodingSpeedGroup =
        document.querySelector(
            ".videoSpeedGrid"
        )?.closest(
            ".videoSettingsGroup"
        );

    if(!encodingSpeedGroup || !gpu)
        return;

    encodingSpeedGroup.style.display =
        gpu.checked ? "none" : "";
}


// -----------------------------------------------------
// Показати
// -----------------------------------------------------

function showVideoSettings()
{
    const overlay =
        document.getElementById(
            "videoSettingsOverlay"
        );

    if(!overlay)
        return;


    // При відкритті переносимо значення
    // з серверних змінних у контроли.
    applyVideoSettingsToControls();


    overlay.style.display = "flex";
}


// -----------------------------------------------------
// Сховати
// -----------------------------------------------------

function hideVideoSettings()
{
    const overlay =
        document.getElementById(
            "videoSettingsOverlay"
        );

    if(!overlay)
        return;

    overlay.style.display = "none";
}


// -----------------------------------------------------
// Значення змінних -> контроли
// -----------------------------------------------------

function applyVideoSettingsToControls()
{
    const original =
        document.querySelector(
            'input[name="videoFrameSize"][value="original"]'
        );

    const fullhd =
        document.querySelector(
            'input[name="videoFrameSize"][value="fullhd"]'
        );

    const hd =
        document.querySelector(
            'input[name="videoFrameSize"][value="hd"]'
        );


    if(original)
        original.checked =
            videoSettingsSizeF === 0;

    if(fullhd)
        fullhd.checked =
            videoSettingsSizeF === 1;

    if(hd)
        hd.checked =
            videoSettingsSizeF === 2;


    const fps =
        document.getElementById(
            "videoSettingsFps"
        );

    const fpsValue =
        document.getElementById(
            "videoSettingsFpsValue"
        );

    if(fps)
        fps.value =
            videoSettingsFPS;

    if(fpsValue)
        fpsValue.textContent =
            videoSettingsFPS;


    const cpu =
        document.querySelector(
            'input[name="videoEncoder"][value="cpu"]'
        );

    const gpu =
        document.querySelector(
            'input[name="videoEncoder"][value="gpu"]'
        );


    if(cpu)
        cpu.checked =
            videoSettingsEncoderV === 0;

    if(gpu)
        gpu.checked =
            videoSettingsEncoderV === 1;


    const ultrafast =
        document.querySelector(
            'input[name="videoSpeed"][value="ultrafast"]'
        );

    const veryfast =
        document.querySelector(
            'input[name="videoSpeed"][value="veryfast"]'
        );

    const medium =
        document.querySelector(
            'input[name="videoSpeed"][value="medium"]'
        );

    const slower =
        document.querySelector(
            'input[name="videoSpeed"][value="slower"]'
        );


    if(ultrafast)
        ultrafast.checked =
            videoSettingsEncSpeed === 0;

    if(veryfast)
        veryfast.checked =
            videoSettingsEncSpeed === 1;

    if(medium)
        medium.checked =
            videoSettingsEncSpeed === 2;

    if(slower)
        slower.checked =
            videoSettingsEncSpeed === 3;


    const bitrate =
        document.getElementById(
            "videoSettingsBitrate"
        );

    const bitrateValue =
        document.getElementById(
            "videoSettingsBitrateValue"
        );


    if(bitrate)
        bitrate.value =
            videoSettingsBitrate / 10;

    if(bitrateValue)
        bitrateValue.textContent =
            (videoSettingsBitrate / 10) +
            " Mbit.";


    const zeroLatency =
        document.getElementById(
            "videoSettingsZeroLatency"
        );


    if(zeroLatency)
        zeroLatency.checked =
            videoSettingsLatencyZ === 1;


    const rtsp =
        document.querySelector(
            'input[name="videoStream"][value="rtsp"]'
        );

    const rtmp =
        document.querySelector(
            'input[name="videoStream"][value="rtmp"]'
        );


    if(rtsp)
        rtsp.checked =
            videoSettingsRTSP;

    if(rtmp)
        rtmp.checked =
            !videoSettingsRTSP;


    const soundCapture =
        document.getElementById(
            "videoSettingsSoundCapture"
        );


    if(soundCapture)
        soundCapture.checked =
            videoSettingsSound === 1;


    updateEncodingSpeedVisibility();
}


// -----------------------------------------------------
// Default properties
// -----------------------------------------------------

function videoSettingsDefaults()
{
    // -------------------------------------------------
    // УВАГА:
    // Змінюємо тільки контроли.
    // videoSettings... НЕ змінюємо.
    // -------------------------------------------------

    const rtmp =
        document.querySelector(
            'input[name="videoStream"][value="rtmp"]'
        );

    const original =
        document.querySelector(
            'input[name="videoFrameSize"][value="original"]'
        );

    const cpu =
        document.querySelector(
            'input[name="videoEncoder"][value="cpu"]'
        );

    const veryfast =
        document.querySelector(
            'input[name="videoSpeed"][value="veryfast"]'
        );


    if(rtmp)
        rtmp.checked = true;

    if(original)
        original.checked = true;

    if(cpu)
        cpu.checked = true;

    if(veryfast)
        veryfast.checked = true;


    const fps =
        document.getElementById(
            "videoSettingsFps"
        );

    const fpsValue =
        document.getElementById(
            "videoSettingsFpsValue"
        );


    if(fps)
        fps.value = 30;

    if(fpsValue)
        fpsValue.textContent = "30";


    const bitrate =
        document.getElementById(
            "videoSettingsBitrate"
        );

    const bitrateValue =
        document.getElementById(
            "videoSettingsBitrateValue"
        );


    if(bitrate)
        bitrate.value = 2.5;

    if(bitrateValue)
        bitrateValue.textContent =
            "2.5 Mbit.";


    const zeroLatency =
        document.getElementById(
            "videoSettingsZeroLatency"
        );

    const soundCapture =
        document.getElementById(
            "videoSettingsSoundCapture"
        );


    if(zeroLatency)
        zeroLatency.checked = true;

    if(soundCapture)
        soundCapture.checked = false;


    updateEncodingSpeedVisibility();
}


// -----------------------------------------------------
// Apply
// -----------------------------------------------------

function videoSettingsApply()
{

    if( typeof AppState === "undefined"
        || AppState.sDeskId.length < 4
        || AppState.sMyId.length < 4
        || AppState.iDeskConnectStatus < 2
        || !AppState.bScreanCapture

    )            
    {
        showMessage(0,
            "Unable to apply video settings."
            , document.getElementById("videoSettingsOverlay")
        );
    }

    /*
        Значення беремо ТІЛЬКИ з контролів.

        Змінні videoSettings... тут
        НЕ змінюємо.
    */


    /*
        Frame size
    */

    let sizeF = 0;

    const frameSize =
        document.querySelector(
            'input[name="videoFrameSize"]:checked'
        );

    if(frameSize)
    {
        if(frameSize.value === "fullhd")
            sizeF = 1;
        else
        if(frameSize.value === "hd")
            sizeF = 2;
        else
        if(frameSize.value === "480")
            sizeF = 3;
    }


    /*
        Encoder
    */

    let encoderV = 0;

    const encoder =
        document.querySelector(
            'input[name="videoEncoder"]:checked'
        );

    if(
        encoder &&
        encoder.value === "gpu"
    )
    {
        encoderV = 1;
    }


    /*
        Encoding speed
    */

    let encSpeed = 0;

    const speed =
        document.querySelector(
            'input[name="videoSpeed"]:checked'
        );

    if(speed)
    {
        if(speed.value === "veryfast")
            encSpeed = 1;
        else
        if(speed.value === "medium")
            encSpeed = 2;
        else
        if(speed.value === "slower")
            encSpeed = 3;
    }


    /*
        FPS
    */

    const fps =
        document.getElementById(
            "videoSettingsFps"
        );

    const fpsValue =
        fps
            ? Number(fps.value)
            : 30;


    /*
        Bitrate

        QML:

        10 * id_slBt.value
    */

    const bitrate =
        document.getElementById(
            "videoSettingsBitrate"
        );

    const bitrateValue =
        bitrate
            ? Math.round(
                Number(bitrate.value) * 10
            )
            : 25;


    /*
        Zero latency
    */

    const zeroLatency =
        document.getElementById(
            "videoSettingsZeroLatency"
        );

    const latencyZ =
        zeroLatency &&
        zeroLatency.checked
            ? 1
            : 0;


    /*
        Stream

        QML передає:
        id_rbRTSP.checked
    */

    const rtsp =
        document.querySelector(
            'input[name="videoStream"][value="rtsp"]'
        );

    const isRtsp =
        rtsp &&
        rtsp.checked;


    /*
        Sound capture
    */

    const soundCapture =
        document.getElementById(
            "videoSettingsSoundCapture"
        );

    const sound =
        soundCapture &&
        soundCapture.checked
            ? 1
            : 0;


    /*
        Формуємо пакет.
    */
    

    const packet =
        Protocol.videoQualitySet(
            AppState.sDeskId,
            AppState.sMyId,
            sizeF,
            fpsValue,
            encoderV,
            encSpeed,
            bitrateValue,
            latencyZ,
            isRtsp,
            sound
        );


    /*
        Відправляємо на сервер.
    */

    if(
        !wsClient.send(packet)
    )
    {
        log(
            "VideoSettings: " +
            "не вдалося відправити пакет"
        );
    }
    else
    {
        fConnectDevice();
    }
}


// -----------------------------------------------------
// Ініціалізація пункту меню
// -----------------------------------------------------

function initializeVideoSettings()
{
    const section =
        document.getElementById(
            "videoSettingsSection"
        );

    if(!section)
        return;


    const title =
        section.querySelector(
            ".blockTitle"
        );

    if(!title)
        return;


    title.addEventListener(
        "click",
        event =>
        {
            event.preventDefault();
            event.stopPropagation();

            loadVideoSettings();
        }
    );


    title.addEventListener(
        "keydown",
        event =>
        {
            if(
                event.key === "Enter" ||
                event.key === " "
            )
            {
                event.preventDefault();
                event.stopPropagation();

                loadVideoSettings();
            }
        }
    );
}

// -----------------------------------------------------
// Video Quality Current
// -----------------------------------------------------

function fVideoQualityCurent(data)
{
    if(!data)
        return;


    if(data.length !== 8)
        return;


    videoSettingsSizeF =
        data[0];

    videoSettingsFPS =
        data[1];

    videoSettingsEncoderV =
        data[2];

    videoSettingsEncSpeed =
        data[3];

    videoSettingsBitrate =
        data[4];

    videoSettingsLatencyZ =
        data[5];

    videoSettingsRTSP =
        data[6];

    videoSettingsSound =
        data[7];


    applyVideoSettingsToControls();
}


initializeVideoSettings();