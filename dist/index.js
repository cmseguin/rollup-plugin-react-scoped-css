"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var path = __importStar(require("path"));
var js_xxhash_1 = require("js-xxhash");
var pluginutils_1 = require("@rollup/pluginutils");
var component_compiler_utils_1 = require("@vue/component-compiler-utils");
var escodegen_1 = require("escodegen");
var ast_utils_1 = require("./ast.utils");
var getFilenameFromPath = function (filePath) {
    var parts = filePath.split('/');
    return parts[parts.length - 1].split('?')[0];
};
var getHashFromPath = function (filePath) {
    var search = '?scope=';
    var hash = filePath.slice(filePath.indexOf(search) + search.length);
    return hash;
};
var generateHash = function (input, seed) {
    if (seed === void 0) { seed = 0; }
    var hashNum = (0, js_xxhash_1.xxHash32)(Buffer.from(input, 'utf8'), seed);
    return hashNum.toString(16);
};
var addAttributesToCss = function (src, fileName, hash) {
    var code = (0, component_compiler_utils_1.compileStyle)({
        source: src,
        filename: fileName,
        id: hash,
        scoped: true,
        trim: true,
    }).code;
    return code;
};
function reactScopedCssPlugin(optionsIn) {
    if (optionsIn === void 0) { optionsIn = {}; }
    var options = __assign({ hashPrefix: 'v', styleFileSuffix: 'scoped', styleFileExtensions: ['scss', 'css', 'sass', 'less'], jsxFileExtensions: ['jsx', 'tsx'] }, optionsIn);
    if (!options.styleFileExtensions || !options.styleFileExtensions.length) {
        throw new Error('You need to provide at least one style file extension');
    }
    if (!options.jsxFileExtensions || !options.jsxFileExtensions.length) {
        throw new Error('You need to provide at least one jsx file extension');
    }
    var filter = (0, pluginutils_1.createFilter)(options.include, options.exclude);
    var scopedCssRegex = options.styleFileSuffix
        ? new RegExp(".".concat(options.styleFileSuffix, ".(").concat(options.styleFileExtensions.join('|'), ")$"))
        : new RegExp(".(".concat(options.styleFileExtensions.join('|'), ")$"));
    var scopedCssInFileRegex = options.styleFileSuffix
        ? new RegExp(".".concat(options.styleFileSuffix, ".(").concat(options.styleFileExtensions.join('|'), ")(\"|')"))
        : new RegExp(".(".concat(options.styleFileExtensions.join('|'), ")(\"|')"));
    var jsxRegex = new RegExp(".(".concat(options.jsxFileExtensions.join('|'), ")$"));
    return [
        {
            name: 'rollup-plugin-react-scoped-css:pre',
            resolveId: function (source, importer) {
                if (!importer) {
                    return;
                }
                if (scopedCssRegex.test(source) && jsxRegex.test(importer)) {
                    var importerHash = generateHash(importer);
                    var url = path.resolve(path.dirname(importer), "".concat(source, "?scope=").concat(importerHash));
                    return url;
                }
            },
            enforce: 'pre'
        },
        {
            name: 'rollup-plugin-react-scoped-css:post',
            transform: function (code, id) {
                if (!filter(id)) {
                    return;
                }
                if (scopedCssInFileRegex.test(code)) {
                    var importerHash = generateHash(id);
                    var program = this.parse(code);
                    var newAst = (0, ast_utils_1.addHashAttributesToJsxTagsAst)(program, "data-".concat(options.hashPrefix, "-").concat(importerHash));
                    return (0, escodegen_1.generate)(newAst);
                }
                if (scopedCssRegex.test(getFilenameFromPath(id))) {
                    var importerHash = getHashFromPath(id);
                    return addAttributesToCss(code, getFilenameFromPath(id), "data-".concat(options.hashPrefix, "-").concat(importerHash));
                }
            }
        }
    ];
}
exports.default = reactScopedCssPlugin;
