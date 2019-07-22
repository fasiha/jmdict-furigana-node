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
// オリンピック選手|オリンピックせんしゅ|6:せん;7:しゅ
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
        const furigana = normalizeFurigana(characters);
        ret.push({ text, reading, furigana });
    }
    return ret;
}
exports.parse = parse;
function normalizeFurigana(characters) {
    const furigana = [];
    const last = (arr) => arr[arr.length - 1];
    for (const char of characters) {
        if (!char) {
            continue;
        }
        if (typeof char === 'object' || typeof last(furigana) !== 'string') { // last(furigana) might be undefined
            furigana.push(char);
        }
        else {
            // via de Morgan theorem, (char=string) && last(merged)=string here
            furigana[furigana.length - 1] += char;
        }
    }
    return furigana;
}
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
function furiganaToString(fs) {
    const safeRe = /[\{\}]/;
    if (fs.some(f => safeRe.test(typeof f === 'string' ? f : f.ruby + f.rt))) {
        throw new Error('Furigana contains {markup}');
    }
    return fs.map(f => typeof f === 'string' ? f : `{${f.ruby}}^{${f.rt}}`).join('');
}
exports.furiganaToString = furiganaToString;
function stringToFurigana(s) {
    const chars = s.split('');
    const re = /{(.+?)}\^{(.+?)}/g;
    let match;
    while (match = re.exec(s)) {
        const index = match.index || 0; // TypeScript pacification
        chars[index] = { ruby: match[1], rt: match[2] };
        for (let i = index + 1; i < index + match[0].length; i++) {
            chars[i] = '';
        }
    }
    return normalizeFurigana(chars);
}
exports.stringToFurigana = stringToFurigana;
if (module === require.main) {
    (function main() {
        return __awaiter(this, void 0, void 0, function* () {
            const { textToEntry, readingToEntry } = yield setup();
            console.dir([textToEntry.get('漢字'), readingToEntry.get('だいすき')], { depth: null });
        });
    })();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBQUEsOERBQWdDO0FBQ2hDLDJCQUE0QjtBQUM1QiwwREFBaUM7QUFXakMsU0FBc0IsWUFBWSxDQUFDLEdBQUcsR0FBRyx1RUFBdUUsRUFDN0UsUUFBUSxHQUFHLG9CQUFvQjs7UUFDaEUsTUFBTSxRQUFRLEdBQUcsTUFBTSxxQkFBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2xDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxFQUFFO1lBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1NBQUU7UUFDL0QsTUFBTSxPQUFPLEdBQVksTUFBTSxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDL0MsSUFBSSxRQUFRLElBQUksT0FBTyxFQUFFO1lBQ3ZCLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssUUFBUSxDQUFDLENBQUM7WUFDckYsSUFBSSxDQUFDLEtBQUssRUFBRTtnQkFBRSxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUE7YUFBRTtZQUMxRCxPQUFPLEVBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxvQkFBb0IsRUFBRSxHQUFHLEVBQUUsT0FBTyxDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsUUFBUSxHQUFHLEdBQUcsR0FBRyxPQUFPLENBQUMsUUFBUSxFQUFDLENBQUM7U0FDOUc7YUFBTTtZQUNMLE1BQU0sSUFBSSxLQUFLLENBQUMsa0RBQWtELENBQUMsQ0FBQztTQUNyRTtJQUNILENBQUM7Q0FBQTtBQVpELG9DQVlDO0FBRUQsU0FBZSxNQUFNLENBQUMsUUFB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b20gJ2Nyb3NzLWZldGNoJztcbmltcG9ydCB7cHJvbWlzZXN9IGZyb20gJ2ZzJztcbmltcG9ydCBzdHJpcEJvbSBmcm9tICdzdHJpcC1ib20nO1xuXG50eXBlIFJlbGVhc2UgPSB7XG4gIGFzc2V0czoge25hbWU6IHN0cmluZywgYnJvd3Nlcl9kb3dubG9hZF91cmw6IHN0cmluZ31bXSxcbiAgdGFnX25hbWU6IHN0cmluZ1xufTtcbnR5cGUgRmlsZVJlbGVhc2UgPSB7XG4gIHVybDogc3RyaW5nLFxuICB0YWc6IHN0cmluZyxcbiAgZmlsZW5hbWU6IHN0cmluZyxcbn07XG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0TGF0ZXN0VVJMKHVybCA9ICdodHRwczovL2FwaS5naXRodWIuY29tL3JlcG9zL0RvdWJsZXZpbC9KbWRpY3RGdXJpZ2FuYS9yZWxlYXNlcy9sYXRlc3QnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlbmFtZSA9ICdKbWRpY3RGdXJpZ2FuYS50eHQnKTogUHJvbWlzZTxGaWxlUmVsZWFzZT4ge1xuICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHVybCk7XG4gIGlmICghcmVzcG9uc2Uub2spIHsgdGhyb3cgbmV3IEVycm9yKCdmYWlsZWQgdG8gZmluZCBsYXRlc3QnKTsgfVxuICBjb25zdCByZWxlYXNlOiBSZWxlYXNlID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xuICBpZiAoJ2Fzc2V0cycgaW4gcmVsZWFzZSkge1xuICAgIGNvbnN0IGFzc2V0ID0gcmVsZWFzZS5hc3NldHMuZmlsdGVyKGEgPT4gJ25hbWUnIGluIGEpLmZpbmQoYSA9PiBhLm5hbWUgPT09IGZpbGVuYW1lKTtcbiAgICBpZiAoIWFzc2V0KSB7IHRocm93IG5ldyBFcnJvcignZmFpbGVkIHRvIGZpbmQgZmlsZW5hbWUnKSB9XG4gICAgcmV0dXJuIHt1cmw6IGFzc2V0LmJyb3dzZXJfZG93bmxvYWRfdXJsLCB0YWc6IHJlbGVhc2UudGFnX25hbWUsIGZpbGVuYW1lOiBmaWxlbmFtZSArICctJyArIHJlbGVhc2UudGFnX25hbWV9O1xuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBFcnJvcignZmFpbGVkIHRvIHBhcnNlIGdpdGh1YiByZXNwb25zZSwgYGFzc2V0c2AgbmVlZGVkJyk7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gZmlsZU9rKGZpbGVuYW1lOiBzdHJpbmcpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBzdGF0ID0gYXdhaXQgcHJvbWlzZXMuc3RhdChmaWxlbmFtZSk7XG4gICAgcmV0dXJuIHN0YXQuaXNGaWxlKCkgJiYgc3RhdC5zaXplID4gMDtcbiAgfSBjYXRjaCB7fVxuICByZXR1cm4gZmFsc2U7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzYXZlTGF0ZXN0KHVybDogc3RyaW5nLCBmaWxlbmFtZTogc3RyaW5nLCBvdmVyd3JpdGUgPSB0cnVlKSB7XG4gIGlmICghb3ZlcndyaXRlICYmIGF3YWl0IGZpbGVPayhmaWxlbmFtZSkpIHsgcmV0dXJuOyB9XG4gIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsKTtcbiAgaWYgKCFyZXNwb25zZS5vaykgeyB0aHJvdyBuZXcgRXJyb3IoJ2ZhaWxlZCB0byBkb3dubG9hZCBmaWxlICcgKyB1cmwpOyB9XG4gIGNvbnN0IHJhdyA9IGF3YWl0IHJlc3BvbnNlLnRleHQoKTtcbiAgcmV0dXJuIHByb21pc2VzLndyaXRlRmlsZShmaWxlbmFtZSwgcmF3KTtcbn1cblxuZXhwb3J0IHR5cGUgUnVieSA9IHtcbiAgcnVieTogc3RyaW5nOyBydDogc3RyaW5nO1xufTtcbmV4cG9ydCB0eXBlIEZ1cmlnYW5hID0gc3RyaW5nfFJ1Ynk7XG50eXBlIFdvcmQgPSBGdXJpZ2FuYVtdO1xuZXhwb3J0IHR5cGUgRW50cnkgPSB7XG4gIGZ1cmlnYW5hOiBGdXJpZ2FuYVtdLFxuICByZWFkaW5nOiBzdHJpbmcsXG4gIHRleHQ6IHN0cmluZyxcbn07XG5cbi8vIOmgkeW8teOCi3zjgYzjgpPjgbDjgot8MDrjgYzjgpM7MTrjgbBcbi8vIOWkp+S6uuiyt+OBhHzjgYrjgajjgarjgYzjgYR8MC0xOuOBiuOBqOOBqjsyOuOBjFxuLy8g44Kq44Oq44Oz44OU44OD44Kv6YG45omLfOOCquODquODs+ODlOODg+OCr+OBm+OCk+OBl+OChXw2OuOBm+OCkzs3OuOBl+OChVxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlKHJhdzogc3RyaW5nKSB7XG4gIGNvbnN0IGxpbmVzID0gcmF3LnNwbGl0KCdcXG4nKTtcbiAgY29uc3QgcmV0OiBFbnRyeVtdID0gW107XG4gIGZvciAoY29uc3QgbGluZSBvZiBsaW5lcykge1xuICAgIGlmICghbGluZSkgeyBjb250aW51ZTsgfSAvLyBlLmcuLCBibGFuayBsaW5lcyBhdCBlbmQgb2YgZmlsZVxuXG4gICAgY29uc3QgW3RleHQsIHJlYWRpbmcsIHJhd0Z1cmlnYW5hXSA9IGxpbmUuc3BsaXQoJ3wnKTtcbiAgICBpZiAoIXRleHQgfHwgIXJlYWRpbmcgfHwgIXJhd0Z1cmlnYW5hKSB7IHRocm93IG5ldyBFcnJvcignZmFpbGVkIHRvIHBhcnNlIGxpbmUgJyArIGxpbmUpOyB9XG5cbiAgICBjb25zdCBjaGFyYWN0ZXJzOiBXb3JkID0gdGV4dC5zcGxpdCgnJyk7IC8vIHdlJ2xsIHJlcGxhY2UgdGhlc2Ugd2l0aCBSdWJ5IG9iamVjdHMgYW5kIHBvc3NpYmx5IGVtcHR5IHN0cmluZ3NcblxuICAgIGNvbnN0IHJhd0Z1cmlnYW5hcyA9IHJhd0Z1cmlnYW5hLnRyaW0oKS5zcGxpdCgnOycpO1xuICAgIGZvciAoY29uc3QgZiBvZiByYXdGdXJpZ2FuYXMpIHtcbiAgICAgIGNvbnN0IFtyYW5nZSwgcnRdID0gZi5zcGxpdCgnOicpOyAvLyBydCBoZXJlIG1lYW5zIHRoZSByZWFkaW5nIHRoYXQgZ29lcyBvbiB0b3BcbiAgICAgIGlmICghcmFuZ2UgfHwgIXJ0KSB7IHRocm93IG5ldyBFcnJvcignZmFpbGVkIHRvIHNwbGl0IHBpZWNlICcgKyBmKTsgfVxuXG4gICAgICBjb25zdCBbbGVmdCwgbWF5YmVSaWdodF0gPSByYW5nZS5zcGxpdCgnLScpO1xuICAgICAgY29uc3QgbG8gPSBwYXJzZUludChsZWZ0KTtcbiAgICAgIGNvbnN0IGhpID0gcGFyc2VJbnQobWF5YmVSaWdodCB8fCBsZWZ0KTsgICAgICAgICAgICAgICAgICAgLy8gYDA6YWJjYCBpcyBlcXVpdmFsZW50IHRvIGAwLTA6YWJjYFxuICAgICAgY2hhcmFjdGVyc1tsb10gPSB7cnVieTogdGV4dC5zbGljZShsbywgaGkgKyAxKSwgcnR9OyAgICAgICAvLyBvdmVyd3JpdGUgZmlyc3QgY2hhcmFjdGVyIHdpdGggUnVieSBvYmplY3RcbiAgICAgIGZvciAobGV0IGkgPSBsbyArIDE7IGkgPD0gaGk7IGkrKykgeyBjaGFyYWN0ZXJzW2ldID0gJyc7IH0gLy8gb3ZlcndyaXRlIHJlc3Qgd2l0aCBlbXB0eSBzdHJpbmdzXG4gICAgfVxuXG4gICAgLy8gbWVyZ2UgYFsncycsICd0JywgJ3InLCAnaScsICduJywgJ2cnLCAncyddYCB0b2dldGhlciBpbnRvIGBbJ3N0cmluZ3MnXWBcbiAgICBjb25zdCBmdXJpZ2FuYSA9IG5vcm1hbGl6ZUZ1cmlnYW5hKGNoYXJhY3RlcnMpO1xuICAgIHJldC5wdXNoKHt0ZXh0LCByZWFkaW5nLCBmdXJpZ2FuYX0pO1xuICB9XG4gIHJldHVybiByZXQ7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUZ1cmlnYW5hKGNoYXJhY3RlcnM6IEZ1cmlnYW5hW10pOiBGdXJpZ2FuYVtdIHtcbiAgY29uc3QgZnVyaWdhbmE6IFdvcmQgPSBbXTtcbiAgY29uc3QgbGFzdCA9IChhcnI6IFdvcmQpID0+IGFyclthcnIubGVuZ3RoIC0gMV07XG4gIGZvciAoY29uc3QgY2hhciBvZiBjaGFyYWN0ZXJzKSB7XG4gICAgaWYgKCFjaGFyKSB7IGNvbnRpbnVlOyB9XG4gICAgaWYgKHR5cGVvZiBjaGFyID09PSAnb2JqZWN0JyB8fCB0eXBlb2YgbGFzdChmdXJpZ2FuYSkgIT09ICdzdHJpbmcnKSB7IC8vIGxhc3QoZnVyaWdhbmEpIG1pZ2h0IGJlIHVuZGVmaW5lZFxuICAgICAgZnVyaWdhbmEucHVzaChjaGFyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gdmlhIGRlIE1vcmdhbiB0aGVvcmVtLCAoY2hhcj1zdHJpbmcpICYmIGxhc3QobWVyZ2VkKT1zdHJpbmcgaGVyZVxuICAgICAgZnVyaWdhbmFbZnVyaWdhbmEubGVuZ3RoIC0gMV0gKz0gY2hhcjtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZ1cmlnYW5hO1xufVxuXG5mdW5jdGlvbiBzZXR0ZXI8SywgVj4obWFwOiBNYXA8SywgVltdPiwga2V5OiBLLCB2YWx1ZTogVikge1xuICBjb25zdCBoaXQgPSBtYXAuZ2V0KGtleSk7XG4gIGlmIChoaXQpIHtcbiAgICBoaXQucHVzaCh2YWx1ZSk7XG4gIH0gZWxzZSB7XG4gICAgbWFwLnNldChrZXksIFt2YWx1ZV0pO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRFbnRyaWVzKCkge1xuICBjb25zdCB7dXJsLCBmaWxlbmFtZX0gPSBhd2FpdCBnZXRMYXRlc3RVUkwoKTtcbiAgYXdhaXQgc2F2ZUxhdGVzdCh1cmwsIGZpbGVuYW1lLCBmYWxzZSk7XG4gIGNvbnN0IGxkanNvbiA9IGZpbGVuYW1lICsgJy5sZGpzb24nO1xuICBsZXQgZW50cmllczogRW50cnlbXTtcbiAgaWYgKCEoYXdhaXQgZmlsZU9rKGxkanNvbikpKSB7XG4gICAgY29uc3QgcmF3ID0gc3RyaXBCb20oYXdhaXQgcHJvbWlzZXMucmVhZEZpbGUoZmlsZW5hbWUsICd1dGY4JykpO1xuICAgIGVudHJpZXMgPSBwYXJzZShyYXcpO1xuICAgIGF3YWl0IHByb21pc2VzLndyaXRlRmlsZShsZGpzb24sIGVudHJpZXMubWFwKG8gPT4gSlNPTi5zdHJpbmdpZnkobykpLmpvaW4oJ1xcbicpKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCByYXcgPSBhd2FpdCBwcm9taXNlcy5yZWFkRmlsZShsZGpzb24sICd1dGY4Jyk7XG4gICAgZW50cmllcyA9IHJhdy5zcGxpdCgnXFxuJykubWFwKHMgPT4gSlNPTi5wYXJzZShzKSk7XG4gIH1cbiAgcmV0dXJuIGVudHJpZXM7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZXR1cCgpIHtcbiAgY29uc3QgZW50cmllcyA9IGF3YWl0IGdldEVudHJpZXMoKTtcbiAgY29uc3QgdGV4dFRvRW50cnk6IE1hcDxzdHJpbmcsIEVudHJ5W10+ID0gbmV3IE1hcCgpO1xuICBjb25zdCByZWFkaW5nVG9FbnRyeTogTWFwPHN0cmluZywgRW50cnlbXT4gPSBuZXcgTWFwKCk7XG4gIGZvciAoY29uc3QgZW50cnkgb2YgZW50cmllcykge1xuICAgIGNvbnN0IHtyZWFkaW5nLCB0ZXh0fSA9IGVudHJ5O1xuICAgIHNldHRlcih0ZXh0VG9FbnRyeSwgdGV4dCwgZW50cnkpO1xuICAgIHNldHRlcihyZWFkaW5nVG9FbnRyeSwgcmVhZGluZywgZW50cnkpO1xuICB9XG4gIHJldHVybiB7dGV4dFRvRW50cnksIHJlYWRpbmdUb0VudHJ5fTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZ1cmlnYW5hVG9TdHJpbmcoZnM6IEZ1cmlnYW5hW10pIHtcbiAgY29uc3Qgc2FmZVJlID0gL1tcXHtcXH1dLztcbiAgaWYgKGZzLnNvbWUoZiA9PiBzYWZlUmUudGVzdCh0eXBlb2YgZiA9PT0gJ3N0cmluZycgPyBmIDogZi5ydWJ5ICsgZi5ydCkpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdGdXJpZ2FuYSBjb250YWlucyB7bWFya3VwfScpO1xuICB9XG4gIHJldHVybiBmcy5tYXAoZiA9PiB0eXBlb2YgZiA9PT0gJ3N0cmluZycgPyBmIDogYHske2YucnVieX19Xnske2YucnR9fWApLmpvaW4oJycpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3RyaW5nVG9GdXJpZ2FuYShzOiBzdHJpbmcpOiBGdXJpZ2FuYVtdIHtcbiAgY29uc3QgY2hhcnM6IEZ1cmlnYW5hW10gPSBzLnNwbGl0KCcnKTtcbiAgY29uc3QgcmUgPSAveyguKz8pfVxcXnsoLis/KX0vZztcbiAgbGV0IG1hdGNoOiBSZWdFeHBNYXRjaEFycmF5fG51bGw7XG4gIHdoaWxlIChtYXRjaCA9IHJlLmV4ZWMocykpIHtcbiAgICBjb25zdCBpbmRleCA9IG1hdGNoLmluZGV4IHx8IDA7IC8vIFR5cGVTY3JpcHQgcGFjaWZpY2F0aW9uXG4gICAgY2hhcnNbaW5kZXhdID0ge3J1Ynk6IG1hdGNoWzFdLCBydDogbWF0Y2hbMl19O1xuICAgIGZvciAobGV0IGkgPSBpbmRleCArIDE7IGkgPCBpbmRleCArIG1hdGNoWzBdLmxlbmd0aDsgaSsrKSB7IGNoYXJzW2ldID0gJyc7IH1cbiAgfVxuICByZXR1cm4gbm9ybWFsaXplRnVyaWdhbmEoY2hhcnMpO1xufVxuXG5pZiAobW9kdWxlID09PSByZXF1aXJlLm1haW4pIHtcbiAgKGFzeW5jIGZ1bmN0aW9uIG1haW4oKSB7XG4gICAgY29uc3Qge3RleHRUb0VudHJ5LCByZWFkaW5nVG9FbnRyeX0gPSBhd2FpdCBzZXR1cCgpO1xuICAgIGNvbnNvbGUuZGlyKFt0ZXh0VG9FbnRyeS5nZXQoJ+a8ouWtlycpLCByZWFkaW5nVG9FbnRyeS5nZXQoJ+OBoOOBhOOBmeOBjScpXSwge2RlcHRoOiBudWxsfSk7XG4gIH0pKCk7XG59Il19