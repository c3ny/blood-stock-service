"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdjustStockUseCaseHandler = exports.AdjustStockResult = exports.AdjustStockCommand = void 0;
__exportStar(require("./ports"), exports);
var adjust_stock_1 = require("./use-cases/adjust-stock");
Object.defineProperty(exports, "AdjustStockCommand", { enumerable: true, get: function () { return adjust_stock_1.AdjustStockCommand; } });
Object.defineProperty(exports, "AdjustStockResult", { enumerable: true, get: function () { return adjust_stock_1.AdjustStockResult; } });
Object.defineProperty(exports, "AdjustStockUseCaseHandler", { enumerable: true, get: function () { return adjust_stock_1.AdjustStockUseCaseHandler; } });
__exportStar(require("./errors"), exports);
//# sourceMappingURL=index.js.map