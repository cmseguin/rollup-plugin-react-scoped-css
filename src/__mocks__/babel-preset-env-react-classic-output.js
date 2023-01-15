"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports["default"] = MyComponent;
var _react = _interopRequireDefault(require("react"));
function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { "default": obj };
}
function _extends() {
  _extends = Object.assign ? Object.assign.bind() : function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  };
  return _extends.apply(this, arguments);
}
var SubComponent = function SubComponent() {
  return _react["default"].createElement("div", { "data-v-123456": true }, "SubComponent");
};
function MyComponent() {
  var props = {
    foo: "bar",
    baz: "qux"
  };
  return _react["default"].createElement(_react["default"].Fragment, null, _react["default"].createElement("div", _extends({ className: "test" }, props, { "data-v-123456": true }), _react["default"].createElement("p", Object.assign({}, props, { "data-v-123456": true }), "Hello World"), _react["default"].createElement(SubComponent, { "data-v-123456": true })));
}