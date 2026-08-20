// ---------------------------------------------------------
// Keyboard capture
// ---------------------------------------------------------

const Keyboard = {

    init() {
        document.addEventListener("keydown", this.onKeyDown);
        document.addEventListener("keyup", this.onKeyUp);

        console.log("Keyboard capture initialized");
    },

    onKeyDown(event) {
        console.log(
            "KEY DOWN:",
            "key =", event.key,
            "code =", event.code,
            "keyCode =", event.keyCode
        );

        event.preventDefault();
    },

    onKeyUp(event) {
        console.log(
            "KEY UP:",
            "key =", event.key,
            "code =", event.code,
            "keyCode =", event.keyCode
        );

        event.preventDefault();
    }
};