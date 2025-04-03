import { validateBody } from '@utils/express';
import * as yup from 'yup';
import { TRANSACTION_TYPES } from './constants';

const baseSchema = {
  type: yup.string().oneOf(TRANSACTION_TYPES).required(),
  recipient: yup.string().required(),
  amount: yup.number().required(),
  assetId: yup.string().required(),
  assetSymbol: yup.string().required(),
  multiSigAccount: yup.string().required(),
  userAddress: yup.string().matches(/^0x[a-fA-F0-9]{40}$/, 'User address must be a valid EVM address').required(),
  tx: yup.string().required('The "tx" field is required.'),
  signature: yup.object({
    r: yup.string().required('The "r" field is required.'),
    s: yup.string().required('The "s" field is required.'),
    v: yup.number().required('The "v" field is required.'),
  }).required('The "signature" field is required.'),
  note: yup.string(),
};
const validateCreate = validateBody(
  (v: any) => yup.object(baseSchema).noUnknown().validateSync(v),
);

const validateUpdate = validateBody(
  (v: any) => yup.object(baseSchema).noUnknown().validateSync(v),
);

const signSchema = {
  userAddress: yup.string().matches(/^0x[a-fA-F0-9]{40}$/, 'User address must be a valid EVM address').required(),
  signature: yup.object({
    r: yup.string().required('The "r" field is required.'),
    s: yup.string().required('The "s" field is required.'),
    v: yup.number().required('The "v" field is required.'),
  }).required('The "signature" field is required.'),
};
const validateSign = validateBody(
  (v: any) => yup.object(signSchema).noUnknown().validateSync(v),
);

const executeSchema = {
  userAddress: yup.string().matches(/^0x[a-fA-F0-9]{40}$/, 'User address must be a valid EVM address').required(),
};
const validateExecute = validateBody(
  (v: any) => yup.object(executeSchema).noUnknown().validateSync(v),
);

export { validateCreate, validateExecute, validateSign, validateUpdate };

