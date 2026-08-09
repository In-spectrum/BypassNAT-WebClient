// parserdata.js

const ParserData =
{

    /*
        Буфер вхідних binary даних.
    */

    buffer: new Uint8Array(0),


    /*
        Callback для виводу діагностичних повідомлень.
        app.js підключає сюди функцію log().
    */

    onLog: null,


    log(text)
    {
        if(this.onLog)
        {
            this.onLog(text);
        }
    },


    /*
        Отримання даних від WebSocket.
    */

    parse(data)
    {
        let bytes;


        if(data instanceof ArrayBuffer)
        {
            bytes =
                new Uint8Array(data);
        }
        else
        if(data instanceof Uint8Array)
        {
            bytes =
                data;
        }
        else
        {
            return [];
        }


        /*
            Додаємо дані до буфера.
        */

        this.append(bytes);


        /*
            Аналог fNextStep().
        */

        return this.nextStep();
    },


    /*
        Додавання binary data
        до внутрішнього буфера.
    */

    append(bytes)
    {        
        const buffer =
            new Uint8Array(
                this.buffer.length +
                bytes.length
            );


        buffer.set(
            this.buffer,
            0
        );


        buffer.set(
            bytes,
            this.buffer.length
        );


        this.buffer =
            buffer;
    },


    /*
        Аналог:

        ParserSocketData::fNextStep()
    */

    nextStep()
    {
        const result = [];


        /*
            Шукаємо FF.
        */

        let startPos =
            this.findByte(
                this.buffer,
                0xFF
            );


        /*
            FF не знайдений.
        */

        if(startPos < 0)
        {
            this.buffer =
                new Uint8Array(0);

            return result;
        }


        /*
            Видаляємо дані перед FF.
        */

        if(startPos > 0)
        {
            this.buffer =
                this.buffer.slice(
                    startPos
                );
        }


        let pos = 0;
        let prevPos = 1;


        while(
            pos !== prevPos &&
            pos < this.buffer.length
        )
        {
            prevPos = pos;


            /*
                Аналог:

                _baIn.mid(
                    a_iPos,
                    _baIn.length() - a_iPos
                )
            */

            let data =
                this.buffer.slice(
                    pos
                );


            /*
                Знову шукаємо FF.
            */

            startPos =
                this.findByte(
                    data,
                    0xFF
                );


            if(startPos < 0)
            {
                this.buffer =
                    new Uint8Array(0);

                return result;
            }


            if(startPos > 0)
            {
                data =
                    data.slice(
                        startPos
                    );
            }


            /*
                Потрібно мінімум:

                FF
                TYPE
            */

            if(data.length < 2)
                break;


            if(data[0] === 0xFF)
            {
                switch(data[1])
                {

                    /*
                        New ID
                    */

                    case 0x07:
                    {
                        const packet =
                            this.parseNewId(
                                data
                            );


                        /*
                            null означає,
                            що весь пакет ще
                            не отриманий.
                        */

                        if(packet === null)
                            break;


                        /*
                            Аналог:

                            a_iPos += fNewId(...)
                        */

                        if(packet.size <= 0)
                            break;


                        pos +=
                            packet.size;


                        result.push(
                            packet
                        );


                        break;
                    }


                    /*
                        Невідомий тип.

                        Як і у C++ версії,
                        нічого не робимо.
                    */

                    default:
                        break;
                }
            }
        }


        /*
            Зберігаємо невикористані
            дані для наступного WebSocket
            повідомлення.
        */

        if(pos < this.buffer.length)
        {
            this.buffer =
                this.buffer.slice(
                    pos
                );
        }
        else
        {
            this.buffer =
                new Uint8Array(0);
        }


        return result;
    },


    /*
        Аналог:

        ParserSocketData::fNewId()
    */

    parseNewId(data)
    {
        /*
            Вхідні дані функції.
            Аналог Qt:

            qDebug() << data.toHex(':');
        */

        this.log(
            "ParserData::parseNewId: вхідні дані HEX: " +
            this.toHex(data)
        );


        /*
            C++:

            if(_baIn.length() < 4)
                return 0;
        */

        if(data.length < 4)
        {
            this.log(
                "ParserData::parseNewId: недостатньо даних для заголовка."
            );

            return null;
        }


        let pos = 2;


        /*
            a_iData_1 =
                _baIn.at(2)

            Розмір ID.
        */

        const idLength =
            data[pos];

        pos++;


        /*
            Перевірка.
        */

        if(
            data.length <
            2 +
            idLength +
            1 +
            1
        )
        {
            return null;
        }


        /*
            ID.
        */

        const idBytes =
            data.slice(
                pos,
                pos + idLength
            );


        const clientId =
            this.decodeUtf8(
                idBytes
            );


        pos +=
            idLength;


        /*
            Розмір DEV.
        */

        const devLength =
            data[pos];

        pos++;


        /*
            Перевірка повного DEV.
        */

        if(
            data.length <
            2 +
            idLength +
            devLength +
            2
        )
        {
            return null;
        }


        /*
            DEV data.
        */

        const devData =
            data.slice(
                pos,
                pos + devLength
            );


        pos +=
            devLength;


        /*
            CRC.
        */

        if(pos >= data.length)
            return null;


        const receivedCRC =
            data[pos];


        /*
            CRC.
        */

        const calculatedCRC =
            this.getCRC(
                data.slice(
                    1,
                    pos
                )
            );


        const validCRC =
            calculatedCRC ===
            receivedCRC;


        if(!validCRC)
        {
            this.log(
                "ParserData::parseNewId: CRC ПОМИЛКА. " +
                "отримано=" + receivedCRC +
                ", розраховано=" + calculatedCRC
            );

            return {

                size: 0,

                type: 0x07,

                name: "NEW_ID",

                validCRC: false

            };
        }


        let devVariant = 0;


        if(devData.length > 0)
        {
            devVariant =
                devData[0];
        }


        let newClientId =
            clientId;


        if(newClientId.length === 0)
        {
            newClientId = "0";
        }


        /*
            Зберігаємо ID сервера у спільному стані.

            Від цього моменту всі наступні LOGIN
            використовуватимуть саме цей ID.
        */
        AppState.clientId =
            newClientId;


        this.log(
            "ParserData::parseNewId: пакет NEW_ID успішно розібрано. " +
            "ID=" + newClientId +
            ", DEV=" + devVariant +
            ", size=" + (pos + 1)
        );


        this.log(
            "ParserData: AppState.clientId = " +
            AppState.clientId
        );


        return {

            size:
                pos + 1,

            type:
                0x07,

            name:
                "NEW_ID",

            validCRC:
                true,

            clientId:
                newClientId,

            devVariant:
                devVariant,

            receivedCRC:
                receivedCRC,

            calculatedCRC:
                calculatedCRC,

            reconnect:
                devVariant === 1 ||
                devVariant === 2

        };
    },


    /*
        CRC:

        проста сума байтів
        modulo 256.

        Аналог fGetCRC().
    */

    getCRC(bytes)
    {
        let crc = 0;


        for(
            let i = 0;
            i < bytes.length;
            i++
        )
        {
            crc =
                (
                    crc +
                    bytes[i]
                ) & 0xFF;
        }


        return crc;
    },


    /*
        UTF-8 -> JavaScript String.
    */

    decodeUtf8(bytes)
    {
        try
        {
            return new TextDecoder(
                "utf-8"
            ).decode(bytes);
        }
        catch(e)
        {
            return "";
        }
    },


    toHex(bytes)
    {
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
    },


    /*
        Пошук байта.
    */

    findByte(bytes, value)
    {
        for(
            let i = 0;
            i < bytes.length;
            i++
        )
        {
            if(bytes[i] === value)
                return i;
        }


        return -1;
    }

};