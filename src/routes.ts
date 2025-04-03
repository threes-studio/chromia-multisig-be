import { Router } from 'express';

import app from '@components/app';
import multisigAccounts from '@components/multisig-accounts';
import transactions from '@components/transactions';
import { RoutesProps } from '@components/types';

const routes = (props: RoutesProps) => {
  const router = Router();

  router.use(app.path, app.routes(props));
  router.use(multisigAccounts.path, multisigAccounts.routes(props));
  router.use(transactions.path, transactions.routes(props));
  
  return router;
};

export default routes;
export { RoutesProps };
