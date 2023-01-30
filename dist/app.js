"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = void 0;
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const routes_1 = __importDefault(require("./routes"));
const logger_service_1 = require("./services/logger-service");
const logger = logger_service_1.LoggerService.getLogger();
const app = (0, express_1.default)();
const port = (_a = process.env.PORT) !== null && _a !== void 0 ? _a : '8080';
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(body_parser_1.default.json({ limit: '20mb' }));
app.use(body_parser_1.default.urlencoded({ limit: '20mb', extended: true }));
app.use(express_1.default.urlencoded({
    extended: true,
}));
app.use(routes_1.default);
const main = async () => {
    try {
        app.listen(port, () => {
            logger.info({
                message: `pwc integration app listening at http://localhost:${port}`,
                fileName: 'app',
                functionName: 'main',
            });
        });
    }
    catch (error) {
        logger.error({
            message: `catch error: ${JSON.stringify(error)}`,
            fileName: 'app',
            functionName: 'main',
        });
        process.exit(1);
    }
};
exports.main = main;
(0, exports.main)();
//# sourceMappingURL=app.js.map