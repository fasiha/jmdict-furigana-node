import fetch from 'cross-fetch';
import {promises, read} from 'fs';
import stripBom from 'strip-bom';

type Release = {
  assets: {name: string, browser_download_url: string}[],
  tag_name: string
};
type FileRelease = {
  url: string,
  tag: string,
  filename: string,
};
export async function getLatestURL(url = 'https://api.github.com/repos/Doublevil/JmdictFurigana/releases/latest',
                                   filename = 'JmdictFurigana.txt'): Promise<FileRelease> {
  const response = await fetch(url);
  if (!response.ok) { throw new Error('failed to find latest'); }
  const release: Release = await response.json();
  if ('assets' in release) {
    const asset = release.assets.filter(a => 'name' in a).find(a => a.name === filename);
    if (!asset) { throw new Error('failed to find filename') }
    return {url: asset.browser_download_url, tag: release.tag_name, filename: filename + '-' + release.tag_name};
  } else {
    throw new Error('failed to parse github response, `assets` needed');
  }
}

async function fileOk(filename: string) {
  try {
    const stat = await promises.stat(filename);
    return stat.isFile() && stat.size > 0;
  } catch {}
  return false;
}

export async function saveLatest(url: string, filename: string, overwrite = true) {
  if (!overwrite && fileOk(filename)) { return; }
  const response = await fetch(url);
  if (!response.ok) { throw new Error('failed to download file ' + url); }
  const raw = await response.text();
  return promises.writeFile(filename, raw);
}

type Ruby = {
  ruby: string; rt: string;
};
type Furigana = string|Ruby;
type Word = Furigana[];
type Entry = {
  furigana: Furigana[],
  reading: string,
  text: string,
};

// 頑張る|がんばる|0:がん;1:ば
// 大人買い|おとながい|0-1:おとな;2:が
export function parse(raw: string) {
  const lines = raw.split('\n');
  const ret: Entry[] = [];
  for (const line of lines) {
    if (!line) { continue; } // e.g., blank lines at end of file

    const [text, reading, rawFurigana] = line.split('|');
    if (!text || !reading || !rawFurigana) { throw new Error('failed to parse line ' + line); }

    const characters: Word = text.split(''); // we'll replace these with Ruby objects and possibly empty strings

    const rawFuriganas = rawFurigana.trim().split(';');
    for (const f of rawFuriganas) {
      const [range, rt] = f.split(':'); // rt here means the reading that goes on top
      if (!range || !rt) { throw new Error('failed to split piece ' + f); }

      const [left, maybeRight] = range.split('-');
      const lo = parseInt(left);
      const hi = parseInt(maybeRight || left);                   // `0:abc` is equivalent to `0-0:abc`
      characters[lo] = {ruby: text.slice(lo, hi + 1), rt};       // overwrite first character with Ruby object
      for (let i = lo + 1; i <= hi; i++) { characters[i] = ''; } // overwrite rest with empty strings
    }

    // merge `['s', 't', 'r', 'i', 'n', 'g', 's']` together into `['strings']`
    const furigana: Word = [];
    const last = (arr: Word) => arr[arr.length - 1];
    for (const char of characters) {
      if (typeof char === 'object' || typeof last(furigana) === 'object') {
        furigana.push(char);
      } else {
        // via de Morgan theorem, (char=string) && last(merged)=string here
        furigana[furigana.length - 1] += char;
      }
    }
    ret.push({text, reading, furigana});
  }
  return ret;
}

function setter<K, V>(map: Map<K, V[]>, key: K, value: V) {
  const hit = map.get(key);
  if (hit) {
    hit.push(value);
  } else {
    map.set(key, [value]);
  }
}

export async function getEntries() {
  const {url, filename} = await getLatestURL();
  await saveLatest(url, filename, false);
  const ldjson = filename + '.ldjson';
  let entries: Entry[];
  if (!fileOk(ldjson)) {
    const raw = stripBom(await promises.readFile(filename, 'utf8'));
    entries = parse(raw);
    await promises.writeFile(ldjson, entries.map(o => JSON.stringify(o)).join('\n'));
  } else {
    const raw = await promises.readFile(ldjson, 'utf8');
    entries = raw.split('\n').map(s => JSON.parse(s));
  }
  return entries;
}

export async function setup() {
  const entries = await getEntries();
  const textToEntry: Map<string, Entry[]> = new Map();
  const readingToEntry: Map<string, Entry[]> = new Map();
  for (const entry of entries) {
    const {reading, text} = entry;
    setter(textToEntry, text, entry);
    setter(readingToEntry, reading, entry);
  }
  return {textToEntry, readingToEntry};
}

if (module === require.main) {
  (async function main() {
    const {textToEntry, readingToEntry} = await setup();
    console.dir([textToEntry.get('漢字'), readingToEntry.get('だいすき')], {depth: null});
  })();
}