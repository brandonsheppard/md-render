const CIRCLED_NUMBERS = [
	'',
	'①',
	'②',
	'③',
	'④',
	'⑤',
	'⑥',
	'⑦',
	'⑧',
	'⑨',
	'⑩',
	'⑪',
	'⑫',
	'⑬',
	'⑭',
	'⑮',
	'⑯',
	'⑰',
	'⑱',
	'⑲',
	'⑳'
];

export function renderMarkdown (markdown, mode = 'block') {
	if (markdown == null) {
		return '';
	}

	if (typeof markdown !== 'string') {
		throw new TypeError('renderMarkdown expects a string');
	}

	const normalized = normalizeNewlines(markdown).trim();
	const documentState = createDocumentState();

	if (mode === 'inline') {
		return renderInline(normalized, createSectionState(documentState));
	}

	if (normalized === '') {
		return '';
	}

	return splitSections(normalized)
		.map((section, index) => renderSection(section, index, documentState))
		.filter((html) => html !== '')
		.join('\n');
}

function createDocumentState () {
	return {
		headingCounts: new Map()
	};
}

function createSectionState (documentState, index = 0) {
	return {
		documentState,
		footnotes: new Map(),
		footnoteOrder: [],
		footnoteNumbers: new Map(),
		suffix: index === 0 ? '' : `-${ index + 1 }`
	};
}

function normalizeNewlines (value) {
	return value.replace(/\r\n?/g, '\n');
}

function splitSections (markdown) {
	const lines = markdown.split('\n');
	const sections = [];
	let current = [];

	for (const line of lines) {
		if (/^#\s+/.test(line) && current.some((currentLine) => currentLine.trim() !== '')) {
			sections.push(current.join('\n').trim());
			current = [];
		}

		current.push(line);
	}

	if (current.some((line) => line.trim() !== '')) {
		sections.push(current.join('\n').trim());
	}

	return sections;
}

function renderSection (markdown, index, documentState) {
	const state = createSectionState(documentState, index);
	const content = extractFootnotes(markdown, state);
	const blocks = collectBlocks(content.split('\n'));
	const html = blocks.map((block) => renderBlock(block, state)).filter((block) => block !== '').join('\n');
	const footnotes = renderFootnotes(state);

	return footnotes ? `${ html }\n${ footnotes }` : html;
}

function extractFootnotes (markdown, state) {
	const lines = markdown.split('\n');
	const content = [];

	for (const line of lines) {
		const footnote = /^\[\^([^\]]+)]:\s*(.*)$/.exec(line);

		if (footnote) {
			state.footnotes.set(footnote[1], footnote[2]);
		} else {
			content.push(line);
		}
	}

	return content.join('\n').trim();
}

function collectBlocks (lines) {
	const blocks = [];
	let index = 0;

	while (index < lines.length) {
		const line = lines[index];

		if (line.trim() === '') {
			index += 1;
			continue;
		}

		if (isHtmlCommentLine(line)) {
			index += 1;
			continue;
		}

		if (line.trimStart().startsWith('```')) {
			const block = [ line ];
			index += 1;

			while (index < lines.length) {
				block.push(lines[index]);

				if (lines[index].trim() === '```') {
					index += 1;
					break;
				}

				index += 1;
			}

			blocks.push({ type: 'fence', lines: block });
			continue;
		}

		if (isListLine(line)) {
			const block = [ line ];
			index += 1;

			while (index < lines.length) {
				const next = lines[index];
				const after = lines[index + 1] || '';

				if (next.trim() === '') {
					if (isIndentedContinuation(after) || isListLine(after)) {
						block.push(next);
						index += 1;
						continue;
					}

					break;
				}

				if (isListLine(next) || isIndentedContinuation(next)) {
					block.push(next);
					index += 1;
					continue;
				}

				break;
			}

			blocks.push({ type: 'list', lines: block });
			continue;
		}

		if (isTableStart(lines, index)) {
			const block = [];

			while (index < lines.length && lines[index].includes('|') && lines[index].trim() !== '') {
				block.push(lines[index]);
				index += 1;
			}

			blocks.push({ type: 'table', lines: block });
			continue;
		}

		if (/^ {0,3}>/.test(line)) {
			const block = [];

			while (index < lines.length && (/^ {0,3}>/.test(lines[index]) || lines[index].trim() === '')) {
				block.push(lines[index]);
				index += 1;
			}

			blocks.push({ type: 'blockquote', lines: block });
			continue;
		}

		const block = [ line ];
		index += 1;

		while (index < lines.length && lines[index].trim() !== '') {
			if (isSpecialBlockStart(lines, index)) {
				break;
			}

			block.push(lines[index]);
			index += 1;
		}

		blocks.push({ type: 'text', lines: block });
	}

	return blocks;
}

