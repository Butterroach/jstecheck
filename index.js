const GREEN = "#70d070";
const RED = "#ff6363";

function handle(bytebeatMode, value, t) {
    // handles values and corrects them accordingly
    if (bytebeatMode === "bb") {
        return (((value & 255) + (Math.abs(value) % 1)) % 256) / 128 - 1;
    } else if (bytebeatMode === "sbb") {
        return (((value + 128 & 255) + (Math.abs(value) % 1)) % 256) / 128 - 1;
    } else if (bytebeatMode === "fb" || bytebeatMode === "func") {
        return Math.min(Math.max(value, -1.0), 1.0); /* damnit firefox why are you like this */
    }
    if (t === 1) {
        console.warn("This bytebeat mode is invalid... " + bytebeatMode);
    }
    return (value & 255) / 128 - 1; // just in case
}

function hashArray(arr) {
    let hash = 0;
    for (const item of arr) {
        let str = typeof item === 'string' ? item : JSON.stringify(item);
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i) | 0;
        }
    }
    return hash;
}

function mulberry32(a) {
    return function () {
        let t = a += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
}

function makeSandbox(code, randomSeed, baseEnv = globalThis) {
    const env = new Proxy({}, {
        has: () => true, get: (target, prop) => {
            if (typeof prop === "symbol") return baseEnv[prop];
            if (prop in target) return target[prop];
            if (prop in baseEnv) return baseEnv[prop];
            throw new ReferenceError(`${prop} is not defined`);
        }, set: (target, prop, value) => {
            target[prop] = value;
            return true;
        }
    });

    const wrapped = `
        with (env) {
            ${code}
        }
    `;

    const func = new Function('env', 't', wrapped);

    env.randomSeed = randomSeed;

    // noinspection WithStatementJS
    with (env) {
        const fakeTime_jstecheck = "2025-08-22T06:09:07+03:00"
        Math.random = mulberry32(randomSeed);
        random = Math.random;
        Date.now = () => new Date(fakeTime_jstecheck).getTime();
        let OriginalDate_jstecheck = Date;
        Date = class extends OriginalDate_jstecheck {
            // noinspection JSAnnotator
            constructor(...args) {
                if (args.length === 0) return new OriginalDate_jstecheck(fakeTime_jstecheck);
                return new OriginalDate_jstecheck(...args);
            }
        };
    }

    return {
        run: (t) => {
            baseEnv["t"] = t;
            return func(env, t)
        }, env
    };
}

function check() {
    let code1 = document.getElementById("code1").value;
    let code2 = document.getElementById("code2").value;
    const seed = Date.now();
    const resultText = document.getElementById("result");
    if (code1 === code2) {
        resultText.innerText = "The codes are the exact same. At least get a bit creative.";
        resultText.style.color = RED;
        return;
    }
    const mode = document.getElementById("type").value;
    const sampleAmount = document.getElementById("amount").value;
    let mathItems = Object.getOwnPropertyNames(Math);
    for (let item in mathItems) {
        // create math aliases
        item = mathItems[item];
        this[item] = this[item] = Math[item];
    }
    this['int'] = Math.floor; // honorable mention
    if (/^eval\(unescape\(escape(?:`|\('|\("|\(`)(.*?)(?:`|'\)|"\)|`\)).replace\(\/u\(\.\.\)\/g,["'`]\$1%["'`]\)\)\)$/.test(code1.replaceAll(" ", ""))) {
        code1 = eval(code1.replace("eval", ""));
    }
    if (/^eval\(unescape\(escape(?:`|\('|\("|\(`)(.*?)(?:`|'\)|"\)|`\)).replace\(\/u\(\.\.\)\/g,["'`]\$1%["'`]\)\)\)$/.test(code2.replaceAll(" ", ""))) {
        code2 = eval(code2.replace("eval", ""));
    }
    let bytebeatFunc1 = makeSandbox(`return 0,\n${code1 || 0};`, seed);
    let bytebeatFunc2 = makeSandbox(`return 0,\n${code2 || 0};`, seed);
    bytebeatFunc1.run(0);
    bytebeatFunc2.run(0);
    let t_jstecheck = 0;
    let code1_output = []
    let code2_output = []

    for (let i_jstecheck = 0; i_jstecheck < sampleAmount; i_jstecheck++) {
        let t = t_jstecheck++;
        let result1 = NaN;
        let result2 = NaN;
        try {
            result1 = bytebeatFunc1.run(t);
            result2 = bytebeatFunc2.run(t);
        } catch (e) {
            console.error(e);
        }
        code1_output.push(handle(mode, result1, t))
        code2_output.push(handle(mode, result2, t))
    }

    let code1_hash = hashArray(code1_output);
    let code2_hash = hashArray(code2_output);
    let equality = code1_hash === code2_hash;
    resultText.innerText = `Code 1 hash: ${code1_hash}\nCode 2 hash: ${code2_hash}\nEquality: ${equality}`;
    resultText.style.color = equality ? GREEN : RED;
}
