"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForbiddenError = exports.InternalServerError = exports.BadRequestError = exports.GenericError = exports.ErrorType = void 0;
var ErrorType;
(function (ErrorType) {
    ErrorType["BAD_REQUEST_ERROR"] = "BadRequestError";
    ErrorType["INTERNAL_SERVER_ERROR"] = "InternalServerError";
    ErrorType["FORBIDDEN_ERROR"] = "ForbiddenError";
    ErrorType["TIMEOUT_ERROR"] = "TimeOutError";
})(ErrorType = exports.ErrorType || (exports.ErrorType = {}));
class GenericError extends Error {
}
exports.GenericError = GenericError;
class BadRequestError extends GenericError {
    constructor() {
        super(...arguments);
        this.type = ErrorType.BAD_REQUEST_ERROR;
    }
}
exports.BadRequestError = BadRequestError;
class InternalServerError extends GenericError {
    constructor() {
        super(...arguments);
        this.type = ErrorType.INTERNAL_SERVER_ERROR;
    }
}
exports.InternalServerError = InternalServerError;
class ForbiddenError extends GenericError {
    constructor() {
        super(...arguments);
        this.type = ErrorType.FORBIDDEN_ERROR;
    }
}
exports.ForbiddenError = ForbiddenError;
//# sourceMappingURL=error.js.map