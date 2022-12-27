import { SecretClient } from '@azure/keyvault-secrets';
import { DefaultAzureCredential } from '@azure/identity';
import { LoggerService } from './logger-service';
import { ErrorResultTuple } from '../types/errors/error-result-tuple';
import { InternalServerError } from '../types/errors/error';

const logger = LoggerService.getLogger();

export class SecretsService {
  private static secretsServiceInstance: SecretsService;
  private credential: DefaultAzureCredential;
  private client: SecretClient;
  private keyVaultName: string = (process.env.KEY_VAULT_NAME || '') + (process.env.NODE_ENV || '');

  constructor() {
    this.credential = new DefaultAzureCredential();
    const url = 'https://' + this.keyVaultName + '.vault.azure.net';
    this.client = new SecretClient(url, this.credential);
  }

  public static getSecretsService() {
    if (this.secretsServiceInstance) {
      return this.secretsServiceInstance;
    }
    this.secretsServiceInstance = new SecretsService();
    return this.secretsServiceInstance;
  }

  public async getSecret(secretName: string): Promise<ErrorResultTuple<string>> {
    try {
      logger.info({
        message: 'before getting secret',
        fileName: 'secrets service',
        functionName: 'getSecret',
        data: `secret name: ${secretName}`,
      });
      const secret = await this.client.getSecret(secretName);
      if (secret && secret.value) {
        logger.info({
          message: 'success retreiving secret',
          fileName: 'secrets service',
          functionName: 'getSecret',
          data: `secret name: ${secretName}`,
        });
        return [null, secret.value];
      }
      logger.info({
        message: 'secret value is empty',
        fileName: 'secrets service',
        functionName: 'getSecret',
        data: `secret: ${JSON.stringify(secret)}`,
      });
      return [new InternalServerError(), null];
    } catch (error: any) {
      logger.error({
        message: `catch: ${JSON.stringify(error)}`,
        fileName: 'secrets service',
        functionName: 'getSecret',
      });
      return [error, null];
    }
  }
}
