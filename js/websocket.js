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

        // Новий callback для відправлених даних
        this.onSend = null;
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

            if(this.onData)
            {
                this.onData(
                    event.data
                );
            }

        };

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