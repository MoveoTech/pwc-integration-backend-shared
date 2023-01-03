"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MondayService = void 0;
//@ts-ignore
const monday_sdk_js_1 = __importDefault(require("monday-sdk-js"));
const error_1 = require("../types/errors/error");
const monday_complexity_1 = require("../constants/monday-complexity");
const sync_integration_values_1 = require("../constants/sync-integration-values");
const monday_queries_1 = require("./monday-queries");
const monday_1 = require("../utils/monday");
const logger_service_1 = require("./logger-service");
const queue_service_1 = require("./queue-service");
const cache_service_1 = require("./cache-service");
const cache_1 = require("../constants/cache");
const logger = logger_service_1.LoggerService.getLogger();
class MondayService {
    constructor() {
        this.mondayClient = (0, monday_sdk_js_1.default)();
        this.queueService = queue_service_1.QueueService.getQueueService();
    }
    async queryItemColumnsValues(monAccessToken, itemId) {
        var _a, _b, _c;
        // TODO type for res
        const query = monday_queries_1.queries.queryItemColumnsValues;
        const variables = { itemId };
        logger.info({
            message: 'start',
            fileName: 'monday service',
            functionName: 'queryItemColumnsValues',
            data: `query: ${JSON.stringify(query)}, vars: ${JSON.stringify(variables)}`,
        });
        const [responseError, response] = await this.executeQuery(monAccessToken, query, variables);
        if (responseError) {
            logger.error({
                message: `responseError: ${JSON.stringify(responseError)}`,
                fileName: 'monday service',
                functionName: 'queryItemColumnsValues',
            });
            return [responseError, null];
        }
        logger.info({
            message: 'response',
            fileName: 'monday service',
            functionName: 'queryItemColumnsValues',
            data: `response: ${JSON.stringify(response === null || response === void 0 ? void 0 : response.data)}`,
        });
        if ((_b = (_a = response === null || response === void 0 ? void 0 : response.data) === null || _a === void 0 ? void 0 : _a.items) === null || _b === void 0 ? void 0 : _b.length) {
            return [null, (0, monday_1.mapToItem)((_c = response === null || response === void 0 ? void 0 : response.data) === null || _c === void 0 ? void 0 : _c.items[0])];
        }
        return [new error_1.InternalServerError(), null];
    }
    async queryItemsByColumnValue(monAccessToken, boardId, columnId, columnValue) {
        var _a, _b;
        // TODO type for res
        const query = monday_queries_1.queries.queryItemsByColumnValue;
        let page = 1;
        const variables = { boardId, columnId, columnValue, page, limit: sync_integration_values_1.SYNC_INTEGRATION_VALUES.MAX_ITEMS_PER_QUERY };
        logger.info({
            message: 'start',
            fileName: 'monday service',
            functionName: 'queryItemsByColumnValue',
            data: `query: ${JSON.stringify(query)}, vars: ${JSON.stringify(variables)}`,
        });
        const itemsRes = [];
        let itemsResCount = 0;
        do {
            const [responseError, response] = await this.executeQuery(monAccessToken, query, variables);
            if (responseError) {
                logger.error({
                    message: `responseError: ${JSON.stringify(responseError)}`,
                    fileName: 'monday service',
                    functionName: 'queryItemsByColumnValue',
                });
                return [responseError, null];
            }
            itemsResCount = 0;
            if ((_b = (_a = response === null || response === void 0 ? void 0 : response.data) === null || _a === void 0 ? void 0 : _a.items_by_column_values) === null || _b === void 0 ? void 0 : _b.length) {
                itemsRes.push(...response.data.items_by_column_values);
                itemsResCount = response.data.items_by_column_values.length;
            }
            page++;
            variables.page = page;
        } while (itemsResCount === sync_integration_values_1.SYNC_INTEGRATION_VALUES.MAX_ITEMS_PER_QUERY);
        logger.info({
            message: 'response',
            fileName: 'monday service',
            functionName: 'queryItemsByColumnValue',
            data: `itemsRes: ${JSON.stringify(itemsRes)}`,
        });
        if (itemsRes === null || itemsRes === void 0 ? void 0 : itemsRes.length) {
            return [null, (0, monday_1.mapToItems)(itemsRes)];
        }
        return [new error_1.InternalServerError(), null];
    }
    async queryItemsColumnsValuesByBoardId(monAccessToken, boardId) {
        var _a, _b;
        const query = monday_queries_1.queries.getItemsColumnValuesByBoardId;
        let page = 1;
        const variables = { boardId, page, limit: sync_integration_values_1.SYNC_INTEGRATION_VALUES.MAX_ITEMS_PER_QUERY };
        logger.info({
            message: 'start',
            fileName: 'monday service',
            functionName: 'queryItemsColumnsValuesByBoardId',
            data: `query: ${JSON.stringify(query)}, vars: ${JSON.stringify(variables)}`,
        });
        const itemsRes = [];
        let itemsResCount = 0;
        do {
            const [responseError, response] = await this.executeQuery(monAccessToken, query, variables);
            if (responseError) {
                logger.error({
                    message: `responseError: ${JSON.stringify(responseError)}`,
                    fileName: 'monday service',
                    functionName: 'queryItemsByColumnValue',
                });
                return [responseError, null];
            }
            itemsResCount = 0;
            if ((_b = (_a = response === null || response === void 0 ? void 0 : response.data) === null || _a === void 0 ? void 0 : _a.boards) === null || _b === void 0 ? void 0 : _b.length) {
                itemsRes.push(...response.data.boards[0].items);
                itemsResCount = response.data.boards[0].items.length;
            }
            page++;
            variables.page = page;
        } while (itemsResCount === sync_integration_values_1.SYNC_INTEGRATION_VALUES.MAX_ITEMS_PER_QUERY);
        logger.info({
            message: 'response',
            fileName: 'monday service',
            functionName: 'queryItemsByColumnValue',
            data: `itemsRes: ${JSON.stringify(itemsRes)}`,
        });
        if (itemsRes === null || itemsRes === void 0 ? void 0 : itemsRes.length) {
            return [null, (0, monday_1.mapToItems)(itemsRes)];
        }
        return [new error_1.InternalServerError(), null];
    }
    async querySubItems(monAccessToken, itemId) {
        var _a, _b, _c, _d, _e;
        // TODO type for res
        const query = monday_queries_1.queries.querySubItems;
        const variables = { itemId };
        logger.info({
            message: 'start',
            fileName: 'monday service',
            functionName: 'querySubItems',
            data: `query: ${JSON.stringify(query)}, vars: ${JSON.stringify(variables)}`,
        });
        const [responseError, response] = await this.executeQuery(monAccessToken, query, variables);
        if (responseError) {
            logger.error({
                message: `responseError: ${JSON.stringify(responseError)}`,
                fileName: 'monday service',
                functionName: 'querySubItems',
            });
            return [responseError, null];
        }
        logger.info({
            message: 'response',
            fileName: 'monday service',
            functionName: 'querySubItems',
            data: `response: ${JSON.stringify(response === null || response === void 0 ? void 0 : response.data)}`,
        });
        if (((_b = (_a = response === null || response === void 0 ? void 0 : response.data) === null || _a === void 0 ? void 0 : _a.items) === null || _b === void 0 ? void 0 : _b.length) && ((_d = (_c = response === null || response === void 0 ? void 0 : response.data) === null || _c === void 0 ? void 0 : _c.items[0].subitems) === null || _d === void 0 ? void 0 : _d.length)) {
            return [null, (0, monday_1.mapToItems)((_e = response === null || response === void 0 ? void 0 : response.data) === null || _e === void 0 ? void 0 : _e.items[0].subitems)];
        }
        return [new error_1.InternalServerError(), null];
    }
    async changeItemStatus(monAccessToken, boardId, itemId, columnId, statusValue) {
        var _a, _b;
        const query = monday_queries_1.queries.changeItemColumnValue;
        const variables = {
            boardId,
            itemId,
            columnValues: JSON.stringify({
                [columnId]: statusValue,
            }),
        };
        logger.info({
            message: 'start',
            fileName: 'monday service',
            functionName: 'changeItemStatus',
            data: `query: ${JSON.stringify(query)}, vars: ${JSON.stringify(variables)}`,
        });
        const [responseError, response] = await this.executeQuery(monAccessToken, query, variables);
        if (responseError) {
            logger.error({
                message: `responseError: ${JSON.stringify(responseError)}`,
                fileName: 'monday service',
                functionName: 'changeItemStatus',
            });
            return [responseError, null];
        }
        logger.info({
            message: 'response',
            fileName: 'monday service',
            functionName: 'changeItemStatus',
            data: `response: ${JSON.stringify(response === null || response === void 0 ? void 0 : response.data)}`,
        });
        if ((_b = (_a = response === null || response === void 0 ? void 0 : response.data) === null || _a === void 0 ? void 0 : _a.change_multiple_column_values) === null || _b === void 0 ? void 0 : _b.id) {
            return [null, true];
        }
        return [new error_1.InternalServerError(), null];
    }
    async createItem(monAccessToken, boardId, itemName, columnValues) {
        const query = monday_queries_1.queries.createItem;
        const variables = { itemName, boardId, columnValues: JSON.stringify(columnValues) };
        logger.info({
            message: 'start',
            fileName: 'monday service',
            functionName: 'createItem',
            data: `query: ${JSON.stringify(query)}, vars: ${JSON.stringify(variables)}`,
        });
        // QUEUE FOR CREATION
        const cacheService = cache_service_1.CacheService.getCacheService();
        const cachedComplexity = cacheService.getKey(cache_1.CACHE.COMPLEXITY);
        if (!cachedComplexity) {
            console.log('no complexity, add to queue');
            await this.queueService.addToQueue(query, variables);
            return [null, 'success'];
        }
        const complexity = JSON.parse(cachedComplexity);
        if (monday_complexity_1.MONDAY_COMPLEXITY.MIN_COMPLEXITY_POINTS < parseInt(complexity.before)) {
            console.log('no complexity error, add to queue: ', parseInt(complexity.before));
            await this.queueService.addToQueue(query, variables);
            return [null, 'success'];
        }
        const scheduleDate = new Date();
        console.log('complexity error, add to queue with delay');
        console.log('reset_in_x_seconds: ', parseInt(complexity.reset_in_x_seconds));
        console.log('scheduleDate: ', JSON.stringify(scheduleDate));
        scheduleDate.setSeconds(scheduleDate.getSeconds() + parseInt(complexity.reset_in_x_seconds));
        console.log('scheduleDate with delay: ', JSON.stringify(scheduleDate));
        await this.queueService.addToQueue(query, variables, scheduleDate);
        return [null, 'added with delay'];
        // END QUEUE FOR CREATION
        // // LOCAL
        // const [responseError, response] = await this.executeQuery(monAccessToken, query, variables);
        // if (responseError) {
        //   logger.error({
        //     message: `responseError: ${JSON.stringify(responseError)}`,
        //     fileName: 'monday service',
        //     functionName: 'createItem',
        //   });
        //   return [responseError, null];
        // }
        // logger.info({
        //   message: 'response',
        //   fileName: 'monday service',
        //   functionName: 'createItem',
        //   data: `response: ${JSON.stringify(response?.data)}`,
        // });
        // if (response?.data?.create_item?.id) {
        //   return [null, response?.data?.create_item?.id];
        // }
        // return [new InternalServerError(), null];
        // // END LOCAL
    }
    createNotification(monAccessToken, boardId, userId, text) {
        const query = monday_queries_1.queries.createNotification;
        const variables = { text, userId, targetId: boardId };
        logger.info({
            message: 'start',
            fileName: 'monday service',
            functionName: 'createNotification',
            data: `query: ${JSON.stringify(query)}, vars: ${JSON.stringify(variables)}`,
        });
        this.executeQuery(monAccessToken, query, variables);
    }
    async executeQuery(monAccessToken, query, variables) {
        try {
            logger.info({
                message: 'start',
                fileName: 'monday service',
                functionName: 'executeQuery',
                data: `query: ${JSON.stringify(query)}, vars: ${JSON.stringify(variables)}`,
            });
            // check complexity
            const complexityQuery = `query {complexity {before reset_in_x_seconds}}`;
            const complexityRes = await this.mondayClient.api(complexityQuery, {
                token: monAccessToken,
                variables,
            });
            if (!complexityRes) {
                logger.error({
                    message: `complexity error: ${JSON.stringify(complexityRes)}`,
                    fileName: 'monday service',
                    functionName: 'executeQuery',
                });
                return [new error_1.BadRequestError(), null];
            }
            logger.info({
                message: 'complexityRes',
                fileName: 'monday service',
                functionName: 'executeQuery',
                data: `complexityRes: ${JSON.stringify(complexityRes)}`,
            });
            const { complexity } = complexityRes === null || complexityRes === void 0 ? void 0 : complexityRes.data;
            const { before, reset_in_x_seconds } = complexity;
            if (before < monday_complexity_1.MONDAY_COMPLEXITY.MIN_COMPLEXITY_POINTS) {
                logger.info({
                    message: 'complexity exceeded',
                    fileName: 'monday service',
                    functionName: 'executeQuery',
                    data: `before: ${before}`,
                });
                await new Promise((r) => setTimeout(r, reset_in_x_seconds * 1000 || 60000));
                const res = await this.executeQuery(monAccessToken, query, variables);
                return [null, res];
            }
            const response = await this.mondayClient.api(query, {
                token: monAccessToken,
                variables,
            });
            logger.info({
                message: 'response',
                fileName: 'monday service',
                functionName: 'executeQuery',
                data: `response: ${JSON.stringify(response)}`,
            });
            return [null, response];
        }
        catch (error) {
            logger.error({
                message: `catch error: ${JSON.stringify(error)}`,
                fileName: 'monday service',
                functionName: 'executeQuery',
            });
            return [error, null];
        }
    }
    async executeQueryFromQueue(monAccessToken, query, variables) {
        var _a, _b, _c;
        try {
            logger.info({
                message: 'start',
                fileName: 'monday service',
                functionName: 'executeQueryFromQueue',
                data: `query: ${JSON.stringify(query)}, vars: ${JSON.stringify(variables)}`,
            });
            const response = await this.mondayClient.api(query, {
                token: monAccessToken,
                variables,
            });
            if (((response === null || response === void 0 ? void 0 : response.status_code) && (response === null || response === void 0 ? void 0 : response.status_code) !== 200) ||
                (response === null || response === void 0 ? void 0 : response.error_code) ||
                ((_a = response === null || response === void 0 ? void 0 : response.errors) === null || _a === void 0 ? void 0 : _a.length) > 0) {
                return [null, new error_1.InternalServerError()];
            }
            if ((response === null || response === void 0 ? void 0 : response.data) && ((_b = response === null || response === void 0 ? void 0 : response.data) === null || _b === void 0 ? void 0 : _b.complexity)) {
                const { complexity } = response === null || response === void 0 ? void 0 : response.data;
                const cacheService = cache_service_1.CacheService.getCacheService();
                cacheService.setKey(cache_1.CACHE.COMPLEXITY, JSON.stringify(complexity), (_c = complexity.reset_in_x_seconds) !== null && _c !== void 0 ? _c : 60);
            }
            return [null, response];
        }
        catch (error) {
            logger.error({
                message: `catch error: ${JSON.stringify(error)}`,
                fileName: 'monday service',
                functionName: 'executeQueryFromQueue',
            });
            return [error, null];
        }
    }
}
exports.MondayService = MondayService;
//# sourceMappingURL=monday-service.js.map