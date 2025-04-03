import { Transaction, TransactionLogAction, TransactionStatus, TransactionType } from '@core/models';
import { CustomMongooseDocument } from '@utils/mongoose';
import mongoose, { Model as MongooseModel, Schema } from 'mongoose';

import { NAME } from './constants';

type Document = CustomMongooseDocument & Transaction;
type Model = MongooseModel<Document>;

const schema = new Schema<Transaction>({
  multiSigAccount: { type: Schema.Types.ObjectId, ref: 'multisig-account' },
  type: { type: String, enum: Object.values(TransactionType), required: false },
  tx: { type: String, required: false },
  signatures: [
    {
      user: { type: Schema.Types.ObjectId, ref: 'User' },
      pubKey: { type: String, required: false },
      createdAt: { type: Date, required: true },
      signature: { type: Schema.Types.Mixed, required: false },
    },
  ],
  assetId: { type: String, required: false },
  assetSymbol: { type: String, required: false },
  amount: { type: Number, required: false },
  signers: [{
    pubKey: {
      type: String,
      required: false,
    },
    name: {
      type: String,
      required: false,
    },
  }],
  signaturesRequired: { type: Number, required: false },
  
  signersToUpdate: [{
    pubKey: {
      type: String,
      required: false,
    },
    name: {
      type: String,
      required: false,
    },
  }],
  signaturesRequiredToUpdate: { type: Number, required: false },

  status: { type: String, enum: Object.values(TransactionStatus), default: TransactionStatus.Pending, required: false },
  txRid: {
    type: String,
    required: false,
  },
  txStatus: {
    type: String,
    required: false,
  },
  txErrorMsg: {
    type: String,
    required: false,
  },

  note: {
    type: String,
    required: false,
  },
  logs: [{
    action: {
      type: String,
      enum: Object.values(TransactionLogAction),
      default: TransactionLogAction.Created,
      required: false,
    },
    pubKey: {
      type: String,
      required: false,
    },
    signerName: {
      type: String,
      required: false,
    },
    createdAt: {
      type: Date,
    },
  }],
  accountId: {
    type: String,
    required: false,
  },
  authDescriptorId: {
    type: String,
    required: false,
  },
  recipient: {
    type: String,
    required: false,
  },
  userAddress: {
    type: String,
    required: true,
  },
});

export default mongoose.model<Document, Model>(NAME, schema);
export { Document, Model };

