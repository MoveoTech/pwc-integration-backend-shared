"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncStatusAndTasks = void 0;
const integration_service_1 = require("../services/integration-service");
const error_1 = require("../types/errors/error");
const errors_1 = require("../constants/errors");
const logger_service_1 = require("../services/logger-service");
const sync_integration_columns_1 = require("../constants/sync-integration-columns");
const shared_service_1 = require("../services/shared-service");
const monday_1 = require("../utils/monday");
const monday_service_1 = require("../services/monday-service");
const sync_integration_values_1 = require("../constants/sync-integration-values");
const cache_service_1 = require("../services/cache-service");
const cache_1 = require("../constants/cache");
const logger = logger_service_1.LoggerService.getLogger();
const syncStatusAndTasks = async (request, response) => {
    var _a, _b;
    const { monAccessToken, userId } = (_a = response === null || response === void 0 ? void 0 : response.locals) === null || _a === void 0 ? void 0 : _a.mondayAuthorization;
    const { boardId, itemId } = (_b = response === null || response === void 0 ? void 0 : response.locals) === null || _b === void 0 ? void 0 : _b.inputs;
    const cacheService = cache_service_1.CacheService.getCacheService();
    cacheService.setKey(cache_1.CACHE.MONDAY_TOKEN, monAccessToken, cache_1.CACHE.MONDAY_TOKEN_TTL);
    const integrationService = new integration_service_1.IntegrationService();
    const mondayService = new monday_service_1.MondayService();
    const sharedService = new shared_service_1.SharedService();
    const [taskTypeError, taskType] = await sharedService.getTaskType(monAccessToken, itemId, sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_TYPE_COLUMN);
    if (taskTypeError) {
        sharedService.pushNotification(monAccessToken, boardId, userId, errors_1.ERRORS.GENERIC_ERROR);
        return response.status(200).send(`${new error_1.InternalServerError()}`);
    }
    const [sameTypeItemsError, sameTypeItems] = await sharedService.getSameTypeItems(monAccessToken, boardId, taskType);
    if (sameTypeItemsError) {
        sharedService.pushNotification(monAccessToken, boardId, userId, errors_1.ERRORS.GENERIC_ERROR);
        return response.status(200).send(`${new error_1.InternalServerError()}`);
    }
    const [itemError, item] = (0, monday_1.getItemFromListById)(itemId, sameTypeItems);
    if (itemError) {
        logger.error({
            message: `no matching item found from list, itemId: ${itemId}, sameTypeItems: ${JSON.stringify(sameTypeItems)}`,
            fileName: 'integration controller',
            functionName: 'syncStatusAndTasks',
        });
        return [itemError, null];
    }
    logger.info({
        message: 'item found',
        fileName: 'integration controller',
        functionName: 'syncStatusAndTasks',
        data: `item: ${JSON.stringify(item)}`,
    });
    const [[syncNextStatusError, syncNextStatusSuccess], [createNextItemError, createNextItemSuccess]] = await Promise.all([
        integrationService.syncNextStatus(monAccessToken, boardId, item, sameTypeItems, taskType),
        integrationService.createNextItem(monAccessToken, item, taskType, boardId, userId),
    ]);
    if (syncNextStatusError || createNextItemError) {
        const message = syncNextStatusError
            ? errors_1.ERRORS.INTEGRATION_SYNC_NEXT_STATUS_ERROR
            : errors_1.ERRORS.INTEGRATION_CREATE_NEXT_ITEM_ERROR;
        sharedService.pushNotification(monAccessToken, boardId, userId, message);
        return response.status(200).send(`${new error_1.InternalServerError()}`);
    }
    logger.info({
        message: 'syncStatusAndTasks success',
        fileName: 'integration controller',
        functionName: 'syncStatusAndTasks',
        data: `syncNextStatusSuccess: ${JSON.stringify(syncNextStatusSuccess)}, createNextItemSuccess: ${JSON.stringify(createNextItemSuccess)}`,
    });
    mondayService.changeItemStatus(monAccessToken, boardId, itemId, sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_STATUS_COLUMN, sync_integration_values_1.SYNC_INTEGRATION_VALUES.TASK_READY_FOR_TRANSFER);
    return response.status(200).send({ syncNextStatusSuccess, createNextItemSuccess });
};
exports.syncStatusAndTasks = syncStatusAndTasks;
//# sourceMappingURL=integration-controller.js.map