"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerService = void 0;
class LoggerService {
    static getLogger() {
        if (this.loggerInstance) {
            return this.loggerInstance;
        }
        this.loggerInstance = new LoggerService();
        return this.loggerInstance;
    }
    info(infoData) {
        console.info(`${infoData.fileName} -> ${infoData.functionName} -> ${infoData.message}`, (infoData === null || infoData === void 0 ? void 0 : infoData.data) ? infoData.data : '');
    }
    error(errorData) {
        console.error(`${errorData.fileName} -> ${errorData.functionName} -> ${errorData.message}`, (errorData === null || errorData === void 0 ? void 0 : errorData.data) ? errorData.data : '');
    }
}
exports.LoggerService = LoggerService;
//# sourceMappingURL=logger-service.js.map