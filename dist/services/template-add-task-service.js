"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateAddTaskService = void 0;
const error_1 = require("../types/errors/error");
const sync_integration_columns_1 = require("../constants/sync-integration-columns");
const sync_integration_values_1 = require("../constants/sync-integration-values");
const monday_service_1 = require("./monday-service");
const logger_service_1 = require("./logger-service");
const skipping_numbers_1 = require("../constants/skipping-numbers");
const shared_service_1 = require("./shared-service");
const monday_1 = require("../utils/monday");
const dates_1 = require("../utils/dates");
const logger = logger_service_1.LoggerService.getLogger();
class TemplateAddTaskService {
    constructor() {
        this.mondayService = new monday_service_1.MondayService();
        this.sharedService = new shared_service_1.SharedService();
    }
    async getTemplateTask(monAccessToken, itemId) {
        const [templateTaskError, templateTask] = await this.mondayService.queryItemColumnsValues(monAccessToken, itemId);
        if (templateTaskError) {
            logger.error({
                message: `templateTaskError: ${JSON.stringify(templateTaskError)}`,
                fileName: 'template add task service',
                functionName: 'getTemplateTask',
            });
            return [templateTaskError, null];
        }
        return [null, templateTask];
    }
    async getParentsItemsByType(monAccessToken, boardIds, taskType, templateId, obligationId) {
        let definitionBoardId;
        let produceTasksColumnId;
        let taskTemplateColumnId;
        let createdStatusColumnId;
        switch (taskType) {
            case sync_integration_values_1.SYNC_INTEGRATION_VALUES.FILING_TASK_TYPE:
                definitionBoardId = +boardIds.clientObligationBoardId;
                taskTemplateColumnId = sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.OBLIGATION_TASK_TEMPLATE_ID_COLUMN;
                produceTasksColumnId = sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.OBLIGATION_PRODUCE_TASKS_COLUMN;
                createdStatusColumnId = sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.OBLIGATION_CREATED_STATUS_COLUMN;
                break;
            case sync_integration_values_1.SYNC_INTEGRATION_VALUES.DATA_TASK_TYPE:
                definitionBoardId = +boardIds.businessStreamBoardId;
                taskTemplateColumnId = sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.BUSINESS_STREAM_TASK_TEMPLATE_ID_COLUMN;
                produceTasksColumnId = sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.BUSINESS_STREAM_PRODUCE_TASKS_COLUMN;
                createdStatusColumnId = sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.BUSINESS_STREAM_STATUS_COLUMN;
                break;
            default:
                return [new error_1.BadRequestError(), null];
        }
        const [itemsError, items] = await this.mondayService.queryItemsColumnsValuesByObligationId(monAccessToken, definitionBoardId, obligationId, taskType);
        if (itemsError) {
            logger.error({
                message: `itemsError: ${JSON.stringify(itemsError)}`,
                fileName: 'template add task service',
                functionName: 'getParentItemsByType',
            });
            return [itemsError, null];
        }
        const [filteredItemsError, filteredItems] = filterTemplateItems(items, taskTemplateColumnId, templateId, produceTasksColumnId, createdStatusColumnId, taskType);
        if (filteredItemsError) {
            logger.error({
                message: `filteredItemsError: ${JSON.stringify(filteredItemsError)}`,
                fileName: 'template add task service',
                functionName: 'getParentItemsByType',
            });
            return [filteredItemsError, null];
        }
        return [null, filteredItems];
    }
    getLastTaskItem(taskItems, parentItem, taskType) {
        let parentTaskColumnId;
        switch (taskType) {
            case sync_integration_values_1.SYNC_INTEGRATION_VALUES.FILING_TASK_TYPE:
                parentTaskColumnId = sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_OBLIGATION_ID_COLUMN;
                break;
            case sync_integration_values_1.SYNC_INTEGRATION_VALUES.DATA_TASK_TYPE:
                parentTaskColumnId = sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_BUSINESS_STREAM_ID_COLUMN;
                break;
            default:
                return [new error_1.BadRequestError(), null];
        }
        const [filteredSameTypeItemsError, filteredSameTypeItems] = (0, monday_1.filterItemsByColumnValue)(taskItems, parentTaskColumnId, parentItem.id.toString());
        if (filteredSameTypeItemsError) {
            logger.error({
                message: `filteredSameTypeItemsError: ${JSON.stringify(filteredSameTypeItemsError)}`,
                fileName: 'template add task service',
                functionName: 'getLastTaskItem',
            });
            return [filteredSameTypeItemsError, null];
        }
        const [sortedItemsError, sortedItems] = sortItemsByColumnId(filteredSameTypeItems, sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_SUBMISSION_DUE_DATE_COLUMN);
        if (sortedItemsError) {
            logger.error({
                message: `sortedItemsError: ${JSON.stringify(sortedItemsError)}`,
                fileName: 'template add task service',
                functionName: 'getLastTaskItem',
            });
            return [sortedItemsError, null];
        }
        const [lastTaskItemError, lastTaskItem] = findLastSubmissionItem(sortedItems);
        if (lastTaskItemError) {
            logger.error({
                message: `lastTaskItemError: ${JSON.stringify(lastTaskItemError)}`,
                fileName: 'template add task service',
                functionName: 'getLastTaskItem',
            });
            return [lastTaskItemError, null];
        }
        return [null, lastTaskItem];
    }
    async buildNextTaskItem(monAccessToken, taskCreationParams, templateTask, parentItem, currentReturnItem, returnItemParent, taskType, skipNum) {
        const [nextReturnItemError, nextReturnItem] = await this.sharedService.getNextReturnItem(monAccessToken, currentReturnItem, returnItemParent, false, taskType, skipNum);
        if (nextReturnItemError) {
            logger.error({
                message: `nextReturnItemError: ${JSON.stringify(nextReturnItemError)}`,
                fileName: 'template add task service',
                functionName: 'buildNextTaskItem',
            });
            return [nextReturnItemError, null];
        }
        const [submissionsDatesError, submissionsDates] = (0, dates_1.buildSubmissionDates)(taskCreationParams, templateTask, taskType, currentReturnItem, nextReturnItem, returnItemParent, false, skipNum);
        if (submissionsDatesError) {
            logger.error({
                message: `submissionsDatesError: ${JSON.stringify(submissionsDatesError)}`,
                fileName: 'template add task service',
                functionName: 'buildNextTaskItem',
            });
            return [submissionsDatesError, null];
        }
        const [itemColumnsError, itemColumns] = (0, monday_1.createItemColumns)(submissionsDates, parentItem, templateTask, taskType, parseInt(templateTask.id), parseInt(nextReturnItem.nextReturnItem.id), false, true);
        if (itemColumnsError) {
            logger.error({
                message: `itemColumnsError: ${JSON.stringify(itemColumnsError)}`,
                fileName: 'template add task service',
                functionName: 'buildNextTaskItem',
            });
            return [itemColumnsError, null];
        }
        return [
            null,
            {
                name: templateTask.name,
                columnValues: itemColumns,
            },
        ];
    }
    async addNextTasksItems(monAccessToken, taskType, parentItem, templateTask, lastItem, boardId) {
        const [taskCreationParamsError, taskCreationParams] = (0, monday_1.getTaskCreationParams)(lastItem);
        if (taskCreationParamsError) {
            logger.error({
                message: `taskCreationParamsError: ${JSON.stringify(taskCreationParamsError)}`,
                fileName: 'template add task service',
                functionName: 'addNextTasksItems',
            });
            return [taskCreationParamsError, null];
        }
        const [currentReturnItemError, currentReturnItem] = await this.mondayService.queryItemColumnsValues(monAccessToken, taskCreationParams.returnId);
        if (currentReturnItemError) {
            logger.error({
                message: `returnItemError: ${JSON.stringify(currentReturnItemError)}`,
                fileName: 'template add task service',
                functionName: 'addNextTasksItems',
            });
            return [currentReturnItemError, null];
        }
        if (!(currentReturnItem === null || currentReturnItem === void 0 ? void 0 : currentReturnItem.parentItemId)) {
            logger.error({
                message: `no return parent item: ${JSON.stringify(currentReturnItem)}`,
                fileName: 'template add task service',
                functionName: 'addNextTasksItems',
            });
            return [new error_1.InternalServerError(), null];
        }
        let [returnItemParentError, returnItemParent] = await this.mondayService.queryItemColumnsValues(monAccessToken, parseInt(currentReturnItem === null || currentReturnItem === void 0 ? void 0 : currentReturnItem.parentItemId));
        if (returnItemParentError || !returnItemParent) {
            logger.error({
                message: `returnItemParentError: ${returnItemParentError ? JSON.stringify(returnItemParentError) : 'null'}`,
                fileName: 'template add task service',
                functionName: 'addNextTasksItems',
            });
            return [returnItemParentError !== null && returnItemParentError !== void 0 ? returnItemParentError : new error_1.InternalServerError(), null];
        }
        const createdItems = await Promise.all(skipping_numbers_1.SKIPPING_NUMBERS_ARRAY.map(async (skipNum) => {
            if (returnItemParent) {
                const [nextTaskError, nextTask] = await this.buildNextTaskItem(monAccessToken, taskCreationParams, templateTask, parentItem, currentReturnItem, returnItemParent, taskType, skipNum);
                if (nextTaskError) {
                    logger.error({
                        message: `nextTaskError: ${JSON.stringify(nextTaskError)}`,
                        fileName: 'template add task service',
                        functionName: 'addNextTasksItems',
                    });
                    return 'false';
                }
                const [createdTaskError, createdTask] = await this.mondayService.createItem(monAccessToken, boardId, nextTask.name, nextTask.columnValues);
                if (createdTaskError) {
                    logger.error({
                        message: `createdTaskError: ${JSON.stringify(createdTaskError)}`,
                        fileName: 'template add task service',
                        functionName: 'addNextTasksItems',
                    });
                    return 'false';
                }
                return createdTask;
            }
            return 'false';
        }));
        if (createdItems.some((item) => item === 'false')) {
            logger.error({
                message: `not all items created: ${JSON.stringify(createdItems)}`,
                fileName: 'template add task service',
                functionName: 'addNextTasksItems',
            });
            return [new error_1.InternalServerError(), null];
        }
        return [null, createdItems];
    }
}
exports.TemplateAddTaskService = TemplateAddTaskService;
const filterTemplateItems = (items, taskTemplateColumnId, templateId, produceTasksColumnId, createdStatusColumnId, taskType) => {
    const [filteredTemplateIdItemsError, filteredTemplateIdItems] = (0, monday_1.filterItemsByColumnValue)(items, taskTemplateColumnId, templateId);
    if (filteredTemplateIdItemsError) {
        logger.error({
            message: `filteredProduceItemsError: ${JSON.stringify(filteredTemplateIdItemsError)}`,
            fileName: 'template add task service',
            functionName: 'filterTemplateItems',
        });
        return [filteredTemplateIdItemsError, null];
    }
    const [filteredProduceItemsError, filteredProduceItems] = (0, monday_1.filterItemsByColumnValue)(filteredTemplateIdItems, produceTasksColumnId, sync_integration_values_1.SYNC_INTEGRATION_VALUES.CONTINUE_PRODUCE_TASKS_STATUS);
    if (filteredProduceItemsError) {
        logger.error({
            message: `filteredProduceItemsError: ${JSON.stringify(filteredProduceItemsError)}`,
            fileName: 'template add task service',
            functionName: 'filterTemplateItems',
        });
        return [filteredProduceItemsError, null];
    }
    const [filteredCreatedItemsError, filteredCreatedItems] = (0, monday_1.filterItemsByColumnValue)(filteredProduceItems, createdStatusColumnId, sync_integration_values_1.SYNC_INTEGRATION_VALUES.IS_CREATED);
    if (filteredCreatedItemsError) {
        logger.error({
            message: `filteredCreatedItemsError: ${JSON.stringify(filteredCreatedItemsError)}`,
            fileName: 'template add task service',
            functionName: 'filterTemplateItems',
        });
        return [filteredCreatedItemsError, null];
    }
    if (taskType === sync_integration_values_1.SYNC_INTEGRATION_VALUES.FILING_TASK_TYPE) {
        const [filteredSourceItemsError, filteredSourceItems] = (0, monday_1.filterItemsByColumnValue)(filteredCreatedItems, sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.OBLIGATION_SOURCE_COLUMN, sync_integration_values_1.SYNC_INTEGRATION_VALUES.TEMPLATE_OBLIGATION_SOURCE);
        if (filteredSourceItemsError) {
            logger.error({
                message: `filteredSourceItemsError: ${JSON.stringify(filteredSourceItemsError)}`,
                fileName: 'template add task service',
                functionName: 'filterTemplateItems',
            });
            return [filteredSourceItemsError, null];
        }
        return [null, filteredSourceItems];
    }
    return [null, filteredCreatedItems];
};
const sortItemsByColumnId = (items, columnId) => {
    const sortedItems = items.sort((a, b) => {
        const a_columns = a.columns.reduce((a, v) => ({ ...a, [v.id]: v.text }), {});
        const b_columns = b.columns.reduce((a, v) => ({ ...a, [v.id]: v.text }), {});
        if (a_columns[columnId] < b_columns[columnId])
            return 1;
        if (a_columns[columnId] > b_columns[columnId])
            return -1;
        return 0;
    });
    if (!sortedItems.length) {
        return [new error_1.InternalServerError(), null];
    }
    return [null, sortedItems];
};
const findLastSubmissionItem = (items) => {
    const lastItem = items.find((item) => {
        const columnValues = item.columns.reduce((a, v) => ({ ...a, [v.id]: v.text }), {});
        if ((columnValues[sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_ADDED_BY_STATUS] === sync_integration_values_1.SYNC_INTEGRATION_VALUES.ADDED_BY_INTEGRATION &&
            columnValues[sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_STATUS_COLUMN] === sync_integration_values_1.SYNC_INTEGRATION_VALUES.TASK_ACTIVE_STATUS) ||
            !columnValues[sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_ADDED_BY_STATUS]) {
            return true;
        }
    });
    if (!lastItem) {
        return [new error_1.InternalServerError(), null];
    }
    return [null, lastItem];
};
//# sourceMappingURL=template-add-task-service.js.map