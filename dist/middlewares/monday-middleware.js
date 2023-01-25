"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyClientAuthorization = exports.verifyAuthorization = void 0;
const auth_1 = require("../utils/auth");
const secrets_1 = require("../constants/secrets");
const logger_service_1 = require("../services/logger-service");
const secrets_service_1 = require("../services/secrets-service");
const logger = logger_service_1.LoggerService.getLogger();
const secretsService = secrets_service_1.SecretsService.getSecretsService();
const verifyAuthorization = async (request, response, next) => {
    var _a, _b;
    try {
        logger.info({
            message: 'start',
            fileName: 'monday middleware',
            functionName: 'verifyAuthorization',
        });
        const authorization = request.headers.authorization || ((_a = request.query) === null || _a === void 0 ? void 0 : _a.token);
        if (typeof authorization !== 'string') {
            logger.error({
                message: `authorization wrong type: ${JSON.stringify(authorization)}`,
                fileName: 'monday middleware',
                functionName: 'verifyAuthorization',
            });
            return response.status(500).send({ error: 'authorization error' });
        }
        // FROM AZURE KEY VAULT
        const [mondaySigningSecretError, mondaySigningSecret] = await secretsService.getSecret(secrets_1.SECRETS.MONDAY_SIGNING);
        if (mondaySigningSecretError) {
            logger.error({
                message: 'missing monday signing secret',
                fileName: 'monday middleware',
                functionName: 'verifyClientAuthorization',
            });
            return response.status(500).send({ error: 'missing secret' });
        }
        const [monAccessTokenError, monAccessToken] = await secretsService.getSecret(secrets_1.SECRETS.MONDAY_TOKEN);
        if (monAccessTokenError) {
            logger.error({
                message: 'missing monday token',
                fileName: 'monday middleware',
                functionName: 'verifyClientAuthorization',
            });
            return response.status(500).send({ error: 'missing monday token' });
        }
        // END FROM AZURE KEY VAULT
        // // LOCAL FOR SECRET
        // const mondaySigningSecret = process.env.MONDAY_SIGNING_SECRET;
        // if (!mondaySigningSecret) {
        //   logger.error({
        //     message: 'missing monday signing secret',
        //     fileName: 'monday middleware',
        //     functionName: 'verifyAuthorization',
        //   });
        //   return response.status(500).send({ error: 'missing secret' });
        // }
        // const monAccessToken = process.env.TOKEN;
        // if (!monAccessToken) {
        //   logger.error({
        //     message: 'missing monday token',
        //     fileName: 'monday middleware',
        //     functionName: 'verifyClientAuthorization',
        //   });
        //   return response.status(500).send({ error: 'missing monday token' });
        // }
        // // END LOCAL FOR SECRET
        const { accountId, userId } = await (0, auth_1.verifyMondayAuthorization)(authorization, mondaySigningSecret);
        response.locals.mondayAuthorization = {
            accountId,
            userId,
            monAccessToken,
        };
        logger.info({
            message: 'authorization verify success',
            fileName: 'monday middleware',
            functionName: 'verifyAuthorization',
            data: `response.locals.mondayAuthorization: ${JSON.stringify((_b = response === null || response === void 0 ? void 0 : response.locals) === null || _b === void 0 ? void 0 : _b.mondayAuthorization)}`,
        });
        next();
    }
    catch (error) {
        logger.error({
            message: `catch error: ${JSON.stringify(error)}`,
            fileName: 'monday middleware',
            functionName: 'verifyAuthorization',
        });
        return response.status(401).send({ error: 'authorization verification error' });
    }
};
exports.verifyAuthorization = verifyAuthorization;
const verifyClientAuthorization = async (request, response, next) => {
    var _a;
    try {
        logger.info({
            message: 'start',
            fileName: 'monday middleware',
            functionName: 'verifyClientAuthorization',
        });
        const authorization = request.headers.authorization;
        if (typeof authorization !== 'string') {
            logger.error({
                message: `authorization wrong type: ${JSON.stringify(authorization)}`,
                fileName: 'monday middleware',
                functionName: 'verifyClientAuthorization',
            });
            return response.status(500).send({ error: 'authorization error' });
        }
        // FROM AZURE KEY VAULT
        const [mondayClientSecretError, mondayClientSecret] = await secretsService.getSecret(secrets_1.SECRETS.MONDAY_CLIENT);
        if (mondayClientSecretError) {
            logger.error({
                message: 'missing monday client secret',
                fileName: 'monday middleware',
                functionName: 'verifyClientAuthorization',
            });
            return response.status(500).send({ error: 'missing secret' });
        }
        const [monAccessTokenError, monAccessToken] = await secretsService.getSecret(secrets_1.SECRETS.MONDAY_TOKEN);
        if (monAccessTokenError) {
            logger.error({
                message: 'missing monday token',
                fileName: 'monday middleware',
                functionName: 'verifyClientAuthorization',
            });
            return response.status(500).send({ error: 'missing monday token' });
        }
        // END FROM AZURE KEY VAULT
        // // LOCAL FOR SECRET
        // const mondayClientSecret = process.env.MONDAY_CLIENT_SECRET;
        // if (!mondayClientSecret) {
        //   logger.error({
        //     message: 'missing monday client secret',
        //     fileName: 'monday middleware',
        //     functionName: 'verifyClientAuthorization',
        //   });
        //   return response.status(500).send({ error: 'missing secret' });
        // }
        // const monAccessToken = process.env.TOKEN;
        // if (!monAccessToken) {
        //   logger.error({
        //     message: 'missing monday token',
        //     fileName: 'monday middleware',
        //     functionName: 'verifyClientAuthorization',
        //   });
        //   return response.status(500).send({ error: 'missing monday token' });
        // }
        // // END LOCAL FOR SECRET
        const { dat } = await (0, auth_1.verifyMondayAuthorization)(authorization, mondayClientSecret);
        response.locals.mondayAuthorization = {
            accountId: dat.account_id,
            userId: dat.user_id,
            monAccessToken,
        };
        logger.info({
            message: 'authorization verify success',
            fileName: 'monday middleware',
            functionName: 'verifyClientAuthorization',
            data: `response.locals.mondayAuthorization: ${JSON.stringify((_a = response === null || response === void 0 ? void 0 : response.locals) === null || _a === void 0 ? void 0 : _a.mondayAuthorization)}`,
        });
        next();
    }
    catch (error) {
        logger.error({
            message: `catch error: ${JSON.stringify(error)}`,
            fileName: 'monday middleware',
            functionName: 'verifyClientAuthorization',
        });
        return response.status(401).send({ error: 'authorization verification error' });
    }
};
exports.verifyClientAuthorization = verifyClientAuthorization;
//# sourceMappingURL=monday-middleware.js.map