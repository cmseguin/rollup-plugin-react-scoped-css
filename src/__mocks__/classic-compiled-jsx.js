import "./App.css";
import "./App.scoped.css";
import React, { useState } from "react";
import logo from "./logo.svg";
import Sub from "./Sub";
function App() {
  const [count, setCount] = useState(0);
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", {
    className: "App"
  }, /* @__PURE__ */ React.createElement("header", {
    className: "App-header"
  }, /* @__PURE__ */ React.createElement("img", {
    src: logo,
    className: "App-logo",
    alt: "logo"
  }), /* @__PURE__ */ React.createElement("p", null, "Hello Vite + React!"), /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement("button", {
    type: "button",
    onClick: () => setCount((count2) => count2 + 1)
  }, "count is: ", count)), /* @__PURE__ */ React.createElement("p", null, "Edit ", /* @__PURE__ */ React.createElement("code", null, "App.jsx"), " and save to test HMR updates."), /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement("a", {
    className: "App-link",
    href: "https://reactjs.org",
    target: "_blank",
    rel: "noopener noreferrer"
  }, "Learn React"), " | ", /* @__PURE__ */ React.createElement("a", {
    className: "App-link",
    href: "https://vitejs.dev/guide/features.html",
    target: "_blank",
    rel: "noopener noreferrer"
  }, "Vite Docs"))), /* @__PURE__ */ React.createElement(Sub, null)));
}
export default App;