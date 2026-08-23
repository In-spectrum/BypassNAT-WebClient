/*
    clipboard.js

*/

const Clipboard =
{
    /*
        --------------------------------------------------
        readAndSend

        Читаємо clipboard та передаємо його
        на remote PC.

        Функція async, тому caller може
        дочекатися повного завершення передачі.
        --------------------------------------------------
    */
    sBufferPrev: "",

    async readAndSend()
    {
        if(
            !navigator.clipboard ||
            !navigator.clipboard.readText
        )
        {
            log(
                "Clipboard: Clipboard API недоступний."
            );

            return false;
        }


        if(
            !AppState.serverConnected ||
            !AppState.sDeskId
        )
        {
            return false;
        }


        try
        {
            /*
                Тут браузер може показати
                запит permission.

                Викликається тільки при Ctrl+V.
            */

            const sData =
                await navigator.clipboard.readText();

            if(this.sBufferPrev == sData)
                return true;

            this.sBufferPrev =
                sData;


            /*
                Передаємо весь clipboard.
            */

            return this.fSendClipboard(
                sData
            );
        }
        catch(error)
        {
            log(
                "Clipboard: помилка читання: " +
                (
                    error &&
                    error.message
                        ? error.message
                        : error
                )
            );

            return false;
        }
    },


    /*
        --------------------------------------------------
        fSendClipboard

        Передача clipboard згідно C++ протоколу.

        VAR 0 = START
        VAR 1 = DATA
        VAR 2 = END
        --------------------------------------------------
    */

    fSendClipboard(
        sData
    )
    {
        if(
            !AppState.serverConnected ||
            !AppState.sDeskId
        )
        {
            return false;
        }

        //sData += sData + "_MyTest";

        /*
            --------------------------------------------------
            START
            --------------------------------------------------
        */

        let packet =
            Protocol.fSendClipboard(
                AppState.sDeskId,
                0,
                ""
            );


        if(packet === null)
            return false;


        if(!wsClient.send(packet))
            return false;


        /*
            --------------------------------------------------
            DATA

            Аналог C++:

                int a_iPlas = 250;
            --------------------------------------------------
        */

        const a_iPlas =
            250;

        const a_iSz =
            sData.length;

        let a_iSend =
            0;


        /*
            Всі частини, крім останньої.
        */

        while(
            a_iSend +
            a_iPlas <
            a_iSz
        )
        {
            const sTemp =
                sData.substring(
                    a_iSend,
                    a_iSend +
                    a_iPlas
                );


            packet =
                Protocol.fSendClipboard(
                    AppState.sDeskId,
                    1,
                    sTemp
                );


            if(packet === null)
                return false;


            if(!wsClient.send(packet))
                return false;


            a_iSend +=
                a_iPlas;
        }


        /*
            --------------------------------------------------
            END
            --------------------------------------------------
        */

        const sLast =
            sData.substring(
                a_iSend
            );


        packet =
            Protocol.fSendClipboard(
                AppState.sDeskId,
                2,
                sLast
            );


        if(packet === null)
            return false;


        if(!wsClient.send(packet))
            return false;


        log(
            "Clipboard: передано " +
            sData.length +
            " символів."
        );


        /*
            Дуже важливо:

            true повертається тільки після
            відправки END.
        */

        return true;
    }
};