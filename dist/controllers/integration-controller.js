"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncStatusAndTasks = void 0;
const integration_service_1 = require("../services/integration-service");
const errors_1 = require("../constants/errors");
const logger_service_1 = require("../services/logger-service");
const sync_integration_columns_1 = require("../constants/sync-integration-columns");
const shared_service_1 = require("../services/shared-service");
const monday_1 = require("../utils/monday");
const monday_service_1 = require("../services/monday-service");
const sync_integration_values_1 = require("../constants/sync-integration-values");
const cache_service_1 = require("../services/cache-service");
const cache_1 = require("../constants/cache");
const error_1 = require("../types/errors/error");
const logger = logger_service_1.LoggerService.getLogger();
const syncStatusAndTasks = async (request, response) => {
    var _a, _b;
    const { monAccessToken, userId } = (_a = response === null || response === void 0 ? void 0 : response.locals) === null || _a === void 0 ? void 0 : _a.mondayAuthorization;
    const { boardId, itemId } = (_b = response === null || response === void 0 ? void 0 : response.locals) === null || _b === void 0 ? void 0 : _b.inputs;
    let res = await _syncStatusAndTasks(monAccessToken, itemId, boardId, userId);
    if (res instanceof Error) {
        logger.error({
            message: `Failed to complete, retrying... `,
            fileName: 'integration controller',
            functionName: 'syncStatusAndTasks',
        });
        return response.status(400).send({ success: false });
    }
    return response.status(200).send({ success: true });
};
exports.syncStatusAndTasks = syncStatusAndTasks;
const _syncStatusAndTasks = async (monAccessToken, itemId, boardId, userId) => {
    const cacheService = cache_service_1.CacheService.getCacheService();
    cacheService.setKey(cache_1.CACHE.MONDAY_TOKEN, monAccessToken, cache_1.CACHE.MONDAY_TOKEN_TTL);
    const integrationService = new integration_service_1.IntegrationService();
    const mondayService = new monday_service_1.MondayService();
    const sharedService = new shared_service_1.SharedService();
    const [taskTypeError, { taskType, obligationId }] = await sharedService.getTaskType(monAccessToken, itemId, sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_TYPE_COLUMN);
    if (taskTypeError) {
        // sharedService.pushNotification(monAccessToken, boardId, userId, ERRORS.GENERIC_ERROR);
        return taskTypeError;
    }
    const [sameTypeItemsError, sameTypeItems] = await sharedService.getSameTypeItems(monAccessToken, boardId, taskType, obligationId);
    if (sameTypeItemsError) {
        sharedService.pushNotification(monAccessToken, boardId, userId, errors_1.ERRORS.GENERIC_ERROR);
        return new Error();
    }
    const [itemError, item] = (0, monday_1.getItemFromListById)(itemId, sameTypeItems);
    if (itemError) {
        logger.error({
            message: `no matching item found from list, itemId: ${itemId}, sameTypeItems: ${JSON.stringify(sameTypeItems)}`,
            fileName: 'integration controller',
            functionName: 'syncStatusAndTasks',
        });
        return new Error();
    }
    logger.info({
        message: 'item found',
        fileName: 'integration controller',
        functionName: 'syncStatusAndTasks',
        data: `item: ${JSON.stringify(item)}`,
    });
    const [shouldCreateNextItemError, createNextItemParams] = await integrationService.shouldCreateNextItem(monAccessToken, item, taskType, boardId, userId);
    const [shouldSyncNextStatusError, syncNextStatusParams] = await integrationService.shouldSyncNextStatus(monAccessToken, boardId, item, sameTypeItems, taskType);
    if (shouldSyncNextStatusError || shouldCreateNextItemError) {
        if ((shouldSyncNextStatusError === null || shouldSyncNextStatusError === void 0 ? void 0 : shouldSyncNextStatusError.type) === error_1.ErrorType.TIMEOUT_ERROR ||
            (shouldCreateNextItemError === null || shouldCreateNextItemError === void 0 ? void 0 : shouldCreateNextItemError.type) === error_1.ErrorType.TIMEOUT_ERROR) {
            return { type: error_1.ErrorType.TIMEOUT_ERROR };
        }
        const message = shouldSyncNextStatusError
            ? errors_1.ERRORS.INTEGRATION_SYNC_NEXT_STATUS_ERROR
            : errors_1.ERRORS.INTEGRATION_CREATE_NEXT_ITEM_ERROR;
        sharedService.pushNotification(monAccessToken, boardId, userId, message);
        return new Error(shouldSyncNextStatusError ? shouldSyncNextStatusError.message : shouldCreateNextItemError === null || shouldCreateNextItemError === void 0 ? void 0 : shouldCreateNextItemError.message);
    }
    if (createNextItemParams && syncNextStatusParams) {
        //good params logs
        let { nextActiveItemId } = syncNextStatusParams;
        let { nextTaskName, nextTaskColumnValues } = createNextItemParams;
        const [[changeItemStatusError, changeItemStatusSuccess], [createItemError, createItemSuccess]] = await Promise.all([
            mondayService.createItem(monAccessToken, boardId, nextTaskName, nextTaskColumnValues),
            mondayService.changeItemStatus(monAccessToken, boardId, nextActiveItemId, sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_STATUS_COLUMN, sync_integration_values_1.SYNC_INTEGRATION_VALUES.TASK_ACTIVE_STATUS),
        ]);
        if (changeItemStatusError || createItemError) {
            if ((changeItemStatusError === null || changeItemStatusError === void 0 ? void 0 : changeItemStatusError.type) === error_1.ErrorType.TIMEOUT_ERROR ||
                (createItemError === null || createItemError === void 0 ? void 0 : createItemError.type) === error_1.ErrorType.TIMEOUT_ERROR) {
                return { type: error_1.ErrorType.TIMEOUT_ERROR };
            }
            const message = changeItemStatusError
                ? errors_1.ERRORS.INTEGRATION_SYNC_NEXT_STATUS_ERROR
                : errors_1.ERRORS.INTEGRATION_CREATE_NEXT_ITEM_ERROR;
            sharedService.pushNotification(monAccessToken, boardId, userId, message);
            return new Error(changeItemStatusError ? changeItemStatusError.message : createItemError === null || createItemError === void 0 ? void 0 : createItemError.message);
        }
        logger.info({
            message: 'syncStatusAndTasks success',
            fileName: 'integration controller',
            functionName: 'syncStatusAndTasks',
            data: `syncNextStatusSuccess: ${JSON.stringify(changeItemStatusSuccess)}, createNextItemSuccess: ${JSON.stringify(createItemSuccess)}`,
        });
    }
    const [changeItemStatusErr, changeItemStatusRes] = await mondayService.changeItemStatus(monAccessToken, boardId, itemId, sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_STATUS_COLUMN, sync_integration_values_1.SYNC_INTEGRATION_VALUES.TASK_READY_FOR_TRANSFER);
    if (changeItemStatusErr) {
        if (changeItemStatusErr.type === error_1.ErrorType.TIMEOUT_ERROR) {
            return { type: error_1.ErrorType.TIMEOUT_ERROR };
        }
        logger.error({
            message: 'change status error',
            fileName: 'integration controller',
            functionName: 'syncStatusAndTasks',
            data: `item status hasn't changed: ${JSON.stringify(changeItemStatusErr.message)}`,
        });
    }
    logger.info({
        message: 'change status success',
        fileName: 'integration controller',
        functionName: 'syncStatusAndTasks',
        data: `item status successfully changed: ${JSON.stringify(changeItemStatusRes)}`,
    });
};
//# sourceMappingURL=integration-controller.js.map