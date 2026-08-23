/*
    clipboard.js

*/

const Clipboard =
{
    /*
        Буфер, який вже був успішно
        відправлений на сервер.
    */
    sBufferPrev: "",


    /*
        Буфер, який накопичується
        при отриманні з сервера.

        VAR 0 -> очищення
        VAR 1 -> додавання
        VAR 2 -> додавання + запис
    */
    sBufferWrite: "",


    /*
        Одноразовий запит permission
        на читання системного clipboard.
    */
    m_bPermissionRequested: false,


    /*
        Результат запиту permission.

        true  -> доступ дозволений
        false -> доступ заборонений
    */
    m_bReadPermission: false,


    /*
        --------------------------------------------------
        requestReadPermission

        Викликається один раз по кліку
        на кнопку Connect Client.
        --------------------------------------------------
    */

    async requestReadPermission()
    {
        /*
            Якщо запит вже робився,
            повторно його не виконуємо.
        */

        if(
            this.m_bPermissionRequested
        )
        {
            return this.m_bReadPermission;
        }


        this.m_bPermissionRequested =
            true;


        /*
            Перевірка Clipboard API.
        */

        if(
            !navigator.clipboard ||
            !navigator.clipboard.readText
        )
        {
            log(
                "Clipboard: Clipboard API недоступний."
            );

            this.m_bReadPermission =
                false;

            return false;
        }


        try
        {
            /*
                Цей виклик виконується
                безпосередньо під час кліку
                по кнопці Connect Client.

                Якщо permission = prompt,
                браузер може показати
                вікно дозволу.
            */

            await navigator.clipboard.readText();


            this.m_bReadPermission =
                true;


            log(
                "Clipboard: доступ на читання дозволено."
            );


            return true;
        }
        catch(error)
        {
            this.m_bReadPermission =
                false;


            log(
                "Clipboard: доступ на читання заборонено."
            );


            return false;
        }
    },


    /*
        --------------------------------------------------
        readAndSend

        Викликається з keyboard.js
        при Ctrl+V.

        Спочатку читаємо локальний clipboard,
        потім передаємо його на remote PC.
        --------------------------------------------------
    */

    async readAndSend()
    {
        /*
            Clipboard API повинен бути доступний.
        */

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


        /*
            Permission повинен бути
            отриманий раніше через
            кнопку Connect Client.
        */

        if(
            !this.m_bReadPermission
        )
        {
            log(
                "Clipboard: доступ на читання не дозволений."
            );

            return false;
        }


        /*
            Remote PC повинен бути підключений.
        */

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
                Читаємо локальний clipboard.
            */

            const sData =
                await navigator.clipboard.readText();


            /*
                Якщо цей buffer вже був
                успішно відправлений —
                повторно не передаємо.
            */

            if(
                sData === this.sBufferPrev
            )
            {
                return true;
            }


            /*
                Передаємо повний buffer.
            */

            const bResult =
                this.fSendClipboard(
                    sData
                );


            /*
                Запам'ятовуємо buffer
                тільки після успішної
                передачі.
            */

            if(
                bResult
            )
            {
                this.sBufferPrev =
                    sData;
            }


            return bResult;
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

        Передача clipboard
        згідно існуючого протоколу.

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


        /*
            --------------------------------------------------
            START

            VAR = 0
            --------------------------------------------------
        */

        let packet =
            Protocol.fSendClipboard(
                AppState.sDeskId,
                0,
                ""
            );


        if(
            packet === null
        )
        {
            return false;
        }


        if(
            !wsClient.send(packet)
        )
        {
            log(
                "Clipboard: START не відправлено."
            );

            return false;
        }


        /*
            --------------------------------------------------
            DATA

            Розмір частини = 250 символів.
            --------------------------------------------------
        */

        const a_iPlas =
            250;

        const a_iSz =
            sData.length;

        let a_iSend =
            0;


        /*
            Всі частини,
            крім останньої.
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


            if(
                packet === null
            )
            {
                return false;
            }


            if(
                !wsClient.send(packet)
            )
            {
                log(
                    "Clipboard: DATA не відправлено."
                );

                return false;
            }


            a_iSend +=
                a_iPlas;
        }


        /*
            --------------------------------------------------
            END

            VAR = 2

            Остання частина clipboard.
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


        if(
            packet === null
        )
        {
            return false;
        }


        if(
            !wsClient.send(packet)
        )
        {
            log(
                "Clipboard: END не відправлено."
            );

            return false;
        }


        log(
            "Clipboard: передано " +
            sData.length +
            " символів."
        );


        return true;
    },


    /*
        --------------------------------------------------
        fBufferWrite

        Отримання clipboard
        від remote PC.

        Аналог:

            Control::fBufferWrite()
        --------------------------------------------------
    */

    fBufferWrite(
        iVar,
        sData
    )
    {
        log(
            "Clipboard.fBufferWrite: " +
            iVar +
            " " +
            sData
        );


        /*
            --------------------------------------------------
            VAR 0

            Початок нового clipboard.
            --------------------------------------------------
        */

        if(
            iVar === 0 ||
            !AppState.bStream
        )
        {
            this.sBufferWrite =
                "";

            return;
        }


        /*
            --------------------------------------------------
            VAR 1

            Проміжна частина.
            --------------------------------------------------
        */

        if(
            iVar === 1
        )
        {
            this.sBufferWrite +=
                sData;

            return;
        }


        /*
            --------------------------------------------------
            VAR 2

            Остання частина.

            Тільки тут робимо запис
            у системний clipboard.
            --------------------------------------------------
        */

        if(
            iVar === 2
        )
        {
            this.sBufferWrite +=
                sData;


            /*
                Аналог C++:

                    if(
                        StaticData::m_sMyId != "0"
                        && m_iTimeForBuffer < 5
                    )
            */

            if(
                AppState.sMyId !== "0" &&
                AppState.sMyId.length > 0 &&
                AppState.bStream
            )
            {
                this.writeClipboard(
                    this.sBufferWrite
                );
            }
        }
    },


    /*
        --------------------------------------------------
        writeClipboard

        Запис повністю зібраного clipboard
        у локальний системний clipboard.

        Викликається тільки після VAR 2.
        --------------------------------------------------
    */

    async writeClipboard(
        sData
    )
    {
        if(
            !navigator.clipboard ||
            !navigator.clipboard.writeText
        )
        {
            log(
                "Clipboard: Clipboard API write недоступний."
            );

            return false;
        }


        try
        {
            /*
                Повністю замінюємо
                текстовий clipboard.
            */

            console.log(
                "Clipboard: buffer отримано. " +
                sData
            );

            await navigator.clipboard.writeText(
                sData
            );


            /*
                Цей buffer тепер вважаємо
                вже відомим локальному клієнту.

                Наступний Ctrl+V не повинен
                відправляти його назад
                на сервер.
            */

            this.sBufferPrev =
                sData;


            console.log(
                "Clipboard: buffer записано: " +
                sData.length +
                " символів."
            );


            return true;
        }
        catch(error)
        {
            log(
                "Clipboard: помилка запису: " +
                (
                    error &&
                    error.message
                        ? error.message
                        : error
                )
            );

            return false;
        }
    }
};