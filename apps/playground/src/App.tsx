import { RicherEditor } from '@bizjs/richer-editor';
import '@bizjs/richer-editor/styles.css';

import { INITIAL_DOCUMENT } from './content';

function App() {
  return (
    <main style={{ margin: '0 auto', width: '80%' }}>
      <RicherEditor
        aria-label="Richer Editor playground"
        defaultDocument={INITIAL_DOCUMENT}
        features={{
          bubbleMenu: true,
          focusMode: true,
          outline: true,
          search: true,
          slashMenu: true,
          toolbar: true,
        }}
        placeholder="Type / to insert a block…"
      />
    </main>
  );
}

export default App;
