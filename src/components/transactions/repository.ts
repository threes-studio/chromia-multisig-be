import {
  DEFAULT_LIST_QUERY,
  DEFAULT_QUERY,
  ListQuery, Query,
} from '@utils/express';
import { Transaction } from '../@core';

import Model, { Document } from './model';

class Repository {
  public static async list(
    listQuery: ListQuery = DEFAULT_LIST_QUERY,
  ): Promise<ReadonlyArray<Transaction>> {
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
  ): Promise<Transaction> {
    const { populate, select } = query;

    const document = await Model.findById(id)
      .populate(populate)
      .select(select)
      .exec();

    return transform(document);
  }

  public static async getByKey(
    key: string,
    query: Query = DEFAULT_QUERY,
  ): Promise<Transaction> {
    const { populate } = query;

    const document = await Model.findOne({
      key,
    })
      .populate(populate)
      .exec();

    return transform(document);
  }

  public static async create(data: Transaction): Promise<Transaction> {
    const document = new Model(data);
    await document.$create();

    return transform(document);
  }

  public static async update({ id, ...data }: any): Promise<Transaction> {
    const document = await Model.findById(id).exec();
    await document.$update(data);

    return transform(document);
  }

  public static async delete(id: string): Promise<Transaction> {
    const document = await Model.findById(id).exec();
    await document.$delete();

    return transform(document);
  }

  // generated dedicated data
  public static async generatedDedicatedData(objects: ReadonlyArray<Transaction>): Promise<void> {
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

const transform = (document: Document): Transaction => {
  return document && document.toJSON();
};

export default Repository;
export { transform };
