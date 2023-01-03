"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueService = void 0;
const service_bus_1 = require("@azure/service-bus");
const identity_1 = require("@azure/identity");
const logger_service_1 = require("./logger-service");
const cache_service_1 = require("./cache-service");
const cache_1 = require("../constants/cache");
const secrets_service_1 = require("./secrets-service");
const secrets_1 = require("../constants/secrets");
const monday_service_1 = require("./monday-service");
const logger = logger_service_1.LoggerService.getLogger();
class QueueService {
    constructor() {
        this.queueName = process.env.QUEUE_NAME || '';
        this.client = this.setClient();
        this.sender = this.setSender();
        this.receiver = this.setReceiver();
    }
    static getQueueService() {
        if (this.queueServiceInstance) {
            return this.queueServiceInstance;
        }
        this.queueServiceInstance = new QueueService();
        return this.queueServiceInstance;
    }
    setClient() {
        const credential = new identity_1.ClientSecretCredential(process.env.AZURE_TENANT_ID || '', process.env.AZURE_CLIENT_ID || '', process.env.AZURE_CLIENT_SECRET || '');
        const fullyQualifiedNamespace = `${process.env.SERVICE_BUS_NAMESPACE}.servicebus.windows.net`;
        this.client = new service_bus_1.ServiceBusClient(fullyQualifiedNamespace, credential);
        return this.client;
    }
    setSender() {
        this.sender = this.client.createSender(this.queueName);
        return this.sender;
    }
    setReceiver() {
        this.receiver = this.client.createReceiver(this.queueName);
        this.receiver.subscribe({
            processMessage: this.handleMessage,
            processError: this.handleMessageError,
        }, {
            autoCompleteMessages: false,
        });
        return this.receiver;
    }
    async handleMessage(message) {
        const { query, variables } = message === null || message === void 0 ? void 0 : message.body;
        const cacheService = new cache_service_1.CacheService();
        let monAccessToken = cacheService.getKey(cache_1.CACHE.MONDAY_TOKEN);
        let monAccessTokenError;
        if (!monAccessToken) {
            const secretsService = new secrets_service_1.SecretsService();
            [monAccessTokenError, monAccessToken] = await secretsService.getSecret(secrets_1.SECRETS.MONDAY_TOKEN);
            if (monAccessTokenError) {
                logger.error({
                    message: 'missing monday token',
                    fileName: 'queue service',
                    functionName: 'handleMessage',
                });
                this.receiver.abandonMessage(message);
                return;
            }
            cacheService.setKey(cache_1.CACHE.MONDAY_TOKEN, monAccessToken, cache_1.CACHE.MONDAY_TOKEN_TTL);
        }
        const mondayService = new monday_service_1.MondayService();
        const [resError] = await mondayService.executeQueryFromQueue(monAccessToken, query, variables);
        if (resError) {
            logger.error({
                message: `resError: ${JSON.stringify(resError)}`,
                fileName: 'queue service',
                functionName: 'handleMessage',
            });
            this.receiver.abandonMessage(message);
            return;
        }
        this.receiver.completeMessage(message);
    }
    async handleMessageError(messageError) {
        logger.error({
            message: `messageError: ${JSON.stringify(messageError)}`,
            fileName: 'queue service',
            functionName: 'handleMessageError',
        });
    }
    async addToQueue(query, variables, delay) {
        const message = {
            body: {
                query,
                variables,
            },
        };
        if (delay) {
            await this.sender.scheduleMessages(message, delay);
            return;
        }
        await this.sender.sendMessages(message);
    }
}
exports.QueueService = QueueService;
//# sourceMappingURL=queue-service.js.map