import { Account, AccountProvider } from '@core/models';
import {
  DEFAULT_LIST_QUERY,
  DEFAULT_QUERY,
  ListQuery, Query,
} from '@utils/express';
import Crypto from 'crypto';

import {
  LOCAL_PASSWORD_PATH,
  LOCAL_PASSWORD_TOKEN,
  LOCAL_PASSWORD_TOKEN_EXPIRES,
  LOCAL_USERNAME_PATH,
  PASSWORD_TOKEN_EXPIRY,
  PASSWORD_TOKEN_LENGTH,
} from './constants';
import Model, { Document } from './model';

class Repository {
  public static async list(
    listQuery: ListQuery = DEFAULT_LIST_QUERY,
  ): Promise<ReadonlyArray<Account>> {
    const { query, populate, sort, skip, limit } = listQuery;

    const documents = await Model.find(query)
      .populate(populate)
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
  ): Promise<Account> {
    const { populate } = query;

    const document = await Model.findById(id)
      .populate(populate)
      .exec();

    return transform(document);
  }

  public static async create(data: Account): Promise<Account> {
    const document = new Model(data);
    await document.$create();

    return transform(document);
  }

  public static async findOneOrCreate(data: Account): Promise<Account> {
    // tslint:disable-next-line:no-let
    let document = await Model.findOne({
      user: data.user,
      credentials: {
        email: data.credentials.email,
      },
    }).exec();

    if (document) {
      return transform(document);
    }

    document = new Model(data);

    await document.$create();

    return transform(document);
  }

  public static async update({ id, ...data }: any): Promise<Account> {
    const document = await Model.findById(id).exec();
    await document.$update(data);

    return transform(document);
  }

  public static async delete(id: string): Promise<Account> {
    const document = await Model.findById(id).exec();
    await document.$delete();

    return transform(document);
  }

  public static async deleteByUserId(userId: string): Promise<Account> {
    const document = await Model.findOne({
      id: userId,
    }).exec();
    await document.$delete();

    return transform(document);
  }

  public static async changePassword(id: string, password: string): Promise<Account> {
    const document = await Model.findById(id).exec();

    await document.$update({
      [LOCAL_PASSWORD_PATH]: password,
    });

    return transform(document);
  }

  public static async checkUsernameExists(email: string): Promise<boolean> {
    const count = await Model.countDocuments({
      [LOCAL_USERNAME_PATH]: email,
    }).exec();

    return count > 0;
  }

  public static async updateLastLoginTimestamp(id: string): Promise<Account> {
    const document = await Model.findById(id).exec();
    await document.$update({
      lastSignedIn: new Date(),
    });

    return transform(document);
  }

  public static async getByEmail(
    email: string,
    query: Query = DEFAULT_QUERY,
  ): Promise<Account> {
    const { populate } = query;

    return await Model.findOne({
      [LOCAL_USERNAME_PATH]: email,
    })
      .populate(populate)
      .exec();
  }

  public static async findOne(
    condition: any,
    query: Query = DEFAULT_QUERY,
  ): Promise<Account> {
    const { populate, select = [] } = query;
    return await Model.findOne(condition)
      .populate(populate)
      .select(select)
      .exec();
  }

  public static async generatePasswordToken(id: string): Promise<Account> {
    const [token, document] = await Promise.all([
      generateToken(PASSWORD_TOKEN_LENGTH),
      Model.findById(id).exec(),
    ]);

    return await (document as Document).$update({
      [LOCAL_PASSWORD_TOKEN]: token,
      [LOCAL_PASSWORD_TOKEN_EXPIRES]: Date.now() + PASSWORD_TOKEN_EXPIRY,
    });
  }

  public static async authenticateLocal(email: string, password: string): Promise<Account> {
    const account = await Model.findOne({
      provider: AccountProvider.Local,
      [LOCAL_USERNAME_PATH]: email,
    }).exec();

    if (!account) {
      return;
    }

    // * Normal authentication
    if (account.$authenticateLocal(password)) {
      return account;
    }

    return;
  }

  // generated dedicated data
  public static async generatedDedicatedData(objects: ReadonlyArray<Account>): Promise<void> {
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

const transform = (document: Document): Account => {
  if (document) {
    const { credentials, ...rest } = document.toJSON();

    return {
      ...rest,
      credentials: {
        email: credentials.email,
      },
    };
  }

  return;
};

const generateToken = async (length: number) => {
  return new Promise((resolve, reject) => Crypto.randomBytes(length, (err, buffer) => {
    if (err) {
      reject(err);
    }

    resolve(buffer.toString('hex'));
  }));
};

export default Repository;
export { transform };
