import { SYNC_INTEGRATION_COLUMNS } from "../constants/sync-integration-columns";
import { SYNC_INTEGRATION_VALUES } from "../constants/sync-integration-values";
import { InternalServerError } from "../types/errors/error";
import { DateTemplateColumnsValues } from "../types/interfaces/date-template-columns";
import { ErrorResultTuple } from "../types/errors/error-result-tuple";
import { MondayItem } from "../types/interfaces/monday-item";
import { getColumnTextByColumnId } from "./monday";
import { MONTHS } from "../constants/months";
import { DAYS } from "../constants/days";
import { TaskCreationParams } from "../types/interfaces/task-creation-params";
import { ReturnItemColumnsValues } from "../types/interfaces/return-item-columns";

export const buildSubmissionDates = (
  taskCreationParams: TaskCreationParams,
  currentTask: MondayItem,
  taskType: string,
  currentReturnItem: MondayItem,
  nextReturnItem: { nextReturnItem: MondayItem, isSingle: boolean },
  dateTemplate: MondayItem,
  isItemCustomTemplate: boolean,
  skipNum: number
): ErrorResultTuple<{ submissionsDueDate: string; taskDueDate: string }> => {
  const [dateTemplateColumnsValuesError, dateTemplateColumnsValues] = getDateTemplateColumnsValues(
    taskType,
    nextReturnItem.nextReturnItem,
    dateTemplate,
    isItemCustomTemplate
  );
  if (dateTemplateColumnsValuesError) {
    return [dateTemplateColumnsValuesError, null];
  }
  const [currentReturnColumnValuesError, currentReturnColumnValues] = getReturnItemColumnValues(
    taskType,
    currentReturnItem,
    isItemCustomTemplate
  )
  if (currentReturnColumnValuesError) {
    return [currentReturnColumnValuesError, null];
  }

  const [relativeYearError, relativeYear] = calculateSubmissionRelativeYear(
    nextReturnItem,
    taskCreationParams,
    currentReturnColumnValues,
    dateTemplateColumnsValues,
    skipNum
  )
  if (relativeYearError) {
    return [new InternalServerError(), null];
  }

  const [submissionsDueDateError, submissionsDueDate] = calculateSubmissionsDueDate(
    dateTemplateColumnsValues,
    relativeYear,
  );
  if (submissionsDueDateError) {
    return [submissionsDueDateError, null];
  }
  const [currentTaskDueDateColumnValueError, currentTaskDueDateColumnValue] = getCurrentTaskDueDateColumnValue(
    currentTask,
    taskType,
    isItemCustomTemplate
  );
  if (currentTaskDueDateColumnValueError) {
    return [currentTaskDueDateColumnValueError, null];
  }
  const [taskDueDateError, taskDueDate] = calculateTaskDueDate(submissionsDueDate, currentTaskDueDateColumnValue);
  if (taskDueDateError) {
    return [taskDueDateError, null];
  }
  return [null, { submissionsDueDate, taskDueDate }];
};

const calculateSubmissionRelativeYear = (
  nextReturnItem: { nextReturnItem: MondayItem, isSingle: boolean },
  taskCreationParams: TaskCreationParams,
  currentReturnColumnValues: ReturnItemColumnsValues,
  dateTemplateColumnsValues: DateTemplateColumnsValues,
  skipNum: number
): ErrorResultTuple<number> => {
  let currentSubmissionDueDate = new Date(taskCreationParams.submissionDueDate);
  const currentReturnMonth: number = MONTHS[currentReturnColumnValues.monthColumnValue.toUpperCase()]
  const nextReturnMonth: number = MONTHS[dateTemplateColumnsValues.monthColumnValue.toUpperCase()]
  const currentSubmissionMonth: number = currentSubmissionDueDate.getMonth()
  switch (true) {
    case nextReturnItem.isSingle:
      currentSubmissionDueDate.setFullYear(taskCreationParams.submissionDueDate.getFullYear() + skipNum + 1)
      break;
    case nextReturnItem.nextReturnItem.id === taskCreationParams.returnId.toString():
      currentSubmissionDueDate.setFullYear(taskCreationParams.submissionDueDate.getFullYear() + skipNum)
      break;
    case dateTemplateColumnsValues.monthColumnValue === currentReturnColumnValues.monthColumnValue:
      if (+dateTemplateColumnsValues.dayColumnValue < +currentReturnColumnValues.dayColumnValue) {
        currentSubmissionDueDate.setFullYear(taskCreationParams.submissionDueDate.getFullYear() + 1)
      }
      break;
    case nextReturnMonth < currentSubmissionDueDate.getMonth():
      currentSubmissionDueDate.setFullYear(currentSubmissionDueDate.getFullYear() + 1)
      break;
    default:
      break;
  }
  if (currentReturnMonth === 11 && currentSubmissionMonth === 0) {
    currentSubmissionDueDate.setFullYear(currentSubmissionDueDate.getFullYear() - 1)
  } else if (currentReturnMonth === 0 && currentSubmissionMonth === 11) {
    currentSubmissionDueDate.setFullYear(currentSubmissionDueDate.getFullYear() + 1)
  }
  return [null, currentSubmissionDueDate.getFullYear()];
}

