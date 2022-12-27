"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getItemFromListById = exports.getTaskCreationParams = exports.filterItemsByColumnValue = exports.getItemCreationColumns = exports.createItemColumns = exports.getColumnValue = exports.getColumnTextByColumnId = exports.mapToItem = exports.mapToItems = void 0;
const sync_integration_columns_1 = require("../constants/sync-integration-columns");
const sync_integration_values_1 = require("../constants/sync-integration-values");
const error_1 = require("../types/errors/error");
const mapToItems = (items) => {
    const mappedItems = items.map((item) => {
        return (0, exports.mapToItem)(item);
    });
    return mappedItems;
};
exports.mapToItems = mapToItems;
const mapToItem = (item) => {
    var _a;
    const returnItem = {
        id: item.id,
        name: item.name,
        parentItemId: (_a = item.parent_item) === null || _a === void 0 ? void 0 : _a.id,
        columns: mapColumnsValues(item.column_values),
    };
    return returnItem;
};
exports.mapToItem = mapToItem;
const mapColumnsValues = (columnsValues) => {
    const columns = columnsValues.map((column) => {
        return {
            id: column.id,
            text: column.text,
        };
    });
    return columns;
};
const getColumnTextByColumnId = (item, columnId) => {
    var _a;
    if (!((_a = item === null || item === void 0 ? void 0 : item.columns) === null || _a === void 0 ? void 0 : _a.length)) {
        return [new error_1.InternalServerError(), null];
    }
    const column = item.columns.filter((column) => column.id === columnId);
    if (!(column === null || column === void 0 ? void 0 : column.length)) {
        return [new error_1.InternalServerError(), null];
    }
    return [null, column[0].text];
};
exports.getColumnTextByColumnId = getColumnTextByColumnId;
const getColumnValue = (item, columnId) => {
    if (!columnId) {
        return '';
    }
    const [columnValueError, columnValue] = (0, exports.getColumnTextByColumnId)(item, columnId);
    if (columnValueError) {
        return '';
    }
    return columnValue;
};
exports.getColumnValue = getColumnValue;
const createItemColumns = (submissionsDates, parentItem, currentTask, taskType, taskId, returnId, isItemCustomTemplate, isNewTask = false) => {
    const taskRoleValue = (0, exports.getColumnValue)(currentTask, sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_TEMPLATE_ROLE_COLUMN);
    const budgetedHoursValue = (0, exports.getColumnValue)(currentTask, isItemCustomTemplate
        ? sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.CUSTOM_FILING_TASK_BUDGETED_HOURS_COLUMN
        : sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_TEMPLATE_BUDGETED_HOURS_COLUMN);
    const [itemCreationColumnsError, itemCreationColumns] = (0, exports.getItemCreationColumns)(taskType);
    if (itemCreationColumnsError) {
        return [itemCreationColumnsError, null];
    }
    return [
        null,
        {
            [sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_ADDED_BY_STATUS]: isNewTask ? sync_integration_values_1.SYNC_INTEGRATION_VALUES.ADDED_BY_INTEGRATION : '',
            [sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_TYPE_COLUMN]: taskType,
            [sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_CLIENT_NAME_COLUMN]: (0, exports.getColumnValue)(parentItem, itemCreationColumns.clientNameColumn),
            [sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_CLIENT_ID_COLUMN]: (0, exports.getColumnValue)(parentItem, itemCreationColumns.clientIdColumn),
            [sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_BUSINESS_STREAM_NAME_COLUMN]: taskType === sync_integration_values_1.SYNC_INTEGRATION_VALUES.FILING_TASK_TYPE
                ? (0, exports.getColumnValue)(parentItem, itemCreationColumns.businessStreamNameColumn)
                : taskType === sync_integration_values_1.SYNC_INTEGRATION_VALUES.DATA_TASK_TYPE
                    ? parentItem.name
                    : '',
            [sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_BUSINESS_STREAM_ID_COLUMN]: (0, exports.getColumnValue)(parentItem, itemCreationColumns.businessStreamIdColumn),
            [sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_LEGAL_ENTITY_NAME_COLUMN]: (0, exports.getColumnValue)(parentItem, itemCreationColumns.legalEntityNameColumn),
            [sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_LEGAL_ENTITY_COUNTRY_COLUMN]: (0, exports.getColumnValue)(parentItem, itemCreationColumns.legalEntityCountryColumn),
            [sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_OBLIGATION_DEFINITION_TYPE_TEXT_COLUMN]: (0, exports.getColumnValue)(parentItem, itemCreationColumns.obligationDefinitionTypeTextColumn),
            [sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_OBLIGATION_DEFINITION_TYPE_ID_COLUMN]: (0, exports.getColumnValue)(parentItem, itemCreationColumns.obligationDefinitionTypeIdColumn),
            [sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_TAX_REGISTRATION_COLUMN]: (0, exports.getColumnValue)(parentItem, itemCreationColumns.taxRegistrationColumn),
            [sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_COMPLEXITY_COLUMN]: (0, exports.getColumnValue)(parentItem, itemCreationColumns.complexityColumn),
            [sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_COMMENTS_COLUMN]: (0, exports.getColumnValue)(parentItem, itemCreationColumns.commentsColumn),
            [sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_SUBMISSION_DUE_DATE_COLUMN]: submissionsDates.submissionsDueDate,
            [sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_DUE_DATE_COLUMN]: submissionsDates.taskDueDate,
            [sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_TEXT_COLUMN]: isItemCustomTemplate
                ? (0, exports.getColumnValue)(currentTask, sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.CUSTOM_FILING_TASK_COLUMN)
                : currentTask.name,
            [sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_ROLE_COLUMN]: taskRoleValue,
            [sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_BUDGETED_HOURS_COLUMN]: budgetedHoursValue,
            [sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_OBLIGATION_ID_COLUMN]: taskType === sync_integration_values_1.SYNC_INTEGRATION_VALUES.FILING_TASK_TYPE ? parentItem.id : '',
            [sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_ID_COLUMN]: taskId.toString(),
            [sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_RETURN_ID_COLUMN]: returnId.toString(),
        },
    ];
};
exports.createItemColumns = createItemColumns;
const getItemCreationColumns = (taskType) => {
    let clientNameColumn;
    let clientIdColumn;
    let businessStreamNameColumn;
    let businessStreamIdColumn;
    let legalEntityNameColumn;
    let legalEntityCountryColumn;
    let obligationDefinitionTypeTextColumn;
    let obligationDefinitionTypeIdColumn;
    let taxRegistrationColumn;
    let complexityColumn;
    let commentsColumn;
    switch (taskType) {
        case sync_integration_values_1.SYNC_INTEGRATION_VALUES.DATA_TASK_TYPE:
            clientNameColumn = sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.BUSINESS_STREAM_CLIENT_NAME_COLUMN;
            clientIdColumn = sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.BUSINESS_STREAM_CLIENT_ID_COLUMN;
            businessStreamIdColumn = sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.BUSINESS_STREAM_ID_COLUMN;
            complexityColumn = sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.BUSINESS_STREAM_COMPLEXITY_COLUMN;
            commentsColumn = sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.BUSINESS_STREAM_COMMENTS_COLUMN;
            break;
        case sync_integration_values_1.SYNC_INTEGRATION_VALUES.FILING_TASK_TYPE:
            clientNameColumn = sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.OBLIGATION_CLIENT_NAME_COLUMN;
            clientIdColumn = sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.OBLIGATION_CLIENT_ID_COLUMN;
            businessStreamNameColumn = sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.OBLIGATION_BUSINESS_STREAM_NAME_COLUMN;
            businessStreamIdColumn = sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.OBLIGATION_BUSINESS_STREAM_ID_COLUMN;
            legalEntityNameColumn = sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.OBLIGATION_LEGAL_ENTITY_NAME_COLUMN;
            legalEntityCountryColumn = sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.OBLIGATION_LEGAL_ENTITY_COUNTRY_COLUMN;
            obligationDefinitionTypeTextColumn = sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.OBLIGATION_DEFINITION_TYPE_TEXT_COLUMN;
            obligationDefinitionTypeIdColumn = sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.OBLIGATION_DEFINITION_TYPE_ID_COLUMN;
            taxRegistrationColumn = sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.OBLIGATION_TAX_REGISTRATION_COLUMN;
            complexityColumn = sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.OBLIGATION_COMPLEXITY_COLUMN;
            break;
        default:
            return [new error_1.InternalServerError(), null];
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
exports.getItemCreationColumns = getItemCreationColumns;
const filterItemsByColumnValue = (items, columnId, columnValue) => {
    const relatedItems = items.reduce((result, item) => {
        const isColumnValue = item.columns.some((column) => column.id === columnId && column.text === columnValue);
        if (isColumnValue) {
            result.push(item);
        }
        return result;
    }, []);
    if (!relatedItems.length) {
        return [new error_1.InternalServerError(), null];
    }
    return [null, relatedItems];
};
exports.filterItemsByColumnValue = filterItemsByColumnValue;
const getTaskCreationParams = (item) => {
    const [taskIdError, taskId] = (0, exports.getColumnTextByColumnId)(item, sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_ID_COLUMN);
    if (taskIdError) {
        return [taskIdError, null];
    }
    const [returnIdError, returnId] = (0, exports.getColumnTextByColumnId)(item, sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_RETURN_ID_COLUMN);
    if (returnIdError) {
        return [returnIdError, null];
    }
    const [submissionDueDateTextError, submissionDueDateText] = (0, exports.getColumnTextByColumnId)(item, sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_SUBMISSION_DUE_DATE_COLUMN);
    if (submissionDueDateTextError) {
        return [submissionDueDateTextError, null];
    }
    const submissionDueDate = new Date(submissionDueDateText);
    return [null, { taskId: parseInt(taskId), returnId: parseInt(returnId), submissionDueDate }];
};
exports.getTaskCreationParams = getTaskCreationParams;
const getItemFromListById = (itemId, itemList) => {
    const item = itemList.filter((item) => item.id === itemId.toString());
    if (!(item === null || item === void 0 ? void 0 : item.length)) {
        return [new error_1.InternalServerError(), null];
    }
    return [null, item[0]];
};
exports.getItemFromListById = getItemFromListById;
//# sourceMappingURL=monday.js.map