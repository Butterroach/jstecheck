import BytebeatWorker from './bytebeatWorker.ts?worker'

const versionElement = document.getElementById("version") as HTMLSpanElement;
versionElement.textContent = __APP_VERSION__;

const GREEN = "#70d070";
const RED = "#ff6363";

function runWorker<T>(worker: Worker, payload: any, element: HTMLElement | null = null): Promise<T> {
    return new Promise(resolve => {
        worker.onmessage = e => {
            if (element) {
                element.innerText = e.data.toString();
            }
            return resolve(e.data as T);
        }
        worker.postMessage(payload);
    });
}

async function check() {
    let code1 = (document.getElementById("code1") as HTMLTextAreaElement).value;
    let code2 = (document.getElementById("code2") as HTMLTextAreaElement).value;
    const seed = Date.now();
    const hintText = document.getElementById("hint") as HTMLParagraphElement;
    hintText.style.display = "none";
    const resultContainer = document.getElementById("result") as HTMLDivElement;
    resultContainer.style.color = "white";
    resultContainer.style.display = "block";
    const equalityText = document.getElementById("equality") as HTMLSpanElement;
    const times = Number((document.getElementById("amount") as HTMLInputElement).value);
    equalityText.innerText = "Waiting for both hashes to be calculated...";

    if (code1 === code2) {
        equalityText.innerText = "The codes are the exact same. At least get a bit creative.";
        resultContainer.style.color = RED;
        return;
    } else if (times < 1) {
        equalityText.innerText = "Wtf do you want me to do???"
        resultContainer.style.color = RED;
        return;
    } else if (times >= 1e12) {
        equalityText.innerText = "Why."
        resultContainer.style.color = RED;
        return;
    }
    const mode = (document.getElementById("type") as HTMLSelectElement).value;

    const worker1 = new BytebeatWorker();
    const worker2 = new BytebeatWorker();

    const codeHashText1 = document.getElementById("code-hash-1") as HTMLSpanElement;
    const codeHashText2 = document.getElementById("code-hash-2") as HTMLSpanElement;

    codeHashText1.innerText = "Calculating...";
    codeHashText2.innerText = "Calculating...";

    const promise1 = runWorker<number>(
        worker1,
        {code: code1, times, seed, mode},
        codeHashText1,
    );
    const promise2 = runWorker<number>(
        worker2,
        {code: code2, times, seed, mode},
        codeHashText2,
    );

    const results = await Promise.all([promise1, promise2]);

    const equality = results[0] === results[1];
    equalityText.innerText = equality.toString();
    resultContainer.style.color = equality ? GREEN : RED;
}

(document.getElementById("check") as HTMLButtonElement).onclick = check;
