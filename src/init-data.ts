import AccountRepository from '@components/accounts/repository';
import BlockchainRepository from '@components/blockchains/repository';
import UserRepository from '@components/users/repository';
import { Account, AccountProvider, Blockchain, User, UserRole } from '@core/models';
import logger from '@utils/logger';

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

const blockchains: ReadonlyArray<Blockchain> = [{
  _id: '67f7410c66f271df0519a445',
  name: 'Dex cp1',
  rid: 'E592E9C2A048753CB39818B9926A1FD09F4BD02CD673648284356540BC9ADD4E',
  network: 'testnet',
  feeId: '254B2F0A736E74F25AB3D823D7D39208E8A550E08FC65DDE1C50FC4361C2D81A',
  feeSymbol: 'BUSC',
  feeValue: 2,
  feeDecimals: 18,
  isActive: true,
}, {
  _id: '67f7411866f271df0519a446',
  name: 'Bridge cp1',
  rid: '7E57DB1DF38BE1A8503B9531A08B982B1D5F30F5BFE3AD9ECEBDC9C553717AAC',
  network: 'testnet',
  feeId: '254B2F0A736E74F25AB3D823D7D39208E8A550E08FC65DDE1C50FC4361C2D81A',
  feeSymbol: 'BUSC',
  feeValue: 2,
  feeDecimals: 18,
  isActive: true,
}, {
  _id: '67f7411d66f271df0519a447',
  name: 'Economy chain',
  rid: '090BCD47149FBB66F02489372E88A454E7A5645ADDE82125D40DF1EF0C76F874',
  network: 'testnet',
  feeId: '9EF73A786A66F435B3B40E72F5E9D85A4B09815997E087C809913E1E7EC686B4',
  feeSymbol: 'tCHR',
  feeValue: 10,
  feeDecimals: 6,
  isActive: true,
}, {
  _id: '67f7412266f271df0519a448',
  name: 'Economy chain',
  rid: '15C0CA99BEE60A3B23829968771C50E491BD00D2E3AE448580CD48A8D71E7BBA',
  network: 'mainnet',
  feeId: '5F16D1545A0881F971B164F1601CBBF51C29EFD0633B2730DA18C403C3B428B5',
  feeSymbol: 'CHR',
  feeValue: 10,
  feeDecimals: 6,
  isActive: true,
}];

const initData = async () => {
  // * generated data for users
  await UserRepository.generatedDedicatedData(users);

  // * generated data for accounts
  await AccountRepository.generatedDedicatedData(accounts);

  // * generated data for blockchains
  await BlockchainRepository.generatedDedicatedData(blockchains);

  logger.info('> Initialized data successfully');
};

export default initData;
