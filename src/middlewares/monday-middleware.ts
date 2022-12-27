import { NextFunction, Request, Response } from 'express';
import { verifyMondayAuthorization } from '../utils/auth';
import { SECRETS } from '../constants/secrets';
import { LoggerService } from '../services/logger-service';
import { SecretsService } from '../services/secrets-service';

const logger = LoggerService.getLogger();
const secretsService = SecretsService.getSecretsService();

export const verifyAuthorization = async (request: Request, response: Response, next: NextFunction) => {
  try {
    logger.info({
      message: 'start',
      fileName: 'monday middleware',
      functionName: 'verifyAuthorization',
    });
    const authorization = request.headers.authorization || request.query?.token;
    if (typeof authorization !== 'string') {
      logger.error({
        message: `authorization wrong type: ${JSON.stringify(authorization)}`,
        fileName: 'monday middleware',
        functionName: 'verifyAuthorization',
      });
      return response.status(500).send({ error: 'authorization error' });
    }

    // FROM AZURE KEY VAULT
    const [mondaySigningSecretError, mondaySigningSecret] = await secretsService.getSecret(
      SECRETS.MONDAY_SIGNING_SECRET
    );
    if (mondaySigningSecretError) {
      logger.error({
        message: 'missing monday signing secret',
        fileName: 'monday middleware',
        functionName: 'verifyClientAuthorization',
      });
      return response.status(500).send({ error: 'missing secret' });
    }

    const [monAccessTokenError, monAccessToken] = await secretsService.getSecret(SECRETS.MONDAY_TOKEN);
    if (monAccessTokenError) {
      logger.error({
        message: 'missing monday token',
        fileName: 'monday middleware',
        functionName: 'verifyClientAuthorization',
      });
      return response.status(500).send({ error: 'missing monday token' });
    }
    // END FROM AZURE KEY VAULT

    // LOCAL FOR SECRET
    // const mondaySigningSecret = process.env.MONDAY_SIGNING_SECRET;
    // if (!mondaySigningSecret) {
    //   logger.error({
    //     message: 'missing monday signing secret',
    //     fileName: 'monday middleware',
    //     functionName: 'verifyAuthorization',
    //   });
    //   return response.status(500).send({ error: 'missing secret' });
    // }
    // const monAccessToken = process.env.TOKEN;
    // if (!monAccessToken) {
    //   logger.error({
    //     message: 'missing monday token',
    //     fileName: 'monday middleware',
    //     functionName: 'verifyClientAuthorization',
    //   });
    //   return response.status(500).send({ error: 'missing monday token' });
    // }
    // END LOCAL FOR SECRET

    const { accountId, userId } = await verifyMondayAuthorization(authorization, mondaySigningSecret);
    response.locals.mondayAuthorization = {
      accountId,
      userId,
      monAccessToken,
    };
    logger.info({
      message: 'authorization verify success',
      fileName: 'monday middleware',
      functionName: 'verifyAuthorization',
      data: `response.locals.mondayAuthorization: ${JSON.stringify(response?.locals?.mondayAuthorization)}`,
    });
    next();
  } catch (error) {
    logger.error({
      message: `catch error: ${JSON.stringify(error)}`,
      fileName: 'monday middleware',
      functionName: 'verifyAuthorization',
    });
    return response.status(401).send({ error: 'authorization verification error' });
  }
};

export const verifyClientAuthorization = async (request: Request, response: Response, next: NextFunction) => {
  try {
    logger.info({
      message: 'start',
      fileName: 'monday middleware',
      functionName: 'verifyClientAuthorization',
    });
    const authorization = request.headers.authorization;
    if (typeof authorization !== 'string') {
      logger.error({
        message: `authorization wrong type: ${JSON.stringify(authorization)}`,
        fileName: 'monday middleware',
        functionName: 'verifyClientAuthorization',
      });
      return response.status(500).send({ error: 'authorization error' });
    }
    const [mondayClientSecretError, mondayClientSecret] = await secretsService.getSecret(SECRETS.MONDAY_CLIENT_SECRET);
    if (mondayClientSecretError) {
      logger.error({
        message: 'missing monday client secret',
        fileName: 'monday middleware',
        functionName: 'verifyClientAuthorization',
      });
      return response.status(500).send({ error: 'missing secret' });
    }

    const [monAccessTokenError, monAccessToken] = await secretsService.getSecret(SECRETS.MONDAY_TOKEN);
    if (monAccessTokenError) {
      logger.error({
        message: 'missing monday token',
        fileName: 'monday middleware',
        functionName: 'verifyClientAuthorization',
      });
      return response.status(500).send({ error: 'missing monday token' });
    }

    // LOCAL FOR SECRET
    // const mondayClientSecret = process.env.MONDAY_CLIENT_SECRET;
    // if (!mondayClientSecret) {
    //   logger.error({
    //     message: 'missing monday client secret',
    //     fileName: 'monday middleware',
    //     functionName: 'verifyClientAuthorization',
    //   });
    //   return response.status(500).send({ error: 'missing secret' });
    // }
    // const monAccessToken = process.env.TOKEN;
    // if (!monAccessToken) {
    //   logger.error({
    //     message: 'missing monday token',
    //     fileName: 'monday middleware',
    //     functionName: 'verifyClientAuthorization',
    //   });
    //   return response.status(500).send({ error: 'missing monday token' });
    // }
    // END LOCAL FOR SECRET

    const { dat } = await verifyMondayAuthorization(authorization, mondayClientSecret);
    response.locals.mondayAuthorization = {
      accountId: dat.account_id,
      userId: dat.user_id,
      monAccessToken,
    };
    logger.info({
      message: 'authorization verify success',
      fileName: 'monday middleware',
      functionName: 'verifyClientAuthorization',
      data: `response.locals.mondayAuthorization: ${JSON.stringify(response?.locals?.mondayAuthorization)}`,
    });
    next();
  } catch (error) {
    logger.error({
      message: `catch error: ${JSON.stringify(error)}`,
      fileName: 'monday middleware',
      functionName: 'verifyClientAuthorization',
    });
    return response.status(401).send({ error: 'authorization verification error' });
  }
};
