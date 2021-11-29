"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.astTransformer = void 0;
var isNode = function (obj) {
    var _a, _b, _c;
    return typeof obj === 'object' &&
        typeof ((_a = obj) === null || _a === void 0 ? void 0 : _a.end) === 'number' &&
        typeof ((_b = obj) === null || _b === void 0 ? void 0 : _b.start) === 'number' &&
        typeof ((_c = obj) === null || _c === void 0 ? void 0 : _c.type) === 'string';
};
var astTransformer = function (ast, callback) {
    var e_1, _a;
    try {
        for (var _b = __values(Object.keys(ast)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var key = _c.value;
            if (['end', 'start', 'type'].includes(key)) {
                continue;
            }
            if (Array.isArray(ast[key])) {
                for (var nodeIndex in ast[key]) {
                    ast[key][nodeIndex] = (0, exports.astTransformer)(ast[key][nodeIndex], callback);
                }
            }
            else if (isNode(ast[key])) {
                ast[key] = (0, exports.astTransformer)(ast[key], callback);
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_1) throw e_1.error; }
    }
    var result = callback(ast);
    return typeof result !== 'undefined' ? result : ast;
};
exports.astTransformer = astTransformer;
