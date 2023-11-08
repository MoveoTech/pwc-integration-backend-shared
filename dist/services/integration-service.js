"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationService = void 0;
const monday_service_1 = require("./monday-service");
const integration_1 = require("../utils/integration");
const sync_integration_columns_1 = require("../constants/sync-integration-columns");
const error_1 = require("../types/errors/error");
const errors_1 = require("../constants/errors");
const sync_integration_values_1 = require("../constants/sync-integration-values");
const logger_service_1 = require("../services/logger-service");
const monday_1 = require("../utils/monday");
const dates_1 = require("../utils/dates");
const shared_service_1 = require("./shared-service");
const skipping_numbers_1 = require("../constants/skipping-numbers");
const logger = logger_service_1.LoggerService.getLogger();
class IntegrationService {
    constructor() {
        this.mondayService = new monday_service_1.MondayService();
        this.sharedService = new shared_service_1.SharedService();
    }
    async syncNextStatus(monAccessToken, boardId, item, sameTypeItems, taskType) {
        var _a, _b, _c;
        const [relatedItemsError, relatedItems] = (0, integration_1.getRelatedItemsByTaskType)(item, sameTypeItems, taskType);
        if (relatedItemsError) {
            logger.error({
                message: `no related items found from list, item: ${JSON.stringify(item)}, sameTypeItems: ${JSON.stringify(sameTypeItems)}, taskType: ${taskType}`,
                fileName: 'integration service',
                functionName: 'syncNextStatus',
            });
            return [relatedItemsError, null];
        }
        const itemsDates = relatedItems.reduce((result, relatedItem) => {
            const taskDateColumn = relatedItem.columns.filter((column) => column.id === sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_DUE_DATE_COLUMN);
            const taskOrderColumn = relatedItem.columns.filter((column) => column.id === sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_ORDER_COLUMN);
            const taskReturnIdColumn = relatedItem.columns.filter((column) => column.id === sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_RETURN_ID_COLUMN);
            if (taskDateColumn.length && taskOrderColumn.length && taskReturnIdColumn.length) {
                result.push({
                    id: relatedItem.id,
                    taskDueDate: new Date(taskDateColumn[0].text),
                    taskOrder: taskOrderColumn[0].text,
                    taskReturnId: taskReturnIdColumn[0].text,
                });
            }
            return result;
        }, []);
        if (!itemsDates.length) {
            logger.error({
                message: 'no itemsDates',
                fileName: 'integration service',
                functionName: 'syncNextStatus',
            });
            return [new error_1.InternalServerError(), null];
        }
        itemsDates.sort((a, b) => a.taskDueDate - b.taskDueDate || +a.taskOrder - +b.taskOrder);
        const currentTaskDate = (_a = item.columns.find((column) => column.id === sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_DUE_DATE_COLUMN)) === null || _a === void 0 ? void 0 : _a.text;
        const currentTaskOrder = (_b = item.columns.find((column) => column.id === sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_ORDER_COLUMN)) === null || _b === void 0 ? void 0 : _b.text;
        const currentTaskReturnId = (_c = item.columns.find((column) => column.id === sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_RETURN_ID_COLUMN)) === null || _c === void 0 ? void 0 : _c.text;
        if (!currentTaskDate) {
            logger.error({
                message: `no currentTaskDate, item columns: ${JSON.stringify(item === null || item === void 0 ? void 0 : item.columns)}`,
                fileName: 'integration service',
                functionName: 'syncNextStatus',
            });
            return [new error_1.InternalServerError(), null];
        }
        if (!currentTaskOrder) {
            logger.error({
                message: `no currentTaskOrder, item columns: ${JSON.stringify(item === null || item === void 0 ? void 0 : item.columns)}`,
                fileName: 'integration service',
                functionName: 'syncNextStatus',
            });
            return [new error_1.InternalServerError(), null];
        }
        if (!currentTaskReturnId) {
            logger.error({
                message: `no currentTaskReturnId, item columns: ${JSON.stringify(item === null || item === void 0 ? void 0 : item.columns)}`,
                fileName: 'integration service',
                functionName: 'syncNextStatus',
            });
            return [new error_1.InternalServerError(), null];
        }
        const currentTaskDateObj = new Date(currentTaskDate);
        const filterFutureTasks = itemsDates.filter((itemDate) => itemDate.taskDueDate >= currentTaskDateObj && itemDate.id !== item.id);
        const filterRelevantTasks = filterFutureTasks.filter((itemData) => itemData.taskDueDate > currentTaskDateObj ||
            (itemData.taskDueDate.getTime() === currentTaskDateObj.getTime() &&
                itemData.taskOrder > currentTaskOrder &&
                itemData.taskReturnId === currentTaskReturnId) ||
            (itemData.taskDueDate.getTime() === currentTaskDateObj.getTime() &&
                itemData.taskReturnId !== currentTaskReturnId));
        if (!filterRelevantTasks.length) {
            logger.error({
                message: `no relevant tasks, itemsDates: ${itemsDates}, currentTaskDate: ${JSON.stringify(currentTaskDate)}`,
                fileName: 'integration service',
                functionName: 'syncNextStatus',
            });
            return [new error_1.InternalServerError(), null];
        }
        let nextActiveItem = filterRelevantTasks[0];
        let filteredTasksBySameDate = filterRelevantTasks.filter((i) => i.taskDueDate.getTime() === nextActiveItem.taskDueDate.getTime());
        const filteredSameReturnId = filteredTasksBySameDate.filter((itemData) => itemData.taskReturnId === currentTaskReturnId);
        if (filteredSameReturnId.length) {
            nextActiveItem = filteredSameReturnId[0];
        }
        else {
            nextActiveItem = filteredTasksBySameDate[0];
        }
        const [itemStatusError, itemStatus] = await this.mondayService.changeItemStatus(monAccessToken, boardId, parseInt(nextActiveItem.id), sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_STATUS_COLUMN, sync_integration_values_1.SYNC_INTEGRATION_VALUES.TASK_ACTIVE_STATUS);
        if (itemStatusError) {
            logger.error({
                message: `itemStatusError: ${JSON.stringify(itemStatusError)}`,
                fileName: 'integration service',
                functionName: 'syncNextStatus',
            });
            return [itemStatusError, null];
        }
        if (itemStatus) {
            return [null, nextActiveItem.id];
        }
        return [new error_1.InternalServerError(), null];
    }
    async createNextItem(monAccessToken, item, taskType, boardId, userId) {
        const [produceTasksError, produceTasks] = await this.checkProduceTasks(monAccessToken, item, taskType);
        if (produceTasksError) {
            logger.error({
                message: `produceTasksError: ${JSON.stringify(produceTasksError)}`,
                fileName: 'integration service',
                functionName: 'createNextItem',
            });
            return [produceTasksError, null];
        }
        if (!produceTasks || produceTasks.isStopped) {
            this.sharedService.pushNotification(monAccessToken, boardId, userId, errors_1.ERRORS.STOP_PRODUCE);
            return [null, errors_1.ERRORS.STOP_PRODUCE];
        }
        const [nextTaskError, nextTask] = await this.buildNextTask(monAccessToken, item, produceTasks.parentItem, taskType);
        if (nextTaskError) {
            logger.error({
                message: `nextTaskError: ${JSON.stringify(nextTaskError)}`,
                fileName: 'integration service',
                functionName: 'createNextItem',
            });
            return [nextTaskError, null];
        }
        const [createdTaskError, createdTask] = await this.mondayService.createItem(monAccessToken, boardId, nextTask.name, nextTask.columnValues);
        if (createdTaskError) {
            logger.error({
                message: `createdTaskError: ${JSON.stringify(createdTaskError)}`,
                fileName: 'integration service',
                functionName: 'createNextItem',
            });
            return [createdTaskError, null];
        }
        return [null, createdTask];
    }
    async checkProduceTasks(monAccessToken, item, taskType) {
        let taskDefinitionParentColumnId;
        let produceTasksColumnId;
        switch (taskType) {
            case sync_integration_values_1.SYNC_INTEGRATION_VALUES.FILING_TASK_TYPE:
                taskDefinitionParentColumnId = sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_OBLIGATION_ID_COLUMN;
                produceTasksColumnId = sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.OBLIGATION_PRODUCE_TASKS_COLUMN;
                break;
            case sync_integration_values_1.SYNC_INTEGRATION_VALUES.DATA_TASK_TYPE:
                taskDefinitionParentColumnId = sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_BUSINESS_STREAM_ID_COLUMN;
                produceTasksColumnId = sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.BUSINESS_STREAM_PRODUCE_TASKS_COLUMN;
                break;
            default:
                return [new error_1.BadRequestError(), null];
        }
        const [taskDefinitionParentIdError, taskDefinitionParentId] = (0, monday_1.getColumnTextByColumnId)(item, taskDefinitionParentColumnId);
        if (taskDefinitionParentIdError) {
            logger.error({
                message: `taskDefinitionParentIdError: ${JSON.stringify(taskDefinitionParentIdError)}`,
                fileName: 'integration service',
                functionName: 'checkProduceTasks',
            });
            return [taskDefinitionParentIdError, null];
        }
        const [taskDefinitionParentError, taskDefinitionParent] = await this.mondayService.queryItemColumnsValues(monAccessToken, parseInt(taskDefinitionParentId));
        if (taskDefinitionParentError) {
            logger.error({
                message: `taskDefinitionParentError: ${JSON.stringify(taskDefinitionParentError)}`,
                fileName: 'integration service',
                functionName: 'checkProduceTasks',
            });
            return [taskDefinitionParentError, null];
        }
        const [produceStatusError, produceStatus] = (0, monday_1.getColumnTextByColumnId)(taskDefinitionParent, produceTasksColumnId);
        if (produceStatusError) {
            logger.error({
                message: `produceStatusError: ${JSON.stringify(produceStatusError)}`,
                fileName: 'integration service',
                functionName: 'checkProduceTasks',
            });
            return [produceStatusError, null];
        }
        return [
            null,
            {
                parentItem: taskDefinitionParent,
                isStopped: produceStatus === sync_integration_values_1.SYNC_INTEGRATION_VALUES.STOP_PRODUCE_TASKS_STATUS,
            },
        ];
    }
    async buildNextTask(monAccessToken, item, parentItem, taskType) {
        const [taskCreationParamsError, taskCreationParams] = (0, monday_1.getTaskCreationParams)(item);
        if (taskCreationParamsError) {
            logger.error({
                message: `taskCreationParamsError: ${JSON.stringify(taskCreationParamsError)}`,
                fileName: 'integration service',
                functionName: 'buildNextTask',
            });
            return [taskCreationParamsError, null];
        }
        const [[currentTaskError, currentTask], [currentReturnItemError, currentReturnItem]] = await Promise.all([
            this.mondayService.queryItemColumnsValues(monAccessToken, taskCreationParams.taskId),
            this.mondayService.queryItemColumnsValues(monAccessToken, taskCreationParams.returnId),
        ]);
        if (currentTaskError || !currentTask || currentReturnItemError) {
            logger.error({
                message: `currentTaskError: ${currentTaskError ? JSON.stringify(currentTaskError) : 'null'}, returnItemError: ${currentReturnItemError ? JSON.stringify(currentReturnItemError) : 'null'}`,
                fileName: 'integration service',
                functionName: 'buildNextTask',
            });
            return [new error_1.InternalServerError(), null];
        }
        if (!(currentReturnItem === null || currentReturnItem === void 0 ? void 0 : currentReturnItem.parentItemId)) {
            logger.error({
                message: `no return parent item: ${JSON.stringify(currentReturnItem)}`,
                fileName: 'integration service',
                functionName: 'buildNextTask',
            });
            return [new error_1.InternalServerError(), null];
        }
        let [returnItemParentError, returnItemParent] = await this.mondayService.queryItemColumnsValues(monAccessToken, parseInt(currentReturnItem === null || currentReturnItem === void 0 ? void 0 : currentReturnItem.parentItemId));
        if (returnItemParentError || !returnItemParent) {
            logger.error({
                message: `returnItemParentError: ${returnItemParentError ? JSON.stringify(returnItemParentError) : 'null'}`,
                fileName: 'integration service',
                functionName: 'buildNextTask',
            });
            return [returnItemParentError !== null && returnItemParentError !== void 0 ? returnItemParentError : new error_1.InternalServerError(), null];
        }
        const [isItemCustomTemplateError, isItemCustomTemplate] = (0, integration_1.isCustomTemplate)(parentItem, taskType);
        if (isItemCustomTemplateError) {
            logger.error({
                message: `isItemCustomTemplateError: ${JSON.stringify(isItemCustomTemplateError)}`,
                fileName: 'integration service',
                functionName: 'buildNextTask',
            });
            return [isItemCustomTemplateError, null];
        }
        const [nextReturnItemError, nextReturnItem] = await this.sharedService.getNextReturnItem(monAccessToken, currentReturnItem, returnItemParent, isItemCustomTemplate, taskType, skipping_numbers_1.SKIPPING_NUMBER);
        if (nextReturnItemError) {
            logger.error({
                message: `nextReturnItemError: ${JSON.stringify(nextReturnItemError)}`,
                fileName: 'integration service',
                functionName: 'buildNextTask',
            });
            return [nextReturnItemError, null];
        }
        if (isItemCustomTemplate) {
            const [templateIdError, templateId] = (0, monday_1.getColumnTextByColumnId)(returnItemParent, sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.CUSTOM_FILING_TASK_DATE_TEMPLATE_COLUMN);
            if (templateIdError) {
                logger.error({
                    message: `templateIdError: ${JSON.stringify(templateIdError)}`,
                    fileName: 'integration service',
                    functionName: 'buildNextTask',
                });
                return [templateIdError, null];
            }
            [returnItemParentError, returnItemParent] = await this.mondayService.queryItemColumnsValues(monAccessToken, parseInt(templateId));
            if (returnItemParentError || !returnItemParent) {
                logger.error({
                    message: `replace returnItemParentError: ${returnItemParentError ? JSON.stringify(returnItemParentError) : 'null'}`,
                    fileName: 'integration service',
                    functionName: 'buildNextTask',
                });
                return [returnItemParentError !== null && returnItemParentError !== void 0 ? returnItemParentError : new error_1.InternalServerError(), null];
            }
        }
        const [submissionsDatesError, submissionsDates] = (0, dates_1.buildSubmissionDates)(taskCreationParams, currentTask, taskType, currentReturnItem, nextReturnItem, returnItemParent, isItemCustomTemplate, skipping_numbers_1.SKIPPING_NUMBER);
        if (submissionsDatesError) {
            logger.error({
                message: `submissionsDatesError: ${JSON.stringify(submissionsDatesError)}`,
                fileName: 'integration service',
                functionName: 'buildNextTask',
            });
            return [submissionsDatesError, null];
        }
        const [ownerNameError, ownerName] = (0, monday_1.getColumnTextByColumnId)(item, sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_OWNER_COLUMN);
        if (ownerNameError) {
            logger.error({
                message: `ownerNameError: ${JSON.stringify(ownerNameError)}`,
                fileName: 'integration service',
                functionName: 'buildNextTask',
            });
            return [ownerNameError, null];
        }
        const [ownerIdError, ownerId] = ownerName !== '' ? await this.mondayService.getUserIdByName(monAccessToken, ownerName) : [null, ownerName];
        if (ownerIdError) {
            logger.error({
                message: `ownerIdError: ${JSON.stringify(ownerIdError)}`,
                fileName: 'integration service',
                functionName: 'buildNextTask',
            });
            return [ownerIdError, null];
        }
        const [regionError, region] = (0, monday_1.getColumnTextByColumnId)(item, sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_REGION_COLUMN);
        if (regionError) {
            logger.error({
                message: `regionError: ${JSON.stringify(regionError)}`,
                fileName: 'integration service',
                functionName: 'buildNextTask',
            });
            return [regionError, null];
        }
        const [itemColumnsError, itemColumns] = (0, monday_1.createItemColumns)(submissionsDates, parentItem, currentTask, taskType, taskCreationParams.taskId, parseInt(nextReturnItem.nextReturnItem.id), isItemCustomTemplate, false, ownerId.toString(), region);
        if (itemColumnsError) {
            logger.error({
                message: `itemColumnsError: ${JSON.stringify(itemColumnsError)}`,
                fileName: 'integration service',
                functionName: 'buildNextTask',
            });
            return [itemColumnsError, null];
        }
        return [
            null,
            {
                name: isItemCustomTemplate ? itemColumns[sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_TEXT_COLUMN] : currentTask.name,
                columnValues: itemColumns,
            },
        ];
    }
}
exports.IntegrationService = IntegrationService;
//# sourceMappingURL=integration-service.js.map