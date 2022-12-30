"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setSecrets = void 0;
const secrets_1 = require("../constants/secrets");
const secrets_service_1 = require("../services/secrets-service");
const setSecrets = async (request, response) => {
    const clientSecret = '82de1c71c6b67adf84cd9e5ad17badf2';
    const signingSecret = '57a66998c1c0f6dd6dda9e19e4a953af';
    const token = 'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjIxNDU4OTc2NCwidWlkIjozMDQyMjg0NCwiaWFkIjoiMjAyMi0xMi0yOVQwOTowNDoyNi43MDJaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6MTE2ODY5MDUsInJnbiI6ImV1YzEifQ._ZUJKBoJ98ycGM1rkxzGFH0RaWOU6Cx7ykxBIVbqI-k';
    const secretService = new secrets_service_1.SecretsService();
    await secretService.setSecret(secrets_1.SECRETS.MONDAY_CLIENT_SECRET, clientSecret);
    await secretService.setSecret(secrets_1.SECRETS.MONDAY_SIGNING_SECRET, signingSecret);
    await secretService.setSecret(secrets_1.SECRETS.MONDAY_TOKEN, token);
    return response.status(200).send({});
};
exports.setSecrets = setSecrets;
//# sourceMappingURL=secrets-controller.js.map