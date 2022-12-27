//@ts-ignore
import mondaySdk from 'monday-sdk-js';
import { BadRequestError, InternalServerError } from '../types/errors/error';
import { ErrorResultTuple } from '../types/errors/error-result-tuple';
import { MONDAY_COMPLEXITY } from '../constants/monday-complexity';
import { SYNC_INTEGRATION_VALUES } from '../constants/sync-integration-values';
import { queries } from './monday-queries';
import { mapToItem, mapToItems } from '../utils/monday';
import { MondayItem } from '../types/interfaces/monday-item';
import { LoggerService } from './logger-service';

const logger = LoggerService.getLogger();

export class MondayService {
  private mondayClient: mondaySdk;

  constructor() {
    this.mondayClient = mondaySdk();
  }

  public async queryItemColumnsValues(monAccessToken: string, itemId: number): Promise<ErrorResultTuple<MondayItem>> {
    // TODO type for res
    const query = queries.queryItemColumnsValues;
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
      data: `response: ${JSON.stringify(response?.data)}`,
    });
    if (response?.data?.items?.length) {
      return [null, mapToItem(response?.data?.items[0])];
    }
    return [new InternalServerError(), null];
  }

  public async queryItemsByColumnValue(
    monAccessToken: string,
    boardId: number,
    columnId: string,
    columnValue: string
  ): Promise<ErrorResultTuple<MondayItem[]>> {
    // TODO type for res
    const query = queries.queryItemsByColumnValue;
    let page = 1;
    const variables = { boardId, columnId, columnValue, page, limit: SYNC_INTEGRATION_VALUES.MAX_ITEMS_PER_QUERY };
    logger.info({
      message: 'start',
      fileName: 'monday service',
      functionName: 'queryItemsByColumnValue',
      data: `query: ${JSON.stringify(query)}, vars: ${JSON.stringify(variables)}`,
    });
    const itemsRes: any[] = [];
    let itemsResCount: number = 0;
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
      if (response?.data?.items_by_column_values?.length) {
        itemsRes.push(...response.data.items_by_column_values);
        itemsResCount = response.data.items_by_column_values.length;
      }
      page++;
      variables.page = page;
    } while (itemsResCount === SYNC_INTEGRATION_VALUES.MAX_ITEMS_PER_QUERY);
    logger.info({
      message: 'response',
      fileName: 'monday service',
      functionName: 'queryItemsByColumnValue',
      data: `itemsRes: ${JSON.stringify(itemsRes)}`,
    });
    if (itemsRes?.length) {
      return [null, mapToItems(itemsRes)];
    }
    return [new InternalServerError(), null];
  }

  public async queryItemsColumnsValuesByBoardId(
    monAccessToken: string,
    boardId: number
  ): Promise<ErrorResultTuple<MondayItem[]>> {
    const query = queries.getItemsColumnValuesByBoardId;
    let page = 1;
    const variables = { boardId, page, limit: SYNC_INTEGRATION_VALUES.MAX_ITEMS_PER_QUERY };
    logger.info({
      message: 'start',
      fileName: 'monday service',
      functionName: 'queryItemsColumnsValuesByBoardId',
      data: `query: ${JSON.stringify(query)}, vars: ${JSON.stringify(variables)}`,
    });
    const itemsRes: any[] = [];
    let itemsResCount: number = 0;
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
      if (response?.data?.boards?.length) {
        itemsRes.push(...response.data.boards[0].items);
        itemsResCount = response.data.boards[0].items.length;
      }
      page++;
      variables.page = page;
    } while (itemsResCount === SYNC_INTEGRATION_VALUES.MAX_ITEMS_PER_QUERY);
    logger.info({
      message: 'response',
      fileName: 'monday service',
      functionName: 'queryItemsByColumnValue',
      data: `itemsRes: ${JSON.stringify(itemsRes)}`,
    });
    if (itemsRes?.length) {
      return [null, mapToItems(itemsRes)];
    }
    return [new InternalServerError(), null];
  }

  public async querySubItems(monAccessToken: string, itemId: number): Promise<ErrorResultTuple<MondayItem[]>> {
    // TODO type for res
    const query = queries.querySubItems;
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
      data: `response: ${JSON.stringify(response?.data)}`,
    });
    if (response?.data?.items?.length && response?.data?.items[0].subitems?.length) {
      return [null, mapToItems(response?.data?.items[0].subitems)];
    }
    return [new InternalServerError(), null];
  }

  public async changeItemStatus(
    monAccessToken: string,
    boardId: number,
    itemId: number,
    columnId: string,
    statusValue: string
  ): Promise<ErrorResultTuple<boolean>> {
    const query = queries.changeItemColumnValue;
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
      data: `response: ${JSON.stringify(response?.data)}`,
    });
    if (response?.data?.change_multiple_column_values?.id) {
      return [null, true];
    }
    return [new InternalServerError(), null];
  }

  public async createItem(
    monAccessToken: string,
    boardId: number,
    itemName: string,
    columnValues: any
  ): Promise<ErrorResultTuple<string>> {
    const query = queries.createItem;
    const variables = { itemName, boardId, columnValues: JSON.stringify(columnValues) };
    logger.info({
      message: 'start',
      fileName: 'monday service',
      functionName: 'createItem',
      data: `query: ${JSON.stringify(query)}, vars: ${JSON.stringify(variables)}`,
    });
    const [responseError, response] = await this.executeQuery(monAccessToken, query, variables);
    if (responseError) {
      logger.error({
        message: `responseError: ${JSON.stringify(responseError)}`,
        fileName: 'monday service',
        functionName: 'createItem',
      });
      return [responseError, null];
    }
    logger.info({
      message: 'response',
      fileName: 'monday service',
      functionName: 'createItem',
      data: `response: ${JSON.stringify(response?.data)}`,
    });
    if (response?.data?.create_item?.id) {
      return [null, response?.data?.create_item?.id];
    }
    return [new InternalServerError(), null];
  }

  public createNotification(monAccessToken: string, boardId: number, userId: number, text: string): void {
    const query = queries.createNotification;
    const variables = { text, userId, targetId: boardId };
    logger.info({
      message: 'start',
      fileName: 'monday service',
      functionName: 'createNotification',
      data: `query: ${JSON.stringify(query)}, vars: ${JSON.stringify(variables)}`,
    });
    this.executeQuery(monAccessToken, query, variables);
  }

  private async executeQuery(monAccessToken: string, query: string, variables: any): Promise<ErrorResultTuple<any>> {
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
        return [new BadRequestError(), null];
      }
      logger.info({
        message: 'complexityRes',
        fileName: 'monday service',
        functionName: 'executeQuery',
        data: `complexityRes: ${JSON.stringify(complexityRes)}`,
      });
      const { complexity } = complexityRes?.data;
      const { before, reset_in_x_seconds } = complexity;
      if (before < MONDAY_COMPLEXITY.MIN_COMPLEXITY_POINTS) {
        logger.info({
          message: 'complexity exceeded',
          fileName: 'monday service',
          functionName: 'executeQuery',
          data: `before: ${before}`,
        });
        await new Promise((r) => setTimeout(r, reset_in_x_seconds * 1000 || 60000));
        const res: any = await this.executeQuery(monAccessToken, query, variables);
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
    } catch (error: any) {
      logger.error({
        message: `catch error: ${JSON.stringify(error)}`,
        fileName: 'monday service',
        functionName: 'executeQuery',
      });
      return [error, null];
    }
  }
}
