import "./App.css";
import "./App.scoped.css";
import React, { useState } from "react";
import logo from "./logo.svg";
import Sub from "./Sub";
function App() {
  const [count, setCount] = useState(0);
  return React.createElement(React.Fragment, null, React.createElement("div", {
    className: "App",
    "data-v-123456": true
  }, React.createElement("header", {
    className: "App-header",
    "data-v-123456": true
  }, React.createElement("img", {
    src: logo,
    className: "App-logo",
    alt: "logo",
    "data-v-123456": true
  }), React.createElement("p", { "data-v-123456": true }, "Hello Vite + React!"), React.createElement("p", { "data-v-123456": true }, React.createElement("button", {
    type: "button",
    onClick: () => setCount(count2 => count2 + 1),
    "data-v-123456": true
  }, "count is: ", count)), React.createElement("p", { "data-v-123456": true }, "Edit ", React.createElement("code", { "data-v-123456": true }, "App.jsx"), " and save to test HMR updates."), React.createElement("p", { "data-v-123456": true }, React.createElement("a", {
    className: "App-link",
    href: "https://reactjs.org",
    target: "_blank",
    rel: "noopener noreferrer",
    "data-v-123456": true
  }, "Learn React"), " | ", React.createElement("a", {
    className: "App-link",
    href: "https://vitejs.dev/guide/features.html",
    target: "_blank",
    rel: "noopener noreferrer",
    "data-v-123456": true
  }, "Vite Docs"))), React.createElement(Sub, { "data-v-123456": true })));
}
export default App;