import { CustomMongooseDocument } from '@utils/mongoose';
import mongoose, { Model as MongooseModel, Schema } from 'mongoose';
import { Asset } from '../@core';

import { NAME } from './constants';

type Document = CustomMongooseDocument & Asset;
type Model = MongooseModel<Document>;

const schema = new Schema({
  name: {
    type: String,
    trim: true,
    required: true,
  },
  description: {
    type: String,
    trim: true,
    required: true,
  },
});

export default mongoose.model<Document, Model>(NAME, schema);
export { Document, Model };

