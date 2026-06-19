import assert from 'node:assert/strict';
import test from 'node:test';

import { renderMarkdown } from '../src/index.js';

test('renders headings and paragraphs', () => {
	const html = renderMarkdown('# Hello\n\nThis is **fine**.');

	assert.equal(html, '<h1 id="hello" tabindex="-1">Hello</h1>\n<p>This is <strong>fine</strong>.</p>');
});

test('renders ia writer page breaks', () => {
	const html = renderMarkdown('Before\n\n+++\n\nAfter');

	assert.equal(html, '<p>Before</p>\n<hr class="page-break">\n<p>After</p>');
});

test('renders ia writer page breaks before the next paragraph without a blank line', () => {
	const html = renderMarkdown('Before\n\n+++\nAfter');

	assert.equal(html, '<p>Before</p>\n<hr class="page-break">\n<p>After</p>');
});

test('does not render ia writer page breaks without a preceding blank line', () => {
	const html = renderMarkdown('Before\n+++\nAfter');

	assert.equal(html, '<p>Before\n+++\nAfter</p>');
});

test('does not render page breaks inside code fences', () => {
	const html = renderMarkdown('```\n+++\n```');

	assert.equal(html, '<pre><code>+++\n</code></pre>');
});

test('wraps single lines with <p>', () => {
	const html = renderMarkdown('What -- the way?');

	assert.equal(html, '<p>What &mdash; the way?</p>');
});

test('renders smart double quotes', () => {
	const html = renderMarkdown('"This is quoted," she said.');

	assert.equal(html, '<p>“This is quoted,” she said.</p>');
});

test('renders smart single quotes', () => {
	const html = renderMarkdown('\'This is quoted,\' she said.');

	assert.equal(html, '<p>‘This is quoted,’ she said.</p>');
});

test('renders smart apostrophes', () => {
	const html = renderMarkdown('It\'s Brandon\'s renderer.');

	assert.equal(html, '<p>It’s Brandon’s renderer.</p>');
});

test('renders ascii arrows', () => {
	assert.equal(renderMarkdown('A -> B'), '<p>A → B</p>');
	assert.equal(renderMarkdown('B <- A'), '<p>B ← A</p>');
	assert.equal(renderMarkdown('A <-> B'), '<p>A ↔ B</p>');
});

test('renders command key shortcuts', () => {
	assert.equal(renderMarkdown('cmd-s'), '<p>⌘-s</p>');
	assert.equal(renderMarkdown('Press Cmd Shift P'), '<p>Press ⌘ Shift P</p>');
	assert.equal(renderMarkdown('cmdlet'), '<p>cmdlet</p>');
});

test('renders circled number shortcuts', () => {
	const html = renderMarkdown('(1) Discover\n(2) Decide\n(10) Ship');

	assert.equal(html, '<p>① Discover\n② Decide\n⑩ Ship</p>');
});

test('renders en dashes for touching number ranges', () => {
	const html = renderMarkdown('Read pages 10-20 and 1999-2001, not phrase - phrase.');

	assert.equal(html, '<p>Read pages 10–20 and 1999–2001, not phrase - phrase.</p>');
});

test('renders ellipses', () => {
	const html = renderMarkdown('Wait... what?');

	assert.equal(html, '<p>Wait… what?</p>');
});

test('renders numbers-only multiplication and division shortcuts', () => {
	assert.equal(renderMarkdown('3*3'), '<p>3 × 3</p>');
	assert.equal(renderMarkdown('3/4'), '<p>3 ÷ 4</p>');
});

test('does not render spaced or non-numeric multiplication and division shortcuts', () => {
	assert.equal(renderMarkdown('3 * 3'), '<p>3 * 3</p>');
	assert.equal(renderMarkdown('3 / 4'), '<p>3 / 4</p>');
	assert.equal(renderMarkdown('a/b'), '<p>a/b</p>');
	assert.equal(renderMarkdown('path/to/file'), '<p>path/to/file</p>');
});

test('does not run typography replacements inside code spans', () => {
	const html = renderMarkdown('Use `--`, `...`, `3/4`, `3*3`, and `cmd` literally.');

	assert.equal(html, '<p>Use <code>--</code>, <code>...</code>, <code>3/4</code>, <code>3*3</code>, and <code>cmd</code> literally.</p>');
});

test('inline does not wrap single lines with <p>', () => {
	const html = renderMarkdown('What -- the way?', 'inline');

	assert.equal(html, 'What &mdash; the way?');
});

test('escapes html input', () => {
	const html = renderMarkdown('<script>alert("x")</script>');

	assert.equal(html, '<p>&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;</p>');
});

test('preserves existing html entities', () => {
	const html = renderMarkdown('Structuring your SaaS P&amp;L');

	assert.equal(html, '<p>Structuring your SaaS P&amp;L</p>');
});

