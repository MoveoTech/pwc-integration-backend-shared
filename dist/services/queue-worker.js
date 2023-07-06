"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.worker = void 0;
const cache_1 = require("../constants/cache");
const secrets_1 = require("../constants/secrets");
const cache_service_1 = require("./cache-service");
const secrets_service_1 = require("./secrets-service");
const logger_service_1 = require("./logger-service");
const monday_service_1 = require("./monday-service");
const logger = logger_service_1.LoggerService.getLogger();
const worker = async (job) => {
    const { messages, variables } = job === null || job === void 0 ? void 0 : job.data;
    const cacheService = cache_service_1.CacheService.getCacheService();
    let monAccessToken = cacheService.getKey(cache_1.CACHE.MONDAY_TOKEN);
    let monAccessTokenError;
    if (!monAccessToken) {
        const secretsService = new secrets_service_1.SecretsService();
        // monAccessToken = process.env.TOKEN;
        [monAccessTokenError, monAccessToken] = await secretsService.getSecret(secrets_1.SECRETS.MONDAY_TOKEN);
        if (monAccessTokenError) {
            logger.error({
                message: 'missing monday token',
                fileName: 'queue worker',
                functionName: 'worker',
            });
            throw new Error('throw worker, no mon access token');
        }
        cacheService.setKey(cache_1.CACHE.MONDAY_TOKEN, monAccessToken, cache_1.CACHE.MONDAY_TOKEN_TTL);
    }
    const mondayService = new monday_service_1.MondayService();
    const [resError, res] = await mondayService.executeQueryFromQueue(monAccessToken, messages);
    if (resError) {
        logger.error({
            message: `resError: ${JSON.stringify(resError.message)}`,
            fileName: 'queue worker',
            functionName: 'worker',
        });
        throw new Error(resError.message);
    }
    logger.info({
        message: 'completeMessage',
        fileName: 'queue worker',
        functionName: 'worker',
        data: JSON.stringify(job),
    });
    return res;
};
exports.worker = worker;
//# sourceMappingURL=queue-worker.js.map