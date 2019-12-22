"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DOWNLOAD_INSTRUCTIONS = `Download and unzip JmdictFurigana.json.gz from https://github.com/Doublevil/JmdictFurigana.
`;
const fs_1 = require("fs");
const strip_bom_1 = __importDefault(require("strip-bom"));
const RAW_JMDICT_FILENAME = 'JmdictFurigana.json';
// const RAW_JMNEDICT_FILENAME = 'JmnedictFurigana.json';
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
function setup(fname = RAW_JMDICT_FILENAME) {
    return __awaiter(this, void 0, void 0, function* () {
        if (yield fileOk(fname)) {
            const raw = JSON.parse(strip_bom_1.default(yield fs_1.promises.readFile(fname, 'utf8')));
            const entries = raw.map(o => (Object.assign(Object.assign({}, o), { furigana: o.furigana.map(({ ruby, rt }) => rt ? { ruby, rt } : ruby) })));
            const textToEntry = new Map();
            const readingToEntry = new Map();
            for (const entry of entries) {
                const { text, reading } = entry;
                setter(textToEntry, text, entry);
                setter(readingToEntry, reading, entry);
            }
            return { readingToEntry, textToEntry };
        }
        console.error(DOWNLOAD_INSTRUCTIONS);
        throw new Error('see error');
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
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const { textToEntry, readingToEntry } = yield setup();
            {
                const res = textToEntry.get('漢字');
                console.dir(res, { depth: null });
            }
            {
                const res = readingToEntry.get('だいすき');
                console.dir(res, { depth: null });
                console.log(furiganaToString(((_a = res) === null || _a === void 0 ? void 0 : _a[0].furigana) || []));
            }
        });
    })();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUFBLE1BQU0scUJBQXFCLEdBQ3ZCO0NBQ0gsQ0FBQztBQUVGLDJCQUE0QjtBQUM1QiwwREFBaUM7QUFFakMsTUFBTSxtQkFBbUIsR0FBRyxxQkFBcUIsQ0FBQztBQUNsRCx5REFBeUQ7QUFFekQsU0FBZSxNQUFNLENBQUMsUUFBZ0I7O1FBQ3BDLElBQUk7WUFDRixNQUFNLElBQUksR0FBRyxNQUFNLGFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDM0MsT0FBTyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUM7U0FDdkM7UUFBQyxXQUFNLEdBQUU7UUFDVixPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7Q0FBQTtBQWFELFNBQVMsaUJBQWlCLENBQUMsVUFBc0I7SUFDL0MsTUFBTSxRQUFRLEdBQVMsRUFBRSxDQUFDO0lBQzFCLE1BQU0sSUFBSSxHQUFHLENBQUMsR0FBUyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztJQUNoRCxLQUFLLE1BQU0sSUFBSSxJQUFJLFVBQVUsRUFBRTtRQUM3QixJQUFJLENBQUMsSUFBSSxFQUFFO1lBQUUsU0FBUztTQUFFO1FBQ3hCLElBQUksT0FBTyxJQUFJLEtBQUssUUFBUSxJQUFJLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLFFBQVEsRUFBRSxFQUFFLG9DQUFvQztZQUN4RyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3JCO2FBQU07WUFDTCxtRUFBbUU7WUFDbkUsUUFBUSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDO1NBQ3ZDO0tBQ0Y7SUFDRCxPQUFPLFFBQVEs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QUFFLENBQUUsQ0FBQyxDQUFDO2FBQ3pEOztLQUNGLENBQUMsRUFBRSxDQUFDO0NBQ04iLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBET1dOTE9BRF9JTlNUUlVDVElPTlMgPVxuICAgIGBEb3dubG9hZCBhbmQgdW56aXAgSm1kaWN0RnVyaWdhbmEuanNvbi5neiBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9Eb3VibGV2aWwvSm1kaWN0RnVyaWdhbmEuXG5gO1xuXG5pbXBvcnQge3Byb21pc2VzfSBmcm9tICdmcyc7XG5pbXBvcnQgc3RyaXBCb20gZnJvbSAnc3RyaXAtYm9tJztcblxuY29uc3QgUkFXX0pNRElDVF9GSUxFTkFNRSA9ICdKbWRpY3RGdXJpZ2FuYS5qc29uJztcbi8vIGNvbnN0IFJBV19KTU5FRElDVF9GSUxFTkFNRSA9ICdKbW5lZGljdEZ1cmlnYW5hLmpzb24nO1xuXG5hc3luYyBmdW5jdGlvbiBmaWxlT2soZmlsZW5hbWU6IHN0cmluZykge1xuICB0cnkge1xuICAgIGNvbnN0IHN0YXQgPSBhd2FpdCBwcm9taXNlcy5zdGF0KGZpbGVuYW1lKTtcbiAgICByZXR1cm4gc3RhdC5pc0ZpbGUoKSAmJiBzdGF0LnNpemUgPiAwO1xuICB9IGNhdGNoIHt9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuZXhwb3J0IHR5cGUgUnVieSA9IHtcbiAgcnVieTogc3RyaW5nOyBydDogc3RyaW5nO1xufTtcbmV4cG9ydCB0eXBlIEZ1cmlnYW5hID0gc3RyaW5nfFJ1Ynk7XG5leHBvcnQgdHlwZSBFbnRyeSA9IHtcbiAgZnVyaWdhbmE6IEZ1cmlnYW5hW10sXG4gIHJlYWRpbmc6IHN0cmluZyxcbiAgdGV4dDogc3RyaW5nLFxufTtcbnR5cGUgV29yZCA9IEZ1cmlnYW5hW107XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUZ1cmlnYW5hKGNoYXJhY3RlcnM6IEZ1cmlnYW5hW10pOiBGdXJpZ2FuYVtdIHtcbiAgY29uc3QgZnVyaWdhbmE6IFdvcmQgPSBbXTtcbiAgY29uc3QgbGFzdCA9IChhcnI6IFdvcmQpID0+IGFyclthcnIubGVuZ3RoIC0gMV07XG4gIGZvciAoY29uc3QgY2hhciBvZiBjaGFyYWN0ZXJzKSB7XG4gICAgaWYgKCFjaGFyKSB7IGNvbnRpbnVlOyB9XG4gICAgaWYgKHR5cGVvZiBjaGFyID09PSAnb2JqZWN0JyB8fCB0eXBlb2YgbGFzdChmdXJpZ2FuYSkgIT09ICdzdHJpbmcnKSB7IC8vIGxhc3QoZnVyaWdhbmEpIG1pZ2h0IGJlIHVuZGVmaW5lZFxuICAgICAgZnVyaWdhbmEucHVzaChjaGFyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gdmlhIGRlIE1vcmdhbiB0aGVvcmVtLCAoY2hhcj1zdHJpbmcpICYmIGxhc3QobWVyZ2VkKT1zdHJpbmcgaGVyZVxuICAgICAgZnVyaWdhbmFbZnVyaWdhbmEubGVuZ3RoIC0gMV0gKz0gY2hhcjtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZ1cmlnYW5hO1xufVxuXG5mdW5jdGlvbiBzZXR0ZXI8SywgVj4obWFwOiBNYXA8SywgVltdPiwga2V5OiBLLCB2YWx1ZTogVikge1xuICBjb25zdCBoaXQgPSBtYXAuZ2V0KGtleSk7XG4gIGlmIChoaXQpIHtcbiAgICBoaXQucHVzaCh2YWx1ZSk7XG4gIH0gZWxzZSB7XG4gICAgbWFwLnNldChrZXksIFt2YWx1ZV0pO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZXR1cChmbmFtZTogc3RyaW5nID0gUkFXX0pNRElDVF9GSUxFTkFNRSk6XG4gICAgUHJvbWlzZTx7cmVhZGluZ1RvRW50cnk6IE1hcDxzdHJpbmcsIEVudHJ5W10+OyB0ZXh0VG9FbnRyeTogTWFwPHN0cmluZywgRW50cnlbXT47fT4ge1xuICBpZiAoYXdhaXQgZmlsZU9rKGZuYW1lKSkge1xuICAgIHR5cGUgUmF3RW50cnkgPSB7dGV4dDogc3RyaW5nLCByZWFkaW5nOiBzdHJpbmcsIGZ1cmlnYW5hOiB7cnVieTogc3RyaW5nLCBydD86IHN0cmluZ31bXX07XG4gICAgY29uc3QgcmF3OiBSYXdFbnRyeVtdID0gSlNPTi5wYXJzZShzdHJpcEJvbShhd2FpdCBwcm9taXNlcy5yZWFkRmlsZShmbmFtZSwgJ3V0ZjgnKSkpO1xuICAgIGNvbnN0IGVudHJpZXM6IEVudHJ5W10gPSByYXcubWFwKG8gPT4gKHsuLi5vLCBmdXJpZ2FuYTogby5mdXJpZ2FuYS5tYXAoKHtydWJ5LCBydH0pID0+IHJ0ID8ge3J1YnksIHJ0fSA6IHJ1YnkpfSkpO1xuXG4gICAgY29uc3QgdGV4dFRvRW50cnk6IE1hcDxzdHJpbmcsIEVudHJ5W10+ID0gbmV3IE1hcCgpO1xuICAgIGNvbnN0IHJlYWRpbmdUb0VudHJ5OiBNYXA8c3RyaW5nLCBFbnRyeVtdPiA9IG5ldyBNYXAoKTtcbiAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIGVudHJpZXMpIHtcbiAgICAgIGNvbnN0IHt0ZXh0LCByZWFkaW5nfSA9IGVudHJ5O1xuICAgICAgc2V0dGVyKHRleHRUb0VudHJ5LCB0ZXh0LCBlbnRyeSk7XG4gICAgICBzZXR0ZXIocmVhZGluZ1RvRW50cnksIHJlYWRpbmcsIGVudHJ5KTtcbiAgICB9XG4gICAgcmV0dXJuIHtyZWFkaW5nVG9FbnRyeSwgdGV4dFRvRW50cnl9O1xuICB9XG4gIGNvbnNvbGUuZXJyb3IoRE9XTkxPQURfSU5TVFJVQ1RJT05TKTtcbiAgdGhyb3cgbmV3IEVycm9yKCdzZWUgZXJyb3InKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZ1cmlnYW5hVG9TdHJpbmcoZnM6IEZ1cmlnYW5hW10pOiBzdHJpbmcge1xuICBjb25zdCBzYWZlUmUgPSAvW1xce1xcfV0vO1xuICBpZiAoZnMuc29tZShmID0+IHNhZmVSZS50ZXN0KHR5cGVvZiBmID09PSAnc3RyaW5nJyA/IGYgOiBmLnJ1YnkgKyBmLnJ0KSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0Z1cmlnYW5hIGNvbnRhaW5zIHttYXJrdXB9Jyk7XG4gIH1cbiAgcmV0dXJuIGZzLm1hcChmID0+IHR5cGVvZiBmID09PSAnc3RyaW5nJyA/IGYgOiBgeyR7Zi5ydWJ5fX1eeyR7Zi5ydH19YCkuam9pbignJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdHJpbmdUb0Z1cmlnYW5hKHM6IHN0cmluZyk6IEZ1cmlnYW5hW10ge1xuICBjb25zdCBjaGFyczogRnVyaWdhbmFbXSA9IHMuc3BsaXQoJycpO1xuICBjb25zdCByZSA9IC97KC4rPyl9XFxeeyguKz8pfS9nO1xuICBsZXQgbWF0Y2g6IFJlZ0V4cE1hdGNoQXJyYXl8bnVsbDtcbiAgd2hpbGUgKG1hdGNoID0gcmUuZXhlYyhzKSkge1xuICAgIGNvbnN0IGluZGV4ID0gbWF0Y2guaW5kZXggfHwgMDsgLy8gVHlwZVNjcmlwdCBwYWNpZmljYXRpb25cbiAgICBjaGFyc1tpbmRleF0gPSB7cnVieTogbWF0Y2hbMV0sIHJ0OiBtYXRjaFsyXX07XG4gICAgZm9yIChsZXQgaSA9IGluZGV4ICsgMTsgaSA8IGluZGV4ICsgbWF0Y2hbMF0ubGVuZ3RoOyBpKyspIHsgY2hhcnNbaV0gPSAnJzsgfVxuICB9XG4gIHJldHVybiBub3JtYWxpemVGdXJpZ2FuYShjaGFycyk7XG59XG5cbmlmIChtb2R1bGUgPT09IHJlcXVpcmUubWFpbikge1xuICAoYXN5bmMgZnVuY3Rpb24gbWFpbigpIHtcbiAgICBjb25zdCB7dGV4dFRvRW50cnksIHJlYWRpbmdUb0VudHJ5fSA9IGF3YWl0IHNldHVwKCk7XG4gICAge1xuICAgICAgY29uc3QgcmVzID0gdGV4dFRvRW50cnkuZ2V0KCfmvKLlrZcnKTtcbiAgICAgIGNvbnNvbGUuZGlyKHJlcywge2RlcHRoOiBudWxsfSk7XG4gICAgfVxuICAgIHtcbiAgICAgIGNvbnN0IHJlcyA9IHJlYWRpbmdUb0VudHJ5LmdldCgn44Gg44GE44GZ44GNJyk7XG4gICAgICBjb25zb2xlLmRpcihyZXMsIHtkZXB0aDogbnVsbH0pO1xuICAgICAgY29uc29sZS5sb2coZnVyaWdhbmFUb1N0cmluZyhyZXM/LlswXS5mdXJpZ2FuYSB8fCBbXSApKTtcbiAgICB9XG4gIH0pKCk7XG59Il19