"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MyComponent;
var _react = _interopRequireDefault(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(e) {
  return e && e.__esModule ? e : { default: e };
}
const SubComponent = () => (0, _jsxRuntime.jsx)("div", {
  children: "SubComponent",
  "data-v-123456": true
});
function MyComponent() {
  const props = {
    foo: "bar",
    baz: "qux"
  };
  return (0, _jsxRuntime.jsx)(_jsxRuntime.Fragment, {
    children: (0, _jsxRuntime.jsxs)("div", {
      className: "test",
      ...props,
      children: [
        (0, _jsxRuntime.jsx)("p", {
          ...props,
          children: "Hello World",
          "data-v-123456": true
        }),
        (0, _jsxRuntime.jsx)(SubComponent, { "data-v-123456": true })
      ],
      "data-v-123456": true
    })
  });
}