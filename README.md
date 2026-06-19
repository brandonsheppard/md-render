# md-render

Most Markdown renderers are very impressive pieces of software.

This is not trying to be one of them.

`md-render` is a small, dependency-free Markdown-to-HTML renderer for a specific kind of writing: essays, notes, articles, and archives that need predictable HTML with a few editorial conveniences baked in. It is not a CommonMark implementation. It is not a plugin system. It does not want to become a kitchen sink.

It renders the Markdown I actually write, with the quirks I actually want.

## Install

```sh
npm install md-render
```

## Use

```js
import { renderMarkdown } from 'md-render';

const html = renderMarkdown(`# You need more engineers

Most startups need more engineers, particularly in teams other than product development.

Tags: advice, startups, operations`);

console.log(html);
```

This returns:

```html
<h1 id="you-need-more-engineers" tabindex="-1">You need more engineers</h1>
<p>Most startups need more engineers, particularly in teams other than product development.</p>
<ul class="tags"><li>advice</li><li>startups</li><li>operations</li></ul>
```

There is one mode:

```js
renderMarkdown('This is **fine**.', 'inline');
```

Which returns:

```html
This is <strong>fine</strong>.
```

That is the whole API.

## What It Is For

Markdown is great until it becomes infrastructure.

You write a few posts. Then you add footnotes. Then you want images to be figures. Then you want smart quotes because straight quotes look like a spreadsheet got involved. Then you want headings to have IDs. Then you want CSV tables because writing pipe tables by hand is a punishment nobody deserves.

At this point, you can either bolt together a large parser, a handful of plugins, and a post-processing step, or you can use a small renderer that has opinions.

`md-render` chooses opinions.

## API

### `renderMarkdown(markdown)`

Renders a Markdown string into block HTML.

```js
renderMarkdown('# Hello\n\nThis is **Markdown**.');
```

```html
<h1 id="hello" tabindex="-1">Hello</h1>
<p>This is <strong>Markdown</strong>.</p>
```

Passing `null` or `undefined` returns an empty string. Passing anything other than a string throws a `TypeError`.

### `renderMarkdown(markdown, 'inline')`

Renders inline Markdown without wrapping the result in a paragraph.

```js
renderMarkdown('A -> B, but `3/4` stays literal.', 'inline');
```

```html
A → B, but <code>3/4</code> stays literal.
```

There are no options. This is deliberate.

## Block Features

### Headings

Headings render from `#` through `######`.

All headings get stable IDs and `tabindex="-1"`.

```md
## Startup leadership is about saying no to good ideas
```

```html
<h2 id="startup-leadership-is-about-saying-no-to-good-ideas" tabindex="-1">Startup leadership is about saying no to good ideas</h2>
```

Repeated headings are disambiguated:

```md
## Same
## Same
### Same
```

```html
<h2 id="same" tabindex="-1">Same</h2>
<h2 id="same-2" tabindex="-1">Same</h2>
<h3 id="same-3" tabindex="-1">Same</h3>
```

### Paragraphs

Plain text becomes paragraphs.

```md
Most software businesses sell tools.
```

```html
<p>Most software businesses sell tools.</p>
```

HTML input is escaped. Existing HTML entities are preserved.

### Lists

Unordered lists, ordered lists, nested lists, mixed lists, and list items with paragraph children are supported.

```md
- A good idea
- Another good idea
  - A smaller good idea

1. Start narrow
2. Win the market
3. Expand later
```

Compact two-item lists render compactly. Longer or nested lists render across multiple lines, which is easier to read in generated HTML.

List items can also contain paragraphs:

```md
- First paragraph.

  Second paragraph in the same item.
- Another item.
```

### Blockquotes

Blockquotes render as blockquotes with paragraph content.

```md
> All models are wrong, but some are useful.
>
> — George Box
```

```html
<blockquote>
<p>All models are wrong, but some are useful.</p>
<p>— George Box</p>
</blockquote>
```

### Fenced Code

Triple-backtick code fences render as escaped code blocks.

````md
```
this = 'some code';
that = {
	that: 'this'
}
```
````

```html
<pre><code>this = 'some code';
that = {
	that: 'this'
}
</code></pre>
```

Typography replacements do not run inside code fences or inline code.

### Markdown Tables

Pipe tables render as HTML tables.

```md
| Product initiatives | Technical initiatives |
|---------------------|-----------------------|
| Expand templates    | Optimise database     |
| Add analytics       | Centralise logs       |
```

Alignment is supported:

```md
| Left | Center | Right |
|:-----|:------:|------:|
| a    | b      | c     |
```

```html
<th style="text-align:left">Left</th>
<th style="text-align:center">Center</th>
<th style="text-align:right">Right</th>
```

### CSV Tables

CSV tables are supported when fenced as `csv`.

````md
```csv
a,b,c
1,2,3
4,5,6
```
````

```html
<table>
<thead>
<tr><th>a</th><th>b</th><th>c</th></tr>
</thead>
<tbody>
<tr><td>1</td><td>2</td><td>3</td></tr>
<tr><td>4</td><td>5</td><td>6</td></tr>
</tbody>
</table>
```

Raw CSV is not auto-detected. This is important because prose often contains commas, numbers, and lines that only look meaningful to an overeager parser.

Quoted CSV cells are supported, including doubled quotes.

### Images

Images render as figures.

```md
![Chart](/chart.svg)
```

```html
<figure><img src="/chart.svg" alt="Chart"><figcaption class="caption">Chart</figcaption></figure>
```

The alt text becomes the caption by default.

Footnote references work inside captions. The `figcaption` gets the linked reference, while the `alt` text gets readable fallback copy:

```md
![Chart[^1]](/chart.svg)

[^1]: Source note.
```

