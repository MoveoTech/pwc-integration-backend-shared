import { Router, Response, Request } from 'express';
import integration from './integration-routes';
import addTask from './template-add-task-routes';

const router: Router = Router();

router.get('/api/health', function (request: Request, response: Response) {
  response.json({
    env: process.env.NODE_ENV,
    appName: process.env.APP_NAME,
    version: '1.0',
    message: 'Health',
    ok: true,
  });
  response.end();
});

router.use('/api/integration', integration());
router.use('/api/template', addTask());

export default router;
