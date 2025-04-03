import { UserRole } from '@core/models';
import {
  parseListQueryMiddleware
} from '@core/utils/express';
import { Router } from 'express';

import { PLURAL_NAME } from './constants';
import { getById, list } from './controller';

import { hasAuthorization } from '../auth/middleware';

import { RoutesProps } from '../types';

const path = `/${PLURAL_NAME}`;

const routes = (_: RoutesProps) => {
  const router = Router();

  router.param('id', getById);

  router.route('/')
    .get(hasAuthorization([UserRole.Administrator]), parseListQueryMiddleware, list);

  return router;
};

export default { path, routes };