function isSpecialBlockStart (lines, index) {
	return lines[index].trimStart().startsWith('```') ||
		isListLine(lines[index]) ||
		isTableStart(lines, index) ||
		/^ {0,3}>/.test(lines[index]) ||
		isHtmlCommentLine(lines[index]);
}

function isHtmlCommentLine (line) {
	return /^<!--.*-->$/.test(line.trim());
}

function isTableStart (lines, index) {
	return Boolean(lines[index]?.includes('|') && lines[index + 1] && isTableSeparator(lines[index + 1]));
}

function isTableSeparator (line) {
	return /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function isListLine (line) {
	return /^(\s*)(?:[-*+]|\d+[.)])\s+/.test(line);
}

function isIndentedContinuation (line) {
	return /^(\t| {2,})\S/.test(line);
}

function renderBlock (block, state) {
	const text = block.lines.join('\n');
	const trimmed = text.trim();

	if (/^ {0,3}(?:-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
		return '<hr>';
	}

	const heading = /^(#{1,6})\s+(.+)$/.exec(trimmed);
	if (heading) {
		return renderHeading(heading, state);
	}

	if (block.type === 'fence') {
		return renderFence(block.lines, state);
	}

	if (block.type === 'table') {
		return renderMarkdownTable(block.lines, state);
	}

	const tags = /^Tags:\s*(.+)$/.exec(trimmed);
	if (tags) {
		return renderTags(tags[1]);
	}

	const image = /^!\[((?:[^\]]|\[\^[^\]]+])*)]\((\S+?)(?:\s+"([^"]*)")?\)$/.exec(trimmed);
	if (image) {
		return renderImage(image, state);
	}

	if (block.type === 'blockquote') {
		const quote = block.lines
			.map((line) => line.replace(/^ {0,3}>\s?/, ''))
			.join('\n');
		return `<blockquote>\n${ renderNestedMarkdown(quote, state) }\n</blockquote>`;
	}

	if (block.type === 'list') {
		return renderList(block.lines, state);
	}

	const content = block.lines.map((line) => renderInline(line.trim(), state)).join('\n');
	return `<p>${ content }</p>`;
}

