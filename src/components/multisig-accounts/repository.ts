import {
  DEFAULT_LIST_QUERY,
  DEFAULT_QUERY,
  ListQuery, Query,
} from '@utils/express';
import { MultiSigAccount } from '../@core';

import Model, { Document } from './model';

class Repository {
  public static async list(
    listQuery: ListQuery = DEFAULT_LIST_QUERY,
  ): Promise<ReadonlyArray<MultiSigAccount>> {
    const { query, populate, sort, skip, limit, select } = listQuery;

    const documents = await Model.find(query)
      .populate(populate)
      .select(select)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();

    return documents.map(transform);
  }

  public static async count(
    listQuery: ListQuery = DEFAULT_LIST_QUERY,
  ): Promise<number> {
    const { query } = listQuery;

    return await Model.countDocuments(query).exec();
  }

  public static async get(
    id: string,
    query: Query = DEFAULT_QUERY,
  ): Promise<MultiSigAccount> {
    const { populate, select } = query;

    const document = await Model.findById(id)
      .populate(populate)
      .select(select)
      .exec();

    return transform(document);
  }

  public static async findOne(
    condition,
  ): Promise<MultiSigAccount> {
    const document = await Model.findOne(condition)
      .exec();

    return transform(document);
  }

  public static async getByKey(
    key: string,
    query: Query = DEFAULT_QUERY,
  ): Promise<MultiSigAccount> {
    const { populate } = query;

    const document = await Model.findOne({
      key,
    })
      .populate(populate)
      .exec();

    return transform(document);
  }

  public static async create(data: MultiSigAccount): Promise<MultiSigAccount> {
    const document = new Model(data);
    await document.$create();

    return transform(document);
  }

  public static async update({ id, ...data }: any): Promise<MultiSigAccount> {
    const document = await Model.findById(id).exec();
    await document.$update(data);

    return transform(document);
  }

  public static async delete(id: string): Promise<MultiSigAccount> {
    const document = await Model.findById(id).exec();
    await document.$delete();

    return transform(document);
  }

  public static async aggregate(
    query: any,
  ): Promise<any> {
    return await Model.aggregate(query).exec();
  }

  // generated dedicated data
  public static async generatedDedicatedData(objects: ReadonlyArray<MultiSigAccount>): Promise<void> {
    for (const object of objects) {
      const { _id } = object;
      const document = await Model.findById(_id).exec();
      if (document) {
        continue;
      }

      await new Model(object).$create();
    }
  }
}

const transform = (document: Document): MultiSigAccount => {
  return document && document.toJSON();
};

export default Repository;
export { transform };
