"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHttpsAgent = exports.createHttpAgent = void 0;
const agentkeepalive_1 = __importDefault(require("agentkeepalive"));
function createHttpAgent() {
    return new agentkeepalive_1.default({
        maxSockets: 100,
        maxFreeSockets: 10,
        timeout: 60000,
        freeSocketTimeout: 30000,
    });
}
exports.createHttpAgent = createHttpAgent;
function createHttpsAgent() {
    return new agentkeepalive_1.default.HttpsAgent({
        maxSockets: 100,
        maxFreeSockets: 10,
        timeout: 60000,
        freeSocketTimeout: 30000,
    });
}
exports.createHttpsAgent = createHttpsAgent;
//# sourceMappingURL=create-http-agents.js.map