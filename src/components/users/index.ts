import { UserRole } from '@core/models';
import {
    parseListQueryMiddleware,
    parseQueryMiddleware
} from '@utils/express';
import { Router } from 'express';

import { PLURAL_NAME } from './constants';
import { count, create, del, get, getById, list, update } from './controller';
import { validateCreate, validateUpdate } from './middleware';

import { hasAuthorization } from '../auth/middleware';

import { RoutesProps } from '../types';

const path = `/${PLURAL_NAME}`;

const routes = (_: RoutesProps) => {
  const router = Router();

  router.param('id', getById);

  router.route('/')
    .get(hasAuthorization([UserRole.Administrator]), parseListQueryMiddleware, list)
    .post(hasAuthorization([UserRole.Administrator]), validateCreate, create);

  router.route('/count')
    .get(hasAuthorization([UserRole.Administrator]), parseListQueryMiddleware, count);

  router.route('/:id')
    .get(hasAuthorization([UserRole.Administrator]), parseQueryMiddleware, get)
    .put(hasAuthorization([UserRole.Administrator]), validateUpdate, update)
    .delete(hasAuthorization([UserRole.Administrator]), del);

  return router;
};

export default { path, routes };
