/*
--------------------------------------------------
File Copy
--------------------------------------------------
*/

class FileCopy
{
    constructor()
    {
        this.m_bVisible = false;
        this.m_bCopying = false;
        this.m_sCopyType = "";

        this.m_oSendFileHandle = null;
        this.m_oReceiveFileHandle = null;
    }


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


        this.m_bVisible = true;
        this.m_bCopying = false;
        this.m_sCopyType = "";

        this.m_oSendFileHandle = null;
        this.m_oReceiveFileHandle = null;


        const overlay =
            document.createElement("div");

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


        const box =
            document.createElement("div");

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


        const title =
            document.createElement("div");

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


        const normal =
            document.createElement("div");

        normal.id =
            "fileCopyNormal";


        const pathLabel =
            document.createElement("div");

        pathLabel.textContent =
            "Add file path with file name";

        pathLabel.style.fontSize =
            "15px";

        pathLabel.style.color =
            "#222222";

        pathLabel.style.marginBottom =
            "8px";


        const path =
            document.createElement("input");

        path.id =
            "fileCopyPath";

        path.type =
            "text";

        path.style.width =
            "100%";

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


        const file =
            document.createElement("input");

        file.id =
            "fileCopyFile";

        file.type =
            "file";

        file.style.display =
            "none";


        /*
            Вибір файла для Send.

            Зберігаємо FileSystemFileHandle,
            а назву показуємо в полі.
        */
        const fileButton =
            document.createElement("button");

        fileButton.textContent =
            "Your file";

        fileButton.style.display =
            "block";

        fileButton.style.margin =
            "12px auto 0";

        fileButton.style.minWidth =
            "120px";

        fileButton.style.height =
            "38px";

        fileButton.style.fontSize =
            "15px";


        fileButton.onclick =
            async () =>
            {
                await this.selectSendFile();
            };


        const buttons =
            document.createElement("div");

        buttons.style.display =
            "flex";

        buttons.style.justifyContent =
            "space-between";

        buttons.style.marginTop =
            "20px";


        const receive =
            document.createElement("button");

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


        const send =
            document.createElement("button");

        send.textContent =
            "Send";

        send.style.minWidth =
            "110px";

        send.style.height =
            "38px";

        send.style.fontSize =
            "15px";


        send.onclick =
            async () =>
            {
                await this.start(
                    "send"
                );
            };


        buttons.appendChild(
            receive
        );

        buttons.appendChild(
            send
        );


        normal.appendChild(
            pathLabel
        );

        normal.appendChild(
            path
        );

        normal.appendChild(
            file
        );

        normal.appendChild(
            fileButton
        );

        normal.appendChild(
            buttons
        );


        const progress =
            document.createElement("div");

        progress.id =
            "fileCopyProgressControls";

        progress.style.display =
            "none";

        progress.style.flexDirection =
            "column";

        progress.style.alignItems =
            "stretch";


        const fileName =
            document.createElement("div");

        fileName.id =
            "fileCopyFileName";

        fileName.style.color =
            "#222222";

        fileName.style.textAlign =
            "center";

        fileName.style.marginBottom =
            "12px";


        const progressBar =
            document.createElement("progress");

        progressBar.id =
            "fileCopyProgress";

        progressBar.value =
            "0";

        progressBar.max =
            "100";

        progressBar.style.width =
            "100%";


        const stop =
            document.createElement("button");

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
            () =>
            {
                this.stop();
            };


        progress.appendChild(
            fileName
        );

        progress.appendChild(
            progressBar
        );

        progress.appendChild(
            stop
        );


        const cancel =
            document.createElement("button");

        cancel.textContent =
            "Cancel";

        cancel.style.display =
            "block";

        cancel.style.margin =
            "20px auto 0";

        cancel.style.minWidth =
            "110px";

        cancel.style.height =
            "38px";

        cancel.style.fontSize =
            "15px";


        cancel.onclick =
            () =>
            {
                this.stop();
                this.close();
            };


        box.appendChild(
            title
        );

        box.appendChild(
            normal
        );

        box.appendChild(
            progress
        );

        box.appendChild(
            cancel
        );


        overlay.appendChild(
            box
        );


