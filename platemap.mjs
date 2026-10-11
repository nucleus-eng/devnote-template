// `{platemap}` embeds a Nucleus platemap CSV/TSV as an interactive 96- or
// 384-well plate map, the same way `{seqviz}` embeds a sequence file:
//
//   :::{platemap} ./experiments/build-platemap.csv
//   :height: 560px
//   :fields: [ATC] (uM), [TetR] (nM), [plamGFP] (nM)
//   :wells: 384
//   :::
//
// `fields` is optional: a comma-separated list of exact column names to show
// on hover, in that order. Without it, the default is the first three columns
// outside the required/recommended schema below, in header order -- a fine
// default when those happen to be the composition columns, but a platemap
// with non-composition metadata before them (e.g. a `Group` or `Condition`
// column) needs `fields` to name the ones that actually vary by well.
//
// `wells` is optional: 96 (default, inferred from the widest well actually
// used if omitted) or 384. A 384-well plate renders as one dense 16x24 grid.
// At that cell size the per-well text code used on a 96-well plate (the
// colorblind-safety measure -- see `platemap-widget.mjs`) stops being
// legible, so 384 layouts fall back to a line-pattern fill per `Type`
// instead, with identity still exact on hover. Two options were prototyped
// against a synthetic 384-well plate (test/platemap-384-options/, not
// committed): texture, chosen here, and faceting into four 96-well quadrants
// (reuses the 96-well rendering untouched, at the cost of four panels
// instead of one). Revisit faceting if the texture reads too weakly in
// practice -- it was the untested tradeoff at decision time.
//
// The directive stores the raw path/URL at parse time; the transform below
// reads and parses the file at build time and rewrites the node into a
// native anywidget node that `platemap-widget.mjs` renders in the browser.
// Column names and the `Type` vocabulary follow
// `nucleus-devnote-archive-1/devnotes/2026-bhasin-platemaps/main.md`, ported
// into `nucleus-skills`' `build-platemap` skill as `platemap_common.py` --
// keep the two lists below in sync with that source if it changes.
//
// mystmd resolves an anywidget's `esm` path against the *document's* folder,
// not the plugin's (myst-cli's `getSourceFolder`, in `transforms/anywidgets.js`
// upstream) -- so `./platemap-widget.mjs` only resolves if each devnote that
// embeds `{platemap}` keeps its own copy of `platemap-widget.mjs` beside its
// `main.md`, the same way `{seqviz}` devnotes each carry their own copy of
// `seqviz-widget.mjs`. Confirmed in `test/platemap-viewer/` by building
// without the copy (fails: "Cannot find asset for 'esm'") and then with it.
import { readFileSync } from 'node:fs';

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

function detectDelimiter(file, text) {
  if (/\.(tsv|tab)$/i.test(file)) return '\t';
  if (/\.csv$/i.test(file)) return ',';
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  const tabs = (firstLine.match(/\t/g) ?? []).length;
  const commas = (firstLine.match(/,/g) ?? []).length;
  return tabs > commas ? '\t' : ',';
}

// Minimal RFC4180-style reader: quoted fields, embedded delimiters, "" escapes.
function parseDelimited(text, delimiter) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const pushField = () => { row.push(field); field = ''; };
  const pushRow = () => { pushField(); rows.push(row); row = []; };
  for (let i = 0; i < normalized.length; i++) {
    const c = normalized[i];
    if (inQuotes) {
      if (c === '"') {
        if (normalized[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === delimiter) {
      pushField();
    } else if (c === '\n') {
      pushRow();
    } else {
      field += c;
    }
  }
  if (field.length || row.length) pushRow();
  return rows.filter((r) => !(r.length === 1 && r[0] === ''));
}

function rowsToObjects(rows) {
  const [header, ...body] = rows;
  return body.map((cells) => Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ''])));
}

// `platemap_common.PLATEMAP_COLUMNS` (required + recommended): everything
// else in the header is a composition field.
const REQUIRED_COLUMNS = ['Date', 'Experiment', 'Well', 'Name', 'Type'];
const SHARED_COLUMNS = [...REQUIRED_COLUMNS, 'Rxn Volume (uL)'];

// 96 and 384 only for now -- 1536 (`platemap_common.PLATES`'s third size)
// would also need double-letter rows (AA..AF), not handled here yet.
const PLATES = {
  96: { lastRow: 'H', cols: 12 },
  384: { lastRow: 'P', cols: 24 },
};

const WELL_RE = /^([A-Pa-p])0?(\d{1,2})$/;
function parseWell(well) {
  const m = String(well ?? '').trim().match(WELL_RE);
  if (!m) return null;
  const col = parseInt(m[2], 10);
  if (col < 1 || col > 24) return null;
  return { row: m[1].toUpperCase(), col };
}

// Without an explicit `:wells:`, infer the plate size from the widest well
// actually used: anything past H or 12 means this is (at least) a 384.
function inferPlateSize(positions) {
  const overflows96 = positions.some((p) => p.row > PLATES[96].lastRow || p.col > PLATES[96].cols);
  return overflows96 ? 384 : 96;
}

