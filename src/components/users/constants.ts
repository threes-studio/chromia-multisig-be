import { AccountProvider, UserRole } from '@core/models';

const NAME = 'user';
const PLURAL_NAME = 'users';
const COLLECTION_NAME = 'users';

const USER_ROLES: UserRole[] = [
  UserRole.Administrator,
  UserRole.User,
];

const ACCOUNT_PROVIDERS: ReadonlyArray<any> = [
  AccountProvider.Local,
];

export {
  ACCOUNT_PROVIDERS, COLLECTION_NAME, NAME, PLURAL_NAME, USER_ROLES
};

