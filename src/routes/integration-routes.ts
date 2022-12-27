import * as express from 'express';
import { Router } from 'express';
import { verifyAuthorization } from '../middlewares/monday-middleware';
import { validateSyncIntegrationInputs } from '../middlewares/integration-middleware';
import { syncStatusAndTasks } from '../controllers/integration-controller';

const router: Router = express.Router();

const integrationRoutes = (): Router => {
  router.post('/sync-status-and-tasks', verifyAuthorization, validateSyncIntegrationInputs, syncStatusAndTasks);
  return router;
};

export default integrationRoutes;
