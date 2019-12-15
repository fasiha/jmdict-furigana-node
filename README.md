# JMDictFurigana for Node.js

This library makes it easy to do fast lookups into [JmdictFurigana](https://github.com/Doublevil/JmdictFurigana). See that page for lots of details—this page assumes you know what that project does.

## Install
1. In your Node.js module,
```
$ npm install https://github.com/fasiha/jmdict-furigana-node
```
2. Download the latest release of **JmdictFurigana.json.gz** from https://github.com/Doublevil/JmdictFurigana
3. Gunzip it to get `JmdictFurigana.json` (hint: on macOS and Unix, run `gunzip JmdictFurigana.json.gz` in the Terminal).

## API usage
First, import the module:
```js
import * as jmdict from 'jmdict-furigana-node';
```

### Types
The following types will be useful when reading the API docs below.

```ts
export type Ruby = {
  ruby: string; rt: string;
};

export type Furigana = string|Ruby;

export type Entry = [string, string, Furigana[]];
```

That is, an `Entry` is an array where
- the first string is the text (usually including kanji),
- the second the reading (including only kana),
- and an array of `Furigana`.

A `Furigana` in turn is either a string or a `Ruby` object.

Finally, a `Ruby` object has keys:
- `ruby`, the symbol text (usually kanji), and
- `rt`, the reading (usually kana).

### `setup(): Promise<{readingToEntry: Map<string, Entry[]>; textToEntry: Map<string, Entry[]>;}>`
Returns a promise that will resolve into an object containing two fields,
- `readingToEntry` and
- `textToEntry`,

each of which is an [ES2015 Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map), mapping a string (reading or kanji-like text, respectively) to an array of `Entry`s.

This function requires `JmdictFurigana.json` to be available in your project's root directory. It also saves
- `text.ldjson` and
- `reading.ldjson`,

two LDJSON (line-delimited JSON) files that it uses to speed up creation of the above two maps.

### `furiganaToString(fs: Furigana[]): string`
Convert an array of `Furigana` objects to a string.

### `stringToFurigana(s: string): Furigana[]`
The previous function's inverse.
