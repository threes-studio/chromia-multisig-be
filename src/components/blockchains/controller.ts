import { Asset } from '@core/models';
import { HttpError } from '@utils/error';
import { ListQuery, parseQuery } from '@utils/express';
import { Request as ExpressRequest, NextFunction, Response } from 'express';
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, NOT_FOUND } from 'http-status-codes';

import { NAME } from './constants';
import Repository from './repository';

type Request = ExpressRequest & {
  readonly myQuery: ListQuery,
  readonly myBody: any,
  readonly [NAME]: Asset,
};

const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query: defaultQuery, page, limit = 25 } = req.myQuery;
    const { updatedAt, dateModify, ...restQuery } = defaultQuery;

    const query = { ...restQuery };

    const skip = page && limit ? (page - 1) * limit : 0;
    const options = { skip, limit };

    const conditions = {
      ...req.myQuery,
      ...options,
      query,
    };
    const [objects, total] = await Promise.all([
      Repository.list(conditions),
      Repository.count(conditions),
    ]);

    res.send({ data: objects, total, pageSize: objects.length });
  } catch (err) {
    next(new HttpError(INTERNAL_SERVER_ERROR, err));
  }
};

const count = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await Repository.count(req.myQuery as ListQuery);

    res.send({ count });
  } catch (err) {
    next(new HttpError(INTERNAL_SERVER_ERROR, err));
  }
};

const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const object = await Repository.create(req.myBody);

    res.send(object);
  } catch (err) {
    next(new HttpError(INTERNAL_SERVER_ERROR, err));
  }
};

const getById = async (req: Request, _: Response, next: NextFunction) => {
  if (!req.params.id) {
    return next(new HttpError(BAD_REQUEST, 'Invalid resource Id'));
  }

  try {
    const object = await Repository.get(req.params.id, parseQuery(req.query));

    if (!object) {
      next(new HttpError(NOT_FOUND, 'Asset not found'));

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
    const object = await Repository.update({
      ...req.myBody,
      id: req[NAME].id,
    });

    res.send(object);
  } catch (err) {
    next(new HttpError(INTERNAL_SERVER_ERROR, err));
  }
};

const del = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const object = await Repository.delete(req[NAME].id);

    res.send(object);
  } catch (err) {
    next(new HttpError(INTERNAL_SERVER_ERROR, err));
  }
};

export {
  count, create, del, get, getById, list, update
};

