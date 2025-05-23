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

const testnetBlockchains: ReadonlyArray<Blockchain> = [
  {
    _id: '67f7411d66f271df0519a447',
    name: 'Economy chain',
    rid: '090BCD47149FBB66F02489372E88A454E7A5645ADDE82125D40DF1EF0C76F874',
    network: 'testnet',
    feeId: '9EF73A786A66F435B3B40E72F5E9D85A4B09815997E087C809913E1E7EC686B4',
    feeSymbol: 'tCHR',
    feeValue: 10,
      feeDecimals: 6,
      isActive: true,
    },
  {
    _id: '67f7410c66f271df0519a446',
    name: 'Bridge cp2',
    rid: 'D90926825CBC5B33A5E94154AED6E7DEAEC5A8AE2669124081A7864A8148E214',
    network: 'testnet',
    feeId: 'BDEA828745BAB126399C3D16CE627F5EF0056F2F4E15CB0F65024B1FB73F8317',
    feeSymbol: 'USDC',
    feeValue: 2,
    feeDecimals: 18,
    isActive: true,
  },
  {
    _id: '67f7410c66f271df0519a447',
    name: 'Dex cp3',
    rid: '4D1A5A875B2534A7BECA654AA85FD191C1A09EA71836431305AE23F7E6F3A1D9',
    network: 'testnet',
    feeId: 'BDEA828745BAB126399C3D16CE627F5EF0056F2F4E15CB0F65024B1FB73F8317',
    feeSymbol: 'USDC',
    feeValue: 2,
    feeDecimals: 18,
    isActive: true,
  },
];

const mainnetBlockchains: ReadonlyArray<Blockchain> = [
  {
    _id: '67f7412266f271df0519a448',
    name: 'Economy chain',
    rid: '15C0CA99BEE60A3B23829968771C50E491BD00D2E3AE448580CD48A8D71E7BBA',
    network: 'mainnet',
    feeId: '5F16D1545A0881F971B164F1601CBBF51C29EFD0633B2730DA18C403C3B428B5',
    feeSymbol: 'CHR',
    feeValue: 10,
    feeDecimals: 6,
    isActive: true,
  },
  {
    _id: '67f7412266f271df0519a449',
    name: 'Colorpool bridge',
    rid: 'B878E77F783DF20B57B2813CC91E04DC2D46234F8AFC1CFFF7D1274939C63FB9',
    network: 'mainnet',
    feeId: '9BACD576F40B6674AA76B8BFA1330077A3B94F581BFDB2EF806122C384DCDF25',
    feeSymbol: 'USDC',
    feeValue: 2,
    feeDecimals: 18,
    isActive: true,
  },
  {
    _id: '67f7412266f271df0519a44a',
    name: 'Colorpool dex',
    rid: '4D1A5A875B2534A7BECA654AA85FD191C1A09EA71836431305AE23F7E6F3A1D9',
    network: 'mainnet',
    feeId: '9BACD576F40B6674AA76B8BFA1330077A3B94F581BFDB2EF806122C384DCDF25',
    feeSymbol: 'USDC',
    feeValue: 2,
    feeDecimals: 18,
    isActive: true,
  },
];

const blockchains: ReadonlyArray<Blockchain> = [
   ...testnetBlockchains,
   ...mainnetBlockchains,
];

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
