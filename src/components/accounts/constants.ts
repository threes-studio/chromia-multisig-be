import { AccountProvider } from '@core/models';

const NAME = 'account';
const PLURAL_NAME = 'accounts';

// tslint:disable-next-line: readonly-array
const PROVIDERS = [
  AccountProvider.Local,
];

const LOCAL_USERNAME_PATH = 'credentials.email';
const LOCAL_PASSWORD_PATH = 'credentials.password';
const LOCAL_PASSWORD_TOKEN = 'credentials.passwordToken';
const LOCAL_PASSWORD_TOKEN_EXPIRES = 'credentials.passwordTokenExpires';

const PASSWORD_TOKEN_LENGTH = 20;
const PASSWORD_TOKEN_EXPIRY = 3600000; // 1 HOUR

export {
  LOCAL_PASSWORD_PATH,
  LOCAL_PASSWORD_TOKEN,
  LOCAL_PASSWORD_TOKEN_EXPIRES, LOCAL_USERNAME_PATH, NAME, PASSWORD_TOKEN_EXPIRY, PASSWORD_TOKEN_LENGTH, PLURAL_NAME,
  PROVIDERS
};

