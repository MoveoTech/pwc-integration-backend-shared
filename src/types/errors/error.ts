export enum ErrorType {
  BAD_REQUEST_ERROR = 'BadRequestError',
  INTERNAL_SERVER_ERROR = 'InternalServerError',
  FORBIDDEN_ERROR = 'ForbiddenError',
}

export abstract class GenericError extends Error {
  abstract readonly type: ErrorType;
}

export class BadRequestError extends GenericError {
  type = ErrorType.BAD_REQUEST_ERROR;
}
export class InternalServerError extends GenericError {
  type = ErrorType.INTERNAL_SERVER_ERROR;
}
export class ForbiddenError extends GenericError {
  type = ErrorType.FORBIDDEN_ERROR;
}
