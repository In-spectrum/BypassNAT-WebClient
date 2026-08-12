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
    clientId: ""
    , sDeskId: ""
    , sDeskLogin: ""
    , sStreamNewUrl: ""
    , sWithoutStream: "WITHOUT_STREAM"
    , m_iTimeForWatcher: 0
};
