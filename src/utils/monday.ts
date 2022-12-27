import { SYNC_INTEGRATION_COLUMNS } from '../constants/sync-integration-columns';
import { SYNC_INTEGRATION_VALUES } from '../constants/sync-integration-values';
import { MondayItemCreationColumns } from '../types/interfaces/monday-item-creation-columns';
import { MondayItemCreationColumnsTypes } from '../types/interfaces/monday-item-creation-columns-types';
import { InternalServerError } from '../types/errors/error';
import { ErrorResultTuple } from '../types/errors/error-result-tuple';
import { MondayColumn } from '../types/interfaces/monday-column';
import { MondayItem } from '../types/interfaces/monday-item';
import { TaskCreationParams } from '../types/interfaces/task-creation-params';

export const mapToItems = (items: any[]): MondayItem[] => {
  const mappedItems: MondayItem[] = items.map((item: any) => {
    return mapToItem(item);
  });
  return mappedItems;
};

export const mapToItem = (item: any): MondayItem => {
  const returnItem: MondayItem = {
    id: item.id,
    name: item.name,
    parentItemId: item.parent_item?.id,
    columns: mapColumnsValues(item.column_values),
  };
  return returnItem;
};

const mapColumnsValues = (columnsValues: any): MondayColumn[] => {
  const columns: MondayColumn[] = columnsValues.map((column: any): MondayColumn => {
    return {
      id: column.id,
      text: column.text,
    };
  });
  return columns;
};

export const getColumnTextByColumnId = (item: MondayItem, columnId: string): ErrorResultTuple<string> => {
  if (!item?.columns?.length) {
    return [new InternalServerError(), null];
  }
  const column = item.columns.filter((column: any) => column.id === columnId);
  if (!column?.length) {
    return [new InternalServerError(), null];
  }
  return [null, column[0].text];
};

export const getColumnValue = (item: MondayItem, columnId: string | null | undefined): string => {
  if (!columnId) {
    return '';
  }
  const [columnValueError, columnValue] = getColumnTextByColumnId(item, columnId);
  if (columnValueError) {
    return '';
  }
  return columnValue;
};

