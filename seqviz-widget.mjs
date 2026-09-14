// Import react/react-dom using the *exact same specifier* seqviz@3.10.24 uses
// internally for its peer deps (see its plain, un-pinned `https://esm.sh/seqviz@3.10.24`
// output), rather than a hardcoded version. esm.sh resolves identical specifiers to the
// same underlying module, so this stays in sync with whatever seqviz actually loads even
// as esm.sh's "latest matching" react/react-dom build changes over time. A hardcoded
// version (e.g. react@19.2.8) drifts out of sync with that floating resolution and loads
// a second copy of React alongside the one seqviz uses, which breaks at render time
// (this bit us once already). If you bump the seqviz version, re-derive this specifier
// from its new peerDependencies range.
import React from 'https://esm.sh/react@^16.8.6%20||%20^17.0.0%20||%20^18.0.0%20||%20^19.0.0?target=es2022';
import { createRoot } from 'https://esm.sh/react-dom@^16.8.6%20||%20^17.0.0%20||%20^18.0.0%20||%20^19.0.0/client?target=es2022';
import * as seqvizMod from 'https://esm.sh/seqviz@3.10.24';

// seqviz has no named ESM export on esm.sh, so resolve `.SeqViz` at runtime.
const SeqViz = seqvizMod.SeqViz ?? seqvizMod.default?.SeqViz ?? seqvizMod.default;

function render({ model, el }) {
  const seq = model.get('seq') || '';
  const name = model.get('name') || '';
  const annotations = model.get('annotations') || [];
  const viewer = model.get('viewer') || 'both';
  const height = model.get('height') || '600px';

  const container = document.createElement('div');
  container.style.height = typeof height === 'number' ? `${height}px` : height;
  el.appendChild(container);

  const reactRoot = createRoot(container);
  reactRoot.render(
    React.createElement(SeqViz, { name, seq, annotations, viewer, style: { height: '100%' } }),
  );

  return () => reactRoot.unmount();
}

export default { render };
