import { BadRequestError, InternalServerError } from '../types/errors/error';
import { SYNC_INTEGRATION_COLUMNS } from '../constants/sync-integration-columns';
import { SYNC_INTEGRATION_VALUES } from '../constants/sync-integration-values';
import { settingsBoardIds } from '../types/interfaces/settings-board-ids';
import { MondayService } from './monday-service';
import { LoggerService } from './logger-service';
import { MondayItem } from '../types/interfaces/monday-item';
import { ErrorResultTuple } from '../types/errors/error-result-tuple';
import { MondayItemCreation } from '../types/interfaces/monday-item-creation';
import { TaskCreationParams } from '../types/interfaces/task-creation-params';
import { SKIPPING_NUMBERS_ARRAY } from '../constants/skipping-numbers';
import { SharedService } from './shared-service';
import { createItemColumns, filterItemsByColumnValue, getTaskCreationParams } from '../utils/monday';
import { buildSubmissionDates } from '../utils/dates';

const logger = LoggerService.getLogger();

export class TemplateAddTaskService {
  private mondayService: MondayService;
  private sharedService: SharedService;
  constructor() {
    this.mondayService = new MondayService();
    this.sharedService = new SharedService();
  }

  public async getTemplateTask(
    monAccessToken: string,
    itemId: number
  ): Promise<ErrorResultTuple<MondayItem>> {
    const [templateTaskError, templateTask] = await this.mondayService.queryItemColumnsValues(monAccessToken, itemId);
    if (templateTaskError) {
      logger.error({
        message: `templateTaskError: ${JSON.stringify(templateTaskError)}`,
        fileName: 'template add task service',
        functionName: 'getTemplateTask',
      });
      return [templateTaskError, null];
    }
    return [null, templateTask]
  }

  public async getParentsItemsByType(
    monAccessToken: string,
    boardIds: settingsBoardIds,
    taskType: string,
    templateId: string
  ): Promise<ErrorResultTuple<MondayItem[]>> {
    let definitionBoardId: number;
    let produceTasksColumnId: string;
    let taskTemplateColumnId: string;
    let createdStatusColumnId: string;
    switch (taskType) {
      case SYNC_INTEGRATION_VALUES.FILING_TASK_TYPE:
        definitionBoardId = +boardIds.clientObligationBoardId;
        taskTemplateColumnId = SYNC_INTEGRATION_COLUMNS.OBLIGATION_TASK_TEMPLATE_ID_COLUMN;
        produceTasksColumnId = SYNC_INTEGRATION_COLUMNS.OBLIGATION_PRODUCE_TASKS_COLUMN;
        createdStatusColumnId = SYNC_INTEGRATION_COLUMNS.OBLIGATION_CREATED_STATUS_COLUMN;
        break;
      case SYNC_INTEGRATION_VALUES.DATA_TASK_TYPE:
        definitionBoardId = +boardIds.businessStreamBoardId;
        taskTemplateColumnId = SYNC_INTEGRATION_COLUMNS.BUSINESS_STREAM_TASK_TEMPLATE_ID_COLUMN;
        produceTasksColumnId = SYNC_INTEGRATION_COLUMNS.BUSINESS_STREAM_PRODUCE_TASKS_COLUMN;
        createdStatusColumnId = SYNC_INTEGRATION_COLUMNS.BUSINESS_STREAM_STATUS_COLUMN;
        break;
      default:
        return [new BadRequestError(), null];
    }
    const [itemsError, items] = await this.mondayService.queryItemsColumnsValuesByBoardId(
      monAccessToken,
      definitionBoardId,
    )
    if (itemsError) {
      logger.error({
        message: `itemsError: ${JSON.stringify(itemsError)}`,
        fileName: 'template add task service',
        functionName: 'getParentItemsByType',
      });
      return [itemsError, null];
    }
    const [filteredItemsError, filteredItems] = filterTemplateItems(
      items,
      taskTemplateColumnId,
      templateId,
      produceTasksColumnId,
      createdStatusColumnId,
      taskType
    )
    if (filteredItemsError) {
      logger.error({
        message: `filteredItemsError: ${JSON.stringify(filteredItemsError)}`,
        fileName: 'template add task service',
        functionName: 'getParentItemsByType',
      });
      return [filteredItemsError, null];
    }
    return [null, filteredItems]
  }