test('renders links, emphasis, and inline code', () => {
	const html = renderMarkdown('Go to [docs](https://example.com) with `code` and _style_.');

	assert.equal(
		html,
		'<p>Go to <a href="https://example.com" target="_blank" rel="noopener noreferrer">docs</a> with <code>code</code> and <em>style</em>.</p>'
	);
});

test('renders external links with a blank target', () => {
	const html = renderMarkdown('[External](https://example.com)');

	assert.equal(html, '<p><a href="https://example.com" target="_blank" rel="noopener noreferrer">External</a></p>');
});

test('renders relative links without a blank target', () => {
	const html = renderMarkdown('[Internal](/page)');

	assert.equal(html, '<p><a href="/page">Internal</a></p>');
});

test('renders unordered and ordered lists', () => {
	assert.equal(renderMarkdown('- one\n- two'), '<ul><li>one</li><li>two</li></ul>');
	assert.equal(renderMarkdown('1. one\n2. two'), '<ol><li>one</li><li>two</li></ol>');
});

test('supports heading id', () => {
	assert.equal(renderMarkdown('## Hello World'), '<h2 id="hello-world" tabindex="-1">Hello World</h2>');
});

test('disambiguates repeated heading ids', () => {
	const html = renderMarkdown('## Same\n\n## Same\n\n### Same');

	assert.equal(html, '<h2 id="same" tabindex="-1">Same</h2>\n<h2 id="same-2" tabindex="-1">Same</h2>\n<h3 id="same-3" tabindex="-1">Same</h3>');
});

test('throws for non-string input', () => {
	assert.throws(() => renderMarkdown(42), /expects a string/);
});

test('renders marked text', () => {
	const html = renderMarkdown('Read ==this part==.');

	assert.equal(html, '<p>Read <mark>this part</mark>.</p>');
});

test('renders blockquotes with paragraph content', () => {
	const html = renderMarkdown('> Read ==this part==.');

	assert.equal(html, '<blockquote>\n<p>Read <mark>this part</mark>.</p>\n</blockquote>');
});

test('renders longer lists across multiple lines', () => {
	const html = renderMarkdown('- one\n- two\n- three');

	assert.equal(html, '<ul>\n<li>one</li>\n<li>two</li>\n<li>three</li>\n</ul>');
});

test('renders list items with paragraph children', () => {
	const markdown = `- First paragraph.

  Second paragraph in the same item.
- Another item.`;

	const html = renderMarkdown(markdown);

	assert.equal(html, `<ul>
<li>
<p>First paragraph.</p>
<p>Second paragraph in the same item.</p>
</li>
<li>Another item.</li>
</ul>`);
});

test('renders image blocks as figures with captions', () => {
	const html = renderMarkdown('![This is some alt text. And a caption.](/assets/2026-04-banner.jpg)');

	assert.equal(
		html,
		'<figure><img src="/assets/2026-04-banner.jpg" alt="This is some alt text. And a caption."><figcaption class="caption">This is some alt text. And a caption.</figcaption></figure>'
	);
});

test('renders footnote references in image alt captions', () => {
	const markdown = `![Chart[^1]](/chart.svg)

[^1]: Source note.`;

	const html = renderMarkdown(markdown);

	assert.equal(html, `<figure><img src="/chart.svg" alt="Chart. Source note 1."><figcaption class="caption">Chart<sup class="footnote-ref"><a href="#fn1" id="fnref1">1</a></sup></figcaption></figure>
<h2>Footnotes</h2>
<ol class="footnotes-list">
<li id="fn1" class="footnote-item"><p>Source note. <a href="#fnref1" class="footnote-backref">↩︎</a></p></li>
</ol>`);
});

test('renders fenced code blocks', () => {
	const html = renderMarkdown(`\`\`\`
this = 'some code';
that = {
	that: 'this'
}
\`\`\``);

	assert.equal(html, `<pre><code>this = 'some code';
that = {
	that: 'this'
}
</code></pre>`);
});

test('renders csv fenced blocks as tables', () => {
	const html = renderMarkdown(`\`\`\`csv
a,b,c
1,2,3
4,5,6
\`\`\``);

	assert.equal(html, `<table>
<thead>
<tr><th>a</th><th>b</th><th>c</th></tr>
</thead>
<tbody>
<tr><td>1</td><td>2</td><td>3</td></tr>
<tr><td>4</td><td>5</td><td>6</td></tr>
</tbody>
</table>`);
});

