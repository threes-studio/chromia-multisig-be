import {
  parseListQueryMiddleware,
  parseQueryMiddleware
} from '@utils/express';
import { Router } from 'express';

import { PLURAL_NAME } from './constants';
import { count, create, execute, get, getById, list, sign } from './controller';
import { validateCreate, validateExecute, validateSign } from './middleware';

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
    .get(parseQueryMiddleware, get);

  router.route('/:id/sign')
    .post(validateSign, sign)

  router.route('/:id/execute')
    .post(validateExecute, execute)

  return router;
};

export default { path, routes };
