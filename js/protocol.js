// protocol.js

const Protocol =
{

    TYPE_LOGIN: 0x01,

    PREFIX: "56Q47TYUAWERSDFGHJK",


    /*
        Генерація логіну.
    */

    generateLogin()
    {
        return this.fIdGenerator(
            this.PREFIX,
            "",
            8,
            10
        );
    },


    /*
        Генерація пароля.
    */

    generatePassword()
    {
        return this.fIdGenerator(
            this.PREFIX,
            "",
            6,
            8
        );
    },


    /*
        Аналог MyProtocol::fIdGenerator()
    */

    fIdGenerator(sIn, sPref, iMin, iMax)
    {
        let out = "";


        if(iMin === 0)
            iMin = 8;


        if(iMin <= iMax)
            iMax = iMin + 1;


        if(sIn.length < 4)
            sIn = "1234567890";


        const size =
            Math.floor(
                Math.random() *
                (iMax - iMin)
            ) + iMin;


        for(let i = 0; i < size; i++)
        {
            const index =
                Math.floor(
                    Math.random() *
                    (sIn.length - 1)
                );


            const lower =
                Math.floor(
                    Math.random() * 2
                ) === 0;


            let ch =
                sIn.charAt(index);


            if(lower)
                ch = ch.toLowerCase();


            out += ch;
        }


        if(sPref.length > 6)
        {
            const userLength =
                Math.floor(out.length / 4);


            const idLength =
                Math.floor(sPref.length / 3);


            let temp = "";


            temp +=
                out.substring(
                    0,
                    userLength
                );


            temp +=
                sPref.substring(
                    0,
                    idLength
                );


            temp +=
                out.substring(
                    userLength,
                    2 * userLength
                );


            temp +=
                sPref.substring(
                    idLength,
                    2 * idLength
                );


            temp +=
                out.substring(
                    2 * userLength,
                    3 * userLength
                );


            temp +=
                sPref.substring(
                    2 * idLength,
                    out.length - 2 * idLength
                );


            temp +=
                out.substring(
                    3 * userLength
                );


            out = temp;
        }


        return out;
    },


    /*
        CRC.

        Аналог:

        MyProtocol::fGetCRC()

        Сума всіх байтів modulo 256.
    */

    getCRC(data, size)
    {
        if(size > data.length)
            return 0;


        let crc = 0;


        for(let i = 0; i < size; i++)
        {
            crc =
                (crc + data[i]) & 0xFF;
        }


        return crc;
    },


    /*
        Формування пакета:

        MyProtocol::fSendUserLoginPassword()
    */

    createLogin(
        login,
        password,
        sMyId,
        key,
        serverPassword
    )
    {

        // log(
        //     "createLogin 0: " +
        //     "login: " + password +
        //     "password: " + password +
        //     "sMyId: " + sMyId +
        //     "key: " + key +
        //     "serverPassword: " + serverPassword
        // );

        login = ("WebClient_" + login);

        const encoder =
            new TextEncoder();


        const loginBytes =
            encoder.encode(login);


        const passwordBytes =
            encoder.encode(password);


        const idBytes =
            encoder.encode(sMyId || "");


        const keyBytes =
            encoder.encode(key || "");


        const serverPasswordBytes =
            encoder.encode(
                serverPassword
            );


        /*
            Повний розмір:

            FF
            01

            login size + login
            password size + password
            id size + id
            key size + key
            server password size + server password

            CRC
        */

        const totalSize =
            2 +

            1 + loginBytes.length +
            1 + passwordBytes.length +
            1 + idBytes.length +
            1 + keyBytes.length +
            1 + serverPasswordBytes.length +

            1;


        const packet =
            new Uint8Array(
                totalSize
            );


        let offset = 0;


        /*
            FF
        */

        packet[offset++] =
            0xFF;


        /*
            TYPE
        */

        packet[offset++] =
            0x01;


        /*
            LOGIN
        */

        packet[offset++] =
            loginBytes.length;

        packet.set(
            loginBytes,
            offset
        );

        offset +=
            loginBytes.length;


        /*
            PASSWORD
        */

        packet[offset++] =
            passwordBytes.length;

        packet.set(
            passwordBytes,
            offset
        );

        offset +=
            passwordBytes.length;


        /*
            CLIENT ID
        */

        packet[offset++] =
            idBytes.length;

        packet.set(
            idBytes,
            offset
        );

        offset +=
            idBytes.length;


        /*
            KEY
        */

        packet[offset++] =
            keyBytes.length;

        packet.set(
            keyBytes,
            offset
        );

        offset +=
            keyBytes.length;


        /*
            SERVER PASSWORD
        */

        packet[offset++] =
            serverPasswordBytes.length;

        packet.set(
            serverPasswordBytes,
            offset
        );

        offset +=
            serverPasswordBytes.length;


        /*
            CRC.

            У C++:

            fGetCRC(
                a_baRequest.mid(1),
                a_baRequest.size() - 1
            )

            Тобто FF НЕ входить у CRC.

            CRC записуємо останнім байтом.
        */

        packet[offset] =
            this.getCRC(
                packet.subarray(1, offset),
                offset - 1
            );


        return packet.buffer;
    },

    createSearchDesktop(
        userId,
        desktopLogin
    )
    {
        const encoder =
            new TextEncoder();


        /*
            C++:

            QByteArray a_baRequest;
            a_baRequest.append(0xFF);
            a_baRequest.append(0x09);
        */

        const userIdText =
            userId === undefined ||
            userId === null
                ? ""
                : String(userId);


        const desktopLoginText =
            desktopLogin === undefined ||
            desktopLogin === null
                ? ""
                : String(desktopLogin);


        const userIdBytes =
            encoder.encode(
                userIdText
            );


        const desktopLoginBytes =
            encoder.encode(
                desktopLoginText
            );


        /*
            C++:

            unsigned int a_iSz =
                a_baTemp.length();

            a_baSz.append(
                (a_iSz >> 24) & 0xFF
            );
            a_baSz.append(
                (a_iSz >> 16) & 0xFF
            );
            a_baSz.append(
                (a_iSz >> 8) & 0xFF
            );
            a_baSz.append(
                (a_iSz >> 0) & 0xFF
            );

            a_baRequest.append(
                a_baSz.at(3)
            );
        */

        const userIdSize =
            userIdBytes.length & 0xFF;


        const desktopLoginSize =
            desktopLoginBytes.length & 0xFF;


        /*
            Повний пакет:

            FF
            09

            1 byte + userId
            1 byte + desktopLogin

            CRC
        */

        const totalSize =
            2 +
            1 + userIdBytes.length +
            1 + desktopLoginBytes.length +
            1;


        const packet =
            new Uint8Array(
                totalSize
            );


        let offset = 0;


        /*
            FF
        */

        packet[offset++] =
            0xFF;


        /*
            TYPE = 09
        */

        packet[offset++] =
            0x09;


        /*
            USER ID SIZE

            C++ використовує тільки
            молодший байт розміру.
        */

        packet[offset++] =
            userIdSize;


        /*
            USER ID
        */

        packet.set(
            userIdBytes,
            offset
        );

        offset +=
            userIdBytes.length;


        /*
            DESKTOP LOGIN SIZE
        */

        packet[offset++] =
            desktopLoginSize;


        /*
            DESKTOP LOGIN
        */

        packet.set(
            desktopLoginBytes,
            offset
        );

        offset +=
            desktopLoginBytes.length;


        /*
            CRC

            C++:

            fGetCRC(
                a_baRequest.mid(1),
                a_baRequest.size() - 1
            )

            Тобто:

            FF НЕ входить у CRC.
        */

        packet[offset] =
            Protocol.getCRC(
                packet.subarray(1, offset),
                offset - 1
            );


        return packet.buffer;
    },

    createConnectToDesktop(
        login,
        password,
        id,
        stream
    )
    {
        const encoder =
            new TextEncoder();

        const loginBytes =
            encoder.encode(
                login === undefined ||
                login === null
                    ? ""
                    : String(login)
            );

        const passwordBytes =
            encoder.encode(
                password === undefined ||
                password === null
                    ? ""
                    : String(password)
            );

        const idBytes =
            encoder.encode(
                id === undefined ||
                id === null
                    ? ""
                    : String(id)
            );


        /*
            C++:

            FF
            02
        */

        const totalSize =
            2 +
            1 + loginBytes.length +
            1 + passwordBytes.length +
            1 + idBytes.length +
            1 +
            1 +
            1;       // CRC


        const packet =
            new Uint8Array(
                totalSize
            );


        let offset = 0;


        /*
            Header
        */

        packet[offset++] =
            0xFF;

        packet[offset++] =
            0x02;


        /*
            Login
        */

        packet[offset++] =
            loginBytes.length & 0xFF;

        packet.set(
            loginBytes,
            offset
        );

        offset +=
            loginBytes.length;


        /*
            Password
        */

        packet[offset++] =
            passwordBytes.length & 0xFF;

        packet.set(
            passwordBytes,
            offset
        );

        offset +=
            passwordBytes.length;


        /*
            Desktop ID
        */

        packet[offset++] =
            idBytes.length & 0xFF;

        packet.set(
            idBytes,
            offset
        );

        offset +=
            idBytes.length;


        /*
            C++:

            a_baRequest.append(0x01);
        */

        packet[offset++] =
            0x01;


        /*
            C++:

            if(_bStream)
                a_baRequest.append(0x01);
            else
                a_baRequest.append(0x00);
        */

        packet[offset++] =
            stream
                ? 0x01
                : 0x00;


        /*
            CRC.

            FF не входить у CRC.
        */

        packet[offset] =
            Protocol.getCRC(
                packet.subarray(1, offset),
                offset - 1
            );


        return packet.buffer;
    },

    fWatcher(
        forId,
        fromId
    )
    {
        const encoder =
            new TextEncoder();


        const forIdBytes =
            encoder.encode(
                forId === undefined ||
                forId === null
                    ? ""
                    : String(forId)
            );


        const fromIdBytes =
            encoder.encode(
                fromId === undefined ||
                fromId === null
                    ? ""
                    : String(fromId)
            );


        /*
            C++:

            FF
            11
        */

        const totalSize =
            2 +
            1 + forIdBytes.length +
            1 + fromIdBytes.length +
            1;       // CRC


        const packet =
            new Uint8Array(
                totalSize
            );


        let offset = 0;


        /*
            Header
        */

        packet[offset++] =
            0xFF;

        packet[offset++] =
            0x11;


        /*
            For ID
        */

        packet[offset++] =
            forIdBytes.length & 0xFF;

        packet.set(
            forIdBytes,
            offset
        );

        offset +=
            forIdBytes.length;


        /*
            From ID
        */

        packet[offset++] =
            fromIdBytes.length & 0xFF;

        packet.set(
            fromIdBytes,
            offset
        );

        offset +=
            fromIdBytes.length;


        /*
            CRC.

            FF не входить у CRC.
        */

        packet[offset] =
            Protocol.getCRC(
                packet.subarray(1, offset),
                offset - 1
            );


        return packet.buffer;
    },

    fGetActiveClient(userId)
    {
        const encoder =
            new TextEncoder();


        const userIdBytes =
            encoder.encode(
                userId === undefined ||
                userId === null
                    ? ""
                    : String(userId)
            );


        /*
            C++:

            FF
            08
        */

        const totalSize =
            2 +
            1 + userIdBytes.length +
            1;       // CRC


        const packet =
            new Uint8Array(
                totalSize
            );


        let offset = 0;


        /*
            Header
        */

        packet[offset++] =
            0xFF;

        packet[offset++] =
            0x08;


        /*
            User ID

            C++:

            unsigned int a_iSz =
                a_baTemp.length();

            a_baSz.append(...4 bytes...);

            a_baRequest.append(a_baSz.at(3));

            Тобто фактично передається
            тільки молодший байт розміру.
        */

        packet[offset++] =
            userIdBytes.length & 0xFF;


        packet.set(
            userIdBytes,
            offset
        );


        offset +=
            userIdBytes.length;


        /*
            CRC.

            FF не входить у CRC.
        */

        packet[offset] =
            Protocol.getCRC(
                packet.subarray(1, offset),
                offset - 1
            );


        return packet.buffer;
    },
    
    fSendKeyEvents(
        userId,
        desktopId,
        variable,
        key,
        keyboardLayout,
        data
    )
    {
        const encoder = new TextEncoder();

        const userIdBytes = encoder.encode(
            userId === undefined || userId === null
                ? ""
                : String(userId)
        );

        const desktopIdBytes = encoder.encode(
            desktopId === undefined || desktopId === null
                ? ""
                : String(desktopId)
        );

        const dataBytes = encoder.encode(
            data === undefined || data === null
                ? ""
                : String(data)
        );

        if (
            userIdBytes.length > 255 ||
            desktopIdBytes.length > 255 ||
            dataBytes.length > 255
        )
        {
            return null;
        }

        const totalSize =
            2 +
            1 + userIdBytes.length +
            1 + desktopIdBytes.length +
            1 +
            1 +
            4 +
            4 +
            1 + dataBytes.length +
            1;

        const packet = new Uint8Array(totalSize);
        let offset = 0;

        packet[offset++] = 0xFF;
        packet[offset++] = 0x06;

        packet[offset++] = userIdBytes.length & 0xFF;
        packet.set(userIdBytes, offset);
        offset += userIdBytes.length;

        packet[offset++] = desktopIdBytes.length & 0xFF;
        packet.set(desktopIdBytes, offset);
        offset += desktopIdBytes.length;

        // C++: a_iSz = 9; a_baRequest.append(a_baSz.at(3));
        packet[offset++] = 0x09;

        // C++ sends only the low byte of _iVar here.
        packet[offset++] = Number(variable) & 0xFF;

        this.writeUint32BE(packet, offset, Number(key) >>> 0);
        offset += 4;

        this.writeUint32BE(
            packet,
            offset,
            Number(keyboardLayout) >>> 0
        );
        offset += 4;

        // C++ appends a_baSz.at(3): only the low byte of the UTF-8 size.
        packet[offset++] = dataBytes.length & 0xFF;
        packet.set(dataBytes, offset);
        offset += dataBytes.length;

        // FF is excluded from CRC, exactly as in the C++ implementation.
        packet[offset] = this.getCRC(
            packet.subarray(1, offset),
            offset - 1
        );

        return packet.buffer;
    },

    writeUint32BE(buffer, offset, value)
    {
        buffer[offset]     = (value >>> 24) & 0xFF;
        buffer[offset + 1] = (value >>> 16) & 0xFF;
        buffer[offset + 2] = (value >>> 8) & 0xFF;
        buffer[offset + 3] = value & 0xFF;
    },

    createMouseEvents(
        userId,
        desktopId,
        eventType,
        buttonLeftRight,
        pressRelease,
        x,
        y
    )
    {
        const encoder =
            new TextEncoder();


        /*
            User ID
        */

        const userIdBytes =
            encoder.encode(
                userId === undefined ||
                userId === null
                    ? ""
                    : String(userId)
            );


        /*
            Desktop ID
        */

        const desktopIdBytes =
            encoder.encode(
                desktopId === undefined ||
                desktopId === null
                    ? ""
                    : String(desktopId)
            );


        /*
            C++:

            FF
            05
        */


        /*
            Розмір:

            FF              1
            05              1

            userId size     1
            userId           N

            desktopId size  1
            desktopId        N

            07              1

            eventType       1
            button          1
            pressRelease    1

            X               2
            Y               2

            CRC             1
        */

        const totalSize =
            2 +
            1 + userIdBytes.length +
            1 + desktopIdBytes.length +
            1 +
            1 +
            1 +
            1 +
            2 +
            2 +
            1;


        const packet =
            new Uint8Array(
                totalSize
            );


        let offset = 0;


        /*
            Header
        */

        packet[offset++] =
            0xFF;

        packet[offset++] =
            0x05;


        /*
            User ID
        */

        packet[offset++] =
            userIdBytes.length & 0xFF;

        packet.set(
            userIdBytes,
            offset
        );

        offset +=
            userIdBytes.length;


        /*
            Desktop ID
        */

        packet[offset++] =
            desktopIdBytes.length & 0xFF;

        packet.set(
            desktopIdBytes,
            offset
        );

        offset +=
            desktopIdBytes.length;


        /*
            Size = 7
        */

        packet[offset++] =
            0x07;


        /*
            Event type

            1 - button down
            2 - button up
            3 - mouse move
            4 - wheel
        */

        packet[offset++] =
            eventType & 0xFF;


        /*
            Left / Right

            true  -> 0x01
            false -> 0x00
        */

        if (buttonLeftRight)
        {
            packet[offset++] =
                0x01;
        }
        else
        {
            packet[offset++] =
                0x00;
        }


        /*
            Press / Release

            true  -> 0x01
            false -> 0x00
        */

        if (pressRelease)
        {
            packet[offset++] =
                0x01;
        }
        else
        {
            packet[offset++] =
                0x00;
        }


        /*
            X

            Big Endian, 2 bytes
        */

        packet[offset++] =
            (x >> 8) & 0xFF;

        packet[offset++] =
            x & 0xFF;


        /*
            Y

            Big Endian, 2 bytes
        */

        packet[offset++] =
            (y >> 8) & 0xFF;

        packet[offset++] =
            y & 0xFF;


        /*
            CRC

            FF не входить у CRC.
        */

        packet[offset] =
            Protocol.getCRC(
                packet.subarray(1, offset),
                offset - 1
            );


        return packet.buffer;
    },

    fSendClipboard(
        desktopId,
        variable,
        data
    )
    {
        const encoder =
            new TextEncoder();


            const desktopIdBytes =
            encoder.encode(
                desktopId === undefined ||
                desktopId === null
                    ? ""
                    : String(desktopId)
            );

        /*
            _bData у C++ має тип QByteArray.

            Тому data вже повинен бути
            масивом байтів і НЕ повинен
            додатково кодуватися через TextEncoder.
        */
        let dataBytes;

        if(data === undefined || data === null)
        {
            dataBytes =
                new Uint8Array(0);
        }
        else if(data instanceof Uint8Array)
        {
            dataBytes =
                data;
        }
        else if(data instanceof ArrayBuffer)
        {
            dataBytes =
                new Uint8Array(data);
        }
        else if(ArrayBuffer.isView(data))
        {
            dataBytes =
                new Uint8Array(
                    data.buffer,
                    data.byteOffset,
                    data.byteLength
                );
        }
        else
        {
            return null;
        }


        /*
            C++ використовує тільки
            молодший байт розміру.

            Максимальний розмір
            одного поля = 255 байт.
        */
        if(
            desktopIdBytes.length > 255 ||
            dataBytes.length > 255
        )
        {
            return null;
        }


        /*
            Повний розмір:

            FF                  1
            0B                  1

            desktopId size      1
            desktopId           N

            variable size       1
            variable            1

            data size           1
            data                N

            CRC                 1
        */
        const totalSize =
            2 +
            1 + desktopIdBytes.length +
            1 +
            1 +
            1 + dataBytes.length +
            1;


        const packet =
            new Uint8Array(
                totalSize
            );


        let offset = 0;


        /*
            Header
        */

        packet[offset++] =
            0xFF;

        packet[offset++] =
            0x0B;


        /*
            Desktop ID
        */

        packet[offset++] =
            desktopIdBytes.length & 0xFF;

        packet.set(
            desktopIdBytes,
            offset
        );

        offset +=
            desktopIdBytes.length;


        /*
            Variable size

            Завжди 1 байт.
        */

        packet[offset++] =
            0x01;


        /*
            Variable
        */

        packet[offset++] =
            Number(variable) & 0xFF;


        /*
            Data size
        */

        packet[offset++] =
            dataBytes.length & 0xFF;


        /*
            Data

            ВАЖЛИВО:
            data вже є масивом байтів.
            Ніякого TextEncoder тут немає.
        */

        packet.set(
            dataBytes,
            offset
        );

        offset +=
            dataBytes.length;


        /*
            CRC

            FF НЕ входить у CRC.
        */

        packet[offset] =
            this.getCRC(
                packet.subarray(1, offset),
                offset - 1
            );


        return packet.buffer;
    },

    fGetFile(
        sForId,
        sFromId,
        sFilePath,
        iPos
    )
    {
        // console.log("Protocol:fGetFile 0: "
        //     , sFilePath );

        const encoder =
            new TextEncoder();


        /*
            --------------------------------------------------
            ENCODE DATA
            --------------------------------------------------
        */

        const forIdBytes =
            encoder.encode(
                sForId || ""
            );


        const fromIdBytes =
            encoder.encode(
                sFromId || ""
            );


        const filePathBytes =
            encoder.encode(
                sFilePath || ""
            );


        /*
            --------------------------------------------------
            FULL SIZE
            --------------------------------------------------

            FF
            0C

            ForId size + ForId
            FromId size + FromId
            FilePath size + FilePath

            Position size + Position

            CRC
        */

        const totalSize =
            2 +

            1 + forIdBytes.length +
            1 + fromIdBytes.length +
            1 + filePathBytes.length +

            1 + 4 +

            1;


        const packet =
            new Uint8Array(
                totalSize
            );


        let offset =
            0;


        /*
            --------------------------------------------------
            FF
            --------------------------------------------------
        */

        packet[offset++] =
            0xFF;


        /*
            --------------------------------------------------
            TYPE
            --------------------------------------------------
        */

        packet[offset++] =
            0x0C;


        /*
            --------------------------------------------------
            FOR ID
            --------------------------------------------------
        */

        packet[offset++] =
            forIdBytes.length & 0xFF;


        packet.set(
            forIdBytes,
            offset
        );


        offset +=
            forIdBytes.length;


        /*
            --------------------------------------------------
            FROM ID
            --------------------------------------------------
        */

        packet[offset++] =
            fromIdBytes.length & 0xFF;


        packet.set(
            fromIdBytes,
            offset
        );


        offset +=
            fromIdBytes.length;


        /*
            --------------------------------------------------
            FILE PATH
            --------------------------------------------------
        */

        packet[offset++] =
            filePathBytes.length & 0xFF;


        packet.set(
            filePathBytes,
            offset
        );


        offset +=
            filePathBytes.length;


        /*
            --------------------------------------------------
            POSITION
            --------------------------------------------------

            C++:

                a_baRequest.append(0x04);
                a_baRequest.append(a_baSz);

            Position = 4 bytes, Big Endian.
        */

        packet[offset++] =
            0x04;


        packet[offset++] =
            (iPos >>> 24) & 0xFF;


        packet[offset++] =
            (iPos >>> 16) & 0xFF;


        packet[offset++] =
            (iPos >>> 8) & 0xFF;


        packet[offset++] =
            iPos & 0xFF;


        /*
            --------------------------------------------------
            CRC
            --------------------------------------------------

            C++:

                fGetCRC(
                    a_baRequest.mid(1),
                    a_baRequest.size() - 1
                )

            FF НЕ входить у CRC.
        */

        packet[offset] =
            this.getCRC(
                packet.subarray(
                    1,
                    offset
                ),
                offset - 1
            );


        return packet.buffer;
    },

    /*
    --------------------------------------------------
    SEND FILE
    --------------------------------------------------

    sForId:
        ID отримувача

    sFromId:
        ID відправника

    sFilePath:
        шлях файла

    iFileSize:
        повний розмір файла

    iPos:
        позиція chunk у файлі

    baData:
        дані chunk
    --------------------------------------------------
    */

    fSendFile(
        sForId,
        sFromId,    
        sFilePath,
        iFileSize,
        iPos,
        baData
    )
    {
        // console.log(
        //     "Protocol:fSendFile 0: ",
        //     sFilePath,
        //     "position =",
        //     iPos,
        //     "fileSize =",
        //     iFileSize,
        //     "dataSize =",
        //     baData
        //         ? baData.length
        //         : 0
        // );


        const encoder =
            new TextEncoder();


        /*
            --------------------------------------------------
            ENCODE DATA
            --------------------------------------------------
        */

        const forIdBytes =
            encoder.encode(
                sForId || ""
            );


        const fromIdBytes =
            encoder.encode(
                sFromId || ""
            );


        const filePathBytes =
            encoder.encode(
                sFilePath || ""
            );


        /*
            --------------------------------------------------
            FILE DATA
            --------------------------------------------------
        */

        let fileDataBytes =
            baData;


        if(
            fileDataBytes instanceof ArrayBuffer
        )
        {
            fileDataBytes =
                new Uint8Array(
                    fileDataBytes
                );
        }


        if(
            !(fileDataBytes instanceof Uint8Array)
        )
        {
            fileDataBytes =
                new Uint8Array(
                    0
                );
        }


        /*
            --------------------------------------------------
            DATA SIZE
            --------------------------------------------------
        */

        const dataSize =
            fileDataBytes.length;


        /*
            --------------------------------------------------
            FULL SIZE
            --------------------------------------------------

            FF
            0D

            ForId size + ForId
            FromId size + FromId
            FilePath size + FilePath

            FileSize size + FileSize
            Position size + Position

            Data size + Data

            CRC
        */

        const totalSize =
            2 +

            1 + forIdBytes.length +
            1 + fromIdBytes.length +
            1 + filePathBytes.length +

            1 + 4 +

            1 + 4 +

            4 + dataSize +

            1;


        const packet =
            new Uint8Array(
                totalSize
            );


        let offset =
            0;


        /*
            --------------------------------------------------
            FF
            --------------------------------------------------
        */

        packet[offset++] =
            0xFF;


        /*
            --------------------------------------------------
            TYPE
            --------------------------------------------------
        */

        packet[offset++] =
            0x0D;


        /*
            --------------------------------------------------
            FOR ID
            --------------------------------------------------
        */

        packet[offset++] =
            forIdBytes.length & 0xFF;


        packet.set(
            forIdBytes,
            offset
        );


        offset +=
            forIdBytes.length;


        /*
            --------------------------------------------------
            FROM ID
            --------------------------------------------------
        */

        packet[offset++] =
            fromIdBytes.length & 0xFF;


        packet.set(
            fromIdBytes,
            offset
        );


        offset +=
            fromIdBytes.length;


        /*
            --------------------------------------------------
            FILE PATH
            --------------------------------------------------
        */

        packet[offset++] =
            filePathBytes.length & 0xFF;


        packet.set(
            filePathBytes,
            offset
        );


        offset +=
            filePathBytes.length;


        /*
            --------------------------------------------------
            FILE SIZE
            --------------------------------------------------

            C++:

                a_iSz = _iFileSize;

                a_baRequest.append(0x04);
                a_baRequest.append(a_baSz);

            4 bytes, Big Endian.
        */

        packet[offset++] =
            0x04;


        packet[offset++] =
            (iFileSize >>> 24) & 0xFF;


        packet[offset++] =
            (iFileSize >>> 16) & 0xFF;


        packet[offset++] =
            (iFileSize >>> 8) & 0xFF;


        packet[offset++] =
            iFileSize & 0xFF;


        /*
            --------------------------------------------------
            POSITION
            --------------------------------------------------

            C++:

                a_iSz = _iPos;

                a_baRequest.append(0x04);
                a_baRequest.append(a_baSz);

            Position = 4 bytes, Big Endian.
        */

        packet[offset++] =
            0x04;


        packet[offset++] =
            (iPos >>> 24) & 0xFF;


        packet[offset++] =
            (iPos >>> 16) & 0xFF;


        packet[offset++] =
            (iPos >>> 8) & 0xFF;


        packet[offset++] =
            iPos & 0xFF;


        /*
            --------------------------------------------------
            DATA SIZE
            --------------------------------------------------

            C++:

                a_iSz = _baData.length();

                a_baRequest.append(a_baSz);
                a_baRequest.append(_baData);

            Data size = 4 bytes, Big Endian.
        */

        packet[offset++] =
            (dataSize >>> 24) & 0xFF;


        packet[offset++] =
            (dataSize >>> 16) & 0xFF;


        packet[offset++] =
            (dataSize >>> 8) & 0xFF;


        packet[offset++] =
            dataSize & 0xFF;


        /*
            --------------------------------------------------
            DATA
            --------------------------------------------------
        */

        packet.set(
            fileDataBytes,
            offset
        );


        offset +=
            dataSize;


        /*
            --------------------------------------------------
            CRC
            --------------------------------------------------

            C++:

                fGetCRC(
                    a_baRequest.mid(1),
                    a_baRequest.size() - 1
                )

            FF НЕ входить у CRC.
        */

        packet[offset] =
            this.getCRC(
                packet.subarray(
                    1,
                    offset
                ),
                offset - 1
            );


        /*
            --------------------------------------------------
            RESULT
            --------------------------------------------------
        */

        return packet.buffer;
    },

    createCommandLineRequest(
        forId,
        fromId,
        command,
        variable
    )
    {
        const encoder =
            new TextEncoder();


        const forIdBytes =
            encoder.encode(
                forId === undefined ||
                forId === null
                    ? ""
                    : String(forId)
            );


        const fromIdBytes =
            encoder.encode(
                fromId === undefined ||
                fromId === null
                    ? ""
                    : String(fromId)
            );


        const commandBytes =
            encoder.encode(
                command === undefined ||
                command === null
                    ? ""
                    : String(command)
            );


        /*
            C++:

            FF
            0E
        */


        const totalSize =
            2 +

            1 + forIdBytes.length +
            1 + fromIdBytes.length +
            1 + commandBytes.length +

            1 +             // 0x01
            1 +             // variable

            1;              // CRC


        const packet =
            new Uint8Array(
                totalSize
            );


        let offset = 0;


        /*
            Header
        */

        packet[offset++] =
            0xFF;

        packet[offset++] =
            0x0E;


        /*
            FOR ID
        */

        packet[offset++] =
            forIdBytes.length & 0xFF;

        packet.set(
            forIdBytes,
            offset
        );

        offset +=
            forIdBytes.length;


        /*
            FROM ID
        */

        packet[offset++] =
            fromIdBytes.length & 0xFF;

        packet.set(
            fromIdBytes,
            offset
        );

        offset +=
            fromIdBytes.length;


        /*
            COMMAND
        */

        packet[offset++] =
            commandBytes.length & 0xFF;

        packet.set(
            commandBytes,
            offset
        );

        offset +=
            commandBytes.length;


        /*
            C++:

            a_iSz = _iVar;

            a_baRequest.append(0x01);
            a_baRequest.append(a_baSz.at(3));
        */

        packet[offset++] =
            0x01;

        packet[offset++] =
            Number(variable) & 0xFF;


        /*
            CRC

            C++:

            fGetCRC(
                a_baRequest.mid(1),
                a_baRequest.size() - 1
            )

            FF не входить у CRC.
        */

        packet[offset] =
            Protocol.getCRC(
                packet.subarray(1, offset),
                offset - 1
            );


        return packet.buffer;
    }

};