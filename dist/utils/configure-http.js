"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureHttp = void 0;
const axios_1 = __importDefault(require("axios"));
const create_http_agents_1 = require("./create-http-agents");
function configureHttp() {
    axios_1.default.defaults.httpAgent = (0, create_http_agents_1.createHttpAgent)();
    axios_1.default.defaults.httpsAgent = (0, create_http_agents_1.createHttpsAgent)();
}
exports.configureHttp = configureHttp;
//# sourceMappingURL=configure-http.js.map