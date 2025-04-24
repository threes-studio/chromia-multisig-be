import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';

import { handleErrors, handleNotFound } from '@utils/express';
import { isDev } from '@utils/index';
import logger from '@utils/logger';

import passport from '@core/utils/passport';
import routes from './routes';

const startApp = () => {
  // initialize app
  const app = express();
  const dev = isDev();

  // plug middleware
  app.use(morgan(dev ? 'dev' : 'common'));
  app.use(bodyParser.urlencoded({
    limit: '50mb',
    extended: true,
  }));
  app.use(bodyParser.json({
    limit: '50mb',
  }));

  // Middleware to handle JSON parsing errors
  app.use((err: any, _: any, res: any, next: any) => {
    if (err instanceof SyntaxError && (err as any).status === 400 && 'body' in err) {
        logger.error('Invalid JSON:', err.message);
        return res.status(400).json({ error: 'Invalid JSON payload' });
    }
    next();
  });

  app.set('trust proxy', true);
  app.use(passport.initialize());

  // cors
  app.use(cors());
  // plug routes
  app.use('/api', routes({ dev }));

  app.use(handleNotFound);
  app.use(handleErrors);

  return app;
};

export default startApp;
