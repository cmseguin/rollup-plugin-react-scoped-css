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
exports.addHashAttributesToJsxTagsAst = void 0;
var ast_iterator_1 = require("./ast-iterator");
var ast_transformer_1 = require("./ast-transformer");
var classic_parser_1 = require("./parsers/classic-parser");
var jsx_parser_model_1 = require("./parsers/jsx-parser.model");
var new_parser_1 = require("./parsers/new-parser");
global.implementation = null;
var classicParser = new classic_parser_1.ClassicJsxParser();
var newParser = new new_parser_1.NewJsxParser();
var parser = classicParser;
var findImplementation = function (program) {
    var e_1, _a;
    var implementation = jsx_parser_model_1.ParserImplementations.classic;
    try {
        for (var _b = __values((0, ast_iterator_1.astIterator)(program)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var node = _c.value;
            if (node.type !== 'ImportDeclaration') {
                continue;
            }
            if (node.specifiers.some(function (n) { return n.local.name === 'jsxRuntime'; }) || node.source.value === 'react/jsx-runtime') {
                return jsx_parser_model_1.ParserImplementations.new;
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
    return implementation;
};
function addHashAttributesToJsxTagsAst(program, attr) {
    // Once in the program, we can determine which parser to use
    if (global.implementation === null) {
        global.implementation = findImplementation(program);
        if (global.implementation === jsx_parser_model_1.ParserImplementations.new) {
            parser = newParser;
        }
    }
    return (0, ast_transformer_1.astTransformer)(program, function (node) {
        if (parser.isNodeReactElement(node) && !parser.isNodeReactFragment(node)) {
            return parser.extendNodeWithAttributes(node, attr);
        }
    });
}
exports.addHashAttributesToJsxTagsAst = addHashAttributesToJsxTagsAst;
