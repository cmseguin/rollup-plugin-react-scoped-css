"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MyComponent;
var _react = _interopRequireDefault(require("react"));
function _interopRequireDefault(e) {
  return e && e.__esModule ? e : { default: e };
}
function _extends() {
  return _extends = Object.assign ? Object.assign.bind() : function (n) {
    for (var e = 1; e < arguments.length; e++) {
      var t = arguments[e];
      for (var r in t)
        ({}.hasOwnProperty.call(t, r) && (n[r] = t[r]));
    }
    return n;
  }, _extends.apply(null, arguments);
}
const SubComponent = () => _react.default.createElement("div", { "data-v-123456": true }, "SubComponent");
function MyComponent() {
  const props = {
    foo: "bar",
    baz: "qux"
  };
  return _react.default.createElement(_react.default.Fragment, null, _react.default.createElement("div", _extends({ className: "test" }, props, { "data-v-123456": true }), _react.default.createElement("p", Object.assign({}, props, { "data-v-123456": true }), "Hello World"), _react.default.createElement(SubComponent, { "data-v-123456": true })));
}