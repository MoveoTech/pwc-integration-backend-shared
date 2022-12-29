"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCustomTemplate = exports.getRelatedItemsByTaskType = void 0;
const sync_integration_columns_1 = require("../constants/sync-integration-columns");
const sync_integration_values_1 = require("../constants/sync-integration-values");
const error_1 = require("../types/errors/error");
const utils_1 = require("./utils");
const monday_1 = require("./monday");
const getRelatedItemsByTaskType = (item, sameTypeItems, taskType) => {
    switch (taskType) {
        case sync_integration_values_1.SYNC_INTEGRATION_VALUES.FILING_TASK_TYPE:
            return filterItems(item, sameTypeItems, [
                sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_BUSINESS_STREAM_ID_COLUMN,
                sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_LEGAL_ENTITY_NAME_COLUMN,
                sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_LEGAL_ENTITY_COUNTRY_COLUMN,
                sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_TAX_REGISTRATION_COLUMN,
            ]);
        case sync_integration_values_1.SYNC_INTEGRATION_VALUES.DATA_TASK_TYPE:
            return filterItems(item, sameTypeItems, [sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TASK_BUSINESS_STREAM_ID_COLUMN]);
        default:
            return [new error_1.BadRequestError(), null];
    }
};
exports.getRelatedItemsByTaskType = getRelatedItemsByTaskType;
const filterItems = (item, sameTypeItems, columns) => {
    const relevantColumnsForFilter = item.columns.filter((column) => columns.includes(column.id)).sort();
    if (!relevantColumnsForFilter.length) {
        return [new error_1.InternalServerError(), null];
    }
    const relatedItems = sameTypeItems.reduce((result, sameTypeItem) => {
        const itemColumns = sameTypeItem.columns.filter((column) => columns.includes(column.id)).sort();
        if ((0, utils_1.arrayEquals)(relevantColumnsForFilter, itemColumns)) {
            result.push(sameTypeItem);
        }
        return result;
    }, []);
    if (!relatedItems.length) {
        return [new error_1.InternalServerError(), null];
    }
    return [null, relatedItems];
};
const isCustomTemplate = (item, taskType) => {
    switch (taskType) {
        case sync_integration_values_1.SYNC_INTEGRATION_VALUES.DATA_TASK_TYPE:
            return [null, false];
        case sync_integration_values_1.SYNC_INTEGRATION_VALUES.FILING_TASK_TYPE:
            const [sourceColumnError, sourceColumn] = (0, monday_1.getColumnTextByColumnId)(item, sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.OBLIGATION_SOURCE_COLUMN);
            if (sourceColumnError) {
                return [sourceColumnError, null];
            }
            switch (sourceColumn) {
                case sync_integration_values_1.SYNC_INTEGRATION_VALUES.TEMPLATE_OBLIGATION_SOURCE:
                    return [null, false];
                case sync_integration_values_1.SYNC_INTEGRATION_VALUES.CUSTOM_OBLIGATION_SOURCE:
                    return [null, true];
                default:
                    return [new error_1.BadRequestError(), null];
            }
        default:
            return [new error_1.InternalServerError(), null];
    }
};
exports.isCustomTemplate = isCustomTemplate;
//# sourceMappingURL=integration.js.map