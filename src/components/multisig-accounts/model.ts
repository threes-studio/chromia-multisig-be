import { MultiSigAccount, MultiSigAccountStatus } from '@core/models';
import { CustomMongooseDocument } from '@utils/mongoose';
import mongoose, { Model as MongooseModel, Schema } from 'mongoose';

import { NAME } from './constants';

type Document = CustomMongooseDocument & MultiSigAccount;
type Model = MongooseModel<Document>;

const schema = new Schema<MultiSigAccount>({
  name: {
    type: String,
  },
  pubKey: {
    type: String,
    required: false,
  },
  privKey: {
    type: String,
    required: false,
  },
  accountId: {
    type: String,
    required: false,
  },
  mainDescriptor: {
    type: Schema.Types.Mixed,
  },
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
  signaturesRequired: {
    type: Number,
    required: false,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  pendingTx: [{
    type: Schema.Types.Mixed,
  }],
  status: {
    type: String,
    default: MultiSigAccountStatus.Pending,
    enum: Object.values(MultiSigAccountStatus),
  },
  userAddress: {
    type: String,
    required: true,
  },
});


export default mongoose.model<Document, Model>(NAME, schema);
export { Document, Model };

