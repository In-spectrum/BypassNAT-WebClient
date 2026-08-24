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
        //this.log("ParserData.sgControl 0: " + iVar);

        if(this.slControl)
        {
            //this.log("ParserData.slControl 1:");

            this.slControl(
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
        //this.log("ParserData::parse 0: ");

        this.log(
                "\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\n\r" +
                "ParserData::parse 0: " +
                this.toHex(data)
            ); 

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

        this.log(
                "ParserData::parse 10: " +
                this.toHex(this.buffer)
            ); 


        /*
            Аналог fNextStep().
        */

        //this.log("ParserData::parse 10: ");

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
        //this.log("ParserData::nextStep 0: ");


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


        //this.log("ParserData::nextStep 1: ");


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
            //console.log("ParserData::nextStep 2.0: ");

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


            //this.log("ParserData::nextStep 3.0: ");


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


            // this.log(
            //     "ParserData::nextStep 4.0: " +
            //     this.toHex(data)
            // );


            if(data[0] === 0xFF)
            {
                switch(data[1])
                {

                    /*
                        Stream Data
                    */

                    case 0x04:
                    {
                        
                        // this.log(
                        //     "ParserData::nextStep 5.4.0: " +
                        //     this.toHex(data)
                        // );


                        const packet =
                            this.parseStreamData(
                                data
                            );

                        // this.log(
                        //     "ParserData::nextStep 5.4.1: " +
                        //     this.toHex(packet)
                        // );


                        /*
                            null означає,
                            що весь пакет ще
                            не отриманий.
                        */

                        if(packet === null)
                            break;


                        /*
                            Аналог:

                            a_iPos +=
                                fSetStreamData(a_baData);
                        */

                        if(packet.size <= 0)
                            break;


                        pos +=
                            packet.size;


                        result.push(
                            packet
                        );
                        
                        // this.log(
                        //     "ParserData::nextStep 5.4.10: " +
                        //     this.toHex(result)
                        // );

                        break;
                    }


                    /*
                        New ID
                    */

                    case 0x07:
                    {
                        // this.log(
                        //     "ParserData::nextStep 5.4.0: " +
                        //     this.toHex(data)
                        // );

                        const packet =
                            this.parseNewId(
                                data
                            );

                        // this.log(
                        //     "ParserData::nextStep 5.7.1: " +
                        //     this.toHex(packet)
                        // );


                        /*
                            null означає,
                            що весь пакет ще
                            не отриманий.
                        */

                        if(packet === null)
                            break;


                        /*
                            Аналог:

                            a_iPos += fNewId(...);
                        */

                        if(packet.size <= 0)
                            break;


                        pos +=
                            packet.size;


                        result.push(
                            packet
                        );

                        // this.log(
                        //     "ParserData::nextStep 5.7.10: " +
                        //     this.toHex(result)
                        // );


                        break;
                    }


                    /*
                        Active Client
                    */

                    case 0x08:
                    {
                        // this.log(
                        //     "ParserData::nextStep 5.8.0: " +
                        //     this.toHex(data)
                        // );


                        const packet =
                            this.parseActiveClient(
                                data
                            );

                        // this.log(
                        //     "ParserData::nextStep 5.8.1: " +
                        //     this.toHex(packet)
                        // );


                        /*
                            null означає,
                            що весь пакет ще
                            не отриманий.
                        */

                        if(packet === null)
                            break;


                        /*
                            Аналог:

                            a_iPos += fGetActiveClient(...);
                        */

                        if(packet.size <= 0)
                            break;


                        pos +=
                            packet.size;


                        result.push(
                            packet
                        );

                        // this.log(
                        //     "ParserData::nextStep 5.8.10: " +
                        //     this.toHex(result)
                        // );

                        break;
                    }


                    /*
                        Maybe My Login
                    */

                    case 0x0A:
                    {

                        // this.log(
                        //     "ParserData::nextStep 5.0A.0: " +
                        //     this.toHex(data)
                        // );

                        const packet =
                            this.parseMaybeMyLogin(
                                data
                            );

                        // this.log(
                        //     "ParserData::nextStep 5.0A.1: " +
                        //     this.toHex(packet)
                        // );

                        /*
                            null означає,
                            що весь пакет ще
                            не отриманий.
                        */

                        if(packet === null)
                            break;


                        /*
                            Аналог:

                            a_iPos += fMaybeMyLogin(...);
                        */

                        if(packet.size <= 0)
                            break;


                        pos +=
                            packet.size;


                        result.push(
                            packet
                        );

                        // this.log(
                        //     "ParserData::nextStep 5.0A.10: " +
                        //     this.toHex(result)
                        // );


                        break;
                    }

                    /*
                        Clipboard Data
                    */
                    case 0x0B:
                    {
                        // this.log(
                        //     "ParserData::nextStep 5.0B.0: " +
                        //     this.toHex(data)
                        // );

                        const packet =
                            this.parseBufferData(
                                data
                            );

                        // this.log(
                        //     "ParserData::nextStep 5.0B.1: " +
                        //     this.toHex(packet)
                        // );


                        /*
                            null означає,
                            що весь пакет ще
                            не отриманий.
                        */

                        if(packet === null)
                            break;


                        if(packet.size <= 0)
                            break;


                        /*
                            Аналог:

                                a_iPos +=
                                    fBufferData(a_baData);
                        */

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
                        // this.log(
                        //     "ParserData::nextStep 5.10.0: " +
                        //     this.toHex(data)
                        // );

                        const packet =
                            this.parseMessageStatus(
                                data
                            );

                        // this.log(
                        //     "ParserData::nextStep 5.10.1: " +
                        //     this.toHex(packet)
                        // );


                        /*
                            null означає,
                            що весь пакет ще
                            не отриманий.
                        */

                        if(packet === null)
                            break;


                        /*
                            Аналог:

                            a_iPos += fMessageStatus(...);
                        */

                        if(packet.size <= 0)
                            break;


                        pos +=
                            packet.size;


                        result.push(
                            packet
                        );

                        // this.log(
                        //     "ParserData::nextStep 5.10.10: " +
                        //     this.toHex(result)
                        // );

                        break;
                    }


                    /*
                        Невідомий тип.

                        Видаляємо поточний пакет
                        і переходимо до наступного FF.
                    */

                    default:
                    {
                        // this.log(
                        //     "ParserData::nextStep 5.default.0: " +
                        //     this.toHex(data)
                        // );

                        this.log(
                            "ParserData::nextStep: unknown TYPE = 0x" +
                            data[1]
                                .toString(16)
                                .padStart(2, "0")
                        );


                        /*
                            Шукаємо наступний FF.

                            Починаємо з data[1],
                            щоб не знайти поточний FF
                            у data[0].
                        */

                        const nextStart =
                            this.findByte(
                                data.slice(1),
                                0xFF
                            );


                        /*
                            Наступного FF немає.

                            Поточний невідомий пакет
                            і всі дані після нього
                            більше не використовуємо.
                        */

                        if(nextStart < 0)
                        {
                            this.log(
                                "ParserData::nextStep: " +
                                "next FF not found"
                            );


                            pos =
                                this.buffer.length;


                            break;
                        }


                        /*
                            nextStart визначений
                            відносно data.slice(1).

                            Тому додаємо 1.
                        */

                        pos +=
                            1 + nextStart;


                        this.log(
                            "ParserData::nextStep: " +
                            "skip unknown packet, " +
                            "next FF at pos = " +
                            pos
                        );


                        break;
                    }
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


        let sMyId =
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



        if(sMyId.length === 0)
        {
            sMyId = "0";
        }
        else
        {
            
            if(devServerData.length > 0)
            {
                const devServer =
                    devServerData[0];


                if(devServer === 1)
                {
                    
                    sMyId +=
                        Protocol.fIdGenerator(
                            Protocol.PREFIX,
                            "",
                            16,
                            26
                        );


                    sMyId +=
                        String(
                            Date.now()
                        );


                    sMyId +=
                        "_uds";


                    /*
                        Зберігаємо новий ID.
                    */
                   

                    //переконнектится к серверу с новым Id
                    this.sgControl("0", 22, sMyId, "");
                }
                else
                if(devServer === 2)
                {
                   //переконнектится к серверу с новым префикс-Id
                    this.sgControl("0", 22, sMyId, "");
                }
            }
        }

        this.sgControl("0", 22, sMyId, "");


        this.log(
            "ParserData::parseNewId: " +
            "ID=" +
            sMyId +
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

            sMyId:
                sMyId,

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

        ParserSocketData::fSetStreamData()
    */

    parseStreamData(data)
    {
        // this.log(
        //     "ParserData::parseStreamData 0: "
        // );

        if(data.length < 4)
        {
            return null;
        }


        let pos = 0;


        /*
            SIZE-1

            Desktop ID
        */

        const data1Length =
            data[2];

        pos++;


        // this.log(
        //     "ParserData::parseStreamData 1: "
        // );

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

            Client ID
        */

        const data2Length =
            data[
                3 +
                data1Length +
                pos -
                1
            ];

        pos++;


        // this.log(
        //     "ParserData::parseStreamData 2: "
        // );

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
            SIZE-3

            URL
        */

        const data3Length =
            data[
                3 +
                data1Length +
                data2Length +
                pos -
                1
            ];

        pos++;


        /*
            Перевірка повного пакета.

            FF
            TYPE
            SZ-1
            DATA-1
            SZ-2
            DATA-2
            SZ-3
            DATA-3
            CRC
        */

        const packetSize =
            2 +
            data1Length +
            data2Length +
            data3Length +
            pos +
            1;

        // this.log(
        //     "ParserData::parseStreamData 3: "
        // );

        if(
            data.length <
            packetSize
        )
        {
            return null;
        }


        /*
            CRC.

            FF у CRC НЕ входить.

            CRC рахується від:

            TYPE
            SZ-1
            DATA-1
            SZ-2
            DATA-2
            SZ-3
            DATA-3
        */

        const crcDataLength =
            1 +
            data1Length +
            data2Length +
            data3Length +
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


        
        // this.log(
        //     "ParserData::parseStreamData 4: "
        // );

        if(
            !this.fCRC_isOk(
                crcData,
                receivedCRC
            )
        )
        {
            this.log(
                "ParserData::parseStreamData: CRC ПОМИЛКА. " +
                "отримано=" +
                receivedCRC +
                ", розраховано=" +
                calculatedCRC
            );


            return {

                size:
                    0,

                type:
                    0x04,

                name:
                    "STREAM_DATA",

                validCRC:
                    false
            };
        }


        /*
            Desktop ID
        */

        pos = 0;


        const desktopIdStart =
            3;


        const desktopIdEnd =
            3 +
            data1Length +
            pos;


        const desktopIdBytes =
            data.slice(
                desktopIdStart,
                desktopIdEnd
            );


        const desktopId =
            this.decodeUtf8(
                desktopIdBytes
            );


        /*
            Client ID
        */

        pos++;


        const sMyIdStart =
            3 +
            data1Length +
            pos;


        const sMyIdEnd =
            3 +
            data1Length +
            data2Length +
            pos;


        const sMyIdBytes =
            data.slice(
                sMyIdStart,
                sMyIdEnd
            );


        const sMyId =
            this.decodeUtf8(
                sMyIdBytes
            );


        /*
            URL
        */

        pos++;


        const urlStart =
            3 +
            data1Length +
            data2Length +
            pos;


        const urlEnd =
            3 +
            data1Length +
            data2Length +
            data3Length +
            pos;


        const urlBytes =
            data.slice(
                urlStart,
                urlEnd
            );


        const url =
            this.decodeUtf8(
                urlBytes
            );


        /*
            C++:

            emit sgControl(
                QString::fromStdString(
                    m_baDeskTopID.toStdString()
                ),
                2,
                QString::fromStdString(
                    a_baUrl.toStdString()
                ),
                ""
            );
        */

        // this.log(
        //     "ParserData::parseStreamData 5: "
        // );

        this.sgControl(
            desktopId,
            2,
            url,
            ""
        );

        // this.log(
        //     "ParserData::parseStreamData 6: "
        // );


        /*
            У C++:

            a_iPlasPos++;

            return
                3 +
                a_iData_1 +
                a_iData_2 +
                a_iData_3 +
                a_iPlasPos;
        */

        pos++;
       

        return {

            size:
                3 +
                data1Length +
                data2Length +
                data3Length +
                pos,

            type:
                0x04,

            name:
                "STREAM_DATA",

            validCRC:
                true,

            desktopId:
                desktopId,

            sMyId:
                sMyId,

            url:
                url,

            desktopIdBytes:
                desktopIdBytes,

            sMyIdBytes:
                sMyIdBytes,

            urlBytes:
                urlBytes,

            data1Length:
                data1Length,

            data2Length:
                data2Length,

            data3Length:
                data3Length,

            receivedCRC:
                receivedCRC,

            calculatedCRC:
                calculatedCRC
        };
    },

    parseActiveClient(data)
    {
        //this.log("ParserData::parseActiveClient 0: ");

        if(data.length < 4)
        {
            return null;
        }


        let pos = 0;


        /*
            SIZE-1

            Client ID
        */

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


        /*
            Перевірка CRC.

            FF у CRC НЕ входить.

            CRC рахується від:

            TYPE
            SZ-1
            DATA-1
        */

        const crcDataLength =
            1 +
            data1Length +
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
                "ParserSocketData::fGetActiveClient: " +
                "CRC ПОМИЛКА. " +
                "отримано=" +
                receivedCRC +
                ", розраховано=" +
                calculatedCRC
            );


            return {

                size:
                    0,

                type:
                    0x04,

                name:
                    "ACTIVE_CLIENT",

                validCRC:
                    false
            };
        }

        //this.log("ParserData::parseActiveClient 5: ");

        /*
            Client ID
        */

        pos = 0;


        const sMyIdStart =
            3;


        const sMyIdEnd =
            3 +
            data1Length +
            pos;


        const sMyIdBytes =
            data.slice(
                sMyIdStart,
                sMyIdEnd
            );


        const sMyId =
            this.decodeUtf8(
                sMyIdBytes
            );


        /*
            C++:

            emit sgControl(
                QString::fromStdString(
                    a_basMyId.toStdString()
                ),
                17,
                "",
                ""
            );
        */

        //this.log("ParserData::parseActiveClient 7: ");

        this.sgControl(
            sMyId,
            17,
            "",
            ""
        );


        /*
            У C++:

            a_iPlasPos++;

            return
                3 +
                a_iData_1 +
                a_iPlasPos;
        */

        pos++;


        return {

            size:
                3 +
                data1Length +
                pos,

            type:
                0x04,

            name:
                "ACTIVE_CLIENT",

            validCRC:
                true,

            sMyId:
                sMyId,

            sMyIdBytes:
                sMyIdBytes,

            data1Length:
                data1Length,

            receivedCRC:
                receivedCRC,

            calculatedCRC:
                calculatedCRC
        };
    },

    parseBufferData(data)
    {
        /*
            --------------------------------------------------
            Аналог:

                ParserSocketData::fBufferData()

            Пакет:

                FF
                0B

                SIZE-1
                DATA-1

                SIZE-2
                DATA-2

                SIZE-3
                DATA-3

                CRC
            --------------------------------------------------
        */


        if(data.length < 4)
            return null;


        let pos = 0;


        /*
            --------------------------------------------------
            SIZE-1

            C++:

                a_iData_1 =
                    static_cast<quint8>(
                        _baIn.at(2)
                    );
            --------------------------------------------------
        */

        const data1Length =
            data[2];


        pos++;


        /*
            Перевірка DATA-1 + SIZE-2
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
            --------------------------------------------------
            SIZE-2
            --------------------------------------------------
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
            --------------------------------------------------
            SIZE-3
            --------------------------------------------------
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


        const data3Length =
            data[
                3 +
                data1Length +
                data2Length +
                pos -
                1
            ];


        pos++;


        /*
            --------------------------------------------------
            Повний розмір пакета
            --------------------------------------------------
        */

        const packetSize =
            2 +
            data1Length +
            data2Length +
            data3Length +
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
            --------------------------------------------------
            CRC

            FF не входить у CRC.
            --------------------------------------------------
        */

        const receivedCRC =
            data[
                packetSize - 1
            ];


        const calculatedCRC =
            this.getCRC(
                data.slice(
                    1,
                    packetSize - 1
                ),
                packetSize - 2
            );


        if(
            calculatedCRC !==
            receivedCRC
        )
        {
            this.log(
                "ParserData.parseBufferData: CRC ERROR"
            );


            return {
                size: packetSize,
                type: 0x0B,
                name: "BUFFER_DATA",
                validCRC: false
            };
        }


        /*
            --------------------------------------------------
            DATA-1 = Desktop ID
            --------------------------------------------------
        */

        pos = 0;


        const desktopIdStart =
            3;


        const desktopIdEnd =
            3 +
            data1Length +
            pos;


        const desktopIdBytes =
            data.slice(
                desktopIdStart,
                desktopIdEnd
            );


        /*
            --------------------------------------------------
            DATA-2 = VAR
            --------------------------------------------------
        */

        pos++;


        const variableStart =
            3 +
            data1Length +
            pos;


        const variableEnd =
            variableStart +
            data2Length;


        const variableBytes =
            data.slice(
                variableStart,
                variableEnd
            );


        /*
            --------------------------------------------------
            DATA-3 = Clipboard data
            --------------------------------------------------
        */

        pos++;


        const bufferDataStart =
            3 +
            data1Length +
            data2Length +
            pos;


        const bufferDataEnd =
            bufferDataStart +
            data3Length;


        const bufferDataBytes =
            data.slice(
                bufferDataStart,
                bufferDataEnd
            );


        /*
            --------------------------------------------------
            Перетворення даних
            --------------------------------------------------
        */

        const desktopId =
            this.decodeUtf8(
                desktopIdBytes
            );


        /*
            VAR у C++ має розмір 1 байт.
        */

        const variable =
            variableBytes.length > 0
                ? variableBytes[0]
                : 0;


        const bufferData =
            this.decodeUtf8(
                bufferDataBytes
            );


        /*
            --------------------------------------------------
            Аналог:

                emit sgControl(
                    QString::number(
                        static_cast<quint8>(
                            a_baVar.at(0)
                        )
                    ),
                    8,
                    QString::fromStdString(
                        a_baData.toStdString()
                    ),
                    ""
                );
            --------------------------------------------------
        */

        this.sgControl(
            String(variable),
            8,
            bufferData,
            ""
        );


        /*
            --------------------------------------------------
            Аналог повернення:

                return
                    3 +
                    a_iData_1 +
                    a_iData_2 +
                    a_iData_3 +
                    a_iPlasPos;
            --------------------------------------------------
        */

        pos++;


        return {
            size:
                packetSize,

            type:
                0x0B,

            name:
                "BUFFER_DATA",

            validCRC:
                true,

            desktopId:
                desktopId,

            variable:
                variable,

            data:
                bufferData,

            dataText:
                bufferData,

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