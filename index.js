"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cross_fetch_1 = __importDefault(require("cross-fetch"));
const fs_1 = require("fs");
const strip_bom_1 = __importDefault(require("strip-bom"));
function getLatestURL(url = 'https://api.github.com/repos/Doublevil/JmdictFurigana/releases/latest', filename = 'JmdictFurigana.txt') {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield cross_fetch_1.default(url);
        if (!response.ok) {
            throw new Error('failed to find latest');
        }
        const release = yield response.json();
        if ('assets' in release) {
            const asset = release.assets.filter(a => 'name' in a).find(a => a.name === filename);
            if (!asset) {
                throw new Error('failed to find filename');
            }
            return { url: asset.browser_download_url, tag: release.tag_name, filename: filename + '-' + release.tag_name };
        }
        else {
            throw new Error('failed to parse github response, `assets` needed');
        }
    });
}
exports.getLatestURL = getLatestURL;
function fileOk(filename) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const stat = yield fs_1.promises.stat(filename);
            return stat.isFile() && stat.size > 0;
        }
        catch (_a) { }
        return false;
    });
}
function saveLatest(url, filename, overwrite = true) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!overwrite && fileOk(filename)) {
            return;
        }
        const response = yield cross_fetch_1.default(url);
        if (!response.ok) {
            throw new Error('failed to download file ' + url);
        }
        const raw = yield response.text();
        return fs_1.promises.writeFile(filename, raw);
    });
}
exports.saveLatest = saveLatest;
// 頑張る|がんばる|0:がん;1:ば
// 大人買い|おとながい|0-1:おとな;2:が
function parse(raw) {
    const lines = raw.split('\n');
    const ret = [];
    for (const line of lines) {
        if (!line) {
            continue;
        } // e.g., blank lines at end of file
        const [text, reading, rawFurigana] = line.split('|');
        if (!text || !reading || !rawFurigana) {
            throw new Error('failed to parse line ' + line);
        }
        const characters = text.split(''); // we'll replace these with Ruby objects and possibly empty strings
        const rawFuriganas = rawFurigana.trim().split(';');
        for (const f of rawFuriganas) {
            const [range, rt] = f.split(':'); // rt here means the reading that goes on top
            if (!range || !rt) {
                throw new Error('failed to split piece ' + f);
            }
            const [left, maybeRight] = range.split('-');
            const lo = parseInt(left);
            const hi = parseInt(maybeRight || left); // `0:abc` is equivalent to `0-0:abc`
            characters[lo] = { ruby: text.slice(lo, hi + 1), rt }; // overwrite first character with Ruby object
            for (let i = lo + 1; i <= hi; i++) {
                characters[i] = '';
            } // overwrite rest with empty strings
        }
        // merge `['s', 't', 'r', 'i', 'n', 'g', 's']` together into `['strings']`
        const furigana = [];
        const last = (arr) => arr[arr.length - 1];
        for (const char of characters) {
            if (typeof char === 'object' || typeof last(furigana) === 'object') {
                furigana.push(char);
            }
            else {
                // via de Morgan theorem, (char=string) && last(merged)=string here
                furigana[furigana.length - 1] += char;
            }
        }
        ret.push({ text, reading, furigana });
    }
    return ret;
}
exports.parse = parse;
function setter(map, key, value) {
    const hit = map.get(key);
    if (hit) {
        hit.push(value);
    }
    else {
        map.set(key, [value]);
    }
}
function getEntries() {
    return __awaiter(this, void 0, void 0, function* () {
        const { url, filename } = yield getLatestURL();
        yield saveLatest(url, filename, false);
        const ldjson = filename + '.ldjson';
        let entries;
        if (!fileOk(ldjson)) {
            const raw = strip_bom_1.default(yield fs_1.promises.readFile(filename, 'utf8'));
            entries = parse(raw);
            yield fs_1.promises.writeFile(ldjson, entries.map(o => JSON.stringify(o)).join('\n'));
        }
        else {
            const raw = yield fs_1.promises.readFile(ldjson, 'utf8');
            entries = raw.split('\n').map(s => JSON.parse(s));
        }
        return entries;
    });
}
exports.getEntries = getEntries;
function setup() {
    return __awaiter(this, void 0, void 0, function* () {
        const entries = yield getEntries();
        const textToEntry = new Map();
        const readingToEntry = new Map();
        for (const entry of entries) {
            const { reading, text } = entry;
            setter(textToEntry, text, entry);
            setter(readingToEntry, reading, entry);
        }
        return { textToEntry, readingToEntry };
    });
}
exports.setup = setup;
if (module === require.main) {
    (function main() {
        return __awaiter(this, void 0, void 0, function* () {
            const { textToEntry, readingToEntry } = yield setup();
            console.dir([textToEntry.get('漢字'), readingToEntry.get('だいすき')], { depth: null });
        });
    })();
}
