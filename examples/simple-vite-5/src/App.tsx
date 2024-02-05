import { useState } from "react";
import "./App.css";
import "./App.scoped.css";
import { Sub } from "./Sub";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="App">
      <Sub className="external" />
      <button onClick={() => setCount((count) => count + 1)}>
        count is {count}
      </button>
    </div>
  );
}

export default App;