const getDateTemplateColumnsValues = (
  taskType: string,
  returnItem: MondayItem,
  dateTemplate: MondayItem,
  isItemCustomTemplate: boolean
): ErrorResultTuple<DateTemplateColumnsValues> => {
  // get all relevant columns keys (by taskType) - day, month, dayType, weekendBegins, weekendRoll
  let dayColumn;
  let monthColumn;
  let dayTypeColumn;
  let weekendBeginsColumn;
  let weekendRollColumn;
  switch (taskType) {
    case SYNC_INTEGRATION_VALUES.DATA_TASK_TYPE:
      dayColumn = SYNC_INTEGRATION_COLUMNS.DATA_DATE_TEMPLATE_DAY_COLUMN;
      monthColumn = SYNC_INTEGRATION_COLUMNS.DATA_DATE_TEMPLATE_MONTH_COLUMN;
      dayTypeColumn = SYNC_INTEGRATION_COLUMNS.DATA_DATE_TEMPLATE_DAY_TYPE_COLUMN;
      weekendBeginsColumn = SYNC_INTEGRATION_COLUMNS.DATA_DATE_TEMPLATE_WEEKEND_BEGINS_COLUMN;
      weekendRollColumn = SYNC_INTEGRATION_COLUMNS.DATA_DATE_TEMPLATE_WEEKEND_ROLL_COLUMN;
      break;
    case SYNC_INTEGRATION_VALUES.FILING_TASK_TYPE:
      dayColumn = isItemCustomTemplate
        ? SYNC_INTEGRATION_COLUMNS.CUSTOM_FILING_DATE_TEMPLATE_DAY_COLUMN
        : SYNC_INTEGRATION_COLUMNS.FILING_DATE_TEMPLATE_DAY_COLUMN;
      monthColumn = isItemCustomTemplate
        ? SYNC_INTEGRATION_COLUMNS.CUSTOM_FILING_DATE_TEMPLATE_MONTH_COLUMN
        : SYNC_INTEGRATION_COLUMNS.FILING_DATE_TEMPLATE_MONTH_COLUMN;
      dayTypeColumn = SYNC_INTEGRATION_COLUMNS.FILING_DATE_TEMPLATE_DAY_TYPE_COLUMN;
      weekendBeginsColumn = SYNC_INTEGRATION_COLUMNS.FILING_DATE_TEMPLATE_WEEKEND_BEGINS_COLUMN;
      weekendRollColumn = SYNC_INTEGRATION_COLUMNS.FILING_DATE_TEMPLATE_WEEKEND_ROLL_COLUMN;
      break;
    default:
      return [new InternalServerError(), null];
  }
  // get all columns values from dateTemplate
  const [dayColumnValueError, dayColumnValue] = getColumnTextByColumnId(returnItem, dayColumn);
  if (dayColumnValueError) {
    return [dayColumnValueError, null];
  }
  const [monthColumnValueError, monthColumnValue] = getColumnTextByColumnId(returnItem, monthColumn);
  if (monthColumnValueError) {
    return [monthColumnValueError, null];
  }
  const [dayTypeColumnValueError, dayTypeColumnValue] = getColumnTextByColumnId(dateTemplate, dayTypeColumn);
  if (dayTypeColumnValueError) {
    return [dayTypeColumnValueError, null];
  }
  const [weekendBeginsColumnValueError, weekendBeginsColumnValue] = getColumnTextByColumnId(
    dateTemplate,
    weekendBeginsColumn
  );
  if (weekendBeginsColumnValueError) {
    return [weekendBeginsColumnValueError, null];
  }
  const [weekendRollColumnValueError, weekendRollColumnValue] = getColumnTextByColumnId(
    dateTemplate,
    weekendRollColumn
  );
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

const getReturnItemColumnValues = (
  taskType: string,
  returnItem: MondayItem,
  isItemCustomTemplate: boolean
): ErrorResultTuple<ReturnItemColumnsValues> => {
  let dayColumn;
  let monthColumn;
  switch (taskType) {
    case SYNC_INTEGRATION_VALUES.DATA_TASK_TYPE:
      dayColumn = SYNC_INTEGRATION_COLUMNS.DATA_DATE_TEMPLATE_DAY_COLUMN;
      monthColumn = SYNC_INTEGRATION_COLUMNS.DATA_DATE_TEMPLATE_MONTH_COLUMN;
      break;
    case SYNC_INTEGRATION_VALUES.FILING_TASK_TYPE:
      dayColumn = isItemCustomTemplate
        ? SYNC_INTEGRATION_COLUMNS.CUSTOM_FILING_DATE_TEMPLATE_DAY_COLUMN
        : SYNC_INTEGRATION_COLUMNS.FILING_DATE_TEMPLATE_DAY_COLUMN;
      monthColumn = isItemCustomTemplate
        ? SYNC_INTEGRATION_COLUMNS.CUSTOM_FILING_DATE_TEMPLATE_MONTH_COLUMN
        : SYNC_INTEGRATION_COLUMNS.FILING_DATE_TEMPLATE_MONTH_COLUMN;
      break;
    default:
      return [new InternalServerError(), null];
  }
  const [dayColumnValueError, dayColumnValue] = getColumnTextByColumnId(returnItem, dayColumn);
  if (dayColumnValueError) {
    return [dayColumnValueError, null];
  }
  const [monthColumnValueError, monthColumnValue] = getColumnTextByColumnId(returnItem, monthColumn);
  if (monthColumnValueError) {
    return [monthColumnValueError, null];
  }
  return [
    null,
    {
      dayColumnValue,
      monthColumnValue
    }
  ]
}

const calculateSubmissionsDueDate = (
  dateTemplateColumnsValues: DateTemplateColumnsValues,
  relativeYear: number,
): ErrorResultTuple<string> => {
  switch (dateTemplateColumnsValues.dayTypeColumnValue) {
    case SYNC_INTEGRATION_VALUES.WORK_DAY:
      return [
        null,
        getDateByWorkDay(
          relativeYear,
          parseInt(dateTemplateColumnsValues.dayColumnValue),
          dateTemplateColumnsValues.monthColumnValue,
          dateTemplateColumnsValues.weekendBeginsColumnValue
        ),
      ];
    case SYNC_INTEGRATION_VALUES.CALENDAR_DAY:
      return [
        null,
        getDateByCalendarDate(
          relativeYear,
          parseInt(dateTemplateColumnsValues.dayColumnValue),
          dateTemplateColumnsValues.monthColumnValue,
          dateTemplateColumnsValues.weekendBeginsColumnValue,
          dateTemplateColumnsValues.weekendRollColumnValue
        ),
      ];
    default:
      return [new InternalServerError(), null];
  }
};

const getDateByWorkDay = (
  relativeYear: number,
  day: number,
  month: string,
  weekendBegins: string
) => {
  const date = addWorkDays(new Date(relativeYear, MONTHS[month.toUpperCase()]), day, weekendBegins);
  return formatDate(date);
};

const getDateByCalendarDate = (
  relativeYear: number,
  day: number,
  month: string,
  weekendBegins: string,
  weekendRoll: string
) => {
  let date = new Date(relativeYear, MONTHS[month.toUpperCase()], day);
  if (date.getDay() === DAYS.FRIDAY || date.getDay() === DAYS.SATURDAY || date.getDay() === DAYS.SUNDAY) {
    date = addOrRemoveDays(date, weekendBegins, weekendRoll);
  }
  return formatDate(date);
};

const getCurrentTaskDueDateColumnValue = (
  currentTask: MondayItem,
  taskType: string,
  isItemCustomTemplate: boolean
): ErrorResultTuple<number> => {
  let columnId: string;
  switch (taskType) {
    case SYNC_INTEGRATION_VALUES.DATA_TASK_TYPE:
      columnId = SYNC_INTEGRATION_COLUMNS.DATA_TASK_DUE_DATE_COLUMN;
      break;
    case SYNC_INTEGRATION_VALUES.FILING_TASK_TYPE:
      columnId = isItemCustomTemplate
        ? SYNC_INTEGRATION_COLUMNS.CUSTOM_FILING_TASK_DUE_DATE_COLUMN
        : SYNC_INTEGRATION_COLUMNS.FILING_TASK_DUE_DATE_COLUMN;
      break;
    default:
      return [new InternalServerError(), null];
  }
  const [columnValueError, columnValue] = getColumnTextByColumnId(currentTask, columnId);
  if (columnValueError) {
    return [columnValueError, null];
  }
  return [null, parseInt(columnValue)];
};

const calculateTaskDueDate = (date: string, workDays: number): ErrorResultTuple<string> => {
  const x = new Date(date);
  let endDate: Date = new Date(x);
  let count = 0;
  while (count < -1 * workDays) {
    endDate = new Date(x.setDate(x.getDate() - 1));
    if (endDate.getDay() != DAYS.SATURDAY && endDate.getDay() != DAYS.SUNDAY) {
      count++;
    }
  }
  return [null, formatDate(endDate)];
};

const addWorkDays = (date: Date, workDays: number, weekendBegins: string) => {
  const x = new Date(date);
  let endDate: Date = new Date(x.setDate(x.getDate() - 1));
  let count = 0;
  while (count < workDays) {
    endDate = new Date(x.setDate(x.getDate() + 1));
    if (weekendBegins === SYNC_INTEGRATION_VALUES.WEEKEND_BEGINS_FRIDAY) {
      if (endDate.getDay() !== DAYS.FRIDAY && endDate.getDay() !== DAYS.SATURDAY) {
        count++;
      }
    } else if (weekendBegins === SYNC_INTEGRATION_VALUES.WEEKEND_BEGINS_SATURDAY) {
      if (endDate.getDay() !== DAYS.SATURDAY && endDate.getDay() !== DAYS.SUNDAY) {
        count++;
      }
    }
  }
  return endDate;
};

const addOrRemoveDays = (date: Date, weekendBegins: string, weekendRoll: string) => {
  const d = new Date(date);
  if (weekendBegins === SYNC_INTEGRATION_VALUES.WEEKEND_BEGINS_SATURDAY) {
    if (weekendRoll === SYNC_INTEGRATION_VALUES.WEEKEND_ROLL_FORWARD) {
      switch (d.getDay()) {
        case DAYS.SUNDAY:
          d.setDate(d.getDate() + 1);
          break;
        case DAYS.SATURDAY:
          d.setDate(d.getDate() + 2);
          break;
      }
    } else if (weekendRoll === SYNC_INTEGRATION_VALUES.WEEKEND_ROLL_BACKWARD) {
      switch (d.getDay()) {
        case DAYS.SUNDAY:
          d.setDate(d.getDate() - 2);
          break;
        case DAYS.SATURDAY:
          d.setDate(d.getDate() - 1);
          break;
      }
    }
  } else if (weekendBegins === SYNC_INTEGRATION_VALUES.WEEKEND_BEGINS_FRIDAY) {
    if (weekendRoll === SYNC_INTEGRATION_VALUES.WEEKEND_ROLL_FORWARD) {
      switch (d.getDay()) {
        case DAYS.SATURDAY:
          d.setDate(d.getDate() + 1);
          break;
        case DAYS.FRIDAY:
          d.setDate(d.getDate() + 2);
          break;
      }
    } else if (weekendRoll === SYNC_INTEGRATION_VALUES.WEEKEND_ROLL_BACKWARD) {
      switch (d.getDay()) {
        case DAYS.SATURDAY:
          d.setDate(d.getDate() - 2);
          break;
        case DAYS.FRIDAY:
          d.setDate(d.getDate() - 1);
          break;
      }
    }
  }
  return new Date(d);
};

const formatDate = (date: Date) => {
  const d = new Date(date);
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();
  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;
  return [year, month, day].join('-');
};

export const getReturnOrderColumn = (taskType: string, isItemCustomTemplate: boolean): ErrorResultTuple<string> => {
  switch (taskType) {
    case SYNC_INTEGRATION_VALUES.DATA_TASK_TYPE:
      return [null, SYNC_INTEGRATION_COLUMNS.DATA_TASK_RETURN_ORDER_COLUMN];
    case SYNC_INTEGRATION_VALUES.FILING_TASK_TYPE:
      if (!isItemCustomTemplate) {
        return [null, SYNC_INTEGRATION_COLUMNS.TEMPLATE_FILING_TASK_RETURN_ORDER_COLUMN];
      }
      return [null, SYNC_INTEGRATION_COLUMNS.CUSTOM_FILING_TASK_RETURN_ORDER_COLUMN];
    default:
      return [new InternalServerError(), null];
  }
};