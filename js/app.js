const sidebar = document.getElementById('sidebar');
const btnOpen = document.getElementById('btnOpen');
const loggerBody = document.getElementById('loggerBody');
const video = document.getElementById("video");

let menuVisible = true;

btnOpen.onclick = () => {

    menuVisible = !menuVisible;

    if (menuVisible) {
        sidebar.style.display = "block";
        btnOpen.innerHTML = "❮";
    } else {
        sidebar.style.display = "none";
        btnOpen.innerHTML = "❯";
    }
};

document.getElementById('btnClear').onclick = () => {
    loggerBody.innerHTML = "";
};

function log(text)
{
    const now = new Date();

    const time =
        now.getHours().toString().padStart(2, '0') + ":" +
        now.getMinutes().toString().padStart(2, '0') + ":" +
        now.getSeconds().toString().padStart(2, '0');

    loggerBody.innerHTML += "[" + time + "] " + text + "<br>";

    loggerBody.scrollTop = loggerBody.scrollHeight;
}

video.addEventListener("loadedmetadata", () =>
{
    log("Відео: " +
        video.videoWidth +
        " × " +
        video.videoHeight);
})

video.addEventListener("playing", () =>
{
    log("Відтворення відео розпочато.");
});

video.addEventListener("ended", () =>
{
    log("Відтворення завершено.");
});

video.addEventListener("error", () =>
{
    log("Помилка відтворення відео.");
});

log("Програму запущено.");
log("Інтерфейс готовий.");