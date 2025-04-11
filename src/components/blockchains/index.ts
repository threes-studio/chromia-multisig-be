import {
  parseListQueryMiddleware,
  parseQueryMiddleware
} from '@utils/express';
import { Router } from 'express';

import { hasAuthorization } from '@components/auth/middleware';
import { UserRole } from '@core/index';
import { RoutesProps } from '../types';
import { PLURAL_NAME } from './constants';
import { create, get, getById, list, update } from './controller';
import { validateCreate, validateUpdate } from './middleware';

const path = `/${PLURAL_NAME}`;

const routes = (_: RoutesProps) => {
  const router = Router();

  router.param('id', getById);

  router.route('/')
    .get(parseListQueryMiddleware, list)
    .post(hasAuthorization([UserRole.Administrator]), validateCreate, create);

  router.route('/:id')
    .get(parseQueryMiddleware, get)
    .put(hasAuthorization([UserRole.Administrator]), validateUpdate, update);

  return router;
};

export default { path, routes };
