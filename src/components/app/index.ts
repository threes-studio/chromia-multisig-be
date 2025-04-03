import { Router } from 'express';

import { RoutesProps } from '../types';
import { NAME } from './constants';
import { getSummary, healthCheck } from './controller';

const path = `/${NAME}`;

const routes = (_: RoutesProps) => {
  const router = Router();

  router.route('/health')
    .get(healthCheck);

  router.route('/summary')
    .get(getSummary);

  return router;
};

export default { path, routes };