test('renders csv fenced blocks with quoted cells', () => {
	const html = renderMarkdown(`\`\`\`csv
name,note,count
Alpha,"hello, world",2
Beta,"He said ""hi""",
\`\`\``);

	assert.equal(html, `<table>
<thead>
<tr><th>name</th><th>note</th><th>count</th></tr>
</thead>
<tbody>
<tr><td>Alpha</td><td>hello, world</td><td>2</td></tr>
<tr><td>Beta</td><td>He said “hi”</td><td></td></tr>
</tbody>
</table>`);
});

test('does not auto-detect raw csv as a table', () => {
	const html = renderMarkdown(`a,b,c
1,2,3
4,5,6`);

	assert.equal(html, '<p>a,b,c\n1,2,3\n4,5,6</p>');
});

test('renders footnote references and definitions', () => {
	const markdown = `Read this[^1] and that[^2].

[^1]: [James Rosenquist](/links/1325930171/), Wikipedia.org.
[^2]: [Treat Big Tech like it's Tobacco](/links/1404623761/), The Argument.`;

	const html = renderMarkdown(markdown);

	assert.equal(html, `<p>Read this<sup class="footnote-ref"><a href="#fn1" id="fnref1">1</a></sup> and that<sup class="footnote-ref"><a href="#fn2" id="fnref2">2</a></sup>.</p>
<h2>Footnotes</h2>
<ol class="footnotes-list">
<li id="fn1" class="footnote-item"><p><a href="/links/1325930171/">James Rosenquist</a>, Wikipedia.org. <a href="#fnref1" class="footnote-backref">↩︎</a></p></li>
<li id="fn2" class="footnote-item"><p><a href="/links/1404623761/">Treat Big Tech like it’s Tobacco</a>, The Argument. <a href="#fnref2" class="footnote-backref">↩︎</a></p></li>
</ol>`);
});

test('leaves missing footnote references unchanged', () => {
	const html = renderMarkdown('Read this[^missing].');

	assert.equal(html, '<p>Read this[^missing].</p>');
});

test('renders markdown tables', () => {
	const markdown = `| Product initiatives | Technical initiatives |
|---------------------|-----------------------|
| Expand templates    | Optimise database     |
| Add analytics       | Centralise logs       |`;

	const html = renderMarkdown(markdown);

	assert.equal(html, `<table>
<thead>
<tr><th>Product initiatives</th><th>Technical initiatives</th></tr>
</thead>
<tbody>
<tr><td>Expand templates</td><td>Optimise database</td></tr>
<tr><td>Add analytics</td><td>Centralise logs</td></tr>
</tbody>
</table>`);
});

test('renders markdown table alignment', () => {
	const markdown = `| Left | Center | Right |
|:-----|:------:|------:|
| a    | b      | c     |`;

	const html = renderMarkdown(markdown);

	assert.equal(html, `<table>
<thead>
<tr><th style="text-align:left">Left</th><th style="text-align:center">Center</th><th style="text-align:right">Right</th></tr>
</thead>
<tbody>
<tr><td style="text-align:left">a</td><td style="text-align:center">b</td><td style="text-align:right">c</td></tr>
</tbody>
</table>`);
});

test('renders nested unordered lists', () => {
	const markdown = `- Startups with a high CAC Payback Period should deliver value quickly.
  - It is always better to deliver value sooner.
    - Every invoice before value increases churn risk.
- Startups with a low CAC Payback Period can ramp spend.`;

	const html = renderMarkdown(markdown);

	assert.equal(html, `<ul>
<li>Startups with a high CAC Payback Period should deliver value quickly.
<ul>
<li>It is always better to deliver value sooner.
<ul>
<li>Every invoice before value increases churn risk.</li>
</ul>
</li>
</ul>
</li>
<li>Startups with a low CAC Payback Period can ramp spend.</li>
</ul>`);
});

test('renders tab-indented nested unordered lists', () => {
	const markdown = `- NFTs are entries of data stored on a blockchain.
\t- Traditionally, tokens on blockchains have been fungible.
\t- Non-fungible tokens are unique.`;

	const html = renderMarkdown(markdown);

	assert.equal(html, `<ul>
<li>NFTs are entries of data stored on a blockchain.
<ul>
<li>Traditionally, tokens on blockchains have been fungible.</li>
<li>Non-fungible tokens are unique.</li>
</ul>
</li>
</ul>`);
});

test('renders nested ordered lists', () => {
	const markdown = `1. First
  1. First nested
  2. Second nested
2. Second`;

	const html = renderMarkdown(markdown);

	assert.equal(html, `<ol>
<li>First
<ol>
<li>First nested</li>
<li>Second nested</li>
</ol>
</li>
<li>Second</li>
</ol>`);
});

test('renders mixed nested lists', () => {
	const markdown = `1. First
  - Nested bullet
2. Second`;

	const html = renderMarkdown(markdown);

	assert.equal(html, `<ol>
<li>First
<ul>
<li>Nested bullet</li>
</ul>
</li>
<li>Second</li>
</ol>`);
});

