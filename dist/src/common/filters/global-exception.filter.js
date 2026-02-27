"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const errors_1 = require("../../application/stock/errors");
const errors_2 = require("../../domain/errors");
let GlobalExceptionFilter = class GlobalExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const traceId = request.traceId || request.headers['x-trace-id'] || (0, node_crypto_1.randomUUID)();
        response.setHeader('x-trace-id', traceId);
        const { statusCode, code, message, details } = this.normalizeError(exception, request.url);
        const payload = {
            statusCode,
            code,
            message,
            details,
            traceId,
        };
        response.status(statusCode).json(payload);
    }
    normalizeError(exception, path) {
        if (exception instanceof errors_1.StockNotFoundError) {
            return {
                statusCode: common_1.HttpStatus.NOT_FOUND,
                code: 'STOCK_NOT_FOUND',
                message: exception.message,
                details: { path, timestamp: new Date().toISOString() },
            };
        }
        if (exception instanceof errors_2.InsufficientStockError) {
            return {
                statusCode: common_1.HttpStatus.BAD_REQUEST,
                code: 'INSUFFICIENT_STOCK',
                message: exception.message,
                details: { path, timestamp: new Date().toISOString() },
            };
        }
        if (exception instanceof common_1.HttpException) {
            const statusCode = exception.getStatus();
            const response = exception.getResponse();
            if (typeof response === 'string') {
                return {
                    statusCode,
                    code: this.mapHttpStatusToCode(statusCode),
                    message: response,
                    details: { path, timestamp: new Date().toISOString() },
                };
            }
            const message = Array.isArray(response.message)
                ? 'Validation failed'
                : String(response.message ?? exception.message);
            const details = {
                path,
                timestamp: new Date().toISOString(),
                errors: Array.isArray(response.message) ? response.message : undefined,
            };
            return {
                statusCode,
                code: this.mapHttpStatusToCode(statusCode),
                message,
                details,
            };
        }
        if (exception instanceof Error) {
            return {
                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'INTERNAL_ERROR',
                message: exception.message,
                details: { path, timestamp: new Date().toISOString() },
            };
        }
        return {
            statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
            code: 'INTERNAL_ERROR',
            message: 'Unexpected error',
            details: { path, timestamp: new Date().toISOString() },
        };
    }
    mapHttpStatusToCode(statusCode) {
        switch (statusCode) {
            case common_1.HttpStatus.BAD_REQUEST:
                return 'VALIDATION_ERROR';
            case common_1.HttpStatus.NOT_FOUND:
                return 'NOT_FOUND';
            case common_1.HttpStatus.TOO_MANY_REQUESTS:
                return 'RATE_LIMIT_EXCEEDED';
            case common_1.HttpStatus.SERVICE_UNAVAILABLE:
                return 'SERVICE_UNAVAILABLE';
            default:
                return 'HTTP_ERROR';
        }
    }
};
exports.GlobalExceptionFilter = GlobalExceptionFilter;
exports.GlobalExceptionFilter = GlobalExceptionFilter = __decorate([
    (0, common_1.Catch)()
], GlobalExceptionFilter);
//# sourceMappingURL=global-exception.filter.js.map