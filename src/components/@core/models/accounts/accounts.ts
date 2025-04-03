import { User } from '../users';

enum AccountProvider {
  Local = 'LOCAL',
  Wallet = 'WALLET',
  Default = Local,  
}

interface Account {
  readonly _id?: string;
  readonly id?: string;
  readonly user: string | User;
  readonly provider?: AccountProvider;
  readonly credentials?: any;
  readonly lastSignedIn?: Date;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

export {
  Account, AccountProvider
};

