// protocol.js

const Protocol =
{

    TYPE_LOGIN: 1,


    /*
        Повне значення потрібно взяти
        з MyProtocol::m_sPrefix
    */
    PREFIX: "56Q47TYUAWERSDFGHJK",



    /*
        Аналог:

        MyProtocol::fIdGenerator(
            MyProtocol::m_sPrefix,
            "",
            8,
            10
        );
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
        Аналог:

        MyProtocol::fIdGenerator(
            MyProtocol::m_sPrefix,
            "",
            6,
            8
        );
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
        Перенесення алгоритму
        MyProtocol::fIdGenerator()
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


        /*
            QRandomGenerator::bounded(min, max)
            має верхню межу exclusive.

            Math.random() * (max - min)
        */
        const size =
            Math.floor(
                Math.random() *
                (iMax - iMin)
            ) + iMin;



        for(let i = 0; i < size; i++)
        {

            /*
                В оригінальному C++:

                bounded(_sIn.length()-1)

                тобто останній символ
                фактично не використовується.
            */
            const index =
                Math.floor(
                    Math.random() *
                    (sIn.length - 1)
                );


            /*
                Оригінал:

                if(bounded(...) % 2 == 0)
                    toLower()
                else
                    original
            */
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
                Math.floor(
                    out.length / 4
                );


            const idLength =
                Math.floor(
                    sPref.length / 3
                );


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
        Пакет авторизації.

        Поки передаємо дані як UTF-8 JSON
        всередині binary WebSocket packet.

        Реальний бінарний формат замінимо
        після узгодження структури протоколу.
    */
    createLogin(
        serverPassword,
        login,
        password,
        clientId
    )
    {

        const obj =
        {
            type: "LOGIN",

            serverPassword:
                serverPassword,

            login:
                login,

            password:
                password,

            clientId:
                clientId || ""
        };


        const json =
            JSON.stringify(obj);


        return new TextEncoder()
            .encode(json)
            .buffer;

    }



};