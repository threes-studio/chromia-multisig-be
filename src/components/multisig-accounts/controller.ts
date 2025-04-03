import {
  AuthType,
} from '@chromia/ft4';
import { MultiSigAccount, MultiSigAccountStatus, TransactionLogAction, TransactionType, User } from '@core/models';
import { HttpError } from '@utils/error';
import { ListQuery, parseQuery } from '@utils/express';
import { Request as ExpressRequest, NextFunction, Response } from 'express';
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, NOT_FOUND } from 'http-status-codes';

import {
  getAccountIdFromPublicKeyPair,
  getListTokensBalanceOf,
  getPendingTransfer,
  mockAdminTransferAsset,
  mockAdminTransferFee,
  parseObjectBuffers, queryAuthDescriptor,
  updateMultiSigAuthDescriptorTx
} from '@core/utils/chromia';
import TransactionRepository from '../transactions/repository';
import { NAME } from './constants';
import Repository from './repository';
import { checkIfSignerChanges } from './utils';

type Request = ExpressRequest & {
  readonly myQuery: ListQuery,
  readonly myBody: any,
  readonly [NAME]: MultiSigAccount,
  readonly user: User;
};

const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query: defaultQuery, page, limit = 25 } = req.myQuery;
    const { updatedAt, dateModify, ...restQuery } = defaultQuery;

    const query = { ...restQuery };
    const userAddress = query['signers.pubKey'];
    if (!userAddress) {
      return next(new HttpError(BAD_REQUEST, 'User address is required'));
    }

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
    const { signers, signaturesRequired, userAddress } = req.myBody;

    const uniqueSigners = Array.from(new Set(signers.map(s => s.pubKey)));
    if (uniqueSigners.length < 2) {
      return next(new HttpError(BAD_REQUEST, 'Invalid number of signatures required or duplicate signers found'));
    }

    const signerPairExists = await Repository.findOne({
      signers: {
      $all: signers.map(s => ({
        $elemMatch: {
        pubKey: s.pubKey,
        },
      })),
      },
    });

    if (signerPairExists) {
      return next(new HttpError(BAD_REQUEST, 'Signer pair already exists'));
    }

    if (!signers.map(s => s.pubKey).includes(userAddress)) {
      return next(new HttpError(BAD_REQUEST, 'User must be part of the signers'));
    }

    const accountId = await getAccountIdFromPublicKeyPair(signers.map(s => s.pubKey), signaturesRequired);
    const payload: MultiSigAccount = {
      ...req.myBody,
      accountId,
    };

    const object = await Repository.create(payload);
    res.send(object);
  } catch (err) {
    next(new HttpError(INTERNAL_SERVER_ERROR, err));
  }
};


const mockTransferFee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accountId } = req.body;
    if (!accountId) {
      return next(new HttpError(BAD_REQUEST, 'Invalid account Id'));
    }

    await mockAdminTransferFee(accountId);
    res.send({
      message: 'OK',
    });
  } catch (err) {
    next(new HttpError(INTERNAL_SERVER_ERROR, err));
  }
};

const mockTransferAsset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accountId } = req.body;
    if (!accountId) {
      return next(new HttpError(BAD_REQUEST, 'Invalid account Id'));
    }
    await mockAdminTransferAsset(accountId);
    res.send({
      message: 'OK',
    });
  } catch (err) {
    next(new HttpError(INTERNAL_SERVER_ERROR, err));
  }
};

const transferFee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pendingTxs: any = await getPendingTransfer(Buffer.from(req[NAME].accountId, 'hex'));
    if (!pendingTxs.length) {
      return next(new HttpError(BAD_REQUEST, 'No pending transfer found'));
    }

    await Repository.update({
      id: req[NAME].id,
      status: MultiSigAccountStatus.TransferFee,
      pendingTx: pendingTxs,
    });

    res.send({
      message: 'OK',
    });
  } catch (err) {
    next(new HttpError(INTERNAL_SERVER_ERROR, err));
  }
};

const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tx, signature, userAddress } = req.myBody;
    if (req[NAME].status !== MultiSigAccountStatus.TransferFee) {
      return next(new HttpError(BAD_REQUEST, 'Invalid account status'));
    }

    const signer = req[NAME].signers.find(s => s.pubKey === userAddress);
    if (!signer) {
      return next(new HttpError(BAD_REQUEST, 'User must be part of the signers'));
    }    

    await Repository.update({
      id: req[NAME].id,
      status: MultiSigAccountStatus.Registering,
    });

    const transaction = await TransactionRepository.create({
      type: TransactionType.Register,
      multiSigAccount: req[NAME].id,
      signers: req[NAME].signers,
      signaturesRequired: req[NAME].signers.length,
      tx,
      userAddress,
      signatures: [{
        pubKey: signer.pubKey,
        createdAt: new Date(),
        signature,
      }],
      logs: [{
        action: TransactionLogAction.Created,
        pubKey: signer.pubKey,
        signerName: signer.name,
        createdAt: new Date(),
      },{
        action: TransactionLogAction.Signed,
        pubKey: signer.pubKey,
        signerName: signer.name,
        createdAt: new Date(),
      }],
    });

    res.send({
      message: 'OK',
      transactionId: transaction.id,
    });
  } catch (err) {
    next(new HttpError(INTERNAL_SERVER_ERROR, err));
  }
};

