import { Router } from 'express';
import { NAME } from './constants';
import {
  getLoggedUser,
  signInWallet,
  signOut
} from './controller';
import {
  authenticate,
  validateSignInWallet
} from './middleware';

import { RoutesProps } from '../types';

const path = `/${NAME}`;

const routes = (_: RoutesProps) => {
  const router = Router();

  router.route('/sign-in')
    .post(validateSignInWallet, signInWallet)
    .delete(signOut);

  router.route('/profile')
    .get(authenticate, getLoggedUser);

  return router;
};

export default { path, routes };