function renderHeading (heading, state) {
	const level = heading[1].length;
	const headingText = heading[2].replace(/\s+#+$/, '');
	const content = renderInline(headingText, state);

	const baseId = slugify(stripMarkdown(headingText));
	const count = (state.documentState.headingCounts.get(baseId) || 0) + 1;
	state.documentState.headingCounts.set(baseId, count);
	const id = count === 1 ? baseId : `${ baseId }-${ count }`;

	return `<h${ level } id="${ id }" tabindex="-1">${ content }</h${ level }>`;
}

function renderNestedMarkdown (markdown, state) {
	return collectBlocks(markdown.trim().split('\n'))
		.map((block) => renderBlock(block, state))
		.filter((block) => block !== '')
		.join('\n');
}

function renderFence (lines, state) {
	const opening = /^```\s*([A-Za-z0-9_-]+)?\s*$/.exec(lines[0].trim());
	const language = opening?.[1] || '';
	const closingIndex = lines.findIndex((line, index) => index > 0 && line.trim() === '```');
	const contentLines = closingIndex === -1 ? lines.slice(1) : lines.slice(1, closingIndex);
	const content = contentLines.join('\n');

	if (language.toLowerCase() === 'csv') {
		return renderCsvTable(content, state);
	}

	const className = language ? ` class="language-${ escapeAttribute(language) }"` : '';
	return `<pre><code${ className }>${ escapeHtml(content) }\n</code></pre>`;
}

function renderImage (image, state) {
	const alt = renderAltText(image[1], state);
	const src = escapeAttribute(image[2]);
	const caption = image[3] ? renderInline(image[3], state) : renderInline(image[1], state);

	if (stripTags(caption) === '') {
		return `<figure><img src="${ src }" alt="${ alt }"></figure>`;
	}

	return `<figure><img src="${ src }" alt="${ alt }"><figcaption class="caption">${ caption }</figcaption></figure>`;
}

function renderTags (value) {
	const tags = value.split(',').map((tag) => tag.trim()).filter((tag) => tag !== '');
	return `<ul class="tags">${ tags.map((tag) => `<li>${ escapeHtml(tag) }</li>`).join('') }</ul>`;
}

function renderMarkdownTable (lines, state) {
	const headers = splitTableRow(lines[0]);
	const alignments = splitTableRow(lines[1]).map(getAlignment);
	const rows = lines.slice(2).map(splitTableRow);

	return renderTable(headers, rows, alignments, state);
}

function splitTableRow (line) {
	return line
		.trim()
		.replace(/^\|/, '')
		.replace(/\|$/, '')
		.split('|')
		.map((cell) => cell.trim());
}

function getAlignment (cell) {
	const trimmed = cell.trim();

	if (trimmed.startsWith(':') && trimmed.endsWith(':')) {
		return 'center';
	}

	if (trimmed.startsWith(':')) {
		return 'left';
	}

	if (trimmed.endsWith(':')) {
		return 'right';
	}

	return '';
}

function renderCsvTable (content, state) {
	const rows = parseCsv(content).filter((row) => row.some((cell) => cell !== ''));
	const headers = rows[0] || [];

	return renderTable(headers, rows.slice(1), [], state);
}

function parseCsv (content) {
	const rows = [];
	let row = [];
	let cell = '';
	let quoted = false;

	for (let index = 0; index < content.length; index += 1) {
		const char = content[index];
		const next = content[index + 1];

		if (char === '"' && quoted && next === '"') {
			cell += '"';
			index += 1;
			continue;
		}

		if (char === '"') {
			quoted = !quoted;
			continue;
		}

		if (char === ',' && !quoted) {
			row.push(cell);
			cell = '';
			continue;
		}

		if (char === '\n' && !quoted) {
			row.push(cell);
			rows.push(row);
			row = [];
			cell = '';
			continue;
		}

		cell += char;
	}

	row.push(cell);
	rows.push(row);

	return rows;
}

function renderTable (headers, rows, alignments, state) {
	const head = headers.map((cell, index) => {
		const style = alignments[index] ? ` style="text-align:${ alignments[index] }"` : '';
		return `<th${ style }>${ renderInline(cell, state) }</th>`;
	}).join('');
	const body = rows.map((row) => {
		const cells = headers.map((_header, index) => {
			const style = alignments[index] ? ` style="text-align:${ alignments[index] }"` : '';
			return `<td${ style }>${ renderInline(row[index] || '', state) }</td>`;
		}).join('');

		return `<tr>${ cells }</tr>`;
	}).join('\n');

	return `<table>
<thead>
<tr>${ head }</tr>
</thead>
<tbody>
${ body }
</tbody>
</table>`;
}

function renderList (lines, state) {
	const tree = parseList(lines);
	const compact = isCompactList(tree);

	return renderListNode(tree, state, compact);
}

function parseList (lines) {
	const root = {
		type: getListType(lines.find((line) => isListLine(line)) || '- '),
		items: []
	};
	const stack = [ { level: 0, list: root, item: null } ];
	let currentItem = null;
	let pendingBlank = false;

	for (const line of lines) {
		if (line.trim() === '') {
			pendingBlank = true;
			continue;
		}

		const item = parseListLine(line);

		if (item) {
			while (stack.length > 1 && item.level < stack[stack.length - 1].level) {
				stack.pop();
			}

			let parent = stack[stack.length - 1];

			if (item.level > parent.level + 1) {
				item.level = parent.level + 1;
			}

			if (item.level > parent.level) {
				const list = {
					type: item.type,
					items: []
				};

				if (parent.item) {
					parent.item.children.push(list);
				}

				parent = {
					level: item.level,
					list,
					item: null
				};
				stack.push(parent);
			}

			if (parent.list.type !== item.type && parent.list.items.length === 0) {
				parent.list.type = item.type;
			}

			currentItem = {
				paragraphs: [ [ item.content ] ],
				children: []
			};
			parent.list.items.push(currentItem);
			parent.item = currentItem;
			stack[stack.length - 1] = parent;
			pendingBlank = false;
			continue;
		}

		if (currentItem) {
			const content = line.trim();

			if (pendingBlank) {
				currentItem.paragraphs.push([ content ]);
			} else {
				currentItem.paragraphs[currentItem.paragraphs.length - 1].push(content);
			}
		}

		pendingBlank = false;
	}

	return root;
}

function parseListLine (line) {
	const match = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(line);

	if (!match) {
		return null;
	}

	return {
		level: getIndentLevel(match[1]),
		type: /^\d/.test(match[2]) ? 'ol' : 'ul',
		content: match[3].trim()
	};
}

function getIndentLevel (indent) {
	return Math.floor(indent.replace(/\t/g, '  ').length / 2);
}

function getListType (line) {
	return /^\s*\d/.test(line) ? 'ol' : 'ul';
}

function isCompactList (list) {
	return list.items.length <= 2 && list.items.every((item) => {
		return item.children.length === 0 &&
			item.paragraphs.length === 1 &&
			item.paragraphs[0].length === 1;
	});
}

function renderListNode (list, state, compact = false) {
	const items = list.items.map((item) => renderListItem(item, state, compact)).join(compact ? '' : '\n');

	if (compact) {
		return `<${ list.type }>${ items }</${ list.type }>`;
	}

	return `<${ list.type }>\n${ items }\n</${ list.type }>`;
}

function renderListItem (item, state, compact) {
	const paragraphs = item.paragraphs.map((paragraph) => paragraph.join('\n').trim());

	if (paragraphs.length > 1) {
		const content = paragraphs.map((paragraph) => `<p>${ renderInline(paragraph, state) }</p>`).join('\n');
		const children = item.children.map((child) => renderListNode(child, state)).join('\n');
		return `<li>\n${ content }${ children ? `\n${ children }` : '' }\n</li>`;
	}

	const text = renderInline(paragraphs[0] || '', state);
	const children = item.children.map((child) => renderListNode(child, state)).join('\n');

	if (children) {
		return `<li>${ text }\n${ children }\n</li>`;
	}

	if (compact) {
		return `<li>${ text }</li>`;
	}

	return `<li>${ text }</li>`;
}

function renderInline (value, state) {
	const stash = [];
	function store (content) {
		const token = `\u0000${ stash.length }\u0000`;
		stash.push(content);
		return token;
	}
	let html = value;

	html = html.replace(/`([^`]+)`/g, (_match, content) => store(`<code>${ escapeHtml(content) }</code>`));
	html = html.replace(/\\([\\`*_[\]()])/g, (_match, char) => store(escapeHtml(char)));
	html = escapeHtml(html);

	html = html.replace(/&lt;(https?:\/\/[^&]+)&gt;/g, (_match, href) => store(renderLink(href, href, state)));
	html = html.replace(/\[([^\]]+)]\(((?:[^()\s]+|\([^)]*\))+)\)/g, (_match, label, href) => {
		const renderedLabel = renderInline(label, state);
		const link = renderLink(renderedLabel, href);

		return link === renderedLabel ? store(renderedLabel) : store(link);
	});
	html = html.replace(/\[\^([^\]]+)]/g, (match, id) => {
		return state.footnotes.has(id) ? store(renderFootnoteRef(id, state)) : match;
	});
	html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');
	html = html.replace(/==(.+?)==/g, '<mark>$1</mark>');
	html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
	html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
	html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
	html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
	html = applyTypography(html);
	html = html.replace(/"/g, '&quot;');

	for (const [ index, content ] of stash.entries()) {
		html = html.replaceAll(`\u0000${ index }\u0000`, content);
	}

	return html;
}

