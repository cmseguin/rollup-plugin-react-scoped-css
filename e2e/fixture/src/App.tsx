import { useState } from "react";
import "./App.css";
import "./App.scoped.css";
import { Sub } from "./Sub";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="App">
      <Sub className="external" />
      <button
        id="app-button"
        type="button"
        onClick={() => setCount((value) => value + 1)}
      >
        count is {count}
      </button>
      <p id="global-only" className="global-only">
        global styles stay global
      </p>
    </div>
  );
}

export default App;
