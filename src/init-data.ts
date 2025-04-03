import AccountRepository from '@components/accounts/repository';
import UserRepository from '@components/users/repository';
import { Account, AccountProvider, User, UserRole } from '@core/models';

const users: ReadonlyArray<User> = [{
  _id: '6060490dc3b9792245fd5886',
  role: UserRole.Administrator,
  isProtected: true,
  isActive: true,
  email: "admin@threes.studio",
  displayName: "Administrator",
  pubKey: "03407230a821d579c33eff0e89ab45b62a2d68512819c6859a625bc9bc94dcb88d",
  createdAt: new Date(),
}];

const accounts: ReadonlyArray<Account> = [{
  _id: '6060490dc3b9792245fd5887',
  provider: AccountProvider.Local,
  user: '6060490dc3b9792245fd5886',
  credentials: {
    email: "admin@threes.studio",
    password: "threesStudio@123",
  },
}];

const initData = async () => {
  // * generated data for users
  await UserRepository.generatedDedicatedData(users);

  // * generated data for accounts
  await AccountRepository.generatedDedicatedData(accounts);

  console.info('> Initialized data successfully');
};

export default initData;
