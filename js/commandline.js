// =====================================================
// COMMAND LINE
// =====================================================

let commandLineLoaded = false;


// -----------------------------------------------------
// Завантаження Command Line
// -----------------------------------------------------

function loadCommandLine()
{
    if(commandLineLoaded)
    {
        showCommandLine();
        return;
    }

    fetch("commandline.html")
        .then(response =>
        {
            if(!response.ok)
            {
                throw new Error(
                    "Cannot load commandline.html: " +
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
                    "btnCommandLineCancel"
                );

            if(btnCancel)
            {
                btnCancel.addEventListener(
                    "click",
                    hideCommandLine
                );
            }

            const btnRequest =
                document.getElementById(
                    "btnCommandLineRequest"
                );

            if(btnRequest)
            {
                btnRequest.addEventListener(
                    "click",
                    commandLineRequest
                );

                // console.log(
                //     "CommandLine: Request handler connected"
                // );
            }

            commandLineLoaded = true;

            showCommandLine();
        })
        .catch(error =>
        {
            console.error(
                "Command Line load error:",
                error
            );
        });
}


// -----------------------------------------------------
// Показати
// -----------------------------------------------------

function showCommandLine()
{
    const overlay =
        document.getElementById(
            "commandLineOverlay"
        );

    if(!overlay)
        return;

    overlay.style.display = "flex";
}


// -----------------------------------------------------
// Сховати
// -----------------------------------------------------

function hideCommandLine()
{
    const overlay =
        document.getElementById(
            "commandLineOverlay"
        );

    if(!overlay)
        return;

    overlay.style.display = "none";
}


// -----------------------------------------------------
// Ініціалізація пункту меню
// -----------------------------------------------------

function initializeCommandLine()
{
    //console.log("CommandLine: initializeCommandLine 0:");

    const section =
        document.getElementById(
            "commandLineSection"
        );

    if(!section)
        return;

    const title =
        section.querySelector(
            ".blockTitle"
        );

    if(!title)
        return;

    //console.log("CommandLine: initializeCommandLine 1:");

    // Mouse
    title.addEventListener(
        "click",
        event =>
        {
            event.preventDefault();
            event.stopPropagation();

            loadCommandLine();
        }
    );


    // Keyboard
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

                loadCommandLine();
            }
        }
    );

    //console.log("CommandLine: initializeCommandLine 10:");
}

function commandLineRequest()
{
    //console.log("CommandLine: Request pressed");

    if(AppState.iDeskConnectStatus !== 2)
    {
        //console.log("CommandLine: ERROR - not connected to desktop");
        showMessage(0,
            "ERROR\n\nNot connected to desktop."
        );
        return;
    }


    const input =
        document.getElementById(
            "commandLineInput"
        );

    const output =
        document.getElementById(
            "commandLineOutput"
        );

    const cyrillic =
        document.getElementById(
            "cbCommandLineCyrillic"
        );


    if(!input)
    {
        //console.log("CommandLine: Input element not found");
        return;
    }


    if(!output)
    {
        console.log("CommandLine: Output element not found");
        return;
    }


    if(!cyrillic)
    {
        //console.log("CommandLine: Cyrillic checkbox not found");
        return;
    }


    const command =
        input.value;


    // console.log(
    //     "CommandLine: command = [" +
    //     command +
    //     "]"
    // );


    // console.log(
    //     "CommandLine: command length = " +
    //     command.length
    // );


    if(command.length < 2)
    {
        // console.log(
        //     "CommandLine: command is too short"
        // );

        return;
    }


    /*
        Формування Output.
    */

    if(!output.value.endsWith("->"))
    {
        output.value += "\n->";

        // console.log(
        //     "CommandLine: added ->"
        // );
    }


    output.value +=
        command;

    output.value +=
        "\r\n-BEGIN------------------------------------\r\n";


    // console.log(
    //     "CommandLine: output updated"
    // );


    output.scrollTop =
        output.scrollHeight;


    /*
        Варіант команди:

        1 - normal
        2 - Cyrillic
    */

    const variable =
        cyrillic.checked ? 2 : 1;


    // console.log(
    //     "CommandLine: variable = " +
    //     variable
    // );


    // console.log(
    //     "CommandLine: DeskId = [" +
    //     AppState.sDeskId +
    //     "]"
    // );


    // console.log(
    //     "CommandLine: MyId = [" +
    //     AppState.sMyId +
    //     "]"
    // );


    /*
        Формування packet.
    */

    const packet =
        Protocol.createCommandLineRequest(
            AppState.sDeskId,
            AppState.sMyId,
            command,
            variable
        );


    if(!packet)
    {
        // console.log(
        //     "CommandLine: ERROR - packet is empty"
        // );

        return;
    }


    /*
        Вивід packet у HEX.
    */

    const packetBytes =
        new Uint8Array(packet);


    // console.log(
    //     "CommandLine: packet size = " +
    //     packetBytes.length
    // );


    // console.log(
    //     "CommandLine: packet = " +
    //     WebSocketClient.toHex(packet)
    // );


    /*
        Перевірка WebSocket.
    */

    if(!wsClient)
    {
        console.log(
            "CommandLine: ERROR - wsClient is not defined"
        );

        return;
    }


    if(!wsClient.socket)
    {
        console.log(
            "CommandLine: ERROR - WebSocket socket is null"
        );

        return;
    }


    // console.log(
    //     "CommandLine: WebSocket state = " +
    //     wsClient.socket.readyState
    // );


    /*
        Відправлення.
    */

    const sent =
        wsClient.send(packet);


    if(!sent)
    {
        console.log(
            "CommandLine: ERROR - packet was NOT sent"
        );
    }
}

function fCommandLineResponse(sData)
{
    const output =
        document.getElementById(
            "commandLineOutput"
        );

    if(!output)
    {
        console.log(
            "CommandLine: Output element not found"
        );

        return;
    }


    output.value += sData;

    output.scrollTop =
        output.scrollHeight;
}