"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SharedService = void 0;
const sync_integration_columns_1 = require("../constants/sync-integration-columns");
const error_1 = require("../types/errors/error");
const logger_service_1 = require("./logger-service");
const monday_service_1 = require("./monday-service");
const monday_1 = require("../utils/monday");
const dates_1 = require("../utils/dates");
const logger = logger_service_1.LoggerService.getLogger();
class SharedService {
    constructor() {
        this.mondayService = new monday_service_1.MondayService();
    }
    async getTaskType(monAccessToken, itemId, columnId) {
        const [itemColumnsValuesError, item] = await this.mondayService.queryItemColumnsValues(monAccessToken, itemId);
        if (itemColumnsValuesError) {
            logger.error({
                message: `itemColumnsValuesError: ${JSON.stringify(itemColumnsValuesError)}`,
                fileName: 'shared service',
                functionName: 'getTaskType',
            });
            return [itemColumnsValuesError, null];
        }
        const [taskTypeError, taskType] = (0, monday_1.getColumnTextByColumnId)(item, columnId);
        if (taskTypeError) {
            logger.error({
                message: `no task type found on item: ${JSON.stringify(item)}`,
                fileName: 'shared service',
                functionName: 'getTaskType',
            });
            return [taskTypeError, null];
        }
        logger.info({
            message: 'task type found',
            fileName: 'shared service',
            functionName: 'getTaskType',
            data: `item: ${JSON.stringify(item)}, taskType: ${taskType}`,
        });
        return [null, taskType];
    }
    async getSameTypeItems(monAccessToken, boardId, taskType) {
        const [itemsError, items] = await this.mondayService.queryItemsColumnsValuesByBoardId(monAccessToken, boardId);
        if ((items === null || items === void 0 ? void 0 : items.length) === 0 || itemsError) {
            logger.error({
                message: (items === null || items === void 0 ? void 0 : items.length) === 0
                    ? 'no items'
                    : `itemsError: ${JSON.stringify(itemsError)}`,
                fileName: 'shared service',
                functionName: 'getSameTypeItems',
            });
            return [
                (items === null || items === void 0 ? void 0 : items.length) === 0 ? new error_1.BadRequestError() : itemsError !== null && itemsError !== void 0 ? itemsError : new error_1.InternalServerError(),
                null,
            ];
        }
        const [sameTypeItemsError, sameTypeItems] = (0, monday_1.filterItemsByColumnValue)(items, sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_TYPE_COLUMN, taskType);
        if ((sameTypeItems === null || sameTypeItems === void 0 ? void 0 : sameTypeItems.length) === 0 || sameTypeItemsError) {
            logger.error({
                message: (sameTypeItems === null || sameTypeItems === void 0 ? void 0 : sameTypeItems.length) === 0
                    ? 'no matching sameTypeItems'
                    : `sameTypeItemsError: ${JSON.stringify(sameTypeItemsError)}`,
                fileName: 'shared service',
                functionName: 'getSameTypeItems',
            });
            return [
                (sameTypeItems === null || sameTypeItems === void 0 ? void 0 : sameTypeItems.length) === 0 ? new error_1.BadRequestError() : sameTypeItemsError !== null && sameTypeItemsError !== void 0 ? sameTypeItemsError : new error_1.InternalServerError(),
                null,
            ];
        }
        logger.info({
            message: 'sameTypeItems found',
            fileName: 'shared service',
            functionName: 'getSameTypeItems',
            data: `taskType: ${taskType}, sameTypeItems: ${JSON.stringify(sameTypeItems)}`,
        });
        return [null, sameTypeItems];
    }
    async getNextReturnItem(monAccessToken, returnItem, returnItemParent, isItemCustomTemplate, taskType, skippingNumber) {
        const [returnOrderColumnError, returnOrderColumn] = (0, dates_1.getReturnOrderColumn)(taskType, isItemCustomTemplate);
        if (returnOrderColumnError) {
            logger.error({
                message: `returnOrderColumnError: ${JSON.stringify(returnOrderColumnError)}`,
                fileName: 'shared service',
                functionName: 'getNextReturnItem',
            });
            return [returnOrderColumnError, null];
        }
        const [returnItemOrderError, returnItemOrder] = (0, monday_1.getColumnTextByColumnId)(returnItem, returnOrderColumn);
        if (returnItemOrderError) {
            logger.error({
                message: `returnItemOrderError: ${JSON.stringify(returnItemOrderError)}`,
                fileName: 'shared service',
                functionName: 'getNextReturnItem',
            });
            return [returnItemOrderError, null];
        }
        let [returnItemsError, returnItems] = await this.mondayService.querySubItems(monAccessToken, parseInt(returnItemParent.id));
        if (returnItemsError || !returnItems) {
            logger.error({
                message: `returnItemsError: ${returnItemsError ? JSON.stringify(returnItemsError) : 'null'}`,
                fileName: 'shared service',
                functionName: 'getNextReturnItem',
            });
            return [returnItemsError !== null && returnItemsError !== void 0 ? returnItemsError : new error_1.BadRequestError(), null];
        }
        if (returnItems.length === 1) {
            return [null, { nextReturnItem: returnItems[0], isSingle: true }];
        }
        if (isItemCustomTemplate) {
            returnItems = returnItems.reduce((result, returnItem) => {
                const returnIdColumn = returnItem.columns.filter((column) => column.id === sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.CUSTOM_FILING_TASK_RETURN_ORDER_COLUMN);
                if (returnIdColumn.length && returnIdColumn[0].text) {
                    result.push(returnItem);
                }
                return result;
            }, []);
            if (!returnItems.length) {
                logger.error({
                    message: 'no custom returnItems',
                    fileName: 'shared servicee',
                    functionName: 'getNextReturnItem',
                });
                return [new error_1.InternalServerError(), null];
            }
        }
        const returnItemsOrder = returnItems.reduce((result, item) => {
            const orderColumn = item.columns.filter((column) => column.id === returnOrderColumn);
            if (orderColumn.length) {
                result.push({
                    id: item.id,
                    order: parseInt(orderColumn[0].text),
                });
            }
            return result;
        }, []);
        if (!returnItemsOrder.length) {
            logger.error({
                message: 'no returnItemsOrder',
                fileName: 'shared service',
                functionName: 'getNextReturnItem',
            });
            return [new error_1.InternalServerError(), null];
        }
        returnItemsOrder.sort((a, b) => a.order - b.order);
        const nextReturnIndex = (parseInt(returnItemOrder) + skippingNumber) % returnItemsOrder.length;
        const nextReturnItemId = returnItemsOrder[nextReturnIndex].id;
        const [nextReturnItemError, nextReturnItem] = (0, monday_1.getItemFromListById)(parseInt(nextReturnItemId), returnItems);
        if (nextReturnItemError) {
            logger.error({
                message: `no matching item found from list, nextReturnItemId: ${nextReturnItemId}, sameTypeItems: ${JSON.stringify(returnItems)}`,
                fileName: 'shared service',
                functionName: 'getNextReturnItem',
            });
            return [nextReturnItemError, null];
        }
        return [null, { nextReturnItem, isSingle: false }];
    }
    pushNotification(monAccessToken, boardId, userId, message) {
        this.mondayService.createNotification(monAccessToken, boardId, userId, message);
    }
}
exports.SharedService = SharedService;
//# sourceMappingURL=shared-service.js.map