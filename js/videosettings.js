// =====================================================
// VIDEO SETTINGS
// =====================================================

let videoSettingsLoaded = false;


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
                    hideVideoSettings
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
// Default properties
// -----------------------------------------------------

function videoSettingsDefaults()
{
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


initializeVideoSettings();