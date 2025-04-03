import { validateBody } from '@utils/express';
import { Request as ExpressRequest, NextFunction, Response } from 'express';
import { FORBIDDEN, INTERNAL_SERVER_ERROR, UNAUTHORIZED } from 'http-status-codes';
import * as yup from 'yup';

import { User } from '@core/models';
import { HttpError } from '@utils/error';
import passport from '@utils/passport';

type Request = ExpressRequest & {
  // tslint:disable-next-line:readonly-keyword
  user: User;
};

const signUpLocalSchema = {
  email: yup.string().email().required().trim().lowercase(),
  password: yup.string().trim().required().min(6),
  displayName: yup.string().required().min(3),
  phone: yup.string(),
};
const validateSignUpLocal = validateBody(
  (v: any) => yup.object(signUpLocalSchema).noUnknown().validateSync(v),
);

const signInLocalSchema = {
  email: yup.string().required().trim().lowercase(),
  password: yup.string().required().min(6),
};
const validateSignInLocal = validateBody(
  (v: any) => yup.object(signInLocalSchema).noUnknown().validateSync(v),
);

const signInWalletSchema = {
  walletAddress: yup.string()
    .required()
    .trim()
    .matches(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format')
    .transform((value) => value.toLowerCase()),
  signature: yup.string().required().min(6),
};
const validateSignInWallet = validateBody(
  (v: any) => yup.object(signInWalletSchema).noUnknown().validateSync(v),
);

const requestResetPasswordSchema = {
  email: yup.string().email().required().trim().lowercase(),
};
const validateRequestResetPassword = validateBody(
  (v: any) => yup.object(requestResetPasswordSchema).noUnknown().validateSync(v),
);

const createPasswordSchema = {
  email: yup.string().email().required().trim().lowercase(),
  password: yup.string().trim().required().min(6),
  token: yup.string().trim().required(),
};

const validateCreatePassword = validateBody((v: any) => {
  return yup.object(createPasswordSchema).noUnknown().validateSync(v);
});

const updatePasswordSchema = {
  oldPassword: yup.string().trim().required().min(6),
  newPassword: yup.string().trim().required().min(6),
};

const validateUpdatePassword = validateBody((v: any) => {
  return yup.object(updatePasswordSchema).noUnknown().validateSync(v);
});

const updateProfileSchema = {
  phone: yup.string().required(),
  signature: yup.string(),
  imageBase64: yup.string(),
};
const validateUpdateProfile = validateBody(
  (v: any) => yup.object(updateProfileSchema).noUnknown().validateSync(v),
);

const authenticate = passport.authenticate('jwt', {
  session: false,
});

const hasAuthorization = (requiredRoles: readonly string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      return passport.authenticate('jwt', {
        session: false,
      }, (err, user, _) => {
        if (err) {
          next(new HttpError(INTERNAL_SERVER_ERROR, err));
          return;
        }

        if (!user) {
          next(new HttpError(UNAUTHORIZED, 'Unauthorized'));

          return;
        }
        // Forward user information to the next middleware
        const role = user.role;

        if (!requiredRoles.includes(role)) {
          next(new HttpError(FORBIDDEN, 'Forbidden'));
          return;
        }

        req.user = user;

        next();
      })(req, res, next);
    } catch (err) {
      next(new HttpError(INTERNAL_SERVER_ERROR, err));
    }
  };
};

export {
  authenticate,
  hasAuthorization,
  validateCreatePassword,
  validateRequestResetPassword,
  validateSignInLocal,
  validateSignInWallet,
  validateSignUpLocal,
  validateUpdatePassword,
  validateUpdateProfile
};

