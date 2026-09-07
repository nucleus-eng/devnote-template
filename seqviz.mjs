import { readFileSync } from 'node:fs';
import * as seqparse from 'seqparse';

function collectNodes(tree, predicate, results = []) {
  if (predicate(tree)) results.push(tree);
  if (tree.children) tree.children.forEach((child) => collectNodes(child, predicate, results));
  return results;
}

const GITHUB_BLOB_URL = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/;

// Rewrite a normal "view file on GitHub" URL to the raw content URL, so authors
// can paste the link straight from their browser's address bar.
function toRawUrl(url) {
  const match = url.match(GITHUB_BLOB_URL);
  if (!match) return url;
  const [, owner, repo, ref, path] = match;
  return `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${path}`;
}

async function readSource(file) {
  if (/^https?:\/\//.test(file)) {
    const url = toRawUrl(file);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
    return res.text();
  }
  return readFileSync(file, 'utf8');
}

const seqVizDirective = {
  name: 'seqviz',
  doc: 'Render a GenBank/FASTA/SnapGene/JBEI/SBOL file with SeqViz.',
  arg: {
    type: String,
    doc: 'Path or URL (e.g. a GitHub file link) to the sequence file, parsed at build time with seqparse.',
  },
  options: {
    height: { type: String, doc: 'Height of the viewer (default 600px).' },
    viewer: { type: String, doc: 'linear | circular | both | both_flip (default both).' },
  },
  run(data) {
    return [
      {
        type: 'block',
        kind: 'seqviz',
        data: {
          import: './seqviz-widget.mjs',
          file: data.arg,
          viewer: data.options?.viewer ?? 'both',
          height: data.options?.height ?? '600px',
        },
        children: [],
      },
    ];
  },
};

const seqparseTransform = {
  name: 'seqviz-seqparse',
  doc: 'Parses an incoming sequence file and rewrites the block as a native anywidget node.',
  stage: 'document',
  plugin: () => async (tree) => {
    const nodes = collectNodes(tree, (n) => n.type === 'block' && n.kind === 'seqviz');
    await Promise.all(
      nodes.map(async (node) => {
        const { file, import: widgetImport, viewer, height } = node.data;
        try {
          const content = await readSource(file);
          const parsed = seqparse.parseFile(content);
          const { name, seq, annotations } = parsed[0] ?? {};
          // MyST's native anywidget renderer expects `type: "anywidget"` with `esm` + `model`.
          // `type: "block", kind: "anywidget"` is Curvenote-specific and silently does nothing
          // in standard mystmd/myst-theme.
          node.type = 'anywidget';
          node.esm = widgetImport;
          node.model = { name, seq, annotations, viewer, height };
          node.id = Math.random().toString(36).slice(2, 10);
          delete node.kind;
          delete node.data;
          delete node.children;
        } catch (err) {
          console.error(`[seqviz] failed to load ${file}: ${err.message}`);
        }
      }),
    );
  },
};

const plugin = {
  name: 'SeqViz Plugin for MyST Markdown',
  directives: [seqVizDirective],
  transforms: [seqparseTransform],
};

export default plugin;
