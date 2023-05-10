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
const queue_1 = __importDefault(require("../utils/queue"));
const cache_service_1 = require("./cache-service");
const cache_1 = require("../constants/cache");
const http_service_1 = require("./http-service");
const logger = logger_service_1.LoggerService.getLogger();
const mondayApiUrl = 'https://api.monday.com/v2';
class MondayService {
    constructor() {
        this.mondayClient = (0, monday_sdk_js_1.default)();
        this.queue = queue_1.default.getQueue();
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
    async queryItemsColumnsValuesByBoardId(monAccessToken, boardId) {
        var _a, _b;
        const cacheService = cache_service_1.CacheService.getCacheService();
        const query = monday_queries_1.queries.getItemsColumnValuesByBoardId;
        let page = 1;
        const variables = { boardId, page, limit: sync_integration_values_1.SYNC_INTEGRATION_VALUES.MAX_ITEMS_PER_QUERY };
        const itemsRes = [];
        let itemsResCount = 0;
        do {
            logger.info({
                message: 'start do',
                fileName: 'monday service',
                functionName: 'queryItemsColumnsValuesByBoardId',
                data: `query: ${JSON.stringify(query)}, vars: ${JSON.stringify(variables)}`,
            });
            const pageCacheKey = `${cache_1.CACHE.ITEMS_BY_BOARD_ID}_${boardId}_${page}`;
            const cachedPageRes = cacheService.getKey(pageCacheKey);
            if (!cachedPageRes) {
                const [responseError, response] = await (0, http_service_1.postRequest)(`${mondayApiUrl}`, monAccessToken, JSON.stringify({
                    query,
                    variables: JSON.stringify(variables),
                }));
                if (responseError) {
                    logger.error({
                        message: `responseError: ${JSON.stringify(responseError)}`,
                        fileName: 'monday service',
                        functionName: 'queryItemsColumnsValuesByBoardId',
                    });
                    return [responseError, null];
                }
                itemsResCount = 0;
                if ((_b = (_a = response === null || response === void 0 ? void 0 : response.data) === null || _a === void 0 ? void 0 : _a.boards) === null || _b === void 0 ? void 0 : _b.length) {
                    itemsRes.push(...response.data.boards[0].items);
                    itemsResCount = response.data.boards[0].items.length;
                    cacheService.setKey(pageCacheKey, JSON.stringify(response.data.boards[0].items), cache_1.CACHE.ITEMS_BY_BOARD_ID_TTL);
                }
            }
            else {
                const parsedPageRes = JSON.parse(cachedPageRes);
                itemsRes.push(...parsedPageRes);
                itemsResCount = parsedPageRes.length;
            }
            page++;
            variables.page = page;
        } while (itemsResCount === sync_integration_values_1.SYNC_INTEGRATION_VALUES.MAX_ITEMS_PER_QUERY);
        logger.info({
            message: 'response success',
            fileName: 'monday service',
            functionName: 'queryItemsColumnsValuesByBoardId',
            data: `itemsRes length: ${JSON.stringify(itemsRes.length)}`,
        });
        if (itemsRes === null || itemsRes === void 0 ? void 0 : itemsRes.length) {
            const resCacheKey = `${cache_1.CACHE.ITEMS_BY_BOARD_ID}_${boardId}`;
            const cachedRes = cacheService.getKey(resCacheKey);
            if (!cachedRes) {
                const mappedRes = (0, monday_1.mapToItems)(itemsRes);
                cacheService.setKey(resCacheKey, JSON.stringify(mappedRes), cache_1.CACHE.ITEMS_BY_BOARD_ID_TTL);
                return [null, mappedRes];
            }
            else {
                const parsedRes = JSON.parse(cachedRes);
                return [null, parsedRes];
            }
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
        var _a, _b, _c;
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
            await ((_a = this.queue) === null || _a === void 0 ? void 0 : _a.add('query', {
                query,
                variables,
            }, {
                jobId: `${variables === null || variables === void 0 ? void 0 : variables.boardId}-${Date.now()}-${variables === null || variables === void 0 ? void 0 : variables.itemName}`,
                removeOnComplete: true,
                removeOnFail: { age: 24 * 3600, count: 5000 },
            }));
            return [null, 'success'];
        }
        const complexity = JSON.parse(cachedComplexity);
        if (monday_complexity_1.MONDAY_COMPLEXITY.MIN_COMPLEXITY_POINTS < parseInt(complexity.before)) {
            console.log('no complexity error, add to queue: ', parseInt(complexity.before));
            await ((_b = this.queue) === null || _b === void 0 ? void 0 : _b.add('query', {
                query,
                variables,
            }, {
                jobId: `${variables === null || variables === void 0 ? void 0 : variables.boardId}-${Date.now()}-${variables === null || variables === void 0 ? void 0 : variables.itemName}`,
                removeOnComplete: true,
                removeOnFail: { age: 24 * 3600, count: 5000 },
            }));
            return [null, 'success'];
        }
        const scheduleDate = new Date();
        console.log('complexity error, add to queue with delay');
        console.log('reset_in_x_seconds: ', parseInt(complexity.reset_in_x_seconds));
        console.log('scheduleDate: ', JSON.stringify(scheduleDate));
        scheduleDate.setSeconds(scheduleDate.getSeconds() + parseInt(complexity.reset_in_x_seconds));
        console.log('scheduleDate with delay: ', JSON.stringify(scheduleDate));
        await ((_c = this.queue) === null || _c === void 0 ? void 0 : _c.add('query', {
            query,
            variables,
        }, {
            jobId: `${variables === null || variables === void 0 ? void 0 : variables.boardId}-${Date.now()}-${variables === null || variables === void 0 ? void 0 : variables.itemName}`,
            delay: complexity.reset_in_x_seconds * 1000,
            removeOnComplete: true,
            removeOnFail: { age: 24 * 3600, count: 5000 },
        }));
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
    async getUserIdByName(monAccessToken, name) {
        var _a, _b, _c, _d, _e, _f;
        const query = monday_queries_1.queries.getUserId;
        const variables = { name };
        logger.info({
            message: 'start',
            fileName: 'monday service',
            functionName: 'getUserIdByName',
            data: `query: ${JSON.stringify(query)}, vars: ${JSON.stringify(variables)}`,
        });
        const [responseError, response] = await this.executeQuery(monAccessToken, query, variables);
        if (responseError) {
            logger.error({
                message: `responseError: ${JSON.stringify(responseError)}`,
                fileName: 'monday service',
                functionName: 'getUserIdByName',
            });
            return [responseError, null];
        }
        logger.info({
            message: 'response',
            fileName: 'monday service',
            functionName: 'getUserIdByName',
            data: `response: ${JSON.stringify(response === null || response === void 0 ? void 0 : response.data)}`,
        });
        if (((_b = (_a = response === null || response === void 0 ? void 0 : response.data) === null || _a === void 0 ? void 0 : _a.users) === null || _b === void 0 ? void 0 : _b.length) && ((_d = (_c = response === null || response === void 0 ? void 0 : response.data) === null || _c === void 0 ? void 0 : _c.users[0]) === null || _d === void 0 ? void 0 : _d.id)) {
            return [null, (_f = (_e = response === null || response === void 0 ? void 0 : response.data) === null || _e === void 0 ? void 0 : _e.users[0]) === null || _f === void 0 ? void 0 : _f.id];
        }
        return [new error_1.InternalServerError(), null];
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
        logger.info({
            message: 'start',
            fileName: 'monday service',
            functionName: 'executeQuery',
            data: `query: ${JSON.stringify(query)}, vars: ${JSON.stringify(variables)}`,
        });
        const cacheService = cache_service_1.CacheService.getCacheService();
        const cachedComplexity = cacheService.getKey(cache_1.CACHE.COMPLEXITY);
        if (!cachedComplexity) {
            const [responseError, response] = await this.getQueryRes(query, {
                token: monAccessToken,
                variables,
            });
            if (responseError) {
                logger.error({
                    message: `responseError: ${JSON.stringify(responseError)}`,
                    fileName: 'monday service',
                    functionName: 'executeQuery',
                });
                return [responseError, null];
            }
            return [null, response];
        }
        const complexity = JSON.parse(cachedComplexity);
        if (monday_complexity_1.MONDAY_COMPLEXITY.MIN_COMPLEXITY_POINTS < parseInt(complexity.before)) {
            const [responseError, response] = await this.getQueryRes(query, {
                token: monAccessToken,
                variables,
            });
            if (responseError) {
                logger.error({
                    message: `responseError: ${JSON.stringify(responseError)}`,
                    fileName: 'monday service',
                    functionName: 'executeQuery',
                });
                return [responseError, null];
            }
            return [null, response];
        }
        logger.info({
            message: 'complexity exceeded',
            fileName: 'monday service',
            functionName: 'executeQuery',
            data: `before: ${complexity.before}`,
        });
        await new Promise((r) => setTimeout(r, complexity.reset_in_x_seconds * 1000 || 60000));
        const [err, res] = await this.executeQuery(monAccessToken, query, variables);
        if (err) {
            logger.error({
                message: `err: ${JSON.stringify(err)}`,
                fileName: 'monday service',
                functionName: 'executeQuery',
            });
            return [err, null];
        }
        return [null, res];
    }
    async getQueryRes(query, variables) {
        var _a, _b;
        try {
            const response = await this.mondayClient.api(query, variables);
            console.log('getQueryRes => mondayApiResponse => ', response);
            if ((response === null || response === void 0 ? void 0 : response.data) && ((_a = response === null || response === void 0 ? void 0 : response.data) === null || _a === void 0 ? void 0 : _a.complexity)) {
                const { complexity } = response === null || response === void 0 ? void 0 : response.data;
                const cacheService = cache_service_1.CacheService.getCacheService();
                cacheService.setKey(cache_1.CACHE.COMPLEXITY, JSON.stringify(complexity), (_b = complexity.reset_in_x_seconds) !== null && _b !== void 0 ? _b : 60);
            }
            return [null, response];
        }
        catch (error) {
            logger.error({
                message: `catch error: ${JSON.stringify(error)}`,
                fileName: 'monday service',
                functionName: 'getQueryRes',
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
            console.log('executeQueryFromQueue => mondayApiResponse => ', response);
            if (((response === null || response === void 0 ? void 0 : response.status_code) && (response === null || response === void 0 ? void 0 : response.status_code) !== 200) ||
                (response === null || response === void 0 ? void 0 : response.error_code) ||
                ((_a = response === null || response === void 0 ? void 0 : response.errors) === null || _a === void 0 ? void 0 : _a.length) > 0) {
                return [new error_1.InternalServerError(), null];
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