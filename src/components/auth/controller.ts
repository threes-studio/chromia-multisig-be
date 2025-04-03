import { ethers } from 'ethers';
import { Request as ExpressRequest, NextFunction, Response } from 'express';

import { AccountProvider, User, UserRole } from '@core/models';
import { HttpError } from '@utils/error';
import { ListQuery, Query } from '@utils/express';
import {
  BAD_REQUEST,
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
  NO_CONTENT,
  UNAUTHORIZED
} from 'http-status-codes';
import jwt from 'jsonwebtoken';

import { LOCAL_USERNAME_PATH } from '../accounts/constants';
import AccountRepository from '../accounts/repository';
import UserRepository from '../users/repository';

type Request = ExpressRequest & {
  readonly myQuery: ListQuery | Query,
  readonly myBody: any;
  readonly login: any;
  readonly logout: any;
  readonly user: User;
};

const getJwtToken = (user) => {
  const { id, email, role, displayName, imageUrl, position, extraPosition } = user;

  return jwt.sign({
    id,
    email,
    role,
    displayName,
    imageUrl,
    position,
    extraPosition,
  }, process.env.JWT_TOKEN_SECRET, { expiresIn: process.env.JSON_EXPIRED_TIME });
};

const signInLocal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.myBody;

    const account = await AccountRepository.authenticateLocal(email, password);

    if (!account) {
      next(new HttpError(BAD_REQUEST, 'Invalid email or password'));
      return;
    }

    const user = await UserRepository.get(`${account.user}`);
    if (!user) {
      // * Update login time
      next(new HttpError(BAD_REQUEST, 'Invalid email or password'));
      return;
    }

    if (!user.isActive) {
      next(new HttpError(BAD_REQUEST, 'Your account has been locked'));
      return;
    }

    // * OK
    UserRepository.updateLastLoginTimestamp(user.id);

    const token = getJwtToken(user);

    res.json({
      ...user,
      token,
    });
  } catch (err) {
    next(new HttpError(INTERNAL_SERVER_ERROR, err));
  }
};

const validateSignature = (walletAddress: string, signature: string): boolean => {
  try {
    const message = process.env.WALLET_SIGN_MESSAGE || 'Sign ColorPool MultiSig';
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === walletAddress.toLowerCase();
  } catch (error) {
    return false;
  }
};

const signInWallet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { pubKey, signature } = req.myBody;
    // Validate signature
    if (!validateSignature(pubKey, signature)) {
      next(new HttpError(BAD_REQUEST, 'Invalid signature'));
      return;
    }

    // Check if signature already exists
    const existingAccount = await AccountRepository.findOne({
      'credentials.signature': signature,
    });

    if (existingAccount) {
      next(new HttpError(BAD_REQUEST, 'Signature already used'));
      return;
    }

    // Find user by wallet address
    const account = await AccountRepository.findOne({
      credentials: {
        pubKey: pubKey.toLowerCase(),
      },
      provider: AccountProvider.Wallet,
    });

    if (!account) {
      // If account not found, create new account
      const user = await UserRepository.create({
        displayName: `Wallet ${pubKey.slice(-4)}`,
        pubKey: pubKey.toLowerCase(),
        isActive: true,
        role: UserRole.User,
      });

      await AccountRepository.create({
        user: user.id,
        provider: AccountProvider.Wallet,
        credentials: {
          pubKey: pubKey.toLowerCase(),
          signature: signature,
        },
      });

      const token = getJwtToken(user);

      res.json({
        ...user,
        token,
      });
      return;
    }

    // Update signature for existing account
    await AccountRepository.update({
      id: account.id,
      credentials: {
        ...account.credentials,
        signature: signature,
      },
    });

    const user = await UserRepository.get(`${account.user}`);
    if (!user) {
      next(new HttpError(BAD_REQUEST, 'User not found'));
      return;
    }

    if (!user.isActive) {
      next(new HttpError(BAD_REQUEST, 'Your account has been locked'));
      return;
    }

    // Update last login time
    UserRepository.updateLastLoginTimestamp(user.id);

    const token = getJwtToken(user);

    res.json({
      ...user,
      token,
    });
  } catch (err) {
    next(new HttpError(INTERNAL_SERVER_ERROR, err));
  }
};

const signOut = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    next(new HttpError(UNAUTHORIZED, 'Unauthorized'));

    return;
  }

  req.logout();

  res.send({
    code: NO_CONTENT,
    message: 'No Content',
  });
};

const createPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, token } = req.myBody;

    const user = await UserRepository.getByEmail(email);

    if (!user) {
      next(new HttpError(NOT_FOUND, 'User not found'));

      return;
    }

    const account = await AccountRepository.findOne({
      [LOCAL_USERNAME_PATH]: email,
      provider: AccountProvider.Local,
    });

    if (!account) {
      next(new HttpError(NOT_FOUND, 'Account not found'));

      return;
    }

    if (token !== account.credentials.passwordToken) {
      next(new HttpError(BAD_REQUEST, 'Invalid token'));

      return;
    }

    if (new Date(account.credentials.passwordTokenExpires) < new Date()) {
      next(new HttpError(BAD_REQUEST, 'Token expired'));

      return;
    }

    await AccountRepository.changePassword(account.id, password);

    res.send(user);
  } catch (err) {
    next(new HttpError(INTERNAL_SERVER_ERROR, err));
  }
};

const requestResetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.myBody;

    const user = await UserRepository.getByEmail(email);

    if (!user) {
      next(new HttpError(NOT_FOUND, 'Email not found'));

      return;
    }

    // tslint:disable-next-line:no-let
    let account = await AccountRepository.findOne({
      [LOCAL_USERNAME_PATH]: email,
      provider: AccountProvider.Local,
    });

    if (!account) {
      account = await AccountRepository.create({
        user: user.id,
        credentials: {
          email,
          password: Math.random().toString(36).substring(6),
        },
        provider: AccountProvider.Local,
      });
    }

    // * Generate token for account
    account = await AccountRepository.generatePasswordToken(account.id);

    res.send({
      message: 'A password recovery link has been sent to your email inbox',
    });
  } catch (err) {
    if (err.code) {
      next(new HttpError(err.code, err.message));

      return;
    }
    next(new HttpError(INTERNAL_SERVER_ERROR, err));
  }
};

const updatePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { oldPassword, newPassword } = req.myBody;

    const account = await AccountRepository.authenticateLocal(req.user.email, oldPassword);
    if (!account) {
      next(new HttpError(BAD_REQUEST, 'Old password is invalid'));

      return;
    }

    // * update new password
    await AccountRepository.changePassword(account.id, newPassword);

    res.send(req.user);
  } catch (err) {
    if (err.code) {
      next(new HttpError(err.code, err.message));

      return;
    }
    next(new HttpError(INTERNAL_SERVER_ERROR, err));
  }
};

const getLoggedUser = async (req: Request, res: Response, _: NextFunction) => {
  res.send(req.user);
};

const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await UserRepository.update({
      ...req.myBody,
      id: req.user.id,
    });

    const token = getJwtToken(user);

    res.send({
      ...user,
      token, // * Refresh token
    });
  } catch (err) {
    next(new HttpError(INTERNAL_SERVER_ERROR, err));
  }
};

export {
  createPassword, getLoggedUser, requestResetPassword, signInLocal,
  signInWallet, signOut, updatePassword, updateProfile
};

