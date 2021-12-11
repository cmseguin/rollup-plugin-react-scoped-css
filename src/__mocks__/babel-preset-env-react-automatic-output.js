"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports["default"] = MyComponent;
var _react = _interopRequireDefault(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { "default": obj };
}
function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);
  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly) {
      symbols = symbols.filter(function (sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      });
    }
    keys.push.apply(keys, symbols);
  }
  return keys;
}
function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};
    if (i % 2) {
      ownKeys(Object(source), true).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }
  return target;
}
function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
var SubComponent = function SubComponent() {
  return (0, _jsxRuntime.jsx)("div", {
    children: "SubComponent",
    "data-v-123456": true
  });
};
function MyComponent() {
  var props = {
    foo: "bar",
    baz: "qux"
  };
  return (0, _jsxRuntime.jsx)(_jsxRuntime.Fragment, {
    children: (0, _jsxRuntime.jsxs)("div", _objectSpread(_objectSpread({ className: "test" }, props), {}, {
      children: [
        (0, _jsxRuntime.jsx)("p", _objectSpread(_objectSpread({}, props), {}, { children: "Hello World" }, { "data-v-123456": true })),
        (0, _jsxRuntime.jsx)(SubComponent, { "data-v-123456": true })
      ]
    }, { "data-v-123456": true }))
  });
}