import { Request, Response } from 'express';
import { IntegrationService } from '../services/integration-service';
import { InternalServerError } from '../types/errors/error';
import { ERRORS } from '../constants/errors';
import { LoggerService } from '../services/logger-service';
import { SyncIntegrationInputs } from '../types/interfaces/sync-integration-inputs';
import { SYNC_INTEGRATION_COLUMNS } from '../constants/sync-integration-columns';
import { SharedService } from '../services/shared-service';
import { getItemFromListById } from '../utils/monday';
import { MondayService } from '../services/monday-service';
import { SYNC_INTEGRATION_VALUES } from '../constants/sync-integration-values';

const logger = LoggerService.getLogger();

export const syncStatusAndTasks = async (request: Request, response: Response) => {
  const { monAccessToken, userId } = response?.locals?.mondayAuthorization;
  const { boardId, itemId }: SyncIntegrationInputs = response?.locals?.inputs as SyncIntegrationInputs;
  const integrationService = new IntegrationService();
  const mondayService = new MondayService()
  const sharedService = new SharedService();
  const [taskTypeError, taskType] = await sharedService.getTaskType(monAccessToken, itemId, SYNC_INTEGRATION_COLUMNS.TASK_TYPE_COLUMN);
  if (taskTypeError) {
    sharedService.pushNotification(monAccessToken, boardId, userId, ERRORS.GENERIC_ERROR);
    return response.status(200).send(`${new InternalServerError()}`);
  }
  const [sameTypeItemsError, sameTypeItems] = await sharedService.getSameTypeItems(
    monAccessToken,
    boardId,
    taskType
  );
  if (sameTypeItemsError) {
    sharedService.pushNotification(monAccessToken, boardId, userId, ERRORS.GENERIC_ERROR);
    return response.status(200).send(`${new InternalServerError()}`);
  }
  const [itemError, item] = getItemFromListById(itemId, sameTypeItems);
  if (itemError) {
    logger.error({
      message: `no matching item found from list, itemId: ${itemId}, sameTypeItems: ${JSON.stringify(sameTypeItems)}`,
      fileName: 'integration controller',
      functionName: 'syncStatusAndTasks',
    });
    return [itemError, null];
  }
  logger.info({
    message: 'item found',
    fileName: 'integration controller',
    functionName: 'syncStatusAndTasks',
    data: `item: ${JSON.stringify(item)}`,
  });
  const [[syncNextStatusError, syncNextStatusSuccess], [createNextItemError, createNextItemSuccess]] =
    await Promise.all([
      integrationService.syncNextStatus(monAccessToken, boardId, item, sameTypeItems, taskType),
      integrationService.createNextItem(monAccessToken, item, taskType, boardId, userId),
    ]);
  if (syncNextStatusError || createNextItemError) {
    const message = syncNextStatusError
      ? ERRORS.INTEGRATION_SYNC_NEXT_STATUS_ERROR
      : ERRORS.INTEGRATION_CREATE_NEXT_ITEM_ERROR;
      sharedService.pushNotification(monAccessToken, boardId, userId, message);
    return response.status(200).send(`${new InternalServerError()}`);
  }
  logger.info({
    message: 'syncStatusAndTasks success',
    fileName: 'integration controller',
    functionName: 'syncStatusAndTasks',
    data: `syncNextStatusSuccess: ${JSON.stringify(syncNextStatusSuccess)}, createNextItemSuccess: ${JSON.stringify(
      createNextItemSuccess
    )}`,
  });
  mondayService.changeItemStatus(
    monAccessToken,
    boardId,
    itemId,
    SYNC_INTEGRATION_COLUMNS.TASK_STATUS_COLUMN,
    SYNC_INTEGRATION_VALUES.TASK_READY_FOR_TRANSFER
  )
  return response.status(200).send({ syncNextStatusSuccess, createNextItemSuccess });
};
