import { NextFunction, Request, Response } from 'express';
import { TemplateAddTaskInputs } from '../types/interfaces/template-add-task-inputs';
import { LoggerService } from '../services/logger-service';

const logger = LoggerService.getLogger();

export const validateTemplateAddTaskInputs = async (request: Request, response: Response, next: NextFunction) => {
  try {
    logger.info({
      message: 'start',
      fileName: 'template add task middleware',
      functionName: 'validateSyncIntegrationInputs',
    });
    const { boardId, itemId, templateItemId, settingsBoardIds }: TemplateAddTaskInputs = request?.body?.payload?.settings;
    if (!itemId || !templateItemId || !settingsBoardIds) {
      logger.error({
        message: `no inputs in request payload: ${JSON.stringify(request?.body?.payload)}`,
        fileName: 'template add task middleware',
        functionName: 'validateTemplateAddTaskInputs',
      });
      return response.status(500).send({ error: 'missing input fields error' });
    }
    response.locals.inputs = {
      boardId,
      itemId,
      templateItemId,
      settingsBoardIds
    } as TemplateAddTaskInputs;
    logger.info({
      message: 'inputs success',
      fileName: 'template add task middleware',
      functionName: 'validateTemplateAddTaskInputs',
      data: `response.locals.inputs: ${JSON.stringify(response?.locals?.inputs)}`,
    });
    next();
  } catch (error) {
    logger.error({
      message: `catch error: ${JSON.stringify(error)}`,
      fileName: 'template add task middleware',
      functionName: 'validateTemplateAddTaskInputs',
    });
    return response.status(401).send({ error: 'integration verify inputs error' });
  }
};
