"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// import secrets from './secrets-routes';
const integration_routes_1 = __importDefault(require("./integration-routes"));
const template_add_task_routes_1 = __importDefault(require("./template-add-task-routes"));
const router = (0, express_1.Router)();
router.get('/api/health', function (request, response) {
    response.json({
        env: process.env.NODE_ENV,
        appName: process.env.APP_NAME,
        version: '1.0',
        message: 'Health',
        ok: true,
    });
    response.end();
});
// router.use('/api/secrets', secrets());
router.use('/api/integration', (0, integration_routes_1.default)());
router.use('/api/template', (0, template_add_task_routes_1.default)());
exports.default = router;
//# sourceMappingURL=index.js.map