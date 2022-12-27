import { NextFunction, Request, Response } from 'express';
import { SyncIntegrationInputs } from '../types/interfaces/sync-integration-inputs';
import { LoggerService } from '../services/logger-service';

const logger = LoggerService.getLogger();

export const validateSyncIntegrationInputs = async (request: Request, response: Response, next: NextFunction) => {
  try {
    logger.info({
      message: 'start',
      fileName: 'integration middleware',
      functionName: 'validateSyncIntegrationInputs',
    });
    const { boardId, itemId }: SyncIntegrationInputs = request?.body?.payload?.inputFields;
    if (!boardId || !itemId) {
      logger.error({
        message: `no inputs in request payload: ${JSON.stringify(request?.body?.payload)}`,
        fileName: 'integration middleware',
        functionName: 'syncStatusAndTasks',
      });
      return response.status(500).send({ error: 'missing input fields error' });
    }
    response.locals.inputs = {
      boardId,
      itemId,
    } as SyncIntegrationInputs;
    logger.info({
      message: 'inputs success',
      fileName: 'integration middleware',
      functionName: 'validateSyncIntegrationInputs',
      data: `response.locals.inputs: ${JSON.stringify(response?.locals?.inputs)}`,
    });
    next();
  } catch (error) {
    logger.error({
      message: `catch error: ${JSON.stringify(error)}`,
      fileName: 'integration middleware',
      functionName: 'syncStatusAndTasks',
    });
    return response.status(401).send({ error: 'integration verify inputs error' });
  }
};
