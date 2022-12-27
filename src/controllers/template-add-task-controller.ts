import { Request, Response } from 'express';
import { BadRequestError, InternalServerError } from '../types/errors/error';
import { ERRORS } from '../constants/errors';
import { LoggerService } from '../services/logger-service';
import { TemplateAddTaskInputs } from '../types/interfaces/template-add-task-inputs';
import { SYNC_INTEGRATION_COLUMNS } from '../constants/sync-integration-columns';
import { TemplateAddTaskService } from '../services/template-add-task-service';
import { SharedService } from '../services/shared-service';
import { MondayService } from '../services/monday-service';
import { SYNC_INTEGRATION_VALUES } from '../constants/sync-integration-values';

const logger = LoggerService.getLogger();

export const addTask = async (request: Request, response: Response) => {
  const { monAccessToken, userId } = response?.locals?.mondayAuthorization;
  const { boardId, itemId, templateItemId, settingsBoardIds }: TemplateAddTaskInputs = response?.locals?.inputs as TemplateAddTaskInputs;
  const sharedService = new SharedService();
  const mondayService = new MondayService();
  const templateAddTaskService = new TemplateAddTaskService();
  const [templateTaskError, templateTask] = await templateAddTaskService.getTemplateTask(monAccessToken, itemId)
  if (templateTaskError) {
    sharedService.pushNotification(monAccessToken, boardId, userId, ERRORS.GENERIC_ERROR);
    return response.status(200).send(`${new InternalServerError()}`);
  }
  const [taskTypeError, taskType] = await sharedService.getTaskType(monAccessToken, templateItemId, SYNC_INTEGRATION_COLUMNS.TASK_TEMPLATE_TYPE_COLUMN);
  if (taskTypeError) {
    sharedService.pushNotification(monAccessToken, boardId, userId, ERRORS.GENERIC_ERROR);
    return response.status(200).send(`${new InternalServerError()}`);
  }
  await Promise.all(settingsBoardIds.map(async (boardIds) => {
    const [[sameTypeItemsError, sameTypeItems], [taskParentsItemsError, taskParentsItems]] =
      await Promise.all([
        sharedService.getSameTypeItems(monAccessToken, +boardIds.currentTaskboardBoardId, taskType),
        templateAddTaskService.getParentsItemsByType(monAccessToken, boardIds, taskType, templateItemId.toString())
      ])
    if (sameTypeItems?.length === 0 || sameTypeItemsError) {
      logger.error({
        message:
          sameTypeItems?.length === 0
            ? 'no matching items'
            : `sameTypeItemsError: ${JSON.stringify(sameTypeItemsError)}`,
        fileName: 'template add task controller',
        functionName: 'addTask',
      });
      return [
        sameTypeItems?.length === 0 ? new BadRequestError() : sameTypeItemsError ?? new InternalServerError(),
        null,
      ];
    }
    logger.info({
      message: 'sameTypeItems found',
      fileName: 'template add task controller',
      functionName: 'addTask',
      data: `taskType: ${taskType}, sameTypeItems: ${JSON.stringify(sameTypeItems)}`,
    });
    if (taskParentsItems?.length === 0 || taskParentsItemsError) {
      logger.error({
        message:
          taskParentsItems?.length === 0
            ? 'no matching items'
            : `taskParentItemsError: ${JSON.stringify(taskParentsItemsError)}`,
        fileName: 'template add task controller',
        functionName: 'addTask',
      });
      return [
        taskParentsItems?.length === 0 ? new BadRequestError() : taskParentsItemsError ?? new InternalServerError(),
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
        const [lastTaskItemError, lastTaskItem] = templateAddTaskService.getLastTaskItem(
          sameTypeItems,
          parentItem,
          taskType
        )
        if (lastTaskItemError) {
          logger.error({
            message: `lastTaskItemError: ${JSON.stringify(lastTaskItemError)}`,
            fileName: 'template add task controller',
            functionName: 'addTask',
          });
          return [lastTaskItemError, null];
        }
        const [addedNextTasksError, addedNextTasks] = await templateAddTaskService.addNextTasksItems(
          monAccessToken,
          taskType,
          parentItem,
          templateTask,
          lastTaskItem,
          +boardIds.currentTaskboardBoardId
        )
        if (addedNextTasksError) {
          logger.error({
            message: `addedNextTasksError: ${JSON.stringify(addedNextTasksError)}`,
            fileName: 'template add task controller',
            functionName: 'addTask',
          });
          return [addedNextTasksError, null];
        }
        return [null, addedNextTasks];
      }))
    }
  }))
  const [itemStatusError, itemStatus] = await mondayService.changeItemStatus(
    monAccessToken,
    boardId,
    itemId,
    SYNC_INTEGRATION_COLUMNS.TASK_TEMPLATE_SYNCED_COLUMN,
    SYNC_INTEGRATION_VALUES.IS_SYNCED_STATUS
  );
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
    return response.status(200).send('success');;
  }
};