test('renders asterisk unordered lists', () => {
	const markdown = `* Outcomes are the focus, rather than outputs.
* Ownership between teams and individuals is clear.`;

	const html = renderMarkdown(markdown);

	assert.equal(html, '<ul><li>Outcomes are the focus, rather than outputs.</li><li>Ownership between teams and individuals is clear.</li></ul>');
});

test('renders escaped markdown characters literally', () => {
	const html = renderMarkdown('\\*not italic\\* and \\[not a link](/page)');

	assert.equal(html, '<p>*not italic* and [not a link](/page)</p>');
});

test('renders autolinks', () => {
	const html = renderMarkdown('<https://example.com>');

	assert.equal(html, '<p><a href="https://example.com" target="_blank" rel="noopener noreferrer">https://example.com</a></p>');
});

test('renders strikethrough text', () => {
	const html = renderMarkdown('Keep ~~deleted~~ text.');

	assert.equal(html, '<p>Keep <del>deleted</del> text.</p>');
});

test('ignores html comments', () => {
	const html = renderMarkdown('Before\n\n<!-- editorial note -->\n\nAfter');

	assert.equal(html, '<p>Before</p>\n<p>After</p>');
});

test('renders blockquotes with blank quote lines and attribution', () => {
	const markdown = `> *"All models are wrong, but some are useful."*
>
> — George Box`;

	const html = renderMarkdown(markdown);

	assert.equal(html, '<blockquote>\n<p><em>&quot;All models are wrong, but some are useful.&quot;</em></p>\n<p>— George Box</p>\n</blockquote>');
});

test('renders images with empty alt text without captions', () => {
	const html = renderMarkdown('![](https://static.fastertimes.cloud/post-attachments/capacity-planning-step-1.svg)');

	assert.equal(html, '<figure><img src="https://static.fastertimes.cloud/post-attachments/capacity-planning-step-1.svg" alt=""></figure>');
});

test('renders image title text as a caption', () => {
	const html = renderMarkdown('![Alt text](/image.jpg "Caption text")');

	assert.equal(html, '<figure><img src="/image.jpg" alt="Alt text"><figcaption class="caption">Caption text</figcaption></figure>');
});

test('renders footnote references in image title captions', () => {
	const markdown = `![Chart](/chart.svg "Source[^1]")

[^1]: Source note.`;

	const html = renderMarkdown(markdown);

	assert.equal(html, `<figure><img src="/chart.svg" alt="Chart"><figcaption class="caption">Source<sup class="footnote-ref"><a href="#fn1" id="fnref1">1</a></sup></figcaption></figure>
<h2>Footnotes</h2>
<ol class="footnotes-list">
<li id="fn1" class="footnote-item"><p>Source note. <a href="#fnref1" class="footnote-backref">↩︎</a></p></li>
</ol>`);
});

test('allows safe image urls with query strings', () => {
	const html = renderMarkdown('![Chart](https://static.fastertimes.cloud/chart.svg?a=1&b=2)');

	assert.equal(html, '<figure><img src="https://static.fastertimes.cloud/chart.svg?a=1&amp;b=2" alt="Chart"><figcaption class="caption">Chart</figcaption></figure>');
});

test('renders tags metadata as a tag list', () => {
	const html = renderMarkdown('Tags: advice, startups, operations, technology');

	assert.equal(html, '<ul class="tags"><li>advice</li><li>startups</li><li>operations</li><li>technology</li></ul>');
});

test('filters dangerous link urls', () => {
	const html = renderMarkdown('[Bad](javascript:alert(1))');

	assert.equal(html, '<p>Bad</p>');
});

test('scopes duplicate footnote labels to their nearest article heading', () => {
	const markdown = `# Article One

Read this[^1].

[^1]: First article note.

# Article Two

Read that[^1].

[^1]: Second article note.`;

	const html = renderMarkdown(markdown);

	assert.equal(html, `<h1 id="article-one" tabindex="-1">Article One</h1>
<p>Read this<sup class="footnote-ref"><a href="#fn1" id="fnref1">1</a></sup>.</p>
<h2>Footnotes</h2>
<ol class="footnotes-list">
<li id="fn1" class="footnote-item"><p>First article note. <a href="#fnref1" class="footnote-backref">↩︎</a></p></li>
</ol>
<h1 id="article-two" tabindex="-1">Article Two</h1>
<p>Read that<sup class="footnote-ref"><a href="#fn1-2" id="fnref1-2">1</a></sup>.</p>
<h2>Footnotes</h2>
<ol class="footnotes-list">
<li id="fn1-2" class="footnote-item"><p>Second article note. <a href="#fnref1-2" class="footnote-backref">↩︎</a></p></li>
</ol>`);
});
