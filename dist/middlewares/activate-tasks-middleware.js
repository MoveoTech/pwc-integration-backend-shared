"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateActivateTasksInputs = void 0;
const logger_service_1 = require("../services/logger-service");
const logger = logger_service_1.LoggerService.getLogger();
const validateActivateTasksInputs = async (request, response, next) => {
    var _a, _b, _c;
    try {
        logger.info({
            message: 'start',
            fileName: 'activate tasks middleware',
            functionName: 'validateActivateTasksInputs',
        });
        const { boardIds, parentsItemsData } = (_a = request === null || request === void 0 ? void 0 : request.body) === null || _a === void 0 ? void 0 : _a.payload;
        if (!boardIds || !parentsItemsData || !parentsItemsData.length) {
            logger.error({
                message: `no inputs in request payload: ${JSON.stringify((_b = request === null || request === void 0 ? void 0 : request.body) === null || _b === void 0 ? void 0 : _b.payload)}`,
                fileName: 'activate tasks middleware',
                functionName: 'validateActivateTasksInputs',
            });
            return response.status(500).send({ error: 'missing input fields error' });
        }
        response.locals.inputs = {
            boardIds,
            parentsItemsData,
        };
        logger.info({
            message: 'inputs success',
            fileName: 'activate tasks middleware',
            functionName: 'validateActivateTasksInputs',
            data: `response.locals.inputs: ${JSON.stringify((_c = response === null || response === void 0 ? void 0 : response.locals) === null || _c === void 0 ? void 0 : _c.inputs)}`,
        });
        next();
    }
    catch (error) {
        logger.error({
            message: `catch error: ${JSON.stringify(error)}`,
            fileName: 'activate tasks middleware',
            functionName: 'validateActivateTasksInputs',
        });
        return response.status(401).send({ error: 'integration verify inputs error' });
    }
};
exports.validateActivateTasksInputs = validateActivateTasksInputs;
//# sourceMappingURL=activate-tasks-middleware.js.map