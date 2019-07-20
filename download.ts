import fetch from 'cross-fetch';
import {promises} from 'fs';

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
    return {url: asset.browser_download_url, tag: release.tag_name, filename: filename + release.tag_name};
  } else {
    throw new Error('failed to parse github response, `assets` needed');
  }
}

export async function saveLatest(url: string, filename: string, overwrite = true) {
  if (!overwrite) {
    try {
      const stat = await promises.stat(filename);
      if (stat.isFile() && stat.size > 0) { return; }
    } catch {}
  }
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

// 頑張る|がんばる|0:がん;1:ば
// 大人買い|おとながい|0-1:おとな;2:が
export function parse(raw: string) {
  const lines = raw.split('\n');
  const ret: Word[] = [];
  for (const line of lines) {
    if (!line) { continue; } // e.g., blank lines at end of file

    const [text, reading, rawFurigana] = line.split('|');
    if (!text || !reading || !rawFurigana) { throw new Error('failed to parse line ' + line); }

    const characters: Word = text.split(''); // we'll replace these with Ruby objects and possibly empty strings

    const rawFuriganas = rawFurigana.split(';');
    for (const f of rawFuriganas) {
      const [range, rt] = f.split(':'); // rt here means the reading that goes on top
      if (!range || !rt) { throw new Error('failed to split piece ' + f); }

      const [left, maybeRight] = range.split('-');
      const right = maybeRight || left; // `0:abc` is equivalent to `0-0:abc`
      const lo = parseInt(left);
      const hi = parseInt(right);
      characters[lo] = {ruby: text.slice(lo, hi + 1), rt};       // overwrite first character with Ruby object
      for (let i = lo + 1; i <= hi; i++) { characters[i] = ''; } // overwrite rest with empty strings
    }

    ret.push(characters.filter(x => !!x)); // remove empty strings
  }
  return ret;
}
