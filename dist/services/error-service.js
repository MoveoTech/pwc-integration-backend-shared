"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorService = void 0;
const monday_service_1 = require("./monday-service");
class ErrorService {
    constructor() {
        this.mondayService = new monday_service_1.MondayService();
    }
}
exports.ErrorService = ErrorService;
//# sourceMappingURL=error-service.js.map