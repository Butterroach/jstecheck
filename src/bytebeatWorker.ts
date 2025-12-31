/*
JSteCheck: A website to check the equality of two JS bytebeats 

Copyright (c) 2025-2026 Butterroach

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

interface JobData {
    code: string;
    times: number;
    seed: number;
    mode: string;
}

function handle(value: number, mode: string) {
    if (isNaN(value)) {
        return value;
    }
    if (mode === "fb" || mode === "func") return Math.min(Math.max(value, -1.0), 1.0);
    return (((value & 255) + (Math.abs(value) % 1)) % 256) / 128 - 1;
}

function hashArray(arr: any[]) {
    let hash = 0;
    for (const item of arr) {
        let str = typeof item === 'string' ? item :
            typeof item === 'number' ? item.toFixed(7) : JSON.stringify(item);
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i) | 0;
        }
    }
    return hash;
}

self.onmessage = (e: MessageEvent<JobData>) => {
    const {code, times, seed, mode} = e.data;

    function mulberry32(a: number) {
        return function () {
            let t = a += 0x6D2B79F5;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    Math.random = mulberry32(seed);

    const mathItems = Object.getOwnPropertyNames(Math);
    for (let item of mathItems) {
        // @ts-ignore
        self[item] = Math[item];
    }
    // @ts-ignore
    self.int = Math.floor; // honorable mention

    let fn;

    if (mode === "func") {
        fn = Function(code)();
    } else {
        fn = Function("t", `return 0,${code || 0};`);
    }

    fn(0);

    // @ts-ignore
    let t = 0;

    const results: any[] = [];
    for (let i_jstecheck = 1; i_jstecheck <= times; i_jstecheck++) {
        if (mode === "func") {
            t = i_jstecheck / 8000;
        } else {
            t = i_jstecheck;
        }
        results.push(handle(fn(t), mode));
    }
    console.log(results)
    self.postMessage(hashArray(results));
};
