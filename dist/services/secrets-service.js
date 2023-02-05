"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecretsService = void 0;
// Comment the file for local run
const keyvault_secrets_1 = require("@azure/keyvault-secrets");
const identity_1 = require("@azure/identity");
const logger_service_1 = require("./logger-service");
const error_1 = require("../types/errors/error");
const logger = logger_service_1.LoggerService.getLogger();
class SecretsService {
    constructor() {
        const credential = new identity_1.ClientSecretCredential(process.env.AZURE_TENANT_ID || '', process.env.AZURE_CLIENT_ID || '', process.env.AZURE_CLIENT_SECRET || '');
        const url = `https://${process.env.KEY_VAULT_NAME}.vault.azure.net`;
        this.client = new keyvault_secrets_1.SecretClient(url, credential);
    }
    static getSecretsService() {
        if (this.secretsServiceInstance) {
            return this.secretsServiceInstance;
        }
        this.secretsServiceInstance = new SecretsService();
        return this.secretsServiceInstance;
    }
    async getSecret(secretName) {
        try {
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
            return [new error_1.InternalServerError(), null];
        }
        catch (error) {
            logger.error({
                message: `catch: ${JSON.stringify(error)}`,
                fileName: 'secrets service',
                functionName: 'getSecret',
            });
            return [error, null];
        }
    }
}
exports.SecretsService = SecretsService;
//# sourceMappingURL=secrets-service.js.map