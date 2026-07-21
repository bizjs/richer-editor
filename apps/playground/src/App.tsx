import { RicherEditor } from "@bizjs/richer-editor";
import "@bizjs/richer-editor/styles.css";

import "./App.css";

function App() {
  return (
    <main className="playground-shell">
      <header className="playground-header">
        <h1>Richer Editor Playground</h1>
      </header>

      <RicherEditor aria-label="Richer Editor playground" />
    </main>
  );
}

export default App;
