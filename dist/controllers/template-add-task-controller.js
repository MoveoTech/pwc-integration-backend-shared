"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addTask = void 0;
const error_1 = require("../types/errors/error");
const errors_1 = require("../constants/errors");
const logger_service_1 = require("../services/logger-service");
const sync_integration_columns_1 = require("../constants/sync-integration-columns");
const template_add_task_service_1 = require("../services/template-add-task-service");
const shared_service_1 = require("../services/shared-service");
const monday_service_1 = require("../services/monday-service");
const sync_integration_values_1 = require("../constants/sync-integration-values");
const logger = logger_service_1.LoggerService.getLogger();
const addTask = async (request, response) => {
    var _a, _b;
    const { monAccessToken, userId } = (_a = response === null || response === void 0 ? void 0 : response.locals) === null || _a === void 0 ? void 0 : _a.mondayAuthorization;
    const { boardId, itemId, templateItemId, settingsBoardIds } = (_b = response === null || response === void 0 ? void 0 : response.locals) === null || _b === void 0 ? void 0 : _b.inputs;
    const sharedService = new shared_service_1.SharedService();
    const mondayService = new monday_service_1.MondayService();
    const templateAddTaskService = new template_add_task_service_1.TemplateAddTaskService();
    const [templateTaskError, templateTask] = await templateAddTaskService.getTemplateTask(monAccessToken, itemId);
    if (templateTaskError) {
        sharedService.pushNotification(monAccessToken, boardId, userId, errors_1.ERRORS.GENERIC_ERROR);
        return response.status(200).send(`${new error_1.InternalServerError()}`);
    }
    const [taskTypeError, taskType] = await sharedService.getTaskType(monAccessToken, templateItemId, sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_TEMPLATE_TYPE_COLUMN);
    if (taskTypeError) {
        sharedService.pushNotification(monAccessToken, boardId, userId, errors_1.ERRORS.GENERIC_ERROR);
        return response.status(200).send(`${new error_1.InternalServerError()}`);
    }
    await Promise.all(settingsBoardIds.map(async (boardIds) => {
        const [[sameTypeItemsError, sameTypeItems], [taskParentsItemsError, taskParentsItems]] = await Promise.all([
            sharedService.getSameTypeItems(monAccessToken, +boardIds.currentTaskboardBoardId, taskType),
            templateAddTaskService.getParentsItemsByType(monAccessToken, boardIds, taskType, templateItemId.toString())
        ]);
        if ((sameTypeItems === null || sameTypeItems === void 0 ? void 0 : sameTypeItems.length) === 0 || sameTypeItemsError) {
            logger.error({
                message: (sameTypeItems === null || sameTypeItems === void 0 ? void 0 : sameTypeItems.length) === 0
                    ? 'no matching items'
                    : `sameTypeItemsError: ${JSON.stringify(sameTypeItemsError)}`,
                fileName: 'template add task controller',
                functionName: 'addTask',
            });
            return [
                (sameTypeItems === null || sameTypeItems === void 0 ? void 0 : sameTypeItems.length) === 0 ? new error_1.BadRequestError() : sameTypeItemsError !== null && sameTypeItemsError !== void 0 ? sameTypeItemsError : new error_1.InternalServerError(),
                null,
            ];
        }
        logger.info({
            message: 'sameTypeItems found',
            fileName: 'template add task controller',
            functionName: 'addTask',
            data: `taskType: ${taskType}, sameTypeItems: ${JSON.stringify(sameTypeItems)}`,
        });
        if ((taskParentsItems === null || taskParentsItems === void 0 ? void 0 : taskParentsItems.length) === 0 || taskParentsItemsError) {
            logger.error({
                message: (taskParentsItems === null || taskParentsItems === void 0 ? void 0 : taskParentsItems.length) === 0
                    ? 'no matching items'
                    : `taskParentItemsError: ${JSON.stringify(taskParentsItemsError)}`,
                fileName: 'template add task controller',
                functionName: 'addTask',
            });
            return [
                (taskParentsItems === null || taskParentsItems === void 0 ? void 0 : taskParentsItems.length) === 0 ? new error_1.BadRequestError() : taskParentsItemsError !== null && taskParentsItemsError !== void 0 ? taskParentsItemsError : new error_1.InternalServerError(),
                null,
            ];
        }
        logger.info({
            message: 'taskParentItems found',
            fileName: 'template add task controller',
            functionName: 'addTask',
            data: `taskType: ${taskType}, taskParentItems: ${JSON.stringify(taskParentsItems)}`,
        });
        if (taskParentsItems && sameTypeItems) {
            return await Promise.all(taskParentsItems.map(async (parentItem) => {
                const [lastTaskItemError, lastTaskItem] = templateAddTaskService.getLastTaskItem(sameTypeItems, parentItem, taskType);
                if (lastTaskItemError) {
                    logger.error({
                        message: `lastTaskItemError: ${JSON.stringify(lastTaskItemError)}`,
                        fileName: 'template add task controller',
                        functionName: 'addTask',
                    });
                    return [lastTaskItemError, null];
                }
                const [addedNextTasksError, addedNextTasks] = await templateAddTaskService.addNextTasksItems(monAccessToken, taskType, parentItem, templateTask, lastTaskItem, +boardIds.currentTaskboardBoardId);
                if (addedNextTasksError) {
                    logger.error({
                        message: `addedNextTasksError: ${JSON.stringify(addedNextTasksError)}`,
                        fileName: 'template add task controller',
                        functionName: 'addTask',
                    });
                    return [addedNextTasksError, null];
                }
                return [null, addedNextTasks];
            }));
        }
    }));
    const [itemStatusError, itemStatus] = await mondayService.changeItemStatus(monAccessToken, boardId, itemId, sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_TEMPLATE_SYNCED_COLUMN, sync_integration_values_1.SYNC_INTEGRATION_VALUES.IS_SYNCED_STATUS);
    if (itemStatusError) {
        logger.error({
            message: `itemStatusError: ${JSON.stringify(itemStatusError)}`,
            fileName: 'template add task controller',
            functionName: 'addTask',
        });
        return [itemStatusError, null];
    }
    if (itemStatus) {
        sharedService.pushNotification(monAccessToken, boardId, userId, `Task "${templateTask.name}" created successfully`);
        return response.status(200).send('success');
        ;
    }
};
exports.addTask = addTask;
//# sourceMappingURL=template-add-task-controller.js.map