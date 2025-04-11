import { User } from '@core/models';

enum MultiSigAccountStatus {
  Pending = 'pending',
  TransferFee = 'transferFee',
  Registering = 'registering',
  Created = 'created',
}

interface MultiSigAccount {
  readonly _id?: string;
  readonly id?: string;
  readonly accountId?: string;
  readonly pubKey?: string;
  readonly privKey?: string;
  readonly mainDescriptor?: any;
  readonly signers?: [{
    readonly pubKey?: string;
    readonly name?: string;
  }];
  readonly signaturesRequired?: number;
  readonly user?: string | User;
  readonly pendingTx?: any[];
  readonly status?: MultiSigAccountStatus;
  readonly network?: 'testnet' | 'mainnet';
  readonly blockchainRid?: string;
}

export {
    MultiSigAccount,
    MultiSigAccountStatus
};

