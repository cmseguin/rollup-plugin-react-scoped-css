import {
  j as jsxRuntime,
  r as react,
  R as ReactDOM,
  a as React
} from "./vendor.1137a3d7.js";
var index = "body {\n  margin: 0;\n  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',\n    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',\n    sans-serif;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n}\n\ncode {\n  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',\n    monospace;\n}\n";
var App$1 = ".sub {\n  color: green;\n}";
var App_scoped = ".App {\n  text-align: center;\n}\n\n.sub {\n  color: blue !important;\n}\n\n.App-logo {\n  height: 40vmin;\n  pointer-events: none;\n}\n\n@media (prefers-reduced-motion: no-preference) {\n  .App-logo {\n    animation: App-logo-spin infinite 20s linear;\n  }\n}\n\n.App-header {\n  background-color: #282c34;\n  min-height: 100vh;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  font-size: calc(10px + 2vmin);\n  color: white;\n}\n\n.App-link {\n  color: #61dafb;\n}\n\n@keyframes App-logo-spin {\n  from {\n    transform: rotate(0deg);\n  }\n  to {\n    transform: rotate(360deg);\n  }\n}\n\nbutton {\n  font-size: calc(10px + 2vmin);\n}\n";
var logo = "/assets/logo.ecc203fb.svg";
var Sub_scoped = ".sub {\n  color: red;\n}\n.sub__test {\n  margin: 0;\n}\n.sub h2 {\n  font-weight: 300;\n  font-size: 3rem;\n}\n\nh2 {\n  font-size: 10rem;\n}\n\n.drawer {\n  width: 400px;\n}\n.drawer__list-item {\n  padding: 0;\n}\n.drawer__list-item-icon {\n  margin-right: 1rem;\n}\n.drawer__link {\n  display: flex;\n  width: 300px;\n  padding: 1rem;\n  align-items: center;\n  text-decoration: none;\n  border: 0;\n  outline: 0;\n  background: transparent;\n  font-family: \"Quicksand\", \"Roboto\", sans-serif;\n  font-size: 1rem;\n  font-weight: 400;\n}\n.drawer__link:hover {\n  background-color: #fafafa;\n}";
const jsx = jsxRuntime.exports.jsx;
const jsxs = jsxRuntime.exports.jsxs;
const Fragment = jsxRuntime.exports.Fragment;
function Sub() {
  return jsx("div", {
    className: "sub",
    children: jsx("h2", {
      children: "Sub",
      "data-v-123456": true
    }),
    "data-v-123456": true
  });
}
function App() {
  const [count, setCount] = react.exports.useState(0);
  return jsx(Fragment, {
    children: jsxs("div", {
      className: "App",
      children: [
        jsxs("header", {
          className: "App-header",
          children: [
            jsx("img", {
              src: logo,
              className: "App-logo",
              alt: "logo",
              "data-v-123456": true
            }),
            jsx("p", {
              children: "Hello Vite + React!",
              "data-v-123456": true
            }),
            jsx("p", {
              children: jsxs("button", {
                type: "button",
                onClick: () => setCount(count2 => count2 + 1),
                children: [
                  "count is: ",
                  count
                ],
                "data-v-123456": true
              }),
              "data-v-123456": true
            }),
            jsxs("p", {
              children: [
                "Edit ",
                jsx("code", {
                  children: "App.jsx",
                  "data-v-123456": true
                }),
                " and save to test HMR updates."
              ],
              "data-v-123456": true
            }),
            jsxs("p", {
              children: [
                jsx("a", {
                  className: "App-link",
                  href: "https://reactjs.org",
                  target: "_blank",
                  rel: "noopener noreferrer",
                  children: "Learn React",
                  "data-v-123456": true
                }),
                " | ",
                jsx("a", {
                  className: "App-link",
                  href: "https://vitejs.dev/guide/features.html",
                  target: "_blank",
                  rel: "noopener noreferrer",
                  children: "Vite Docs",
                  "data-v-123456": true
                })
              ],
              "data-v-123456": true
            })
          ],
          "data-v-123456": true
        }),
        jsx(Fragment, { children: jsx(Sub, { "data-v-123456": true }) })
      ],
      "data-v-123456": true
    })
  });
}
ReactDOM.render(jsx(React.StrictMode, {
  children: jsx(App, { "data-v-123456": true }),
  "data-v-123456": true
}), document.getElementById("root"));