function renderLink (label, href) {
	const cleanHref = href.trim();

	if (!isSafeHref(cleanHref)) {
		return label;
	}

	const target = isRelativeHref(cleanHref) ? '' : ' target="_blank" rel="noopener noreferrer"';
	return `<a href="${ escapeAttribute(cleanHref) }"${ target }>${ label }</a>`;
}

function isSafeHref (href) {
	return !/^\s*javascript:/i.test(href);
}

function isRelativeHref (href) {
	return href.startsWith('/');
}

function renderAltText (value, state) {
	return stripTags(renderInline(value, state).replace(/<sup class="footnote-ref"><a href="#fn\d+(?:-\d+)?" id="fnref(\d+)(?:-\d+)?">\d+<\/a><\/sup>/g, '. Source note $1.'));
}

function renderFootnoteRef (id, state) {
	if (!state.footnoteNumbers.has(id)) {
		state.footnoteNumbers.set(id, state.footnoteOrder.length + 1);
		state.footnoteOrder.push(id);
	}

	const number = state.footnoteNumbers.get(id);
	const suffix = state.suffix;
	return `<sup class="footnote-ref"><a href="#fn${ number }${ suffix }" id="fnref${ number }${ suffix }">${ number }</a></sup>`;
}

function renderFootnotes (state) {
	if (state.footnoteOrder.length === 0) {
		return '';
	}

	const items = state.footnoteOrder.map((id) => {
		const number = state.footnoteNumbers.get(id);
		const suffix = state.suffix;
		const content = renderInline(state.footnotes.get(id), state);
		return `<li id="fn${ number }${ suffix }" class="footnote-item"><p>${ content } <a href="#fnref${ number }${ suffix }" class="footnote-backref">↩︎</a></p></li>`;
	}).join('\n');

	return `<h2>Footnotes</h2>
<ol class="footnotes-list">
${ items }
</ol>`;
}

