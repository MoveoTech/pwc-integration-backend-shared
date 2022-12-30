"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecretsService = void 0;
const keyvault_secrets_1 = require("@azure/keyvault-secrets");
const identity_1 = require("@azure/identity");
const logger_service_1 = require("./logger-service");
const error_1 = require("../types/errors/error");
const logger = logger_service_1.LoggerService.getLogger();
class SecretsService {
    constructor() {
        logger.info({
            message: 'start ctor',
            fileName: 'secrets service',
            functionName: 'constructor',
        });
        this.credential = new identity_1.ClientSecretCredential(process.env.AZURE_TENANT_ID || '', process.env.AZURE_CLIENT_ID || '', process.env.AZURE_CLIENT_SECRET || '');
        console.log(' this.cred: ', JSON.stringify(this.credential));
        const url = `https://${process.env.KEY_VAULT_NAME}.vault.azure.net`;
        this.client = new keyvault_secrets_1.SecretClient(url, this.credential);
        logger.info({
            message: 'initialized secrets service',
            fileName: 'secrets service',
            functionName: 'constructor',
        });
    }
    async getSecret(secretName) {
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