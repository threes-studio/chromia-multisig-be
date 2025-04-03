import * as yup from 'yup';

import { validateBody } from '@utils/express';
import { USER_ROLES } from './constants';

const createSchema = {
  displayName: yup.string().required(),
  email: yup.string().email().required(),
  role: yup.string().oneOf(USER_ROLES),
  phone: yup.string(),
  password: yup.string().required(),
  isActive: yup.boolean(),
};

const validateCreate = validateBody(
  (v: any) => yup.object(createSchema).noUnknown().validateSync(v),
);

const updateSchema = {
  displayName: yup.string().required(),
  role: yup.string().oneOf(USER_ROLES),
  phone: yup.string(),
  password: yup.string(),
  isActive: yup.boolean(),
};

const validateUpdate = validateBody(
  (v: any) => yup.object(updateSchema).noUnknown().validateSync(v),
);

export { validateCreate, validateUpdate };
