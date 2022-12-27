import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import routes from './routes';
import { LoggerService } from './services/logger-service';

const logger = LoggerService.getLogger();

const app = express();
const port = process.env.PORT ?? '8080';

app.use(cors());
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(routes);

export const main = async () => {
  try {
    app.listen(port, () => {
      logger.info({
        message: `pwc integration app listening at http://localhost:${port}`,
        fileName: 'app',
        functionName: 'main',
      });
    });
  } catch (error: any) {
    logger.error({
      message: `catch error: ${JSON.stringify(error)}`,
      fileName: 'app',
      functionName: 'main',
    });
    process.exit(1);
  }
};

main();
