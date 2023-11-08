"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activateTasks = void 0;
const logger_service_1 = require("../services/logger-service");
const activate_tasks_service_1 = require("../services/activate-tasks-service");
const cache_service_1 = require("../services/cache-service");
const cache_1 = require("../constants/cache");
const logger = logger_service_1.LoggerService.getLogger();
const activateTasks = async (request, response) => {
    var _a, _b;
    const { monAccessToken, userId } = (_a = response === null || response === void 0 ? void 0 : response.locals) === null || _a === void 0 ? void 0 : _a.mondayAuthorization;
    const { boardIds, parentsItemsData, isLastTasksGroup } = (_b = response === null || response === void 0 ? void 0 : response.locals) === null || _b === void 0 ? void 0 : _b.inputs;
    const cacheService = cache_service_1.CacheService.getCacheService();
    cacheService.setKey(cache_1.CACHE.MONDAY_TOKEN, monAccessToken, cache_1.CACHE.MONDAY_TOKEN_TTL);
    const activateTasksService = new activate_tasks_service_1.ActivateTasksService();
    activateTasksService.activateParentsItems(monAccessToken, userId, boardIds, parentsItemsData, isLastTasksGroup);
    return response.status(200).send({ success: true });
};
exports.activateTasks = activateTasks;
//# sourceMappingURL=activate-tasks-controller.js.map