// websocket.js

class WebSocketClient
{

    constructor()
    {
        this.socket = null;

        this.pendingUrl = null;

        this.onConnected = null;
        this.onDisconnected = null;
        this.onError = null;
        this.onData = null;

        // Логування виконується зовнішнім кодом.
        // У нашому випадку app.js передає сюди функцію log().
        this.onLog = null;

        // Callback для реально відправлених даних.
        this.onSend = null;

        this.slControl = null;

        ParserData.slControl =
        (
            sId,
            iVar,
            sData,
            baIn
        ) =>
        {
            //log("WebSocketClient.ParserData.slControl 0:");

            this.sgControl( sId, iVar, sData, baIn );
        };
    }



    connect(url)
    {
        /*
            Якщо попереднє з'єднання ще існує,
            не створюємо новий WebSocket одразу.

            Запам'ятовуємо адресу та чекаємо
            повного закриття старого з'єднання.
        */

        if(this.socket)
        {
            const state =
                this.socket.readyState;


            if(
                state === WebSocket.OPEN ||
                state === WebSocket.CONNECTING ||
                state === WebSocket.CLOSING
            )
            {
                this.pendingUrl = url;

                this.socket.close();

                return;
            }
        }


        this.createSocket(url);
    }



    createSocket(url)
    {
        this.socket =
            new WebSocket(url);


        /*
            Отримуємо binary data
            від сервера як ArrayBuffer.
        */

        this.socket.binaryType =
            "arraybuffer";



        /*
            Підключення встановлено.
        */

        this.socket.onopen =
        () =>
        {
            /*
                WebSocket працює з тим самим спільним станом,
                що й app.js та parserdata.js.

                На момент нового підключення тут уже буде
                ID, отриманий від сервера під час попередньої
                авторизації.
            */
            // this.log(
            //     "WebSocket: Client ID = " +
            //     (AppState.sMyId || "<порожній>")
            // );


            if(this.onConnected)
            {
                this.onConnected();
            }

        };



        /*
            З'єднання закрито.
        */

        this.socket.onclose =
        (event) =>
        {

            this.socket = null;


            if(this.onDisconnected)
            {
                this.onDisconnected(event);
            }



            /*
                Якщо під час закриття
                було запрошено нове підключення,
                створюємо його тільки після
                повного закриття старого.
            */

            if(this.pendingUrl)
            {
                const newUrl =
                    this.pendingUrl;


                this.pendingUrl =
                    null;


                this.createSocket(
                    newUrl
                );
            }

        };



        /*
            Помилка WebSocket.
        */

        this.socket.onerror =
        (error) =>
        {

            if(this.onError)
            {
                this.onError(error);
            }

        };



        /*
            Отримання даних від сервера.
        */

        this.socket.onmessage =
        (event) =>
        {
            /*
                Усі отримані binary data спочатку
                фіксуємо у вікні логів.

                ParserData отримує саме ті самі
                сирі дані, які прийшли від WebSocket.
            */

            // this.log(
            //     "WebSocket: отримано binary data: " +
            //     WebSocketClient.toHex(event.data)
            // );


            const data =
                ParserData.parse(
                    event.data
                );


            if(this.onData)
            {
                this.onData(data);
            }
        };

    }



    log(text)
    {
        if(this.onLog)
        {
            this.onLog(text);
        }
    }

    sgControl(
        sId,
        iVar,
        sData,
        baIn
    )
    {
        // log(
        //     "WebSocketClient.sgControl: " +
        //     "Id=" + sId +
        //     ", Var=" + iVar +
        //     ", Data=" + sData +
        //     ", baIn=" + toHex(baIn)
        // );

        switch(iVar)
        {
            case 2:
            {
                if(this.slControl)
                {
                    //log("WebSocketClient.sgControl 2: ");
                    this.slControl(sId, 2, sData);
                }
                break;
            }   
            case 5:
            {
                if(this.slControl)
                {
                    //log("WebSocketClient.sgControl 5: ");
                    this.slControl(sId, 5, sData);
                }
                break;
            }    
            case 8:
            {
                if(this.slControl)
                {
                    this.slControl(
                        sId,
                        8,
                        sData
                    );
                }

                break;
            }
            case 15:
            {
                if(this.slControl)
                {
                    //log("WebSocketClient.sgControl 17: ");
                    this.slControl(sId, 11, sData);
                }
                break;
            } 
            case 17:
            {
                if(this.slControl)
                {
                    //log("WebSocketClient.sgControl 17: ");
                    this.slControl(sId, 4, sData);
                }
                break;
            }     
            case 18:
            {
                if(this.slControl)
                {
                    //log("WebSocketClient.sgControl 18: ");
                    this.slControl(sId, 12, sData);
                    //this.slControl("", 4, "");
                }
                break;
            }           
            case 22: //переконнектится к серверу с новым Id
            {
                if(this.slControl)
                {
                    this.slControl(sId, 16, sData);
                }

                break;
            }
        }
    }


    static toHex(data)
    {
        let bytes = null;


        if(data instanceof ArrayBuffer)
        {
            bytes = new Uint8Array(data);
        }
        else
        if(data instanceof Uint8Array)
        {
            bytes = data;
        }
        else
        if(data instanceof Blob)
        {
            return "[Blob]";
        }


        if(bytes === null)
        {
            return "[unknown type]";
        }


        let hex = "";

        for(let i = 0; i < bytes.length; i++)
        {
            if(i > 0)
                hex += " ";

            hex +=
                bytes[i]
                    .toString(16)
                    .padStart(2, "0")
                    .toUpperCase();
        }


        return hex;
    }


    disconnect()
    {
        /*
            Якщо заплановано нове
            підключення — скасовуємо його.
        */

        this.pendingUrl =
            null;


        if(this.socket)
        {
            this.socket.close();
        }
    }



    send(data)
    {
        /*
            Дані можна відправляти
            тільки після OPEN.
        */

        if(
            !this.socket ||
            this.socket.readyState !==
            WebSocket.OPEN
        )
        {
            return false;
        }


        /*
            Реально відправляємо дані.
        */

        this.socket.send(data);


        /*
            Повідомляємо app.js,
            що дані реально були
            передані у WebSocket.
        */

        if(this.onSend)
        {
            this.onSend(data);
        }


        return true;
    }

}