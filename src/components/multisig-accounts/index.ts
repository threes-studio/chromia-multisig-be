import {
  parseListQueryMiddleware,
  parseQueryMiddleware
} from '@utils/express';
import { Router } from 'express';

import { PLURAL_NAME } from './constants';
import { create, get, getById, list, listAssets, mockTransferAsset, mockTransferFee, register, transferFee, update } from './controller';
import { validateCreate, validateRegister, validateUpdate } from './middleware';

import { RoutesProps } from '../types';

const path = `/${PLURAL_NAME}`;

const routes = (_: RoutesProps) => {
  const router = Router();

  router.param('id', getById);

  router.route('/')
    .get(parseListQueryMiddleware, list)
    .post(validateCreate, create);

  router.route('/mock/transfer-fee')
    .post(mockTransferFee);

  router.route('/mock/transfer-asset')
    .post(mockTransferAsset);

  router.route('/:id')
    .get(parseQueryMiddleware, get)
    .put(validateUpdate, update);

  router.route('/:id/assets')
    .get(parseQueryMiddleware, listAssets)

  router.route('/:id/register')
    .post(validateRegister, register);

  router.route('/:id/transfer-fee')
    .post(transferFee);

  return router;
};

export default { path, routes };
