import { Router } from 'express';

import app from '@components/app';
import auth from '@components/auth';
import blockchains from '@components/blockchains';
import multisigAccounts from '@components/multisig-accounts';
import transactions from '@components/transactions';
import { RoutesProps } from '@components/types';

const routes = (props: RoutesProps) => {
  const router = Router();

  router.use(app.path, app.routes(props));
  router.use(auth.path, auth.routes(props));
  router.use(blockchains.path, blockchains.routes(props));
  router.use(multisigAccounts.path, multisigAccounts.routes(props));
  router.use(transactions.path, transactions.routes(props));
  
  return router;
};

export default routes;
export { RoutesProps };
