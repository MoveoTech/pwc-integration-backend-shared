import { SYNC_INTEGRATION_COLUMNS } from "../constants/sync-integration-columns";
import { BadRequestError, InternalServerError } from "../types/errors/error";
import { MondayItem } from "../types/interfaces/monday-item";
import { ErrorResultTuple } from "../types/errors/error-result-tuple";
import { LoggerService } from "./logger-service";
import { MondayService } from "./monday-service";
import { MondayColumn } from "../types/interfaces/monday-column";
import { filterItemsByColumnValue, getColumnTextByColumnId, getItemFromListById } from "../utils/monday";
import { getReturnOrderColumn } from "../utils/dates";

const logger = LoggerService.getLogger();

export class SharedService {
    private mondayService: MondayService;

    constructor() {
        this.mondayService = new MondayService();
    }

    public async getTaskType(
        monAccessToken: string,
        itemId: number,
        columnId: string): Promise<ErrorResultTuple<string>> {
        const [itemColumnsValuesError, item] = await this.mondayService.queryItemColumnsValues(monAccessToken, itemId);
        if (itemColumnsValuesError) {
            logger.error({
                message: `itemColumnsValuesError: ${JSON.stringify(itemColumnsValuesError)}`,
                fileName: 'integration service',
                functionName: 'getTaskType',
            });
            return [itemColumnsValuesError, null];
        }
        const [taskTypeError, taskType] = getColumnTextByColumnId(item, columnId);
        if (taskTypeError) {
            logger.error({
                message: `no task type found on item: ${JSON.stringify(item)}`,
                fileName: 'integration service',
                functionName: 'getTaskType',
            });
            return [taskTypeError, null];
        }
        logger.info({
            message: 'task type found',
            fileName: 'integration service',
            functionName: 'getTaskType',
            data: `item: ${JSON.stringify(item)}, taskType: ${taskType}`,
        });
        return [null, taskType];
    }

    public async getSameTypeItems(
        monAccessToken: string,
        boardId: number,
        taskType: string
    ): Promise<ErrorResultTuple<MondayItem[]>> {
        const [itemsError, items] = await this.mondayService.queryItemsColumnsValuesByBoardId(
            monAccessToken,
            boardId,
        );
        if (items?.length === 0 || itemsError) {
            logger.error({
                message:
                items?.length === 0
                        ? 'no items'
                        : `itemsError: ${JSON.stringify(itemsError)}`,
                fileName: 'integration service',
                functionName: 'handleSyncStatusAndTasks',
            });
            return [
                items?.length === 0 ? new BadRequestError() : itemsError ?? new InternalServerError(),
                null,
            ];
        }
        const [sameTypeItemsError, sameTypeItems] = filterItemsByColumnValue(
            items,
            SYNC_INTEGRATION_COLUMNS.TASK_TYPE_COLUMN,
            taskType
        )
        if (sameTypeItems?.length === 0 || sameTypeItemsError) {
            logger.error({
                message:
                sameTypeItems?.length === 0
                        ? 'no matching sameTypeItems'
                        : `sameTypeItemsError: ${JSON.stringify(sameTypeItemsError)}`,
                fileName: 'integration service',
                functionName: 'handleSyncStatusAndTasks',
            });
            return [
                sameTypeItems?.length === 0 ? new BadRequestError() : sameTypeItemsError ?? new InternalServerError(),
                null,
            ];
        }
        logger.info({
            message: 'sameTypeItems found',
            fileName: 'integration service',
            functionName: 'handleSyncStatusAndTasks',
            data: `taskType: ${taskType}, sameTypeItems: ${JSON.stringify(sameTypeItems)}`,
        });
        return [null, sameTypeItems];
    }

    public async getNextReturnItem(
        monAccessToken: string,
        returnItem: MondayItem,
        returnItemParent: MondayItem,
        isItemCustomTemplate: boolean,
        taskType: string,
        skippingNumber: number
    ): Promise<ErrorResultTuple<{nextReturnItem: MondayItem, isSingle: boolean}>> {
        const [returnOrderColumnError, returnOrderColumn] = getReturnOrderColumn(taskType, isItemCustomTemplate);
        if (returnOrderColumnError) {
            logger.error({
                message: `returnOrderColumnError: ${JSON.stringify(returnOrderColumnError)}`,
                fileName: 'integration service',
                functionName: 'getNextReturnItem',
            });
            return [returnOrderColumnError, null];
        }
        const [returnItemOrderError, returnItemOrder] = getColumnTextByColumnId(returnItem, returnOrderColumn);
        if (returnItemOrderError) {
            logger.error({
                message: `returnItemOrderError: ${JSON.stringify(returnItemOrderError)}`,
                fileName: 'integration service',
                functionName: 'getNextReturnItem',
            });
            return [returnItemOrderError, null];
        }
        let [returnItemsError, returnItems] = await this.mondayService.querySubItems(
            monAccessToken,
            parseInt(returnItemParent.id)
        );
        if (returnItemsError || !returnItems) {
            logger.error({
                message: `returnItemsError: ${returnItemsError ? JSON.stringify(returnItemsError) : 'null'}`,
                fileName: 'integration service',
                functionName: 'getNextReturnItem',
            });
            return [returnItemsError ?? new BadRequestError(), null];
        }
        if (returnItems.length === 1) {
            return [null, {nextReturnItem: returnItems[0], isSingle: true}]
        }
        if (isItemCustomTemplate) {
            returnItems = returnItems.reduce((result: MondayItem[], returnItem: MondayItem) => {
                const returnIdColumn = returnItem.columns.filter(
                    (column: MondayColumn) => column.id === SYNC_INTEGRATION_COLUMNS.CUSTOM_FILING_TASK_RETURN_ORDER_COLUMN
                );
                if (returnIdColumn.length && returnIdColumn[0].text) {
                    result.push(returnItem);
                }
                return result;
            }, []);
            if (!returnItems.length) {
                logger.error({
                    message: 'no custom returnItems',
                    fileName: 'integration service',
                    functionName: 'getNextReturnItem',
                });
                return [new InternalServerError(), null];
            }
        }
        const returnItemsOrder = returnItems.reduce((result: { id: string; order: number }[], item: MondayItem) => {
            const orderColumn = item.columns.filter((column: MondayColumn) => column.id === returnOrderColumn);
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
                fileName: 'integration service',
                functionName: 'getNextReturnItem',
            });
            return [new InternalServerError(), null];
        }
        returnItemsOrder.sort((a: any, b: any) => a.order - b.order);
        const nextReturnIndex = (parseInt(returnItemOrder) + skippingNumber) % returnItemsOrder.length;
        const nextReturnItemId = returnItemsOrder[nextReturnIndex].id;
        const [nextReturnItemError, nextReturnItem] = getItemFromListById(parseInt(nextReturnItemId), returnItems);
        if (nextReturnItemError) {
            logger.error({
                message: `no matching item found from list, nextReturnItemId: ${nextReturnItemId}, sameTypeItems: ${JSON.stringify(
                    returnItems
                )}`,
                fileName: 'integration service',
                functionName: 'getNextReturnItem',
            });
            return [nextReturnItemError, null];
        }
        return [null, {nextReturnItem, isSingle: false}];
    }

    public pushNotification(
        monAccessToken: string,
        boardId: number,
        userId: number,
        message: string): void {
        this.mondayService.createNotification(monAccessToken, boardId, userId, message);
    }
}