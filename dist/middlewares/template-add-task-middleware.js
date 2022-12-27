"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTemplateAddTaskInputs = void 0;
const logger_service_1 = require("../services/logger-service");
const logger = logger_service_1.LoggerService.getLogger();
const validateTemplateAddTaskInputs = async (request, response, next) => {
    var _a, _b, _c, _d;
    try {
        logger.info({
            message: 'start',
            fileName: 'template add task middleware',
            functionName: 'validateSyncIntegrationInputs',
        });
        const { boardId, itemId, templateItemId, settingsBoardIds } = (_b = (_a = request === null || request === void 0 ? void 0 : request.body) === null || _a === void 0 ? void 0 : _a.payload) === null || _b === void 0 ? void 0 : _b.settings;
        if (!itemId || !templateItemId || !settingsBoardIds) {
            logger.error({
                message: `no inputs in request payload: ${JSON.stringify((_c = request === null || request === void 0 ? void 0 : request.body) === null || _c === void 0 ? void 0 : _c.payload)}`,
                fileName: 'template add task middleware',
                functionName: 'validateTemplateAddTaskInputs',
            });
            return response.status(500).send({ error: 'missing input fields error' });
        }
        response.locals.inputs = {
            boardId,
            itemId,
            templateItemId,
            settingsBoardIds
        };
        logger.info({
            message: 'inputs success',
            fileName: 'template add task middleware',
            functionName: 'validateTemplateAddTaskInputs',
            data: `response.locals.inputs: ${JSON.stringify((_d = response === null || response === void 0 ? void 0 : response.locals) === null || _d === void 0 ? void 0 : _d.inputs)}`,
        });
        next();
    }
    catch (error) {
        logger.error({
            message: `catch error: ${JSON.stringify(error)}`,
            fileName: 'template add task middleware',
            functionName: 'validateTemplateAddTaskInputs',
        });
        return response.status(401).send({ error: 'integration verify inputs error' });
    }
};
exports.validateTemplateAddTaskInputs = validateTemplateAddTaskInputs;
//# sourceMappingURL=template-add-task-middleware.js.map