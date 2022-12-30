"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setSecrets = void 0;
const secrets_1 = require("../constants/secrets");
const secrets_service_1 = require("../services/secrets-service");
const setSecrets = async (request, response) => {
    const clientSecret = process.env.CLIENT_SECRET || '';
    const signingSecret = process.env.SIGNING_SECRET || '';
    const token = process.env.TOKEN || '';
    const secretService = new secrets_service_1.SecretsService();
    await secretService.setSecret(secrets_1.SECRETS.MONDAY_CLIENT_SECRET, clientSecret);
    await secretService.setSecret(secrets_1.SECRETS.MONDAY_SIGNING_SECRET, signingSecret);
    await secretService.setSecret(secrets_1.SECRETS.MONDAY_TOKEN, token);
    return response.status(200).send({});
};
exports.setSecrets = setSecrets;
//# sourceMappingURL=secrets-controller.js.map