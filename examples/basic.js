import { renderMarkdown } from '../src/index.js';

const markdown = `# md-render

Render **Markdown** into HTML.

- small
- configurable
- no runtime dependencies`;

console.log(renderMarkdown(markdown));
