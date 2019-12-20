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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUFBLE1BQU0scUJBQXFCLEdBQ3ZCO0NBQ0gsQ0FBQztBQUVGLDJCQUE0QjtBQUM1QiwwREFBaUM7QUFFakMsTUFBTSxtQkFBbUIsR0FBRyxxQkFBcUIsQ0FBQztBQUNsRCx5REFBeUQ7QUFFekQsU0FBZSxNQUFNLENBQUMsUUFBZ0I7O1FBQ3BDLElBQUk7WUFDRixNQUFNLElBQUksR0FBRyxNQUFNLGFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDM0MsT0FBTyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUM7U0FDdkM7UUFBQyxXQUFNLEdBQUU7UUFDVixPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7Q0FBQTtBQWFELFNBQVMsaUJBQWlCLENBQUMsVUFBc0I7SUFDL0MsTUFBTSxRQUFRLEdBQVMsRUFBRSxDQUFDO0lBQzFCLE1BQU0sSUFBSSxHQUFHLENBQUMsR0FBUyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztJQUNoRCxLQUFLLE1BQU0sSUFBSSxJQUFJLFVBQVUsRUFBRTtRQUM3QixJQUFJLENBQUMsSUFBSSxFQUFFO1lBQUUsU0FBUztTQUFFO1FBQ3hCLElBQUksT0FBTyxJQUFJLEtBQUssUUFBUSxJQUFJLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLFFBQVEsRUFBRSxFQUFFLG9DQUFvQztZQUN4RyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3JCO2FBQU07WUFDTCxtRUFBbUU7WUFDbkUsUUFBUSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDO1NBQ3ZDO0tBQ0Y7SUFDRCxPQUFPLFFBQVEs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Q0FBQzthQUN6RDs7S0FDRixDQUFDLEVBQUUsQ0FBQztDQUNOIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgRE9XTkxPQURfSU5TVFJVQ1RJT05TID1cbiAgICBgRG93bmxvYWQgYW5kIHVuemlwIEptZGljdEZ1cmlnYW5hLmpzb24uZ3ogZnJvbSBodHRwczovL2dpdGh1Yi5jb20vRG91YmxldmlsL0ptZGljdEZ1cmlnYW5hLlxuYDtcblxuaW1wb3J0IHtwcm9taXNlc30gZnJvbSAnZnMnO1xuaW1wb3J0IHN0cmlwQm9tIGZyb20gJ3N0cmlwLWJvbSc7XG5cbmNvbnN0IFJBV19KTURJQ1RfRklMRU5BTUUgPSAnSm1kaWN0RnVyaWdhbmEuanNvbic7XG4vLyBjb25zdCBSQVdfSk1ORURJQ1RfRklMRU5BTUUgPSAnSm1uZWRpY3RGdXJpZ2FuYS5qc29uJztcblxuYXN5bmMgZnVuY3Rpb24gZmlsZU9rKGZpbGVuYW1lOiBzdHJpbmcpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBzdGF0ID0gYXdhaXQgcHJvbWlzZXMuc3RhdChmaWxlbmFtZSk7XG4gICAgcmV0dXJuIHN0YXQuaXNGaWxlKCkgJiYgc3RhdC5zaXplID4gMDtcbiAgfSBjYXRjaCB7fVxuICByZXR1cm4gZmFsc2U7XG59XG5cbmV4cG9ydCB0eXBlIFJ1YnkgPSB7XG4gIHJ1Ynk6IHN0cmluZzsgcnQ6IHN0cmluZztcbn07XG5leHBvcnQgdHlwZSBGdXJpZ2FuYSA9IHN0cmluZ3xSdWJ5O1xuZXhwb3J0IHR5cGUgRW50cnkgPSB7XG4gIGZ1cmlnYW5hOiBGdXJpZ2FuYVtdLFxuICByZWFkaW5nOiBzdHJpbmcsXG4gIHRleHQ6IHN0cmluZyxcbn07XG50eXBlIFdvcmQgPSBGdXJpZ2FuYVtdO1xuXG5mdW5jdGlvbiBub3JtYWxpemVGdXJpZ2FuYShjaGFyYWN0ZXJzOiBGdXJpZ2FuYVtdKTogRnVyaWdhbmFbXSB7XG4gIGNvbnN0IGZ1cmlnYW5hOiBXb3JkID0gW107XG4gIGNvbnN0IGxhc3QgPSAoYXJyOiBXb3JkKSA9PiBhcnJbYXJyLmxlbmd0aCAtIDFdO1xuICBmb3IgKGNvbnN0IGNoYXIgb2YgY2hhcmFjdGVycykge1xuICAgIGlmICghY2hhcikgeyBjb250aW51ZTsgfVxuICAgIGlmICh0eXBlb2YgY2hhciA9PT0gJ29iamVjdCcgfHwgdHlwZW9mIGxhc3QoZnVyaWdhbmEpICE9PSAnc3RyaW5nJykgeyAvLyBsYXN0KGZ1cmlnYW5hKSBtaWdodCBiZSB1bmRlZmluZWRcbiAgICAgIGZ1cmlnYW5hLnB1c2goY2hhcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHZpYSBkZSBNb3JnYW4gdGhlb3JlbSwgKGNoYXI9c3RyaW5nKSAmJiBsYXN0KG1lcmdlZCk9c3RyaW5nIGhlcmVcbiAgICAgIGZ1cmlnYW5hW2Z1cmlnYW5hLmxlbmd0aCAtIDFdICs9IGNoYXI7XG4gICAgfVxuICB9XG4gIHJldHVybiBmdXJpZ2FuYTtcbn1cblxuZnVuY3Rpb24gc2V0dGVyPEssIFY+KG1hcDogTWFwPEssIFZbXT4sIGtleTogSywgdmFsdWU6IFYpIHtcbiAgY29uc3QgaGl0ID0gbWFwLmdldChrZXkpO1xuICBpZiAoaGl0KSB7XG4gICAgaGl0LnB1c2godmFsdWUpO1xuICB9IGVsc2Uge1xuICAgIG1hcC5zZXQoa2V5LCBbdmFsdWVdKTtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2V0dXAoKTogUHJvbWlzZTx7cmVhZGluZ1RvRW50cnk6IE1hcDxzdHJpbmcsIEVudHJ5W10+OyB0ZXh0VG9FbnRyeTogTWFwPHN0cmluZywgRW50cnlbXT47fT4ge1xuICBpZiAoYXdhaXQgZmlsZU9rKFJBV19KTURJQ1RfRklMRU5BTUUpKSB7XG4gICAgdHlwZSBSYXdFbnRyeSA9IHt0ZXh0OiBzdHJpbmcsIHJlYWRpbmc6IHN0cmluZywgZnVyaWdhbmE6IHtydWJ5OiBzdHJpbmcsIHJ0Pzogc3RyaW5nfVtdfTtcbiAgICBjb25zdCByYXc6IFJhd0VudHJ5W10gPSBKU09OLnBhcnNlKHN0cmlwQm9tKGF3YWl0IHByb21pc2VzLnJlYWRGaWxlKFJBV19KTURJQ1RfRklMRU5BTUUsICd1dGY4JykpKTtcbiAgICBjb25zdCBlbnRyaWVzOiBFbnRyeVtdID0gcmF3Lm1hcChvID0+ICh7Li4ubywgZnVyaWdhbmE6IG8uZnVyaWdhbmEubWFwKCh7cnVieSwgcnR9KSA9PiBydCA/IHtydWJ5LCBydH0gOiBydWJ5KX0pKTtcblxuICAgIGNvbnN0IHRleHRUb0VudHJ5OiBNYXA8c3RyaW5nLCBFbnRyeVtdPiA9IG5ldyBNYXAoKTtcbiAgICBjb25zdCByZWFkaW5nVG9FbnRyeTogTWFwPHN0cmluZywgRW50cnlbXT4gPSBuZXcgTWFwKCk7XG4gICAgZm9yIChjb25zdCBlbnRyeSBvZiBlbnRyaWVzKSB7XG4gICAgICBjb25zdCB7dGV4dCwgcmVhZGluZ30gPSBlbnRyeTtcbiAgICAgIHNldHRlcih0ZXh0VG9FbnRyeSwgdGV4dCwgZW50cnkpO1xuICAgICAgc2V0dGVyKHJlYWRpbmdUb0VudHJ5LCByZWFkaW5nLCBlbnRyeSk7XG4gICAgfVxuICAgIHJldHVybiB7cmVhZGluZ1RvRW50cnksIHRleHRUb0VudHJ5fTtcbiAgfVxuICBjb25zb2xlLmVycm9yKERPV05MT0FEX0lOU1RSVUNUSU9OUyk7XG4gIHByb2Nlc3MuZXhpdCgxKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZ1cmlnYW5hVG9TdHJpbmcoZnM6IEZ1cmlnYW5hW10pOiBzdHJpbmcge1xuICBjb25zdCBzYWZlUmUgPSAvW1xce1xcfV0vO1xuICBpZiAoZnMuc29tZShmID0+IHNhZmVSZS50ZXN0KHR5cGVvZiBmID09PSAnc3RyaW5nJyA/IGYgOiBmLnJ1YnkgKyBmLnJ0KSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0Z1cmlnYW5hIGNvbnRhaW5zIHttYXJrdXB9Jyk7XG4gIH1cbiAgcmV0dXJuIGZzLm1hcChmID0+IHR5cGVvZiBmID09PSAnc3RyaW5nJyA/IGYgOiBgeyR7Zi5ydWJ5fX1eeyR7Zi5ydH19YCkuam9pbignJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdHJpbmdUb0Z1cmlnYW5hKHM6IHN0cmluZyk6IEZ1cmlnYW5hW10ge1xuICBjb25zdCBjaGFyczogRnVyaWdhbmFbXSA9IHMuc3BsaXQoJycpO1xuICBjb25zdCByZSA9IC97KC4rPyl9XFxeeyguKz8pfS9nO1xuICBsZXQgbWF0Y2g6IFJlZ0V4cE1hdGNoQXJyYXl8bnVsbDtcbiAgd2hpbGUgKG1hdGNoID0gcmUuZXhlYyhzKSkge1xuICAgIGNvbnN0IGluZGV4ID0gbWF0Y2guaW5kZXggfHwgMDsgLy8gVHlwZVNjcmlwdCBwYWNpZmljYXRpb25cbiAgICBjaGFyc1tpbmRleF0gPSB7cnVieTogbWF0Y2hbMV0sIHJ0OiBtYXRjaFsyXX07XG4gICAgZm9yIChsZXQgaSA9IGluZGV4ICsgMTsgaSA8IGluZGV4ICsgbWF0Y2hbMF0ubGVuZ3RoOyBpKyspIHsgY2hhcnNbaV0gPSAnJzsgfVxuICB9XG4gIHJldHVybiBub3JtYWxpemVGdXJpZ2FuYShjaGFycyk7XG59XG5cbmlmIChtb2R1bGUgPT09IHJlcXVpcmUubWFpbikge1xuICAoYXN5bmMgZnVuY3Rpb24gbWFpbigpIHtcbiAgICBjb25zdCB7dGV4dFRvRW50cnksIHJlYWRpbmdUb0VudHJ5fSA9IGF3YWl0IHNldHVwKCk7XG4gICAge1xuICAgICAgY29uc3QgcmVzID0gdGV4dFRvRW50cnkuZ2V0KCfmvKLlrZcnKTtcbiAgICAgIGNvbnNvbGUuZGlyKHJlcywge2RlcHRoOiBudWxsfSk7XG4gICAgfVxuICAgIHtcbiAgICAgIGNvbnN0IHJlcyA9IHJlYWRpbmdUb0VudHJ5LmdldCgn44Gg44GE44GZ44GNJyk7XG4gICAgICBjb25zb2xlLmRpcihyZXMsIHtkZXB0aDogbnVsbH0pO1xuICAgICAgY29uc29sZS5sb2coZnVyaWdhbmFUb1N0cmluZyhyZXM/LlswXS5mdXJpZ2FuYSB8fCBbXSApKTtcbiAgICB9XG4gIH0pKCk7XG59Il19