"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSyncIntegrationInputs = void 0;
const logger_service_1 = require("../services/logger-service");
const logger = logger_service_1.LoggerService.getLogger();
const validateSyncIntegrationInputs = async (request, response, next) => {
    var _a, _b, _c, _d, _e;
    try {
        logger.info({
            message: 'start',
            fileName: 'integration middleware',
            functionName: 'validateSyncIntegrationInputs',
        });
        const { boardId, itemId } = (_b = (_a = request === null || request === void 0 ? void 0 : request.body) === null || _a === void 0 ? void 0 : _a.payload) === null || _b === void 0 ? void 0 : _b.inputFields;
        if (!boardId || !itemId) {
            logger.error({
                message: `no inputs in request payload: ${JSON.stringify((_c = request === null || request === void 0 ? void 0 : request.body) === null || _c === void 0 ? void 0 : _c.payload)}`,
                fileName: 'integration middleware',
                functionName: 'syncStatusAndTasks',
            });
            return response.status(500).send({ error: 'missing input fields error' });
        }
        if (boardId <= 0 || itemId <= 0) {
            logger.error({
                message: `invalid inputs in request payload: ${JSON.stringify((_d = request === null || request === void 0 ? void 0 : request.body) === null || _d === void 0 ? void 0 : _d.payload)}`,
                fileName: 'integration middleware',
                functionName: 'syncStatusAndTasks',
            });
            return response.status(400).send({ error: 'invalid input fields error' });
        }
        response.locals.inputs = {
            boardId,
            itemId,
        };
        logger.info({
            message: 'inputs success',
            fileName: 'integration middleware',
            functionName: 'validateSyncIntegrationInputs',
            data: `response.locals.inputs: ${JSON.stringify((_e = response === null || response === void 0 ? void 0 : response.locals) === null || _e === void 0 ? void 0 : _e.inputs)}`,
        });
        next();
    }
    catch (error) {
        logger.error({
            message: `catch error: ${JSON.stringify(error)}`,
            fileName: 'integration middleware',
            functionName: 'syncStatusAndTasks',
        });
        return response.status(401).send({ error: 'integration verify inputs error' });
    }
};
exports.validateSyncIntegrationInputs = validateSyncIntegrationInputs;
//# sourceMappingURL=integration-middleware.js.map