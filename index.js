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
function setup() {
    return __awaiter(this, void 0, void 0, function* () {
        if (yield fileOk(RAW_JMDICT_FILENAME)) {
            const raw = JSON.parse(strip_bom_1.default(yield fs_1.promises.readFile(RAW_JMDICT_FILENAME, 'utf8')));
            const entries = raw.map(o => [o.text, o.reading, o.furigana.map(({ ruby, rt }) => rt ? { ruby, rt } : ruby)]);
            const textToEntry = new Map();
            const readingToEntry = new Map();
            for (const entry of entries) {
                const [text, reading] = entry;
                setter(textToEntry, text, entry);
                setter(readingToEntry, reading, entry);
            }
            return { readingToEntry, textToEntry };
        }
        console.error(DOWNLOAD_INSTRUCTIONS);
        process.exit(1);
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
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const { textToEntry, readingToEntry } = yield setup();
            {
                const res = textToEntry.get('漢字');
                console.dir(res, { depth: null });
            }
            {
                const res = readingToEntry.get('だいすき');
                console.dir(res, { depth: null });
                console.log(furiganaToString(((_b = (_a = res) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b[2]) || []));
            }
        });
    })();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUFBLE1BQU0scUJBQXFCLEdBQ3ZCO0NBQ0gsQ0FBQztBQUVGLDJCQUE0QjtBQUM1QiwwREFBaUM7QUFFakMsTUFBTSxtQkFBbUIsR0FBRyxxQkFBcUIsQ0FBQztBQUNsRCx5REFBeUQ7QUFFekQsU0FBZSxNQUFNLENBQUMsUUFBZ0I7O1FBQ3BDLElBQUk7WUFDRixNQUFNLElBQUksR0FBRyxNQUFNLGFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDM0MsT0FBTyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUM7U0FDdkM7UUFBQyxXQUFNLEdBQUU7UUFDVixPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7Q0FBQTtBQVNELFNBQVMsaUJBQWlCLENBQUMsVUFBc0I7SUFDL0MsTUFBTSxRQUFRLEdBQVMsRUFBRSxDQUFDO0lBQzFCLE1BQU0sSUFBSSxHQUFHLENBQUMsR0FBUyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztJQUNoRCxLQUFLLE1BQU0sSUFBSSxJQUFJLFVBQVUsRUFBRTtRQUM3QixJQUFJLENBQUMsSUFBSSxFQUFFO1lBQUUsU0FBUztTQUFFO1FBQ3hCLElBQUksT0FBTyxJQUFJLEtBQUssUUFBUSxJQUFJLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLFFBQVEsRUFBRSxFQUFFLG9DQUFvQztZQUN4RyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3JCO2FBQU07WUFDTCxtRUFBbUU7WUFDbkUsUUFBUSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDO1NBQ3ZDO0tBQ0Y7SUFDRCxPQUFPLFFBQVEs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TUFBSyxFQUFFLENBQUUsQ0FBQyxDQUFDO2FBQ3JEOztLQUNGLENBQUMsRUFBRSxDQUFDO0NBQ04iLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBET1dOTE9BRF9JTlNUUlVDVElPTlMgPVxuICAgIGBEb3dubG9hZCBhbmQgdW56aXAgSm1kaWN0RnVyaWdhbmEuanNvbi5neiBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9Eb3VibGV2aWwvSm1kaWN0RnVyaWdhbmEuXG5gO1xuXG5pbXBvcnQge3Byb21pc2VzfSBmcm9tICdmcyc7XG5pbXBvcnQgc3RyaXBCb20gZnJvbSAnc3RyaXAtYm9tJztcblxuY29uc3QgUkFXX0pNRElDVF9GSUxFTkFNRSA9ICdKbWRpY3RGdXJpZ2FuYS5qc29uJztcbi8vIGNvbnN0IFJBV19KTU5FRElDVF9GSUxFTkFNRSA9ICdKbW5lZGljdEZ1cmlnYW5hLmpzb24nO1xuXG5hc3luYyBmdW5jdGlvbiBmaWxlT2soZmlsZW5hbWU6IHN0cmluZykge1xuICB0cnkge1xuICAgIGNvbnN0IHN0YXQgPSBhd2FpdCBwcm9taXNlcy5zdGF0KGZpbGVuYW1lKTtcbiAgICByZXR1cm4gc3RhdC5pc0ZpbGUoKSAmJiBzdGF0LnNpemUgPiAwO1xuICB9IGNhdGNoIHt9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuZXhwb3J0IHR5cGUgUnVieSA9IHtcbiAgcnVieTogc3RyaW5nOyBydDogc3RyaW5nO1xufTtcbmV4cG9ydCB0eXBlIEZ1cmlnYW5hID0gc3RyaW5nfFJ1Ynk7XG5leHBvcnQgdHlwZSBFbnRyeSA9IFtzdHJpbmcsIHN0cmluZywgRnVyaWdhbmFbXV07XG50eXBlIFdvcmQgPSBGdXJpZ2FuYVtdO1xuXG5mdW5jdGlvbiBub3JtYWxpemVGdXJpZ2FuYShjaGFyYWN0ZXJzOiBGdXJpZ2FuYVtdKTogRnVyaWdhbmFbXSB7XG4gIGNvbnN0IGZ1cmlnYW5hOiBXb3JkID0gW107XG4gIGNvbnN0IGxhc3QgPSAoYXJyOiBXb3JkKSA9PiBhcnJbYXJyLmxlbmd0aCAtIDFdO1xuICBmb3IgKGNvbnN0IGNoYXIgb2YgY2hhcmFjdGVycykge1xuICAgIGlmICghY2hhcikgeyBjb250aW51ZTsgfVxuICAgIGlmICh0eXBlb2YgY2hhciA9PT0gJ29iamVjdCcgfHwgdHlwZW9mIGxhc3QoZnVyaWdhbmEpICE9PSAnc3RyaW5nJykgeyAvLyBsYXN0KGZ1cmlnYW5hKSBtaWdodCBiZSB1bmRlZmluZWRcbiAgICAgIGZ1cmlnYW5hLnB1c2goY2hhcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHZpYSBkZSBNb3JnYW4gdGhlb3JlbSwgKGNoYXI9c3RyaW5nKSAmJiBsYXN0KG1lcmdlZCk9c3RyaW5nIGhlcmVcbiAgICAgIGZ1cmlnYW5hW2Z1cmlnYW5hLmxlbmd0aCAtIDFdICs9IGNoYXI7XG4gICAgfVxuICB9XG4gIHJldHVybiBmdXJpZ2FuYTtcbn1cblxuZnVuY3Rpb24gc2V0dGVyPEssIFY+KG1hcDogTWFwPEssIFZbXT4sIGtleTogSywgdmFsdWU6IFYpIHtcbiAgY29uc3QgaGl0ID0gbWFwLmdldChrZXkpO1xuICBpZiAoaGl0KSB7XG4gICAgaGl0LnB1c2godmFsdWUpO1xuICB9IGVsc2Uge1xuICAgIG1hcC5zZXQoa2V5LCBbdmFsdWVdKTtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2V0dXAoKTogUHJvbWlzZTx7cmVhZGluZ1RvRW50cnk6IE1hcDxzdHJpbmcsIEVudHJ5W10+OyB0ZXh0VG9FbnRyeTogTWFwPHN0cmluZywgRW50cnlbXT47fT4ge1xuICBpZiAoYXdhaXQgZmlsZU9rKFJBV19KTURJQ1RfRklMRU5BTUUpKSB7XG4gICAgdHlwZSBSYXdFbnRyeSA9IHt0ZXh0OiBzdHJpbmcsIHJlYWRpbmc6IHN0cmluZywgZnVyaWdhbmE6IHtydWJ5OiBzdHJpbmcsIHJ0Pzogc3RyaW5nfVtdfTtcbiAgICBjb25zdCByYXc6IFJhd0VudHJ5W10gPSBKU09OLnBhcnNlKHN0cmlwQm9tKGF3YWl0IHByb21pc2VzLnJlYWRGaWxlKFJBV19KTURJQ1RfRklMRU5BTUUsICd1dGY4JykpKTtcbiAgICBjb25zdCBlbnRyaWVzOiBFbnRyeVtdID0gcmF3Lm1hcChvID0+IFtvLnRleHQsIG8ucmVhZGluZywgby5mdXJpZ2FuYS5tYXAoKHtydWJ5LCBydH0pID0+IHJ0ID8ge3J1YnksIHJ0fSA6IHJ1YnkpXSk7XG5cbiAgICBjb25zdCB0ZXh0VG9FbnRyeTogTWFwPHN0cmluZywgRW50cnlbXT4gPSBuZXcgTWFwKCk7XG4gICAgY29uc3QgcmVhZGluZ1RvRW50cnk6IE1hcDxzdHJpbmcsIEVudHJ5W10+ID0gbmV3IE1hcCgpO1xuICAgIGZvciAoY29uc3QgZW50cnkgb2YgZW50cmllcykge1xuICAgICAgY29uc3QgW3RleHQsIHJlYWRpbmddID0gZW50cnk7XG4gICAgICBzZXR0ZXIodGV4dFRvRW50cnksIHRleHQsIGVudHJ5KTtcbiAgICAgIHNldHRlcihyZWFkaW5nVG9FbnRyeSwgcmVhZGluZywgZW50cnkpO1xuICAgIH1cbiAgICByZXR1cm4ge3JlYWRpbmdUb0VudHJ5LCB0ZXh0VG9FbnRyeX07XG4gIH1cbiAgY29uc29sZS5lcnJvcihET1dOTE9BRF9JTlNUUlVDVElPTlMpO1xuICBwcm9jZXNzLmV4aXQoMSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmdXJpZ2FuYVRvU3RyaW5nKGZzOiBGdXJpZ2FuYVtdKTogc3RyaW5nIHtcbiAgY29uc3Qgc2FmZVJlID0gL1tcXHtcXH1dLztcbiAgaWYgKGZzLnNvbWUoZiA9PiBzYWZlUmUudGVzdCh0eXBlb2YgZiA9PT0gJ3N0cmluZycgPyBmIDogZi5ydWJ5ICsgZi5ydCkpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdGdXJpZ2FuYSBjb250YWlucyB7bWFya3VwfScpO1xuICB9XG4gIHJldHVybiBmcy5tYXAoZiA9PiB0eXBlb2YgZiA9PT0gJ3N0cmluZycgPyBmIDogYHske2YucnVieX19Xnske2YucnR9fWApLmpvaW4oJycpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3RyaW5nVG9GdXJpZ2FuYShzOiBzdHJpbmcpOiBGdXJpZ2FuYVtdIHtcbiAgY29uc3QgY2hhcnM6IEZ1cmlnYW5hW10gPSBzLnNwbGl0KCcnKTtcbiAgY29uc3QgcmUgPSAveyguKz8pfVxcXnsoLis/KX0vZztcbiAgbGV0IG1hdGNoOiBSZWdFeHBNYXRjaEFycmF5fG51bGw7XG4gIHdoaWxlIChtYXRjaCA9IHJlLmV4ZWMocykpIHtcbiAgICBjb25zdCBpbmRleCA9IG1hdGNoLmluZGV4IHx8IDA7IC8vIFR5cGVTY3JpcHQgcGFjaWZpY2F0aW9uXG4gICAgY2hhcnNbaW5kZXhdID0ge3J1Ynk6IG1hdGNoWzFdLCBydDogbWF0Y2hbMl19O1xuICAgIGZvciAobGV0IGkgPSBpbmRleCArIDE7IGkgPCBpbmRleCArIG1hdGNoWzBdLmxlbmd0aDsgaSsrKSB7IGNoYXJzW2ldID0gJyc7IH1cbiAgfVxuICByZXR1cm4gbm9ybWFsaXplRnVyaWdhbmEoY2hhcnMpO1xufVxuXG5pZiAobW9kdWxlID09PSByZXF1aXJlLm1haW4pIHtcbiAgKGFzeW5jIGZ1bmN0aW9uIG1haW4oKSB7XG4gICAgY29uc3Qge3RleHRUb0VudHJ5LCByZWFkaW5nVG9FbnRyeX0gPSBhd2FpdCBzZXR1cCgpO1xuICAgIHtcbiAgICAgIGNvbnN0IHJlcyA9IHRleHRUb0VudHJ5LmdldCgn5ryi5a2XJyk7XG4gICAgICBjb25zb2xlLmRpcihyZXMsIHtkZXB0aDogbnVsbH0pO1xuICAgIH1cbiAgICB7XG4gICAgICBjb25zdCByZXMgPSByZWFkaW5nVG9FbnRyeS5nZXQoJ+OBoOOBhOOBmeOBjScpO1xuICAgICAgY29uc29sZS5kaXIocmVzLCB7ZGVwdGg6IG51bGx9KTtcbiAgICAgIGNvbnNvbGUubG9nKGZ1cmlnYW5hVG9TdHJpbmcocmVzPy5bMF0/LlsyXSB8fCBbXSApKTtcbiAgICB9XG4gIH0pKCk7XG59Il19