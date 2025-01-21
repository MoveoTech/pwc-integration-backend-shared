"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postRequest = void 0;
const logger_service_1 = require("./logger-service");
//@ts-ignore
const monday_sdk_js_1 = __importDefault(require("monday-sdk-js"));
const logger = logger_service_1.LoggerService.getLogger();
async function postRequest(url, token, body, query, variables) {
    try {
        const mondayClient = (0, monday_sdk_js_1.default)({ token });
        mondayClient.setApiVersion('2025-01');
        const options = {
            headers: {
                'Content-Type': 'application/json',
                'API-Version': '2025-01',
                Authorization: `${token}`,
            },
        };
        const response = await mondayClient.api(query, { variables: variables });
        // const res = await axios.post(url, body, options);
        return [null, response];
    }
    catch (error) {
        logger.error({
            message: `catch error: ${JSON.stringify(error)}`,
            fileName: 'http service',
            functionName: 'postRequest',
        });
        return [error, null];
    }
}
exports.postRequest = postRequest;
//# sourceMappingURL=http-service.js.map