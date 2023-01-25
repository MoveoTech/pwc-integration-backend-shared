"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = __importStar(require("express"));
const express_validator_1 = require("express-validator");
const monday_middleware_1 = require("../middlewares/monday-middleware");
const integration_middleware_1 = require("../middlewares/integration-middleware");
const integration_controller_1 = require("../controllers/integration-controller");
const activate_tasks_middleware_1 = require("../middlewares/activate-tasks-middleware");
const template_add_task_middleware_1 = require("../middlewares/template-add-task-middleware");
const template_add_task_controller_1 = require("../controllers/template-add-task-controller");
const activate_tasks_controller_1 = require("../controllers/activate-tasks-controller");
const router = express.Router();
const integrationRoutes = () => {
    router.post('/sync-status-and-tasks', (0, express_validator_1.body)('payload.inputFields.boardId').toInt(), (0, express_validator_1.body)('payload.inputFields.itemId').toInt(), monday_middleware_1.verifyAuthorization, integration_middleware_1.validateSyncIntegrationInputs, integration_controller_1.syncStatusAndTasks);
    router.post('/template-add-task', (0, express_validator_1.body)('payload.settings.boardId').toInt(), (0, express_validator_1.body)('payload.settings.itemId').toInt(), (0, express_validator_1.body)('payload.settings.templateItemId').toInt(), (0, express_validator_1.body)('payload.settings.settingsBoardIds.*.clientObligationBoardId').trim().escape(), (0, express_validator_1.body)('payload.settings.settingsBoardIds.*.businessStreamBoardId').trim().escape(), (0, express_validator_1.body)('payload.settings.settingsBoardIds.*.currentTaskboardBoardId').trim().escape(), monday_middleware_1.verifyClientAuthorization, template_add_task_middleware_1.validateTemplateAddTaskInputs, template_add_task_controller_1.addTask);
    router.post('/activate-tasks', (0, express_validator_1.body)('payload.boardIds.clientObligationBoardId').trim().escape(), (0, express_validator_1.body)('payload.boardIds.businessStreamBoardId').trim().escape(), (0, express_validator_1.body)('payload.boardIds.currentTaskboardBoardId').trim().escape(), (0, express_validator_1.body)('payload.parentsItemsData.*.parentItemId').toInt(), (0, express_validator_1.body)('payload.parentsItemsData.*.type').trim().escape(), (0, express_validator_1.body)('payload.parentsItemsData.*.items.*.itemName').trim().escape(), monday_middleware_1.verifyClientAuthorization, activate_tasks_middleware_1.validateActivateTasksInputs, activate_tasks_controller_1.activateTasks);
    return router;
};
exports.default = integrationRoutes;
//# sourceMappingURL=integration-routes.js.map