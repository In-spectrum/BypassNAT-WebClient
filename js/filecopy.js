/*
--------------------------------------------------
File Copy
--------------------------------------------------
*/

class FileCopy
{
    constructor()
    {
        this.m_bVisible =
            false;

        this.m_bCopying =
            false;

        this.m_iTimeCopying =
            0;

        this.m_sCopyType =
            "";

        /*
            --------------------------------------------------
            TRANSFER TIME
            --------------------------------------------------

            Час повного копіювання файла.

            m_iTransferStartTime:
                performance.now() на старті.

            m_iTransferEndTime:
                performance.now() на фініші.

            m_iTransferElapsedTime:
                повний час копіювання в ms.
        */

        this.m_iTransferStartTime =
            0;

        this.m_iTransferEndTime =
            0;

        this.m_iTransferElapsedTime =
            0;


        /*
            --------------------------------------------------
            COMMON FILE DATA
            --------------------------------------------------

            m_sPathFile:
                шлях БЕЗ імені файла

            m_sNameFile:
                ім'я файла з розширенням
            --------------------------------------------------
        */

        this.m_sPathFile =
            "";

        this.m_sNameFile =
            "";


        /*
            --------------------------------------------------
            RECEIVE
            --------------------------------------------------
        */

        /*
            Handle файла, вибраного
            через Save File Picker.
        */

        this.m_oReceiveFileHandle =
            null;

        this.m_oReceiveWritable =
            null;


        /*
            --------------------------------------------------
            SEND
            --------------------------------------------------
        */

        /*
            Handle файла, вибраного
            через Open File Picker.
        */

        this.m_oSendFileHandle =
            null;


        /*
            Об'єкт File для читання.
        */

        this.m_oSendFile =
            null;


        /*
            Розмір файла.
        */

        this.m_iFileSize =
            0;


        /*
            Кількість реально
            прочитаних байт.
        */

        this.m_iFileRead =
            0;


        /*
            Розмір одного chunk.
        */

        this.m_iSendChunkSize =
            256 * 1024;
    }


    /*
    --------------------------------------------------
    INIT
    --------------------------------------------------
    */

