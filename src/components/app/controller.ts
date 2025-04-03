import MultiSigAccountRepository from '@components/multisig-accounts/repository';
import TransactionRepository from '@components/transactions/repository';
import { Test } from '@core/models';
import { HttpError } from '@utils/error';
import { ListQuery, Query } from '@utils/express';
import { Request as ExpressRequest, NextFunction, Response } from 'express';
import { INTERNAL_SERVER_ERROR } from 'http-status-codes';

import { NAME } from './constants';

type Request = ExpressRequest & {
  readonly myQuery: ListQuery | Query,
  readonly myBody: any,
  readonly [NAME]: Test,
};

const getSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [totalAccounts, uniqueSignersResult, completedTxs, pendingTxs] = await Promise.all([
      MultiSigAccountRepository.count(),
      MultiSigAccountRepository.aggregate([
      { $unwind: "$signers" },
      { $group: { _id: "$signers.pubKey" } },
      { $count: "uniqueSigners" },
      ]),
      TransactionRepository.count({ query: { status: 'completed' }} as unknown as ListQuery),
      TransactionRepository.count({ query: { status: { $ne: 'completed' } } } as unknown as ListQuery),
    ]);
    const uniqueSigners = uniqueSignersResult.length > 0 ? uniqueSignersResult[0].uniqueSigners : 0;

    res.send({
      totalUsers: uniqueSigners,
      totalAccounts,
      completedTxs,
      pendingTxs,
    });
  } catch (err) {
    next(new HttpError(INTERNAL_SERVER_ERROR, err));
  }
};

const healthCheck = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
    });
  } catch (err) {
    next(new HttpError(INTERNAL_SERVER_ERROR, err));
  }
};

export {
  getSummary, healthCheck
};

