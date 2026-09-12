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
}