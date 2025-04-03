import {
  parseListQueryMiddleware,
  parseQueryMiddleware
} from '@utils/express';
import { Router } from 'express';

import { PLURAL_NAME } from './constants';
import { count, create, del, get, getById, list, update } from './controller';
import { validateCreate, validateUpdate } from './middleware';

import { RoutesProps } from '../types';

const path = `/${PLURAL_NAME}`;

const routes = (_: RoutesProps) => {
  const router = Router();

  router.param('id', getById);

  router.route('/')
    .get(parseListQueryMiddleware, list)
    .post(validateCreate, create);

  router.route('/count')
    .get(parseListQueryMiddleware, count);

  router.route('/:id')
    .get(parseQueryMiddleware, get)
    .put(validateUpdate, update)
    .delete(del);

  return router;
};

export default { path, routes };
