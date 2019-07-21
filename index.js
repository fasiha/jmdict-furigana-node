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
        if (!overwrite && (yield fileOk(filename))) {
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
            if (!char) {
                continue;
            }
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
        if (!(yield fileOk(ldjson))) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBQUEsOERBQWdDO0FBQ2hDLDJCQUE0QjtBQUM1QiwwREFBaUM7QUFXakMsU0FBc0IsWUFBWSxDQUFDLEdBQUcsR0FBRyx1RUFBdUUsRUFDN0UsUUFBUSxHQUFHLG9CQUFvQjs7UUFDaEUsTUFBTSxRQUFRLEdBQUcsTUFBTSxxQkFBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2xDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxFQUFFO1lBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1NBQUU7UUFDL0QsTUFBTSxPQUFPLEdBQVksTUFBTSxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDL0MsSUFBSSxRQUFRLElBQUksT0FBTyxFQUFFO1lBQ3ZCLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssUUFBUSxDQUFDLENBQUM7WUFDckYsSUFBSSxDQUFDLEtBQUssRUFBRTtnQkFBRSxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUE7YUFBRTtZQUMxRCxPQUFPLEVBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxvQkFBb0IsRUFBRSxHQUFHLEVBQUUsT0FBTyxDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsUUFBUSxHQUFHLEdBQUcsR0FBRyxPQUFPLENBQUMsUUFBUSxFQUFDLENBQUM7U0FDOUc7YUFBTTtZQUNMLE1BQU0sSUFBSSxLQUFLLENBQUMsa0RBQWtELENBQUMsQ0FBQztTQUNyRTtJQUNILENBQUM7Q0FBQTtBQVpELG9DQVlDO0FBRUQsU0FBZSxNQUFNLENBQUMsUUFB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TUFBTSxLQUFLLElBQUksT0FBTyxFQUFFO1lBQzNCLE1BQU0sRUFBQyxPQUFPLEVBQUUsSUFBSSxFQUFDLEdBQUcsS0FBSyxDQUFDO1lBQzlCLE1BQU0sQ0FBQyxXQUFXLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2pDLE1BQU0sQ0FBQyxjQUFjLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQ3hDO1FBQ0QsT0FBTyxFQUFDLFdBQVcsRUFBRSxjQUFjLEVBQUMsQ0FBQztJQUN2QyxDQUFDO0NBQUE7QUFWRCxzQkFVQztBQUVELElBQUksTUFBTSxLQUFLLE9BQU8sQ0FBQyxJQUFJLEVBQUU7SUFDM0IsQ0FBQyxTQUFlLElBQUk7O1lBQ2xCLE1BQU0sRUFBQyxXQUFXLEVBQUUsY0FBYyxFQUFDLEdBQUcsTUFBTSxLQUFLLEVBQUUsQ0FBQztZQUNwRCxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxjQUFjLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsRUFBQyxLQUFLLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztRQUNsRixDQUFDO0tBQUEsQ0FBQyxFQUFFLENBQUM7Q0FDTiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBmZXRjaCBmcm9tICdjcm9zcy1mZXRjaCc7XG5pbXBvcnQge3Byb21pc2VzfSBmcm9tICdmcyc7XG5pbXBvcnQgc3RyaXBCb20gZnJvbSAnc3RyaXAtYm9tJztcblxudHlwZSBSZWxlYXNlID0ge1xuICBhc3NldHM6IHtuYW1lOiBzdHJpbmcsIGJyb3dzZXJfZG93bmxvYWRfdXJsOiBzdHJpbmd9W10sXG4gIHRhZ19uYW1lOiBzdHJpbmdcbn07XG50eXBlIEZpbGVSZWxlYXNlID0ge1xuICB1cmw6IHN0cmluZyxcbiAgdGFnOiBzdHJpbmcsXG4gIGZpbGVuYW1lOiBzdHJpbmcsXG59O1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldExhdGVzdFVSTCh1cmwgPSAnaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS9yZXBvcy9Eb3VibGV2aWwvSm1kaWN0RnVyaWdhbmEvcmVsZWFzZXMvbGF0ZXN0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZW5hbWUgPSAnSm1kaWN0RnVyaWdhbmEudHh0Jyk6IFByb21pc2U8RmlsZVJlbGVhc2U+IHtcbiAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh1cmwpO1xuICBpZiAoIXJlc3BvbnNlLm9rKSB7IHRocm93IG5ldyBFcnJvcignZmFpbGVkIHRvIGZpbmQgbGF0ZXN0Jyk7IH1cbiAgY29uc3QgcmVsZWFzZTogUmVsZWFzZSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcbiAgaWYgKCdhc3NldHMnIGluIHJlbGVhc2UpIHtcbiAgICBjb25zdCBhc3NldCA9IHJlbGVhc2UuYXNzZXRzLmZpbHRlcihhID0+ICduYW1lJyBpbiBhKS5maW5kKGEgPT4gYS5uYW1lID09PSBmaWxlbmFtZSk7XG4gICAgaWYgKCFhc3NldCkgeyB0aHJvdyBuZXcgRXJyb3IoJ2ZhaWxlZCB0byBmaW5kIGZpbGVuYW1lJykgfVxuICAgIHJldHVybiB7dXJsOiBhc3NldC5icm93c2VyX2Rvd25sb2FkX3VybCwgdGFnOiByZWxlYXNlLnRhZ19uYW1lLCBmaWxlbmFtZTogZmlsZW5hbWUgKyAnLScgKyByZWxlYXNlLnRhZ19uYW1lfTtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2ZhaWxlZCB0byBwYXJzZSBnaXRodWIgcmVzcG9uc2UsIGBhc3NldHNgIG5lZWRlZCcpO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGZpbGVPayhmaWxlbmFtZTogc3RyaW5nKSB7XG4gIHRyeSB7XG4gICAgY29uc3Qgc3RhdCA9IGF3YWl0IHByb21pc2VzLnN0YXQoZmlsZW5hbWUpO1xuICAgIHJldHVybiBzdGF0LmlzRmlsZSgpICYmIHN0YXQuc2l6ZSA+IDA7XG4gIH0gY2F0Y2gge31cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2F2ZUxhdGVzdCh1cmw6IHN0cmluZywgZmlsZW5hbWU6IHN0cmluZywgb3ZlcndyaXRlID0gdHJ1ZSkge1xuICBpZiAoIW92ZXJ3cml0ZSAmJiBhd2FpdCBmaWxlT2soZmlsZW5hbWUpKSB7IHJldHVybjsgfVxuICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHVybCk7XG4gIGlmICghcmVzcG9uc2Uub2spIHsgdGhyb3cgbmV3IEVycm9yKCdmYWlsZWQgdG8gZG93bmxvYWQgZmlsZSAnICsgdXJsKTsgfVxuICBjb25zdCByYXcgPSBhd2FpdCByZXNwb25zZS50ZXh0KCk7XG4gIHJldHVybiBwcm9taXNlcy53cml0ZUZpbGUoZmlsZW5hbWUsIHJhdyk7XG59XG5cbmV4cG9ydCB0eXBlIFJ1YnkgPSB7XG4gIHJ1Ynk6IHN0cmluZzsgcnQ6IHN0cmluZztcbn07XG5leHBvcnQgdHlwZSBGdXJpZ2FuYSA9IHN0cmluZ3xSdWJ5O1xudHlwZSBXb3JkID0gRnVyaWdhbmFbXTtcbmV4cG9ydCB0eXBlIEVudHJ5ID0ge1xuICBmdXJpZ2FuYTogRnVyaWdhbmFbXSxcbiAgcmVhZGluZzogc3RyaW5nLFxuICB0ZXh0OiBzdHJpbmcsXG59O1xuXG4vLyDpoJHlvLXjgot844GM44KT44Gw44KLfDA644GM44KTOzE644GwXG4vLyDlpKfkurrosrfjgYR844GK44Go44Gq44GM44GEfDAtMTrjgYrjgajjgao7MjrjgYxcbmV4cG9ydCBmdW5jdGlvbiBwYXJzZShyYXc6IHN0cmluZykge1xuICBjb25zdCBsaW5lcyA9IHJhdy5zcGxpdCgnXFxuJyk7XG4gIGNvbnN0IHJldDogRW50cnlbXSA9IFtdO1xuICBmb3IgKGNvbnN0IGxpbmUgb2YgbGluZXMpIHtcbiAgICBpZiAoIWxpbmUpIHsgY29udGludWU7IH0gLy8gZS5nLiwgYmxhbmsgbGluZXMgYXQgZW5kIG9mIGZpbGVcblxuICAgIGNvbnN0IFt0ZXh0LCByZWFkaW5nLCByYXdGdXJpZ2FuYV0gPSBsaW5lLnNwbGl0KCd8Jyk7XG4gICAgaWYgKCF0ZXh0IHx8ICFyZWFkaW5nIHx8ICFyYXdGdXJpZ2FuYSkgeyB0aHJvdyBuZXcgRXJyb3IoJ2ZhaWxlZCB0byBwYXJzZSBsaW5lICcgKyBsaW5lKTsgfVxuXG4gICAgY29uc3QgY2hhcmFjdGVyczogV29yZCA9IHRleHQuc3BsaXQoJycpOyAvLyB3ZSdsbCByZXBsYWNlIHRoZXNlIHdpdGggUnVieSBvYmplY3RzIGFuZCBwb3NzaWJseSBlbXB0eSBzdHJpbmdzXG5cbiAgICBjb25zdCByYXdGdXJpZ2FuYXMgPSByYXdGdXJpZ2FuYS50cmltKCkuc3BsaXQoJzsnKTtcbiAgICBmb3IgKGNvbnN0IGYgb2YgcmF3RnVyaWdhbmFzKSB7XG4gICAgICBjb25zdCBbcmFuZ2UsIHJ0XSA9IGYuc3BsaXQoJzonKTsgLy8gcnQgaGVyZSBtZWFucyB0aGUgcmVhZGluZyB0aGF0IGdvZXMgb24gdG9wXG4gICAgICBpZiAoIXJhbmdlIHx8ICFydCkgeyB0aHJvdyBuZXcgRXJyb3IoJ2ZhaWxlZCB0byBzcGxpdCBwaWVjZSAnICsgZik7IH1cblxuICAgICAgY29uc3QgW2xlZnQsIG1heWJlUmlnaHRdID0gcmFuZ2Uuc3BsaXQoJy0nKTtcbiAgICAgIGNvbnN0IGxvID0gcGFyc2VJbnQobGVmdCk7XG4gICAgICBjb25zdCBoaSA9IHBhcnNlSW50KG1heWJlUmlnaHQgfHwgbGVmdCk7ICAgICAgICAgICAgICAgICAgIC8vIGAwOmFiY2AgaXMgZXF1aXZhbGVudCB0byBgMC0wOmFiY2BcbiAgICAgIGNoYXJhY3RlcnNbbG9dID0ge3J1Ynk6IHRleHQuc2xpY2UobG8sIGhpICsgMSksIHJ0fTsgICAgICAgLy8gb3ZlcndyaXRlIGZpcnN0IGNoYXJhY3RlciB3aXRoIFJ1Ynkgb2JqZWN0XG4gICAgICBmb3IgKGxldCBpID0gbG8gKyAxOyBpIDw9IGhpOyBpKyspIHsgY2hhcmFjdGVyc1tpXSA9ICcnOyB9IC8vIG92ZXJ3cml0ZSByZXN0IHdpdGggZW1wdHkgc3RyaW5nc1xuICAgIH1cblxuICAgIC8vIG1lcmdlIGBbJ3MnLCAndCcsICdyJywgJ2knLCAnbicsICdnJywgJ3MnXWAgdG9nZXRoZXIgaW50byBgWydzdHJpbmdzJ11gXG4gICAgY29uc3QgZnVyaWdhbmE6IFdvcmQgPSBbXTtcbiAgICBjb25zdCBsYXN0ID0gKGFycjogV29yZCkgPT4gYXJyW2Fyci5sZW5ndGggLSAxXTtcbiAgICBmb3IgKGNvbnN0IGNoYXIgb2YgY2hhcmFjdGVycykge1xuICAgICAgaWYgKCFjaGFyKSB7IGNvbnRpbnVlOyB9XG4gICAgICBpZiAodHlwZW9mIGNoYXIgPT09ICdvYmplY3QnIHx8IHR5cGVvZiBsYXN0KGZ1cmlnYW5hKSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgZnVyaWdhbmEucHVzaChjaGFyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIHZpYSBkZSBNb3JnYW4gdGhlb3JlbSwgKGNoYXI9c3RyaW5nKSAmJiBsYXN0KG1lcmdlZCk9c3RyaW5nIGhlcmVcbiAgICAgICAgZnVyaWdhbmFbZnVyaWdhbmEubGVuZ3RoIC0gMV0gKz0gY2hhcjtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0LnB1c2goe3RleHQsIHJlYWRpbmcsIGZ1cmlnYW5hfSk7XG4gIH1cbiAgcmV0dXJuIHJldDtcbn1cblxuZnVuY3Rpb24gc2V0dGVyPEssIFY+KG1hcDogTWFwPEssIFZbXT4sIGtleTogSywgdmFsdWU6IFYpIHtcbiAgY29uc3QgaGl0ID0gbWFwLmdldChrZXkpO1xuICBpZiAoaGl0KSB7XG4gICAgaGl0LnB1c2godmFsdWUpO1xuICB9IGVsc2Uge1xuICAgIG1hcC5zZXQoa2V5LCBbdmFsdWVdKTtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0RW50cmllcygpIHtcbiAgY29uc3Qge3VybCwgZmlsZW5hbWV9ID0gYXdhaXQgZ2V0TGF0ZXN0VVJMKCk7XG4gIGF3YWl0IHNhdmVMYXRlc3QodXJsLCBmaWxlbmFtZSwgZmFsc2UpO1xuICBjb25zdCBsZGpzb24gPSBmaWxlbmFtZSArICcubGRqc29uJztcbiAgbGV0IGVudHJpZXM6IEVudHJ5W107XG4gIGlmICghKGF3YWl0IGZpbGVPayhsZGpzb24pKSkge1xuICAgIGNvbnN0IHJhdyA9IHN0cmlwQm9tKGF3YWl0IHByb21pc2VzLnJlYWRGaWxlKGZpbGVuYW1lLCAndXRmOCcpKTtcbiAgICBlbnRyaWVzID0gcGFyc2UocmF3KTtcbiAgICBhd2FpdCBwcm9taXNlcy53cml0ZUZpbGUobGRqc29uLCBlbnRyaWVzLm1hcChvID0+IEpTT04uc3RyaW5naWZ5KG8pKS5qb2luKCdcXG4nKSk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgcmF3ID0gYXdhaXQgcHJvbWlzZXMucmVhZEZpbGUobGRqc29uLCAndXRmOCcpO1xuICAgIGVudHJpZXMgPSByYXcuc3BsaXQoJ1xcbicpLm1hcChzID0+IEpTT04ucGFyc2UocykpO1xuICB9XG4gIHJldHVybiBlbnRyaWVzO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2V0dXAoKSB7XG4gIGNvbnN0IGVudHJpZXMgPSBhd2FpdCBnZXRFbnRyaWVzKCk7XG4gIGNvbnN0IHRleHRUb0VudHJ5OiBNYXA8c3RyaW5nLCBFbnRyeVtdPiA9IG5ldyBNYXAoKTtcbiAgY29uc3QgcmVhZGluZ1RvRW50cnk6IE1hcDxzdHJpbmcsIEVudHJ5W10+ID0gbmV3IE1hcCgpO1xuICBmb3IgKGNvbnN0IGVudHJ5IG9mIGVudHJpZXMpIHtcbiAgICBjb25zdCB7cmVhZGluZywgdGV4dH0gPSBlbnRyeTtcbiAgICBzZXR0ZXIodGV4dFRvRW50cnksIHRleHQsIGVudHJ5KTtcbiAgICBzZXR0ZXIocmVhZGluZ1RvRW50cnksIHJlYWRpbmcsIGVudHJ5KTtcbiAgfVxuICByZXR1cm4ge3RleHRUb0VudHJ5LCByZWFkaW5nVG9FbnRyeX07XG59XG5cbmlmIChtb2R1bGUgPT09IHJlcXVpcmUubWFpbikge1xuICAoYXN5bmMgZnVuY3Rpb24gbWFpbigpIHtcbiAgICBjb25zdCB7dGV4dFRvRW50cnksIHJlYWRpbmdUb0VudHJ5fSA9IGF3YWl0IHNldHVwKCk7XG4gICAgY29uc29sZS5kaXIoW3RleHRUb0VudHJ5LmdldCgn5ryi5a2XJyksIHJlYWRpbmdUb0VudHJ5LmdldCgn44Gg44GE44GZ44GNJyldLCB7ZGVwdGg6IG51bGx9KTtcbiAgfSkoKTtcbn0iXX0=