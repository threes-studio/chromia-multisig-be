import { MultiSigAccountStatus, Transaction, TransactionLogAction, TransactionStatus, TransactionType, User } from '@core/models';
import {
  parseObjectBuffers,
  queryAuthDescriptor,
  sendRegisterAccountTx,
  sendTransferAssetTx,
  sendUpdateAuthDescriptorAccountTx,
} from '@utils/chromia';
import { HttpError } from '@utils/error';
import { ListQuery, parseQuery } from '@utils/express';
import { Request as ExpressRequest, NextFunction, Response } from 'express';
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, NOT_FOUND } from 'http-status-codes';

import MultiSigAccountReposity from '../multisig-accounts/repository';
import { NAME } from './constants';
import Repository from './repository';
import { updateTransactionLogs } from './utils';

type Request = ExpressRequest & {
  readonly myQuery: ListQuery,
  readonly myBody: any,
  readonly [NAME]: Transaction,
  readonly user: User,
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
    const { multiSigAccount: multiSigAccountId, signature, tx, userAddress,  } = req.myBody;
    const multiSigAccount= await MultiSigAccountReposity.get(multiSigAccountId);
    if (!multiSigAccount) {
      return next(new HttpError(BAD_REQUEST, 'MultiSigAccount not found'));
    }

    if (!multiSigAccount.signers.map(s => s.pubKey).includes(userAddress)) {
      return next(new HttpError(BAD_REQUEST, 'User is not a signer of the MultiSigAccount'));
    }

    const signer = multiSigAccount.signers.find(signer => signer.pubKey === userAddress);
    const signatures = [{
      pubKey: signer.pubKey,
      createdAt: new Date(),
      signature,
    }];
    const status = signatures.length >= multiSigAccount.signaturesRequired ? TransactionStatus.Ready : TransactionStatus.Pending;
    const object = await Repository.create({
      ...req.myBody,
      tx,
      type: TransactionType.TransferFund,
      status,
      signers: multiSigAccount.signers,
      signaturesRequired: multiSigAccount.signaturesRequired,
      signatures,
      logs: [{
        action: TransactionLogAction.Created,
        signerName: signer.name,
        pubKey: signer.pubKey,
        createdAt: new Date(),
      }, {
        action: TransactionLogAction.Signed,
        signerName: signer.name,
        pubKey: signer.pubKey,
        createdAt: new Date(),
      }],
      accountId: multiSigAccount.accountId,
      authDescriptorId: multiSigAccount.mainDescriptor?.id,
    });

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
      next(new HttpError(NOT_FOUND, 'Transaction not found'));
      return;
    }
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

const sign = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { signature, userAddress } = req.myBody;
    const multiSigAccount = await MultiSigAccountReposity.get(req[NAME].multiSigAccount as string);
    if (!multiSigAccount?.mainDescriptor?.id && req[NAME].type !== TransactionType.Register) {
      return next(new HttpError(BAD_REQUEST, 'MultiSigAccount mainDescriptor not found'));
    }

    const allSigners = multiSigAccount.signers.concat(req[NAME].signersToUpdate || []);
    if (!allSigners.some(signer => signer.pubKey === userAddress)) {
      return next(new HttpError(BAD_REQUEST, 'Public key does not belong to any signer of the MultiSigAccount'));
    }

    const signatures = req[NAME].signatures;
    const status = signatures.length + 1 >= req[NAME].signaturesRequired ? TransactionStatus.Ready : TransactionStatus.Pending;
    const signerName = allSigners.find(signer => signer.pubKey === userAddress)?.name;

    const sig = {
      pubKey: userAddress,
      createdAt: new Date(),
      signature, 
    };

    const existingSignatureIndex = signatures.findIndex(
      (s) => s.pubKey === sig.pubKey
    );

    if (existingSignatureIndex !== -1) {
      signatures[existingSignatureIndex] = sig;
    } else {
      signatures.push(sig);
    }

    await Repository.update({
      id: req[NAME].id,
      status,
      signatures,
      logs: updateTransactionLogs(
        req[NAME].logs,
        userAddress,
        signerName,
        TransactionLogAction.Signed,
      ),
    });

    res.send({
      message: 'OK',
    });
  } catch (err) {
    next(new HttpError(INTERNAL_SERVER_ERROR, err));
  }
};

