"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postRequest = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_service_1 = require("./logger-service");
const logger = logger_service_1.LoggerService.getLogger();
async function postRequest(url, token, body) {
    try {
        const options = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `${token}`,
            },
        };
        const res = await axios_1.default.post(url, body, options);
        return [null, res.data];
    }
    catch (error) {
        logger.error({
            message: `catch error: ${JSON.stringify(error)}`,
            fileName: 'htpp service',
            functionName: 'postRequest',
        });
        return [error, null];
    }
}
exports.postRequest = postRequest;
//# sourceMappingURL=http-service.js.map