export const createItemColumns = (
  submissionsDates: {
    submissionsDueDate: string;
    taskDueDate: string;
  },
  parentItem: MondayItem,
  currentTask: MondayItem,
  taskType: string,
  taskId: number,
  returnId: number,
  isItemCustomTemplate: boolean,
  isNewTask = false
): ErrorResultTuple<MondayItemCreationColumns> => {
  const taskRoleValue: string = getColumnValue(currentTask, SYNC_INTEGRATION_COLUMNS.TASK_TEMPLATE_ROLE_COLUMN);
  const budgetedHoursValue: string = getColumnValue(
    currentTask,
    isItemCustomTemplate
      ? SYNC_INTEGRATION_COLUMNS.CUSTOM_FILING_TASK_BUDGETED_HOURS_COLUMN
      : SYNC_INTEGRATION_COLUMNS.TASK_TEMPLATE_BUDGETED_HOURS_COLUMN
  );
  const [itemCreationColumnsError, itemCreationColumns] = getItemCreationColumns(taskType);
  if (itemCreationColumnsError) {
    return [itemCreationColumnsError, null];
  }
  return [
    null,
    {
      [SYNC_INTEGRATION_COLUMNS.TASK_ADDED_BY_STATUS]: isNewTask ? SYNC_INTEGRATION_VALUES.ADDED_BY_INTEGRATION : '',
      [SYNC_INTEGRATION_COLUMNS.TASK_TYPE_COLUMN]: taskType,
      [SYNC_INTEGRATION_COLUMNS.TASK_CLIENT_NAME_COLUMN]: getColumnValue(
        parentItem,
        itemCreationColumns.clientNameColumn
      ),
      [SYNC_INTEGRATION_COLUMNS.TASK_CLIENT_ID_COLUMN]: getColumnValue(parentItem, itemCreationColumns.clientIdColumn),
      [SYNC_INTEGRATION_COLUMNS.TASK_BUSINESS_STREAM_NAME_COLUMN]:
        taskType === SYNC_INTEGRATION_VALUES.FILING_TASK_TYPE
          ? getColumnValue(parentItem, itemCreationColumns.businessStreamNameColumn)
          : taskType === SYNC_INTEGRATION_VALUES.DATA_TASK_TYPE
            ? parentItem.name
            : '',
      [SYNC_INTEGRATION_COLUMNS.TASK_BUSINESS_STREAM_ID_COLUMN]: getColumnValue(
        parentItem,
        itemCreationColumns.businessStreamIdColumn
      ),
      [SYNC_INTEGRATION_COLUMNS.TASK_LEGAL_ENTITY_NAME_COLUMN]: getColumnValue(
        parentItem,
        itemCreationColumns.legalEntityNameColumn
      ),
      [SYNC_INTEGRATION_COLUMNS.TASK_LEGAL_ENTITY_COUNTRY_COLUMN]: getColumnValue(
        parentItem,
        itemCreationColumns.legalEntityCountryColumn
      ),
      [SYNC_INTEGRATION_COLUMNS.TASK_OBLIGATION_DEFINITION_TYPE_TEXT_COLUMN]: getColumnValue(
        parentItem,
        itemCreationColumns.obligationDefinitionTypeTextColumn
      ),
      [SYNC_INTEGRATION_COLUMNS.TASK_OBLIGATION_DEFINITION_TYPE_ID_COLUMN]: getColumnValue(
        parentItem,
        itemCreationColumns.obligationDefinitionTypeIdColumn
      ),
      [SYNC_INTEGRATION_COLUMNS.TASK_TAX_REGISTRATION_COLUMN]: getColumnValue(
        parentItem,
        itemCreationColumns.taxRegistrationColumn
      ),
      [SYNC_INTEGRATION_COLUMNS.TASK_COMPLEXITY_COLUMN]: getColumnValue(
        parentItem,
        itemCreationColumns.complexityColumn
      ),
      [SYNC_INTEGRATION_COLUMNS.TASK_COMMENTS_COLUMN]: getColumnValue(parentItem, itemCreationColumns.commentsColumn),
      [SYNC_INTEGRATION_COLUMNS.TASK_SUBMISSION_DUE_DATE_COLUMN]: submissionsDates.submissionsDueDate,
      [SYNC_INTEGRATION_COLUMNS.TASK_DUE_DATE_COLUMN]: submissionsDates.taskDueDate,
      [SYNC_INTEGRATION_COLUMNS.TASK_TEXT_COLUMN]: isItemCustomTemplate
        ? getColumnValue(currentTask, SYNC_INTEGRATION_COLUMNS.CUSTOM_FILING_TASK_COLUMN)
        : currentTask.name,
      [SYNC_INTEGRATION_COLUMNS.TASK_ROLE_COLUMN]: taskRoleValue,
      [SYNC_INTEGRATION_COLUMNS.TASK_BUDGETED_HOURS_COLUMN]: budgetedHoursValue,
      [SYNC_INTEGRATION_COLUMNS.TASK_OBLIGATION_ID_COLUMN]:
        taskType === SYNC_INTEGRATION_VALUES.FILING_TASK_TYPE ? parentItem.id : '',
      [SYNC_INTEGRATION_COLUMNS.TASK_ID_COLUMN]: taskId.toString(),
      [SYNC_INTEGRATION_COLUMNS.TASK_RETURN_ID_COLUMN]: returnId.toString(),
    },
  ];
};

