import * as express from 'express';
import { Router } from 'express';
import { verifyClientAuthorization } from '../middlewares/monday-middleware';
import { validateTemplateAddTaskInputs } from '../middlewares/template-add-task-middleware';
import { addTask } from '../controllers/template-add-task-controller';

const router: Router = express.Router();

const temapleAddTaskRoutes = (): Router => {
  router.post('/add-task', verifyClientAuthorization, validateTemplateAddTaskInputs, addTask);
  return router;
};

export default temapleAddTaskRoutes;
