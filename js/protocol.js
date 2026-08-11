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
        clientId,
        key,
        serverPassword
    )
    {
        const encoder =
            new TextEncoder();


        const loginBytes =
            encoder.encode(login);


        const passwordBytes =
            encoder.encode(password);


        const idBytes =
            encoder.encode(clientId || "");


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
    }

};