    init()
    {
        const title =
            document.getElementById(
                "fileCopyTitle"
            );


        if(!title)
        {
            return;
        }


        title.addEventListener(
            "click",
            () =>
            {
                this.open();
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

                    this.open();
                }
            }
        );
    }


    /*
    --------------------------------------------------
    OPEN
    --------------------------------------------------
    */

    open()
    {
        if(
            document.getElementById(
                "fileCopyWindow"
            )
        )
        {
            return;
        }


        this.m_bVisible =
            true;

        this.m_bCopying =
            false;

        this.m_sCopyType =
            "";


        /*
            --------------------------------------------------
            RESET
            --------------------------------------------------
        */

        this.m_sPathFile =
            "";

        this.m_sNameFile =
            "";

        this.m_oReceiveFileHandle =
            null;

        this.m_oReceiveWritable =
            null;


        this.m_oSendFileHandle =
            null;

        this.m_oSendFile =
            null;

        this.m_iFileSize =
            0;

        this.m_iFileRead =
            0;


        /*
            --------------------------------------------------
            OVERLAY
            --------------------------------------------------
        */

        const overlay =
            document.createElement(
                "div"
            );


        overlay.id =
            "fileCopyWindow";


        overlay.style.position =
            "fixed";

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
            --------------------------------------------------
            WINDOW
            --------------------------------------------------
        */

        const box =
            document.createElement(
                "div"
            );


        box.style.width =
            "50vw";

        box.style.maxWidth =
            "600px";

        box.style.minWidth =
            "350px";

        box.style.backgroundColor =
            "#ffffff";

        box.style.borderRadius =
            "8px";

        box.style.padding =
            "25px";

        box.style.boxShadow =
            "0 4px 20px rgba(0, 0, 0, 0.35)";

        box.style.boxSizing =
            "border-box";


        /*
            --------------------------------------------------
            TITLE
            --------------------------------------------------
        */

        const title =
            document.createElement(
                "div"
            );


        title.textContent =
            "File copy";


        title.style.fontSize =
            "18px";

        title.style.fontWeight =
            "700";

        title.style.color =
            "#222222";

        title.style.textAlign =
            "center";

        title.style.marginBottom =
            "20px";


        /*
            --------------------------------------------------
            NORMAL
            --------------------------------------------------
        */

        const normal =
            document.createElement(
                "div"
            );


        normal.id =
            "fileCopyNormal";


        /*
            --------------------------------------------------
            PATH LABEL
            --------------------------------------------------
        */

        const pathLabel =
            document.createElement(
                "div"
            );


        pathLabel.textContent =
            "Add file path with file name";


        pathLabel.style.fontSize =
            "15px";

        pathLabel.style.color =
            "#222222";

        pathLabel.style.marginBottom =
            "8px";


        /*
            --------------------------------------------------
            PATH + RECEIVE ROW
            --------------------------------------------------
        */

        const receiveRow =
            document.createElement(
                "div"
            );


        receiveRow.style.display =
            "flex";

        receiveRow.style.alignItems =
            "center";

        receiveRow.style.gap =
            "10px";


        /*
            --------------------------------------------------
            PATH INPUT
            --------------------------------------------------
        */

        const path =
            document.createElement(
                "input"
            );


        path.id =
            "fileCopyPath";


        path.type =
            "text";


        path.style.flex =
            "1";


        path.style.height =
            "42px";


        path.style.boxSizing =
            "border-box";


        path.style.padding =
            "6px 10px";


        path.style.fontSize =
            "16px";


        path.placeholder =
            "File path";


        /*
            --------------------------------------------------
            RECEIVE BUTTON
            --------------------------------------------------
        */

        const receive =
            document.createElement(
                "button"
            );


        receive.textContent =
            "Receive";


        receive.style.minWidth =
            "110px";


        receive.style.height =
            "38px";


        receive.style.fontSize =
            "15px";


        receive.onclick =
            async () =>
            {
                await this.start(
                    "receive"
                );
            };


        receiveRow.appendChild(
            path
        );


        receiveRow.appendChild(
            receive
        );


        /*
            --------------------------------------------------
            SEND YOUR FILE + CANCEL ROW
            --------------------------------------------------
        */

        const bottomRow =
            document.createElement(
                "div"
            );


        bottomRow.style.display =
            "flex";


        bottomRow.style.justifyContent =
            "space-between";


        bottomRow.style.alignItems =
            "center";


        /*
            Відступ від рядка Receive.
        */

        bottomRow.style.marginTop =
            "25px";


        /*
            --------------------------------------------------
            SEND YOUR FILE
            --------------------------------------------------
        */

        const sendYourFile =
            document.createElement(
                "button"
            );


        sendYourFile.textContent =
            "Send Your File";


        sendYourFile.style.minWidth =
            "110px";


        sendYourFile.style.height =
            "38px";


        sendYourFile.style.fontSize =
            "15px";


        sendYourFile.onclick =
            async () =>
            {
                await this.start(
                    "send"
                );
            };


        /*
            --------------------------------------------------
            CANCEL
            --------------------------------------------------
        */

        const cancel =
            document.createElement(
                "button"
            );


        cancel.textContent =
            "Cancel";


        cancel.style.minWidth =
            "110px";


        cancel.style.height =
            "38px";


        cancel.style.fontSize =
            "15px";


        cancel.onclick =
            async () =>
            {
                await this.stop();

                await this.close();
            };


        bottomRow.appendChild(
            sendYourFile
        );


        bottomRow.appendChild(
            cancel
        );


        /*
            --------------------------------------------------
            NORMAL APPEND
            --------------------------------------------------
        */

        normal.appendChild(
            pathLabel
        );


        normal.appendChild(
            receiveRow
        );


        normal.appendChild(
            bottomRow
        );


        /*
            --------------------------------------------------
            PROGRESS
            --------------------------------------------------
        */

        const progress =
            document.createElement(
                "div"
            );


        progress.id =
            "fileCopyProgressControls";


        progress.style.display =
            "none";


        progress.style.flexDirection =
            "column";


        progress.style.alignItems =
            "stretch";


        const fileName =
            document.createElement(
                "div"
            );


        fileName.id =
            "fileCopyFileName";


        fileName.style.color =
            "#222222";


        fileName.style.textAlign =
            "center";


        fileName.style.marginBottom =
            "12px";


        const progressBar =
            document.createElement(
                "progress"
            );


        progressBar.id =
            "fileCopyProgress";


        progressBar.value =
            "0";


        progressBar.max =
            "100";


        progressBar.style.width =
            "100%";

        const progressPercent =
            document.createElement(
                "div"
            );

        progressPercent.id =
            "fileCopyProgressPercent";

        progressPercent.textContent =
            "0.0%";

        progressPercent.style.textAlign =
            "left";

        progressPercent.style.fontSize =
            "14px";

        progressPercent.style.color =
            "#222222";

        progressPercent.style.marginTop =
            "5px";


        const stop =
            document.createElement(
                "button"
            );


        stop.textContent =
            "Stop";


        stop.style.alignSelf =
            "flex-end";


        stop.style.minWidth =
            "110px";


        stop.style.height =
            "38px";


        stop.style.fontSize =
            "15px";


        stop.style.marginTop =
            "20px";


        stop.onclick =
            async () =>
            {
                await this.stop();
            };


        progress.appendChild(
            fileName
        );


        progress.appendChild(
            progressBar
        );

        progress.appendChild(
            progressPercent
        );


        progress.appendChild(
            stop
        );


        /*
            --------------------------------------------------
            WINDOW APPEND
            --------------------------------------------------
        */

        box.appendChild(
            title
        );


        box.appendChild(
            normal
        );


        box.appendChild(
            progress
        );


        overlay.appendChild(
            box
        );


        document.body.appendChild(
            overlay
        );
    }


    /*
    --------------------------------------------------
    PARSE FILE PATH
    --------------------------------------------------

    Input:

        C:\Folder\Test\132918.jpg

    Result:

        m_sPathFile =
            C:\Folder\Test\

        m_sNameFile =
            132918.jpg
    --------------------------------------------------
    */

    parseFilePath()
    {
        const path =
            document.getElementById(
                "fileCopyPath"
            );


        if(!path)
        {
            this.showError(
                "File path field not found."
            );

            return false;
        }


        const sFilePath =
            path.value.trim();


        if(
            sFilePath.length === 0
        )
        {
            this.showError(
                "Enter file path and file name."
            );

            return false;
        }


        /*
            --------------------------------------------------
            LAST SLASH
            --------------------------------------------------
        */

        const iSlash1 =
            sFilePath.lastIndexOf("/");


        const iSlash2 =
            sFilePath.lastIndexOf("\\");


        const iSlash =
            Math.max(
                iSlash1,
                iSlash2
            );


        /*
            --------------------------------------------------
            PATH
            --------------------------------------------------
        */

        if(
            iSlash >= 0
        )
        {
            this.m_sPathFile =
                sFilePath.substring(
                    0,
                    iSlash + 1
                );


            this.m_sNameFile =
                sFilePath.substring(
                    iSlash + 1
                );
        }
        else
        {
            this.m_sPathFile =
                "";

            this.m_sNameFile =
                sFilePath;
        }


        /*
            --------------------------------------------------
            NAME CHECK
            --------------------------------------------------
        */

        if(
            this.m_sNameFile.length === 0
        )
        {
            this.showError(
                "Invalid file name."
            );

            return false;
        }


        /*
            --------------------------------------------------
            LOG
            --------------------------------------------------
        */

        console.log(
            "FileCopy: PathFile =",
            this.m_sPathFile
        );


        console.log(
            "FileCopy: NameFile =",
            this.m_sNameFile
        );


        return true;
    }


    /*
    --------------------------------------------------
    START
    --------------------------------------------------
    */

    async start(
        sType
    )
    {
        /*
            --------------------------------------------------
            SEND
            --------------------------------------------------
        */

        if(
            sType === "send"
        )
        {
            /*
                --------------------------------------------------
                SELECT FILE
                --------------------------------------------------
            */

            const bOk =
                await this.selectSendFile();


            if(!bOk)
            {
                this.m_bCopying =
                    false;

                this.m_sCopyType =
                    "";

                return;
            }


            /*
                --------------------------------------------------
                OPEN FILE
                --------------------------------------------------
            */

            const bOpen =
                await this.openSendFile();


            if(!bOpen)
            {
                this.m_bCopying =
                    false;

                this.m_sCopyType =
                    "";

                return;
            }


            /*
                --------------------------------------------------
                SAVE STATE
                --------------------------------------------------
            */

            this.m_sCopyType =
                "send";


            this.m_iFileRead =
                0;


            /*
                --------------------------------------------------
                SHOW PROGRESS
                --------------------------------------------------
            */

            const normal =
                document.getElementById(
                    "fileCopyNormal"
                );


            const progress =
                document.getElementById(
                    "fileCopyProgressControls"
                );


            const fileName =
                document.getElementById(
                    "fileCopyFileName"
                );


            if(normal)
            {
                normal.style.display =
                    "none";
            }


            if(progress)
            {
                progress.style.display =
                    "flex";
            }


            if(fileName)
            {
                fileName.textContent =
                    this.m_sNameFile;
            }


            this.setProgress(
                0
            );


            this.m_iTimeCopying =
                0;


            console.log(
                "FileCopy: Send started.",
                "name =",
                this.m_sNameFile,
                "size =",
                this.m_iFileSize
            );


            this.startTransferTimer();


            /*
                --------------------------------------------------
                SEND FIRST CHUNK
                --------------------------------------------------
            */

            this.m_bCopying =
                true;

            await this.sendFile(
                ("/web-client/" + this.m_sNameFile)
                , 0
            );




            return;
        }


        /*
            --------------------------------------------------
            RECEIVE
            --------------------------------------------------
        */

        if(
            sType === "receive"
        )
        {
            /*
                --------------------------------------------------
                READ PATH + FILE NAME
                --------------------------------------------------
            */

            if(
                !this.parseFilePath()
            )
            {
                return;
            }


            /*
                --------------------------------------------------
                SAVE STATE
                --------------------------------------------------
            */

            this.m_sCopyType =
                "receive";


            /*
                --------------------------------------------------
                SAVE FILE PICKER
                --------------------------------------------------
            */

            const bOk =
                await this.selectReceiveFile();


            if(!bOk)
            {
                this.m_bCopying =
                    false;

                this.m_sCopyType =
                    "";

                return;
            }


            /*
                --------------------------------------------------
                OPEN FILE
                --------------------------------------------------
            */

            const bOpen =
                await this.openReceiveFile();


            if(!bOpen)
            {
                this.m_bCopying =
                    false;

                this.m_sCopyType =
                    "";

                return;
            }


            /*
                --------------------------------------------------
                SHOW PROGRESS
                --------------------------------------------------
            */

            const normal =
                document.getElementById(
                    "fileCopyNormal"
                );


            const progress =
                document.getElementById(
                    "fileCopyProgressControls"
                );


            const fileName =
                document.getElementById(
                    "fileCopyFileName"
                );


            if(normal)
            {
                normal.style.display =
                    "none";
            }


            if(progress)
            {
                progress.style.display =
                    "flex";
            }


            if(fileName)
            {
                fileName.textContent =
                    this.m_sNameFile;
            }


            this.setProgress(
                0
            );


            console.log(
                "FileCopy: Receive started.",
                "path =",
                this.m_sPathFile,
                "name =",
                this.m_sNameFile
            );


            /*
                --------------------------------------------------
                SEND FIRST REQUEST
                --------------------------------------------------

                Повний шлях формується
                з path + name.
            */

            const path =
                document.getElementById(
                    "fileCopyPath"
                );


            const sPath =
                path
                    ? path.value.trim()
                    : "";


            if(
                sPath.length === 0
            )
            {
                this.showError(
                    "File path is empty."
                );

                return;
            }


            this.m_bCopying =
                true;

            this.startTransferTimer();

            const result =
                this.sendGetFileRequest(
                    sPath,
                    0
                );


            if(!result)
            {
                console.error(
                    "FileCopy: sendGetFileRequest failed."
                );

                return;
            }


            this.m_iTimeCopying =
                0;


            return;
        }


        /*
            --------------------------------------------------
            UNKNOWN TYPE
            --------------------------------------------------
        */

        this.showError(
            "Unknown file operation."
        );
    }


    /*
    --------------------------------------------------
    SEND:
    SELECT FILE
    --------------------------------------------------
    */

    async selectSendFile()
    {
        if(
            !window.showOpenFilePicker
        )
        {
            this.showError(
                "File System Access API is not supported by this browser."
            );

            return false;
        }


        try
        {
            const aHandles =
                await window.showOpenFilePicker();


            if(
                !aHandles ||
                aHandles.length === 0
            )
            {
                return false;
            }


            this.m_oSendFileHandle =
                aHandles[0];


            console.log(
                "FileCopy: Open picker OK."
            );


            console.log(
                "FileCopy: selected file name =",
                this.m_oSendFileHandle.name
            );


            return true;
        }
        catch(error)
        {
            if(
                error &&
                error.name ===
                    "AbortError"
            )
            {
                console.log(
                    "FileCopy: Open picker cancelled."
                );

                return false;
            }


            console.error(
                "FileCopy: Open picker error:",
                error
            );


            this.showError(
                "Unable to select the file."
            );


            return false;
        }
    }


    /*
    --------------------------------------------------
    OPEN SEND FILE
    --------------------------------------------------

    Отримує об'єкт File для читання.

    m_iFileSize:
        розмір файла.

    m_sNameFile:
        ім'я файла.
    --------------------------------------------------
    */

    async openSendFile()
    {
        if(
            !this.m_oSendFileHandle
        )
        {
            this.showError(
                "File is not selected."
            );

            return false;
        }


        try
        {
            this.m_oSendFile =
                await this.m_oSendFileHandle.getFile();


            if(
                !this.m_oSendFile
            )
            {
                this.showError(
                    "Cannot open selected file."
                );

                return false;
            }


            /*
                --------------------------------------------------
                FILE SIZE
                --------------------------------------------------
            */

            this.m_iFileSize =
                this.m_oSendFile.size;


            /*
                --------------------------------------------------
                FILE NAME
                --------------------------------------------------
            */

            this.m_sNameFile =
                this.m_oSendFile.name;


            /*
                Для локального файла браузер
                не дає повний filesystem path.
            */

            this.m_sPathFile =
                "";


            console.log(
                "FileCopy: send file opened."
            );


            console.log(
                "FileCopy: NameFile =",
                this.m_sNameFile
            );


            console.log(
                "FileCopy: FileSize =",
                this.m_iFileSize
            );


            return true;
        }
        catch(error)
        {
            console.error(
                "FileCopy: open send file error:",
                error
            );


            this.m_oSendFile =
                null;


            this.m_iFileSize =
                0;


            this.showError(
                "Cannot open selected file."
            );


            return false;
        }
    }


    /*
    --------------------------------------------------
    SEND FILE
    --------------------------------------------------

    _iPos:
        позиція, з якої потрібно читати файл.

    Читає 256 * 1024 байт.

    a_baFileData:
        Uint8Array з прочитаними даними.

    a_iFileRead:
        кількість реально прочитаних байт.
    --------------------------------------------------
    */

    async sendFile(
        _sFilePath
        , _iPos
    )
    {
        if(
            !this.m_oSendFile
        )
        {
            console.error(
                "FileCopy: send file is not opened."
            );

            return false;
        }


        if(
            !this.m_bCopying
        )
        {
            console.log(
                "FileCopy: send cancelled."
            );

            return false;
        }


        if(
            !Number.isInteger(_iPos) ||
            _iPos < 0
        )
        {
            console.error(
                "FileCopy: invalid send position.",
                _iPos
            );

            return false;
        }


        /*
            --------------------------------------------------
            FILE ALREADY COMPLETE
            --------------------------------------------------
        */

        if(
            _iPos >=
            this.m_iFileSize
        )
        {
            await this.stop();


            showMessage(
                0,
                "File sent successfully."
            );


            return true;
        }


        /*
            --------------------------------------------------
            CALCULATE READ SIZE
            --------------------------------------------------
        */

        const iRemain =
            this.m_iFileSize -
            _iPos;


        const iReadSize =
            Math.min(
                this.m_iSendChunkSize,
                iRemain
            );


        /*
            --------------------------------------------------
            READ FILE
            --------------------------------------------------
        */

        try
        {
            const t0 = performance.now();

            const oBlob =
                this.m_oSendFile.slice(
                    _iPos,
                    _iPos +
                    iReadSize
                );

            const t1 = performance.now();


            const aBuffer =
                await oBlob.arrayBuffer();

            const t2 = performance.now();


            const a_baFileData =
                new Uint8Array(
                    aBuffer
                );

            const t3 = performance.now();


            const a_iFileRead =
                a_baFileData.length;


            /*
                --------------------------------------------------
                CHECK READ
                --------------------------------------------------
            */

            if(
                a_iFileRead <= 0
            )
            {
                console.error(
                    "FileCopy: file read returned zero bytes."
                );


                await this.stop();


                return false;
            }


            /*
                --------------------------------------------------
                SAVE READ STATE
                --------------------------------------------------
            */

            this.m_iFileRead =
                a_iFileRead;


            this.m_iTimeCopying =
                0;


            // console.log(
            //     "FileCopy: file chunk read.",
            //     "position =",
            //     _iPos,
            //     "read =",
            //     a_iFileRead,
            //     "file size =",
            //     this.m_iFileSize
            // );


            /*
                --------------------------------------------------
                PROTOCOL CHECK
                --------------------------------------------------
            */

            if(
                typeof Protocol ===
                "undefined" ||
                typeof Protocol.fSendFile !==
                "function"
            )
            {
                console.error(
                    "FileCopy: Protocol.fSendFile() is not available."
                );


                await this.closeTransferFile();


                return false;
            }


            if(
                typeof AppState ===
                "undefined" ||
                !AppState.sMyId ||
                !AppState.sDeskId
            )
            {
                console.error(
                    "FileCopy: client IDs are not available."
                );


                await this.closeTransferFile();


                return false;
            }


            if(
                typeof wsClient ===
                "undefined" ||
                !wsClient ||
                typeof wsClient.send !==
                "function"
            )
            {
                console.error(
                    "FileCopy: WebSocket is not available."
                );


                await this.closeTransferFile();


                return false;
            }
            

            /*
                --------------------------------------------------
                FILE PATH ON SERVER
                --------------------------------------------------
            */

            const sFilePath =
                _sFilePath;


            /*
                --------------------------------------------------
                CREATE PACKET
                --------------------------------------------------
            */

            const packet =
                Protocol.fSendFile(
                    AppState.sDeskId,                    
                    AppState.sMyId,
                    sFilePath,
                    this.m_iFileSize,
                    _iPos,
                    a_baFileData
                );

            
            const t4 = performance.now();


            if(!packet)
            {
                console.error(
                    "FileCopy: failed to create fSendFile packet."
                );


                await this.closeTransferFile();


                return false;
            }


            /*
                --------------------------------------------------
                SEND PACKET
                --------------------------------------------------
            */

            const result =
                wsClient.send(
                    packet
                );


            if(result === false)
            {
                console.error(
                    "FileCopy: failed to send fSendFile packet."
                );


                await this.closeTransferFile();


                return false;
            }

            const t5 = performance.now();

            // console.log(
            //     "SEND:",
            //     "slice",
            //     (t1 - t0).toFixed(2),

            //     "read",
            //     (t2 - t1).toFixed(2),

            //     "Uint8",
            //     (t3 - t2).toFixed(2),

            //     "packet",
            //     (t4 - t3).toFixed(2),

            //     "send",
            //     (t5 - t4).toFixed(2),

            //     "totall",
            //     (t5 - t0).toFixed(2)
            // );

            /*
                --------------------------------------------------
                CURRENT POSITION
                --------------------------------------------------
            */

            const iCurrent =
                _iPos +
                a_iFileRead;


            /*
                --------------------------------------------------
                PROGRESS
                --------------------------------------------------
            */

            const percent =
                this.m_iFileSize > 0
                    ?
                    (
                        iCurrent *
                        100
                    ) /
                    this.m_iFileSize
                    :
                    100;


            this.setProgress(
                percent
            );


            // console.log(
            //     "FileCopy: fSendFile sent.",
            //     "position =",
            //     _iPos,
            //     "read =",
            //     a_iFileRead,
            //     "current =",
            //     iCurrent,
            //     "size =",
            //     this.m_iFileSize,
            //     "percent =",
            //     percent
            // );


            /*
                --------------------------------------------------
                FILE COMPLETE
                --------------------------------------------------
            */

            if(
                _iPos +
                a_iFileRead >=
                this.m_iFileSize
            )
            {
                await this.stop();
                



                showMessage(
                    0,
                    "File sent successfully."
                );
            }


            return true;
        }
        catch(error)
        {
            console.error(
                "FileCopy: send file read error:",
                error
            );


            await this.closeTransferFile();


            return false;
        }
    }


     /*
    --------------------------------------------------
    CLOSE SEND FILE
    --------------------------------------------------
    */

    async closeSendFile()
    {
        // console.log(
        //     "FileCopy: closing send file..."
        // );


        this.m_oSendFile =
            null;


        this.m_oSendFileHandle =
            null;


        this.m_iFileSize =
            0;


        this.m_iFileRead =
            0;


        this.m_bCopying =
            false;


        this.m_sCopyType =
            "";


        this.m_iTimeCopying =
            0;

        console.log(
            "FileCopy: send file closed."
        );


        return true;
    }



    /*
    --------------------------------------------------
    SEND GET FILE REQUEST
    --------------------------------------------------

    sPath:
        повний шлях до файла

    iPosition:
        позиція читання
    --------------------------------------------------
    */

    sendGetFileRequest(
        sPath,
        iPosition
    )
    {
        if(
            !sPath ||
            sPath.length === 0
        )
        {
            console.error(
                "FileCopy: file path is empty."
            );

            return false;
        }


        if(
            !Number.isInteger(iPosition) ||
            iPosition < 0
        )
        {
            console.error(
                "FileCopy: invalid file position.",
                iPosition
            );

            return false;
        }


        if(
            typeof Protocol ===
            "undefined" ||
            typeof Protocol.fGetFile !==
            "function"
        )
        {
            console.error(
                "FileCopy: Protocol.fGetFile() is not available."
            );

            return false;
        }


        if(
            typeof AppState ===
            "undefined" ||
            !AppState.sDeskId ||
            !AppState.sMyId
        )
        {
            console.error(
                "FileCopy: client IDs are not available."
            );

            return false;
        }


        if(
            typeof wsClient ===
            "undefined" ||
            !wsClient ||
            typeof wsClient.send !==
            "function"
        )
        {
            console.error(
                "FileCopy: WebSocket is not available."
            );

            return false;
        }

        /*
            --------------------------------------------------
            CREATE PACKET
            --------------------------------------------------
        */

        const packet =
            Protocol.fGetFile(
                AppState.sDeskId,
                AppState.sMyId,
                sPath,
                iPosition
            );


        if(!packet)
        {
            console.error(
                "FileCopy: failed to create fGetFile packet."
            );

            return false;
        }

        /*
            --------------------------------------------------
            SEND
            --------------------------------------------------
        */

        const result =
            wsClient.send(
                packet
            );


        if(result === false)
        {
            console.error(
                "FileCopy: failed to send fGetFile."
            );

            return false;
        }        


        // console.log(
        //     "FileCopy: fGetFile sent.",
        //     "path =",
        //     sPath,
        //     "position =",
        //     iPosition
        // );


        return true;
    }


    /*
    --------------------------------------------------
    RECEIVE:
    SELECT SAVE FILE
    --------------------------------------------------
    */

    async selectReceiveFile()
    {
        if(
            !window.showSaveFilePicker
        )
        {
            this.showError(
                "File System Access API is not supported by this browser."
            );

            return false;
        }


        try
        {
            /*
                --------------------------------------------------
                SAVE AS
                --------------------------------------------------

                Для suggestedName використовуємо
                m_sNameFile.
            */

            this.m_oReceiveFileHandle =
                await window.showSaveFilePicker(
                {
                    suggestedName:
                        this.m_sNameFile
                });


            /*
                --------------------------------------------------
                HANDLE SAVED
                --------------------------------------------------
            */

            console.log(
                "FileCopy: Save picker OK."
            );


            console.log(
                "FileCopy: local save file name =",
                this.m_oReceiveFileHandle.name
            );


            return true;
        }
        catch(error)
        {
            if(
                error &&
                error.name ===
                    "AbortError"
            )
            {
                console.log(
                    "FileCopy: Save picker cancelled."
                );

                return false;
            }


            console.error(
                "FileCopy: Save picker error:",
                error
            );


            this.showError(
                "Unable to select the destination file."
            );


            return false;
        }
    }


    /*
    --------------------------------------------------
    OPEN RECEIVE FILE
    --------------------------------------------------

    Створює writable stream для
    вибраного локального файла.

    Поки що дані не записуються.
    --------------------------------------------------
    */

    async openReceiveFile()
    {
        if(
            !this.m_oReceiveFileHandle
        )
        {
            this.showError(
                "Destination file is not selected."
            );

            return false;
        }


        /*
            Якщо файл вже відкритий —
            повторно не відкриваємо.
        */

        if(
            this.m_oReceiveWritable
        )
        {
            return true;
        }


        try
        {
            console.log(
                "FileCopy: opening receive file..."
            );


            this.m_oReceiveWritable =
                await this.m_oReceiveFileHandle.createWritable();


            console.log(
                "FileCopy: receive file opened."
            );


            return true;
        }
        catch(error)
        {
            console.error(
                "FileCopy: open receive file error:",
                error
            );


            this.m_oReceiveWritable =
                null;


            this.showError(
                "Cannot open file for writing."
            );


            return false;
        }
    }


    /*
    --------------------------------------------------
    WRITE RECEIVE FILE
    --------------------------------------------------

    iPosition:
        позиція запису у файлі.

    baData:
        Uint8Array з бінарними даними.
    --------------------------------------------------
    */

    async writeReceiveFile(
        {
            sFilePath,
            iFileSize,
            iPosition,
            baData
        }
    )
    {
        if(
            !this.m_oReceiveWritable
        )
        {
            console.error(
                "FileCopy: receive file is not opened."
            );

            return false;
        }


        const t2 = performance.now();

        let data =
            baData;


        if(
            data instanceof ArrayBuffer
        )
        {
            data =
                new Uint8Array(
                    data
                );
        }


        if(
            !(data instanceof Uint8Array)
        )
        {
            console.error(
                "FileCopy: invalid binary data."
            );

            return false;
        }


        this.m_iTimeCopying =
            0;


        if(
            sFilePath ===
            "stopCopy"
        )
        {
            await this.stop();
        }
        else
        {
            /*
                --------------------------------------------------
                WRITE
                --------------------------------------------------

                Записуємо chunk безпосередньо
                у вказану позицію.
            */

            const t3 = performance.now();

            try
            {
                await this.m_oReceiveWritable.write(
                    {
                        type:
                            "write",

                        position:
                            iPosition,

                        data:
                            data
                    }
                );
            }
            catch(error)
            {
                console.error(
                    "FileCopy: write receive file error:",
                    error
                );


                return false;
            }

            this.m_iFileSize = iFileSize;

            const t4 = performance.now();

            const iReceived =
                iPosition +
                data.length;


            const t5 = performance.now();

            // console.log(
            //     "WRITE:",

            //     "data",
            //     (t3 - t2).toFixed(2),

            //     "write",
            //     (t4 - t3).toFixed(2),

            //     "packet",
            //     (t5 - t4).toFixed(2),

            //     "totall",
            //     (t5 - t2).toFixed(2)
            // );    


            const percent =
                iFileSize > 0
                    ?
                    (
                        iReceived *
                        100
                    ) /
                    iFileSize
                    :
                    100;


            this.setProgress(
                percent
            );

             if(
                iReceived <
                iFileSize &&
                this.m_bCopying
            )
            {
                this.sendGetFileRequest(
                    sFilePath,
                    iReceived
                );
            }
            else
            {
                if(
                    this.m_bCopying
                )
                {
                    await this.stop();


                    showMessage(
                        0,
                        "File received successfully."
                    );
                }
                else
                {
                    console.log(
                        "FileCopy: writeReceiveFile Fin. Writing STOPED"
                    );
                }
            }
        }

        return true;
    }


    /*
    --------------------------------------------------
    CLOSE RECEIVE FILE
    --------------------------------------------------

    Закриває writable stream
    та звільняє ресурс.
    --------------------------------------------------
    */

    async closeTransferFile()
    {
         if(
            this.m_sCopyType ===
            "send"
        )
        {
            await this.closeSendFile();
        }
        else
        if(
            this.m_sCopyType ===
            "receive"
        )
        {
            await this.closeReceiveFile();
        }

        return true;

    }

    async closeReceiveFile()
    {
        if(
            !this.m_oReceiveWritable
        )
        {
            return true;
        }


        try
        {
            // console.log(
            //     "FileCopy: closing receive file..."
            // );


            await this.m_oReceiveWritable.close();


            // console.log(
            //     "FileCopy: receive file closed."
            // );


            this.m_oReceiveWritable =
                null;


            this.m_oReceiveFileHandle =
                null;


            this.m_bCopying =
                false;


            this.m_sCopyType =
                "";


            this.m_iTimeCopying =
                0;


            return true;
        }
        catch(error)
        {
            console.error(
                "FileCopy: close receive file error:",
                error
            );


            /*
                Навіть після помилки
                прибираємо посилання,
                щоб ресурс більше
                не використовувався.
            */

            this.m_oReceiveWritable =
                null;


            return false;
        }
    }


    /*
    --------------------------------------------------
    STOP
    --------------------------------------------------
    */

    async stop()
    {
        /*
            --------------------------------------------------
            SEND
            --------------------------------------------------
        */

        if(
            this.m_sCopyType ===
            "send"
        )
        {
            this.finishTransferTimer(
                "SEND"
            );

            const packet =
                Protocol.fSendFile(
                    AppState.sDeskId,                    
                    AppState.sMyId,
                    "stopCopy",
                    this.m_iFileSize,
                    10,
                    "STOP"
                );

            if(packet)
            {
                wsClient.send(
                        packet
                    );
            }
          
            await this.closeTransferFile();
        }


        /*
            --------------------------------------------------
            RECEIVE
            --------------------------------------------------
        */

        if(
            this.m_sCopyType ===
            "receive"
        )
        {
            this.finishTransferTimer(
                "RECEIVE"
            );

            this.sendGetFileRequest(
                "stopCopy",
                10
            );

            await this.closeTransferFile();
        }


        this.m_bCopying =
            false;

        this.m_sCopyType =
            "";


        const normal =
            document.getElementById(
                "fileCopyNormal"
            );


        const progress =
            document.getElementById(
                "fileCopyProgressControls"
            );


        if(normal)
        {
            normal.style.display =
                "block";
        }


        if(progress)
        {
            progress.style.display =
                "none";
        }
    }


    /*
    --------------------------------------------------
    CLOSE
    --------------------------------------------------
    */

    async close()
    {
        await this.closeTransferFile();


        const window =
            document.getElementById(
                "fileCopyWindow"
            );


        if(window)
        {
            window.remove();
        }


        this.m_bVisible =
            false;

        this.m_bCopying =
            false;

        this.m_sCopyType =
            "";


        this.m_sPathFile =
            "";

        this.m_sNameFile =
            "";


        this.m_oReceiveFileHandle =
            null;


        this.m_oReceiveWritable =
            null;


        this.m_oSendFileHandle =
            null;


        this.m_oSendFile =
            null;


        this.m_iFileSize =
            0;


        this.m_iFileRead =
            0;

    }


    /*
    --------------------------------------------------
    PROGRESS
    --------------------------------------------------
    */

    setProgress(
        value
    )
    {
        let percent =
            Number(
                value
            );


        if(
            !Number.isFinite(percent)
        )
        {
            percent =
                0;
        }


        if(percent < 0)
        {
            percent =
                0;
        }


        if(percent > 100)
        {
            percent =
                100;
        }


        const progress =
            document.getElementById(
                "fileCopyProgress"
            );


        if(progress)
        {
            progress.value =
                percent;
        }

        const progressPercent =
            document.getElementById(
                "fileCopyProgressPercent"
            );

        if(progressPercent)
        {
            progressPercent.textContent =
                percent.toFixed(1) + "%";
        }
    }


    /*
    --------------------------------------------------
    ERROR
    --------------------------------------------------
    */

    showError(
        sMessage
    )
    {
        /*
            Використовуємо існуюче
            повідомлення app.js.
        */

        if(
            typeof showMessage ===
            "function"
        )
        {
            showMessage(
                0,
                sMessage
            );

            return;
        }


        alert(
            sMessage
        );
    }

    /*
    --------------------------------------------------
    TRANSFER START
    --------------------------------------------------
    */

    startTransferTimer()
    {
        this.m_iTransferStartTime =
            performance.now();

        this.m_iTransferEndTime =
            0;

        this.m_iTransferElapsedTime =
            0;


        console.log(
            "FileCopy: transfer started.",
            "time =",
            new Date().toLocaleTimeString()
        );
    }

    /*
    --------------------------------------------------
    TRANSFER FINISH
    --------------------------------------------------
    */

    finishTransferTimer(
        sType
    )
    {
        if(
            this.m_iTransferStartTime <= 0
        )
        {
            console.warn(
                "FileCopy: transfer start time is not set."
            );

            return;
        }


        this.m_iTransferEndTime =
            performance.now();


        this.m_iTransferElapsedTime =
            this.m_iTransferEndTime -
            this.m_iTransferStartTime;


        const iSeconds =
            this.m_iTransferElapsedTime /
            1000;


        const iFileSizeMB =
            this.m_iFileSize /
            (1024 * 1024);


        const iSpeedMB =
            iSeconds > 0
                ?
                iFileSizeMB / iSeconds
                :
                0;


        console.log(
            "========================================"
        );


        console.log(
            "FileCopy: TRANSFER FINISHED"
        );


        console.log(
            "type =",
            sType
        );


        console.log(
            "file =",
            this.m_sNameFile
        );


        console.log(
            "size =",
            this.m_iFileSize,
            "bytes"
        );


        console.log(
            "start =",
            this.m_iTransferStartTime.toFixed(2),
            "ms"
        );


        console.log(
            "end =",
            this.m_iTransferEndTime.toFixed(2),
            "ms"
        );


        console.log(
            "elapsed =",
            this.m_iTransferElapsedTime.toFixed(2),
            "ms"
        );


        console.log(
            "elapsed =",
            iSeconds.toFixed(3),
            "sec"
        );


        console.log(
            "speed =",
            iSpeedMB.toFixed(2),
            "MB/s"
        );


        console.log(
            "========================================"
        );
    }
}


/*
--------------------------------------------------
GLOBAL INSTANCE
--------------------------------------------------
*/

const fileCopy =
    new FileCopy();


/*
--------------------------------------------------
DOM READY
--------------------------------------------------
*/

document.addEventListener(
    "DOMContentLoaded",
    () =>
    {
        fileCopy.init();
    }
);