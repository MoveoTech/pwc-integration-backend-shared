"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWorker = void 0;
const bullmq_1 = require("bullmq");
const queue_1 = __importDefault(require("../utils/queue"));
const cache_service_1 = require("./cache-service");
const queue_worker_1 = require("./queue-worker");
const job_failures_1 = __importDefault(require("../constants/job-failures"));
const logger_service_1 = require("./logger-service");
let cacheService;
const logger = logger_service_1.LoggerService.getLogger();
const createWorker = () => {
    cacheService = new cache_service_1.CacheService();
    const connection = queue_1.default.getQueueConnection();
    const workerInstance = new bullmq_1.Worker('queriesQueue', queue_worker_1.worker, {
        concurrency: 1,
        connection,
        limiter: {
            duration: 500,
            max: 1,
        },
    });
    workerInstance.on('completed', handleComplete);
    workerInstance.on('failed', handleFail);
    workerInstance.on('drained', handleDrained);
};
exports.createWorker = createWorker;
const handleComplete = async (job) => {
    logger.info({
        message: `job done: ${JSON.stringify(job)}`,
        fileName: 'queueWorkerService',
        functionName: 'handleComplete',
    });
};
const handleFail = async (job, error) => {
    logger.error({
        message: `job failed: ${JSON.stringify(job)}`,
        fileName: 'queueWorkerService',
        functionName: 'handleFail',
        data: JSON.stringify(error),
    });
    if ((job === null || job === void 0 ? void 0 : job.failedReason) === job_failures_1.default.INVALID_EXPIRE_TIME ||
        (job === null || job === void 0 ? void 0 : job.failedReason) === job_failures_1.default.RETRY_JOB_OF_UNDEFINED ||
        (job === null || job === void 0 ? void 0 : job.failedReason) === job_failures_1.default.COULD_NOT_FIND_PROJECT ||
        (job === null || job === void 0 ? void 0 : job.failedReason) === job_failures_1.default.COLUMN_VALUE_EXCEPTION) {
        await job.remove();
    }
    else if ((job === null || job === void 0 ? void 0 : job.failedReason) === job_failures_1.default.BOARD_MAX_SIZE ||
        (job === null || job === void 0 ? void 0 : job.failedReason) === job_failures_1.default.COLUMN_MAX_SIZE ||
        (job === null || job === void 0 ? void 0 : job.failedReason) === job_failures_1.default.UNAUTHORIZED_USER ||
        (job === null || job === void 0 ? void 0 : job.failedReason) === job_failures_1.default.MUTATION_EXCEEDED) {
        const { monAccountId, boardId } = job === null || job === void 0 ? void 0 : job.data;
        const blockedBoardCacheKey = `blocked_board_${monAccountId}-${boardId}`;
        cacheService.setKey(blockedBoardCacheKey, JSON.stringify(true), 3600);
        await job.remove();
    }
};
const handleDrained = () => {
    logger.info({ message: 'worker drained', fileName: 'queueWorkerService', functionName: 'handleDrained' });
};
//# sourceMappingURL=queue-worker-service.js.map