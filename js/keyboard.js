// ---------------------------------------------------------
// Keyboard capture


let keyboardCapture = false;

const Keyboard = {

    enabled: false,
    insidePlayer: false,
    initialized: false,

    // Qt::Key values used by the original C++ client.
    QT: {
        Escape: 0x01000000,
        Tab: 0x01000001,
        Backtab: 0x01000002,
        Backspace: 0x01000003,
        Return: 0x01000004,
        Enter: 0x01000005,
        Insert: 0x01000006,
        Delete: 0x01000007,
        Pause: 0x01000008,
        Print: 0x01000009,
        SysReq: 0x0100000A,
        Clear: 0x0100000B,

        Home: 0x01000010,
        End: 0x01000011,
        Left: 0x01000012,
        Up: 0x01000013,
        Right: 0x01000014,
        Down: 0x01000015,
        PageUp: 0x01000016,
        PageDown: 0x01000017,

        Shift: 0x01000020,
        Control: 0x01000021,
        Meta: 0x01000022,
        Alt: 0x01000023,
        CapsLock: 0x01000024,
        NumLock: 0x01000025,
        ScrollLock: 0x01000026,
        Super_L: 0x01000053,
        Super_R: 0x01000054,
        Menu: 0x01000055,

        F1: 0x01000030,
        F2: 0x01000031,
        F3: 0x01000032,
        F4: 0x01000033,
        F5: 0x01000034,
        F6: 0x01000035,
        F7: 0x01000036,
        F8: 0x01000037,
        F9: 0x01000038,
        F10: 0x01000039,
        F11: 0x0100003A,
        F12: 0x0100003B,
        F13: 0x0100003C,
        F14: 0x0100003D,
        F15: 0x0100003E,
        F16: 0x0100003F,
        F17: 0x01000040,
        F18: 0x01000041,
        F19: 0x01000042,
        F20: 0x01000043,
        F21: 0x01000044,
        F22: 0x01000045,
        F23: 0x01000046,
        F24: 0x01000047,

        AltGr: 0x01001103,
        BrowserBack: 0x01000061,
        BrowserForward: 0x01000062,
        Refresh: 0x01000058,
        VolumeDown: 0x01000070,
        VolumeMute: 0x01000071,
        VolumeUp: 0x01000072,
        MediaPlay: 0x01000080,
        MediaStop: 0x01000081,
        MediaPrevious: 0x01000082,
        MediaNext: 0x01000083
    },

    init() {
        if (this.initialized)
            return;

        document.addEventListener("keydown", (event) => this.onKeyDown(event), true);
        document.addEventListener("keyup", (event) => this.onKeyUp(event), true);

        if (typeof playerArea !== "undefined" && playerArea)
        {
            playerArea.addEventListener("mouseenter", () => {
                this.insidePlayer = true;
                this.enabled = true;
                playerArea.focus();
            });

            playerArea.addEventListener("mouseleave", () => {
                this.insidePlayer = false;
                this.enabled = false;
                this.releasePressedKeys();
            });
        }

        window.addEventListener("blur", () => {
            this.releasePressedKeys();
        });

        this.initialized = true;

        if (typeof log === "function")
            log("Keyboard capture initialized");
    },

    async onKeyDown(event) {

        if (!keyboardCapture)
            return;

        const key = this.toQtKey(event);

        if (key === null)
            return;

        const text = this.getText(event);

        log(
                "KEY DOWN:" +
                " key = " + event.key +
                " code = " + event.code +
                " keyCode = " + event.keyCode +
                " text = " + text
            );

        event.preventDefault();

        /*
            Ctrl+V

            Спочатку передаємо clipboard.
        */

        if(
            event.code === "KeyC" &&
            event.ctrlKey &&
            !event.altKey &&
            !event.metaKey
        )
        {
            AppState.iClipboardTimeCopy = 0;            
        }

        if(
            event.code === "KeyV" &&
            event.ctrlKey &&
            !event.altKey &&
            !event.metaKey
        )
        {
            await Clipboard.readAndSend();
        }

        this.sendKeyEvent(
            1,
            key,
            text
        );
    },

    onKeyUp(event) {

        if (!keyboardCapture)
            return;

        const key = this.toQtKey(event);

        if (key === null)
            return;

        const text = this.getText(event);

        log(
                "KEY UP:" +
                " key = " + event.key +
                " code = " + event.code +
                " keyCode = " + event.keyCode +
                " text = " + text
            );

        event.preventDefault();

        this.sendKeyEvent(
            2,
            key,
            text
        );
    },

    sendKeyEvent(variable, key, text) {
        // C++ Control::slSendKeyEvent() stops here when there is no
        // active client/stream connection.
        if (!AppState.serverConnected || !AppState.sDeskId)
            return;

        const packet = Protocol.fSendKeyEvents(
            AppState.sMyId,
            AppState.sDeskId,
            variable,
            key,
            0,          // Browser has no HKL. C++ uses 0 on Linux too.
            text
        );

        if (packet == null)
            return;

        if (!wsClient.send(packet))
            return;

        if (typeof log === "function")
        {
            log(
                "Keyboard " +
                (variable === 1 ? "DOWN" : "UP") +
                " key=" + key +
                (text ? " text=" + text : "")
            );
        }
    },

    getText(event) {
        // KeyboardEvent.key corresponds most closely to QML event.text
        // for printable characters. For non-printable keys it is ignored
        // by the receiver's KeyControler mapping.
        if (typeof event.key !== "string")
            return "";

        if (event.key.length === 1)
            return event.key;

        if (event.key === "Enter")
            return "\n";

        if (event.key === "Tab")
            return "\t";

        return "";
    },

    toQtKey(event) {
        const code = event.code || "";
        const key = event.key || "";
        const qt = this.QT;

        // Letters. The original Qt client sends Qt::Key_A ... Qt::Key_Z.
        if (/^Key[A-Z]$/.test(code))
            return code.charCodeAt(3);

        // Main keyboard digits and numpad digits both map to Qt::Key_0...9.
        if (/^Digit[0-9]$/.test(code) || /^Numpad[0-9]$/.test(code))
            return Number(code.slice(-1)) + 0x30;

        // Standard printable keys represented by their Qt/ASCII values.
        const printable = {
            " ": 0x20,
            "-": 0x2D,
            "=": 0x3D,
            "[": 0x5B,
            "]": 0x5D,
            "\\": 0x5C,
            ";": 0x3B,
            "'": 0x27,
            ",": 0x2C,
            ".": 0x2E,
            "/": 0x2F,
            "`": 0x60
        };

        // These are intentionally kept close to the browser event.code.
        // The C++ receiver has special handling for several OEM keys.
        if (Object.prototype.hasOwnProperty.call(printable, key))
            return printable[key];

        switch (key)
        {
            case "Escape": return qt.Escape;
            case "Tab": return qt.Tab;
            case "Backspace": return qt.Backspace;
            case "Enter": return qt.Return;
            case "Insert": return qt.Insert;
            case "Delete": return qt.Delete;
            case "Pause": return qt.Pause;
            case "PrintScreen": return qt.Print;
            case "Clear": return qt.Clear;

            case "Home": return qt.Home;
            case "End": return qt.End;
            case "ArrowLeft": return qt.Left;
            case "ArrowUp": return qt.Up;
            case "ArrowRight": return qt.Right;
            case "ArrowDown": return qt.Down;
            case "PageUp": return qt.PageUp;
            case "PageDown": return qt.PageDown;

            case "Shift": return qt.Shift;
            case "Control": return qt.Control;
            case "Alt": return qt.Alt;
            case "Meta": return qt.Meta;
            case "CapsLock": return qt.CapsLock;
            case "NumLock": return qt.NumLock;
            case "ScrollLock": return qt.ScrollLock;
            case "ContextMenu": return qt.Menu;

            case "F1": return qt.F1;
            case "F2": return qt.F2;
            case "F3": return qt.F3;
            case "F4": return qt.F4;
            case "F5": return qt.F5;
            case "F6": return qt.F6;
            case "F7": return qt.F7;
            case "F8": return qt.F8;
            case "F9": return qt.F9;
            case "F10": return qt.F10;
            case "F11": return qt.F11;
            case "F12": return qt.F12;
            case "F13": return qt.F13;
            case "F14": return qt.F14;
            case "F15": return qt.F15;
            case "F16": return qt.F16;
            case "F17": return qt.F17;
            case "F18": return qt.F18;
            case "F19": return qt.F19;
            case "F20": return qt.F20;
            case "F21": return qt.F21;
            case "F22": return qt.F22;
            case "F23": return qt.F23;
            case "F24": return qt.F24;

            case "BrowserBack": return qt.BrowserBack;
            case "BrowserForward": return qt.BrowserForward;
            case "BrowserRefresh": return qt.Refresh;
            case "AudioVolumeDown": return qt.VolumeDown;
            case "AudioVolumeMute": return qt.VolumeMute;
            case "AudioVolumeUp": return qt.VolumeUp;
            case "MediaPlayPause": return qt.MediaPlay;
            case "MediaStop": return qt.MediaStop;
            case "MediaTrackPrevious": return qt.MediaPrevious;
            case "MediaTrackNext": return qt.MediaNext;
        }

        // Numpad operators use the Qt keypad values that are represented
        // by the corresponding printable key in the receiver.
        switch (code)
        {
            case "NumpadMultiply": return 0x2A; // Qt::Key_Asterisk
            case "NumpadAdd": return 0x2B;      // Qt::Key_Plus
            case "NumpadSubtract": return 0x2D; // Qt::Key_Minus
            case "NumpadDecimal": return 0x2E;  // Qt::Key_Period
            case "NumpadDivide": return 0x2F;   // Qt::Key_Slash
            case "NumpadEqual": return 0x3D;    // Qt::Key_Equal
            case "NumpadEnter": return qt.Enter;
        }

        // AltGr is represented by Ctrl+Alt by browsers. Qt has a dedicated
        // Key_AltGr, but the receiver's original table handles Alt keys.
        if (key === "AltGraph")
            return qt.AltGr;

        // Unsupported browser keys are not sent. This mirrors the original
        // KeyControler behavior for keys it cannot map.
        return null;
    },

    releasePressedKeys() {
        // Browser keyup is not guaranteed when the window/tab loses focus.
        // Do not synthesize arbitrary key releases here because the original
        // protocol does not carry a key-state snapshot.
        this.enabled = this.insidePlayer;
    }
};
