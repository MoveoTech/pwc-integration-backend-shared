import { ErrorResultTuple } from '../types/errors/error-result-tuple';
import { MondayService } from './monday-service';
import {
  getRelatedItemsByTaskType,
  isCustomTemplate
} from '../utils/integration';
import { SYNC_INTEGRATION_COLUMNS } from '../constants/sync-integration-columns';
import { BadRequestError, InternalServerError } from '../types/errors/error';
import { MondayItem } from '../types/interfaces/monday-item';
import { MondayColumn } from '../types/interfaces/monday-column';
import { ERRORS } from '../constants/errors';
import { SYNC_INTEGRATION_VALUES } from '../constants/sync-integration-values';
import { MondayItemCreation } from '../types/interfaces/monday-item-creation';
import { LoggerService } from '../services/logger-service';
import { createItemColumns, getColumnTextByColumnId, getTaskCreationParams } from '../utils/monday';
import { buildSubmissionDates } from '../utils/dates';
import { SharedService } from './shared-service';
import { SKIPPING_NUMBER } from '../constants/skipping-numbers';

const logger = LoggerService.getLogger();

export class IntegrationService {
  private mondayService: MondayService;
  private sharedService: SharedService;

  constructor() {
    this.mondayService = new MondayService();
    this.sharedService = new SharedService();
  }

