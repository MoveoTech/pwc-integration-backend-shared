"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createQueue = void 0;
const bullmq_1 = require("bullmq");
const queue_1 = __importDefault(require("../utils/queue"));
const logger_service_1 = require("./logger-service");
const logger = logger_service_1.LoggerService.getLogger();
const createQueue = () => {
    const connection = queue_1.default.getQueueConnection();
    const queue = new bullmq_1.Queue('queriesQueue', {
        connection,
        defaultJobOptions: {
            attempts: 120,
            backoff: {
                type: 'fixed',
                delay: 60000,
            },
        },
    });
    logger.info({ message: 'queue created', fileName: 'queueService', functionName: 'createQueue' });
    new bullmq_1.QueueEvents('queriesQueue', {
        connection,
    });
    logger.info({ message: 'queueEvents created', fileName: 'queueService', functionName: 'createQueue' });
    return queue;
};
exports.createQueue = createQueue;
//# sourceMappingURL=queue-service.js.map