```html
<figure><img src="/chart.svg" alt="Chart. Source note 1."><figcaption class="caption">Chart<sup class="footnote-ref"><a href="#fn1" id="fnref1">1</a></sup></figcaption></figure>
```

An explicit title becomes the caption instead:

```md
![Alt text](/image.jpg "Caption text")
```

```html
<figure><img src="/image.jpg" alt="Alt text"><figcaption class="caption">Caption text</figcaption></figure>
```

Empty alt text renders no caption.

### Footnotes

Footnotes use the familiar reference syntax.

```md
Read this[^1].

[^1]: This is the footnote.
```

```html
<p>Read this<sup class="footnote-ref"><a href="#fn1" id="fnref1">1</a></sup>.</p>
<h2>Footnotes</h2>
<ol class="footnotes-list">
<li id="fn1" class="footnote-item"><p>This is the footnote. <a href="#fnref1" class="footnote-backref">↩︎</a></p></li>
</ol>
```

Footnotes are scoped per article section. In practice, this means each `# H1` starts a new footnote scope.

That matters if you keep a full archive in one Markdown file:

```md
# First Article

Read this[^1].

[^1]: First note.

# Second Article

Read that[^1].

[^1]: Second note.
```

Both articles can use `[^1]` without fighting each other.

Missing footnote definitions are left alone. A renderer should not invent certainty where none exists.

### Tags

Article metadata written as `Tags:` becomes a tag list.

```md
Tags: advice, startups, operations, technology
```

```html
<ul class="tags"><li>advice</li><li>startups</li><li>operations</li><li>technology</li></ul>
```

This is intentionally specific. It exists because article archives often end this way.

### Horizontal Rules

Markdown horizontal rules render as `<hr>`.

```md
---
```

```html
<hr>
```

### Page Breaks

iA Writer-style page breaks render as an `<hr>` with a print/export styling hook. Write three plus marks on a line by themselves, after an empty line.

```md
Before

+++

After
```

```html
<p>Before</p>
<hr class="page-break">
<p>After</p>
```

Use CSS like this when printing or exporting the HTML:

```css
.page-break {
	break-after: page;
}
```

### HTML Comments

HTML comments are ignored.

```md
Before

<!-- editorial note -->

After
```

```html
<p>Before</p>
<p>After</p>
```

## Inline Features

### Emphasis

```md
This is **strong**, _emphasised_, ==marked==, and ~~deleted~~.
```

```html
<p>This is <strong>strong</strong>, <em>emphasised</em>, <mark>marked</mark>, and <del>deleted</del>.</p>
```

### Inline Code

Inline code uses backticks.

```md
Use `path/to/file`, `3/4`, and `--` literally.
```

```html
<p>Use <code>path/to/file</code>, <code>3/4</code>, and <code>--</code> literally.</p>
```

Inline code is the escape hatch for paths, code, commands, and anything else that should not be made nicer by a typography pass.

### Links

Markdown links are supported.

```md
[External](https://example.com)
[Internal](/page)
```

External links open in a new window:

```html
<a href="https://example.com" target="_blank" rel="noopener noreferrer">External</a>
```

Relative links do not:

```html
<a href="/page">Internal</a>
```

Autolinks are also supported:

```md
<https://example.com>
```

Dangerous URLs, such as `javascript:` links, are filtered.

### Escapes

Backslash escapes keep Markdown characters literal.

```md
\*not italic\* and \[not a link](/page)
```

```html
<p>*not italic* and [not a link](/page)</p>
```

## Typography Replacements

This renderer has a point of view about text.

Straight quotes become nice quotes:

```md
"This is quoted," she said.
'This is quoted,' she said.
It's Brandon's renderer.
```

```html
“This is quoted,” she said.
‘This is quoted,’ she said.
It’s Brandon’s renderer.
```

ASCII arrows become real arrows:

```md
A -> B
B <- A
A <-> B
```

```html
A → B
B ← A
A ↔ B
```

Command key shortcuts become the command symbol:

```md
cmd-s
Cmd Shift P
```

```html
⌘-s
⌘ Shift P
```

Circled number shortcuts are supported from `(1)` through `(20)`:

```md
(1) Discover
(2) Decide
(10) Ship
```

```html
① Discover
② Decide
⑩ Ship
```

Touching numeric ranges get en dashes:

```md
Read pages 10-20 and 1999-2001.
```

```html
Read pages 10–20 and 1999–2001.
```

Ellipses become ellipses:

```md
Wait... what?
```

```html
Wait… what?
```

Numbers-only multiplication and division shortcuts become readable math:

```md
3*3
3/4
```

```html
3 × 3
3 ÷ 4
```

This only happens when the numbers touch. `3 * 3`, `3 / 4`, `a/b`, and `path/to/file` are left alone.

## Security Posture

`md-render` escapes raw HTML.

It also filters dangerous link URLs. For example, `javascript:` links are rendered as plain text rather than clickable anchors.

Links whose `href` starts with `/` are treated as relative and do not get `target="_blank"`. Everything else safe enough to render as a link gets `target="_blank"` and `rel="noopener noreferrer"`.

This does not make it a full HTML sanitizer. If you use the output in an unusual environment, you still need to understand that environment.

## What It Does Not Do

`md-render` does not try to parse all of Markdown.

It does not support plugins. It does not expose a pile of switches. It does not promise CommonMark compliance. It does not preserve arbitrary raw HTML. It does not auto-link your pet glossary. It does not try to infer tables from unfenced CSV.

This is a feature, not a gap.

The goal is not to accept every possible input. The goal is to make a known body of writing render cleanly, predictably, and without a dependency tree.

## Development

```sh
npm install
npm test
npm run lint
```

The package is ESM-only and requires Node 18 or newer.

There are no runtime dependencies.

## License

MIT.
