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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBQUEsOERBQWdDO0FBQ2hDLDJCQUE0QjtBQUM1QiwwREFBaUM7QUFXakMsU0FBc0IsWUFBWSxDQUFDLEdBQUcsR0FBRyx1RUFBdUUsRUFDN0UsUUFBUSxHQUFHLG9CQUFvQjs7UUFDaEUsTUFBTSxRQUFRLEdBQUcsTUFBTSxxQkFBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2xDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxFQUFFO1lBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1NBQUU7UUFDL0QsTUFBTSxPQUFPLEdBQVksTUFBTSxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDL0MsSUFBSSxRQUFRLElBQUksT0FBTyxFQUFFO1lBQ3ZCLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssUUFBUSxDQUFDLENBQUM7WUFDckYsSUFBSSxDQUFDLEtBQUssRUFBRTtnQkFBRSxNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUE7YUFBRTtZQUMxRCxPQUFPLEVBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxvQkFBb0IsRUFBRSxHQUFHLEVBQUUsT0FBTyxDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsUUFBUSxHQUFHLEdBQUcsR0FBRyxPQUFPLENBQUMsUUFBUSxFQUFDLENBQUM7U0FDOUc7YUFBTTtZQUNMLE1BQU0sSUFBSSxLQUFLLENBQUMsa0RBQWtELENBQUMsQ0FBQztTQUNyRTtJQUNILENBQUM7Q0FBQTtBQVpELG9DQVlDO0FBRUQsU0FBZSxNQUFNLENBQUMsUUFB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QUFHLEVBQUUsQ0FBQztRQUN2RCxLQUFLLE1BQU0sS0FBSyxJQUFJLE9BQU8sRUFBRTtZQUMzQixNQUFNLEVBQUMsT0FBTyxFQUFFLElBQUksRUFBQyxHQUFHLEtBQUssQ0FBQztZQUM5QixNQUFNLENBQUMsV0FBVyxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNqQyxNQUFNLENBQUMsY0FBYyxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztTQUN4QztRQUNELE9BQU8sRUFBQyxXQUFXLEVBQUUsY0FBYyxFQUFDLENBQUM7SUFDdkMsQ0FBQztDQUFBO0FBVkQsc0JBVUM7QUFFRCxJQUFJLE1BQU0sS0FBSyxPQUFPLENBQUMsSUFBSSxFQUFFO0lBQzNCLENBQUMsU0FBZSxJQUFJOztZQUNsQixNQUFNLEVBQUMsV0FBVyxFQUFFLGNBQWMsRUFBQyxHQUFHLE1BQU0sS0FBSyxFQUFFLENBQUM7WUFDcEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsY0FBYyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLEVBQUMsS0FBSyxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7UUFDbEYsQ0FBQztLQUFBLENBQUMsRUFBRSxDQUFDO0NBQ04iLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZmV0Y2ggZnJvbSAnY3Jvc3MtZmV0Y2gnO1xuaW1wb3J0IHtwcm9taXNlc30gZnJvbSAnZnMnO1xuaW1wb3J0IHN0cmlwQm9tIGZyb20gJ3N0cmlwLWJvbSc7XG5cbnR5cGUgUmVsZWFzZSA9IHtcbiAgYXNzZXRzOiB7bmFtZTogc3RyaW5nLCBicm93c2VyX2Rvd25sb2FkX3VybDogc3RyaW5nfVtdLFxuICB0YWdfbmFtZTogc3RyaW5nXG59O1xudHlwZSBGaWxlUmVsZWFzZSA9IHtcbiAgdXJsOiBzdHJpbmcsXG4gIHRhZzogc3RyaW5nLFxuICBmaWxlbmFtZTogc3RyaW5nLFxufTtcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRMYXRlc3RVUkwodXJsID0gJ2h0dHBzOi8vYXBpLmdpdGh1Yi5jb20vcmVwb3MvRG91YmxldmlsL0ptZGljdEZ1cmlnYW5hL3JlbGVhc2VzL2xhdGVzdCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVuYW1lID0gJ0ptZGljdEZ1cmlnYW5hLnR4dCcpOiBQcm9taXNlPEZpbGVSZWxlYXNlPiB7XG4gIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsKTtcbiAgaWYgKCFyZXNwb25zZS5vaykgeyB0aHJvdyBuZXcgRXJyb3IoJ2ZhaWxlZCB0byBmaW5kIGxhdGVzdCcpOyB9XG4gIGNvbnN0IHJlbGVhc2U6IFJlbGVhc2UgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XG4gIGlmICgnYXNzZXRzJyBpbiByZWxlYXNlKSB7XG4gICAgY29uc3QgYXNzZXQgPSByZWxlYXNlLmFzc2V0cy5maWx0ZXIoYSA9PiAnbmFtZScgaW4gYSkuZmluZChhID0+IGEubmFtZSA9PT0gZmlsZW5hbWUpO1xuICAgIGlmICghYXNzZXQpIHsgdGhyb3cgbmV3IEVycm9yKCdmYWlsZWQgdG8gZmluZCBmaWxlbmFtZScpIH1cbiAgICByZXR1cm4ge3VybDogYXNzZXQuYnJvd3Nlcl9kb3dubG9hZF91cmwsIHRhZzogcmVsZWFzZS50YWdfbmFtZSwgZmlsZW5hbWU6IGZpbGVuYW1lICsgJy0nICsgcmVsZWFzZS50YWdfbmFtZX07XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdmYWlsZWQgdG8gcGFyc2UgZ2l0aHViIHJlc3BvbnNlLCBgYXNzZXRzYCBuZWVkZWQnKTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBmaWxlT2soZmlsZW5hbWU6IHN0cmluZykge1xuICB0cnkge1xuICAgIGNvbnN0IHN0YXQgPSBhd2FpdCBwcm9taXNlcy5zdGF0KGZpbGVuYW1lKTtcbiAgICByZXR1cm4gc3RhdC5pc0ZpbGUoKSAmJiBzdGF0LnNpemUgPiAwO1xuICB9IGNhdGNoIHt9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNhdmVMYXRlc3QodXJsOiBzdHJpbmcsIGZpbGVuYW1lOiBzdHJpbmcsIG92ZXJ3cml0ZSA9IHRydWUpIHtcbiAgaWYgKCFvdmVyd3JpdGUgJiYgYXdhaXQgZmlsZU9rKGZpbGVuYW1lKSkgeyByZXR1cm47IH1cbiAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh1cmwpO1xuICBpZiAoIXJlc3BvbnNlLm9rKSB7IHRocm93IG5ldyBFcnJvcignZmFpbGVkIHRvIGRvd25sb2FkIGZpbGUgJyArIHVybCk7IH1cbiAgY29uc3QgcmF3ID0gYXdhaXQgcmVzcG9uc2UudGV4dCgpO1xuICByZXR1cm4gcHJvbWlzZXMud3JpdGVGaWxlKGZpbGVuYW1lLCByYXcpO1xufVxuXG5leHBvcnQgdHlwZSBSdWJ5ID0ge1xuICBydWJ5OiBzdHJpbmc7IHJ0OiBzdHJpbmc7XG59O1xuZXhwb3J0IHR5cGUgRnVyaWdhbmEgPSBzdHJpbmd8UnVieTtcbnR5cGUgV29yZCA9IEZ1cmlnYW5hW107XG5leHBvcnQgdHlwZSBFbnRyeSA9IHtcbiAgZnVyaWdhbmE6IEZ1cmlnYW5hW10sXG4gIHJlYWRpbmc6IHN0cmluZyxcbiAgdGV4dDogc3RyaW5nLFxufTtcblxuLy8g6aCR5by144KLfOOBjOOCk+OBsOOCi3wwOuOBjOOCkzsxOuOBsFxuLy8g5aSn5Lq66LK344GEfOOBiuOBqOOBquOBjOOBhHwwLTE644GK44Go44GqOzI644GMXG4vLyDjgqrjg6rjg7Pjg5Tjg4Pjgq/pgbjmiYt844Kq44Oq44Oz44OU44OD44Kv44Gb44KT44GX44KFfDY644Gb44KTOzc644GX44KFXG5leHBvcnQgZnVuY3Rpb24gcGFyc2UocmF3OiBzdHJpbmcpIHtcbiAgY29uc3QgbGluZXMgPSByYXcuc3BsaXQoJ1xcbicpO1xuICBjb25zdCByZXQ6IEVudHJ5W10gPSBbXTtcbiAgZm9yIChjb25zdCBsaW5lIG9mIGxpbmVzKSB7XG4gICAgaWYgKCFsaW5lKSB7IGNvbnRpbnVlOyB9IC8vIGUuZy4sIGJsYW5rIGxpbmVzIGF0IGVuZCBvZiBmaWxlXG5cbiAgICBjb25zdCBbdGV4dCwgcmVhZGluZywgcmF3RnVyaWdhbmFdID0gbGluZS5zcGxpdCgnfCcpO1xuICAgIGlmICghdGV4dCB8fCAhcmVhZGluZyB8fCAhcmF3RnVyaWdhbmEpIHsgdGhyb3cgbmV3IEVycm9yKCdmYWlsZWQgdG8gcGFyc2UgbGluZSAnICsgbGluZSk7IH1cblxuICAgIGNvbnN0IGNoYXJhY3RlcnM6IFdvcmQgPSB0ZXh0LnNwbGl0KCcnKTsgLy8gd2UnbGwgcmVwbGFjZSB0aGVzZSB3aXRoIFJ1Ynkgb2JqZWN0cyBhbmQgcG9zc2libHkgZW1wdHkgc3RyaW5nc1xuXG4gICAgY29uc3QgcmF3RnVyaWdhbmFzID0gcmF3RnVyaWdhbmEudHJpbSgpLnNwbGl0KCc7Jyk7XG4gICAgZm9yIChjb25zdCBmIG9mIHJhd0Z1cmlnYW5hcykge1xuICAgICAgY29uc3QgW3JhbmdlLCBydF0gPSBmLnNwbGl0KCc6Jyk7IC8vIHJ0IGhlcmUgbWVhbnMgdGhlIHJlYWRpbmcgdGhhdCBnb2VzIG9uIHRvcFxuICAgICAgaWYgKCFyYW5nZSB8fCAhcnQpIHsgdGhyb3cgbmV3IEVycm9yKCdmYWlsZWQgdG8gc3BsaXQgcGllY2UgJyArIGYpOyB9XG5cbiAgICAgIGNvbnN0IFtsZWZ0LCBtYXliZVJpZ2h0XSA9IHJhbmdlLnNwbGl0KCctJyk7XG4gICAgICBjb25zdCBsbyA9IHBhcnNlSW50KGxlZnQpO1xuICAgICAgY29uc3QgaGkgPSBwYXJzZUludChtYXliZVJpZ2h0IHx8IGxlZnQpOyAgICAgICAgICAgICAgICAgICAvLyBgMDphYmNgIGlzIGVxdWl2YWxlbnQgdG8gYDAtMDphYmNgXG4gICAgICBjaGFyYWN0ZXJzW2xvXSA9IHtydWJ5OiB0ZXh0LnNsaWNlKGxvLCBoaSArIDEpLCBydH07ICAgICAgIC8vIG92ZXJ3cml0ZSBmaXJzdCBjaGFyYWN0ZXIgd2l0aCBSdWJ5IG9iamVjdFxuICAgICAgZm9yIChsZXQgaSA9IGxvICsgMTsgaSA8PSBoaTsgaSsrKSB7IGNoYXJhY3RlcnNbaV0gPSAnJzsgfSAvLyBvdmVyd3JpdGUgcmVzdCB3aXRoIGVtcHR5IHN0cmluZ3NcbiAgICB9XG5cbiAgICAvLyBtZXJnZSBgWydzJywgJ3QnLCAncicsICdpJywgJ24nLCAnZycsICdzJ11gIHRvZ2V0aGVyIGludG8gYFsnc3RyaW5ncyddYFxuICAgIGNvbnN0IGZ1cmlnYW5hOiBXb3JkID0gW107XG4gICAgY29uc3QgbGFzdCA9IChhcnI6IFdvcmQpID0+IGFyclthcnIubGVuZ3RoIC0gMV07XG4gICAgZm9yIChjb25zdCBjaGFyIG9mIGNoYXJhY3RlcnMpIHtcbiAgICAgIGlmICghY2hhcikgeyBjb250aW51ZTsgfVxuICAgICAgaWYgKHR5cGVvZiBjaGFyID09PSAnb2JqZWN0JyB8fCB0eXBlb2YgbGFzdChmdXJpZ2FuYSkgIT09ICdzdHJpbmcnKSB7IC8vIGxhc3QoZnVyaWdhbmEpIG1pZ2h0IGJlIHVuZGVmaW5lZFxuICAgICAgICBmdXJpZ2FuYS5wdXNoKGNoYXIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gdmlhIGRlIE1vcmdhbiB0aGVvcmVtLCAoY2hhcj1zdHJpbmcpICYmIGxhc3QobWVyZ2VkKT1zdHJpbmcgaGVyZVxuICAgICAgICBmdXJpZ2FuYVtmdXJpZ2FuYS5sZW5ndGggLSAxXSArPSBjaGFyO1xuICAgICAgfVxuICAgIH1cbiAgICByZXQucHVzaCh7dGV4dCwgcmVhZGluZywgZnVyaWdhbmF9KTtcbiAgfVxuICByZXR1cm4gcmV0O1xufVxuXG5mdW5jdGlvbiBzZXR0ZXI8SywgVj4obWFwOiBNYXA8SywgVltdPiwga2V5OiBLLCB2YWx1ZTogVikge1xuICBjb25zdCBoaXQgPSBtYXAuZ2V0KGtleSk7XG4gIGlmIChoaXQpIHtcbiAgICBoaXQucHVzaCh2YWx1ZSk7XG4gIH0gZWxzZSB7XG4gICAgbWFwLnNldChrZXksIFt2YWx1ZV0pO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRFbnRyaWVzKCkge1xuICBjb25zdCB7dXJsLCBmaWxlbmFtZX0gPSBhd2FpdCBnZXRMYXRlc3RVUkwoKTtcbiAgYXdhaXQgc2F2ZUxhdGVzdCh1cmwsIGZpbGVuYW1lLCBmYWxzZSk7XG4gIGNvbnN0IGxkanNvbiA9IGZpbGVuYW1lICsgJy5sZGpzb24nO1xuICBsZXQgZW50cmllczogRW50cnlbXTtcbiAgaWYgKCEoYXdhaXQgZmlsZU9rKGxkanNvbikpKSB7XG4gICAgY29uc3QgcmF3ID0gc3RyaXBCb20oYXdhaXQgcHJvbWlzZXMucmVhZEZpbGUoZmlsZW5hbWUsICd1dGY4JykpO1xuICAgIGVudHJpZXMgPSBwYXJzZShyYXcpO1xuICAgIGF3YWl0IHByb21pc2VzLndyaXRlRmlsZShsZGpzb24sIGVudHJpZXMubWFwKG8gPT4gSlNPTi5zdHJpbmdpZnkobykpLmpvaW4oJ1xcbicpKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCByYXcgPSBhd2FpdCBwcm9taXNlcy5yZWFkRmlsZShsZGpzb24sICd1dGY4Jyk7XG4gICAgZW50cmllcyA9IHJhdy5zcGxpdCgnXFxuJykubWFwKHMgPT4gSlNPTi5wYXJzZShzKSk7XG4gIH1cbiAgcmV0dXJuIGVudHJpZXM7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZXR1cCgpIHtcbiAgY29uc3QgZW50cmllcyA9IGF3YWl0IGdldEVudHJpZXMoKTtcbiAgY29uc3QgdGV4dFRvRW50cnk6IE1hcDxzdHJpbmcsIEVudHJ5W10+ID0gbmV3IE1hcCgpO1xuICBjb25zdCByZWFkaW5nVG9FbnRyeTogTWFwPHN0cmluZywgRW50cnlbXT4gPSBuZXcgTWFwKCk7XG4gIGZvciAoY29uc3QgZW50cnkgb2YgZW50cmllcykge1xuICAgIGNvbnN0IHtyZWFkaW5nLCB0ZXh0fSA9IGVudHJ5O1xuICAgIHNldHRlcih0ZXh0VG9FbnRyeSwgdGV4dCwgZW50cnkpO1xuICAgIHNldHRlcihyZWFkaW5nVG9FbnRyeSwgcmVhZGluZywgZW50cnkpO1xuICB9XG4gIHJldHVybiB7dGV4dFRvRW50cnksIHJlYWRpbmdUb0VudHJ5fTtcbn1cblxuaWYgKG1vZHVsZSA9PT0gcmVxdWlyZS5tYWluKSB7XG4gIChhc3luYyBmdW5jdGlvbiBtYWluKCkge1xuICAgIGNvbnN0IHt0ZXh0VG9FbnRyeSwgcmVhZGluZ1RvRW50cnl9ID0gYXdhaXQgc2V0dXAoKTtcbiAgICBjb25zb2xlLmRpcihbdGV4dFRvRW50cnkuZ2V0KCfmvKLlrZcnKSwgcmVhZGluZ1RvRW50cnkuZ2V0KCfjgaDjgYTjgZnjgY0nKV0sIHtkZXB0aDogbnVsbH0pO1xuICB9KSgpO1xufSJdfQ==