export const getItemCreationColumns = (taskType: string): ErrorResultTuple<MondayItemCreationColumnsTypes> => {
  let clientNameColumn: string;
  let clientIdColumn: string;
  let businessStreamNameColumn: string | undefined;
  let businessStreamIdColumn: string;
  let legalEntityNameColumn: string | undefined;
  let legalEntityCountryColumn: string | undefined;
  let obligationDefinitionTypeTextColumn: string | undefined;
  let obligationDefinitionTypeIdColumn: string | undefined;
  let taxRegistrationColumn: string | undefined;
  let complexityColumn: string;
  let commentsColumn: string | undefined;
  switch (taskType) {
    case SYNC_INTEGRATION_VALUES.DATA_TASK_TYPE:
      clientNameColumn = SYNC_INTEGRATION_COLUMNS.BUSINESS_STREAM_CLIENT_NAME_COLUMN;
      clientIdColumn = SYNC_INTEGRATION_COLUMNS.BUSINESS_STREAM_CLIENT_ID_COLUMN;
      businessStreamIdColumn = SYNC_INTEGRATION_COLUMNS.BUSINESS_STREAM_ID_COLUMN;
      complexityColumn = SYNC_INTEGRATION_COLUMNS.BUSINESS_STREAM_COMPLEXITY_COLUMN;
      commentsColumn = SYNC_INTEGRATION_COLUMNS.BUSINESS_STREAM_COMMENTS_COLUMN;
      break;
    case SYNC_INTEGRATION_VALUES.FILING_TASK_TYPE:
      clientNameColumn = SYNC_INTEGRATION_COLUMNS.OBLIGATION_CLIENT_NAME_COLUMN;
      clientIdColumn = SYNC_INTEGRATION_COLUMNS.OBLIGATION_CLIENT_ID_COLUMN;
      businessStreamNameColumn = SYNC_INTEGRATION_COLUMNS.OBLIGATION_BUSINESS_STREAM_NAME_COLUMN;
      businessStreamIdColumn = SYNC_INTEGRATION_COLUMNS.OBLIGATION_BUSINESS_STREAM_ID_COLUMN;
      legalEntityNameColumn = SYNC_INTEGRATION_COLUMNS.OBLIGATION_LEGAL_ENTITY_NAME_COLUMN;
      legalEntityCountryColumn = SYNC_INTEGRATION_COLUMNS.OBLIGATION_LEGAL_ENTITY_COUNTRY_COLUMN;
      obligationDefinitionTypeTextColumn = SYNC_INTEGRATION_COLUMNS.OBLIGATION_DEFINITION_TYPE_TEXT_COLUMN;
      obligationDefinitionTypeIdColumn = SYNC_INTEGRATION_COLUMNS.OBLIGATION_DEFINITION_TYPE_ID_COLUMN;
      taxRegistrationColumn = SYNC_INTEGRATION_COLUMNS.OBLIGATION_TAX_REGISTRATION_COLUMN;
      complexityColumn = SYNC_INTEGRATION_COLUMNS.OBLIGATION_COMPLEXITY_COLUMN;
      break;
    default:
      return [new InternalServerError(), null];
  }
  return [
    null,
    {
      clientNameColumn,
      clientIdColumn,
      businessStreamNameColumn,
      businessStreamIdColumn,
      legalEntityNameColumn,
      legalEntityCountryColumn,
      obligationDefinitionTypeTextColumn,
      obligationDefinitionTypeIdColumn,
      taxRegistrationColumn,
      complexityColumn,
      commentsColumn,
    },
  ];
};

export const filterItemsByColumnValue = (
  items: MondayItem[],
  columnId: string,
  columnValue: string
): ErrorResultTuple<MondayItem[]> => {
  const relatedItems = items.reduce((result: MondayItem[], item: MondayItem) => {
    const isColumnValue = item.columns.some((column: MondayColumn) => column.id === columnId && column.text === columnValue);
    if (isColumnValue) {
      result.push(item);
    }
    return result;
  }, []);
  if (!relatedItems.length) {
    return [new InternalServerError(), null];
  }
  return [null, relatedItems];
}

export const getTaskCreationParams = (item: MondayItem): ErrorResultTuple<TaskCreationParams> => {
  const [taskIdError, taskId] = getColumnTextByColumnId(item, SYNC_INTEGRATION_COLUMNS.TASK_ID_COLUMN);
  if (taskIdError) {
    return [taskIdError, null];
  }
  const [returnIdError, returnId] = getColumnTextByColumnId(item, SYNC_INTEGRATION_COLUMNS.TASK_RETURN_ID_COLUMN);
  if (returnIdError) {
    return [returnIdError, null];
  }
  const [submissionDueDateTextError, submissionDueDateText] = getColumnTextByColumnId(
    item,
    SYNC_INTEGRATION_COLUMNS.TASK_SUBMISSION_DUE_DATE_COLUMN
  );
  if (submissionDueDateTextError) {
    return [submissionDueDateTextError, null];
  }
  const submissionDueDate = new Date(submissionDueDateText);
  return [null, { taskId: parseInt(taskId), returnId: parseInt(returnId), submissionDueDate }];
};

export const getItemFromListById = (itemId: number, itemList: MondayItem[]): ErrorResultTuple<MondayItem> => {
  const item = itemList.filter((item: MondayItem) => item.id === itemId.toString());
  if (!item?.length) {
    return [new InternalServerError(), null];
  }
  return [null, item[0]];
};