const execute = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userAddress } = req.myBody;

    if (req[NAME].status !== TransactionStatus.Ready) {
      return next(new HttpError(BAD_REQUEST, 'Transaction is not ready to be executed'));
    };

    const allSigners = req[NAME].signers.concat(req[NAME].signersToUpdate || []);
    if (!allSigners.some(signer => signer.pubKey === userAddress)) {
      return next(new HttpError(BAD_REQUEST, 'Public key does not belong to any signers'));
    }

    const signer = allSigners.find(signer => signer.pubKey === userAddress);

    const multiSigAccount = await MultiSigAccountReposity.get(req[NAME].multiSigAccount as string);
    let receipt
    if (req[NAME].type === TransactionType.Register)  {
      receipt = await sendRegisterAccountTx(
        req[NAME].tx,
        req[NAME].signatures.map(s => s.pubKey),
        req[NAME].signatures.map(s => s.signature) as any,
      );
    }
  
    if (req[NAME].type === TransactionType.TransferFund) {
      const signers = multiSigAccount.signers.map(s => s.pubKey);
      const signatures = signers.map(signerPubKey => {
        const foundSigner = req[NAME].signatures.find(sig => sig.pubKey === signerPubKey);
        if (foundSigner) {
          return foundSigner.signature;
        }
        return null;
      })

      receipt = await sendTransferAssetTx(
        req[NAME].tx,
        signatures as any,
        multiSigAccount.accountId,
      );
    }

    if (req[NAME].type === TransactionType.UpdateDescriptor) {
      const signaturesToUpdate = req[NAME].signersToUpdate.map(s => s.pubKey);
      const signatures = req[NAME].signatures.sort((a, b) => {
        return signaturesToUpdate.indexOf(a.pubKey) - signaturesToUpdate.indexOf(b.pubKey);
      });

      receipt = await sendUpdateAuthDescriptorAccountTx(
        req[NAME].tx,
        signatures.map(s => s.pubKey),
        signatures.map(s => s.signature) as any,
        Buffer.from(multiSigAccount.accountId, 'hex'),
        Buffer.from(multiSigAccount?.mainDescriptor.id, 'hex'),
      );
    }

    if (receipt.status === 'confirmed') {
      await Repository.update({
        id: req[NAME].id,
        status: TransactionStatus.Completed,
        txRid: receipt.transactionRid.toString('hex'),
        logs: updateTransactionLogs(
          req[NAME].logs,
          signer.pubKey,
          signer.name,
          TransactionLogAction.Executed
        ),
      });

      if (req[NAME].type === TransactionType.Register) {
        // * Get main auth descriptor
        const mainAuthDescriptor: any = await queryAuthDescriptor(multiSigAccount.accountId);
        if (mainAuthDescriptor && Object.keys(mainAuthDescriptor).length) {
          await MultiSigAccountReposity.update({
            id: multiSigAccount.id,
            mainDescriptor: parseObjectBuffers(mainAuthDescriptor),
            status: MultiSigAccountStatus.Created,
          });
        } else {
          await MultiSigAccountReposity.update({
            id: multiSigAccount.id,
            status: MultiSigAccountStatus.Created,
          });
        }
      }

      if (req[NAME].type === TransactionType.UpdateDescriptor) {
        const mainAuthDescriptor: any = await queryAuthDescriptor(multiSigAccount.accountId);
        await MultiSigAccountReposity.update({
          id: multiSigAccount.id,
          mainDescriptor: parseObjectBuffers(mainAuthDescriptor),
          signers: req[NAME].signersToUpdate,
          signaturesRequired: req[NAME].signaturesRequiredToUpdate,
        });
      }
    } else {
      await Repository.update({
        id: req[NAME].id,
        txStatus: receipt.status,
        txRid: receipt.transactionRid.toString('hex'),
      });
    }

    res.send({
      status: receipt.status,
      txRid: receipt?.transactionRid?.toString('hex'),
    });
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
  execute,
  get,
  getById,
  list,
  sign,
  update
};

