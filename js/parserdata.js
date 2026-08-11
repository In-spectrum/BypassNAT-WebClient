// parserdata.js

const ParserData =
{
    /*
        Callback для передачі події
        у WebSocketClient.
    */
    slControl: null,


    /*
        Буфер вхідних binary даних.
    */

    buffer: new Uint8Array(0),


    /*
        Callback для виводу діагностичних повідомлень.
        app.js підключає сюди функцію log().
    */

    onLog: null,

    sgControl(
        sId,
        iVar,
        sData,
        baIn
    )
    {
        //log("ParserData.sgControl 0:");

        if(ParserData.slControl)
        {
            //log("ParserData.slControl 1:");

            ParserData.slControl(
                sId,
                iVar,
                sData,
                baIn
            );
        }
    },


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

                    case 0x0A:
                    {
                        const packet =
                            this.parseMaybeMyLogin(data);

                        /*
                            null означає,
                            що весь пакет ще
                            не отриманий.
                        */

                        if(packet === null)
                            break;


                        /*
                            Аналог:

                            a_iPos += fGetActiveClient(...)
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
                        Message Status
                    */

                    case 0x10:
                    {
                        const packet =
                            this.parseMessageStatus(
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

                            a_iPos += fMessageStatus(...)
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
        if(data.length < 4)
        {
            return null;
        }

        //this.sgControl("test-0", 1, "test-2", data);


        let pos = 0;

        const data1Length =
            data[2];

        pos++;


        if(
            data.length <
            2 +
            data1Length +
            pos +
            1
        )
        {
            return null;
        }

        const data2Length =
            data[
                3 +
                data1Length +
                pos -
                1
            ];


        pos++;


        /*
            Перевірка повного пакета.
        */

        if(
            data.length <
            2 +
            data1Length +
            data2Length +
            pos +
            1
        )
        {
            return null;
        }


        /*
            CRC.

            Структура:

            FF
            TYPE
            SZ-1
            DATA-1
            SZ-2
            DATA-2
            CRC

            CRC рахується від TYPE
            до останнього байта DATA-2.

            У C++:

            fCRC_isOk(
                _baIn.mid(
                    1,
                    1 +
                    a_iData_1 +
                    a_iData_2 +
                    a_iPlasPos
                ),
                ...
            )

            Важливо:

            QByteArray::mid(start, length)

            у JS:

            slice(start, start + length)

            Тому end у slice()
            повинен містити +1.
        */

        const crcDataLength =
            1 +
            data1Length +
            data2Length +
            pos;


        const crcData =
            data.slice(
                1,
                1 +
                crcDataLength
            );


        const receivedCRC =
            data[
                1 +
                crcDataLength
            ];


        const calculatedCRC =
            this.getCRC(
                crcData,
                crcData.length
            );


        if(
            !this.fCRC_isOk(
                crcData,
                receivedCRC
            )
        )
        {
            this.log(
                "ParserData::parseNewId: CRC ПОМИЛКА. " +
                "отримано=" +
                receivedCRC +
                ", розраховано=" +
                calculatedCRC
            );


            return {

                size:
                    0,

                type:
                    0x07,

                name:
                    "NEW_ID",

                validCRC:
                    false
            };
        }


        pos = 0;


        const idBytes =
            data.slice(
                3,
                3 +
                data1Length
            );


        let clientId =
            this.decodeUtf8(
                idBytes
            );


        pos++;


        const devDataStart =
            3 +
            data1Length +
            pos;


        const devDataEnd =
            3 +
            data1Length +
            data2Length +
            pos;


        const devServerData =
            data.slice(
                devDataStart,
                devDataEnd
            );



        if(clientId.length === 0)
        {
            clientId = "0";
        }
        else
        {
            
            if(devServerData.length > 0)
            {
                const devServer =
                    devServerData[0];


                if(devServer === 1)
                {
                    
                    clientId +=
                        Protocol.fIdGenerator(
                            Protocol.PREFIX,
                            "",
                            16,
                            26
                        );


                    clientId +=
                        String(
                            Date.now()
                        );


                    clientId +=
                        "_uds";


                    /*
                        Зберігаємо новий ID.
                    */

                    AppState.clientId =
                        clientId;

                    //переконнектится к серверу с новым Id
                    this.sgControl("0", 22, "", "");
                }
                else
                if(devServer === 2)
                {
                   //переконнектится к серверу с новым префикс-Id
                    this.sgControl("0", 22, "", "");
                }
            }
        }


        AppState.clientId =
            clientId;


        this.log(
            "ParserData::parseNewId: " +
            "ID=" +
            clientId +
            ", DEV=" +
            (
                devServerData.length > 0
                    ? devServerData[0]
                    : 0
            )
        );


        /*
            C++:

            a_iPlasPos++;

            return
                3 +
                a_iData_1 +
                a_iData_2 +
                a_iPlasPos;
        */

        pos++;


        return {

            size:
                3 +
                data1Length +
                data2Length +
                pos,

            type:
                0x07,

            name:
                "NEW_ID",

            validCRC:
                true,

            clientId:
                clientId,

            devServer:
                devServerData.length > 0
                    ? devServerData[0]
                    : 0,

            devData:
                devServerData,

            data1Length:
                data1Length,

            data2Length:
                data2Length,

            receivedCRC:
                receivedCRC,

            calculatedCRC:
                calculatedCRC,

            reconnect:
                devServerData.length > 0 &&
                (
                    devServerData[0] === 1 ||
                    devServerData[0] === 2
                )
        };
    },


    /*
        Аналог:

        ParserSocketData::fMessageStatus()
    */

    parseMessageStatus(data)
    {
        if(data.length < 4)
        {
            return null;
        }


        let pos = 0;

        const data1Length =
            data[2];

        pos++;

        if(
            data.length <
            2 +
            data1Length +
            pos +
            1
        )
        {
            return null;
        }

        const data2Length =
            data[
                3 +
                data1Length +
                pos -
                1
            ];


        pos++;


        /*
            Перевірка повного пакета.

            Для нашого прикладу:

            2 + 1 + 41 + 2 + 1 = 47

            FF + TYPE + SZ1 + VAR + SZ2 + DATA + CRC
        */

        const packetSize =
            2 +
            data1Length +
            data2Length +
            pos +
            1;


        if(data.length < packetSize)
        {
            return null;
        }


        /*
            CRC.

            Важливий момент:

            crcData має містити:

            TYPE
            SZ-1
            VAR
            SZ-2
            DATA

            Для нашого пакета:

            10 01 D1 29
            44 69 73 63 6F ...
            ... 2E

            Всього 45 байт.

            CRC знаходиться після них.
        */

        const crcDataLength =
            1 +
            data1Length +
            data2Length +
            pos;


        const crcData =
            data.slice(
                1,
                1 +
                crcDataLength
            );


        const receivedCRC =
            data[
                1 +
                crcDataLength
            ];


        const calculatedCRC =
            this.getCRC(
                crcData,
                crcData.length
            );


        if(
            !this.fCRC_isOk(
                crcData,
                receivedCRC
            )
        )
        {
            this.log(
                "ParserData::parseMessageStatus: CRC ПОМИЛКА. " +
                "отримано=" +
                receivedCRC +
                ", розраховано=" +
                calculatedCRC
            );


            return {

                size:
                    0,

                type:
                    0x10,

                name:
                    "MESSAGE_STATUS",

                validCRC:
                    false
            };
        }

        let a_baId;

        pos = 0;

        const variable =
            data[
                3 +
                data1Length +
                pos -
                1
            ];


        pos++;

        const messageDataStart =
            3 +
            data1Length +
            pos;


        const messageDataEnd =
            3 +
            data1Length +
            data2Length +
            pos;


        const messageData =
            data.slice(
                messageDataStart,
                messageDataEnd
            );


        /*
            C++:

            emit sgControl(
                QString::number(a_iVar),
                18,
                a_baData,
                ""
            );

            TODO / SGCONTROL
        */

            this.sgControl(
                String(variable),
                18,
                this.decodeUtf8(messageData),
                messageData
            );
      
        // this.log(
        //     "ParserData::parseMessageStatus: " +
        //     "VAR=0x" +
        //     variable
        //         .toString?.(16)
        //         ?.padStart(2, "0")
        //         ?.toUpperCase() ||
        //     "VAR=" +
        //     variable +
        //     ", DATA=" +
        //     this.toHex(messageData)
        // );


        pos++;


        return {

            size:
                3 +
                data1Length +
                data2Length +
                pos,

            type:
                0x10,

            name:
                "MESSAGE_STATUS",

            validCRC:
                true,

            variable:
                variable,

            data:
                messageData,

            dataText:
                this.decodeUtf8(
                    messageData
                ),

            data1Length:
                data1Length,

            data2Length:
                data2Length,

            receivedCRC:
                receivedCRC,

            calculatedCRC:
                calculatedCRC
        };
    },

    parseMaybeMyLogin(data)
    {
        /*
            Аналог:

            ParserSocketData::fMaybeMyLogin()
        */

        if(data.length < 4)
        {
            return null;
        }


        let pos = 0;


        /*
            SIZE-1

            C++:

            int a_iData_1 =
                static_cast<quint8>(
                    _baIn.at(2)
                );
        */

        const data1Length =
            data[2];


        pos++;


        /*
            Перевіряємо, чи присутній
            перший рядок.
        */

        if(
            data.length <
            2 +
            data1Length +
            pos +
            1
        )
        {
            return null;
        }


        /*
            SIZE-2

            C++:

            _baIn.at(
                3 +
                a_iData_1 +
                a_iPlasPos -
                1
            )
        */

        const data2Length =
            data[
                3 +
                data1Length +
                pos -
                1
            ];


        pos++;


        /*
            Перевірка повного пакета.

            FF
            TYPE
            SIZE-1
            DATA-1
            SIZE-2
            DATA-2
            CRC
        */

        const packetSize =
            2 +
            data1Length +
            data2Length +
            pos +
            1;


        if(
            data.length <
            packetSize
        )
        {
            return null;
        }


        /*
            CRC.

            C++:

            MyProtocol::fCRC_isOk(
                _baIn.mid(
                    1,
                    1 +
                    a_iData_1 +
                    a_iData_2 +
                    a_iPlasPos
                ),
                _baIn.at(
                    1 +
                    a_iData_1 +
                    a_iData_2 +
                    a_iPlasPos +
                    1
                )
            )

            FF у CRC НЕ входить.
        */

        const crcDataLength =
            1 +
            data1Length +
            data2Length +
            pos;


        const crcData =
            data.slice(
                1,
                1 +
                crcDataLength
            );


        const receivedCRC =
            data[
                1 +
                crcDataLength
            ];


        const calculatedCRC =
            this.getCRC(
                crcData,
                crcData.length
            );


        if(
            !this.fCRC_isOk(
                crcData,
                receivedCRC
            )
        )
        {
            this.log(
                "ParserData::parseMaybeMyLogin: CRC ПОМИЛКА. " +
                "отримано=" +
                receivedCRC +
                ", розраховано=" +
                calculatedCRC
            );


            return {
                size: 0,

                type:
                    data[1],

                name:
                    "MAYBE_MY_LOGIN",

                validCRC:
                    false
            };
        }


        /*
            DATA-1

            C++:

            for(
                int i = 3;
                i < 3 + a_iData_1 + a_iPlasPos;
                i++
            )
            {
                a_baDesktopLogin.append(
                    _baIn[i]
                );
            }

            Тут a_iPlasPos == 0.
        */

        pos = 0;


        const desktopLoginStart =
            3;


        const desktopLoginEnd =
            3 +
            data1Length +
            pos;


        const desktopLoginBytes =
            data.slice(
                desktopLoginStart,
                desktopLoginEnd
            );


        /*
            DATA-2

            C++:

            a_iPlasPos++;

            for(
                int i =
                    3 +
                    a_iData_1 +
                    a_iPlasPos;

                i <
                    3 +
                    a_iData_1 +
                    a_iData_2 +
                    a_iPlasPos;

                i++
            )
            {
                a_baDesktopId.append(
                    _baIn[i]
                );
            }
        */

        pos++;


        const desktopIdStart =
            3 +
            data1Length +
            pos;


        const desktopIdEnd =
            3 +
            data1Length +
            data2Length +
            pos;


        const desktopIdBytes =
            data.slice(
                desktopIdStart,
                desktopIdEnd
            );


        const desktopLogin =
            this.decodeUtf8(
                desktopLoginBytes
            );


        const desktopId =
            this.decodeUtf8(
                desktopIdBytes
            );


        /*
            C++:

            emit sgControl(
                QString::fromStdString(
                    a_baDesktopLogin.toStdString()
                ),
                5,
                QString::fromStdString(
                    a_baDesktopId.toStdString()
                ),
                ""
            );
        */

        this.sgControl(
            desktopLogin,
            5,
            desktopId,
            ""
        );


        /*
            C++:

            a_iPlasPos++;

            return
                3 +
                a_iData_1 +
                a_iData_2 +
                a_iPlasPos;
        */

        pos++;


        return {

            size:
                3 +
                data1Length +
                data2Length +
                pos,

            type:
                data[1],

            name:
                "MAYBE_MY_LOGIN",

            validCRC:
                true,

            desktopLogin:
                desktopLogin,

            desktopLoginBytes:
                desktopLoginBytes,

            desktopId:
                desktopId,

            desktopIdBytes:
                desktopIdBytes,

            data1Length:
                data1Length,

            data2Length:
                data2Length,

            receivedCRC:
                receivedCRC,

            calculatedCRC:
                calculatedCRC
        };
    },


    /*
        Аналог:

        bool MyProtocol::fCRC_isOk(
            const QByteArray& data,
            uint8_t _iCRC
        )
    */

    fCRC_isOk(data, crc)
    {
        if(
            this.getCRC(
                data,
                data.length
            ) === crc
        )
        {
            return true;
        }


        return false;
    },


    /*
        Аналог:

        uint8_t MyProtocol::fGetCRC(
            const QByteArray& data,
            int _iSize
        )
    */

    getCRC(data, size)
    {
        let crc = 0;


        /*
            C++:

            if(_iSize > data.size())
                return a_chCRC;
        */

        if(size > data.length)
        {
            return crc;
        }


        /*
            C++:

            quint8 a_chCRC = 0;

            for(int i = 0;
                i < _iSize;
                i++)
            {
                a_chCRC +=
                    static_cast<quint8>(
                        data.at(i)
                    );
            }
        */

        for(
            let i = 0;
            i < size;
            i++
        )
        {
            crc =
                (
                    crc +
                    data[i]
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


    /*
        Перетворення binary data
        у HEX.
    */

    toHex(bytes)
    {
        let hex = "";


        for(
            let i = 0;
            i < bytes.length;
            i++
        )
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