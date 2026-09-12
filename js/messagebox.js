// =====================================================
// MESSAGE BOX
// =====================================================


function showMessage(
    id,
    sData,
    parentElement = document.body
)
{
    /*
        Якщо повідомлення вже існує —
        видаляємо його.
    */

    const oldMessage =
        document.getElementById(
            "clientMessage"
        );

    if(oldMessage)
        oldMessage.remove();


    /*
        Якщо контейнер не переданий —
        використовуємо body.
    */

    if(!parentElement)
        parentElement = document.body;


    /*
        Затемнення.
    */

    const overlay =
        document.createElement("div");

    overlay.id =
        "clientMessage";


    overlay.style.position =
        "absolute";

    overlay.style.left =
        "0";

    overlay.style.top =
        "0";

    overlay.style.width =
        "100%";

    overlay.style.height =
        "100%";


    overlay.style.backgroundColor =
        "rgba(0, 0, 0, 0.45)";


    overlay.style.display =
        "flex";

    overlay.style.alignItems =
        "center";

    overlay.style.justifyContent =
        "center";


    overlay.style.zIndex =
        "10000";


    /*
        Вікно повідомлення.
    */

    const messageBox =
        document.createElement("div");


    messageBox.style.minWidth =
        "300px";

    messageBox.style.maxWidth =
        "600px";


    messageBox.style.backgroundColor =
        "#ffffff";

    messageBox.style.borderRadius =
        "8px";


    messageBox.style.padding =
        "25px";


    messageBox.style.boxShadow =
        "0 4px 20px rgba(0, 0, 0, 0.35)";


    messageBox.style.textAlign =
        "center";


    /*
        Текст повідомлення.
    */

    const messageText =
        document.createElement("div");


    messageText.style.fontSize =
        "16px";

    messageText.style.color =
        "#222222";

    messageText.style.whiteSpace =
        "pre-wrap";


    messageText.textContent =
        sData;


    /*
        ID повідомлення.

        Залишаємо елемент,
        як було в app.js.
    */

    const messageId =
        document.createElement("div");


    messageId.style.marginTop =
        "10px";

    messageId.style.fontSize =
        "12px";

    messageId.style.color =
        "#888888";


    /*
        Кнопка OK.
    */

    const button =
        document.createElement("button");


    button.textContent =
        "OK";


    button.style.marginTop =
        "20px";

    button.style.padding =
        "8px 25px";


    button.style.border =
        "none";

    button.style.borderRadius =
        "4px";


    button.style.cursor =
        "pointer";


    button.onclick =
        function()
        {
            overlay.remove();
        };


    /*
        Формування вікна.
    */

    messageBox.appendChild(
        messageText
    );

    messageBox.appendChild(
        messageId
    );

    messageBox.appendChild(
        button
    );


    overlay.appendChild(
        messageBox
    );


    parentElement.appendChild(
        overlay
    );
}