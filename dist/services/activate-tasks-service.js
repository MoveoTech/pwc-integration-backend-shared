"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivateTasksService = void 0;
const sync_integration_columns_1 = require("../constants/sync-integration-columns");
const sync_integration_values_1 = require("../constants/sync-integration-values");
const error_1 = require("../types/errors/error");
const logger_service_1 = require("./logger-service");
const monday_service_1 = require("./monday-service");
const shared_service_1 = require("./shared-service");
const errors_1 = require("../constants/errors");
const logger = logger_service_1.LoggerService.getLogger();
class ActivateTasksService {
    constructor() {
        this.mondayService = new monday_service_1.MondayService();
    }
    async activateParentsItems(monAccessToken, userId, boardIds, parentsItemsData, isLastTasksGroup) {
        const activateTasksService = new ActivateTasksService();
        const sharedService = new shared_service_1.SharedService();
        const mondayService = new monday_service_1.MondayService();
        const activatedParents = await Promise.all(parentsItemsData.map(async (parentItem) => {
            const createdItems = await Promise.all(parentItem.items.map(async (item) => {
                const [createdTaskError, createdTask] = await mondayService.createItem(monAccessToken, +boardIds.currentTaskboardBoardId, item.itemName, item.columnValues);
                if (createdTaskError) {
                    logger.error({
                        message: `createdTaskError: ${JSON.stringify(createdTaskError)}`,
                        fileName: 'activate tasks service',
                        functionName: 'activateParentsItems',
                    });
                    return 'false';
                }
                return createdTask;
            }));
            if (createdItems.some((item) => item === 'false')) {
                logger.error({
                    message: `not all items created: ${JSON.stringify(createdItems)}`,
                    fileName: 'activate tasks service',
                    functionName: 'activateParentsItems',
                    data: `not all items created for ${parentItem.parentItemId} parent item id`,
                });
                sharedService.pushNotification(monAccessToken, +boardIds.businessStreamBoardId, userId, errors_1.ERRORS.INTEGRATION_CREATE_ITEMS_ERROR);
                return false;
            }
            const [itemStatusError, itemStatus] = await activateTasksService.changeStatusByItemType(monAccessToken, boardIds, parentItem.parentItemId, parentItem.type);
            if (itemStatusError) {
                logger.error({
                    message: `itemStatusError: ${JSON.stringify(itemStatusError)}`,
                    fileName: 'activate tasks service',
                    functionName: 'activateParentsItems',
                });
                return false;
            }
            logger.info({
                message: 'business stream or client obligation successfully activated',
                fileName: 'activate tasks service',
                functionName: 'activateParentsItems',
                data: `parent item activated: ${JSON.stringify(parentItem.parentItemId)}`,
            });
            return itemStatus;
        }));
        if (activatedParents.some((isActivated) => !isActivated)) {
            logger.error({
                message: `some of parents items was not activated properly: ${JSON.stringify(activatedParents)}`,
                fileName: 'activate tasks service',
                functionName: 'activateParentsItems',
            });
            return [new error_1.InternalServerError(), null];
        }
        logger.info({
            message: 'all activated tasks created',
            fileName: 'activate tasks service',
            functionName: 'activateParentsItems',
            data: `activatedParents: ${JSON.stringify(activatedParents)}`,
        });
        if (isLastTasksGroup) {
            sharedService.pushNotification(monAccessToken, +boardIds.businessStreamBoardId, userId, 'Business stream successfully activated');
        }
    }
    async changeStatusByItemType(monAccessToken, boardIds, parentItemId, itemType) {
        let parentBoardId;
        let createdStatusColumnId;
        switch (itemType) {
            case sync_integration_values_1.SYNC_INTEGRATION_VALUES.DATA_TASK_TYPE:
                parentBoardId = +boardIds.businessStreamBoardId;
                createdStatusColumnId = sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.BUSINESS_STREAM_STATUS_COLUMN;
                break;
            case sync_integration_values_1.SYNC_INTEGRATION_VALUES.FILING_TASK_TYPE:
                parentBoardId = +boardIds.clientObligationBoardId;
                createdStatusColumnId = sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.OBLIGATION_CREATED_STATUS_COLUMN;
                break;
            default:
                return [new error_1.BadRequestError(), null];
        }
        const [itemStatusError, itemStatus] = await this.mondayService.changeItemStatus(monAccessToken, parentBoardId, parentItemId, createdStatusColumnId, sync_integration_values_1.SYNC_INTEGRATION_VALUES.IS_CREATED);
        if (itemStatusError) {
            logger.error({
                message: `itemStatusError: ${JSON.stringify(itemStatusError)}`,
                fileName: 'activate tasks service',
                functionName: 'changeStatusByItemType',
            });
            return [itemStatusError, null];
        }
        return [null, itemStatus];
    }
}
exports.ActivateTasksService = ActivateTasksService;
//# sourceMappingURL=activate-tasks-service.js.map