import { validateBody } from '@utils/express';
import * as yup from 'yup';

const baseSchema = {
  name: yup.string().required(),
  userAddress: yup.string().matches(/^0x[a-fA-F0-9]{40}$/, 'User address must be a valid EVM address').required(),
  signers: yup
    .array(
      yup.object({
        name: yup.string().required('Each signer must have a name.'),
        pubKey: yup
          .string()
          .matches(/^0x[a-fA-F0-9]{40}$/, 'Each signer must have a valid EVM address.')
          .required('Each signer must have an EVM address.'),
      })
    )
    .min(2, 'At least one signer is required.')
    .required('The "signers" field is required.'),
  signaturesRequired: yup
    .number()
    .min(1, 'The "signaturesRequired" field must be at least 1.')
    .max(20, 'The "signaturesRequired" field must not exceed 20.')
    .required('The "signaturesRequired" field is required.'),
  network: yup.string().oneOf(['testnet', 'mainnet']).required('The "network" field is required.'),
  blockchainRid: yup.string().required('The "blockchainRid" field is required.'),
};

const validateCreate = validateBody(
  (v: any) => yup.object(baseSchema).noUnknown().validateSync(v),
);

const updateSchema = {
  name: yup.string().required(),
  userAddress: yup.string().matches(/^0x[a-fA-F0-9]{40}$/, 'User address must be a valid EVM address').required(),
  tx: yup.string(),
  signers: yup
    .array(
      yup.object({
        name: yup.string().required('Each signer must have a name.'),
        pubKey: yup
          .string()
          .matches(/^0x[a-fA-F0-9]{40}$/, 'Each signer must have a valid EVM address.')
          .required('Each signer must have an EVM address.'),
      })
    )
    .min(2, 'At least one signer is required.')
    .required('The "signers" field is required.'),
  signaturesRequired: yup
    .number()
    .min(1, 'The "signaturesRequired" field must be at least 1.')
    .max(20, 'The "signaturesRequired" field must not exceed 20.')
    .required('The "signaturesRequired" field is required.'),
  signature: yup.object({
      r: yup.string(),
      s: yup.string(),
      v: yup.number(),
    }),
};

const validateUpdate = validateBody(
  (v: any) => yup.object(updateSchema).noUnknown().validateSync(v),
);

const updateAuthDescriptorSchema = {
  signers: yup
    .array(
      yup.object({
        name: yup.string().required('Each signer must have a name.'),
        pubKey: yup
          .string()
          .matches(/^0[2-3][0-9a-fA-F]{64}$/, 'Each signer must have a valid public key.')
          .required('Each signer must have a public key.'),
      })
    )
    .min(1, 'At least one signer is required.')
    .required('The "signers" field is required.'),
  signaturesRequired: yup
    .number()
    .min(1, 'The "signaturesRequired" field must be at least 1.')
    .max(20, 'The "signaturesRequired" field must not exceed 20.')
    .required('The "signaturesRequired" field is required.'),
};

const validateUpdateAuthDescriptor = validateBody(
  (v: any) => yup.object(updateAuthDescriptorSchema).noUnknown().validateSync(v),
);

const registerSchema = {
  userAddress: yup.string().matches(/^0x[a-fA-F0-9]{40}$/, 'User address must be a valid EVM address').required(),
  tx: yup.string().required('The "tx" field is required.'),
  signature: yup.object({
    r: yup.string().required('The "r" field is required.'),
    s: yup.string().required('The "s" field is required.'),
    v: yup.number().required('The "v" field is required.'),
  }).required('The "signature" field is required.'),
};

const validateRegister = validateBody(
  (v: any) => yup.object(registerSchema).noUnknown().validateSync(v),
);

export { validateCreate, validateRegister, validateUpdate, validateUpdateAuthDescriptor };

