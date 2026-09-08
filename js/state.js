// state.js

/*
    Спільний стан програми.

    Цей об'єкт доступний з усіх JavaScript-файлів,
    які підключені після state.js.

    Основне правило:
    - parserdata.js записує сюди дані, отримані від сервера;
    - app.js використовує ці дані для формування наступних запитів;
    - websocket.js може читати той самий стан під час роботи з'єднання.
*/

const AppState =
{
    /*
        Унікальний ID клієнта.

        Перший LOGIN відправляється з порожнім ID.
        Після отримання NEW_ID parserdata.js записує
        сюди ID, який надіслав сервер.
    */
    serverIP: ""
    , serverConnected: false
    , serverConnectTime: 0
    , serverConnecting: false
    , sMyId: ""

    , sDeskId: ""
    , sDeskLogin: ""
    , sDeskPassword: ""
    , iDeskConnectStatus: 0
    , iDeskConnectTime: 0
    , iTimeDeskActive: 0
    , bTimeDeskNoActiveShow: false

    
    , bStream: true
    , sStreamNewUrl: ""
    , sWithoutStream: "WITHOUT_STREAM"
    , m_iTimeForWatcher: 0
    , bRunStream: false
    , bStreamError: false    
    , sWebRTCPort: "8889"

    , iClipboardTimeCopy: 5

    , isValidIPv4(ip) {
        const parts = ip.trim().split(".");

        if (parts.length !== 4) {
            return false;
        }

        return parts.every(part => {
            if (!/^\d+$/.test(part)) {
                return false;
            }

            const value = Number(part);

            return value >= 0 && value <= 255;
        });
    },

    isLatinLettersAndDigits(value) {
        return /^[A-Za-z0-9]+$/.test(value);
    }
};
