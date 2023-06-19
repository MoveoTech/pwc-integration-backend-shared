"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncStatusAndTasks = void 0;
const integration_service_1 = require("../services/integration-service");
const logger_service_1 = require("../services/logger-service");
const sync_integration_columns_1 = require("../constants/sync-integration-columns");
const shared_service_1 = require("../services/shared-service");
const monday_1 = require("../utils/monday");
const sync_integration_values_1 = require("../constants/sync-integration-values");
const error_1 = require("../types/errors/error");
const queue_1 = __importDefault(require("../utils/queue"));
const monday_queries_1 = require("../services/monday-queries");
const utils_1 = require("../utils/utils");
const logger = logger_service_1.LoggerService.getLogger();
const syncStatusAndTasks = async (request, response) => {
    var _a, _b;
    const { monAccessToken, userId } = (_a = response === null || response === void 0 ? void 0 : response.locals) === null || _a === void 0 ? void 0 : _a.mondayAuthorization;
    const { boardId, itemId } = (_b = response === null || response === void 0 ? void 0 : response.locals) === null || _b === void 0 ? void 0 : _b.inputs;
    const res = await _syncStatusAndTasks(monAccessToken, itemId, boardId, userId);
    if ((res === null || res === void 0 ? void 0 : res.type) === error_1.ErrorType.TIMEOUT_ERROR) {
        logger.error({
            message: `Failed to complete, retrying... `,
            fileName: 'integration controller',
            functionName: 'syncStatusAndTasks',
            data: `error: ${JSON.stringify(res.message)}`,
        });
        return response.status(400).send({ success: false });
    }
    else {
        return response.status(200).send({ success: true });
    }
};
exports.syncStatusAndTasks = syncStatusAndTasks;
const _syncStatusAndTasks = async (monAccessToken, itemId, boardId, userId) => {
    const integrationService = new integration_service_1.IntegrationService();
    const sharedService = new shared_service_1.SharedService();
    const queue = queue_1.default.getQueue();
    const [taskTypeError, { taskType, obligationId }] = await sharedService.getTaskType(monAccessToken, itemId, sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_TYPE_COLUMN);
    if (taskTypeError) {
        // sharedService.pushNotification(monAccessToken, boardId, userId, ERRORS.GENERIC_ERROR);
        return taskTypeError;
    }
    const [sameTypeItemsError, sameTypeItems] = await sharedService.getSameTypeItems(monAccessToken, boardId, taskType, obligationId, false);
    if (sameTypeItemsError) {
        // sharedService.pushNotification(monAccessToken, boardId, userId, ERRORS.GENERIC_ERROR);
        return sameTypeItemsError;
    }
    const [itemError, item] = (0, monday_1.getItemFromListById)(itemId, sameTypeItems);
    if (itemError) {
        logger.error({
            message: `no matching item found from list, itemId: ${itemId}, sameTypeItems: ${JSON.stringify(sameTypeItems)}`,
            fileName: 'integration controller',
            functionName: 'syncStatusAndTasks',
        });
        return itemError;
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
        // const message = shouldSyncNextStatusError
        //   ? ERRORS.INTEGRATION_SYNC_NEXT_STATUS_ERROR
        //   : ERRORS.INTEGRATION_CREATE_NEXT_ITEM_ERROR;
        // sharedService.pushNotification(monAccessToken, boardId, userId, message);
        return new Error(shouldSyncNextStatusError ? shouldSyncNextStatusError.message : shouldCreateNextItemError === null || shouldCreateNextItemError === void 0 ? void 0 : shouldCreateNextItemError.message);
    }
    if (createNextItemParams && syncNextStatusParams) {
        try {
            let { nextActiveItemId } = syncNextStatusParams;
            let { nextTaskName, nextTaskColumnValues } = createNextItemParams;
            const changeStatusToActiveVariables = {
                boardId,
                itemId: nextActiveItemId,
                columnValues: JSON.stringify({
                    [sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_STATUS_COLUMN]: sync_integration_values_1.SYNC_INTEGRATION_VALUES.TASK_ACTIVE_STATUS,
                }),
            };
            const changeStatusToReadyToTransferVariables = {
                boardId,
                itemId,
                columnValues: JSON.stringify({
                    [sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_STATUS_COLUMN]: sync_integration_values_1.SYNC_INTEGRATION_VALUES.TASK_READY_FOR_TRANSFER,
                }),
            };
            const createItemVariables = {
                boardId,
                itemName: nextTaskName,
                columnValues: JSON.stringify(nextTaskColumnValues),
            };
            const messages = [
                {
                    query: monday_queries_1.queries.changeItemColumnValue,
                    variables: changeStatusToActiveVariables,
                },
                {
                    query: monday_queries_1.queries.changeItemColumnValue,
                    variables: changeStatusToReadyToTransferVariables,
                },
                {
                    query: monday_queries_1.queries.createItem,
                    variables: createItemVariables,
                },
            ];
            var code = (0, utils_1.codeGenerator)();
            await (queue === null || queue === void 0 ? void 0 : queue.add('messages', {
                messages,
            }, {
                jobId: `${boardId}-${Date.now()}-${code}`,
                removeOnComplete: true,
                removeOnFail: true,
            }));
        }
        catch (error) {
            logger.error({
                message: 'inject to queue error',
                fileName: 'integration controller',
                functionName: 'syncStatusAndTasks',
                data: `messages failed to inject to queue: ${JSON.stringify(error.message)}`,
            });
        }
    }
    else {
        logger.error({
            message: 'message not added to queue',
            fileName: 'integration controller',
            functionName: 'syncStatusAndTasks',
            data: `createNextItemsParams: ${JSON.stringify(createNextItemParams)}, syncNextStatusParams: ${JSON.stringify(syncNextStatusParams)}`,
        });
    }
};
//# sourceMappingURL=integration-controller.js.map