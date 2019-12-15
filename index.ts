const DOWNLOAD_INSTRUCTIONS =
    `Download and unzip JmdictFurigana.json.gz from https://github.com/Doublevil/JmdictFurigana.
`;

import {promises} from 'fs';
import stripBom from 'strip-bom';

const RAW_JMDICT_FILENAME = 'JmdictFurigana.json';
const READING_FILENAME = 'reading.ldjson';
const TEXT_FILENAME = 'text.ldjson';

// const JMNEDICT_FILENAME = 'JmnedictFurigana.json';

async function fileOk(filename: string) {
  try {
    const stat = await promises.stat(filename);
    return stat.isFile() && stat.size > 0;
  } catch {}
  return false;
}

export type Ruby = {
  ruby: string; rt: string;
};
export type Furigana = string|Ruby;
export type Entry = [string, string, Furigana[]];
type Word = Furigana[];

function normalizeFurigana(characters: Furigana[]): Furigana[] {
  const furigana: Word = [];
  const last = (arr: Word) => arr[arr.length - 1];
  for (const char of characters) {
    if (!char) { continue; }
    if (typeof char === 'object' || typeof last(furigana) !== 'string') { // last(furigana) might be undefined
      furigana.push(char);
    } else {
      // via de Morgan theorem, (char=string) && last(merged)=string here
      furigana[furigana.length - 1] += char;
    }
  }
  return furigana;
}

function setter<K, V>(map: Map<K, V[]>, key: K, value: V) {
  const hit = map.get(key);
  if (hit) {
    hit.push(value);
  } else {
    map.set(key, [value]);
  }
}

export async function setup(): Promise<{readingToEntry: Map<string, Entry[]>; textToEntry: Map<string, Entry[]>;}> {
  if ((await fileOk(READING_FILENAME)) && (await fileOk(TEXT_FILENAME))) {
    const fnameToMap = async (f: string) =>
        new Map((await promises.readFile(f, 'utf8')).split('\n').map(s => JSON.parse(s) as [string, Entry[]]));
    const readingToEntry = await fnameToMap(READING_FILENAME);
    const textToEntry = await fnameToMap(TEXT_FILENAME);
    return {readingToEntry, textToEntry};
  }
  if (await fileOk(RAW_JMDICT_FILENAME)) {
    type RawEntry = {text: string, reading: string, furigana: {ruby: string, rt?: string}[]};
    const raw: RawEntry[] = JSON.parse(stripBom(await promises.readFile(RAW_JMDICT_FILENAME, 'utf8')));
    const entries: Entry[] = raw.map(o => [o.text, o.reading, o.furigana.map(({ruby, rt}) => rt ? {ruby, rt} : ruby)]);

    const textToEntry: Map<string, Entry[]> = new Map();
    const readingToEntry: Map<string, Entry[]> = new Map();
    for (const entry of entries) {
      const [text, reading] = entry;
      setter(textToEntry, text, entry);
      setter(readingToEntry, reading, entry);
    }

    const mapToLdjson = (m: typeof textToEntry) => Array.from(m, o => JSON.stringify(o)).join('\n');
    promises.writeFile(READING_FILENAME, mapToLdjson(readingToEntry));
    promises.writeFile(TEXT_FILENAME, mapToLdjson(textToEntry));

    return {readingToEntry, textToEntry};
  }
  console.error(DOWNLOAD_INSTRUCTIONS);
  process.exit(1);
}

export function furiganaToString(fs: Furigana[]): string {
  const safeRe = /[\{\}]/;
  if (fs.some(f => safeRe.test(typeof f === 'string' ? f : f.ruby + f.rt))) {
    throw new Error('Furigana contains {markup}');
  }
  return fs.map(f => typeof f === 'string' ? f : `{${f.ruby}}^{${f.rt}}`).join('');
}

export function stringToFurigana(s: string): Furigana[] {
  const chars: Furigana[] = s.split('');
  const re = /{(.+?)}\^{(.+?)}/g;
  let match: RegExpMatchArray|null;
  while (match = re.exec(s)) {
    const index = match.index || 0; // TypeScript pacification
    chars[index] = {ruby: match[1], rt: match[2]};
    for (let i = index + 1; i < index + match[0].length; i++) { chars[i] = ''; }
  }
  return normalizeFurigana(chars);
}

if (module === require.main) {
  (async function main() {
    const {textToEntry, readingToEntry} = await setup();
    console.log(textToEntry.get('漢字'));
    console.log(readingToEntry.get('だいすき'))
  })();
}