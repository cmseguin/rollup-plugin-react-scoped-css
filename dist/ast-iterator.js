"use strict";
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
exports.astIterator = void 0;
var isNode = function (obj) {
    var _a, _b, _c;
    return typeof obj === 'object' &&
        typeof ((_a = obj) === null || _a === void 0 ? void 0 : _a.end) === 'number' &&
        typeof ((_b = obj) === null || _b === void 0 ? void 0 : _b.start) === 'number' &&
        typeof ((_c = obj) === null || _c === void 0 ? void 0 : _c.type) === 'string';
};
var astIterator = function (ast) {
    var _a, _b, key, _c, _d, _i, nodeIndex, e_1_1;
    var e_1, _e;
    return __generator(this, function (_f) {
        switch (_f.label) {
            case 0:
                if (!ast) {
                    return [2 /*return*/];
                }
                _f.label = 1;
            case 1:
                _f.trys.push([1, 11, 12, 13]);
                _a = __values(Object.keys(ast)), _b = _a.next();
                _f.label = 2;
            case 2:
                if (!!_b.done) return [3 /*break*/, 10];
                key = _b.value;
                // Skip useless keys
                if (['end', 'start', 'type'].includes(key)) {
                    return [3 /*break*/, 9];
                }
                if (!Array.isArray(ast[key])) return [3 /*break*/, 7];
                _c = [];
                for (_d in ast[key])
                    _c.push(_d);
                _i = 0;
                _f.label = 3;
            case 3:
                if (!(_i < _c.length)) return [3 /*break*/, 6];
                nodeIndex = _c[_i];
                return [5 /*yield**/, __values((0, exports.astIterator)(ast[key][nodeIndex]))];
            case 4:
                _f.sent();
                _f.label = 5;
            case 5:
                _i++;
                return [3 /*break*/, 3];
            case 6: return [3 /*break*/, 9];
            case 7:
                if (!isNode(ast[key])) return [3 /*break*/, 9];
                return [5 /*yield**/, __values((0, exports.astIterator)(ast[key]))];
            case 8:
                _f.sent();
                _f.label = 9;
            case 9:
                _b = _a.next();
                return [3 /*break*/, 2];
            case 10: return [3 /*break*/, 13];
            case 11:
                e_1_1 = _f.sent();
                e_1 = { error: e_1_1 };
                return [3 /*break*/, 13];
            case 12:
                try {
                    if (_b && !_b.done && (_e = _a.return)) _e.call(_a);
                }
                finally { if (e_1) throw e_1.error; }
                return [7 /*endfinally*/];
            case 13: return [4 /*yield*/, ast];
            case 14:
                _f.sent();
                return [2 /*return*/];
        }
    });
};
exports.astIterator = astIterator;
