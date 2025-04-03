import { User, UserRole } from '@core/models';
import { CustomMongooseDocument } from '@utils/mongoose';
import mongoose, { Model as MongooseModel, Schema } from 'mongoose';

import { NAME, USER_ROLES } from './constants';

type Document = CustomMongooseDocument & User;
type Model = MongooseModel<Document>;

const schema = new Schema({
  displayName: {
    type: String,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
    index: true,
  },
  email: {
    type: String,
    trim: true,
    index: true,
    unique: true,
  },
  role: {
    type: String,
    enum: USER_ROLES,
    default: UserRole.Default,
  },
  isProtected: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastSignedIn: Date,
  imageUrl: {
    type: String,
    trim: true,
    default: '',
  },
  ip: {
    type: String,
    trim: true,
  },
  pubKey: {
    type: String,
    trim: true,
    index: true,
  },
});

export default mongoose.model<Document, Model>(NAME, schema);
export { Document, Model };

