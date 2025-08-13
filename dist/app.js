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
const configure_http_1 = require("./utils/configure-http");
const logger_service_1 = require("./services/logger-service");
const queue_1 = __importDefault(require("./utils/queue"));
const queue_service_1 = require("./services/queue-service");
const queue_worker_service_1 = require("./services/queue-worker-service");
const logger = logger_service_1.LoggerService.getLogger();
const app = (0, express_1.default)();
const port = (_a = process.env.PORT) !== null && _a !== void 0 ? _a : '8080';
app.use((0, cors_1.default)({
    origin: [
        'https://stgitxmodulemonday.pwc.co.uk/',
        'https://itxmodulemonday.pwc.co.uk/',
        'https://monday.com',
        /\.monday\.com$/,
        /\.monday-apps\.com$/,
        /\.monday-time\.com$/,
        /\.mondaylabs\.io$/,
        /\.cdn2\.monday\.app$/
    ],
    credentials: true,
}));
app.use(express_1.default.json());
app.use(body_parser_1.default.json({ limit: '20mb' }));
app.use(body_parser_1.default.urlencoded({ limit: '20mb', extended: true }));
app.use(express_1.default.urlencoded({
    extended: true,
}));
app.use(function (req, res, next) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
});
app.use((err, req, res, next) => {
    if (err && err.status === 400 && 'body' in err) {
        return res.status(400).send({ status: 400, message: 'Bad JSON Input' });
    }
    next();
});
app.use(routes_1.default);
const main = async () => {
    try {
        (0, configure_http_1.configureHttp)();
        const queueConnection = {
            port: Number(process.env.REDIS_PORT),
            host: process.env.REDIS_HOST,
            password: process.env.REDIS_PASS,
            tls: {
                servername: process.env.REDIS_HOST,
            },
        };
        // const queueConnection = {
        //   port: Number(6379),
        //   host: 'localhost',
        //   // password: process.env.REDIS_PASS,
        //   // tls: {
        //   //   servername: process.env.REDIS_HOST,
        //   // },
        // };
        queue_1.default.setQueueConnection(queueConnection);
        const queue = (0, queue_service_1.createQueue)();
        queue_1.default.setQueue(queue);
        (0, queue_worker_service_1.createWorker)();
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