function applyTypography (value) {
	return value
		.replace(/&lt;-&gt;/g, '↔')
		.replace(/-&gt;/g, '→')
		.replace(/&lt;-/g, '←')
		.replace(/(\d+)\/(\d+)/g, '$1 ÷ $2')
		.replace(/(\d+)\*(\d+)/g, '$1 × $2')
		.replace(/\b(\d+)-(\d+)\b/g, '$1–$2')
		.replace(/\((\d{1,2})\)/g, (match, number) => CIRCLED_NUMBERS[Number(number)] || match)
		.replace(/\.\.\./g, '…')
		.replace(/--/g, '&mdash;')
		.replace(/([A-Za-z])'([A-Za-z])/g, '$1’$2')
		.replace(/(^|[\s[{])"([^"]+?)"/g, '$1“$2”')
		.replace(/(^|[\s[{])'([^']+?)'/g, '$1‘$2’');
}

function stripTags (value) {
	return value.replace(/<[^>]+>/g, '');
}

function stripMarkdown (value) {
	return value
		.replace(/`([^`]+)`/g, '$1')
		.replace(/[*_~#[\]()]/g, '')
		.trim();
}

function slugify (value) {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, '')
		.trim()
		.replace(/\s+/g, '-');
}

function escapeHtml (value) {
	return value
		.replace(/&(?!(?:[A-Za-z][A-Za-z0-9]+|#\d+|#x[\dA-Fa-f]+);)/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

function escapeAttribute (value) {
	return escapeHtml(value)
		.replace(/"/g, '&quot;')
		.replace(/`/g, '&#96;');
}
