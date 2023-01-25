"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerService = void 0;
const winston_1 = __importDefault(require("winston"));
class LoggerService {
    constructor() {
        this.logger = winston_1.default.createLogger({
            level: 'debug',
            format: winston_1.default.format.json(),
            transports: [new winston_1.default.transports.Console({ level: 'debug' })],
        });
    }
    static getLogger() {
        if (this.loggerInstance) {
            return this.loggerInstance;
        }
        this.loggerInstance = new LoggerService();
        return this.loggerInstance;
    }
    info(infoData) {
        const message = `${infoData.fileName} -> ${infoData.functionName} -> ${infoData.message} ${(infoData === null || infoData === void 0 ? void 0 : infoData.data) ? infoData.data : ''}`.trim();
        this.logger.log({
            level: 'info',
            message,
        });
    }
    error(errorData) {
        const message = `${errorData.fileName} -> ${errorData.functionName} -> ${errorData.message} ${(errorData === null || errorData === void 0 ? void 0 : errorData.data) ? errorData.data : ''}`.trim();
        this.logger.log({
            level: 'error',
            message,
        });
    }
}
exports.LoggerService = LoggerService;
//# sourceMappingURL=logger-service.js.map