  public getLastTaskItem(
    taskItems: MondayItem[],
    parentItem: MondayItem,
    taskType: string
  ): ErrorResultTuple<MondayItem> {
    let parentTaskColumnId;
    switch (taskType) {
      case SYNC_INTEGRATION_VALUES.FILING_TASK_TYPE:
        parentTaskColumnId = SYNC_INTEGRATION_COLUMNS.TASK_OBLIGATION_ID_COLUMN;
        break;
      case SYNC_INTEGRATION_VALUES.DATA_TASK_TYPE:
        parentTaskColumnId = SYNC_INTEGRATION_COLUMNS.TASK_BUSINESS_STREAM_ID_COLUMN;
        break;
      default:
        return [new BadRequestError(), null];
    }
    const [filteredSameTypeItemsError, filteredSameTypeItems] = filterItemsByColumnValue(
      taskItems,
      parentTaskColumnId,
      parentItem.id.toString()
    )
    if (filteredSameTypeItemsError) {
      logger.error({
        message: `filteredSameTypeItemsError: ${JSON.stringify(filteredSameTypeItemsError)}`,
        fileName: 'template add task service',
        functionName: 'getLastTaskItem',
      });
      return [filteredSameTypeItemsError, null];
    }
    const [sortedItemsError, sortedItems] = sortItemsByColumnId(
      filteredSameTypeItems,
      SYNC_INTEGRATION_COLUMNS.TASK_SUBMISSION_DUE_DATE_COLUMN
    )
    if (sortedItemsError) {
      logger.error({
        message: `sortedItemsError: ${JSON.stringify(sortedItemsError)}`,
        fileName: 'template add task service',
        functionName: 'getLastTaskItem',
      });
      return [sortedItemsError, null];
    }
    const [lastTaskItemError, lastTaskItem] = findLastSubmissionItem(sortedItems)
    if (lastTaskItemError) {
      logger.error({
        message: `lastTaskItemError: ${JSON.stringify(lastTaskItemError)}`,
        fileName: 'template add task service',
        functionName: 'getLastTaskItem',
      });
      return [lastTaskItemError, null];
    }
    return [null, lastTaskItem]
  }

  private async buildNextTaskItem(
    monAccessToken: string,
    taskCreationParams: TaskCreationParams,
    templateTask: MondayItem,
    parentItem: MondayItem,
    currentReturnItem: MondayItem,
    returnItemParent: MondayItem,
    taskType: string,
    skipNum: number
  ): Promise<ErrorResultTuple<MondayItemCreation>> {
    const [nextReturnItemError, nextReturnItem] = await this.sharedService.getNextReturnItem(
      monAccessToken,
      currentReturnItem,
      returnItemParent,
      false,
      taskType,
      skipNum
    );
    if (nextReturnItemError) {
      logger.error({
        message: `nextReturnItemError: ${JSON.stringify(nextReturnItemError)}`,
        fileName: 'template add task service',
        functionName: 'buildNextTaskItem',
      });
      return [nextReturnItemError, null];
    }
    const [submissionsDatesError, submissionsDates] = buildSubmissionDates(
      taskCreationParams,
      templateTask,
      taskType,
      currentReturnItem,
      nextReturnItem,
      returnItemParent,
      false,
      skipNum
    );
    if (submissionsDatesError) {
      logger.error({
        message: `submissionsDatesError: ${JSON.stringify(submissionsDatesError)}`,
        fileName: 'template add task service',
        functionName: 'buildNextTaskItem',
      });
      return [submissionsDatesError, null];
    }
    const [itemColumnsError, itemColumns] = createItemColumns(
      submissionsDates,
      parentItem,
      templateTask,
      taskType,
      parseInt(templateTask.id),
      parseInt(nextReturnItem.nextReturnItem.id),
      false,
      true
    );
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

  public async addNextTasksItems(
    monAccessToken: string,
    taskType: string,
    parentItem: MondayItem,
    templateTask: MondayItem,
    lastItem: MondayItem,
    boardId: number
  ): Promise<ErrorResultTuple<string[]>> {
    const [taskCreationParamsError, taskCreationParams] = getTaskCreationParams(lastItem);
    if (taskCreationParamsError) {
      logger.error({
        message: `taskCreationParamsError: ${JSON.stringify(taskCreationParamsError)}`,
        fileName: 'template add task service',
        functionName: 'addNextTasksItems',
      });
      return [taskCreationParamsError, null];
    }
    const [currentReturnItemError, currentReturnItem] = await this.mondayService.queryItemColumnsValues(monAccessToken, taskCreationParams.returnId)
    if (currentReturnItemError) {
      logger.error({
        message: `returnItemError: ${JSON.stringify(currentReturnItemError)}`,
        fileName: 'template add task service',
        functionName: 'addNextTasksItems',
      });
      return [currentReturnItemError, null];
    }
    if (!currentReturnItem?.parentItemId) {
      logger.error({
        message: `no return parent item: ${JSON.stringify(currentReturnItem)}`,
        fileName: 'template add task service',
        functionName: 'addNextTasksItems',
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
        fileName: 'template add task service',
        functionName: 'addNextTasksItems',
      });
      return [returnItemParentError ?? new InternalServerError(), null];
    }
    const createdItems = await Promise.all(SKIPPING_NUMBERS_ARRAY.map(async (skipNum): Promise<string>  => {
      if (returnItemParent) {
        const [nextTaskError, nextTask] = await this.buildNextTaskItem(
          monAccessToken,
          taskCreationParams,
          templateTask,
          parentItem,
          currentReturnItem,
          returnItemParent,
          taskType,
          skipNum
        );
        if (nextTaskError) {
          logger.error({
            message: `nextTaskError: ${JSON.stringify(nextTaskError)}`,
            fileName: 'template add task service',
            functionName: 'addNextTasksItems',
          });
          return 'false';
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
            fileName: 'template add task service',
            functionName: 'addNextTasksItems',
          });
          return 'false';
        }
        return createdTask;
      }
      return 'false';
    }))
    if (createdItems.some(item => item === 'false')){
      logger.error({
        message: `not all items created: ${JSON.stringify(createdItems)}`,
        fileName: 'template add task service',
        functionName: 'addNextTasksItems',
      });
      return [new InternalServerError(), null]
    }
    return [null, createdItems]
  }
}