        document.body.appendChild(
            overlay
        );
    }


    async selectSendFile()
    {
        /*
            File System Access API.
        */
        if(
            !window.showOpenFilePicker
        )
        {
            this.showError(
                "File System Access API is not supported by this browser."
            );

            return;
        }


        try
        {
            const handles =
                await window.showOpenFilePicker(
                {
                    multiple: false
                });


            if(
                !handles ||
                handles.length === 0
            )
            {
                return;
            }


            this.m_oSendFileHandle =
                handles[0];


            const file =
                await this.m_oSendFileHandle.getFile();


            const path =
                document.getElementById(
                    "fileCopyPath"
                );


            if(path)
            {
                path.value =
                    file.name;
            }
        }
        catch(error)
        {
            /*
                Користувач закрив
                діалог вибору файла.
            */
            if(
                error &&
                error.name ===
                    "AbortError"
            )
            {
                return;
            }


            console.error(
                "File selection error:",
                error
            );


            this.showError(
                "Unable to open the selected file."
            );
        }
    }


    async selectReceiveFile()
    {
        /*
            File System Access API.
            На цьому етапі файл тільки
            вибирається для майбутнього запису.
        */
        if(
            !window.showSaveFilePicker
        )
        {
            this.showError(
                "File System Access API is not supported by this browser."
            );

            return false;
        }


        const path =
            document.getElementById(
                "fileCopyPath"
            );


        let sFileName =
            "";


        if(path)
        {
            sFileName =
                path.value.trim();
        }


        if(
            sFileName.length === 0
        )
        {
            this.showError(
                "Enter file path and file name."
            );

            return false;
        }


        /*
            З повного введеного шляху
            беремо тільки ім'я файла.
        */
        const iSlash1 =
            sFileName.lastIndexOf("/");

        const iSlash2 =
            sFileName.lastIndexOf("\\");

        const iSlash =
            Math.max(
                iSlash1,
                iSlash2
            );

        if(iSlash >= 0)
        {
            sFileName =
                sFileName.substring(
                    iSlash + 1
                );
        }


        if(
            sFileName.length === 0
        )
        {
            this.showError(
                "Invalid file name."
            );

            return false;
        }

        console.log(
            "Save file name:",
            sFileName
        );

        try
        {
            this.m_oReceiveFileHandle =
                await window.showSaveFilePicker(
                {
                    suggestedName:
                        sFileName
                });


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
                return false;
            }


            console.error(
                "File save selection error:",
                error
            );


            this.showError(
                "Unable to select the destination file."
            );


            return false;
        }
    }


    async start(
        sType
    )
    {
        /*
            Receive:
            спочатку отримуємо handle
            файла для майбутнього запису.
        */
        if(
            sType === "receive"
        )
        {
            const bOk =
                await this.selectReceiveFile();


            if(!bOk)
            {
                return;
            }
        }


        /*
            Send:
            перевіряємо вибраний файл
            та ім'я в полі.
        */
        if(
            sType === "send"
        )
        {
            if(
                !this.m_oSendFileHandle
            )
            {
                this.showError(
                    "Select a file first."
                );

                return;
            }


            const path =
                document.getElementById(
                    "fileCopyPath"
                );


            const sFileName =
                path
                    ? path.value.trim()
                    : "";


            if(
                sFileName.length === 0
            )
            {
                this.showError(
                    "Enter file name."
                );

                return;
            }


            const file =
                await this.m_oSendFileHandle.getFile();


            /*
                На цьому етапі перевіряємо,
                що ім'я в полі відповідає
                вибраному файлу.

                Сам файл поки НЕ читаємо.
            */
            if(
                sFileName !== file.name
            )
            {
                this.showError(
                    "The specified file does not exist."
                );

                return;
            }
        }


        this.m_bCopying = true;
        this.m_sCopyType = sType;


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


        normal.style.display =
            "none";

        progress.style.display =
            "flex";


        const path =
            document.getElementById(
                "fileCopyPath"
            );


        if(
            sType === "send" &&
            this.m_oSendFileHandle
        )
        {
            fileName.textContent =
                sFileName;
        }
        else
        {
            fileName.textContent =
                path.value;
        }
    }


    stop()
    {
        this.m_bCopying = false;
        this.m_sCopyType = "";


        const normal =
            document.getElementById(
                "fileCopyNormal"
            );

        const progress =
            document.getElementById(
                "fileCopyProgressControls"
            );


        normal.style.display =
            "block";

        progress.style.display =
            "none";
    }


    close()
    {
        const window =
            document.getElementById(
                "fileCopyWindow"
            );


        if(window)
        {
            window.remove();
        }


        this.m_bVisible = false;
        this.m_bCopying = false;
        this.m_sCopyType = "";

        this.m_oSendFileHandle = null;
        this.m_oReceiveFileHandle = null;
    }


    showError(
        sMessage
    )
    {
        /*
            Тимчасово використовуємо
            стандартний alert.
            Пізніше можемо підключити
            існуючий механізм showMessage().
        */
        alert(
            sMessage
        );
    }
}


const fileCopy =
    new FileCopy();


document.addEventListener(
    "DOMContentLoaded",
    () =>
    {
        fileCopy.init();
    }
);