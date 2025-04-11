import { Blockchain } from '@core/models';
import { CustomMongooseDocument } from '@utils/mongoose';
import mongoose, { Model as MongooseModel, Schema } from 'mongoose';
import { NAME } from './constants';

type Document = CustomMongooseDocument & Blockchain;
type Model = MongooseModel<Document>;

const schema = new Schema({
  name: {
    type: String,
    trim: true,
    required: true,
  },
  rid: {
    type: String,
    trim: true,
  },
  network: {
    type: String,
    trim: true,
  },
  feeId: {
    type: String,
    trim: true,
  },
  feeValue: {
    type: Number,
    default: 1,
  },
  feeSymbol: {
    type: String,
    trim: true,
  },
  feeDecimals: {
    type: Number,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
});

export default mongoose.model<Document, Model>(NAME, schema);
export { Document, Model };