  public async syncNextStatus(
    monAccessToken: string,
    boardId: number,
    item: MondayItem,
    sameTypeItems: MondayItem[],
    taskType: string
  ): Promise<ErrorResultTuple<string>> {
    const [relatedItemsError, relatedItems] = getRelatedItemsByTaskType(item, sameTypeItems, taskType);
    if (relatedItemsError) {
      logger.error({
        message: `no related items found from list, item: ${JSON.stringify(item)}, sameTypeItems: ${JSON.stringify(
          sameTypeItems
        )}, taskType: ${taskType}`,
        fileName: 'integration service',
        functionName: 'syncNextStatus',
      });
      return [relatedItemsError, null];
    }
    const itemsDates = relatedItems.reduce((result: { id: string; taskDueDate: Date }[], relatedItem: MondayItem) => {
      const taskDateColumn = relatedItem.columns.filter(
        (column: MondayColumn) => column.id === SYNC_INTEGRATION_COLUMNS.TASK_DUE_DATE_COLUMN
      );
      if (taskDateColumn.length) {
        result.push({
          id: relatedItem.id,
          taskDueDate: new Date(taskDateColumn[0].text),
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
      return [new InternalServerError(), null];
    }
    itemsDates.sort((a: any, b: any) => a.taskDueDate - b.taskDueDate);
    const currentTaskDate = item.columns.find(
      (column: MondayColumn) => column.id === SYNC_INTEGRATION_COLUMNS.TASK_DUE_DATE_COLUMN
    )?.text;
    if (!currentTaskDate) {
      logger.error({
        message: `no currentTaskDate, item columns: ${JSON.stringify(item?.columns)}`,
        fileName: 'integration service',
        functionName: 'syncNextStatus',
      });
      return [new InternalServerError(), null];
    }
    const filteredDates = itemsDates.filter(
      (itemDate: { id: string; taskDueDate: Date }) =>
        itemDate.taskDueDate >= new Date(currentTaskDate) && itemDate.id !== item.id
    );
    if (!filteredDates.length) {
      logger.error({
        message: `no filteredDates, itemsDates: ${itemsDates}, currentTaskDate: ${JSON.stringify(currentTaskDate)}`,
        fileName: 'integration service',
        functionName: 'syncNextStatus',
      });
      return [new InternalServerError(), null];
    }
    const [itemStatusError, itemStatus] = await this.mondayService.changeItemStatus(
      monAccessToken,
      boardId,
      parseInt(filteredDates[0].id),
      SYNC_INTEGRATION_COLUMNS.TASK_STATUS_COLUMN,
      SYNC_INTEGRATION_VALUES.TASK_ACTIVE_STATUS
    );
    if (itemStatusError) {
      logger.error({
        message: `itemStatusError: ${JSON.stringify(itemStatusError)}`,
        fileName: 'integration service',
        functionName: 'syncNextStatus',
      });
      return [itemStatusError, null];
    }
    if (itemStatus) {
      return [null, filteredDates[0].id];
    }
    return [new InternalServerError(), null];
  }

  public async createNextItem(
    monAccessToken: string,
    item: MondayItem,
    taskType: string,
    boardId: number,
    userId: number
  ): Promise<ErrorResultTuple<string>> {
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
      this.sharedService.pushNotification(monAccessToken, boardId, userId, ERRORS.STOP_PRODUCE);
      return [null, ERRORS.STOP_PRODUCE];
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
    const [createdTaskError, createdTask] = await this.mondayService.createItem(
      monAccessToken,
      boardId,
      nextTask.name,
      nextTask.columnValues
    );
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

  private async checkProduceTasks(
    monAccessToken: string,
    item: MondayItem,
    taskType: string
  ): Promise<ErrorResultTuple<{ parentItem: MondayItem; isStopped: boolean }>> {
    let taskDefinitionParentColumnId: string;
    let produceTasksColumnId: string;
    switch (taskType) {
      case SYNC_INTEGRATION_VALUES.FILING_TASK_TYPE:
        taskDefinitionParentColumnId = SYNC_INTEGRATION_COLUMNS.TASK_OBLIGATION_ID_COLUMN;
        produceTasksColumnId = SYNC_INTEGRATION_COLUMNS.OBLIGATION_PRODUCE_TASKS_COLUMN;
        break;
      case SYNC_INTEGRATION_VALUES.DATA_TASK_TYPE:
        taskDefinitionParentColumnId = SYNC_INTEGRATION_COLUMNS.TASK_BUSINESS_STREAM_ID_COLUMN;
        produceTasksColumnId = SYNC_INTEGRATION_COLUMNS.BUSINESS_STREAM_PRODUCE_TASKS_COLUMN;
        break;
      default:
        return [new BadRequestError(), null];
    }
    const [taskDefinitionParentIdError, taskDefinitionParentId] = getColumnTextByColumnId(
      item,
      taskDefinitionParentColumnId
    );
    if (taskDefinitionParentIdError) {
      logger.error({
        message: `taskDefinitionParentIdError: ${JSON.stringify(taskDefinitionParentIdError)}`,
        fileName: 'integration service',
        functionName: 'checkProduceTasks',
      });
      return [taskDefinitionParentIdError, null];
    }
    const [taskDefinitionParentError, taskDefinitionParent] = await this.mondayService.queryItemColumnsValues(
      monAccessToken,
      parseInt(taskDefinitionParentId)
    );
    if (taskDefinitionParentError) {
      logger.error({
        message: `taskDefinitionParentError: ${JSON.stringify(taskDefinitionParentError)}`,
        fileName: 'integration service',
        functionName: 'checkProduceTasks',
      });
      return [taskDefinitionParentError, null];
    }
    const [produceStatusError, produceStatus] = getColumnTextByColumnId(taskDefinitionParent, produceTasksColumnId);
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
        isStopped: produceStatus === SYNC_INTEGRATION_VALUES.STOP_PRODUCE_TASKS_STATUS,
      },
    ];
  }

  private async buildNextTask(
    monAccessToken: string,
    item: MondayItem,
    parentItem: MondayItem,
    taskType: string
  ): Promise<ErrorResultTuple<MondayItemCreation>> {
    const [taskCreationParamsError, taskCreationParams] = getTaskCreationParams(item);
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
        message: `currentTaskError: ${currentTaskError ? JSON.stringify(currentTaskError) : 'null'}, returnItemError: ${currentReturnItemError ? JSON.stringify(currentReturnItemError) : 'null'
          }`,
        fileName: 'integration service',
        functionName: 'buildNextTask',
      });
      return [new InternalServerError(), null];
    }
    if (!currentReturnItem?.parentItemId) {
      logger.error({
        message: `no return parent item: ${JSON.stringify(currentReturnItem)}`,
        fileName: 'integration service',
        functionName: 'buildNextTask',
      });
      return [new InternalServerError(), null];
    }
    let [returnItemParentError, returnItemParent] = await this.mondayService.queryItemColumnsValues(
      monAccessToken,
      parseInt(currentReturnItem?.parentItemId)
    );
    if (returnItemParentError || !returnItemParent) {
      logger.error({
        message: `returnItemParentError: ${returnItemParentError ? JSON.stringify(returnItemParentError) : 'null'}`,
        fileName: 'integration service',
        functionName: 'buildNextTask',
      });
      return [returnItemParentError ?? new InternalServerError(), null];
    }
    const [isItemCustomTemplateError, isItemCustomTemplate] = isCustomTemplate(parentItem, taskType);
    if (isItemCustomTemplateError) {
      logger.error({
        message: `isItemCustomTemplateError: ${JSON.stringify(isItemCustomTemplateError)}`,
        fileName: 'integration service',
        functionName: 'buildNextTask',
      });
      return [isItemCustomTemplateError, null];
    }
    const [nextReturnItemError, nextReturnItem] = await this.sharedService.getNextReturnItem(
      monAccessToken,
      currentReturnItem,
      returnItemParent,
      isItemCustomTemplate,
      taskType,
      1
    );
    if (nextReturnItemError) {
      logger.error({
        message: `nextReturnItemError: ${JSON.stringify(nextReturnItemError)}`,
        fileName: 'integration service',
        functionName: 'buildNextTask',
      });
      return [nextReturnItemError, null];
    }
    if (isItemCustomTemplate) {
      const [templateIdError, templateId] = await getColumnTextByColumnId(
        returnItemParent,
        SYNC_INTEGRATION_COLUMNS.CUSTOM_FILING_TASK_DATE_TEMPLATE_COLUMN
      );
      if (templateIdError) {
        logger.error({
          message: `templateIdError: ${JSON.stringify(templateIdError)}`,
          fileName: 'integration service',
          functionName: 'buildNextTask',
        });
        return [templateIdError, null];
      }
      [returnItemParentError, returnItemParent] = await this.mondayService.queryItemColumnsValues(
        monAccessToken,
        parseInt(templateId)
      );
      if (returnItemParentError || !returnItemParent) {
        logger.error({
          message: `replace returnItemParentError: ${returnItemParentError ? JSON.stringify(returnItemParentError) : 'null'
            }`,
          fileName: 'integration service',
          functionName: 'buildNextTask',
        });
        return [returnItemParentError ?? new InternalServerError(), null];
      }
    }
    const [submissionsDatesError, submissionsDates] = buildSubmissionDates(
      taskCreationParams,
      currentTask,
      taskType,
      currentReturnItem,
      nextReturnItem,
      returnItemParent,
      isItemCustomTemplate,
      SKIPPING_NUMBER
    );
    if (submissionsDatesError) {
      logger.error({
        message: `submissionsDatesError: ${JSON.stringify(submissionsDatesError)}`,
        fileName: 'integration service',
        functionName: 'buildNextTask',
      });
      return [submissionsDatesError, null];
    }
    const [itemColumnsError, itemColumns] = createItemColumns(
      submissionsDates,
      parentItem,
      currentTask,
      taskType,
      taskCreationParams.taskId,
      parseInt(nextReturnItem.nextReturnItem.id),
      isItemCustomTemplate
    );
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
        name: isItemCustomTemplate ? itemColumns[SYNC_INTEGRATION_COLUMNS.TASK_TEXT_COLUMN] : currentTask.name,
        columnValues: itemColumns,
      },
    ];
  }
}