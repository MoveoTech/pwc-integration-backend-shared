"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReturnOrderColumn = exports.buildSubmissionDates = void 0;
const sync_integration_columns_1 = require("../constants/sync-integration-columns");
const sync_integration_values_1 = require("../constants/sync-integration-values");
const error_1 = require("../types/errors/error");
const monday_1 = require("./monday");
const months_1 = require("../constants/months");
const days_1 = require("../constants/days");
const buildSubmissionDates = (taskCreationParams, currentTask, taskType, currentReturnItem, nextReturnItem, dateTemplate, isItemCustomTemplate, skipNum) => {
    const [dateTemplateColumnsValuesError, dateTemplateColumnsValues] = getDateTemplateColumnsValues(taskType, nextReturnItem.nextReturnItem, dateTemplate, isItemCustomTemplate);
    if (dateTemplateColumnsValuesError) {
        return [dateTemplateColumnsValuesError, null];
    }
    const [currentReturnColumnValuesError, currentReturnColumnValues] = getReturnItemColumnValues(taskType, currentReturnItem, isItemCustomTemplate);
    if (currentReturnColumnValuesError) {
        return [currentReturnColumnValuesError, null];
    }
    const [relativeYearError, relativeYear] = calculateSubmissionRelativeYear(nextReturnItem, taskCreationParams, currentReturnColumnValues, dateTemplateColumnsValues, skipNum);
    if (relativeYearError) {
        return [new error_1.InternalServerError(), null];
    }
    const [submissionsDueDateError, submissionsDueDate] = calculateSubmissionsDueDate(dateTemplateColumnsValues, relativeYear);
    if (submissionsDueDateError) {
        return [submissionsDueDateError, null];
    }
    const [currentTaskDueDateColumnValueError, currentTaskDueDateColumnValue] = getCurrentTaskDueDateColumnValue(currentTask, taskType, isItemCustomTemplate);
    if (currentTaskDueDateColumnValueError) {
        return [currentTaskDueDateColumnValueError, null];
    }
    const [taskDueDateError, taskDueDate] = calculateTaskDueDate(submissionsDueDate, currentTaskDueDateColumnValue);
    if (taskDueDateError) {
        return [taskDueDateError, null];
    }
    return [null, { submissionsDueDate, taskDueDate }];
};
exports.buildSubmissionDates = buildSubmissionDates;
const calculateSubmissionRelativeYear = (nextReturnItem, taskCreationParams, currentReturnColumnValues, dateTemplateColumnsValues, skipNum) => {
    let currentSubmissionDueDate = new Date(taskCreationParams.submissionDueDate);
    const currentReturnMonth = months_1.MONTHS[currentReturnColumnValues.monthColumnValue.toUpperCase()];
    const nextReturnMonth = months_1.MONTHS[dateTemplateColumnsValues.monthColumnValue.toUpperCase()];
    const currentSubmissionMonth = currentSubmissionDueDate.getMonth();
    switch (true) {
        case nextReturnItem.isSingle:
            currentSubmissionDueDate.setFullYear(taskCreationParams.submissionDueDate.getFullYear() + skipNum + 1);
            break;
        case nextReturnItem.nextReturnItem.id === taskCreationParams.returnId.toString():
            currentSubmissionDueDate.setFullYear(taskCreationParams.submissionDueDate.getFullYear() + skipNum);
            break;
        case dateTemplateColumnsValues.monthColumnValue === currentReturnColumnValues.monthColumnValue:
            if (+dateTemplateColumnsValues.dayColumnValue < +currentReturnColumnValues.dayColumnValue) {
                currentSubmissionDueDate.setFullYear(taskCreationParams.submissionDueDate.getFullYear() + 1);
            }
            break;
        case nextReturnMonth < currentSubmissionDueDate.getMonth():
            currentSubmissionDueDate.setFullYear(currentSubmissionDueDate.getFullYear() + 1);
            break;
        default:
            break;
    }
    if (currentReturnMonth === 11 && currentSubmissionMonth === 0) {
        currentSubmissionDueDate.setFullYear(currentSubmissionDueDate.getFullYear() - 1);
    }
    else if (currentReturnMonth === 0 && currentSubmissionMonth === 11) {
        currentSubmissionDueDate.setFullYear(currentSubmissionDueDate.getFullYear() + 1);
    }
    return [null, currentSubmissionDueDate.getFullYear()];
};
const getDateTemplateColumnsValues = (taskType, returnItem, dateTemplate, isItemCustomTemplate) => {
    // get all relevant columns keys (by taskType) - day, month, dayType, weekendBegins, weekendRoll
    let dayColumn;
    let monthColumn;
    let dayTypeColumn;
    let weekendBeginsColumn;
    let weekendRollColumn;
    switch (taskType) {
        case sync_integration_values_1.SYNC_INTEGRATION_VALUES.DATA_TASK_TYPE:
            dayColumn = sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.DATA_DATE_TEMPLATE_DAY_COLUMN;
            monthColumn = sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.DATA_DATE_TEMPLATE_MONTH_COLUMN;
            dayTypeColumn = sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.DATA_DATE_TEMPLATE_DAY_TYPE_COLUMN;
            weekendBeginsColumn = sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.DATA_DATE_TEMPLATE_WEEKEND_BEGINS_COLUMN;
            weekendRollColumn = sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.DATA_DATE_TEMPLATE_WEEKEND_ROLL_COLUMN;
            break;
        case sync_integration_values_1.SYNC_INTEGRATION_VALUES.FILING_TASK_TYPE:
            dayColumn = isItemCustomTemplate
                ? sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.CUSTOM_FILING_DATE_TEMPLATE_DAY_COLUMN
                : sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.FILING_DATE_TEMPLATE_DAY_COLUMN;
            monthColumn = isItemCustomTemplate
                ? sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.CUSTOM_FILING_DATE_TEMPLATE_MONTH_COLUMN
                : sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.FILING_DATE_TEMPLATE_MONTH_COLUMN;
            dayTypeColumn = sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.FILING_DATE_TEMPLATE_DAY_TYPE_COLUMN;
            weekendBeginsColumn = sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.FILING_DATE_TEMPLATE_WEEKEND_BEGINS_COLUMN;
            weekendRollColumn = sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.FILING_DATE_TEMPLATE_WEEKEND_ROLL_COLUMN;
            break;
        default:
            return [new error_1.InternalServerError(), null];
    }
    // get all columns values from dateTemplate
    const [dayColumnValueError, dayColumnValue] = (0, monday_1.getColumnTextByColumnId)(returnItem, dayColumn);
    if (dayColumnValueError) {
        return [dayColumnValueError, null];
    }
    const [monthColumnValueError, monthColumnValue] = (0, monday_1.getColumnTextByColumnId)(returnItem, monthColumn);
    if (monthColumnValueError) {
        return [monthColumnValueError, null];
    }
    const [dayTypeColumnValueError, dayTypeColumnValue] = (0, monday_1.getColumnTextByColumnId)(dateTemplate, dayTypeColumn);
    if (dayTypeColumnValueError) {
        return [dayTypeColumnValueError, null];
    }
    const [weekendBeginsColumnValueError, weekendBeginsColumnValue] = (0, monday_1.getColumnTextByColumnId)(dateTemplate, weekendBeginsColumn);
    if (weekendBeginsColumnValueError) {
        return [weekendBeginsColumnValueError, null];
    }
    const [weekendRollColumnValueError, weekendRollColumnValue] = (0, monday_1.getColumnTextByColumnId)(dateTemplate, weekendRollColumn);
    if (weekendRollColumnValueError) {
        return [weekendRollColumnValueError, null];
    }
    return [
        null,
        {
            dayColumnValue,
            monthColumnValue,
            dayTypeColumnValue,
            weekendBeginsColumnValue,
            weekendRollColumnValue,
        },
    ];
};
const getReturnItemColumnValues = (taskType, returnItem, isItemCustomTemplate) => {
    let dayColumn;
    let monthColumn;
    switch (taskType) {
        case sync_integration_values_1.SYNC_INTEGRATION_VALUES.DATA_TASK_TYPE:
            dayColumn = sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.DATA_DATE_TEMPLATE_DAY_COLUMN;
            monthColumn = sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.DATA_DATE_TEMPLATE_MONTH_COLUMN;
            break;
        case sync_integration_values_1.SYNC_INTEGRATION_VALUES.FILING_TASK_TYPE:
            dayColumn = isItemCustomTemplate
                ? sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.CUSTOM_FILING_DATE_TEMPLATE_DAY_COLUMN
                : sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.FILING_DATE_TEMPLATE_DAY_COLUMN;
            monthColumn = isItemCustomTemplate
                ? sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.CUSTOM_FILING_DATE_TEMPLATE_MONTH_COLUMN
                : sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.FILING_DATE_TEMPLATE_MONTH_COLUMN;
            break;
        default:
            return [new error_1.InternalServerError(), null];
    }
    const [dayColumnValueError, dayColumnValue] = (0, monday_1.getColumnTextByColumnId)(returnItem, dayColumn);
    if (dayColumnValueError) {
        return [dayColumnValueError, null];
    }
    const [monthColumnValueError, monthColumnValue] = (0, monday_1.getColumnTextByColumnId)(returnItem, monthColumn);
    if (monthColumnValueError) {
        return [monthColumnValueError, null];
    }
    return [
        null,
        {
            dayColumnValue,
            monthColumnValue,
        },
    ];
};
const calculateSubmissionsDueDate = (dateTemplateColumnsValues, relativeYear) => {
    switch (dateTemplateColumnsValues.dayTypeColumnValue) {
        case sync_integration_values_1.SYNC_INTEGRATION_VALUES.WORK_DAY:
            return [
                null,
                getDateByWorkDay(relativeYear, parseInt(dateTemplateColumnsValues.dayColumnValue), dateTemplateColumnsValues.monthColumnValue, dateTemplateColumnsValues.weekendBeginsColumnValue),
            ];
        case sync_integration_values_1.SYNC_INTEGRATION_VALUES.CALENDAR_DAY:
            return [
                null,
                getDateByCalendarDate(relativeYear, parseInt(dateTemplateColumnsValues.dayColumnValue), dateTemplateColumnsValues.monthColumnValue, dateTemplateColumnsValues.weekendBeginsColumnValue, dateTemplateColumnsValues.weekendRollColumnValue),
            ];
        default:
            return [new error_1.InternalServerError(), null];
    }
};
const getDateByWorkDay = (relativeYear, day, month, weekendBegins) => {
    const date = addWorkDays(new Date(relativeYear, months_1.MONTHS[month.toUpperCase()]), day, weekendBegins);
    return formatDate(date);
};
const getDateByCalendarDate = (relativeYear, day, month, weekendBegins, weekendRoll) => {
    let date = new Date(relativeYear, months_1.MONTHS[month.toUpperCase()], day);
    if (date.getDay() === days_1.DAYS.FRIDAY || date.getDay() === days_1.DAYS.SATURDAY || date.getDay() === days_1.DAYS.SUNDAY) {
        date = addOrRemoveDays(date, weekendBegins, weekendRoll);
    }
    return formatDate(date);
};
const getCurrentTaskDueDateColumnValue = (currentTask, taskType, isItemCustomTemplate) => {
    let columnId;
    switch (taskType) {
        case sync_integration_values_1.SYNC_INTEGRATION_VALUES.DATA_TASK_TYPE:
            columnId = sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.DATA_TASK_DUE_DATE_COLUMN;
            break;
        case sync_integration_values_1.SYNC_INTEGRATION_VALUES.FILING_TASK_TYPE:
            columnId = isItemCustomTemplate
                ? sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.CUSTOM_FILING_TASK_DUE_DATE_COLUMN
                : sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.FILING_TASK_DUE_DATE_COLUMN;
            break;
        default:
            return [new error_1.InternalServerError(), null];
    }
    const [columnValueError, columnValue] = (0, monday_1.getColumnTextByColumnId)(currentTask, columnId);
    if (columnValueError) {
        return [columnValueError, null];
    }
    return [null, parseInt(columnValue)];
};
const calculateTaskDueDate = (date, workDays) => {
    const x = new Date(date);
    let endDate = new Date(x);
    let count = 0;
    while (count < -1 * workDays) {
        endDate = new Date(x.setDate(x.getDate() - 1));
        if (endDate.getDay() != days_1.DAYS.SATURDAY && endDate.getDay() != days_1.DAYS.SUNDAY) {
            count++;
        }
    }
    return [null, formatDate(endDate)];
};
const addWorkDays = (date, workDays, weekendBegins) => {
    const x = new Date(date);
    let endDate = new Date(x.setDate(x.getDate() - 1));
    let count = 0;
    while (count < workDays) {
        endDate = new Date(x.setDate(x.getDate() + 1));
        if (weekendBegins === sync_integration_values_1.SYNC_INTEGRATION_VALUES.WEEKEND_BEGINS_FRIDAY) {
            if (endDate.getDay() !== days_1.DAYS.FRIDAY && endDate.getDay() !== days_1.DAYS.SATURDAY) {
                count++;
            }
        }
        else if (weekendBegins === sync_integration_values_1.SYNC_INTEGRATION_VALUES.WEEKEND_BEGINS_SATURDAY) {
            if (endDate.getDay() !== days_1.DAYS.SATURDAY && endDate.getDay() !== days_1.DAYS.SUNDAY) {
                count++;
            }
        }
    }
    return endDate;
};
const addOrRemoveDays = (date, weekendBegins, weekendRoll) => {
    const d = new Date(date);
    if (weekendBegins === sync_integration_values_1.SYNC_INTEGRATION_VALUES.WEEKEND_BEGINS_SATURDAY) {
        if (weekendRoll === sync_integration_values_1.SYNC_INTEGRATION_VALUES.WEEKEND_ROLL_FORWARD) {
            switch (d.getDay()) {
                case days_1.DAYS.SUNDAY:
                    d.setDate(d.getDate() + 1);
                    break;
                case days_1.DAYS.SATURDAY:
                    d.setDate(d.getDate() + 2);
                    break;
            }
        }
        else if (weekendRoll === sync_integration_values_1.SYNC_INTEGRATION_VALUES.WEEKEND_ROLL_BACKWARD) {
            switch (d.getDay()) {
                case days_1.DAYS.SUNDAY:
                    d.setDate(d.getDate() - 2);
                    break;
                case days_1.DAYS.SATURDAY:
                    d.setDate(d.getDate() - 1);
                    break;
            }
        }
    }
    else if (weekendBegins === sync_integration_values_1.SYNC_INTEGRATION_VALUES.WEEKEND_BEGINS_FRIDAY) {
        if (weekendRoll === sync_integration_values_1.SYNC_INTEGRATION_VALUES.WEEKEND_ROLL_FORWARD) {
            switch (d.getDay()) {
                case days_1.DAYS.SATURDAY:
                    d.setDate(d.getDate() + 1);
                    break;
                case days_1.DAYS.FRIDAY:
                    d.setDate(d.getDate() + 2);
                    break;
            }
        }
        else if (weekendRoll === sync_integration_values_1.SYNC_INTEGRATION_VALUES.WEEKEND_ROLL_BACKWARD) {
            switch (d.getDay()) {
                case days_1.DAYS.SATURDAY:
                    d.setDate(d.getDate() - 2);
                    break;
                case days_1.DAYS.FRIDAY:
                    d.setDate(d.getDate() - 1);
                    break;
            }
        }
    }
    return new Date(d);
};
const formatDate = (date) => {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2)
        month = '0' + month;
    if (day.length < 2)
        day = '0' + day;
    return [year, month, day].join('-');
};
const getReturnOrderColumn = (taskType, isItemCustomTemplate) => {
    switch (taskType) {
        case sync_integration_values_1.SYNC_INTEGRATION_VALUES.DATA_TASK_TYPE:
            return [null, sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.DATA_TASK_RETURN_ORDER_COLUMN];
        case sync_integration_values_1.SYNC_INTEGRATION_VALUES.FILING_TASK_TYPE:
            if (!isItemCustomTemplate) {
                return [null, sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.TEMPLATE_FILING_TASK_RETURN_ORDER_COLUMN];
            }
            return [null, sync_integration_columns_1.SYNC_INTEGRATION_COLUMNS.CUSTOM_FILING_TASK_RETURN_ORDER_COLUMN];
        default:
            return [new error_1.InternalServerError(), null];
    }
};
exports.getReturnOrderColumn = getReturnOrderColumn;
//# sourceMappingURL=dates.js.map