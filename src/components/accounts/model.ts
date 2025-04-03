import { Account, AccountProvider } from '@core/models';
import { CustomMongooseDocument } from '@utils/mongoose';
import crypto from 'crypto';
import mongoose, { Model as MongooseModel, Schema } from 'mongoose';

import UserModel from '../users/model';

import { NAME, PROVIDERS } from './constants';

type Methods = {
  readonly $isLocal: () => boolean,
  readonly $hashPassword: (password: string) => string,
  readonly $authenticateLocal: (password: string) => boolean,
};
type Document = CustomMongooseDocument & Account & Methods;
type Model = MongooseModel<Document>;

const schema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: UserModel,
    required: true,
  },
  provider: {
    type: AccountProvider,
    enum: PROVIDERS,
    default: AccountProvider.Default,
  },
  credentials: Schema.Types.Mixed,
  lastSignedIn: Date,
});

schema.pre('save', function (next: Function) {
  // tslint:disable-next-line
  const self = (this as any);
  if (self.$isLocal() && self.credentials.password && self.isModified('credentials.password')) {
    this.set(
      'credentials.salt',
      new Buffer(crypto.randomBytes(16).toString('base64'), 'base64').toString('base64'),
    );
    self.set('credentials.password', self.$hashPassword(self.credentials.password));
  }

  next();
});

// tslint:disable-next-line:no-object-mutation
Object.assign(schema.methods, {
  $isLocal() {
    return this.provider === AccountProvider.Local;
  },
  $hashPassword(password: string) {
    if (this.credentials.salt && password) {
      return crypto.pbkdf2Sync(
        Buffer.from(password, 'binary'),
        Buffer.from(this.credentials.salt, 'binary'),
        10000,
        64,
        'sha1',
      ).toString('base64');
    }

    return password;
  },
  $authenticateLocal(password: string) {
    return this.credentials.password === this.$hashPassword(password);
  },
});

export default mongoose.model<Document, Model>(NAME, schema);
export { Document, Model };

