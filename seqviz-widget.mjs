// These versions are pinned together deliberately: seqviz@3.10.24 resolves its
// react/react-dom peer deps to 19.2.8 on esm.sh. Importing react/react-dom separately
// at a different version here would load a second copy of React alongside the one
// seqviz uses internally, which breaks at render time. If you bump the seqviz version,
// re-check what react/react-dom version it resolves to (fetch the plain, un-pinned
// `https://esm.sh/seqviz@<version>` and follow its internal react/react-dom imports)
// and update these two imports to match.
import React from 'https://esm.sh/react@19.2.8';
import { createRoot } from 'https://esm.sh/react-dom@19.2.8/client';
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