const updateAuthDescriptor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { signaturesRequired, signers } = req.myBody;
    const mainAuthDescriptor: any = await queryAuthDescriptor(req[NAME].accountId);
    const allSigners: {
      pubKey: string;
      name: string
    }[] = [
      ...req[NAME].signers,
      ...signers.filter(signer => !req[NAME].signers.some(existing => existing.pubKey === signer.pubKey)),
    ];

    const newAuthDescriptor = {
      authType: AuthType.MultiSig,
      args: {
        flags: ["A", "T"],
        signaturesRequired: signaturesRequired,
        signers: signers.map(s => s.pubKey),
      },
      rules: null,
    };

    const { tx } = await updateMultiSigAuthDescriptorTx(
      req[NAME].accountId,
      mainAuthDescriptor.id,
      newAuthDescriptor,
      allSigners.map(s => s.pubKey),
    );

    const transaction = await TransactionRepository.create({
      multiSigAccount: req[NAME].id,
      signers: allSigners as any,
      signaturesRequired: allSigners.length,
      type: TransactionType.UpdateDescriptor,
      tx,
    });

    res.send({
      message: 'OK',
      transactionId: transaction.id,
    });
  } catch (err) {
    next(new HttpError(INTERNAL_SERVER_ERROR, err));
  }
};

const getById = async (req: Request, _: Response, next: NextFunction) => {
  if (!req.params.id) {
    return next(new HttpError(BAD_REQUEST, 'Invalid resource Id'));
  }

  try {
    let object = await Repository.get(req.params.id, parseQuery(req.query));
    if (!object) {
      next(new HttpError(NOT_FOUND, 'MultiSigAccount not found'));

      return;
    }

    try {
      const mainAuthDescriptor: any = await queryAuthDescriptor(object.accountId);
      if (mainAuthDescriptor && Object.keys(mainAuthDescriptor).length) {
        if (object.status === MultiSigAccountStatus.Created) {
          object = await Repository.update({
            id: object.id,
            mainDescriptor: parseObjectBuffers(mainAuthDescriptor),
          });
        }
      }
    } catch (err) {
      console.log('Error updating multisig account', err);
    }

    // tslint:disable-next-line:no-object-mutation
    Object.assign(req, { [NAME]: object });

    next();
  } catch (err) {
    next(new HttpError(INTERNAL_SERVER_ERROR, err));
  }
};

const get = async (req: Request, res: Response) => {  
  res.send(req[NAME]);
};

const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req[NAME].status !== MultiSigAccountStatus.Created) {
      return next(new HttpError(BAD_REQUEST, 'Invalid account status'));
    }

    const { name, signaturesRequired, signers, tx, signature, userAddress } = req.myBody;
    const uniqueSigners = Array.from(new Set(signers.map(s => s.pubKey)));
    if (uniqueSigners.length < 2) {
      return next(new HttpError(BAD_REQUEST, 'Invalid number of signatures required or duplicate signers found'));
    }

    const signer = req[NAME].signers.find(s => s.pubKey === userAddress);
    if (!signer) {
      return next(new HttpError(BAD_REQUEST, 'User must be part of the signers'));
    }

    if (!checkIfSignerChanges(req[NAME], req.myBody)) {
      await Repository.update({
        id: req[NAME].id,
        signers,
        name,
      });

      res.send({
        message: 'OK',
      });
      return;
    }
    
    const allSigners: {
      pubKey: string;
      name: string
    }[] = [
      ...req[NAME].signers,
      ...signers.filter(signer => !req[NAME].signers.some(existing => existing.pubKey === signer.pubKey)),
    ];

    const transaction = await TransactionRepository.create({
      userAddress,
      multiSigAccount: req[NAME].id,
      accountId: req[NAME].accountId,
      authDescriptorId: req[NAME]?.mainDescriptor?.id,
      signers: allSigners as any,
      signaturesRequired: allSigners.length,
      type: TransactionType.UpdateDescriptor,
      tx,
      signatures: [{
        pubKey: signer.pubKey,
        createdAt: new Date(),
        signature,
      }],
      logs: [{
        action: TransactionLogAction.Created,
        pubKey: signer.pubKey,
        signerName: signer.name,
        createdAt: new Date(),
      }, {
        action: TransactionLogAction.Signed,
        pubKey: signer.pubKey,
        signerName: signer.name,
        createdAt: new Date(),
      }],
      signersToUpdate: signers,
      signaturesRequiredToUpdate: signaturesRequired,
    });

    res.send({
      message: 'OK',
      transactionId: transaction.id,
    });
  } catch (err) {
    next(new HttpError(INTERNAL_SERVER_ERROR, err));
  }
};

const listAssets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await getListTokensBalanceOf(req[NAME].accountId);

    res.send(result);
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
  count,
  create,
  del,
  get,
  getById,
  list,
  listAssets,
  mockTransferAsset,
  mockTransferFee,
  register,
  transferFee,
  update,
  updateAuthDescriptor
};

