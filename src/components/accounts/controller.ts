import { User } from '@core/models';
import { HttpError } from '@core/utils/error';
import { ListQuery, Query, parseQuery } from '@core/utils/express';
import { Request as ExpressRequest, NextFunction, Response } from 'express';
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, NOT_FOUND } from 'http-status-codes';

// import { NAME } from './constants';
import AccountRepository from '../accounts/repository';
import Repository from './repository';

const NAME = 'userDetail';

type Request = ExpressRequest & {
  readonly myQuery: ListQuery | Query,
  readonly myBody: any,
  readonly [NAME]: User,
};

const buildFilter = (req) => {
  const { query: defaultQuery } = req.myQuery as ListQuery;

  const {
    isAll = false,
    ...query
  } = defaultQuery;

  const statusFilter = !isAll ? {
    isActive: true,
  } : {};

  return {
    ...query,
    ...statusFilter,
  };
};

const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    
    const objects = await Repository.list(req.myQuery as ListQuery);

    res.send(objects);
  } catch (err) {
    next(new HttpError(INTERNAL_SERVER_ERROR, err));
  }
};

const count = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customQuery = buildFilter(req);

    const count = await Repository.count({
      ...req.myQuery,
      query: customQuery,
    } as ListQuery);

    res.send({ count });
  } catch (err) {
    next(new HttpError(INTERNAL_SERVER_ERROR, err));
  }
};

const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.myBody;
    const isExisted = await Repository.getByEmail(email);
    if (isExisted) {
      next(new HttpError(BAD_REQUEST, 'Email already exists!'));

      return;
    }

    // * Create account
    const user = await Repository.create(req.myBody);
    await AccountRepository.create({
      user: user.id,
      credentials: {
        email,
        password,
      },
    });

    res.send(user);
  } catch (err) {
    next(new HttpError(INTERNAL_SERVER_ERROR, err));
  }
};

const getById = async (req: Request, _: Response, next: NextFunction) => {
  if (!req.params.id) {
    next(new HttpError(BAD_REQUEST, 'Invalid resource Id'));

    return;
  }

  try {
    const object = await Repository.get(req.params.id, parseQuery(req.query));

    if (!object) {
      next(new HttpError(NOT_FOUND, 'User not found'));

      return;
    }

    // tslint:disable-next-line:no-object-mutation
    Object.assign(req, { [NAME]: object });

    next();
  } catch (err) {
    next(new HttpError(INTERNAL_SERVER_ERROR, err));
  }
};

const get = (req: Request, res: Response) => {
  res.send(req[NAME]);
};

const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { password } = req.myBody;
    const object = await Repository.update({
      ...req.myBody,
      id: req[NAME].id,
    });

    // * Update password
    if (password) {
      const account = await AccountRepository.findOne({
        user: req[NAME].id,
      });
      await AccountRepository.changePassword(account.id, password);
    }

    res.send(object);
  } catch (err) {
    next(new HttpError(INTERNAL_SERVER_ERROR, err));
  }
};

const del = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // * Deleting account
    await AccountRepository.deleteByUserId(req[NAME].id);
    // * Deleting user
    const object = await Repository.delete(req[NAME].id);

    res.send(object);
  } catch (err) {
    next(new HttpError(INTERNAL_SERVER_ERROR, err));
  }
};

export {
  count, create, del, get, getById, list, update
};

