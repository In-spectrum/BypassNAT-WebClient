// =====================================================
// SUPPORT
// =====================================================

let supportLoaded = false;


// -----------------------------------------------------
// Завантаження Support
// -----------------------------------------------------

function loadSupport()
{
    if(supportLoaded)
    {
        showSupport();
        return;
    }


    fetch("support.html")
        .then(response =>
        {
            if(!response.ok)
            {
                throw new Error(
                    "Cannot load support.html: " +
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
                    "btnSupportCancel"
                );

            if(btnCancel)
            {
                btnCancel.addEventListener(
                    "click",
                    hideSupport
                );
            }


            const back =
                document.querySelector(
                    ".supportBack"
                );

            if(back)
            {
                back.addEventListener(
                    "click",
                    hideSupport
                );
            }


            supportLoaded = true;

            showSupport();
        })
        .catch(error =>
        {
            console.error(
                "Support load error:",
                error
            );
        });
}


// -----------------------------------------------------
// Показати
// -----------------------------------------------------

function showSupport()
{
    const overlay =
        document.getElementById(
            "supportOverlay"
        );

    if(!overlay)
        return;


    overlay.style.display = "flex";
}


// -----------------------------------------------------
// Сховати
// -----------------------------------------------------

function hideSupport()
{
    const overlay =
        document.getElementById(
            "supportOverlay"
        );

    if(!overlay)
        return;


    overlay.style.display = "none";
}


// -----------------------------------------------------
// Ініціалізація пункту меню
// -----------------------------------------------------

function initializeSupport()
{
    const section =
        document.getElementById(
            "supportSection"
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

            loadSupport();
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

                loadSupport();
            }
        }
    );
}