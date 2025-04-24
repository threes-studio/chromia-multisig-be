require('dotenv').config();

import db from '@utils/db';
import errorHandler from '@utils/error-handler';
import logger from '@utils/logger';
import mongoose from 'mongoose';

// declare env vars
const host = process.env.HOST || 'localhost';
const port = +process.env.PORT || 9000;

// connect db
db.connect({
  mongoose,
  options: { timestampsPlugin: true, useUnifiedTopology: true },
  cb: async () => {
    // init data
    await require('./init-data').default();

    // start app
    require('./app')
      .default({ mongooseConnection: mongoose.connection }).listen(port, host, (err: Error) => {
        if (err) {
          throw err;
        }

        logger.info(`> App started at http://${host}:${port}`);
      });
  },
});

// handle unhandled promise
process.on('unhandledRejection', (err: Error) => {
  throw err;
});

// handle uncaught error and gracefully shutdown
process.on('uncaughtException', (err: Error) => {
  errorHandler.handle(err);
});

// const connection = mongoose.connection;
const connection = {};

export {
  connection
};

