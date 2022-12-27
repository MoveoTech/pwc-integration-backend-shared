import { MondayColumn } from '../types/interfaces/monday-column';
import { MondayItem } from '../types/interfaces/monday-item';
import { SYNC_INTEGRATION_COLUMNS } from '../constants/sync-integration-columns';
import { SYNC_INTEGRATION_VALUES } from '../constants/sync-integration-values';
import { BadRequestError, InternalServerError } from '../types/errors/error';
import { arrayEquals } from './utils';
import { ErrorResultTuple } from '../types/errors/error-result-tuple';
import { getColumnTextByColumnId } from './monday';

export const getRelatedItemsByTaskType = (
  item: MondayItem,
  sameTypeItems: MondayItem[],
  taskType: string
): ErrorResultTuple<MondayItem[]> => {
  switch (taskType) {
    case SYNC_INTEGRATION_VALUES.FILING_TASK_TYPE:
      return filterItems(item, sameTypeItems, [
        SYNC_INTEGRATION_COLUMNS.TASK_BUSINESS_STREAM_ID_COLUMN,
        SYNC_INTEGRATION_COLUMNS.TASK_LEGAL_ENTITY_NAME_COLUMN,
        SYNC_INTEGRATION_COLUMNS.TASK_LEGAL_ENTITY_COUNTRY_COLUMN,
        SYNC_INTEGRATION_COLUMNS.TASK_TAX_REGISTRATION_COLUMN,
      ]);
    case SYNC_INTEGRATION_VALUES.DATA_TASK_TYPE:
      return filterItems(item, sameTypeItems, [SYNC_INTEGRATION_COLUMNS.TASK_BUSINESS_STREAM_ID_COLUMN]);
    default:
      return [new BadRequestError(), null];
  }
};

const filterItems = (
  item: MondayItem,
  sameTypeItems: MondayItem[],
  columns: string[]
): ErrorResultTuple<MondayItem[]> => {
  const relevantColumnsForFilter = item.columns.filter((column: MondayColumn) => columns.includes(column.id)).sort();
  if (!relevantColumnsForFilter.length) {
    return [new InternalServerError(), null];
  }
  const relatedItems = sameTypeItems.reduce((result: MondayItem[], sameTypeItem: MondayItem) => {
    const itemColumns = sameTypeItem.columns.filter((column: MondayColumn) => columns.includes(column.id)).sort();
    if (arrayEquals(relevantColumnsForFilter, itemColumns)) {
      result.push(sameTypeItem);
    }
    return result;
  }, []);
  if (!relatedItems.length) {
    return [new InternalServerError(), null];
  }
  return [null, relatedItems];
};

export const isCustomTemplate = (item: MondayItem, taskType: string): ErrorResultTuple<boolean> => {
  switch (taskType) {
    case SYNC_INTEGRATION_VALUES.DATA_TASK_TYPE:
      return [null, false];
    case SYNC_INTEGRATION_VALUES.FILING_TASK_TYPE:
      const [sourceColumnError, sourceColumn] = getColumnTextByColumnId(
        item,
        SYNC_INTEGRATION_COLUMNS.OBLIGATION_SOURCE_COLUMN
      );
      if (sourceColumnError) {
        return [sourceColumnError, null];
      }
      switch (sourceColumn) {
        case SYNC_INTEGRATION_VALUES.TEMPLATE_OBLIGATION_SOURCE:
          return [null, false];
        case SYNC_INTEGRATION_VALUES.CUSTOM_OBLIGATION_SOURCE:
          return [null, true];
        default:
          return [new BadRequestError(), null];
      }
    default:
      return [new InternalServerError(), null];
  }
};
