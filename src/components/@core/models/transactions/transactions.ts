import { MultiSigAccount, User } from '@core/models';

enum TransactionStatus {
  Pending = 'pending',
  Ready = 'ready',
  Rejected = 'rejected',
  Completed = 'completed',
}

enum TransactionType {
  TransferFund = 'transferFund',
  Register = 'register',
  UpdateDescriptor = 'updateDescriptor',
}

enum TransactionLogAction {
  Created = 'created',
  Signed = 'signed',
  Rejected = 'rejected',
  Executed = 'executed',
}

interface TransactionLog {
  readonly action?: TransactionLogAction;
    readonly pubKey?: string;
    readonly signerName?: string;
    readonly createdAt: Date;
}

interface Transaction {
  readonly _id?: string;
  readonly id?: string;

  readonly multiSigAccount?: string | MultiSigAccount;
  readonly type?: TransactionType;
  readonly tx?: string;
  
  readonly signatures?: [{
    readonly user?: string | User;
    readonly pubKey?: string;
    readonly createdAt: Date;
    readonly signature?: {
      readonly r: string;
      readonly s: string;
      readonly v: number;
    };
  }];
  
  readonly assetId?: string;
  readonly assetSymbol?: string;
  readonly amount?: number;

  readonly signers?: [{
    readonly pubKey?: string;
    readonly name?: string;
  }];
  readonly signaturesRequired?: number;

  readonly signersToUpdate?: [{
    readonly pubKey?: string;
    readonly name?: string;
  }];
  readonly signaturesRequiredToUpdate?: number;

  readonly status?: TransactionStatus;

  readonly txRid?: string;
  readonly txStatus?: string;
  readonly txErrorMsg?: string;

  readonly logs?: Array<TransactionLog>;
  readonly accountId?: string;
  readonly authDescriptorId?: string;
  readonly recipient?: string;
  readonly userAddress?: string;
}

export {
  Transaction, TransactionLog, TransactionLogAction, TransactionStatus,
  TransactionType
};