// A minimal inline stand-in for myst-common's `normalizeLabel`: a plugin
// loaded by path (not an npm dependency of the host project) can't `import`
// from mystmd's own packages, so a directive that wants `:label:` support
// has to do this normalization itself. Matches upstream closely enough for
// cross-reference resolution to work: see `myst-directives`'
// `labelDirectiveOption`/`addLabelOptions`, which do this for directives
// that ARE mystmd-internal.
function normalizeLabel(label) {
  if (!label) return undefined;
  const identifier = label
    .replace(/[\t\n\r ]+/g, ' ')
    .replace(/['‘’"“”]+/g, '')
    .trim()
    .toLowerCase();
  return { identifier, label };
}

const platemapDirective = {
  name: 'platemap',
  doc: 'Render a Nucleus platemap CSV/TSV as an interactive 96- or 384-well plate map.',
  arg: {
    type: String,
    doc: 'Path or URL (e.g. a GitHub file link) to the platemap CSV/TSV, parsed at build time.',
  },
  options: {
    height: { type: String, doc: 'Height of the viewer (default 560px).' },
    fields: {
      type: String,
      doc: 'Comma-separated exact column names to show on hover, in order. Default: the first three columns outside the required/recommended schema.',
    },
    label: {
      type: String,
      alias: ['name'],
      doc: 'Label the plate map to be cross-referenced or linked to, e.g. {ref}`my-label`.',
    },
    wells: {
      type: String,
      doc: '96 or 384. Default: inferred from the widest well actually used in the file.',
    },
  },
  run(data) {
    const node = {
      type: 'block',
      kind: 'platemap',
      data: {
        import: './platemap-widget.mjs',
        file: data.arg,
        height: data.options?.height ?? '560px',
        fields: data.options?.fields,
        wells: data.options?.wells,
      },
      children: [],
    };
    const normalized = normalizeLabel(data.options?.label);
    if (normalized) {
      node.identifier = normalized.identifier;
      node.label = normalized.label;
    }
    return [node];
  },
};

const platemapTransform = {
  name: 'platemap-parse',
  doc: 'Parses an incoming platemap CSV/TSV and rewrites the block as a native anywidget node.',
  stage: 'document',
  plugin: () => async (tree) => {
    const nodes = collectNodes(tree, (n) => n.type === 'block' && n.kind === 'platemap');
    await Promise.all(
      nodes.map(async (node) => {
        const { file, import: widgetImport, height, fields, wells: wellsOption } = node.data;
        try {
          const text = await readSource(file);
          const delimiter = detectDelimiter(file, text);
          const rows = rowsToObjects(parseDelimited(text, delimiter));
          if (!rows.length) throw new Error('no data rows found');
          const header = Object.keys(rows[0]);
          const missing = REQUIRED_COLUMNS.filter((c) => !header.includes(c));
          if (missing.length) throw new Error(`missing required column(s): ${missing.join(', ')}`);

          let compositionColumns;
          if (fields) {
            const requested = fields.split(',').map((f) => f.trim()).filter(Boolean);
            const unknown = requested.filter((f) => !header.includes(f));
            if (unknown.length) {
              console.error(`[platemap] :fields: names not in ${file}'s header, skipping: ${unknown.join(', ')}`);
            }
            compositionColumns = requested.filter((f) => header.includes(f));
          } else {
            compositionColumns = header.filter((c) => !SHARED_COLUMNS.includes(c)).slice(0, 3);
          }
          const experiment = rows[0].Experiment ?? '';

          const parsed = rows.map((r) => ({ row: r, pos: parseWell(r.Well) }));
          const unreadable = parsed.filter((p) => !p.pos);
          for (const { row: r } of unreadable) {
            console.error(`[platemap] skipping row with unreadable Well "${r.Well}" in ${file}`);
          }

          let plateSize = parseInt(wellsOption, 10);
          if (plateSize !== 96 && plateSize !== 384) {
            if (wellsOption) {
              console.error(`[platemap] :wells: must be 96 or 384, got "${wellsOption}" in ${file} -- inferring instead`);
            }
            plateSize = inferPlateSize(parsed.filter((p) => p.pos).map((p) => p.pos));
          }
          const bounds = PLATES[plateSize];

          const wells = [];
          for (const { row: r, pos } of parsed) {
            if (!pos) continue;
            if (pos.row > bounds.lastRow || pos.col > bounds.cols) {
              console.error(`[platemap] skipping Well "${r.Well}" in ${file}: outside the ${plateSize}-well plate`);
              continue;
            }
            wells.push({
              row: pos.row,
              col: pos.col,
              type: (r.Type ?? '').trim(),
              name: r.Name ?? '',
              fields: compositionColumns.map((c) => ({ label: c, value: r[c] ?? '' })),
            });
          }

          // MyST's native anywidget renderer expects `type: "anywidget"` with `esm` + `model`.
          // `type: "block", kind: "anywidget"` is Curvenote-specific and silently does nothing
          // in standard mystmd/myst-theme.
          node.type = 'anywidget';
          node.esm = widgetImport;
          node.model = { experiment, wells, height, plateSize };
          node.id = Math.random().toString(36).slice(2, 10);
          delete node.kind;
          delete node.data;
          delete node.children;
        } catch (err) {
          console.error(`[platemap] failed to load ${file}: ${err.message}`);
        }
      }),
    );
  },
};

const plugin = {
  name: 'Platemap Plugin for MyST Markdown',
  directives: [platemapDirective],
  transforms: [platemapTransform],
};

export default plugin;