const filterTemplateItems = (
  items: MondayItem[],
  taskTemplateColumnId: string,
  templateId: string,
  produceTasksColumnId: string,
  createdStatusColumnId: string, 
  taskType: string): ErrorResultTuple<MondayItem[]> => {
  const [filteredTemplateIdItemsError, filteredTemplateIdItems] = filterItemsByColumnValue(
    items,
    taskTemplateColumnId,
    templateId
  )
  if (filteredTemplateIdItemsError) {
    logger.error({
      message: `filteredProduceItemsError: ${JSON.stringify(filteredTemplateIdItemsError)}`,
      fileName: 'template add task service',
      functionName: 'filterTemplateItems',
    });
    return [filteredTemplateIdItemsError, null];
  }
  const [filteredProduceItemsError, filteredProduceItems] = filterItemsByColumnValue(
    filteredTemplateIdItems,
    produceTasksColumnId,
    SYNC_INTEGRATION_VALUES.CONTINUE_PRODUCE_TASKS_STATUS
  )
  if (filteredProduceItemsError) {
    logger.error({
      message: `filteredProduceItemsError: ${JSON.stringify(filteredProduceItemsError)}`,
      fileName: 'template add task service',
      functionName: 'filterTemplateItems',
    });
    return [filteredProduceItemsError, null];
  }
  const [filteredCreatedItemsError, filteredCreatedItems] = filterItemsByColumnValue(
    filteredProduceItems,
    createdStatusColumnId,
    SYNC_INTEGRATION_VALUES.IS_CREATED
  )
  if (filteredCreatedItemsError) {
    logger.error({
      message: `filteredCreatedItemsError: ${JSON.stringify(filteredCreatedItemsError)}`,
      fileName: 'template add task service',
      functionName: 'filterTemplateItems',
    });
    return [filteredCreatedItemsError, null];
  }
  if (taskType === SYNC_INTEGRATION_VALUES.FILING_TASK_TYPE) {
    const [filteredSourceItemsError, filteredSourceItems] = filterItemsByColumnValue(
      filteredCreatedItems,
      SYNC_INTEGRATION_COLUMNS.OBLIGATION_SOURCE_COLUMN,
      SYNC_INTEGRATION_VALUES.TEMPLATE_OBLIGATION_SOURCE
    )
    if (filteredSourceItemsError) {
      logger.error({
        message: `filteredSourceItemsError: ${JSON.stringify(filteredSourceItemsError)}`,
        fileName: 'template add task service',
        functionName: 'filterTemplateItems',
      });
      return [filteredSourceItemsError, null];
    }
    return [null, filteredSourceItems]
  }
  return [null, filteredCreatedItems]
}

const sortItemsByColumnId = (
  items: MondayItem[],
  columnId: string
): ErrorResultTuple<MondayItem[]> => {
  const sortedItems = items.sort((a, b) => {
    const a_columns = a.columns.reduce((a: object, v: { id: string, text: string }) => ({ ...a, [v.id]: v.text }), {})
    const b_columns = b.columns.reduce((a: object, v: { id: string, text: string }) => ({ ...a, [v.id]: v.text }), {})
    if (a_columns[columnId] < b_columns[columnId]) return 1;
    if (a_columns[columnId] > b_columns[columnId]) return -1;
    return 0;
  })
  if (!sortedItems.length) {
    return [new InternalServerError(), null];
  }
  return [null, sortedItems]
}

const findLastSubmissionItem = (
  items: MondayItem[],
): ErrorResultTuple<MondayItem> => {
  const lastItem = items.find(item => {
    const columnValues = item.columns.reduce((a: object, v: { id: string, text: string }) => ({ ...a, [v.id]: v.text }), {})
    if (
      (columnValues[SYNC_INTEGRATION_COLUMNS.TASK_ADDED_BY_STATUS] === SYNC_INTEGRATION_VALUES.ADDED_BY_INTEGRATION &&
      columnValues[SYNC_INTEGRATION_COLUMNS.TASK_STATUS_COLUMN] === SYNC_INTEGRATION_VALUES.TASK_ACTIVE_STATUS) ||
      !columnValues[SYNC_INTEGRATION_COLUMNS.TASK_ADDED_BY_STATUS]
    ) {
      return true;
    }
  })
  if (!lastItem) {
    return [new InternalServerError(), null];
  }
  return [null, lastItem]
}